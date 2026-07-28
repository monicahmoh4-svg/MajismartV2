const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/gis/assets - Fetch ALL GIS assets with LIVE sensor data
router.get('/assets', async (req, res) => {
  try {
    const { type, county, status } = req.query;
    
    // Query assets table with live sensor readings from nodes table
    let assetsQuery = `
      SELECT 
        a.id, a.name, a.type, a.status, a.latitude, a.longitude, 
        a.county, a.capacity, a.diameter_mm, a.material, 
        a.installation_date, a.manufacturer, a.serial_number,
        a.created_at, a.updated_at,
        n.water_level, n.pressure, n.flow_rate, n.temperature, 
        n.quality_index, n.ph, n.turbidity, n.tds,
        n.updated_at as last_reading_at
      FROM assets a
      LEFT JOIN nodes n ON a.name = n.name OR (
        a.latitude = n.latitude AND a.longitude = n.longitude
      )
      WHERE a.latitude IS NOT NULL AND a.longitude IS NOT NULL
    `;
    
    const params = [];
    
    if (type) { params.push(type); assetsQuery += ` AND a.type = $${params.length}`; }
    if (county) { params.push(county); assetsQuery += ` AND a.county = $${params.length}`; }
    if (status) { params.push(status); assetsQuery += ` AND a.status = $${params.length}`; }
    
    assetsQuery += ' ORDER BY a.county, a.type, a.name LIMIT 1000';
    
    const { rows: assetsFromTable } = await db.query(assetsQuery, params);
    
    // Query nodes table directly (for nodes not yet in assets table)
    let nodesQuery = `
      SELECT 
        id, name, 'sensor' as type, status, latitude, longitude, county,
        water_level, pressure, flow_rate, temperature, quality_index, ph, 
        turbidity, tds, updated_at as last_reading_at,
        water_level as capacity, created_at, updated_at
      FROM nodes 
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL
    `;
    
    const nodesParams = [];
    if (county) { nodesParams.push(county); nodesQuery += ` AND county = $${nodesParams.length}`; }
    if (status) { nodesParams.push(status); nodesQuery += ` AND status = $${nodesParams.length}`; }
    nodesQuery += ' LIMIT 500';
    
    const { rows: nodesFromTable } = await db.query(nodesQuery, nodesParams);
    
    // DMAs and pipelines
    const { rows: dmas } = await db.query(`SELECT * FROM dmas ORDER BY county, name`);
    const { rows: pipelines } = await db.query(`SELECT * FROM pipelines ORDER BY name`);
    
    const formattedDMAs = dmas.map(dma => ({
      id: `dma-${dma.id}`, type: 'dma', name: dma.name, county: dma.county,
      coverage_km2: parseFloat(dma.coverage_km2) || 0, population_served: dma.population_served,
      coordinates: dma.boundary, status: 'active'
    }));
    
    const formattedPipelines = pipelines.map(pipe => ({
      id: `pipe-${pipe.id}`, type: 'pipeline', name: pipe.name,
      diameter_mm: pipe.diameter_mm, material: pipe.material,
      length_km: parseFloat(pipe.length_km) || 0, coordinates: pipe.coordinates,
      status: pipe.status || 'active'
    }));
    
    // Combine all data
    const allAssets = [
      ...assetsFromTable.map(asset => ({
        ...asset,
        latitude: parseFloat(asset.latitude),
        longitude: parseFloat(asset.longitude),
        water_level: asset.water_level ? parseFloat(asset.water_level) : null,
        pressure: asset.pressure ? parseFloat(asset.pressure) : null,
        flow_rate: asset.flow_rate ? parseFloat(asset.flow_rate) : null,
        temperature: asset.temperature ? parseFloat(asset.temperature) : null,
        quality_index: asset.quality_index ? parseFloat(asset.quality_index) : null,
        ph: asset.ph ? parseFloat(asset.ph) : null
      })),
      ...nodesFromTable.map(node => ({
        ...node,
        latitude: parseFloat(node.latitude),
        longitude: parseFloat(node.longitude),
        water_level: node.water_level ? parseFloat(node.water_level) : null,
        pressure: node.pressure ? parseFloat(node.pressure) : null,
        flow_rate: node.flow_rate ? parseFloat(node.flow_rate) : null,
        temperature: node.temperature ? parseFloat(node.temperature) : null,
        quality_index: node.quality_index ? parseFloat(node.quality_index) : null,
        ph: node.ph ? parseFloat(node.ph) : null
      })),
      ...formattedDMAs,
      ...formattedPipelines
    ];
    
    res.json(allAssets);
  } catch (error) {
    console.error('GIS Assets Fetch Error:', error);
    res.status(500).json({ error: 'Failed to fetch GIS assets', message: error.message });
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
    
    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'id' && key !== 'created_at') {
        setClauses.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }
    
    if (setClauses.length === 0) return res.status(400).json({ error: 'No fields to update' });
    
    setClauses.push('updated_at = NOW()');
    values.push(id);
    
    const { rows } = await db.query(`UPDATE assets SET ${setClauses.join(', ')} WHERE id = $${paramCount} RETURNING *`, values);
    
    if (rows.length === 0) return res.status(404).json({ error: 'Asset not found' });
    res.json({ message: 'Asset updated successfully', asset: rows[0] });
  } catch (error) {
    console.error('GIS Asset Update Error:', error);
    res.status(500).json({ error: 'Failed to update asset' });
  }
});

