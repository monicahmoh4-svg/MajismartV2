const express = require('express');
const router = express.Router();
const db = require('../db');

function generateReportNumber() {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 90000) + 10000;
  return `RPT-${year}-${random}`;
}

async function tableExists(tableName) {
  try {
    const { rows } = await db.query(`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)`, [tableName]);
    return rows[0].exists;
  } catch (err) { return false; }
}

async function ensureReportsTables() {
  try {
    const { rows } = await db.query(`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'reports')`);
    
    if (!rows[0].exists) {
      console.log('🔧 Auto-creating reports tables (self-healing)...');
      
      await db.query(`
        CREATE TABLE reports (
          id SERIAL PRIMARY KEY,
          report_number VARCHAR(20) UNIQUE NOT NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          category VARCHAR(50) NOT NULL,
          priority VARCHAR(20) DEFAULT 'medium',
          status VARCHAR(30) DEFAULT 'submitted',
          reporter_name VARCHAR(255),
          reporter_email VARCHAR(255),
          reporter_phone VARCHAR(50),
          is_anonymous BOOLEAN DEFAULT false,
          latitude DECIMAL(10, 8),
          longitude DECIMAL(11, 8),
          address TEXT,
          county VARCHAR(100),
          ward VARCHAR(100),
          assigned_to VARCHAR(255),
          asset_id INTEGER,
          submitted_at TIMESTAMP DEFAULT NOW(),
          acknowledged_at TIMESTAMP,
          resolved_at TIMESTAMP,
          closed_at TIMESTAMP,
          resolution_notes TEXT,
          severity INTEGER DEFAULT 3,
          view_count INTEGER DEFAULT 0,
          upvotes INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log('✅ reports table created');

      await db.query(`CREATE TABLE IF NOT EXISTS report_attachments (id SERIAL PRIMARY KEY, report_id INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE, filename VARCHAR(255) NOT NULL, file_type VARCHAR(50), file_data TEXT NOT NULL, uploaded_by VARCHAR(255), created_at TIMESTAMP DEFAULT NOW())`);
      console.log('✅ report_attachments table created');

      await db.query(`CREATE TABLE IF NOT EXISTS report_comments (id SERIAL PRIMARY KEY, report_id INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE, author_name VARCHAR(255), author_role VARCHAR(50), comment TEXT NOT NULL, is_internal BOOLEAN DEFAULT false, created_at TIMESTAMP DEFAULT NOW())`);
      console.log('✅ report_comments table created');
    }
  } catch (error) {
    console.error('❌ Failed to ensure reports tables:', error.message);
    throw error;
  }
}

// GET /api/reports-enhanced
router.get('/', async (req, res) => {
  try {
    if (!(await tableExists('reports'))) return res.json({ reports: [], total: 0 });
    const { rows } = await db.query(`SELECT * FROM reports ORDER BY submitted_at DESC LIMIT 50`);
    const { rows: countResult } = await db.query(`SELECT COUNT(*) FROM reports`);
    res.json({ reports: rows, total: parseInt(countResult[0].count) });
  } catch (error) {
    console.error('Reports list error:', error);
    res.status(500).json({ error: 'Failed to fetch reports', message: error.message });
  }
});

// GET /api/reports-enhanced/stats
router.get('/stats', async (req, res) => {
  try {
    if (!(await tableExists('reports'))) return res.json({ total: 0, by_status: [], by_category: [], by_county: [] });
    const { rows: overview } = await db.query(`SELECT COUNT(*) as total_reports, COUNT(*) FILTER (WHERE status = 'submitted') as submitted, COUNT(*) FILTER (WHERE status = 'acknowledged') as acknowledged, COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress, COUNT(*) FILTER (WHERE status = 'resolved') as resolved, COUNT(*) FILTER (WHERE priority IN ('critical', 'high')) as high_priority, COUNT(*) FILTER (WHERE submitted_at > NOW() - INTERVAL '24 hours') as last_24h FROM reports`);
    const { rows: byCategory } = await db.query(`SELECT category, COUNT(*) as count FROM reports GROUP BY category ORDER BY count DESC`);
    const { rows: byCounty } = await db.query(`SELECT county, COUNT(*) as count FROM reports WHERE county IS NOT NULL GROUP BY county ORDER BY count DESC`);
    res.json({ ...overview[0], by_category: byCategory, by_county: byCounty });
  } catch (error) {
    console.error('Reports stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats', message: error.message });
  }
});

// GET /api/reports-enhanced/:id
router.get('/:id', async (req, res) => {
  try {
    if (!(await tableExists('reports'))) return res.status(404).json({ error: 'Reports table not found' });
    const { rows } = await db.query(`SELECT * FROM reports WHERE id = $1`, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Report not found' });
    await db.query(`UPDATE reports SET view_count = view_count + 1 WHERE id = $1`, [req.params.id]);
    
    let attachments = [], comments = [];
    if (await tableExists('report_attachments')) {
      const { rows: aRows } = await db.query(`SELECT id, filename, file_type, uploaded_by, created_at FROM report_attachments WHERE report_id = $1 ORDER BY created_at DESC`, [req.params.id]);
      attachments = aRows;
    }
    if (await tableExists('report_comments')) {
      const { rows: cRows } = await db.query(`SELECT * FROM report_comments WHERE report_id = $1 AND is_internal = false ORDER BY created_at ASC`, [req.params.id]);
      comments = cRows;
    }
    res.json({ report: rows[0], attachments, comments });
  } catch (error) {
    console.error('Report detail error:', error);
    res.status(500).json({ error: 'Failed to fetch report', message: error.message });
  }
});

// ✅ POST /api/reports-enhanced - MAXIMUM LOGGING
router.post('/', async (req, res) => {
  console.log('📥 POST /api/reports-enhanced - Received request')
  console.log('Request body:', JSON.stringify(req.body, null, 2))
  
  try {
    // 1. Test DB connection
    await db.query('SELECT 1')
    console.log('✅ DB connection active')

    // 2. Ensure tables exist
    await ensureReportsTables()
    console.log('✅ Tables ensured')

    const { title, description, category, priority, reporter_name, reporter_email, reporter_phone, is_anonymous, latitude, longitude, address, county, ward, asset_id } = req.body

    if (!title || !description || !category) {
      console.error('❌ Missing required fields')
      return res.status(400).json({ error: 'title, description, and category are required' })
    }

    const reportNumber = generateReportNumber()
    console.log('🔢 Generated report number:', reportNumber)

    const { rows } = await db.query(
      `INSERT INTO reports (report_number, title, description, category, priority, reporter_name, reporter_email, reporter_phone, is_anonymous, latitude, longitude, address, county, ward, asset_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [reportNumber, title, description, category, priority || 'medium', is_anonymous ? 'Anonymous' : reporter_name, reporter_email, reporter_phone, is_anonymous || false, latitude, longitude, address, county, ward, asset_id]
    )

    console.log('✅ Report created successfully in DB, ID:', rows[0].id)

    res.status(201).json({ message: 'Report submitted successfully', report: rows[0], report_number: reportNumber })
  } catch (error) {
    console.error('❌ CRITICAL Report create error:', error)
    console.error('❌ Error stack:', error.stack)
    res.status(500).json({ error: 'Failed to submit report', message: error.message, details: error.toString() })
  }
});

// PUT /api/reports-enhanced/:id
router.put('/:id', async (req, res) => {
  try {
    const updates = req.body;
    const setClauses = [];
    const values = [];
    let paramCount = 1;
    const allowedFields = ['status', 'priority', 'assigned_to', 'resolution_notes', 'severity'];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        setClauses.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (updates.status === 'acknowledged') setClauses.push('acknowledged_at = NOW()');
    else if (updates.status === 'resolved') setClauses.push('resolved_at = NOW()');
    else if (updates.status === 'closed') setClauses.push('closed_at = NOW()');

    if (setClauses.length === 0) return res.status(400).json({ error: 'No valid fields to update' });
    setClauses.push('updated_at = NOW()');
    values.push(req.params.id);

    const { rows } = await db.query(`UPDATE reports SET ${setClauses.join(', ')} WHERE id = $${paramCount} RETURNING *`, values);
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

// POST /api/reports-enhanced/:id/comments
router.post('/:id/comments', async (req, res) => {
  try {
    if (!(await tableExists('report_comments'))) return res.status(503).json({ error: 'Comments system not available' });
    const { author_name, author_role, comment, is_internal } = req.body;
    if (!comment) return res.status(400).json({ error: 'comment is required' });

    const { rows } = await db.query(`INSERT INTO report_comments (report_id, author_name, author_role, comment, is_internal) VALUES ($1, $2, $3, $4, $5) RETURNING *`, [req.params.id, author_name || 'System', author_role || 'citizen', comment, is_internal || false]);
    res.status(201).json({ message: 'Comment added', comment: rows[0] });
  } catch (error) {
    console.error('Comment add error:', error);
    res.status(500).json({ error: 'Failed to add comment', message: error.message });
  }
});

// POST /api/reports-enhanced/:id/upvote
router.post('/:id/upvote', async (req, res) => {
  try {
    const { rows } = await db.query(`UPDATE reports SET upvotes = upvotes + 1 WHERE id = $1 RETURNING upvotes`, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Report not found' });
    res.json({ upvotes: rows[0].upvotes });
  } catch (error) {
    console.error('Upvote error:', error);
    res.status(500).json({ error: 'Failed to upvote' });
  }
});

module.exports = router;
