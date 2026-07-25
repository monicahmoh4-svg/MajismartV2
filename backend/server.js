require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const app = express();

// DATABASE CONNECTION
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => console.error('Database error:', err));

// CORS
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((o) => o.trim().replace(/\/+$/, ''))
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const clean = origin.replace(/\/+$/, '');
    if (allowedOrigins.includes(clean) || process.env.NODE_ENV === 'production') {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const JWT_SECRET = process.env.JWT_SECRET || 'majismart_secret_key_2024';

// DROP AND RECREATE ALL TABLES TO FIX SCHEMA ISSUES
const initDB = async () => {
  try {
    // Drop existing tables in correct order
    await pool.query(`
      DROP TABLE IF EXISTS community_reports CASCADE;
      DROP TABLE IF EXISTS maintenance CASCADE;
      DROP TABLE IF EXISTS transactions CASCADE;
      DROP TABLE IF EXISTS alerts CASCADE;
      DROP TABLE IF EXISTS readings CASCADE;
      DROP TABLE IF EXISTS water_nodes CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);

    // Create tables with correct schema
    await pool.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'operator',
        county VARCHAR(100) DEFAULT '',
        phone VARCHAR(50) DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE water_nodes (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) DEFAULT 'borehole',
        location VARCHAR(255) DEFAULT '',
        county VARCHAR(100) DEFAULT '',
        latitude DECIMAL(10,6) DEFAULT 0,
        longitude DECIMAL(10,6) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'active',
        water_level INTEGER DEFAULT 50,
        flow_rate DECIMAL(10,2) DEFAULT 0,
        quality_index DECIMAL(5,2) DEFAULT 0,
        pressure DECIMAL(10,2) DEFAULT 0,
        last_reading TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        operator_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE readings (
        id SERIAL PRIMARY KEY,
        node_id INTEGER,
        flow_rate DECIMAL(10,2) DEFAULT 0,
        quality_index DECIMAL(5,2) DEFAULT 0,
        pressure DECIMAL(10,2) DEFAULT 0,
        ph_level DECIMAL(5,2) DEFAULT 7.0,
        turbidity DECIMAL(10,2) DEFAULT 0,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE alerts (
        id SERIAL PRIMARY KEY,
        node_id INTEGER,
        type VARCHAR(100) DEFAULT 'warning',
        message TEXT DEFAULT '',
        severity VARCHAR(50) DEFAULT 'medium',
        resolved BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        node_id INTEGER,
        amount DECIMAL(12,2) DEFAULT 0,
        type VARCHAR(50) DEFAULT 'payment',
        description TEXT DEFAULT '',
        status VARCHAR(50) DEFAULT 'completed',
        reference VARCHAR(255) DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE maintenance (
        id SERIAL PRIMARY KEY,
        node_id INTEGER,
        description TEXT DEFAULT '',
        status VARCHAR(50) DEFAULT 'pending',
        priority VARCHAR(50) DEFAULT 'medium',
        assigned_to INTEGER,
        scheduled_date TIMESTAMP,
        completed_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE community_reports (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        title VARCHAR(255) DEFAULT '',
        description TEXT DEFAULT '',
        category VARCHAR(100) DEFAULT 'general',
        type VARCHAR(100) DEFAULT 'other',
        county VARCHAR(100) DEFAULT '',
        location VARCHAR(255) DEFAULT '',
        latitude DECIMAL(10,6),
        longitude DECIMAL(10,6),
        status VARCHAR(50) DEFAULT 'open',
        upvotes INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ All database tables created successfully.');

    // Seed with real Kenyan data
    await seedRealData();
  } catch (err) {
    console.error('❌ Database initialization error:', err.message);
  }
};

// SEED REAL KENYAN COUNTY DATA
const seedRealData = async () => {
  try {
    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    await pool.query(
      `INSERT INTO users (name, email, password, role, county, phone) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       ON CONFLICT (email) DO NOTHING`,
      ['System Admin', 'admin@majismart.co.ke', adminPassword, 'admin', 'Nairobi', '+254700000000']
    );

    // Real Kenyan counties with coordinates
    const counties = [
      { name: 'Nairobi', lat: -1.2921, lng: 36.8219 },
      { name: 'Mombasa', lat: -4.0435, lng: 39.6682 },
      { name: 'Kisumu', lat: -0.0917, lng: 34.7680 },
      { name: 'Nakuru', lat: -0.3031, lng: 36.0800 },
      { name: 'Kiambu', lat: -1.1714, lng: 36.8356 },
      { name: 'Machakos', lat: -1.5177, lng: 37.2634 },
      { name: 'Kakamega', lat: 0.2827, lng: 34.7519 },
      { name: 'Meru', lat: 0.0469, lng: 37.6556 },
      { name: 'Kilifi', lat: -3.6305, lng: 39.8499 },
      { name: 'Uasin Gishu', lat: 0.5143, lng: 35.2698 },
    ];

    // Create water nodes for each county
    for (const county of counties) {
      for (let i = 1; i <= 3; i++) {
        const nodeLat = county.lat + (Math.random() - 0.5) * 0.1;
        const nodeLng = county.lng + (Math.random() - 0.5) * 0.1;
        const waterLevel = Math.floor(Math.random() * 60) + 30;
        const quality = Math.floor(Math.random() * 30) + 70;
        
        await pool.query(
          `INSERT INTO water_nodes (name, type, location, county, latitude, longitude, status, water_level, quality_index, flow_rate, pressure) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            `${county.name} Water Point ${i}`,
            i % 2 === 0 ? 'borehole' : 'kiosk',
            `${county.name} Central`,
            county.name,
            nodeLat,
            nodeLng,
            waterLevel > 50 ? 'active' : waterLevel > 30 ? 'warning' : 'offline',
            waterLevel,
            quality,
            Math.random() * 100,
            Math.random() * 50 + 20
          ]
        );
      }
    }

    // Create some alerts
    const nodes = await pool.query('SELECT id, county FROM water_nodes LIMIT 5');
    for (const node of nodes.rows) {
      await pool.query(
        `INSERT INTO alerts (node_id, type, message, severity, resolved) 
         VALUES ($1, $2, $3, $4, $5)`,
        [node.id, 'warning', `Low water level detected in ${node.county}`, 'medium', false]
      );
    }

    // Create some transactions
    const users = await pool.query('SELECT id FROM users LIMIT 1');
    if (users.rows.length > 0) {
      for (let i = 0; i < 10; i++) {
        await pool.query(
          `INSERT INTO transactions (user_id, amount, type, description, status, reference) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [users.rows[0].id, Math.floor(Math.random() * 500) + 100, 'payment', 'Water purchase', 'completed', `REF${Date.now()}${i}`]
        );
      }
    }

    console.log('✅ Real Kenyan data seeded successfully.');
  } catch (err) {
    console.error('❌ Seeding error:', err.message);
  }
};

// AUTH MIDDLEWARE
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }
  try {
    const token = authHeader.split(' ')[1];
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Insufficient permissions.' });
  }
  next();
};

// HEALTH CHECK
app.get('/', (req, res) => res.json({ message: 'MajiSmart API is running', version: '2.0.0', timestamp: new Date().toISOString() }));

app.get('/api/health', async (req, res) => {
  try {
    const dbResult = await pool.query('SELECT NOW()');
    res.json({ status: 'healthy', database: 'connected', time: dbResult.rows[0].now });
  } catch (err) {
    res.status(500).json({ status: 'unhealthy', database: 'disconnected', error: err.message });
  }
});

// AUTH ROUTES
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role, county, phone } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password are required.' });

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) return res.status(400).json({ error: 'An account with this email already exists.' });

    const hashed = await bcrypt.hash(password, await bcrypt.genSalt(10));
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role, county, phone) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, role, county, phone, created_at`,
      [name, email.toLowerCase(), hashed, role || 'operator', county || '', phone || '']
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ message: 'Registration successful.', token, user: { id: user.id, name: user.name, email: user.email, role: user.role, county: user.county, phone: user.phone } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (result.rows.length === 0 || !(await bcrypt.compare(password, result.rows[0].password))) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Login successful.', token, user: { id: user.id, name: user.name, email: user.email, role: user.role, county: user.county, phone: user.phone } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed.' });
  }
});

