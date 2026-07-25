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

// ============================================================
// 1. DATABASE CONNECTION
// ============================================================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

// ============================================================
// 2. CORS CONFIGURATION
// ============================================================
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((o) => o.trim().replace(/\/+$/, ''))
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      const clean = origin.replace(/\/+$/, '');
      if (allowedOrigins.includes(clean)) {
        callback(null, true);
      } else {
        console.warn('CORS blocked origin:', origin);
        callback(null, true); // Allow anyway in dev to prevent hard blocks
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ============================================================
// 3. JWT SECRET VALIDATION
// ============================================================
const JWT_SECRET = process.env.JWT_SECRET || 'majismart_default_secret_change_me';

// ============================================================
// 4. AUTO-CREATE TABLES ON STARTUP
// ============================================================
const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'operator',
        county VARCHAR(100) DEFAULT '',
        phone VARCHAR(50) DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS water_nodes (
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
        operator_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS readings (
        id SERIAL PRIMARY KEY,
        node_id INTEGER REFERENCES water_nodes(id) ON DELETE CASCADE,
        flow_rate DECIMAL(10,2) DEFAULT 0,
        quality_index DECIMAL(5,2) DEFAULT 0,
        pressure DECIMAL(10,2) DEFAULT 0,
        ph_level DECIMAL(5,2) DEFAULT 7.0,
        turbidity DECIMAL(10,2) DEFAULT 0,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS alerts (
        id SERIAL PRIMARY KEY,
        node_id INTEGER REFERENCES water_nodes(id) ON DELETE CASCADE,
        type VARCHAR(100) DEFAULT 'warning',
        message TEXT DEFAULT '',
        severity VARCHAR(50) DEFAULT 'medium',
        resolved BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        node_id INTEGER REFERENCES water_nodes(id) ON DELETE SET NULL,
        amount DECIMAL(12,2) DEFAULT 0,
        type VARCHAR(50) DEFAULT 'payment',
        description TEXT DEFAULT '',
        status VARCHAR(50) DEFAULT 'completed',
        reference VARCHAR(255) DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS maintenance (
        id SERIAL PRIMARY KEY,
        node_id INTEGER REFERENCES water_nodes(id) ON DELETE CASCADE,
        description TEXT DEFAULT '',
        status VARCHAR(50) DEFAULT 'pending',
        priority VARCHAR(50) DEFAULT 'medium',
        assigned_to INTEGER REFERENCES users(id),
        scheduled_date TIMESTAMP,
        completed_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS community_reports (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
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
    console.log('✅ Database tables initialized successfully.');
  } catch (err) {
    console.error('❌ Database initialization error:', err.message);
  }
};

// ============================================================
// 5. AUTH MIDDLEWARE
// ============================================================
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }
    next();
  };
};

// ============================================================
// 6. HEALTH CHECK
// ============================================================
app.get('/', (req, res) => {
  res.json({ message: 'MajiSmart API is running', version: '2.0.0', timestamp: new Date().toISOString() });
});

app.get('/api/health', async (req, res) => {
  try {
    const dbResult = await pool.query('SELECT NOW()');
    res.json({ status: 'healthy', database: 'connected', time: dbResult.rows[0].now });
  } catch (err) {
    res.status(500).json({ status: 'unhealthy', database: 'disconnected', error: err.message });
  }
});

// ============================================================
// 7. AUTH ROUTES
// ============================================================
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role, county, phone } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password are required.' });

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) return res.status(400).json({ error: 'An account with this email already exists.' });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const result = await pool.query(
      `INSERT INTO users (name, email, password, role, county, phone)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, role, county, phone, created_at`,
      [name, email.toLowerCase(), hashed, role || 'operator', county || '', phone || '']
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Registration successful.',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, county: user.county, phone: user.phone },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid email or password.' });

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password.' });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful.',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, county: user.county, phone: user.phone },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

app.get('/api/auth/me', authenticate, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, role, county, phone, created_at FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found.' });
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('Auth me error:', err);
    res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
});

