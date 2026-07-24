const router = require('express').Router();
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const { resolved, severity, limit = 50 } = req.query;
    let sql = `
      SELECT a.*, n.name as node_name, n.county, n.location
      FROM alerts a JOIN nodes n ON n.id=a.node_id WHERE 1=1
    `;
    const params = [];
    if (resolved !== undefined) { params.push(resolved === 'true'); sql += ` AND a.resolved=$${params.length}`; }
    if (severity) { params.push(severity); sql += ` AND a.severity=$${params.length}`; }
    params.push(parseInt(limit));
    sql += ` ORDER BY a.created_at DESC LIMIT $${params.length}`;
    const { rows } = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/resolve', authMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query(
      `UPDATE alerts SET resolved=true, resolved_at=NOW() WHERE id=$1 RETURNING *`,
      [req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { node_id, type, message, severity = 'warning' } = req.body;
    const { rows } = await db.query(
      `INSERT INTO alerts (node_id,type,message,severity) VALUES ($1,$2,$3,$4) RETURNING *`,
      [node_id, type, message, severity]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
