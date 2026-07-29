const express = require('express');
const router = express.Router();
const db = require('../db');

async function columnExists(columnName) {
  try {
    const { rows } = await db.query(
      `SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'assets' AND column_name = $1)`,
      [columnName]
    );
    return rows[0].exists;
  } catch (err) { return false; }
}

async function tableExists(tableName) {
  try {
    const { rows } = await db.query(
      `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)`,
      [tableName]
    );
    return rows[0].exists;
  } catch (err) { return false; }
}

// ============================================
// ⚠️ CRITICAL: Static routes BEFORE /:id routes
// ============================================

// GET /api/assets/stats
router.get('/stats', async (req, res) => {
  try {
    const hasCondition = await columnExists('condition');
    const hasNextMaintenance = await columnExists('next_maintenance_date');
    const hasNextInspection = await columnExists('next_inspection_date');
    const hasWarranty = await columnExists('warranty_expires');
    const hasInstallationDate = await columnExists('installation_date');
    const hasMaintenanceTable = await tableExists('asset_maintenance');
    
    let baseStats = `
      SELECT
        COUNT(*) as total_assets,
        COUNT(*) FILTER (WHERE status = 'active') as active,
        COUNT(*) FILTER (WHERE status = 'maintenance') as under_maintenance,
        COUNT(*) FILTER (WHERE status = 'offline') as offline
    `;
    
    if (hasCondition) {
      baseStats += `,
        COUNT(*) FILTER (WHERE condition = 'good') as good_condition,
        COUNT(*) FILTER (WHERE condition = 'fair') as fair_condition,
        COUNT(*) FILTER (WHERE condition = 'poor') as poor_condition,
        COUNT(*) FILTER (WHERE condition = 'critical') as critical_condition
      `;
    } else {
      baseStats += `, 0 as good_condition, 0 as fair_condition, 0 as poor_condition, 0 as critical_condition`;
    }
    
    if (hasNextMaintenance) baseStats += `, COUNT(*) FILTER (WHERE next_maintenance_date < NOW()) as overdue_maintenance`;
    else baseStats += `, 0 as overdue_maintenance`;
    
    if (hasNextInspection) baseStats += `, COUNT(*) FILTER (WHERE next_inspection_date < NOW()) as overdue_inspections`;
    else baseStats += `, 0 as overdue_inspections`;
    
    if (hasWarranty) baseStats += `, COUNT(*) FILTER (WHERE warranty_expires < NOW() + INTERVAL '30 days' AND warranty_expires IS NOT NULL) as warranty_expiring`;
    else baseStats += `, 0 as warranty_expiring`;
    
    if (hasMaintenanceTable) baseStats += `, COALESCE((SELECT SUM(cost_ksh) FROM asset_maintenance), 0) as total_maintenance_cost`;
    else baseStats += `, 0 as total_maintenance_cost`;
    
    if (hasInstallationDate) baseStats += `, AVG(EXTRACT(YEAR FROM AGE(NOW(), installation_date))) as average_age_years`;
    else baseStats += `, 0 as average_age_years`;
    
    baseStats += ` FROM assets`;
    
    const { rows } = await db.query(baseStats);
    const { rows: byType } = await db.query(`SELECT type, COUNT(*) as count FROM assets GROUP BY type ORDER BY count DESC`);
    const { rows: byCounty } = await db.query(`SELECT county, COUNT(*) as count FROM assets WHERE county IS NOT NULL GROUP BY county ORDER BY count DESC`);
    
    let byCondition = [];
    if (hasCondition) {
      const { rows: condRows } = await db.query(`SELECT condition, COUNT(*) as count FROM assets GROUP BY condition ORDER BY count DESC`);
      byCondition = condRows;
    }

    res.json({ ...rows[0], by_type: byType, by_county: byCounty, by_condition: byCondition });
  } catch (error) {
    console.error('Asset stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats', message: error.message });
  }
});

