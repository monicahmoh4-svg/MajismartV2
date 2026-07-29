const express = require('express');
const router = express.Router();
const db = require('../db');

// Helper: Generate report number
function generateReportNumber() {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 90000) + 10000;
  return `RPT-${year}-${random}`;
}

// Helper: Check if table exists
async function tableExists(tableName) {
  try {
    const { rows } = await db.query(
      `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)`,
      [tableName]
    );
    return rows[0].exists;
  } catch (err) { return false; }
}

// GET /api/reports-enhanced - List all reports with filters
router.get('/', async (req, res) => {
  try {
    if (!(await tableExists('reports'))) {
      return res.json({ reports: [], total: 0 });
    }

    const { status, category, priority, county, search, limit = 50, offset = 0 } = req.query;
    
    let query = `SELECT * FROM reports WHERE 1=1`;
    const params = [];
    let paramCount = 1;

    if (status) { params.push(status); query += ` AND status = $${paramCount++}`; }
    if (category) { params.push(category); query += ` AND category = $${paramCount++}`; }
    if (priority) { params.push(priority); query += ` AND priority = $${paramCount++}`; }
    if (county) { params.push(county); query += ` AND county = $${paramCount++}`; }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (title ILIKE $${paramCount} OR description ILIKE $${paramCount} OR report_number ILIKE $${paramCount})`;
      paramCount++;
    }

    query += ` ORDER BY 
      CASE priority 
        WHEN 'critical' THEN 1 
        WHEN 'high' THEN 2 
        WHEN 'medium' THEN 3 
        WHEN 'low' THEN 4 
      END,
      submitted_at DESC 
      LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    params.push(parseInt(limit), parseInt(offset));

    const { rows } = await db.query(query, params);
    
    // Get total count
    let countQuery = `SELECT COUNT(*) FROM reports WHERE 1=1`;
    const countParams = [];
    let countParamCount = 1;
    if (status) { countParams.push(status); countQuery += ` AND status = $${countParamCount++}`; }
    if (category) { countParams.push(category); countQuery += ` AND category = $${countParamCount++}`; }
    if (priority) { countParams.push(priority); countQuery += ` AND priority = $${countParamCount++}`; }
    if (county) { countParams.push(county); countQuery += ` AND county = $${countParamCount++}`; }
    
    const { rows: countResult } = await db.query(countQuery, countParams);

    res.json({
      reports: rows,
      total: parseInt(countResult[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Reports list error:', error);
    res.status(500).json({ error: 'Failed to fetch reports', message: error.message });
  }
});

// GET /api/reports-enhanced/stats - Dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    if (!(await tableExists('reports'))) {
      return res.json({ total: 0, by_status: [], by_category: [], by_county: [] });
    }

    const { rows: overview } = await db.query(`
      SELECT
        COUNT(*) as total_reports,
        COUNT(*) FILTER (WHERE status = 'submitted') as submitted,
        COUNT(*) FILTER (WHERE status = 'acknowledged') as acknowledged,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'resolved') as resolved,
        COUNT(*) FILTER (WHERE status = 'closed') as closed,
        COUNT(*) FILTER (WHERE priority IN ('critical', 'high')) as high_priority,
        COUNT(*) FILTER (WHERE submitted_at > NOW() - INTERVAL '24 hours') as last_24h,
        COUNT(*) FILTER (WHERE submitted_at > NOW() - INTERVAL '7 days') as last_7d,
        AVG(EXTRACT(EPOCH FROM (resolved_at - submitted_at)) / 3600) FILTER (WHERE resolved_at IS NOT NULL) as avg_resolution_hours
      FROM reports
    `);

    const { rows: byStatus } = await db.query(`
      SELECT status, COUNT(*) as count FROM reports GROUP BY status ORDER BY count DESC
    `);

    const { rows: byCategory } = await db.query(`
      SELECT category, COUNT(*) as count FROM reports GROUP BY category ORDER BY count DESC
    `);

    const { rows: byCounty } = await db.query(`
      SELECT county, COUNT(*) as count FROM reports WHERE county IS NOT NULL GROUP BY county ORDER BY count DESC
    `);

    const { rows: byPriority } = await db.query(`
      SELECT priority, COUNT(*) as count FROM reports GROUP BY priority ORDER BY count DESC
    `);

    res.json({
      ...overview[0],
      by_status: byStatus,
      by_category: byCategory,
      by_county: byCounty,
      by_priority: byPriority
    });
  } catch (error) {
    console.error('Reports stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats', message: error.message });
  }
});

