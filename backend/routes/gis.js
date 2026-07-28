const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/gis/assets - Fetch all GIS assets
router.get('/assets', async (req, res) => {
  try {
    const { type, county, status } = req.query;
    
    let query = `
      SELECT 
        id, name, type, status, latitude, longitude, 
        county, capacity, diameter_mm, material, 
        installation_date, manufacturer, serial_number,
        created_at, updated_at
      FROM assets 
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL
    `;
    
    const params = [];
    
    if (type) {
      params.push(type);
      query += ` AND type = $${params.length}`;
    }
    
    if (county) {
      params.push(county);
      query += ` AND county = $${params.length}`;
    }
    
    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }
    
    query += ' ORDER BY county, type, name LIMIT 500';
    
    const { rows } = await db.query(query, params);
    
    // Fetch DMAs
    const { rows: dmas } = await db.query(`
      SELECT id, name, county, coverage_km2, population_served, boundary
      FROM dmas
      ORDER BY county, name
    `);
    
    // Fetch pipelines
    const { rows: pipelines } = await db.query(`
      SELECT id, name, diameter_mm, material, length_km, status, coordinates
      FROM pipelines
      ORDER BY name
    `);
    
    // Format DMAs for GeoJSON
    const formattedDMAs = dmas.map(dma => ({
      id: `dma-${dma.id}`,
      type: 'dma',
      name: dma.name,
      county: dma.county,
      coverage_km2: parseFloat(dma.coverage_km2) || 0,
      population_served: dma.population_served,
      coordinates: dma.boundary,
      status: 'active'
    }));
    
    // Format pipelines for GeoJSON
    const formattedPipelines = pipelines.map(pipe => ({
      id: `pipe-${pipe.id}`,
      type: 'pipeline',
      name: pipe.name,
      diameter_mm: pipe.diameter_mm,
      material: pipe.material,
      length_km: parseFloat(pipe.length_km) || 0,
      coordinates: pipe.coordinates,
      status: pipe.status || 'active'
    }));
    
    // Combine all assets
    const allAssets = [
      ...rows.map(asset => ({
        ...asset,
        latitude: parseFloat(asset.latitude),
        longitude: parseFloat(asset.longitude)
      })),
      ...formattedDMAs,
      ...formattedPipelines
    ];
    
    res.json(allAssets);
  } catch (error) {
    console.error('GIS Assets Fetch Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch GIS assets',
      message: error.message 
    });
  }
});

// GET /api/gis/assets/:id - Fetch single asset
router.get('/assets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { rows } = await db.query(
      'SELECT * FROM assets WHERE id = $1',
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('GIS Asset Fetch Error:', error);
    res.status(500).json({ error: 'Failed to fetch asset' });
  }
});

// GET /api/gis/stats - GIS statistics
router.get('/stats', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT 
        type,
        COUNT(*) as count,
        COUNT(*) FILTER (WHERE status = 'active') as active_count,
        COUNT(*) FILTER (WHERE status = 'offline') as offline_count
      FROM assets
      GROUP BY type
      ORDER BY count DESC
    `);
    
    const { rows: countyStats } = await db.query(`
      SELECT 
        county,
        COUNT(*) as total_assets,
        COUNT(*) FILTER (WHERE status = 'active') as active_assets
      FROM assets
      WHERE county IS NOT NULL
      GROUP BY county
      ORDER BY total_assets DESC
    `);
    
    res.json({
      by_type: rows,
      by_county: countyStats,
      total_assets: rows.reduce((sum, r) => sum + parseInt(r.count), 0),
      total_active: rows.reduce((sum, r) => sum + parseInt(r.active_count), 0)
    });
  } catch (error) {
    console.error('GIS Stats Error:', error);
    res.status(500).json({ error: 'Failed to fetch GIS statistics' });
  }
});

// POST /api/gis/assets - Create new asset
router.post('/assets', async (req, res) => {
  try {
    const { name, type, latitude, longitude, county, status, capacity, diameter_mm, material } = req.body;
    
    if (!name || !type || !latitude || !longitude) {
      return res.status(400).json({ error: 'Missing required fields: name, type, latitude, longitude' });
    }
    
    const { rows } = await db.query(
      `INSERT INTO assets (name, type, latitude, longitude, county, status, capacity, diameter_mm, material) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [name, type, latitude, longitude, county, status || 'active', capacity, diameter_mm, material]
    );
    
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('GIS Asset Create Error:', error);
    res.status(500).json({ error: 'Failed to create asset' });
  }
});

// PUT /api/gis/assets/:id - Update asset
router.put('/assets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const setClauses = [];
    const values = [];
    let paramCount = 1;
    
    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'id' && key !== 'created_at') {
        setClauses.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }
    
    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    setClauses.push('updated_at = NOW()');
    values.push(id);
    
    const query = `UPDATE assets SET ${setClauses.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    
    const { rows } = await db.query(query, values);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('GIS Asset Update Error:', error);
    res.status(500).json({ error: 'Failed to update asset' });
  }
});

// DELETE /api/gis/assets/:id - Delete asset
router.delete('/assets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { rows } = await db.query(
      'DELETE FROM assets WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    
    res.json({ message: 'Asset deleted successfully', asset: rows[0] });
  } catch (error) {
    console.error('GIS Asset Delete Error:', error);
    res.status(500).json({ error: 'Failed to delete asset' });
  }
});

module.exports = router;