// GET /api/assets/alerts
router.get('/alerts', async (req, res) => {
  try {
    const hasCondition = await columnExists('condition');
    const hasNextMaintenance = await columnExists('next_maintenance_date');
    const hasNextInspection = await columnExists('next_inspection_date');
    
    if (!hasCondition && !hasNextMaintenance && !hasNextInspection) {
      return res.json({ alerts: [] });
    }
    
    const conditions = [];
    if (hasNextMaintenance) conditions.push('next_maintenance_date < NOW()');
    if (hasNextInspection) conditions.push('next_inspection_date < NOW()');
    if (hasCondition) conditions.push("condition IN ('poor', 'critical')");
    
    let selectClause = 'SELECT id, name, type, county, status';
    if (hasCondition) selectClause += ', condition';
    if (hasNextMaintenance) selectClause += ', next_maintenance_date, EXTRACT(DAY FROM NOW() - next_maintenance_date) as days_overdue_maintenance';
    if (hasNextInspection) selectClause += ', next_inspection_date, EXTRACT(DAY FROM NOW() - next_inspection_date) as days_overdue_inspection';
    
    const { rows } = await db.query(`${selectClause} FROM assets WHERE ${conditions.join(' OR ')} ORDER BY created_at DESC LIMIT 50`);
    res.json({ alerts: rows });
  } catch (error) {
    console.error('Asset alerts error:', error);
    res.json({ alerts: [] });
  }
});

// ✅ GET /api/assets/export/csv - FIXED: Now BEFORE /:id route
router.get('/export/csv', async (req, res) => {
  try {
    console.log('📥 CSV export requested');
    
    const { rows } = await db.query(`
      SELECT id, name, type, status, county, latitude, longitude, 
             capacity, manufacturer, serial_number, created_at
      FROM assets ORDER BY county, type, name
    `);

    const csvRows = [
      ['ID', 'Name', 'Type', 'Status', 'County', 'Latitude', 'Longitude', 'Capacity', 'Manufacturer', 'Serial', 'Created At']
    ];

    rows.forEach(row => {
      csvRows.push([
        row.id, 
        row.name, 
        row.type, 
        row.status, 
        row.county || '',
        row.latitude, 
        row.longitude, 
        row.capacity || '', 
        row.manufacturer || '', 
        row.serial_number || '',
        row.created_at ? new Date(row.created_at).toISOString() : ''
      ]);
    });

    const csv = csvRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    
    // ✅ Add CORS headers explicitly
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=majismart-assets-${new Date().toISOString().split('T')[0]}.csv`);
    
    console.log(`✅ CSV export successful: ${rows.length} assets`);
    res.send(csv);
  } catch (error) {
    console.error('❌ CSV export error:', error);
    res.status(500).json({ error: 'Failed to export CSV', message: error.message });
  }
});

// GET /api/assets - List all assets
router.get('/', async (req, res) => {
  try {
    const { county, type, status, condition, search, limit = 100, offset = 0 } = req.query;
    
    const hasCondition = await columnExists('condition');
    const hasInstallationDate = await columnExists('installation_date');
    const hasNextMaintenance = await columnExists('next_maintenance_date');
    
    let selectColumns = `a.id, a.name, a.type, a.status, a.latitude, a.longitude, a.county, 
      a.capacity, a.diameter_mm, a.material, a.manufacturer, a.serial_number, a.created_at, a.updated_at`;
    
    if (hasCondition) selectColumns += `, a.condition`;
    if (hasInstallationDate) selectColumns += `, a.installation_date, EXTRACT(YEAR FROM AGE(NOW(), a.installation_date))::INTEGER as age_years`;
    if (hasNextMaintenance) selectColumns += `, a.next_maintenance_date`;
    
    const hasMaintenanceTable = await tableExists('asset_maintenance');
    if (hasMaintenanceTable) {
      selectColumns += `, (SELECT COUNT(*) FROM asset_maintenance WHERE asset_id = a.id) as maintenance_count`;
      selectColumns += `, (SELECT COALESCE(SUM(cost_ksh), 0) FROM asset_maintenance WHERE asset_id = a.id) as total_maintenance_cost`;
    } else {
      selectColumns += `, 0 as maintenance_count, 0 as total_maintenance_cost`;
    }
    
    let query = `SELECT ${selectColumns} FROM assets a WHERE 1=1`;
    const params = [];
    let paramCount = 1;

    if (county) { params.push(county); query += ` AND a.county = $${paramCount++}`; }
    if (type) { params.push(type); query += ` AND a.type = $${paramCount++}`; }
    if (status) { params.push(status); query += ` AND a.status = $${paramCount++}`; }
    if (condition && hasCondition) { params.push(condition); query += ` AND a.condition = $${paramCount++}`; }
    if (search) { 
      params.push(`%${search}%`); 
      query += ` AND (a.name ILIKE $${paramCount} OR a.serial_number ILIKE $${paramCount})`; 
      paramCount++; 
    }

    query += ` ORDER BY a.created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    params.push(parseInt(limit), parseInt(offset));

    const { rows } = await db.query(query, params);
    const { rows: countResult } = await db.query(`SELECT COUNT(*) FROM assets`);

    res.json({ assets: rows, total: parseInt(countResult[0].count), limit: parseInt(limit), offset: parseInt(offset) });
  } catch (error) {
    console.error('Assets list error:', error);
    res.status(500).json({ error: 'Failed to fetch assets', message: error.message });
  }
});

