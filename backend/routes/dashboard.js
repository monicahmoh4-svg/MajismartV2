const router = require('express').Router();
const db = require('../db');

// GET /api/dashboard/summary - main dashboard stats
router.get('/summary', async (req, res) => {
  try {
    const [nodes, payments, alerts, sensor] = await Promise.all([
      db.query(`SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status='active') as active,
        COUNT(*) FILTER (WHERE status='warning') as warning,
        COUNT(*) FILTER (WHERE status='offline') as offline
        FROM nodes`),
      db.query(`SELECT
        COALESCE(SUM(amount_ksh) FILTER (WHERE status='completed'),0) as total_revenue,
        COALESCE(SUM(litres) FILTER (WHERE status='completed'),0) as total_litres,
        COUNT(*) FILTER (WHERE status='completed') as total_transactions,
        COALESCE(SUM(amount_ksh) FILTER (WHERE status='completed' AND created_at > NOW()-interval '24h'),0) as today_revenue
        FROM payments`),
      db.query(`SELECT
        COUNT(*) FILTER (WHERE resolved=false) as open,
        COUNT(*) FILTER (WHERE resolved=false AND severity='critical') as critical,
        COUNT(*) FILTER (WHERE resolved=false AND severity='warning') as warning
        FROM alerts`),
      db.query(`SELECT
        ROUND(AVG(water_level)) as avg_level,
        ROUND(AVG(turbidity)::numeric,2) as avg_turbidity,
        COUNT(*) FILTER (WHERE recorded_at > NOW()-interval '1h') as readings_last_hour
        FROM sensor_readings WHERE recorded_at > NOW()-interval '24h'`)
    ]);

    res.json({
      nodes: nodes.rows[0],
      payments: payments.rows[0],
      alerts: alerts.rows[0],
      sensor: sensor.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/revenue-chart?days=7
router.get('/revenue-chart', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const { rows } = await db.query(`
      SELECT
        DATE(created_at) as date,
        COALESCE(SUM(amount_ksh),0) as revenue,
        COUNT(*) as transactions,
        COALESCE(SUM(litres),0) as litres
      FROM payments
      WHERE status='completed' AND created_at > NOW() - ($1 * interval '1 day')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, [days]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/water-levels - current levels for all nodes
router.get('/water-levels', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT DISTINCT ON (n.id)
        n.id, n.name, n.county, n.status, n.type,
        sr.water_level, sr.turbidity, sr.flow_rate, sr.recorded_at
      FROM nodes n
      LEFT JOIN sensor_readings sr ON sr.node_id=n.id
      ORDER BY n.id, sr.recorded_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/county-stats
router.get('/county-stats', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT
        n.county,
        COUNT(DISTINCT n.id) as nodes,
        COUNT(DISTINCT n.id) FILTER (WHERE n.status='active') as active_nodes,
        COALESCE(SUM(p.amount_ksh) FILTER (WHERE p.status='completed'),0) as revenue,
        COALESCE(SUM(p.litres) FILTER (WHERE p.status='completed'),0) as litres_dispensed
      FROM nodes n
      LEFT JOIN payments p ON p.node_id=n.id
      GROUP BY n.county ORDER BY revenue DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/maintenance
router.get('/maintenance', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT ml.*, n.name as node_name, u.name as technician_name
      FROM maintenance_logs ml
      JOIN nodes n ON n.id=ml.node_id
      LEFT JOIN users u ON u.id=ml.user_id
      ORDER BY ml.created_at DESC LIMIT 20
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/maintenance', async (req, res) => {
  try {
    const { node_id, description, type, cost_ksh, user_id } = req.body;
    const { rows } = await db.query(
      `INSERT INTO maintenance_logs (node_id,user_id,description,type,cost_ksh) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [node_id, user_id, description, type, cost_ksh]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
