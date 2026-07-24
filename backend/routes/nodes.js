const router = require('express').Router();
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

// GET /api/nodes - list all nodes with latest reading
router.get('/', async (req, res) => {
  try {
    const { county, status } = req.query;
    let sql = `
      SELECT n.*,
        sr.water_level, sr.flow_rate, sr.turbidity, sr.temperature, sr.recorded_at as last_reading,
        COALESCE(p.total_revenue,0) as revenue_ksh,
        COALESCE(p.total_payments,0) as payment_count
      FROM nodes n
      LEFT JOIN LATERAL (
        SELECT * FROM sensor_readings WHERE node_id=n.id ORDER BY recorded_at DESC LIMIT 1
      ) sr ON true
      LEFT JOIN LATERAL (
        SELECT SUM(amount_ksh) as total_revenue, COUNT(*) as total_payments
        FROM payments WHERE node_id=n.id AND status='completed'
      ) p ON true
      WHERE 1=1
    `;
    const params = [];
    if (county) { params.push(county); sql += ` AND n.county=$${params.length}`; }
    if (status) { params.push(status); sql += ` AND n.status=$${params.length}`; }
    sql += ' ORDER BY n.created_at DESC';
    const { rows } = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/nodes/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT n.*,
        COALESCE(p.total_revenue,0) as revenue_ksh,
        COALESCE(p.total_payments,0) as payment_count,
        COALESCE(a.open_alerts,0) as open_alerts
      FROM nodes n
      LEFT JOIN LATERAL (SELECT SUM(amount_ksh) as total_revenue, COUNT(*) as total_payments FROM payments WHERE node_id=n.id AND status='completed') p ON true
      LEFT JOIN LATERAL (SELECT COUNT(*) as open_alerts FROM alerts WHERE node_id=n.id AND resolved=false) a ON true
      WHERE n.id=$1`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Node not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/nodes - create node
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, location, county, latitude, longitude, type, capacity_litres } = req.body;
    if (!name || !location || !county) return res.status(400).json({ error: 'Missing required fields' });
    const { rows } = await db.query(
      `INSERT INTO nodes (name,location,county,latitude,longitude,type,capacity_litres) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [name, location, county, latitude, longitude, type || 'borehole', capacity_litres || 10000]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/nodes/:id
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const fields = ['name','location','county','latitude','longitude','status','type','capacity_litres'];
    const updates = [], params = [];
    fields.forEach(f => {
      if (req.body[f] !== undefined) {
        params.push(req.body[f]);
        updates.push(`${f}=$${params.length}`);
      }
    });
    if (!updates.length) return res.status(400).json({ error: 'No fields to update' });
    params.push(req.params.id);
    const { rows } = await db.query(
      `UPDATE nodes SET ${updates.join(',')} WHERE id=$${params.length} RETURNING *`, params
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/nodes/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await db.query('DELETE FROM nodes WHERE id=$1', [req.params.id]);
    res.json({ message: 'Node deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
