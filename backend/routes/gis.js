const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/gis/assets - STRICT, TRANSPARENT ERROR REPORTING
router.get('/assets', async (req, res) => {
  try {
    // 1. Explicitly check if the assets table exists
    const tableCheck = await db.query(`
      SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'assets')
    `);
    
    if (!tableCheck.rows[0].exists) {
      return res.status(500).json({ 
        error: 'DATABASE_TABLE_MISSING', 
        message: 'The "assets" table does not exist in the database. Please check your DATABASE_URL or run the migration.' 
      });
    }

    // 2. Explicitly check if the table has data
    const countCheck = await db.query('SELECT COUNT(*) FROM assets');
    const assetCount = parseInt(countCheck.rows[0].count);

    if (assetCount === 0) {
      return res.status(500).json({
        error: 'DATABASE_TABLE_EMPTY',
        message: 'The "assets" table exists but contains 0 records. Please run the seeding script or add assets via the dashboard.'
      });
    }

    // 3. If it exists and has data, fetch it
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
    
    const { rows: assets } = await db.query(query, params);

    // 4. Fetch DMAs and Pipelines (with explicit error handling)
    let dmas = [];
    let pipelines = [];
    
    try {
      const { rows: dmaRows } = await db.query(`SELECT id, name, county, coverage_km2, population_served, boundary FROM dmas ORDER BY county, name`);
      dmas = dmaRows.map(row => ({
        id: `dma-${row.id}`, type: 'dma', name: row.name, county: row.county,
        coverage_km2: parseFloat(row.coverage_km2) || 0, population_served: row.population_served,
        coordinates: row.boundary, status: 'active'
      }));
    } catch (err) {
      console.warn('⚠️ GIS: Could not fetch DMAs:', err.message);
    }

    try {
      const { rows: pipeRows } = await db.query(`SELECT id, name, diameter_mm, material, length_km, status, coordinates FROM pipelines ORDER BY name`);
      pipelines = pipeRows.map(row => ({
        id: `pipe-${row.id}`, type: 'pipeline', name: row.name,
        diameter_mm: row.diameter_mm, material: row.material,
        length_km: parseFloat(row.length_km) || 0, coordinates: row.coordinates,
        status: row.status || 'active'
      }));
    } catch (err) {
      console.warn('⚠️ GIS: Could not fetch pipelines:', err.message);
    }

    // 5. Format and return
    const formattedAssets = assets.map(row => ({
      ...row,
      latitude: parseFloat(row.latitude),
      longitude: parseFloat(row.longitude),
      diameter_mm: row.diameter_mm ? parseInt(row.diameter_mm) : null
    }));

    res.json([...formattedAssets, ...dmas, ...pipelines]);

  } catch (error) {
    // If we get here, it's a fundamental DB connection or query syntax error
    console.error('❌ GIS Fetch Critical Error:', error.message);
    return res.status(500).json({
      error: 'DATABASE_QUERY_FAILED',
      message: `Database query failed: ${error.message}. Check Render logs for details.`
    });
  }
});

// (Keep your existing POST, PUT, DELETE, and /stats endpoints exactly as they were)
// For brevity, I am omitting them here, but DO NOT DELETE them from your file. 
// Just replace the GET /assets endpoint above.
