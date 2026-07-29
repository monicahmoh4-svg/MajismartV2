const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/assets
router.get('/', async (req, res) => {
  try {
    const { county, type, status, search, limit = 100, offset = 0 } = req.query;
    
    // ONLY use columns guaranteed to exist from the GIS migration
    let query = `
      SELECT id, name, type, status, latitude, longitude, county, capacity, 
             diameter_mm, material, manufacturer, serial_number, created_at, updated_at
      FROM assets 
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL
    `;
    const params = [];
    let paramCount = 1;

    if (county) { params.push(county); query += ` AND county = $${paramCount++}`; }
    if (type) { params.push(type); query += ` AND type = $${paramCount++}`; }
    if (status) { params.push(status); query += ` AND status = $${paramCount++}`; }
    if (search) { 
      params.push(`%${search}%`); 
      query += ` AND (name ILIKE $${paramCount} OR serial_number ILIKE $${paramCount})`; 
      paramCount++; 
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    params.push(parseInt(limit), parseInt(offset));

    const { rows } = await db.query(query, params);
    
    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) FROM assets WHERE latitude IS NOT NULL AND longitude IS NOT NULL`;
    const countParams = [];
    let countParamCount = 1;
    if (county) { countParams.push(county); countQuery += ` AND county = $${countParamCount++}`; }
    if (type) { countParams.push(type); countQuery += ` AND type = $${countParamCount++}`; }
    if (status) { countParams.push(status); countQuery += ` AND status = $${countParamCount++}`; }
    if (search) { countParams.push(`%${search}%`); countQuery += ` AND (name ILIKE $${countParamCount} OR serial_number ILIKE $${countParamCount})`; countParamCount++; }
    
    const { rows: countResult } = await db.query(countQuery, countParams);

    res.json({ 
      assets: rows, 
      total: parseInt(countResult[0].count), 
      limit: parseInt(limit), 
      offset: parseInt(offset) 
    });
  } catch (error) {
    console.error('Assets list error:', error);
    res.status(500).json({ error: 'Failed to fetch assets', message: error.message });
  }
});

// GET /api/assets/stats
router.get('/stats', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT COUNT(*) as total_assets, COUNT(*) FILTER (WHERE status = 'active') as active
      FROM assets
    `);
    const { rows: byType } = await db.query(`
      SELECT type, COUNT(*) as count FROM assets GROUP BY type ORDER BY count DESC
    `);
    res.json({ ...rows[0], by_type: byType });
  } catch (error) {
    console.error('Asset stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/assets/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, name, type, status, latitude, longitude, county, capacity, diameter_mm, material, manufacturer, serial_number, created_at, updated_at 
       FROM assets WHERE id = $1`, 
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Asset not found' });
    
    res.json({ asset: rows[0], maintenance: [], inspections: [], attachments: [] });
  } catch (error) {
    console.error('Asset detail error:', error);
    res.status(500).json({ error: 'Failed to fetch asset' });
  }
});

// POST /api/assets
router.post('/', async (req, res) => {
  try {
    const { name, type, latitude, longitude, county, status, capacity, diameter_mm, material, manufacturer, serial_number } = req.body;
    if (!name || !type || !latitude || !longitude) {
      return res.status(400).json({ error: 'Name, type, latitude, and longitude are required' });
    }

    const { rows } = await db.query(
      `INSERT INTO assets (name, type, latitude, longitude, county, status, capacity, diameter_mm, material, manufacturer, serial_number) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [name, type, latitude, longitude, county, status || 'active', capacity || null, diameter_mm || null, material || null, manufacturer || null, serial_number || null]
    );
    res.status(201).json({ message: 'Asset created successfully', asset: rows[0] });
  } catch (error) {
    console.error('Asset create error:', error);
    res.status(500).json({ error: 'Failed to create asset', message: error.message });
  }
});

// PUT /api/assets/:id
router.put('/:id', async (req, res) => {
  try {
    const updates = req.body;
    const setClauses = [];
    const values = [];
    let paramCount = 1;
    
    // ONLY allow updates to guaranteed base columns
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
    values.push(req.params.id);

    const { rows } = await db.query(
      `UPDATE assets SET ${setClauses.join(', ')} WHERE id = $${paramCount} RETURNING *`, 
      values
    );
    
    if (rows.length === 0) return res.status(404).json({ error: 'Asset not found' });
    res.json({ message: 'Asset updated successfully', asset: rows[0] });
  } catch (error) {
    console.error('Asset update error:', error);
    res.status(500).json({ error: 'Failed to update asset', message: error.message });
  }
});

// DELETE /api/assets/:id
router.delete('/:id', async (req, res) => {
  try {
    const { rows } = await db.query('DELETE FROM assets WHERE id = $1 RETURNING *', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Asset not found' });
    res.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    console.error('Asset delete error:', error);
    res.status(500).json({ error: 'Failed to delete asset', message: error.message });
  }
});

// THIS LINE IS CRITICAL. DO NOT ADD CURLY BRACES.
module.exports = router;
