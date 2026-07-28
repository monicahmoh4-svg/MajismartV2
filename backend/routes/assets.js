const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/assets - List all assets with filters
router.get('/', async (req, res) => {
  try {
    const { county, type, status, condition, search, limit = 100, offset = 0 } = req.query;
    let query = `
      SELECT a.*,
        (SELECT COUNT(*) FROM asset_maintenance WHERE asset_id = a.id) as maintenance_count,
        (SELECT COUNT(*) FROM asset_inspections WHERE asset_id = a.id) as inspection_count,
        (SELECT COUNT(*) FROM asset_attachments WHERE asset_id = a.id) as attachment_count
      FROM assets a
      WHERE a.deleted_at IS NULL
    `;
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

    const { rows: countResult } = await db.query(
      `SELECT COUNT(*) FROM assets WHERE deleted_at IS NULL`
    );

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

// GET /api/assets/stats - Summary statistics
router.get('/stats', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT
        COUNT(*) as total_assets,
        COUNT(*) FILTER (WHERE status = 'active') as active,
        COUNT(*) FILTER (WHERE status = 'maintenance') as under_maintenance,
        COUNT(*) FILTER (WHERE status = 'offline') as offline,
        COUNT(*) FILTER (WHERE condition = 'good') as good_condition,
        COUNT(*) FILTER (WHERE condition = 'fair') as fair_condition,
        COUNT(*) FILTER (WHERE condition = 'poor') as poor_condition,
        COUNT(*) FILTER (WHERE condition = 'critical') as critical_condition,
        COUNT(*) FILTER (WHERE next_inspection_date < NOW()) as overdue_inspections,
        COALESCE(SUM((SELECT COALESCE(SUM(cost_ksh), 0) FROM asset_maintenance WHERE asset_id = assets.id)), 0) as total_maintenance_cost
      FROM assets
      WHERE deleted_at IS NULL
    `);

    const { rows: byType } = await db.query(`
      SELECT type, COUNT(*) as count
      FROM assets WHERE deleted_at IS NULL
      GROUP BY type ORDER BY count DESC
    `);

    const { rows: byCounty } = await db.query(`
      SELECT county, COUNT(*) as count
      FROM assets WHERE deleted_at IS NULL AND county IS NOT NULL
      GROUP BY county ORDER BY count DESC
    `);

    res.json({
      ...rows[0],
      by_type: byType,
      by_county: byCounty
    });
  } catch (error) {
    console.error('Asset stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/assets/:id - Single asset with full details
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM assets WHERE id = $1 AND deleted_at IS NULL`,
      [req.params.id]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Asset not found' });

    const { rows: maintenance } = await db.query(
      `SELECT * FROM asset_maintenance WHERE asset_id = $1 ORDER BY performed_at DESC`,
      [req.params.id]
    );

    const { rows: inspections } = await db.query(
      `SELECT * FROM asset_inspections WHERE asset_id = $1 ORDER BY inspected_at DESC`,
      [req.params.id]
    );

    const { rows: attachments } = await db.query(
      `SELECT id, filename, file_type, uploaded_by, created_at FROM asset_attachments WHERE asset_id = $1 ORDER BY created_at DESC`,
      [req.params.id]
    );

    res.json({
      asset: rows[0],
      maintenance,
      inspections,
      attachments
    });
  } catch (error) {
    console.error('Asset detail error:', error);
    res.status(500).json({ error: 'Failed to fetch asset' });
  }
});

// POST /api/assets - Create new asset
router.post('/', async (req, res) => {
  try {
    const {
      name, type, latitude, longitude, county, status, capacity,
      diameter_mm, material, manufacturer, serial_number,
      expected_lifespan_years, notes
    } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }

    const { rows } = await db.query(
      `INSERT INTO assets (
        name, type, latitude, longitude, county, status, capacity,
        diameter_mm, material, manufacturer, serial_number,
        expected_lifespan_years, notes, condition
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'good')
      RETURNING *`,
      [name, type, latitude || null, longitude || null, county,
       status || 'active', capacity, diameter_mm, material,
       manufacturer, serial_number, expected_lifespan_years, notes]
    );

    res.status(201).json({ message: 'Asset created', asset: rows[0] });
  } catch (error) {
    console.error('Asset create error:', error);
    res.status(500).json({ error: 'Failed to create asset', message: error.message });
  }
});

