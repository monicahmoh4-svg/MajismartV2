const db = require('../db');

async function runMigrations() {
  console.log('🚀 Running GIS database migrations...');
  try {
    // Update nodes table
    await db.query(`ALTER TABLE nodes ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);`);
    await db.query(`ALTER TABLE nodes ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);`);
    console.log('✅ nodes table updated');

    // Update reservoirs table
    await db.query(`ALTER TABLE reservoirs ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);`);
    await db.query(`ALTER TABLE reservoirs ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);`);
    await db.query(`ALTER TABLE reservoirs ADD COLUMN IF NOT EXISTS capacity VARCHAR(50);`);
    console.log('✅ reservoirs table updated');

    // Create indexes for performance
    await db.query(`CREATE INDEX IF NOT EXISTS idx_nodes_lat_lon ON nodes (latitude, longitude);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_reservoirs_lat_lon ON reservoirs (latitude, longitude);`);
    console.log('✅ Spatial indexes created');

    console.log('🎉 Migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigrations();
