const router = require('express').Router();
const crypto = require('crypto');
const db = require('../db');

// Production device ingestion: POST /api/ingest
// Authenticates the DEVICE (X-Device-Key + device_id), not a user session,
// so solar/GSM field nodes can report without human credentials.
// Payload: { device_id, readings: {water_level, flow_rate, turbidity,
//   temperature, ph, pressure, tds, chlorine, battery, signal},
//   firmware?, source? }
// Responds with cloud-to-device commands queued in device.config
// ({ pending_commands: [...] }), cleared on delivery.
//
// Range validation rejects absurd values with details; threshold breaches
// raise alerts (deduplicated: no repeat of the same open type per node/6h).

const RANGES = {
  water_level: [0, 100, '%'],
  flow_rate: [0, 10000, 'L/min'],
  turbidity: [0, 4000, 'NTU'],
  temperature: [-10, 60, '°C'],
  ph: [0, 14, 'pH'],
  pressure: [0, 2500, 'kPa'],
  tds: [0, 50000, 'ppm'],
  chlorine: [0, 20, 'mg/L'],
  battery: [0, 100, '%'],
  signal: [-120, 0, 'dBm'],
};

function sha256(s) {
  return crypto.createHash('sha256').update(String(s)).digest('hex');
}

function timingSafeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

async function raiseAlertOnce(nodeId, type, message, severity) {
  const { rows } = await db.query(
    `SELECT id FROM alerts WHERE node_id=$1 AND type=$2 AND resolved=false
     AND created_at > NOW() - interval '6 hours' LIMIT 1`,
    [nodeId, type]
  );
  if (rows.length) return null;
  const ins = await db.query(
    `INSERT INTO alerts (node_id, type, message, severity) VALUES ($1,$2,$3,$4) RETURNING id`,
    [nodeId, type, message, severity]
  );
  return ins.rows[0].id;
}

router.post('/', async (req, res) => {
  try {
    const { device_id, readings, firmware, source } = req.body || {};
    const key = req.headers['x-device-key'];
    if (!device_id || !key) {
      return res.status(401).json({ error: 'device_id and X-Device-Key required' });
    }
    const { rows: devs } = await db.query('SELECT * FROM devices WHERE device_id=$1', [String(device_id).trim()]);
    const device = devs[0];
    if (!device || !timingSafeEqual(sha256(key), device.api_key_hash)) {
      return res.status(401).json({ error: 'Unknown device or invalid key' });
    }
    if (device.status !== 'active') {
      return res.status(403).json({ error: `Device is ${device.status}` });
    }
    if (!device.node_id) {
      return res.status(409).json({ error: 'Device is not linked to a water point yet (set node_id)' });
    }
    if (!readings || typeof readings !== 'object') {
      return res.status(400).json({ error: 'readings object required' });
    }

    // Validate every supplied metric; reject the batch on any absurd value.
    const clean = {};
    const problems = [];
    for (const [field, [lo, hi, unit]] of Object.entries(RANGES)) {
      if (readings[field] === undefined || readings[field] === null || readings[field] === '') continue;
      const v = Number(readings[field]);
      if (!Number.isFinite(v)) problems.push(`${field} must be a number`);
      else if (v < lo || v > hi) problems.push(`${field}=${v} out of range ${lo}-${hi} ${unit}`);
      else clean[field] = v;
    }
    if (problems.length) return res.status(400).json({ error: 'Invalid readings', details: problems });
    if (!Object.keys(clean).length) {
      return res.status(400).json({ error: 'No valid readings supplied', expected: Object.keys(RANGES) });
    }

    const src = source || (device.kind === 'simulator' ? 'simulator' : 'device');
    // Column-tolerant insert: legacy installs may lack pressure/tds/chlorine/source.
    const colQ = await db.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name='sensor_readings'`);
    const have = new Set(colQ.rows.map((r) => r.column_name));
    const pairs = [['node_id', device.node_id]];
    const put = (col, val) => { if (val !== undefined && have.has(col)) pairs.push([col, val]); };
    put('water_level', clean.water_level ?? null);
    put('flow_rate', clean.flow_rate ?? null);
    put('turbidity', clean.turbidity ?? null);
    put('temperature', clean.temperature ?? null);
    put('ph', clean.ph ?? null);
    put('pressure', clean.pressure ?? null);
    put('tds', clean.tds != null ? Math.round(clean.tds) : null);
    put('chlorine', clean.chlorine ?? null);
    put('source', have.has('source') ? src : undefined);
    const cols = pairs.filter(([, v]) => v !== undefined).map(([c]) => c);
    const vals = pairs.filter(([, v]) => v !== undefined).map(([, v]) => v);
    await db.query(
      `INSERT INTO sensor_readings (${cols.join(', ')}) VALUES (${cols.map((_, i) => `$${i + 1}`).join(', ')})`,
      vals
    );
    await db.query('UPDATE nodes SET last_reading=NOW() WHERE id=$1', [device.node_id]).catch(() => {});
    await db.query(
      'UPDATE devices SET last_seen=NOW(), firmware=COALESCE($2, firmware) WHERE id=$1',
      [device.id, firmware || null]
    );

    // Threshold triage → alerts (deduplicated per node/type/6h).
    const raised = [];
    const push = async (type, msg, sev) => {
      const id = await raiseAlertOnce(device.node_id, type, msg, sev).catch(() => null);
      if (id) raised.push({ id, type, severity: sev });
    };
    if (clean.water_level != null && clean.water_level < 10) {
      await push('low_water', `Tank level critical at ${clean.water_level}%`, 'critical');
    } else if (clean.water_level != null && clean.water_level < 20) {
      await push('low_water', `Tank level low at ${clean.water_level}%`, 'warning');
    }
    if (clean.turbidity != null && clean.turbidity > 10) {
      await push('high_turbidity', `Turbidity ${clean.turbidity} NTU exceeds 10 NTU action limit`, 'critical');
    } else if (clean.turbidity != null && clean.turbidity > 5) {
      await push('high_turbidity', `Turbidity ${clean.turbidity} NTU above 5 NTU guideline`, 'warning');
    }
    if (clean.flow_rate === 0) {
      await push('pump_failure', 'Flow rate reported as zero — possible pump failure or closed valve', 'critical');
    }
    if (clean.battery != null && clean.battery < 20) {
      await push('low_battery', `Device battery at ${clean.battery}% — schedule solar/battery check`, 'info');
    }

    // Cloud-to-device: deliver queued commands exactly once.
    let commands = [];
    try {
      const cfg = device.config || {};
      if (Array.isArray(cfg.pending_commands) && cfg.pending_commands.length) {
        commands = cfg.pending_commands;
        const next = { ...cfg };
        delete next.pending_commands;
        await db.query('UPDATE devices SET config=$1::jsonb WHERE id=$2', [JSON.stringify(next), device.id]);
      }
    } catch (e) { /* commands are best-effort */ }

    res.json({ ok: true, received_at: new Date().toISOString(), alerts_raised: raised, commands });
  } catch (e) {
    console.error('ingest failed:', e.message);
    res.status(500).json({ error: 'Ingest failed' });
  }
});

module.exports = router;
