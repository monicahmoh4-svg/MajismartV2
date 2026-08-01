const express = require('express');
const router = express.Router();
const db = require('../db');

// Self-healing: ensure tables exist
async function ensureSensorTables() {
  try {
    const { rows } = await db.query(`
      SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sensors')
    `);

    if (!rows[0].exists) {
      console.log('🔧 Auto-creating sensor tables (self-healing)...');
      
      await db.query(`
        CREATE TABLE sensors (
          id SERIAL PRIMARY KEY,
          sensor_id VARCHAR(50) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          type VARCHAR(50) NOT NULL,
          location_id INTEGER,
          county VARCHAR(100),
          latitude DECIMAL(10, 8),
          longitude DECIMAL(11, 8),
          status VARCHAR(20) DEFAULT 'active',
          manufacturer VARCHAR(255),
          model VARCHAR(255),
          serial_number VARCHAR(100),
          installation_date DATE,
          last_calibration_date DATE,
          next_calibration_date DATE,
          battery_level INTEGER,
          signal_strength INTEGER,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      await db.query(`
        CREATE TABLE sensor_readings (
          id BIGSERIAL PRIMARY KEY,
          sensor_id INTEGER REFERENCES sensors(id) ON DELETE CASCADE,
          reading_time TIMESTAMP NOT NULL,
          ph DECIMAL(4, 2),
          turbidity DECIMAL(6, 2),
          tds DECIMAL(8, 2),
          dissolved_oxygen DECIMAL(6, 2),
          conductivity DECIMAL(8, 2),
          chlorine DECIMAL(6, 4),
          water_level DECIMAL(8, 2),
          flow_rate DECIMAL(8, 2),
          pressure DECIMAL(8, 2),
          temperature DECIMAL(5, 2),
          battery_level INTEGER,
          signal_strength INTEGER,
          quality_flag VARCHAR(20),
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      await db.query(`
        CREATE TABLE sensor_alerts (
          id SERIAL PRIMARY KEY,
          sensor_id INTEGER REFERENCES sensors(id) ON DELETE CASCADE,
          alert_type VARCHAR(50) NOT NULL,
          severity VARCHAR(20) NOT NULL,
          message TEXT NOT NULL,
          metric_name VARCHAR(50),
          current_value DECIMAL(10, 2),
          threshold_value DECIMAL(10, 2),
          acknowledged BOOLEAN DEFAULT false,
          acknowledged_by VARCHAR(255),
          acknowledged_at TIMESTAMP,
          resolved BOOLEAN DEFAULT false,
          resolved_by VARCHAR(255),
          resolved_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      console.log('✅ Sensor tables created');
    }
  } catch (error) {
    console.error('❌ Failed to ensure sensor tables:', error.message);
  }
}

// GET /api/sensors - List all sensors
router.get('/', async (req, res) => {
  try {
    await ensureSensorTables();

    const { type, county, status, limit = 100 } = req.query;
    let query = 'SELECT * FROM sensors WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (type) { params.push(type); query += ` AND type = $${paramCount++}`; }
    if (county) { params.push(county); query += ` AND county = $${paramCount++}`; }
    if (status) { params.push(status); query += ` AND status = $${paramCount++}`; }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount}`;
    params.push(parseInt(limit));

    const { rows } = await db.query(query, params);
    res.json({ sensors: rows, total: rows.length });
  } catch (error) {
    console.error('Sensors list error:', error);
    res.status(500).json({ error: 'Failed to fetch sensors', message: error.message });
  }
});

// GET /api/sensors/stats - Dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    await ensureSensorTables();

    const { rows } = await db.query(`
      SELECT 
        COUNT(*) as total_sensors,
        COUNT(*) FILTER (WHERE status = 'active') as active,
        COUNT(*) FILTER (WHERE status = 'offline') as offline,
        COUNT(*) FILTER (WHERE type = 'water_quality') as water_quality_sensors,
        COUNT(*) FILTER (WHERE type = 'water_level') as water_level_sensors,
        COUNT(*) FILTER (WHERE type = 'flow_rate') as flow_rate_sensors,
        COUNT(*) FILTER (WHERE type = 'pressure') as pressure_sensors,
        AVG(battery_level) as avg_battery_level
      FROM sensors
    `);

    const { rows: alertsCount } = await db.query(`
      SELECT COUNT(*) as unresolved_alerts FROM sensor_alerts WHERE resolved = false
    `);

    res.json({ ...rows[0], unresolved_alerts: alertsCount[0].unresolved_alerts });
  } catch (error) {
    console.error('Sensor stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats', message: error.message });
  }
});

// GET /api/sensors/:id/readings - Get sensor readings
router.get('/:id/readings', async (req, res) => {
  try {
    await ensureSensorTables();

    const { hours = 24 } = req.query;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const { rows } = await db.query(
      `SELECT * FROM sensor_readings 
       WHERE sensor_id = $1 AND reading_time >= $2 
       ORDER BY reading_time DESC`,
      [req.params.id, since]
    );

    res.json({ readings: rows, sensor_id: req.params.id, hours: parseInt(hours) });
  } catch (error) {
    console.error('Sensor readings error:', error);
    res.status(500).json({ error: 'Failed to fetch readings', message: error.message });
  }
});

