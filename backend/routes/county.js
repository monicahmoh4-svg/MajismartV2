const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/county/dashboard-stats
router.get('/dashboard-stats', async (req, res) => {
  try {
    const county = req.query.county || '';

    const [
      waterPointsResult,
      activeNodesResult,
      alertsResult,
      reportsResult,
      populationResult
    ] = await Promise.all([
      db.query('SELECT COUNT(*) as count FROM nodes WHERE county = $1', [county]).catch(() => ({ rows: [{ count: 0 }] })),
      db.query("SELECT COUNT(*) as count FROM nodes WHERE county = $1 AND status = 'active'", [county]).catch(() => ({ rows: [{ count: 0 }] })),
      db.query('SELECT COUNT(*) as count FROM alerts WHERE resolved = false').catch(() => ({ rows: [{ count: 0 }] })),
      db.query('SELECT COUNT(*) as count FROM reports WHERE county = $1', [county]).catch(() => ({ rows: [{ count: 0 }] })),
      db.query('SELECT COUNT(*) as count FROM users WHERE county = $1', [county]).catch(() => ({ rows: [{ count: 0 }] }))
    ]);

    res.json({
      water_points: parseInt(waterPointsResult.rows[0]?.count || 0),
      active_nodes: parseInt(activeNodesResult.rows[0]?.count || 0),
      active_alerts: parseInt(alertsResult.rows[0]?.count || 0),
      reports: parseInt(reportsResult.rows[0]?.count || 0),
      population_served: parseInt(populationResult.rows[0]?.count || 0),
      county: county,
      last_updated: new Date().toISOString()
    });
  } catch (error) {
    console.error('County Dashboard Stats Error:', error);
    res.json({
      water_points: 0,
      active_nodes: 0,
      active_alerts: 0,
      reports: 0,
      population_served: 0,
      county: req.query.county || '',
      last_updated: new Date().toISOString()
    });
  }
});

module.exports = router;