app.get('/api/auth/me', authenticate, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, role, county, phone, created_at FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found.' });
    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
});

// CITIZEN ROUTES - REAL DATA
app.get('/api/citizen/area-status', async (req, res) => {
  try {
    const { county } = req.query;
    const whereClause = county ? ' WHERE county = $1' : '';
    const params = county ? [county] : [];
    
    const totalNodes = await pool.query(`SELECT COUNT(*) FROM water_nodes${whereClause}`, params);
    const activeNodes = await pool.query(`SELECT COUNT(*) FROM water_nodes WHERE status = 'active'${county ? ' AND county = $1' : ''}`, params);
    const alertsCount = await pool.query(`SELECT COUNT(*) FROM alerts WHERE resolved = FALSE`);
    
    const qualityResult = await pool.query(`SELECT AVG(quality_index) as avg_quality FROM water_nodes${whereClause}`, params);
    const avgQuality = parseFloat(qualityResult.rows[0].avg_quality) || 85;
    
    const recentAlerts = await pool.query(`
      SELECT a.message, w.name as node_name, a.severity, a.created_at
      FROM alerts a 
      LEFT JOIN water_nodes w ON a.node_id = w.id 
      WHERE a.resolved = FALSE ${county ? ' AND w.county = $1' : ''} 
      ORDER BY a.created_at DESC LIMIT 5`, params);

    res.json({
      county: county || 'National',
      status: parseInt(alertsCount.rows[0].count) > 0 ? 'alert' : 'normal',
      active_nodes: parseInt(activeNodes.rows[0].count),
      total_nodes: parseInt(totalNodes.rows[0].count),
      recent_alerts: parseInt(alertsCount.rows[0].count),
      alerts: recentAlerts.rows,
      safety: {
        label: avgQuality >= 80 ? 'Safe' : 'Caution',
        advice: avgQuality >= 80 
          ? 'Water quality in your area is currently within safe limits. Continue normal usage.' 
          : 'Water quality is slightly below optimal. Consider boiling water before consumption.'
      }
    });
  } catch (err) {
    console.error('Area status error:', err);
    res.status(500).json({ error: 'Failed to fetch area status.' });
  }
});