// GET /api/assets/:id
router.get('/:id', async (req, res) => {
  try {
    const hasInstallationDate = await columnExists('installation_date');
    
    let selectClause = `SELECT id, name, type, status, latitude, longitude, county, capacity, 
                               diameter_mm, material, manufacturer, serial_number, created_at, updated_at`;
    if (hasInstallationDate) {
      selectClause += `, installation_date, expected_lifespan_years, last_maintenance_date, 
                              next_maintenance_date, next_inspection_date, warranty_expires, 
                              condition, notes, qr_code,
                              EXTRACT(YEAR FROM AGE(NOW(), installation_date))::INTEGER as age_years`;
    }
    selectClause += ` FROM assets WHERE id = $1`;
    
    const { rows } = await db.query(selectClause, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Asset not found' });
    
    let maintenance = [], inspections = [], attachments = [];
    
    if (await tableExists('asset_maintenance')) {
      const { rows: mRows } = await db.query(`SELECT * FROM asset_maintenance WHERE asset_id = $1 ORDER BY performed_at DESC`, [req.params.id]);
      maintenance = mRows;
    }
    
    if (await tableExists('asset_inspections')) {
      const { rows: iRows } = await db.query(`SELECT * FROM asset_inspections WHERE asset_id = $1 ORDER BY inspected_at DESC`, [req.params.id]);
      inspections = iRows;
    }
    
    if (await tableExists('asset_attachments')) {
      const { rows: aRows } = await db.query(`SELECT id, filename, file_type, uploaded_by, created_at FROM asset_attachments WHERE asset_id = $1 ORDER BY created_at DESC`, [req.params.id]);
      attachments = aRows;
    }

    res.json({ asset: rows[0], maintenance, inspections, attachments });
  } catch (error) {
    console.error('Asset detail error:', error);
    res.status(500).json({ error: 'Failed to fetch asset', message: error.message });
  }
});

// POST /api/assets
router.post('/', async (req, res) => {
  try {
    const { name, type, latitude, longitude, county, status, capacity, diameter_mm, material, manufacturer, serial_number, installation_date, expected_lifespan_years, warranty_expires, notes } = req.body;
    if (!name || !type) return res.status(400).json({ error: 'Name and type are required' });

    const hasEnhancedColumns = await columnExists('installation_date');
    
    let insertQuery, insertParams;
    
    if (hasEnhancedColumns) {
      const qrCode = `ASSET-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      insertQuery = `INSERT INTO assets (name, type, latitude, longitude, county, status, capacity, diameter_mm, material, manufacturer, serial_number, installation_date, expected_lifespan_years, warranty_expires, notes, qr_code, condition) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,'good') RETURNING *`;
      insertParams = [name, type, latitude || null, longitude || null, county, status || 'active', capacity, diameter_mm, material, manufacturer, serial_number, installation_date, expected_lifespan_years || 25, warranty_expires, notes, qrCode];
    } else {
      insertQuery = `INSERT INTO assets (name, type, latitude, longitude, county, status, capacity, diameter_mm, material, manufacturer, serial_number) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`;
      insertParams = [name, type, latitude || null, longitude || null, county, status || 'active', capacity, diameter_mm, material, manufacturer, serial_number];
    }

    const { rows } = await db.query(insertQuery, insertParams);
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
    
    const baseFields = ['name', 'type', 'latitude', 'longitude', 'county', 'status', 'capacity', 'diameter_mm', 'material', 'manufacturer', 'serial_number'];
    const enhancedFields = ['condition', 'installation_date', 'expected_lifespan_years', 'last_maintenance_date', 'next_maintenance_date', 'next_inspection_date', 'warranty_expires', 'notes'];
    
    const allowedFields = [...baseFields];
    for (const field of enhancedFields) {
      if (await columnExists(field)) allowedFields.push(field);
    }

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

    const { rows } = await db.query(`UPDATE assets SET ${setClauses.join(', ')} WHERE id = $${paramCount} RETURNING *`, values);
    if (rows.length === 0) return res.status(404).json({ error: 'Asset not found' });
    res.json({ message: 'Asset updated', asset: rows[0] });
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
    res.json({ message: 'Asset deleted' });
  } catch (error) {
    console.error('Asset delete error:', error);
    res.status(500).json({ error: 'Failed to delete asset', message: error.message });
  }
});

// POST /api/assets/:id/maintenance
router.post('/:id/maintenance', async (req, res) => {
  try {
    if (!(await tableExists('asset_maintenance'))) return res.status(503).json({ error: 'Maintenance tracking not available' });
    
    const { maintenance_type, description, performed_by, cost_ksh, parts_used, next_due_date } = req.body;
    if (!maintenance_type) return res.status(400).json({ error: 'maintenance_type is required' });

    const { rows } = await db.query(
      `INSERT INTO asset_maintenance (asset_id, maintenance_type, description, performed_by, cost_ksh, parts_used, next_due_date) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.params.id, maintenance_type, description, performed_by, cost_ksh, parts_used, next_due_date]
    );

    if (await columnExists('last_maintenance_date')) {
      await db.query(`UPDATE assets SET last_maintenance_date = NOW(), next_maintenance_date = $2 WHERE id = $1`, [req.params.id, next_due_date]);
    }

    res.status(201).json({ message: 'Maintenance logged', record: rows[0] });
  } catch (error) {
    console.error('Maintenance log error:', error);
    res.status(500).json({ error: 'Failed to log maintenance', message: error.message });
  }
});

