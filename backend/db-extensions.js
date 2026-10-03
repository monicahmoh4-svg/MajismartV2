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
  console.log('Production tables ensured');
}

module.exports = { ensureProductionTables };

if (require.main === module) {
  ensureProductionTables().then(() => { console.log('migrate:production done'); process.exit(0); })
    .catch((e) => { console.error(e); process.exit(1); });
}