// PUT /api/assets/:id - Update asset
router.put('/:id', async (req, res) => {
  try {
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

    if (setClauses.length === 0) return res.status(400).json({ error: 'No valid fields to update' });

    setClauses.push('updated_at = NOW()');
    values.push(req.params.id);

    const { rows } = await db.query(
      `UPDATE assets SET ${setClauses.join(', ')} WHERE id = $${paramCount} AND deleted_at IS NULL RETURNING *`,
      values
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Asset not found' });
    res.json({ message: 'Asset updated', asset: rows[0] });
  } catch (error) {
    console.error('Asset update error:', error);
    res.status(500).json({ error: 'Failed to update asset' });
  }
});

// DELETE /api/assets/:id - Soft delete
router.delete('/:id', async (req, res) => {
  try {
    const { rows } = await db.query(
      `UPDATE assets SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING *`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Asset not found' });
    res.json({ message: 'Asset deleted' });
  } catch (error) {
    console.error('Asset delete error:', error);
    res.status(500).json({ error: 'Failed to delete asset' });
  }
});

// POST /api/assets/:id/maintenance - Log maintenance
router.post('/:id/maintenance', async (req, res) => {
  try {
    const { maintenance_type, description, performed_by, cost_ksh, parts_used, next_due_date } = req.body;

    if (!maintenance_type) return res.status(400).json({ error: 'maintenance_type is required' });

    const { rows } = await db.query(
      `INSERT INTO asset_maintenance (asset_id, maintenance_type, description, performed_by, cost_ksh, parts_used, next_due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.params.id, maintenance_type, description, performed_by, cost_ksh, parts_used, next_due_date]
    );

    // Update asset's last maintenance date
    await db.query(
      `UPDATE assets SET last_maintenance_date = NOW() WHERE id = $1`,
      [req.params.id]
    );

    res.status(201).json({ message: 'Maintenance logged', record: rows[0] });
  } catch (error) {
    console.error('Maintenance log error:', error);
    res.status(500).json({ error: 'Failed to log maintenance' });
  }
});

// POST /api/assets/:id/inspection - Log inspection
router.post('/:id/inspection', async (req, res) => {
  try {
    const { inspector_name, condition_rating, findings, recommendations, next_inspection_date } = req.body;

    const { rows } = await db.query(
      `INSERT INTO asset_inspections (asset_id, inspector_name, condition_rating, findings, recommendations, next_inspection_date)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.params.id, inspector_name, condition_rating, findings, recommendations, next_inspection_date]
    );

    // Update asset's condition and next inspection date
    await db.query(
      `UPDATE assets SET 
        condition = COALESCE($2, condition),
        next_inspection_date = COALESCE($3, next_inspection_date)
       WHERE id = $1`,
      [req.params.id, condition_rating, next_inspection_date]
    );

    res.status(201).json({ message: 'Inspection logged', record: rows[0] });
  } catch (error) {
    console.error('Inspection log error:', error);
    res.status(500).json({ error: 'Failed to log inspection' });
  }
});

// POST /api/assets/:id/attachments - Upload attachment (base64)
router.post('/:id/attachments', async (req, res) => {
  try {
    const { filename, file_type, file_data, uploaded_by } = req.body;

    if (!filename || !file_data) {
      return res.status(400).json({ error: 'filename and file_data are required' });
    }

    const { rows } = await db.query(
      `INSERT INTO asset_attachments (asset_id, filename, file_type, file_data, uploaded_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, filename, file_type, uploaded_by, created_at`,
      [req.params.id, filename, file_type, file_data, uploaded_by]
    );

    res.status(201).json({ message: 'Attachment uploaded', attachment: rows[0] });
  } catch (error) {
    console.error('Attachment upload error:', error);
    res.status(500).json({ error: 'Failed to upload attachment' });
  }
});

// GET /api/assets/:id/attachments/:attachmentId - Get attachment data
router.get('/:id/attachments/:attachmentId', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM asset_attachments WHERE id = $1 AND asset_id = $2`,
      [req.params.attachmentId, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Attachment not found' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch attachment' });
  }
});

module.exports = router;
