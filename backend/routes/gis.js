const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/gis/assets - Fetch ALL GIS assets (Resilient, no fragile joins)
router.get('/assets', async (req, res) => {
  try {
    const { type, county, status } = req.query;
    
    // 1. Query the assets table (Single source of truth for GIS)
    let assetsQuery = `
      SELECT 
        id, name, type, status, latitude, longitude, 
        county, capacity, diameter_mm, material, 
        installation_date, manufacturer, serial_number,
        condition, expected_lifespan_years, last_maintenance_date,
        next_inspection_date, notes, created_at, updated_at
      FROM assets 
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND deleted_at IS NULL
    `;
    
    const params = [];
    
    if (type) {
      params.push(type);
      assetsQuery += ` AND type = $${params.length}`;
    }
    
    if (county) {
      params.push(county);
      assetsQuery += ` AND county = $${params.length}`;
    }
    
    if (status) {
      params.push(status);
      assetsQuery += ` AND status = $${params.length}`;
    }
    
    assetsQuery += ' ORDER BY county, type, name LIMIT 1000';
    
    const { rows: assetsFromTable } = await db.query(assetsQuery, params);
    
    // 2. Fetch DMAs
    const { rows: dmas } = await db.query(`
      SELECT id, name, county, coverage_km2, population_served, boundary
      FROM dmas
      ORDER BY county, name
    `);
    
    // 3. Fetch pipelines
    const { rows: pipelines } = await db.query(`
      SELECT id, name, diameter_mm, material, length_km, status, coordinates
      FROM pipelines
      ORDER BY name
    `);
    
    // Format DMAs for frontend
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
    
    // Format pipelines for frontend
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
    
    // Format assets to ensure numeric types are correct
    const formattedAssets = assetsFromTable.map(asset => ({
      ...asset,
      latitude: parseFloat(asset.latitude),
      longitude: parseFloat(asset.longitude),
      diameter_mm: asset.diameter_mm ? parseInt(asset.diameter_mm) : null,
      expected_lifespan_years: asset.expected_lifespan_years ? parseInt(asset.expected_lifespan_years) : null
    }));
    
    // Combine all data
    const allAssets = [
      ...formattedAssets,
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

// POST /api/gis/assets - Create new GIS asset
router.post('/assets', async (req, res) => {
  try {
    const { 
      name, type, latitude, longitude, county, status, 
      capacity, diameter_mm, material, manufacturer, serial_number 
    } = req.body;
    
    if (!name || !type || !latitude || !longitude) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, type, latitude, longitude' 
      });
    }
    
    const { rows } = await db.query(
      `INSERT INTO assets (
        name, type, latitude, longitude, county, status, 
        capacity, diameter_mm, material, manufacturer, serial_number
      ) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
       RETURNING *`,
      [name, type, latitude, longitude, county, status || 'active', capacity, diameter_mm, material, manufacturer, serial_number]
    );
    
    res.status(201).json({
      message: 'Asset created successfully',
      asset: rows[0]
    });
  } catch (error) {
    console.error('GIS Asset Create Error:', error);
    res.status(500).json({ 
      error: 'Failed to create asset',
      message: error.message 
    });
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
    
    const allowedFields = [
      'name', 'type', 'latitude', 'longitude', 'county', 'status',
      'capacity', 'diameter_mm', 'material', 'manufacturer', 'serial_number',
      'condition', 'expected_lifespan_years', 'last_maintenance_date',
      'next_inspection_date', 'notes'
    ];
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        setClauses.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }
    
    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    setClauses.push('updated_at = NOW()');
    values.push(id);
    
    const query = `UPDATE assets SET ${setClauses.join(', ')} WHERE id = $${paramCount} AND deleted_at IS NULL RETURNING *`;
    
    const { rows } = await db.query(query, values);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    
    res.json({
      message: 'Asset updated successfully',
      asset: rows[0]
    });
  } catch (error) {
    console.error('GIS Asset Update Error:', error);
    res.status(500).json({ 
      error: 'Failed to update asset',
      message: error.message 
    });
  }
});

// DELETE /api/gis/assets/:id - Soft delete asset
router.delete('/assets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { rows } = await db.query(
      'UPDATE assets SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING *',
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    
    res.json({ 
      message: 'Asset deleted successfully', 
      asset: rows[0] 
    });
  } catch (error) {
    console.error('GIS Asset Delete Error:', error);
    res.status(500).json({ 
      error: 'Failed to delete asset',
      message: error.message 
    });
  }
});

// GET /api/gis/assets/:id - Fetch single asset
router.get('/assets/:id', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM assets WHERE id = $1 AND deleted_at IS NULL',
      [req.params.id]
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
    const { rows: assetStats } = await db.query(`
      SELECT 
        type,
        COUNT(*) as count,
        COUNT(*) FILTER (WHERE status = 'active') as active_count,
        COUNT(*) FILTER (WHERE status = 'offline' OR status = 'maintenance') as offline_count
      FROM assets
      WHERE deleted_at IS NULL
      GROUP BY type
      ORDER BY count DESC
    `);
    
    const { rows: countyStats } = await db.query(`
      SELECT 
        county,
        COUNT(*) as total_assets
      FROM assets
      WHERE county IS NOT NULL AND deleted_at IS NULL
      GROUP BY county
      ORDER BY total_assets DESC
    `);
    
    const totalAssets = assetStats.reduce((sum, r) => sum + parseInt(r.count), 0);
    const totalActive = assetStats.reduce((sum, r) => sum + parseInt(r.active_count), 0);
    
    res.json({
      by_type: assetStats,
      by_county: countyStats,
      total_assets: totalAssets,
      total_active: totalActive
    });
  } catch (error) {
    console.error('GIS Stats Error:', error);
    res.status(500).json({ error: 'Failed to fetch GIS statistics' });
  }
});

module.exports = router;
