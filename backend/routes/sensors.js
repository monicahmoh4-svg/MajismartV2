const router = require('express').Router();
const db = require('../db');

// GET /api/sensors/:nodeId/latest
router.get('/:nodeId/latest', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM sensor_readings WHERE node_id=$1 ORDER BY recorded_at DESC LIMIT 1`,
      [req.params.nodeId]
    );
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sensors/:nodeId/history?hours=24
router.get('/:nodeId/history', async (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const { rows } = await db.query(
      `SELECT * FROM sensor_readings
       WHERE node_id=$1 AND recorded_at > NOW() - ($2 * interval '1 hour')
       ORDER BY recorded_at ASC`,
      [req.params.nodeId, hours]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sensors/:nodeId/reading - IoT device posts data
router.post('/:nodeId/reading', async (req, res) => {
  try {
    const { water_level, flow_rate, turbidity, temperature, ph } = req.body;
    const { rows } = await db.query(
      `INSERT INTO sensor_readings (node_id,water_level,flow_rate,turbidity,temperature,ph)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.params.nodeId, water_level, flow_rate, turbidity, temperature, ph]
    );
    await db.query(`UPDATE nodes SET last_reading=NOW() WHERE id=$1`, [req.params.nodeId]);
    // Auto-alert if critical
    if (water_level !== undefined && water_level < 20) {
      await db.query(
        `INSERT INTO alerts (node_id,type,message,severity) VALUES ($1,'low_water','Tank level at '||$2||'%','critical')`,
        [req.params.nodeId, water_level]
      );
    }
    if (turbidity !== undefined && turbidity > 4) {
      await db.query(
        `INSERT INTO alerts (node_id,type,message,severity) VALUES ($1,'high_turbidity','Turbidity '||$2||' NTU exceeds WHO limit','warning')`,
        [req.params.nodeId, turbidity]
      );
    }
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sensors/all/latest - all nodes latest readings
router.get('/all/latest', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT DISTINCT ON (node_id) sr.*, n.name as node_name, n.county, n.status
      FROM sensor_readings sr
      JOIN nodes n ON n.id = sr.node_id
      ORDER BY node_id, recorded_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
