const { Pool } = require('pg');

// ---------------------------------------------------------------------------
// Self-healing DATABASE_URL handling.
//
// Production incident seen on Render: the stored DATABASE_URL host was
// `dpg-xxxx-a` with NO domain (pasted truncated), so every connection failed
// with ENOTFOUND and login/register (all DB-backed endpoints) went down.
//
// This module now:
//  1. Trims pasted whitespace/newlines.
//  2. Detects a bare Render host id (`dpg-...`) and expands it across Render's
//     known Postgres domains, probing each until one connects.
//  3. Creates the pg Pool lazily from the first working URL (no crash at
//     require-time when the DB is unreachable; API boots degraded).
// ---------------------------------------------------------------------------

const RENDER_PG_DOMAINS = [
  'oregon-postgres.render.com',
  'ohio-postgres.render.com',
  'frankfurt-postgres.render.com',
  'singapore-postgres.render.com',
];

const PROBE_COOLDOWN_MS = 30000;

const dbState = {
  configured: false,
  host: null,      // host actually used (never includes credentials)
  repaired: false, // true when we expanded a truncated host id
  connected: false,
  lastError: null,
  lastProbeAt: 0,
};

function extractHost(raw) {
  const m = String(raw || '').match(/@([^/:?#]+)/);
  return m ? m[1] : null;
}

// Pure function — unit-testable without network. Returns ordered candidates.
function candidateUrls(rawInput) {
  let raw = String(rawInput || '').trim();
  if (!raw) return { candidates: [], host: null, repaired: false };
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) raw = 'postgresql://' + raw;
  const host = extractHost(raw);
  if (!host) return { candidates: [raw], host: null, repaired: false };
  if (host.includes('.')) return { candidates: [raw], host, repaired: false };
  // Bare id like dpg-db0bm2c9v7es73aoe2h0-a → almost certainly a truncated
  // Render Internal Database URL. Expand across Render regions.
  if (/^dpg-[a-z0-9-]+$/i.test(host)) {
    return {
      candidates: RENDER_PG_DOMAINS.map((d) => raw.replace(host, `${host}.${d}`)),
      host,
      repaired: true,
    };
  }
  return { candidates: [raw], host, repaired: false };
}

let pool = null;

async function tryConnect(url) {
  const probe = new Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    max: 1,
    connectionTimeoutMillis: 3000,
  });
  try {
    await probe.query('SELECT 1');
    return true;
  } finally {
    await probe.end().catch(() => {});
  }
}

async function ensurePool() {
  if (pool) return pool;
  const now = Date.now();
  if (dbState.lastError && now - dbState.lastProbeAt < PROBE_COOLDOWN_MS) {
    throw new Error(dbState.lastError);
  }
  const { candidates, host, repaired } = candidateUrls(process.env.DATABASE_URL);
  dbState.configured = candidates.length > 0;
  dbState.host = host;
  dbState.repaired = repaired;
  dbState.lastProbeAt = now;
  if (!candidates.length) {
    dbState.lastError = 'DATABASE_URL is not set — set it on the Render dashboard (Environment)';
    console.warn('⚠️  ' + dbState.lastError);
    throw new Error(dbState.lastError);
  }
  if (repaired) {
    console.warn(`⚠️  DATABASE_URL host "${host}" has no domain — auto-expanding across Render regions. ` +
      `For a faster boot, paste the FULL Internal Database URL on the Render dashboard.`);
  } else if (host) {
    console.log(`ℹ️  Database host: ${host}`);
  }
  let lastErr = 'connection failed';
  for (const url of candidates) {
    try {
      // eslint-disable-next-line no-await-in-loop
      await tryConnect(url);
      pool = new Pool({
        connectionString: url,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });
      pool.on('error', (err) => {
        console.error('Unexpected DB pool error:', err.message);
      });
      dbState.connected = true;
      dbState.activeHost = extractHost(url);
      dbState.lastError = null;
      console.log(`✅ Database connected (${dbState.activeHost})`);
      return pool;
    } catch (e) {
      lastErr = e.message;
    }
  }
  dbState.connected = false;
  dbState.lastError = lastErr;
  console.error(`❌ Database connection failed: ${lastErr}`);
  throw new Error(lastErr);
}