// POST /api/assets/:id/inspection
router.post('/:id/inspection', async (req, res) => {
  try {
    if (!(await tableExists('asset_inspections'))) return res.status(503).json({ error: 'Inspection tracking not available' });
    
    const { inspector_name, condition_rating, findings, recommendations, next_inspection_date } = req.body;

    const { rows } = await db.query(
      `INSERT INTO asset_inspections (asset_id, inspector_name, condition_rating, findings, recommendations, next_inspection_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.params.id, inspector_name, condition_rating, findings, recommendations, next_inspection_date]
    );

    if (await columnExists('condition')) {
      await db.query(`UPDATE assets SET condition = COALESCE($2, condition), next_inspection_date = COALESCE($3, next_inspection_date) WHERE id = $1`, [req.params.id, condition_rating, next_inspection_date]);
    }

    res.status(201).json({ message: 'Inspection logged', record: rows[0] });
  } catch (error) {
    console.error('Inspection log error:', error);
    res.status(500).json({ error: 'Failed to log inspection', message: error.message });
  }
});

// POST /api/assets/:id/attachments
router.post('/:id/attachments', async (req, res) => {
  try {
    if (!(await tableExists('asset_attachments'))) return res.status(503).json({ error: 'Attachment storage not available' });
    
    const { filename, file_type, file_data, uploaded_by } = req.body;
    if (!filename || !file_data) return res.status(400).json({ error: 'filename and file_data are required' });

    const { rows } = await db.query(
      `INSERT INTO asset_attachments (asset_id, filename, file_type, file_data, uploaded_by) VALUES ($1, $2, $3, $4, $5) RETURNING id, filename, file_type, uploaded_by, created_at`,
      [req.params.id, filename, file_type, file_data, uploaded_by]
    );

    res.status(201).json({ message: 'Attachment uploaded', attachment: rows[0] });
  } catch (error) {
    console.error('Attachment upload error:', error);
    res.status(500).json({ error: 'Failed to upload attachment', message: error.message });
  }
});

module.exports = router;
