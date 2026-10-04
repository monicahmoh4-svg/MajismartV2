// Production tables for MajiSmart OS v6 — non-destructive, idempotent.
// Run at boot (best-effort) and via `npm run migrate:production`.
const db = require('./db');

async function ensureProductionTables() {
  // Widen legacy role CHECK to v6 canonical roles (safe if already widened)
  try {
    await db.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(30) DEFAULT 'citizen'`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(100)`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20)`);
    await db.query(`ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('super_admin','county_admin','operator','technician','citizen','viewer','admin','county_officer','community'))`);
  } catch (e) { console.warn('users role widen skipped:', e.message); }

  await db.query(`
    CREATE TABLE IF NOT EXISTS availability_reports (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      county VARCHAR(100) NOT NULL,
      node_id UUID,
      is_available BOOLEAN NOT NULL,
      reporter_id UUID,
      note TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS community_reports (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      reporter_id UUID,
      reporter_name VARCHAR(150),
      node_id UUID,
      county VARCHAR(100),
      category VARCHAR(60) DEFAULT 'other',
      description TEXT NOT NULL,
      photo_data TEXT,
      latitude DECIMAL(10,7),
      longitude DECIMAL(10,7),
      status VARCHAR(30) DEFAULT 'open',
      assigned_to UUID,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS water_quality_readings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      node_id UUID,
      county VARCHAR(100),
      ph DECIMAL(4,2),
      turbidity DECIMAL(8,2),
      tds INTEGER,
      chlorine DECIMAL(6,3),
      temperature DECIMAL(5,1),
      safety VARCHAR(20) DEFAULT 'unknown',
      recorded_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS vendors (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(150) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      county VARCHAR(100) NOT NULL,
      ward VARCHAR(100),
      source_node_id UUID,
      permit_no VARCHAR(60) UNIQUE,
      tariff_ksh_per_20l DECIMAL(8,2) DEFAULT 2.00,
      status VARCHAR(20) DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS estates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(150) NOT NULL,
      county VARCHAR(100) NOT NULL,
      manager_id UUID,
      paybill VARCHAR(20),
      tariff_ksh_per_m3 DECIMAL(10,2) DEFAULT 105.00,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS estate_units (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      estate_id UUID NOT NULL REFERENCES estates(id) ON DELETE CASCADE,
      unit_no VARCHAR(30) NOT NULL,
      tenant_name VARCHAR(150),
      tenant_phone VARCHAR(20),
      meter_no VARCHAR(60),
      balance_litres INTEGER DEFAULT 0,
      arrears_ksh DECIMAL(10,2) DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(estate_id, unit_no)
    );
    CREATE TABLE IF NOT EXISTS prepaid_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      payment_id UUID,
      meter_no VARCHAR(60),
      phone VARCHAR(20),
      litres INTEGER NOT NULL,
      amount_ksh DECIMAL(10,2) NOT NULL,
      token VARCHAR(24) UNIQUE NOT NULL,
      status VARCHAR(20) DEFAULT 'issued',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      redeemed_at TIMESTAMPTZ
    );
    CREATE TABLE IF NOT EXISTS meter_readings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      node_id UUID,
      meter_no VARCHAR(60),
      reader_id UUID,
      reading_m3 DECIMAL(12,2) NOT NULL,
      photo_url TEXT,
      gps_lat DECIMAL(10,7),
      gps_lng DECIMAL(10,7),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      actor_id UUID,
      action VARCHAR(80) NOT NULL,
      entity VARCHAR(80),
      entity_id VARCHAR(80),
      meta JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_avail_county_time ON availability_reports(county, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_payments_status_time ON payments(status, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_tokens_phone ON prepaid_tokens(phone);
  `);

  // Backfill columns expected by legacy routes (idempotent).
  // /api/reports needs: reported_by, reporter_phone, type, location.
  // /api/datasets/water-quality selects: location, quality_index.
  await db.query(`ALTER TABLE community_reports ADD COLUMN IF NOT EXISTS reported_by UUID`);
  await db.query(`ALTER TABLE community_reports ADD COLUMN IF NOT EXISTS reporter_phone VARCHAR(20)`);
  await db.query(`ALTER TABLE community_reports ADD COLUMN IF NOT EXISTS type VARCHAR(60) DEFAULT 'other'`);
  await db.query(`ALTER TABLE community_reports ADD COLUMN IF NOT EXISTS location VARCHAR(200)`);
  await db.query(`ALTER TABLE water_quality_readings ADD COLUMN IF NOT EXISTS location VARCHAR(200)`);
  await db.query(`ALTER TABLE water_quality_readings ADD COLUMN IF NOT EXISTS quality_index INTEGER`);

  // Operator/technician KYC: identity + certification review before field work.
  // kyc_status defaults to verified so pre-existing/seed accounts keep working;
  // register() explicitly sets 'pending' for new operator/technician signups.
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS national_id VARCHAR(30)`);
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS id_document TEXT`);
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS certifications TEXT`);
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_status VARCHAR(20) DEFAULT 'verified'`);
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS base_latitude DECIMAL(10,7)`);
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS base_longitude DECIMAL(10,7)`);
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS base_location VARCHAR(200)`);

  // Citizen service requests with GIS dispatch (citizen coords -> nearest
  // verified field staff). assigned_to stores the technician/operator user id.
  await db.query(`
    CREATE TABLE IF NOT EXISTS service_requests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      citizen_id UUID REFERENCES users(id) ON DELETE SET NULL,
      category VARCHAR(60) NOT NULL DEFAULT 'other',
      description TEXT NOT NULL,
      latitude DECIMAL(10,7),
      longitude DECIMAL(10,7),
      area VARCHAR(200),
      county VARCHAR(100),
      status VARCHAR(30) DEFAULT 'open' CHECK (status IN ('open','assigned','in_progress','completed','cancelled')),
      assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
      assigned_name VARCHAR(150),
      distance_km DECIMAL(8,2),
      fee_ksh DECIMAL(10,2) DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_sr_status ON service_requests(status);
    CREATE INDEX IF NOT EXISTS idx_sr_assigned ON service_requests(assigned_to);
    CREATE INDEX IF NOT EXISTS idx_sr_citizen ON service_requests(citizen_id);
  `);

  // Direct notifications: admin -> user (user_id set) or broadcast (NULL).
  await db.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(200) NOT NULL,
      message TEXT NOT NULL,
      created_by UUID REFERENCES users(id) ON DELETE SET NULL,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, created_at DESC);
  `);

  // User -> admin support messages (recipient NULL = admin pool).
  await db.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
      recipient_id UUID REFERENCES users(id) ON DELETE SET NULL,
      subject VARCHAR(200),
      body TEXT NOT NULL,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_msg_recipient ON messages(recipient_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_msg_sender ON messages(sender_id, created_at DESC);
  `);

  // Technician earnings: county-set payout per work order (county-settled).
  await db.query(`ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS payout_ksh DECIMAL(10,2) DEFAULT 0`);
  await db.query(`
    CREATE TABLE IF NOT EXISTS devices (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      device_id TEXT UNIQUE NOT NULL,
      node_id UUID REFERENCES nodes(id) ON DELETE SET NULL,
      name VARCHAR(150) NOT NULL,
      kind VARCHAR(40) DEFAULT 'level' CHECK (kind IN ('level','flow','pressure','quality','meter','valve','gateway','simulator','other')),
      api_key_hash VARCHAR(128) NOT NULL,
      status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','suspended','retired')),
      last_seen TIMESTAMPTZ,
      firmware VARCHAR(40),
      config JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_devices_node ON devices(node_id);
    CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
  `);
  await db.query(`ALTER TABLE sensor_readings ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'device'`);

  // Operational indexes (only where the table exists — migrations vary).
  const indexDdls = [
    ['idx_reports_county_status', 'community_reports', 'CREATE INDEX IF NOT EXISTS idx_reports_county_status ON community_reports(county, status)'],
    ['idx_wo_status', 'work_orders', 'CREATE INDEX IF NOT EXISTS idx_wo_status ON work_orders(status)'],
    ['idx_vendors_county', 'vendors', 'CREATE INDEX IF NOT EXISTS idx_vendors_county ON vendors(county)'],
    ['idx_readings_source_time', 'sensor_readings', 'CREATE INDEX IF NOT EXISTS idx_readings_source_time ON sensor_readings(source, recorded_at DESC)'],
  ];
  for (const [name, table, ddl] of indexDdls) {
    try {
      const { rows } = await db.query(`SELECT to_regclass('public."${table}"') as t`);
      if (rows[0] && rows[0].t) await db.query(ddl);
    } catch (e) { console.warn(`index ${name} skipped:`, e.message); }
  }

  await ensureBootstrapAccounts();

  console.log('Production tables ensured');
}