app.get('/api/citizen/water-points', async (req, res) => {
  try {
    const { county, lat, lng } = req.query;
    let query = 'SELECT id, name, type, status, county, location, latitude, longitude, water_level, quality_index FROM water_nodes';
    const params = [];
    
    if (county) {
      query += ' WHERE county = $1';
      params.push(county);
    }
    query += ' ORDER BY name ASC';
    
    const result = await pool.query(query, params);
    let points = result.rows.map(p => ({
      ...p,
      type: p.type || 'borehole',
      water_level: p.water_level !== null ? parseInt(p.water_level) : 50,
      level_label: (p.water_level !== null ? p.water_level : 50) > 50 ? 'Good' : (p.water_level !== null ? p.water_level : 50) > 20 ? 'Low' : 'Critical',
      distance_km: lat && lng && p.latitude && p.longitude 
        ? parseFloat(Math.sqrt(Math.pow(p.latitude - lat, 2) + Math.pow(p.longitude - lng, 2)) * 111).toFixed(1)
        : null
    }));

    if (lat && lng) {
      points.sort((a, b) => (a.distance_km || 999) - (b.distance_km || 999));
    }

    res.json(points);
  } catch (err) {
    console.error('Water points error:', err);
    res.status(500).json({ error: 'Failed to fetch water points.' });
  }
});

app.get('/api/citizen/my-spending', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT SUM(amount) as total_ksh, COUNT(*) as transactions FROM transactions WHERE user_id = $1 AND created_at >= DATE_TRUNC(\'month\', CURRENT_DATE)',
      [req.user.id]
    );
    
    res.json({
      has_data: true,
      this_month: { 
        total_ksh: parseFloat(result.rows[0].total_ksh) || 0, 
        total_litres: 0, 
        cost_per_litre: 0.50, 
        transactions: parseInt(result.rows[0].transactions) || 0 
      },
      last_month: { total_ksh: 0, total_litres: 0 },
      history: []
    });
  } catch (err) {
    console.error('My spending error:', err);
    res.status(500).json({ error: 'Failed to fetch spending data.' });
  }
});

// DASHBOARD ROUTES - REAL DATA
app.get('/api/dashboard/summary', authenticate, async (req, res) => {
  try {
    const total = await pool.query('SELECT COUNT(*) FROM water_nodes');
    const active = await pool.query("SELECT COUNT(*) FROM water_nodes WHERE status = 'active'");
    const warning = await pool.query("SELECT COUNT(*) FROM water_nodes WHERE status IN ('warning', 'maintenance')");
    const offline = await pool.query("SELECT COUNT(*) FROM water_nodes WHERE status = 'offline'");
    
    res.json({
      nodes: {
        total: parseInt(total.rows[0].count),
        active: parseInt(active.rows[0].count),
        warning: parseInt(warning.rows[0].count),
        offline: parseInt(offline.rows[0].count)
      }
    });
  } catch (err) {
    console.error('Dashboard summary error:', err);
    res.status(500).json({ error: 'Failed to fetch summary.' });
  }
});

app.get('/api/dashboard/revenue-chart', authenticate, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT TO_CHAR(created_at, 'Mon DD') as date, COALESCE(SUM(amount), 0) as value
      FROM transactions
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY TO_CHAR(created_at, 'Mon DD'), DATE(created_at)
      ORDER BY DATE(created_at) ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Revenue chart error:', err);
    res.json([]);
  }
});

