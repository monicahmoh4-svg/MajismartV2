const db = require('../db');

async function runEnhancedAssetMigrations() {
  console.log('🔧 Running Enhanced Asset Management migrations...\n');

  try {
    // Extend assets table with lifecycle fields
    await db.query(`ALTER TABLE assets ADD COLUMN IF NOT EXISTS installation_date DATE`);
    await db.query(`ALTER TABLE assets ADD COLUMN IF NOT EXISTS condition VARCHAR(20) DEFAULT 'good'`);
    await db.query(`ALTER TABLE assets ADD COLUMN IF NOT EXISTS expected_lifespan_years INTEGER DEFAULT 25`);
    await db.query(`ALTER TABLE assets ADD COLUMN IF NOT EXISTS last_maintenance_date DATE`);
    await db.query(`ALTER TABLE assets ADD COLUMN IF NOT EXISTS next_maintenance_date DATE`);
   await db.query(`ALTER TABLE assets ADD COLUMN IF NOT EXISTS next_inspection_date DATE`);
    await db.query(`ALTER TABLE assets ADD COLUMN IF NOT EXISTS warranty_expires DATE`);
    await db.query(`ALTER TABLE assets ADD COLUMN IF NOT EXISTS notes TEXT`);
    await db.query(`ALTER TABLE assets ADD COLUMN IF NOT EXISTS qr_code TEXT`);
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

    // Create attachments table
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

    // Create indexes
    await db.query(`CREATE INDEX IF NOT EXISTS idx_maintenance_asset ON asset_maintenance (asset_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_inspections_asset ON asset_inspections (asset_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_attachments_asset ON asset_attachments (asset_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_assets_condition ON assets (condition)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_assets_next_maintenance ON assets (next_maintenance_date)`);
    console.log('✅ Indexes created');

    // Update existing assets with sample data
    const { rows: existingAssets } = await db.query(`SELECT id FROM assets LIMIT 20`);
    
    if (existingAssets.length > 0) {
      for (const asset of existingAssets) {
        const installDate = new Date();
        installDate.setFullYear(installDate.getFullYear() - Math.floor(Math.random() * 10));
        
        const nextMaintenance = new Date();
        nextMaintenance.setDate(nextMaintenance.getDate() + Math.floor(Math.random() * 180));
        
        const nextInspection = new Date();
        nextInspection.setDate(nextInspection.getDate() + Math.floor(Math.random() * 365));
        
        const conditions = ['good', 'good', 'good', 'fair', 'fair', 'poor'];
        const condition = conditions[Math.floor(Math.random() * conditions.length)];
        
        await db.query(
          `UPDATE assets SET 
            installation_date = $1,
            condition = $2,
            expected_lifespan_years = $3,
            next_maintenance_date = $4,
            next_inspection_date = $5,
            qr_code = $6
           WHERE id = $7`,
          [
            installDate.toISOString().split('T')[0],
            condition,
            25,
            nextMaintenance.toISOString().split('T')[0],
            nextInspection.toISOString().split('T')[0],
            `ASSET-${asset.id}-${Date.now()}`,
            asset.id
          ]
        );
      }
      console.log(`✅ Updated ${existingAssets.length} assets with lifecycle data`);

      // Seed maintenance records
      const maintenanceTypes = ['preventive', 'corrective', 'emergency', 'inspection'];
      const descriptions = [
        'Routine filter replacement',
        'Valve seal replacement',
        'Sensor calibration',
        'Pipe joint repair',
        'Pump bearing lubrication',
        'Meter accuracy check'
      ];

      for (const asset of existingAssets.slice(0, 10)) {
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
      console.log(`✅ Seeded maintenance records`);
    }

    console.log('\n🎉 Enhanced Asset Management migrations completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Enhanced asset migration failed:', error.message);
    process.exit(1);
  }
}

runEnhancedAssetMigrations();