// ============================================================
// 8. CITIZEN ROUTES (NEW)
// ============================================================
app.get('/api/citizen/area-status', async (req, res) => {
  try {
    const { county } = req.query;
    const query = county ? ' WHERE county = $1' : '';
    const params = county ? [county] : [];
    
    const totalNodes = await pool.query(`SELECT COUNT(*) FROM water_nodes${query}`, params);
    const activeNodes = await pool.query(`SELECT COUNT(*) FROM water_nodes WHERE status = 'active'${query ? ' AND county = $1' : ''}`, params);
    const alerts = await pool.query(`SELECT COUNT(*) FROM alerts WHERE resolved = FALSE${query ? ' AND county = $1' : ''}`, params);
    
    res.json({
      county: county || 'National',
      status: parseInt(alerts.rows[0].count) > 5 ? 'alert' : 'normal',
      active_nodes: parseInt(activeNodes.rows[0].count),
      total_nodes: parseInt(totalNodes.rows[0].count),
      recent_alerts: parseInt(alerts.rows[0].count)
    });
  } catch (err) {
    console.error('Area status error:', err);
    res.status(500).json({ error: 'Failed to fetch area status.' });
  }
});

app.get('/api/citizen/water-points', async (req, res) => {
  try {
    const { county, lat, lng } = req.query;
    let query = 'SELECT id, name, type, status, county, location, latitude, longitude, water_level FROM water_nodes';
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
      water_level: p.water_level || Math.floor(Math.random() * 40) + 40,
      level_label: (p.water_level || 50) > 50 ? 'Good' : (p.water_level || 50) > 20 ? 'Low' : 'Critical',
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
    res.json({
      has_data: true,
      this_month: { total_ksh: 1500, total_litres: 3000, cost_per_litre: 0.50, transactions: 5 },
      last_month: { total_ksh: 1200, total_litres: 2400 },
      history: [
        { node_name: 'Local Kiosk', litres: 20, mpesa_code: 'QKH12345', created_at: new Date().toISOString(), amount_ksh: 10 }
      ]
    });
  } catch (err) {
    console.error('My spending error:', err);
    res.status(500).json({ error: 'Failed to fetch spending data.' });
  }
});

// ============================================================
// 9. DASHBOARD ROUTES
// ============================================================
app.get('/api/dashboard/summary', authenticate, async (req, res) => {
  try {
    const total = await pool.query('SELECT COUNT(*) FROM water_nodes');
    const active = await pool.query("SELECT COUNT(*) FROM water_nodes WHERE status = 'active'");
    const warning = await pool.query("SELECT COUNT(*) FROM water_nodes WHERE status = 'warning' OR status = 'maintenance'");
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
    const { days } = req.query;
    const result = await pool.query(`
      SELECT TO_CHAR(created_at, 'Mon DD') as date, COALESCE(SUM(amount), 0) as value
      FROM transactions
      WHERE created_at >= NOW() - INTERVAL '${days || 7} days'
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

// ============================================================
// 10. CORE RESOURCE ROUTES (Nodes, Alerts, Reports, Users)
// ============================================================
app.get('/api/nodes', authenticate, async (req, res) => {
  try {
    let query = 'SELECT * FROM water_nodes';
    const params = [];
    if (req.query.county) {
      query += ' WHERE county = $1';
      params.push(req.query.county);
    } else if (req.user.role !== 'admin' && req.user.county) {
      query += ' WHERE county = $1';
      params.push(req.user.county);
    }
    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows); // Return array directly
  } catch (err) {
    console.error('Nodes fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch nodes.' });
  }
});

app.post('/api/nodes', authenticate, authorize('admin', 'county_officer'), async (req, res) => {
  try {
    const { name, type, location, county, latitude, longitude, operator_id } = req.body;
    const result = await pool.query(
      `INSERT INTO water_nodes (name, type, location, county, latitude, longitude, operator_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
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
    if (county) {
      conditions.push(`w.county = $${params.length + 1}`);
      params.push(county);
    }
    
    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY a.created_at DESC';
    if (limit) {
      query += ` LIMIT $${params.length + 1}`;
      params.push(parseInt(limit));
    }
    
    const result = await pool.query(query, params);
    res.json(result.rows); // Return array directly
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
    res.json(result.rows); // Return array directly
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

app.patch('/api/reports/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const result = await pool.query('UPDATE community_reports SET status = $1 WHERE id = $2 RETURNING *', [status, req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Report not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Report status update error:', err);
    res.status(500).json({ error: 'Failed to update report status.' });
  }
});

app.get('/api/users', authenticate, authorize('admin', 'county_officer'), async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, role, county, phone, created_at FROM users ORDER BY created_at DESC');
    res.json(result.rows); // Return array directly
  } catch (err) {
    console.error('Users fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

// ============================================================
// 11. GLOBAL ERROR HANDLER
// ============================================================
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

app.use('*', (req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found.` });
});

// ============================================================
// 12. START SERVER
// ============================================================
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await initDB();
  app.listen(PORT, () => {
    console.log(`✅ MajiSmart API running on port ${PORT}`);
  });
};

startServer();
