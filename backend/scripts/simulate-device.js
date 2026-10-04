#!/usr/bin/env node
// Device simulator — TEST TOOL ONLY. Generates realistic telemetry and posts
// it through the REAL /api/ingest endpoint using a provisioned device key.
//
// The device MUST be registered with kind='simulator' so its readings land
// in sensor_readings with source='simulator' — never mixed with live data.
//
// Usage:
//   node scripts/simulate-device.js --device MS-KE-0001
// Env: API_URL (default http://localhost:5000/api),
//      DEVICE_KEY (required — the msk_ key shown once at registration),
//      INTERVAL_SEC (default 60), DURATION_MIN (default 0 = forever)

const API_URL = (process.env.API_URL || 'http://localhost:5000/api').replace(/\/$/, '');

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const DEVICE_ID = arg('device', process.env.DEVICE_ID);
const DEVICE_KEY = process.env.DEVICE_KEY;
const INTERVAL = (parseInt(process.env.INTERVAL_SEC || arg('interval', '60'), 10) || 60) * 1000;
const DURATION = (parseInt(process.env.DURATION_MIN || arg('minutes', '0'), 10) || 0) * 60000;

if (!DEVICE_ID || !DEVICE_KEY) {
  console.error('Usage: DEVICE_KEY=msk_... node scripts/simulate-device.js --device MS-KE-0001');
  console.error('Register the device first (kind=simulator) via the Devices page or POST /api/devices/register.');
  process.exit(1);
}

const rnd = (lo, hi) => lo + Math.random() * (hi - lo);

// Diurnal tank: drains during day use, refills at night pumping window.
function levelFor(date) {
  const h = date.getHours() + date.getMinutes() / 60;
  const base = h >= 22 || h < 5 ? 78 : h < 9 ? 62 - (h - 5) * 6 : h < 17 ? 38 - (h - 9) * 2 : 22 + (h - 17) * 11;
  return Math.max(4, Math.min(98, base + rnd(-4, 4)));
}

async function tick(n) {
  const now = new Date();
  const level = levelFor(now);
  const readings = {
    water_level: Math.round(level),
    flow_rate: level > 12 ? +rnd(1.5, 9.5).toFixed(2) : 0,
    turbidity: +(Math.random() < 0.06 ? rnd(5.5, 12) : rnd(0.3, 3.2)).toFixed(2),
    temperature: +rnd(17, 29).toFixed(1),
    ph: +rnd(6.6, 7.8).toFixed(2),
    battery: Math.round(rnd(55, 100)),
    signal: Math.round(rnd(-85, -55)),
    source: 'simulator',
  };
  const res = await fetch(`${API_URL}/ingest`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-device-key': DEVICE_KEY },
    body: JSON.stringify({ device_id: DEVICE_ID, readings, firmware: 'sim-1.0.0' }),
  });
  const body = await res.json().catch(() => ({}));
  const t = now.toISOString().slice(11, 19);
  if (!res.ok) {
    console.error(`[${t}] #${n} REJECTED ${res.status}:`, body.error || JSON.stringify(body), body.details || '');
    return;
  }
  const alerts = (body.alerts_raised || []).map((a) => a.type).join(',') || 'none';
  const cmds = (body.commands || []).length;
  console.log(`[${t}] #${n} level=${readings.water_level}% flow=${readings.flow_rate} turb=${readings.turbidity} | alerts:${alerts} | commands:${cmds}`);
  if (cmds) console.log('   commands:', JSON.stringify(body.commands));
}

(async () => {
  console.log(`Simulating ${DEVICE_ID} -> ${API_URL}/ingest every ${INTERVAL / 1000}s (source=simulator)`);
  const started = Date.now();
  let n = 0;
  for (;;) {
    n += 1;
    await tick(n).catch((e) => console.error('tick failed:', e.message));
    if (DURATION && Date.now() - started > DURATION) break;
    await new Promise((r) => setTimeout(r, INTERVAL));
  }
  console.log('Simulator finished.');
})();
