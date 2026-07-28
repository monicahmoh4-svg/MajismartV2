const express = require('express');
const router = express.Router();
const db = require('../db');

// ============================================
// SEED DATA - Real Kenyan Infrastructure
// ============================================
const SEED_ASSETS = [
  // Nairobi
  { name: 'Kibera Sensor Node 1', type: 'sensor', latitude: -1.3031, longitude: 36.7989, county: 'Nairobi', status: 'active' },
  { name: 'Kibera Sensor Node 2', type: 'sensor', latitude: -1.3045, longitude: 36.7975, county: 'Nairobi', status: 'active' },
  { name: 'Westlands Pressure Sensor', type: 'sensor', latitude: -1.2635, longitude: 36.8033, county: 'Nairobi', status: 'active' },
  { name: 'Karen Reservoir', type: 'reservoir', latitude: -1.3099, longitude: 36.7096, county: 'Nairobi', capacity: '50M liters', status: 'active' },
  { name: 'CBD Flow Meter', type: 'sensor', latitude: -1.2864, longitude: 36.8172, county: 'Nairobi', status: 'active' },
  { name: 'Sasumua Dam', type: 'reservoir', latitude: -1.0864, longitude: 36.8896, county: 'Nairobi', capacity: '100M liters', status: 'active' },
  { name: 'Nairobi Main Valve V-001', type: 'valve', latitude: -1.2800, longitude: 36.8200, county: 'Nairobi', status: 'active' },
  { name: 'Kibera Fire Hydrant H-101', type: 'hydrant', latitude: -1.3050, longitude: 36.8000, county: 'Nairobi', status: 'active' },
  { name: 'Mathare Water Kiosk', type: 'water_point', latitude: -1.2583, longitude: 36.8833, county: 'Nairobi', status: 'active' },
  { name: 'Eastleigh Community Tap', type: 'water_point', latitude: -1.2667, longitude: 36.8500, county: 'Nairobi', status: 'active' },
  { name: 'Ruiru Water Tower', type: 'water_tower', latitude: -1.1167, longitude: 36.9667, county: 'Nairobi', status: 'active' },
  { name: 'Kikuyu Treatment Plant', type: 'treatment_plant', latitude: -1.2500, longitude: 36.6700, county: 'Nairobi', status: 'active' },
  
  // Mombasa
  { name: 'Mombasa Island Sensor', type: 'sensor', latitude: -4.0435, longitude: 39.6682, county: 'Mombasa', status: 'active' },
  { name: 'Nyali Reservoir', type: 'reservoir', latitude: -4.0167, longitude: 39.7000, county: 'Mombasa', capacity: '20M liters', status: 'active' },
  { name: 'Likoni Water Point', type: 'water_point', latitude: -4.0667, longitude: 39.6667, county: 'Mombasa', status: 'active' },
  { name: 'Mombasa Distribution Valve', type: 'valve', latitude: -4.0500, longitude: 39.6700, county: 'Mombasa', status: 'active' },
  
  // Kisumu
  { name: 'Kisumu Central Sensor', type: 'sensor', latitude: -0.0917, longitude: 34.7680, county: 'Kisumu', status: 'active' },
  { name: 'Lake Victoria Intake', type: 'treatment_plant', latitude: -0.1000, longitude: 34.7500, county: 'Kisumu', status: 'active' },
  { name: 'Mamboleo Reservoir', type: 'reservoir', latitude: -0.1167, longitude: 34.7833, county: 'Kisumu', capacity: '15M liters', status: 'active' },
  { name: 'Kisumu Pressure Reducing Valve', type: 'valve', latitude: -0.0950, longitude: 34.7700, county: 'Kisumu', status: 'active' },
  
  // Nakuru
  { name: 'Nakuru Town Sensor', type: 'sensor', latitude: -0.3031, longitude: 36.0800, county: 'Nakuru', status: 'active' },
  { name: 'Lake Naivasha Intake', type: 'treatment_plant', latitude: -0.7167, longitude: 36.4333, county: 'Nakuru', status: 'active' },
  { name: 'Nakuru Reservoir', type: 'reservoir', latitude: -0.2833, longitude: 36.0667, county: 'Nakuru', capacity: '25M liters', status: 'active' },
  
  // Eldoret / Uasin Gishu
  { name: 'Eldoret Central Sensor', type: 'sensor', latitude: 0.5143, longitude: 35.2698, county: 'Uasin Gishu', status: 'active' },
  { name: 'Eldoret Water Tower', type: 'water_tower', latitude: 0.5333, longitude: 35.2833, county: 'Uasin Gishu', status: 'active' },
  
  // Other Counties
  { name: 'Meru Town Sensor', type: 'sensor', latitude: 0.0467, longitude: 37.6558, county: 'Meru', status: 'active' },
  { name: 'Nyeri Town Sensor', type: 'sensor', latitude: -0.4167, longitude: 36.9500, county: 'Nyeri', status: 'active' },
  { name: 'Machakos Town Sensor', type: 'sensor', latitude: -1.5167, longitude: 37.2667, county: 'Machakos', status: 'active' },
  { name: 'Kiambu Town Sensor', type: 'sensor', latitude: -1.1719, longitude: 36.8311, county: 'Kiambu', status: 'active' },
  { name: 'Kakamega Town Sensor', type: 'sensor', latitude: 0.2833, longitude: 34.7500, county: 'Kakamega', status: 'active' },
  { name: 'Garissa Town Sensor', type: 'sensor', latitude: -0.4532, longitude: 39.6461, county: 'Garissa', status: 'active' },
  { name: 'Marsabit Water Point', type: 'water_point', latitude: 2.3283, longitude: 37.9900, county: 'Marsabit', status: 'active' },
  { name: 'Turkana Water Point', type: 'water_point', latitude: 3.1167, longitude: 35.6000, county: 'Turkana', status: 'active' },
  { name: 'Kitale Town Sensor', type: 'sensor', latitude: 1.0167, longitude: 35.0000, county: 'Trans-Nzoia', status: 'active' },
  { name: 'Bungoma Town Sensor', type: 'sensor', latitude: 0.5667, longitude: 34.5500, county: 'Bungoma', status: 'active' },
  { name: 'Kisii Town Sensor', type: 'sensor', latitude: -0.6833, longitude: 34.7667, county: 'Kisii', status: 'active' },
  { name: 'Narok Town Sensor', type: 'sensor', latitude: -1.0833, longitude: 35.8667, county: 'Narok', status: 'active' },
  { name: 'Kajiado Town Sensor', type: 'sensor', latitude: -1.8500, longitude: 36.7833, county: 'Kajiado', status: 'active' },
  { name: 'Kericho Town Sensor', type: 'sensor', latitude: -0.3667, longitude: 35.2833, county: 'Kericho', status: 'active' },
  { name: 'Nanyuki Treatment Plant', type: 'treatment_plant', latitude: 0.0167, longitude: 37.0667, county: 'Laikipia', status: 'active' },
  { name: 'Thika Treatment Plant', type: 'treatment_plant', latitude: -1.0333, longitude: 37.0833, county: 'Kiambu', status: 'active' },
  { name: 'Voi Water Tower', type: 'water_tower', latitude: -3.3833, longitude: 38.5667, county: 'Taita-Taveta', status: 'active' },
  { name: 'Lodwar Water Point', type: 'water_point', latitude: 3.1167, longitude: 35.6000, county: 'Turkana', status: 'active' }
];

