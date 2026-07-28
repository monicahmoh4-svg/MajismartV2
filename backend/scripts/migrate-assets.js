const db = require('../db');

async function runAssetMigrations() {
  console.log('🔧 Running Asset Management migrations...\n');

  try {
    // Extend existing assets table with lifecycle fields
    await db.query(`ALTER TABLE assets ADD COLUMN IF NOT EXISTS condition VARCHAR(20) DEFAULT 'good'`);
    await db.query(`ALTER TABLE assets ADD COLUMN IF NOT EXISTS expected_lifespan_years INTEGER`);
    await db.query(`ALTER TABLE assets ADD COLUMN IF NOT EXISTS last_maintenance_date DATE`);
    await db.query(`ALTER TABLE assets ADD COLUMN IF NOT EXISTS next_inspection_date DATE`);
    await db.query(`ALTER TABLE assets ADD COLUMN IF NOT EXISTS notes TEXT`);
    await db.query(`ALTER TABLE assets ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP`);
    console.log('✅ assets table extended with lifecycle fields');

    // Create maintenance log table
    await db.query(`
      CREATE TABLE IF NOT EXISTS asset_maintenance (
        id SERIAL PRIMARY KEY,
        asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
        maintenance_type VARCHAR(50) NOT NULL,
        description TEXT,
        performed_by VARCHAR(255),
        cost_ksh DECIMAL(12, 2),
        parts_used TEXT,
        performed_at TIMESTAMP DEFAULT NOW(),
        next_due_date DATE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ asset_maintenance table created');

    // Create inspection table
    await db.query(`
      CREATE TABLE IF NOT EXISTS asset_inspections (
        id SERIAL PRIMARY KEY,
        asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
        inspector_name VARCHAR(255),
        condition_rating VARCHAR(20),
        findings TEXT,
        recommendations TEXT,
        inspected_at TIMESTAMP DEFAULT NOW(),
        next_inspection_date DATE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ asset_inspections table created');

    // Create attachments table (photos/documents as base64)
    await db.query(`
      CREATE TABLE IF NOT EXISTS asset_attachments (
        id SERIAL PRIMARY KEY,
        asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
        filename VARCHAR(255) NOT NULL,
        file_type VARCHAR(50),
        file_data TEXT NOT NULL,
        uploaded_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ asset_attachments table created');

    // Indexes for performance
    await db.query(`CREATE INDEX IF NOT EXISTS idx_maintenance_asset ON asset_maintenance (asset_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_inspections_asset ON asset_inspections (asset_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_attachments_asset ON asset_attachments (asset_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_assets_condition ON assets (condition)`);
    console.log('✅ Indexes created');

    // Seed sample maintenance records for existing assets
    const { rows: existingAssets } = await db.query(`SELECT id FROM assets LIMIT 10`);
    if (existingAssets.length > 0) {
      const maintenanceTypes = ['preventive', 'corrective', 'emergency', 'inspection'];
      const descriptions = [
        'Routine filter replacement',
        'Valve seal replacement',
        'Sensor calibration',
        'Pipe joint repair',
        'Pump bearing lubrication',
        'Meter accuracy check'
      ];

      for (const asset of existingAssets.slice(0, 5)) {
        const type = maintenanceTypes[Math.floor(Math.random() * maintenanceTypes.length)];
        const desc = descriptions[Math.floor(Math.random() * descriptions.length)];
        const cost = Math.floor(Math.random() * 50000) + 5000;
        const daysAgo = Math.floor(Math.random() * 180) + 1;

        await db.query(
          `INSERT INTO asset_maintenance (asset_id, maintenance_type, description, performed_by, cost_ksh, performed_at)
           VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '${daysAgo} days')`,
          [asset.id, type, desc, 'MajiSmart Technician', cost]
        );
      }
      console.log(`✅ Seeded maintenance records for ${Math.min(5, existingAssets.length)} assets`);
    }

    console.log('\n🎉 Asset Management migrations completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Asset migration failed:', error.message);
    process.exit(1);
  }
}

runAssetMigrations();
