const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/assets
router.get('/', async (req, res) => {
  try {
    const { county, type, status, condition, search, limit = 100, offset = 0 } = req.query;
    let query = `SELECT a.*, (SELECT COUNT(*) FROM asset_maintenance WHERE asset_id = a.id) as maintenance_count FROM assets a WHERE a.deleted_at IS NULL`;
    const params = [];
    let paramCount = 1;

    if (county) { params.push(county); query += ` AND a.county = $${paramCount++}`; }
    if (type) { params.push(type); query += ` AND a.type = $${paramCount++}`; }
    if (status) { params.push(status); query += ` AND a.status = $${paramCount++}`; }
    if (condition) { params.push(condition); query += ` AND a.condition = $${paramCount++}`; }
    if (search) { params.push(`%${search}%`); query += ` AND (a.name ILIKE $${paramCount} OR a.serial_number ILIKE $${paramCount})`; paramCount++; }

    query += ` ORDER BY a.created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    params.push(parseInt(limit), parseInt(offset));

    const { rows } = await db.query(query, params);
    const { rows: countResult } = await db.query(`SELECT COUNT(*) FROM assets WHERE deleted_at IS NULL`);

    res.json({ assets: rows, total: parseInt(countResult[0].count), limit: parseInt(limit), offset: parseInt(offset) });
  } catch (error) {
    console.error('Assets list error:', error);
    res.status(500).json({ error: 'Failed to fetch assets', message: error.message });
  }
});

// GET /api/assets/stats
router.get('/stats', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT COUNT(*) as total_assets, COUNT(*) FILTER (WHERE status = 'active') as active,
             COUNT(*) FILTER (WHERE condition = 'critical') as critical_condition
      FROM assets WHERE deleted_at IS NULL
    `);
    const { rows: byType } = await db.query(`SELECT type, COUNT(*) as count FROM assets WHERE deleted_at IS NULL GROUP BY type ORDER BY count DESC`);
    res.json({ ...rows[0], by_type: byType });
  } catch (error) {
    console.error('Asset stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/assets/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query(`SELECT * FROM assets WHERE id = $1 AND deleted_at IS NULL`, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Asset not found' });
    const { rows: maintenance } = await db.query(`SELECT * FROM asset_maintenance WHERE asset_id = $1 ORDER BY performed_at DESC`, [req.params.id]);
    res.json({ asset: rows[0], maintenance, inspections: [], attachments: [] });
  } catch (error) {
    console.error('Asset detail error:', error);
    res.status(500).json({ error: 'Failed to fetch asset' });
  }
});

// POST /api/assets
router.post('/', async (req, res) => {
  try {
    const { name, type, latitude, longitude, county, status, capacity, diameter_mm, material, manufacturer, serial_number } = req.body;
    if (!name || !type) return res.status(400).json({ error: 'Name and type are required' });

    const { rows } = await db.query(
      `INSERT INTO assets (name, type, latitude, longitude, county, status, capacity, diameter_mm, material, manufacturer, serial_number, condition) 
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'good') RETURNING *`,
      [name, type, latitude || null, longitude || null, county, status || 'active', capacity, diameter_mm, material, manufacturer, serial_number]
    );
    res.status(201).json({ message: 'Asset created', asset: rows[0] });
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
    const allowedFields = ['name', 'type', 'latitude', 'longitude', 'county', 'status', 'capacity', 'diameter_mm', 'material', 'manufacturer', 'serial_number', 'condition'];

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

    const { rows } = await db.query(`UPDATE assets SET ${setClauses.join(', ')} WHERE id = $${paramCount} AND deleted_at IS NULL RETURNING *`, values);
    if (rows.length === 0) return res.status(404).json({ error: 'Asset not found' });
    res.json({ message: 'Asset updated', asset: rows[0] });
  } catch (error) {
    console.error('Asset update error:', error);
    res.status(500).json({ error: 'Failed to update asset' });
  }
});

// DELETE /api/assets/:id
router.delete('/:id', async (req, res) => {
  try {
    const { rows } = await db.query(`UPDATE assets SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING *`, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Asset not found' });
    res.json({ message: 'Asset deleted' });
  } catch (error) {
    console.error('Asset delete error:', error);
    res.status(500).json({ error: 'Failed to delete asset' });
  }
});

// THIS LINE IS CRITICAL. DO NOT ADD CURLY BRACES.
module.exports = router;