// DELETE /api/gis/assets/:id
router.delete('/assets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query('DELETE FROM assets WHERE id = $1 RETURNING *', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Asset not found' });
    res.json({ message: 'Asset deleted successfully', asset: rows[0] });
  } catch (error) {
    console.error('GIS Asset Delete Error:', error);
    res.status(500).json({ error: 'Failed to delete asset' });
  }
});

// GET /api/gis/assets/:id
router.get('/assets/:id', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM assets WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Asset not found' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch asset' });
  }
});

// GET /api/gis/stats - Enhanced statistics with live data
router.get('/stats', async (req, res) => {
  try {
    const { rows: assetStats } = await db.query(`
      SELECT type, COUNT(*) as count,
        COUNT(*) FILTER (WHERE status = 'active') as active_count,
        COUNT(*) FILTER (WHERE status = 'offline') as offline_count
      FROM assets GROUP BY type ORDER BY count DESC
    `);
    
    const { rows: nodeStats } = await db.query(`
      SELECT 'sensor' as type, COUNT(*) as count,
        COUNT(*) FILTER (WHERE status = 'active') as active_count,
        COUNT(*) FILTER (WHERE status = 'offline') as offline_count
      FROM nodes
    `);
    
    const { rows: countyStats } = await db.query(`
      SELECT county, COUNT(*) as total_assets
      FROM assets WHERE county IS NOT NULL
      GROUP BY county ORDER BY total_assets DESC
    `);
    
    const { rows: liveReadings } = await db.query(`
      SELECT COUNT(*) as sensors_with_live_data
      FROM nodes 
      WHERE water_level IS NOT NULL 
         OR pressure IS NOT NULL 
         OR flow_rate IS NOT NULL
    `);
    
    const totalAssets = assetStats.reduce((sum, r) => sum + parseInt(r.count), 0) + (nodeStats[0]?.count || 0);
    const totalActive = assetStats.reduce((sum, r) => sum + parseInt(r.active_count), 0) + (nodeStats[0]?.active_count || 0);
    
    res.json({
      by_type: [...assetStats, ...nodeStats],
      by_county: countyStats,
      total_assets: totalAssets,
      total_active: totalActive,
      live_sensors: parseInt(liveReadings[0]?.sensors_with_live_data || 0)
    });
  } catch (error) {
    console.error('GIS Stats Error:', error);
    res.status(500).json({ error: 'Failed to fetch GIS statistics' });
  }
});

module.exports = router;
