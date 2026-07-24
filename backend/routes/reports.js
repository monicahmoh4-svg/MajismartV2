const router = require('express').Router();
const db = require('../db');
const { authMiddleware, requireRole } = require('../middleware/auth');

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { type, description, county, location, latitude, longitude, photo_data, node_id } = req.body;
    if (!type || !description || !county) return res.status(400).json({ error: 'type, description and county are required' });
    if (photo_data && photo_data.length > 8_000_000) return res.status(413).json({ error: 'Photo too large' });
    const { rows: userRows } = await db.query('SELECT name, phone FROM users WHERE id=$1', [req.user.id]);
    const reporter = userRows[0] || {};
    const { rows } = await db.query(
      `INSERT INTO community_reports (reported_by,reporter_name,reporter_phone,type,description,county,location,latitude,longitude,photo_data,node_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id,type,description,county,location,latitude,longitude,status,created_at`,
      [req.user.id, reporter.name, reporter.phone, type, description, county, location||null, latitude||null, longitude||null, photo_data||null, node_id||null]
    );
    if (node_id) {
      await db.query(`INSERT INTO alerts (node_id,type,message,severity) VALUES ($1,'community_report',$2,'warning')`,
        [node_id, `Citizen report: ${type.replace('_',' ')} — ${description.slice(0,120)}`]);
    }
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, type, county: countyParam, limit = 100 } = req.query;
    let sql = `SELECT r.*,n.name as node_name,u.name as assigned_to_name FROM community_reports r LEFT JOIN nodes n ON n.id=r.node_id LEFT JOIN users u ON u.id=r.assigned_to WHERE 1=1`;
    const params = [];
    if (req.user.role === 'county_officer') {
      const { rows } = await db.query('SELECT county FROM users WHERE id=$1', [req.user.id]);
      const officerCounty = rows[0]?.county;
      if (officerCounty) { params.push(officerCounty); sql += ` AND r.county=$${params.length}`; }
    } else if (['community','operator'].includes(req.user.role)) {
      params.push(req.user.id); sql += ` AND r.reported_by=$${params.length}`;
    } else if (countyParam) { params.push(countyParam); sql += ` AND r.county=$${params.length}`; }
    if (status) { params.push(status); sql += ` AND r.status=$${params.length}`; }
    if (type)   { params.push(type);   sql += ` AND r.type=$${params.length}`; }
    params.push(parseInt(limit)); sql += ` ORDER BY r.created_at DESC LIMIT $${params.length}`;
    const { rows } = await db.query(sql, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/stats/summary', authMiddleware, async (req, res) => {
  try {
    let countyFilter = ''; const params = [];
    if (req.user.role === 'county_officer') {
      const { rows } = await db.query('SELECT county FROM users WHERE id=$1', [req.user.id]);
      if (rows[0]?.county) { params.push(rows[0].county); countyFilter = ` WHERE county=$1`; }
    }
    const { rows } = await db.query(
      `SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status='open') as open,
       COUNT(*) FILTER (WHERE status='in_progress') as in_progress,
       COUNT(*) FILTER (WHERE status='resolved') as resolved FROM community_reports${countyFilter}`, params);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT r.*,n.name as node_name,u.name as assigned_to_name FROM community_reports r LEFT JOIN nodes n ON n.id=r.node_id LEFT JOIN users u ON u.id=r.assigned_to WHERE r.id=$1`,
      [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Report not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id/status', authMiddleware, requireRole('admin','county_officer','operator'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['open','acknowledged','in_progress','resolved','rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
    const { rows } = await db.query(`UPDATE community_reports SET status=$1,updated_at=NOW() WHERE id=$2 RETURNING *`, [status, req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Report not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id/assign', authMiddleware, requireRole('admin','county_officer'), async (req, res) => {
  try {
    const { assigned_to } = req.body;
    const { rows } = await db.query(`UPDATE community_reports SET assigned_to=$1,status='acknowledged',updated_at=NOW() WHERE id=$2 RETURNING *`, [assigned_to, req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Report not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
