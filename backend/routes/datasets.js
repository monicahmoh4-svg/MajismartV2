const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/datasets/water-quality
router.get('/water-quality', async (req, res) => {
  try {
    // Real readings only. When none exist we return an EMPTY set with
    // source:'empty' — never invented sample rows presented as measurements.
    const query = `
      SELECT location, quality_index, ph, turbidity, recorded_at
      FROM water_quality_readings
      ORDER BY recorded_at DESC
      LIMIT 50
    `;
    const { rows } = await db.query(query).catch(() => ({ rows: [] }));

    res.json({ data: rows, source: rows.length > 0 ? 'live' : 'empty' });
  } catch (error) {
    console.error('Error fetching water quality datasets:', error);
    res.status(500).json({ error: 'Failed to fetch water quality datasets' });
  }
});

// GET /api/datasets/infrastructure
router.get('/infrastructure', async (req, res) => {
  try {
    const query = `
      SELECT type, name, status, latitude, longitude 
      FROM assets 
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL
      LIMIT 100
    `;
    const { rows } = await db.query(query).catch(() => ({ rows: [] }));
    res.json({ data: rows });
  } catch (error) {
    console.error('Error fetching infrastructure datasets:', error);
    res.status(500).json({ data: [] }); // Fail gracefully so frontend doesn't break
  }
});

// GET /api/datasets/county-stats
router.get('/county-stats', async (req, res) => {
  try {
    const query = `
      SELECT county, COUNT(*) as total_nodes, 
             SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_nodes
      FROM nodes 
      GROUP BY county
    `;
    const { rows } = await db.query(query).catch(() => ({ rows: [] }));
    res.json({ data: rows });
  } catch (error) {
    console.error('Error fetching county stats datasets:', error);
    res.status(500).json({ data: [] }); // Fail gracefully
  }
});

module.exports = router;
