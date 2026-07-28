const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/operator/dashboard-stats
router.get('/dashboard-stats', async (req, res) => {
  try {
    const [
      waterPointsResult,
      activeNodesResult,
      alertsResult,
      workOrdersResult,
      maintenanceResult
    ] = await Promise.all([
      db.query('SELECT COUNT(*) as count FROM nodes').catch(() => ({ rows: [{ count: 0 }] })),
      db.query("SELECT COUNT(*) as count FROM nodes WHERE status = 'active'").catch(() => ({ rows: [{ count: 0 }] })),
      db.query('SELECT COUNT(*) as count FROM alerts WHERE resolved = false').catch(() => ({ rows: [{ count: 0 }] })),
      db.query('SELECT COUNT(*) as count FROM reports WHERE status = $1', ['open']).catch(() => ({ rows: [{ count: 0 }] })),
      db.query('SELECT COUNT(*) as count FROM reports WHERE status = $1', ['in_progress']).catch(() => ({ rows: [{ count: 0 }] }))
    ]);

    res.json({
      water_points: parseInt(waterPointsResult.rows[0]?.count || 0),
      active_nodes: parseInt(activeNodesResult.rows[0]?.count || 0),
      active_alerts: parseInt(alertsResult.rows[0]?.count || 0),
      work_orders: parseInt(workOrdersResult.rows[0]?.count || 0),
      maintenance_tasks: parseInt(maintenanceResult.rows[0]?.count || 0),
      last_updated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Operator Dashboard Stats Error:', error);
    res.json({
      water_points: 0,
      active_nodes: 0,
      active_alerts: 0,
      work_orders: 0,
      maintenance_tasks: 0,
      last_updated: new Date().toISOString()
    });
  }
});

module.exports = router;