const SEED_DMAS = [
  { name: 'Nairobi Central DMA', county: 'Nairobi', coverage_km2: 15.2, population_served: 250000, boundary: [[-1.2900, 36.8200], [-1.2900, 36.8300], [-1.3000, 36.8300], [-1.3000, 36.8200]] },
  { name: 'Mombasa Island DMA', county: 'Mombasa', coverage_km2: 8.5, population_served: 120000, boundary: [[-4.0500, 39.6600], [-4.0500, 39.6700], [-4.0600, 39.6700], [-4.0600, 39.6600]] },
  { name: 'Kisumu Central DMA', county: 'Kisumu', coverage_km2: 12.0, population_served: 180000, boundary: [[-0.0900, 34.7600], [-0.0900, 34.7700], [-0.1000, 34.7700], [-0.1000, 34.7600]] },
  { name: 'Nakuru Town DMA', county: 'Nakuru', coverage_km2: 10.5, population_served: 150000, boundary: [[-0.3100, 36.0700], [-0.3100, 36.0900], [-0.3000, 36.0900], [-0.3000, 36.0700]] },
  { name: 'Eldoret Central DMA', county: 'Uasin Gishu', coverage_km2: 9.8, population_served: 140000, boundary: [[0.5100, 35.2600], [0.5100, 35.2800], [0.5200, 35.2800], [0.5200, 35.2600]] }
];