async function query(text, params) {
  const p = await ensurePool();
  const client = await p.connect();
  try {
    return await client.query(text, params);
  } catch (e) {
    // DNS/refused = the cached pool points at a dead host: drop it so the
    // next request re-probes (subject to cooldown) instead of failing forever.
    if (/ENOTFOUND|EAI_AGAIN|ECONNREFUSED/.test(e.code || e.message)) {
      if (pool === p) {
        pool = null;
        p.end().catch(() => {});
      }
    }
    throw e;
  } finally {
    try { client.release(); } catch (_) { /* pool may be ended */ }
  }
}

function getDbStatus() {
  return {
    configured: dbState.configured,
    host: dbState.activeHost || dbState.host,
    repaired: dbState.repaired,
    connected: dbState.connected,
    lastError: dbState.lastError,
  };
}

async function initSchema() {
  await query(`
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(30) DEFAULT 'citizen' CHECK (role IN ('super_admin','county_admin','operator','technician','citizen','viewer','admin','county_officer','community')),
      county VARCHAR(100),
      phone VARCHAR(20),
      tenant_id VARCHAR(100),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS nodes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(150) NOT NULL,
      location VARCHAR(200) NOT NULL,
      county VARCHAR(100) NOT NULL,
      latitude DECIMAL(10,7),
      longitude DECIMAL(10,7),
      status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','warning','offline','maintenance')),
      type VARCHAR(30) DEFAULT 'borehole' CHECK (type IN ('borehole','tank','kiosk','river_intake')),
      capacity_litres INTEGER DEFAULT 10000,
      installed_at TIMESTAMPTZ DEFAULT NOW(),
      last_reading TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS sensor_readings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
      water_level INTEGER CHECK (water_level BETWEEN 0 AND 100),
      flow_rate DECIMAL(8,2),
      turbidity DECIMAL(6,2),
      temperature DECIMAL(5,1),
      ph DECIMAL(4,2),
      recorded_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS payments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      node_id UUID NOT NULL REFERENCES nodes(id),
      phone VARCHAR(20) NOT NULL,
      amount_ksh DECIMAL(10,2) NOT NULL,
      litres INTEGER NOT NULL,
      mpesa_code VARCHAR(50),
      status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','completed','failed','refunded')),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      completed_at TIMESTAMPTZ
    );
    CREATE TABLE IF NOT EXISTS alerts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      message TEXT NOT NULL,
      severity VARCHAR(20) DEFAULT 'warning' CHECK (severity IN ('info','warning','critical')),
      resolved BOOLEAN DEFAULT FALSE,
      resolved_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS maintenance_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      node_id UUID NOT NULL REFERENCES nodes(id),
      user_id UUID REFERENCES users(id),
      description TEXT NOT NULL,
      type VARCHAR(50),
      cost_ksh DECIMAL(10,2),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_sensor_node ON sensor_readings(node_id);
    CREATE INDEX IF NOT EXISTS idx_sensor_time ON sensor_readings(recorded_at DESC);
    CREATE INDEX IF NOT EXISTS idx_payments_node ON payments(node_id);
    CREATE INDEX IF NOT EXISTS idx_alerts_node ON alerts(node_id);
    CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON alerts(resolved);
  `);
  const { rows } = await query('SELECT COUNT(*) FROM nodes');
  if (parseInt(rows[0].count) === 0) {
    await seedDemo();
  }
}
async function seedDemo() {
  console.log('🌱 Seeding demo data…');
  const bcrypt = require('bcryptjs');
  const hash = await bcrypt.hash('admin123', 10);
  await query(`
    INSERT INTO users (name, email, password, role, county) VALUES
    ('Admin User',   'admin@majismart.ke',    $1, 'admin',          'Nairobi'),
    ('Jane Wanjiku', 'county@majismart.ke',   $1, 'county_officer', 'Kiambu'),
    ('John Kamau',   'operator@majismart.ke', $1, 'operator',       'Machakos')
    ON CONFLICT (email) DO NOTHING
  `, [hash]);
  await query(`
    INSERT INTO nodes (name, location, county, latitude, longitude, status, type, capacity_litres) VALUES
    ('Kiambu Borehole 1',  'Thika Road, Kiambu',     'Kiambu',   -1.0332, 36.8279, 'active',  'borehole',     15000),
    ('Machakos Tank A',    'Machakos Town Centre',    'Machakos', -1.5177, 37.2634, 'active',  'tank',         10000),
    ('Kibera Water Kiosk', 'Olympic Estate, Kibera',  'Nairobi',  -1.3133, 36.7887, 'warning', 'kiosk',         5000),
    ('Nakuru Borehole 3',  'Nakuru Industrial Area',  'Nakuru',   -0.3031, 36.0800, 'active',  'borehole',     20000),
    ('Mombasa Tank B',     'Kisauni, Mombasa',        'Mombasa',  -3.9930, 39.7193, 'active',  'tank',          8000),
    ('Kisumu Intake',      'Winam Gulf, Kisumu',      'Kisumu',   -0.1022, 34.7617, 'offline', 'river_intake', 25000)
    ON CONFLICT DO NOTHING
  `);
  const { rows: nodes } = await query('SELECT id FROM nodes');
  for (const node of nodes) {
    for (let i = 48; i >= 0; i--) {
      const t = new Date(Date.now() - i * 3600 * 1000);
      await query(
        `INSERT INTO sensor_readings (node_id, water_level, flow_rate, turbidity, temperature, recorded_at)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          node.id,
          Math.floor(30 + Math.random() * 65),
          parseFloat((1 + Math.random() * 10).toFixed(2)),
          parseFloat((0.3 + Math.random() * 4).toFixed(2)),
          parseFloat((17 + Math.random() * 12).toFixed(1)),
          t
        ]
      );
    }
  }
  const phones = ['0712345678','0723456789','0734567890','0745678901','0756789012'];
  const nodeIds = nodes.map(n => n.id);
  for (let i = 0; i < 30; i++) {
    const litres = [20, 40, 60, 100][Math.floor(Math.random() * 4)];
    const hoursAgo = Math.floor(Math.random() * 72);
    await query(
      `INSERT INTO payments (node_id, phone, amount_ksh, litres, mpesa_code, status, created_at, completed_at)
       VALUES ($1,$2,$3,$4,$5,'completed',
         NOW() - ($6 * interval '1 hour'),
         NOW() - ($6 * interval '1 hour') + interval '30 seconds')`,
      [
        nodeIds[Math.floor(Math.random() * nodeIds.length)],
        phones[Math.floor(Math.random() * phones.length)],
        (litres * 0.1).toFixed(2),
        litres,
        'QK' + Math.random().toString(36).substr(2, 8).toUpperCase(),
        hoursAgo
      ]
    );
  }
  const alertDefs = [
    { type: 'low_water',       msg: 'Tank level below 20%',               sev: 'critical' },
    { type: 'high_turbidity',  msg: 'Turbidity exceeds WHO limit (4 NTU)', sev: 'warning'  },
    { type: 'pump_failure',    msg: 'Flow rate dropped to zero',           sev: 'critical' },
    { type: 'maintenance_due', msg: 'Scheduled maintenance overdue',       sev: 'info'     },
  ];
  for (let i = 0; i < 8; i++) {
    const a = alertDefs[Math.floor(Math.random() * alertDefs.length)];
    const resolved = Math.random() > 0.5;
    await query(
      `INSERT INTO alerts (node_id, type, message, severity, resolved, resolved_at, created_at)
       VALUES ($1,$2,$3,$4,$5,$6, NOW() - ($7 * interval '1 hour'))`,
      [
        nodeIds[Math.floor(Math.random() * nodeIds.length)],
        a.type, a.msg, a.sev,
        resolved,
        resolved ? new Date() : null,
        Math.floor(Math.random() * 48)
      ]
    );
  }
  console.log('✅ Demo data seeded');
}
module.exports = {
  query,
  initSchema,
  getDbStatus,
  candidateUrls,
  RENDER_PG_DOMAINS,
  get pool() { return pool; },
};