// GET /api/reports-enhanced/hotspots - Geographic hotspots
router.get('/hotspots', async (req, res) => {
  try {
    if (!(await tableExists('reports'))) {
      return res.json({ hotspots: [] });
    }

    const { rows } = await db.query(`
      SELECT 
        latitude, longitude, county,
        COUNT(*) as report_count,
        ARRAY_AGG(category) as categories,
        MAX(submitted_at) as latest_report
      FROM reports
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL
      GROUP BY latitude, longitude, county
      HAVING COUNT(*) >= 1
      ORDER BY report_count DESC
      LIMIT 100
    `);

    res.json({ hotspots: rows });
  } catch (error) {
    console.error('Reports hotspots error:', error);
    res.status(500).json({ error: 'Failed to fetch hotspots', message: error.message });
  }
});

// GET /api/reports-enhanced/:id - Single report with all details
router.get('/:id', async (req, res) => {
  try {
    if (!(await tableExists('reports'))) {
      return res.status(404).json({ error: 'Reports table not found' });
    }

    const { rows } = await db.query(`SELECT * FROM reports WHERE id = $1`, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Report not found' });

    // Increment view count
    await db.query(`UPDATE reports SET view_count = view_count + 1 WHERE id = $1`, [req.params.id]);

    let attachments = [], comments = [];

    if (await tableExists('report_attachments')) {
      const { rows: aRows } = await db.query(
        `SELECT id, filename, file_type, uploaded_by, created_at FROM report_attachments WHERE report_id = $1 ORDER BY created_at DESC`,
        [req.params.id]
      );
      attachments = aRows;
    }

    if (await tableExists('report_comments')) {
      const { rows: cRows } = await db.query(
        `SELECT * FROM report_comments WHERE report_id = $1 AND is_internal = false ORDER BY created_at ASC`,
        [req.params.id]
      );
      comments = cRows;
    }

    res.json({ report: rows[0], attachments, comments });
  } catch (error) {
    console.error('Report detail error:', error);
    res.status(500).json({ error: 'Failed to fetch report', message: error.message });
  }
});

// POST /api/reports-enhanced - Submit new report
router.post('/', async (req, res) => {
  try {
    if (!(await tableExists('reports'))) {
      return res.status(503).json({ error: 'Reports system not available' });
    }

    const {
      title, description, category, priority,
      reporter_name, reporter_email, reporter_phone, is_anonymous,
      latitude, longitude, address, county, ward,
      asset_id
    } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ error: 'title, description, and category are required' });
    }

    const reportNumber = generateReportNumber();

    const { rows } = await db.query(
      `INSERT INTO reports (
        report_number, title, description, category, priority,
        reporter_name, reporter_email, reporter_phone, is_anonymous,
        latitude, longitude, address, county, ward, asset_id
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      RETURNING *`,
      [
        reportNumber, title, description, category, priority || 'medium',
        is_anonymous ? 'Anonymous' : reporter_name, reporter_email, reporter_phone, is_anonymous || false,
        latitude, longitude, address, county, ward, asset_id
      ]
    );

    res.status(201).json({ 
      message: 'Report submitted successfully', 
      report: rows[0],
      report_number: reportNumber
    });
  } catch (error) {
    console.error('Report create error:', error);
    res.status(500).json({ error: 'Failed to submit report', message: error.message });
  }
});