// Guaranteed login accounts, recreated on every boot (idempotent).
// Why: the one-time seed only runs on empty DBs, so demo logins silently
// went missing in production ("Invalid credentials"). These upserts reset
// the four dashboard accounts to KNOWN passwords each boot, so access below
// always works. Override via env; disable entirely with
// DISABLE_BOOTSTRAP_ACCOUNTS=true once real staff accounts exist.
async function ensureBootstrapAccounts() {
  if (String(process.env.DISABLE_BOOTSTRAP_ACCOUNTS || '').toLowerCase() === 'true') {
    console.log('Bootstrap accounts disabled via env');
    return;
  }
  const bcrypt = require('bcryptjs');
  const accounts = [
    { name: 'Admin User', email: 'admin@majismart.ke', password: process.env.BOOTSTRAP_ADMIN_PASSWORD || 'admin123', county: 'Nairobi', role: 'admin' },
    { name: 'County Officer', email: 'county@majismart.ke', password: process.env.BOOTSTRAP_COUNTY_PASSWORD || 'county123', county: 'Kiambu', role: 'county_officer' },
    { name: 'Operator', email: 'operator@majismart.ke', password: process.env.BOOTSTRAP_OPERATOR_PASSWORD || 'operator123', county: 'Machakos', role: 'operator' },
    { name: 'Citizen Demo', email: 'citizen@majismart.ke', password: process.env.BOOTSTRAP_CITIZEN_PASSWORD || 'citizen123', county: 'Nairobi', role: 'community' },
  ];
  for (const a of accounts) {
    const hash = await bcrypt.hash(String(a.password), 10);
    // eslint-disable-next-line no-await-in-loop
    await db.query(
      `INSERT INTO users (name, email, password, county, role, tenant_id)
       VALUES ($1, $2, $3, $4, $5, $4)
       ON CONFLICT (email) DO UPDATE SET
         password = EXCLUDED.password,
         name = EXCLUDED.name,
         county = EXCLUDED.county,
         role = EXCLUDED.role,
         tenant_id = EXCLUDED.tenant_id,
         updated_at = NOW()`,
      [a.name, a.email.toLowerCase().trim(), hash, a.county, a.role]
    );
  }
  console.log(`✅ Bootstrap accounts ensured: ${accounts.map((a) => `${a.email} [${a.role}]`).join(', ')}`);
}

module.exports = { ensureProductionTables };

if (require.main === module) {
  ensureProductionTables().then(() => { console.log('migrate:production done'); process.exit(0); })
    .catch((e) => { console.error(e); process.exit(1); });
}
