const db = require('../db');

async function runSensorMigrations() {
  console.log('📡 Running IoT Sensor Integration migrations...\n');

  try {
    // Create sensors table
    await db.query(`
      CREATE TABLE IF NOT EXISTS sensors (
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
    console.log('✅ sensors table created');

    // Create sensor_readings table
    await db.query(`
      CREATE TABLE IF NOT EXISTS sensor_readings (
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
    console.log('✅ sensor_readings table created');

    // Create sensor_alerts table
    await db.query(`
      CREATE TABLE IF NOT EXISTS sensor_alerts (
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
    console.log('✅ sensor_alerts table created');

    // Create indexes
    await db.query(`CREATE INDEX IF NOT EXISTS idx_sensor_readings_sensor_time ON sensor_readings (sensor_id, reading_time DESC)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_sensor_readings_time ON sensor_readings (reading_time DESC)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_sensor_alerts_unresolved ON sensor_alerts (resolved, created_at DESC)`);
    console.log('✅ Indexes created');

    // Seed sample sensors
    const sampleSensors = [
      { sensor_id: 'WQ-NBO-001', name: 'Kibera Water Quality Sensor', type: 'water_quality', county: 'Nairobi', latitude: -1.3031, longitude: 36.7989, manufacturer: 'Hach', model: 'HQ40d', serial_number: 'HQ2024001', installation_date: '2024-01-15', battery_level: 85, signal_strength: -65 },
      { sensor_id: 'WL-NBO-001', name: 'Karen Reservoir Level Sensor', type: 'water_level', county: 'Nairobi', latitude: -1.3099, longitude: 36.7096, manufacturer: 'Endress+Hauser', model: 'FMR60', serial_number: 'EH2024001', installation_date: '2024-02-10', battery_level: 92, signal_strength: -58 },
      { sensor_id: 'WQ-MBA-001', name: 'Nyali Water Quality Sensor', type: 'water_quality', county: 'Mombasa', latitude: -4.0167, longitude: 39.7000, manufacturer: 'Hach', model: 'HQ40d', serial_number: 'HQ2024002', installation_date: '2024-01-20', battery_level: 78, signal_strength: -72 },
      { sensor_id: 'FL-KSM-001', name: 'Kisumu Flow Meter', type: 'flow_rate', county: 'Kisumu', latitude: -0.0917, longitude: 34.7680, manufacturer: 'Badger Meter', model: 'Recordall', serial_number: 'BM2024001', installation_date: '2024-03-05', battery_level: 95, signal_strength: -55 },
      { sensor_id: 'PR-ELD-001', name: 'Eldoret Pressure Sensor', type: 'pressure', county: 'Uasin Gishu', latitude: 0.5143, longitude: 35.2698, manufacturer: 'WIKA', model: 'S-20', serial_number: 'WK2024001', installation_date: '2024-02-25', battery_level: 88, signal_strength: -62 }
    ];

    for (const sensor of sampleSensors) {
      await db.query(
        `INSERT INTO sensors (sensor_id, name, type, county, latitude, longitude, manufacturer, model, serial_number, installation_date, battery_level, signal_strength)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) ON CONFLICT (sensor_id) DO NOTHING`,
        [sensor.sensor_id, sensor.name, sensor.type, sensor.county, sensor.latitude, sensor.longitude, sensor.manufacturer, sensor.model, sensor.serial_number, sensor.installation_date, sensor.battery_level, sensor.signal_strength]
      );
    }
    console.log(`✅ Seeded ${sampleSensors.length} sample sensors`);

    // Seed sample readings (last 24 hours)
    const sensors = await db.query('SELECT id FROM sensors');
    const now = new Date();
    
    for (const sensor of sensors.rows) {
      for (let hours = 0; hours < 24; hours++) {
        const readingTime = new Date(now.getTime() - hours * 60 * 60 * 1000);
        
        // Generate realistic values based on sensor type
        const reading = {
          sensor_id: sensor.id,
          reading_time: readingTime,
          ph: 6.5 + Math.random() * 2,
          turbidity: Math.random() * 5,
          tds: 100 + Math.random() * 200,
          dissolved_oxygen: 6 + Math.random() * 4,
          conductivity: 200 + Math.random() * 300,
          chlorine: 0.2 + Math.random() * 0.8,
          water_level: 40 + Math.random() * 50,
          flow_rate: 50 + Math.random() * 100,
          pressure: 30 + Math.random() * 40,
          temperature: 20 + Math.random() * 10,
          battery_level: 70 + Math.floor(Math.random() * 30),
          signal_strength: -50 - Math.floor(Math.random() * 30),
          quality_flag: Math.random() > 0.9 ? 'warning' : 'good'
        };

        await db.query(
          `INSERT INTO sensor_readings (sensor_id, reading_time, ph, turbidity, tds, dissolved_oxygen, conductivity, chlorine, water_level, flow_rate, pressure, temperature, battery_level, signal_strength, quality_flag)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
          [reading.sensor_id, reading.reading_time, reading.ph, reading.turbidity, reading.tds, reading.dissolved_oxygen, reading.conductivity, reading.chlorine, reading.water_level, reading.flow_rate, reading.pressure, reading.temperature, reading.battery_level, reading.signal_strength, reading.quality_flag]
        );
      }
    }
    console.log('✅ Seeded 24 hours of sample sensor readings');

    console.log('\n🎉 IoT Sensor Integration migrations completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Sensor migration failed:', error.message);
    process.exit(1);
  }
}

runSensorMigrations();