// PUT /api/reports-enhanced/:id - Update report (status, assignment, etc.)
router.put('/:id', async (req, res) => {
  try {
    const updates = req.body;
    const setClauses = [];
    const values = [];
    let paramCount = 1;

    const allowedFields = [
      'status', 'priority', 'assigned_to', 'assigned_user_id',
      'resolution_notes', 'resolution_category', 'severity'
    ];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        setClauses.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    // Auto-set timestamps based on status
    if (updates.status === 'acknowledged') {
      setClauses.push('acknowledged_at = NOW()');
    } else if (updates.status === 'in_progress') {
      setClauses.push('acknowledged_at = COALESCE(acknowledged_at, NOW())');
      if (updates.assigned_to) {
        setClauses.push('assigned_at = NOW()');
      }
    } else if (updates.status === 'resolved') {
      setClauses.push('resolved_at = NOW()');
    } else if (updates.status === 'closed') {
      setClauses.push('closed_at = NOW()');
    }

    if (setClauses.length === 0) return res.status(400).json({ error: 'No valid fields to update' });

    setClauses.push('updated_at = NOW()');
    values.push(req.params.id);

    const { rows } = await db.query(
      `UPDATE reports SET ${setClauses.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Report not found' });
    res.json({ message: 'Report updated', report: rows[0] });
  } catch (error) {
    console.error('Report update error:', error);
    res.status(500).json({ error: 'Failed to update report', message: error.message });
  }
});

// DELETE /api/reports-enhanced/:id
router.delete('/:id', async (req, res) => {
  try {
    const { rows } = await db.query('DELETE FROM reports WHERE id = $1 RETURNING *', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Report not found' });
    res.json({ message: 'Report deleted' });
  } catch (error) {
    console.error('Report delete error:', error);
    res.status(500).json({ error: 'Failed to delete report', message: error.message });
  }
});

// POST /api/reports-enhanced/:id/comments - Add comment
router.post('/:id/comments', async (req, res) => {
  try {
    if (!(await tableExists('report_comments'))) {
      return res.status(503).json({ error: 'Comments system not available' });
    }

    const { author_name, author_role, comment, is_internal } = req.body;
    if (!comment) return res.status(400).json({ error: 'comment is required' });

    const { rows } = await db.query(
      `INSERT INTO report_comments (report_id, author_name, author_role, comment, is_internal)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.params.id, author_name || 'System', author_role || 'citizen', comment, is_internal || false]
    );

    res.status(201).json({ message: 'Comment added', comment: rows[0] });
  } catch (error) {
    console.error('Comment add error:', error);
    res.status(500).json({ error: 'Failed to add comment', message: error.message });
  }
});

// POST /api/reports-enhanced/:id/attachments - Upload attachment
router.post('/:id/attachments', async (req, res) => {
  try {
    if (!(await tableExists('report_attachments'))) {
      return res.status(503).json({ error: 'Attachment system not available' });
    }

    const { filename, file_type, file_data, uploaded_by } = req.body;
    if (!filename || !file_data) return res.status(400).json({ error: 'filename and file_data are required' });

    const { rows } = await db.query(
      `INSERT INTO report_attachments (report_id, filename, file_type, file_data, uploaded_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, filename, file_type, uploaded_by, created_at`,
      [req.params.id, filename, file_type, file_data, uploaded_by]
    );

    res.status(201).json({ message: 'Attachment uploaded', attachment: rows[0] });
  } catch (error) {
    console.error('Attachment upload error:', error);
    res.status(500).json({ error: 'Failed to upload attachment', message: error.message });
  }
});

// POST /api/reports-enhanced/:id/upvote - Upvote a report
router.post('/:id/upvote', async (req, res) => {
  try {
    const { rows } = await db.query(
      `UPDATE reports SET upvotes = upvotes + 1 WHERE id = $1 RETURNING upvotes`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Report not found' });
    res.json({ upvotes: rows[0].upvotes });
  } catch (error) {
    console.error('Upvote error:', error);
    res.status(500).json({ error: 'Failed to upvote' });
  }
});

module.exports = router;
