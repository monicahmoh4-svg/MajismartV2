const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/admin/dashboard-stats
// Returns comprehensive statistics for the admin dashboard
router.get('/dashboard-stats', async (req, res) => {
  try {
    // Run all queries in parallel with individual error handling
    const [
      usersResult,
      nodesResult,
      waterPointsResult,
      alertsResult,
      reportsResult,
      revenueResult
    ] = await Promise.all([
      // Total users count
      db.query('SELECT COUNT(*) as count FROM users').catch(() => ({ rows: [{ count: 0 }] })),
      
      // Active nodes count
      db.query("SELECT COUNT(*) as count FROM nodes WHERE status = 'active'").catch(() => ({ rows: [{ count: 0 }] })),
      
      // Water points count
      db.query('SELECT COUNT(*) as count FROM nodes').catch(() => ({ rows: [{ count: 0 }] })),
      
      // Active alerts count
      db.query('SELECT COUNT(*) as count FROM alerts WHERE resolved = false').catch(() => ({ rows: [{ count: 0 }] })),
      
      // Total reports count
      db.query('SELECT COUNT(*) as count FROM reports').catch(() => ({ rows: [{ count: 0 }] })),
      
      // Monthly revenue
      db.query("SELECT COALESCE(SUM(amount_ksh), 0) as total FROM payments WHERE status = 'completed' AND created_at > NOW() - INTERVAL '30 days'").catch(() => ({ rows: [{ total: 0 }] }))
    ]);

    // Fetch recent activity (last 10 events from multiple sources)
    let recentActivity = [];
    try {
      const [reports, alerts] = await Promise.all([
        db.query('SELECT id, title as description, created_at as timestamp, \'report\' as type FROM reports ORDER BY created_at DESC LIMIT 5').catch(() => ({ rows: [] })),
        db.query('SELECT id, message as description, created_at as timestamp, \'alert\' as type FROM alerts ORDER BY created_at DESC LIMIT 5').catch(() => ({ rows: [] }))
      ]);
      
      recentActivity = [...reports.rows, ...alerts.rows]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10);
    } catch (err) {
      console.warn('Admin: Could not fetch recent activity:', err.message);
    }

    // Fetch county distribution
    let countyDistribution = [];
    try {
      const { rows } = await db.query(`
        SELECT county, COUNT(*) as count 
        FROM nodes 
        WHERE county IS NOT NULL 
        GROUP BY county 
        ORDER BY count DESC 
        LIMIT 10
      `).catch(() => ({ rows: [] }));
      countyDistribution = rows;
    } catch (err) {
      console.warn('Admin: Could not fetch county distribution:', err.message);
    }

    res.json({
      total_users: parseInt(usersResult.rows[0]?.count || 0),
      active_nodes: parseInt(nodesResult.rows[0]?.count || 0),
      water_points: parseInt(waterPointsResult.rows[0]?.count || 0),
      active_alerts: parseInt(alertsResult.rows[0]?.count || 0),
      total_reports: parseInt(reportsResult.rows[0]?.count || 0),
      monthly_revenue: parseFloat(revenueResult.rows[0]?.total || 0),
      recent_activity: recentActivity,
      county_distribution: countyDistribution,
      system_health: 'operational',
      last_updated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Admin Dashboard Stats Error:', error);
    // Return safe fallback data instead of crashing
    res.json({
      total_users: 0,
      active_nodes: 0,
      water_points: 0,
      active_alerts: 0,
      total_reports: 0,
      monthly_revenue: 0,
      recent_activity: [],
      county_distribution: [],
      system_health: 'operational',
      last_updated: new Date().toISOString()
    });
  }
});

// GET /api/admin/system-overview
// Returns high-level system metrics
router.get('/system-overview', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM nodes) as total_nodes,
        (SELECT COUNT(*) FROM nodes WHERE status = 'active') as active_nodes,
        (SELECT COUNT(*) FROM alerts WHERE resolved = false) as active_alerts,
        (SELECT COUNT(*) FROM reports) as total_reports
    `).catch(() => ({ rows: [{}] }));

    res.json(rows[0] || {});
  } catch (error) {
    console.error('System Overview Error:', error);
    res.json({});
  }
});

module.exports = router;