const SEED_PIPELINES = [
  { name: 'Nairobi Trunk Main A', diameter_mm: 500, material: 'Ductile Iron', length_km: 12.5, coordinates: [[-1.2921, 36.8219], [-1.2950, 36.8150], [-1.3000, 36.8100]] },
  { name: 'Mombasa Distribution Line', diameter_mm: 300, material: 'PVC', length_km: 8.2, coordinates: [[-4.0435, 39.6682], [-4.0300, 39.6800], [-4.0167, 39.7000]] },
  { name: 'Kisumu Lake Victoria Pipeline', diameter_mm: 400, material: 'Steel', length_km: 15.0, coordinates: [[-0.1000, 34.7500], [-0.0917, 34.7680], [-0.0800, 34.7800]] }
];

// ============================================
// SELF-HEALING: Ensure tables exist AND have data
// ============================================
let lastCheckTime = 0;
const CHECK_INTERVAL = 60000; // Check every 60 seconds

async function ensureGISTablesAndData() {
  const now = Date.now();
  if (now - lastCheckTime < CHECK_INTERVAL) return; // Skip if checked recently
  lastCheckTime = now;

  try {
    // 1. Check if assets table exists
    const { rows } = await db.query(`
      SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'assets')
    `);
    
    if (!rows[0].exists) {
      console.log('🔧 GIS: Creating assets table...');
      await db.query(`
        CREATE TABLE assets (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          type VARCHAR(50) NOT NULL,
          status VARCHAR(20) DEFAULT 'active',
          latitude DECIMAL(10, 8) NOT NULL,
          longitude DECIMAL(11, 8) NOT NULL,
          county VARCHAR(100),
          capacity VARCHAR(50),
          diameter_mm INTEGER,
          material VARCHAR(100),
          manufacturer VARCHAR(255),
          serial_number VARCHAR(100),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log('✅ GIS: assets table created');
    }

    // 2. Check if dmas table exists
    const { rows: dmasCheck } = await db.query(`
      SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'dmas')
    `);
    if (!dmasCheck[0].exists) {
      await db.query(`
        CREATE TABLE dmas (
          id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, county VARCHAR(100),
          coverage_km2 DECIMAL(10, 2), population_served INTEGER, boundary JSONB,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log('✅ GIS: dmas table created');
    }

    // 3. Check if pipelines table exists
    const { rows: pipesCheck } = await db.query(`
      SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'pipelines')
    `);
    if (!pipesCheck[0].exists) {
      await db.query(`
        CREATE TABLE pipelines (
          id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL,
          diameter_mm INTEGER, material VARCHAR(100), length_km DECIMAL(10, 2),
          status VARCHAR(20) DEFAULT 'active', coordinates JSONB,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log('✅ GIS: pipelines table created');
    }

    // 4. CRITICAL FIX: Check if data exists, and seed if empty
    const { rows: countResult } = await db.query('SELECT COUNT(*) FROM assets');
    const assetCount = parseInt(countResult[0].count);
    
    if (assetCount === 0) {
      console.log('⚠️ GIS: assets table is EMPTY - seeding with Kenyan infrastructure data...');
      await seedAllData();
    } else {
      console.log(`✅ GIS: assets table has ${assetCount} records`);
    }
  } catch (error) {
    console.error('❌ GIS: Self-healing error:', error.message);
  }
}

// ============================================
// SEED FUNCTION - Idempotent (safe to run multiple times)
// ============================================
async function seedAllData() {
  try {
    // Seed assets
    for (const asset of SEED_ASSETS) {
      await db.query(
        `INSERT INTO assets (name, type, latitude, longitude, county, status, capacity) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT DO NOTHING`,
        [asset.name, asset.type, asset.latitude, asset.longitude, asset.county, asset.status, asset.capacity]
      );
    }
    console.log(`✅ GIS: Seeded ${SEED_ASSETS.length} assets`);

    // Seed DMAs
    for (const dma of SEED_DMAS) {
      await db.query(
        `INSERT INTO dmas (name, county, coverage_km2, population_served, boundary) 
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT DO NOTHING`,
        [dma.name, dma.county, dma.coverage_km2, dma.population_served, JSON.stringify(dma.boundary)]
      );
    }
    console.log(`✅ GIS: Seeded ${SEED_DMAS.length} DMA zones`);

    // Seed pipelines
    for (const pipeline of SEED_PIPELINES) {
      await db.query(
        `INSERT INTO pipelines (name, diameter_mm, material, length_km, coordinates) 
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT DO NOTHING`,
        [pipeline.name, pipeline.diameter_mm, pipeline.material, pipeline.length_km, JSON.stringify(pipeline.coordinates)]
      );
    }
    console.log(`✅ GIS: Seeded ${SEED_PIPELINES.length} pipelines`);
    console.log('🎉 GIS: All data seeded successfully!');
  } catch (error) {
    console.error('❌ GIS: Seeding error:', error.message);
    throw error;
  }
}

// ============================================
// API ENDPOINTS
// ============================================

// GET /api/gis/assets - Fetch all assets with auto-seeding
router.get('/assets', async (req, res) => {
  try {
    // Ensure tables exist and have data before fetching
    await ensureGISTablesAndData();

    let assets = [];
    let dmas = [];
    let pipelines = [];

    // Fetch Assets
    try {
      const { type, county, status } = req.query;
      let query = `
        SELECT id, name, type, status, latitude, longitude, county, capacity, 
               diameter_mm, material, manufacturer, serial_number, created_at, updated_at
        FROM assets 
        WHERE latitude IS NOT NULL AND longitude IS NOT NULL
      `;
      const params = [];
      if (type) { params.push(type); query += ` AND type = $${params.length}`; }
      if (county) { params.push(county); query += ` AND county = $${params.length}`; }
      if (status) { params.push(status); query += ` AND status = $${params.length}`; }
      query += ' ORDER BY county, type, name LIMIT 1000';
      
      const { rows } = await db.query(query, params);
      assets = rows.map(row => ({
        ...row,
        latitude: parseFloat(row.latitude),
        longitude: parseFloat(row.longitude),
        diameter_mm: row.diameter_mm ? parseInt(row.diameter_mm) : null
      }));
    } catch (err) {
      console.warn('⚠️ GIS: Could not fetch assets:', err.message);
    }

    // Fetch DMAs
    try {
      const { rows } = await db.query(`
        SELECT id, name, county, coverage_km2, population_served, boundary 
        FROM dmas ORDER BY county, name
      `);
      dmas = rows.map(row => ({
        id: `dma-${row.id}`, type: 'dma', name: row.name, county: row.county,
        coverage_km2: parseFloat(row.coverage_km2) || 0, population_served: row.population_served,
        coordinates: row.boundary, status: 'active'
      }));
    } catch (err) {
      console.warn('⚠️ GIS: Could not fetch DMAs:', err.message);
    }

    // Fetch Pipelines
    try {
      const { rows } = await db.query(`
        SELECT id, name, diameter_mm, material, length_km, status, coordinates 
        FROM pipelines ORDER BY name
      `);
      pipelines = rows.map(row => ({
        id: `pipe-${row.id}`, type: 'pipeline', name: row.name,
        diameter_mm: row.diameter_mm, material: row.material,
        length_km: parseFloat(row.length_km) || 0, coordinates: row.coordinates,
        status: row.status || 'active'
      }));
    } catch (err) {
      console.warn('⚠️ GIS: Could not fetch pipelines:', err.message);
    }

    const result = [...assets, ...dmas, ...pipelines];
    console.log(`✅ GIS: Returning ${result.length} items (${assets.length} assets, ${dmas.length} DMAs, ${pipelines.length} pipelines)`);
    res.json(result);
  } catch (error) {
    console.error('❌ GIS Assets Fetch Critical Error:', error);
    res.json([]);
  }
});

// POST /api/gis/seed - Manual seed endpoint (for debugging)
router.post('/seed', async (req, res) => {
  try {
    console.log('🔧 GIS: Manual seed triggered');
    await seedAllData();
    res.json({ message: 'Seeding completed successfully' });
  } catch (error) {
    console.error('❌ Manual seed failed:', error);
    res.status(500).json({ error: 'Seeding failed', message: error.message });
  }
});

// POST /api/gis/assets
router.post('/assets', async (req, res) => {
  try {
    const { name, type, latitude, longitude, county, status, capacity, diameter_mm, material, manufacturer, serial_number } = req.body;
    if (!name || !type || !latitude || !longitude) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const { rows } = await db.query(
      `INSERT INTO assets (name, type, latitude, longitude, county, status, capacity, diameter_mm, material, manufacturer, serial_number) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [name, type, latitude, longitude, county, status || 'active', capacity, diameter_mm, material, manufacturer, serial_number]
    );
    res.status(201).json({ message: 'Asset created successfully', asset: rows[0] });
  } catch (error) {
    console.error('GIS Asset Create Error:', error);
    res.status(500).json({ error: 'Failed to create asset', message: error.message });
  }
});

// PUT /api/gis/assets/:id
router.put('/assets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const setClauses = [];
    const values = [];
    let paramCount = 1;
    const allowedFields = ['name', 'type', 'latitude', 'longitude', 'county', 'status', 'capacity', 'diameter_mm', 'material', 'manufacturer', 'serial_number'];
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        setClauses.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }
    if (setClauses.length === 0) return res.status(400).json({ error: 'No valid fields to update' });
    
    setClauses.push('updated_at = NOW()');
    values.push(id);
    
    const { rows } = await db.query(`UPDATE assets SET ${setClauses.join(', ')} WHERE id = $${paramCount} RETURNING *`, values);
    if (rows.length === 0) return res.status(404).json({ error: 'Asset not found' });
    res.json({ message: 'Asset updated successfully', asset: rows[0] });
  } catch (error) {
    console.error('GIS Asset Update Error:', error);
    res.status(500).json({ error: 'Failed to update asset', message: error.message });
  }
});