// GET /api/sensors/:id/latest - Get latest reading
router.get('/:id/latest', async (req, res) => {
  try {
    await ensureSensorTables();

    const { rows } = await db.query(
      `SELECT * FROM sensor_readings 
       WHERE sensor_id = $1 
       ORDER BY reading_time DESC LIMIT 1`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No readings found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Latest reading error:', error);
    res.status(500).json({ error: 'Failed to fetch latest reading', message: error.message });
  }
});

// POST /api/sensors/ingest - Ingest sensor data (from IoT devices)
router.post('/ingest', async (req, res) => {
  try {
    await ensureSensorTables();

    const { sensor_id, reading_time, ph, turbidity, tds, dissolved_oxygen, conductivity, chlorine, water_level, flow_rate, pressure, temperature, battery_level, signal_strength } = req.body;

    if (!sensor_id || !reading_time) {
      return res.status(400).json({ error: 'sensor_id and reading_time are required' });
    }

    // Determine quality flag
    let quality_flag = 'good';
    if (ph && (ph < 6.5 || ph > 8.5)) quality_flag = 'warning';
    if (turbidity && turbidity > 5) quality_flag = 'warning';
    if (chlorine && (chlorine < 0.2 || chlorine > 1.0)) quality_flag = 'warning';

    const { rows } = await db.query(
      `INSERT INTO sensor_readings (sensor_id, reading_time, ph, turbidity, tds, dissolved_oxygen, conductivity, chlorine, water_level, flow_rate, pressure, temperature, battery_level, signal_strength, quality_flag)
       VALUES ((SELECT id FROM sensors WHERE sensor_id = $1), $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
      [sensor_id, reading_time, ph, turbidity, tds, dissolved_oxygen, conductivity, chlorine, water_level, flow_rate, pressure, temperature, battery_level, signal_strength, quality_flag]
    );

    // Create alert if quality is poor
    if (quality_flag === 'warning') {
      await db.query(
        `INSERT INTO sensor_alerts (sensor_id, alert_type, severity, message, metric_name, current_value)
         VALUES ((SELECT id FROM sensors WHERE sensor_id = $1), 'threshold_breach', 'medium', 'Water quality parameter outside normal range', 'quality', 0)`,
        [sensor_id]
      );
    }

    res.status(201).json({ message: 'Reading ingested', reading: rows[0] });
  } catch (error) {
    console.error('Sensor ingest error:', error);
    res.status(500).json({ error: 'Failed to ingest reading', message: error.message });
  }
});

// POST /api/sensors - Create new sensor
router.post('/', async (req, res) => {
  try {
    await ensureSensorTables();

    const { sensor_id, name, type, location_id, county, latitude, longitude, manufacturer, model, serial_number, installation_date } = req.body;

    if (!sensor_id || !name || !type) {
      return res.status(400).json({ error: 'sensor_id, name, and type are required' });
    }

    const { rows } = await db.query(
      `INSERT INTO sensors (sensor_id, name, type, location_id, county, latitude, longitude, manufacturer, model, serial_number, installation_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [sensor_id, name, type, location_id, county, latitude, longitude, manufacturer, model, serial_number, installation_date]
    );

    res.status(201).json({ message: 'Sensor created', sensor: rows[0] });
  } catch (error) {
    console.error('Sensor create error:', error);
    res.status(500).json({ error: 'Failed to create sensor', message: error.message });
  }
});

// PUT /api/sensors/:id - Update sensor
router.put('/:id', async (req, res) => {
  try {
    const updates = req.body;
    const setClauses = [];
    const values = [];
    let paramCount = 1;

    const allowedFields = ['name', 'type', 'status', 'battery_level', 'signal_strength', 'last_calibration_date', 'next_calibration_date'];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        setClauses.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (setClauses.length === 0) return res.status(400).json({ error: 'No valid fields to update' });

    setClauses.push('updated_at = NOW()');
    values.push(req.params.id);

    const { rows } = await db.query(
      `UPDATE sensors SET ${setClauses.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Sensor not found' });
    res.json({ message: 'Sensor updated', sensor: rows[0] });
  } catch (error) {
    console.error('Sensor update error:', error);
    res.status(500).json({ error: 'Failed to update sensor', message: error.message });
  }
});

// GET /api/sensors/alerts - Get unresolved alerts
router.get('/alerts', async (req, res) => {
  try {
    await ensureSensorTables();

    const { resolved = false, limit = 50 } = req.query;
    const { rows } = await db.query(
      `SELECT sa.*, s.name as sensor_name, s.sensor_id 
       FROM sensor_alerts sa 
       JOIN sensors s ON sa.sensor_id = s.id 
       WHERE sa.resolved = $1 
       ORDER BY sa.created_at DESC 
       LIMIT $2`,
      [resolved === 'true', parseInt(limit)]
    );

    res.json({ alerts: rows });
  } catch (error) {
    console.error('Sensor alerts error:', error);
    res.status(500).json({ error: 'Failed to fetch alerts', message: error.message });
  }
});

module.exports = router;