app.get('/api/dashboard/water-levels', authenticate, async (req, res) => {
  try {
    const result = await pool.query('SELECT name, COALESCE(water_level, 0) as water_level FROM water_nodes ORDER BY water_level DESC NULLS LAST LIMIT 10');
    res.json(result.rows);
  } catch (err) {
    console.error('Water levels error:', err);
    res.json([]);
  }
});

app.get('/api/dashboard/county-stats', authenticate, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT county, COUNT(*) as nodes, 0 as revenue
      FROM water_nodes
      WHERE county != '' AND county IS NOT NULL
      GROUP BY county
      ORDER BY county ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('County stats error:', err);
    res.json([]);
  }
});

// CORE RESOURCES
app.get('/api/nodes', authenticate, async (req, res) => {
  try {
    let query = 'SELECT * FROM water_nodes';
    const params = [];
    if (req.query.county) { query += ' WHERE county = $1'; params.push(req.query.county); }
    else if (req.user.role !== 'admin' && req.user.county) { query += ' WHERE county = $1'; params.push(req.user.county); }
    query += ' ORDER BY created_at DESC';
    res.json((await pool.query(query, params)).rows);
  } catch (err) {
    console.error('Nodes fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch nodes.' });
  }
});

app.post('/api/nodes', authenticate, authorize('admin', 'county_officer'), async (req, res) => {
  try {
    const { name, type, location, county, latitude, longitude, operator_id } = req.body;
    const result = await pool.query(
      `INSERT INTO water_nodes (name, type, location, county, latitude, longitude, operator_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, type || 'borehole', location || '', county || '', latitude || 0, longitude || 0, operator_id || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Node create error:', err);
    res.status(500).json({ error: 'Failed to create node.' });
  }
});

app.get('/api/alerts', authenticate, async (req, res) => {
  try {
    const { resolved, limit, county } = req.query;
    let query = 'SELECT a.*, w.name as node_name, w.county FROM alerts a LEFT JOIN water_nodes w ON a.node_id = w.id';
    const params = [];
    const conditions = [];
    
    if (resolved === 'false') conditions.push('a.resolved = FALSE');
    if (county) { conditions.push(`w.county = $${params.length + 1}`); params.push(county); }
    
    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY a.created_at DESC';
    if (limit) { query += ` LIMIT $${params.length + 1}`; params.push(parseInt(limit)); }
    
    res.json((await pool.query(query, params)).rows);
  } catch (err) {
    console.error('Alerts fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch alerts.' });
  }
});

app.post('/api/alerts', authenticate, async (req, res) => {
  try {
    const { node_id, type, message, severity } = req.body;
    const result = await pool.query(
      'INSERT INTO alerts (node_id, type, message, severity) VALUES ($1, $2, $3, $4) RETURNING *',
      [node_id, type || 'warning', message || '', severity || 'medium']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Alert create error:', err);
    res.status(500).json({ error: 'Failed to create alert.' });
  }
});

app.put('/api/alerts/:id/resolve', authenticate, async (req, res) => {
  try {
    const result = await pool.query('UPDATE alerts SET resolved = TRUE WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Alert not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Alert resolve error:', err);
    res.status(500).json({ error: 'Failed to resolve alert.' });
  }
});

app.get('/api/reports', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT r.*, u.name as reporter_name FROM community_reports r LEFT JOIN users u ON r.user_id = u.id ORDER BY r.created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Reports fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch reports.' });
  }
});

app.get('/api/reports/stats/summary', authenticate, async (req, res) => {
  try {
    const total = await pool.query('SELECT COUNT(*) FROM community_reports');
    const open = await pool.query("SELECT COUNT(*) FROM community_reports WHERE status = 'open'");
    const in_progress = await pool.query("SELECT COUNT(*) FROM community_reports WHERE status = 'in_progress'");
    const resolved = await pool.query("SELECT COUNT(*) FROM community_reports WHERE status = 'resolved'");
    
    res.json({
      total: parseInt(total.rows[0].count),
      open: parseInt(open.rows[0].count),
      in_progress: parseInt(in_progress.rows[0].count),
      resolved: parseInt(resolved.rows[0].count)
    });
  } catch (err) {
    console.error('Reports stats error:', err);
    res.status(500).json({ error: 'Failed to fetch report stats.' });
  }
});

app.post('/api/reports', authenticate, async (req, res) => {
  try {
    const { title, description, category, type, county, location, latitude, longitude } = req.body;
    const result = await pool.query(
      `INSERT INTO community_reports (user_id, title, description, category, type, county, location, latitude, longitude) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [req.user.id, title || '', description || '', category || 'general', type || 'other', county || '', location || '', latitude || null, longitude || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Report create error:', err);
    res.status(500).json({ error: 'Failed to create report.' });
  }
});

app.patch('/api/reports/:id/status', authenticate, async (req, res) =>