// DELETE /api/gis/assets/:id
router.delete('/assets/:id', async (req, res) => {
  try {
    const { rows } = await db.query('DELETE FROM assets WHERE id = $1 RETURNING *', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Asset not found' });
    res.json({ message: 'Asset deleted successfully', asset: rows[0] });
  } catch (error) {
    console.error('GIS Asset Delete Error:', error);
    res.status(500).json({ error: 'Failed to delete asset', message: error.message });
  }
});

// GET /api/gis/assets/:id
router.get('/assets/:id', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM assets WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Asset not found' });
    res.json(rows[0]);
  } catch (error) {
    console.error('GIS Asset Fetch Error:', error);
    res.status(500).json({ error: 'Failed to fetch asset' });
  }
});

// GET /api/gis/stats
router.get('/stats', async (req, res) => {
  try {
    let assetStats = [], countyStats = [];
    try {
      const { rows } = await db.query(`
        SELECT type, COUNT(*) as count, 
               COUNT(*) FILTER (WHERE status = 'active') as active_count,
               COUNT(*) FILTER (WHERE status != 'active') as offline_count 
        FROM assets GROUP BY type ORDER BY count DESC
      `);
      assetStats = rows;
    } catch (err) { console.warn('⚠️ GIS Stats: Could not fetch asset stats:', err.message); }
    
    try {
      const { rows } = await db.query(`
        SELECT county, COUNT(*) as total_assets 
        FROM assets WHERE county IS NOT NULL 
        GROUP BY county ORDER BY total_assets DESC
      `);
      countyStats = rows;
    } catch (err) { console.warn('⚠️ GIS Stats: Could not fetch county stats:', err.message); }

    const totalAssets = assetStats.reduce((sum, r) => sum + parseInt(r.count), 0);
    const totalActive = assetStats.reduce((sum, r) => sum + parseInt(r.active_count), 0);
    
    res.json({ by_type: assetStats, by_county: countyStats, total_assets: totalAssets, total_active: totalActive });
  } catch (error) {
    console.error('GIS Stats Error:', error);
    res.json({ by_type: [], by_county: [], total_assets: 0, total_active: 0 });
  }
});

module.exports = router;
