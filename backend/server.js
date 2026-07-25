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
        callback(null, true);
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
if (!process.env.JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET is not set. Using default. Set it in production!');
}

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
        location VARCHAR(255) DEFAULT '',
        county VARCHAR(100) DEFAULT '',
        latitude DECIMAL(10,6) DEFAULT 0,
        longitude DECIMAL(10,6) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'active',
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
        county VARCHAR(100) DEFAULT '',
        status VARCHAR(50) DEFAULT 'open',
        upvotes INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Database tables initialized successfully.');
  } catch (err) {
    console.error('Database initialization error:', err.message);
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

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const result = await pool.query(
      `INSERT INTO users (name, email, password, role, county, phone)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, role, county, phone, created_at`,
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

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

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
    const result = await pool.query(
      'SELECT id, name, email, role, county, phone, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('Auth me error:', err);
    res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
});

// ============================================================
// 8. DASHBOARD ROUTES
// ============================================================
app.get('/api/dashboard/stats', authenticate, async (req, res) => {
  try {
    const nodesCount = await pool.query('SELECT COUNT(*) FROM water_nodes');
    const activeNodes = await pool.query("SELECT COUNT(*) FROM water_nodes WHERE status = 'active'");
    const usersCount = await pool.query('SELECT COUNT(*) FROM users');
    const alertsCount = await pool.query('SELECT COUNT(*) FROM alerts WHERE resolved = FALSE');
    const avgFlow = await pool.query('SELECT COALESCE(AVG(flow_rate), 0) as avg FROM water_nodes');
    const avgQuality = await pool.query('SELECT COALESCE(AVG(quality_index), 0) as avg FROM water_nodes');

    res.json({
      totalNodes: parseInt(nodesCount.rows[0].count),
      activeNodes: parseInt(activeNodes.rows[0].count),
      totalUsers: parseInt(usersCount.rows[0].count),
      unresolvedAlerts: parseInt(alertsCount.rows[0].count),
      avgFlowRate: parseFloat(avgFlow.rows[0].avg),
      avgQualityIndex: parseFloat(avgQuality.rows[0].avg),
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats.' });
  }
});

app.get('/api/dashboard/chart-data', authenticate, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DATE(timestamp) as date,
             AVG(flow_rate) as avg_flow,
             AVG(quality_index) as avg_quality,
             COUNT(*) as reading_count
      FROM readings
      WHERE timestamp >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(timestamp)
      ORDER BY date ASC
    `);
    res.json({ data: result.rows });
  } catch (err) {
    console.error('Chart data error:', err);
    res.status(500).json({ error: 'Failed to fetch chart data.' });
  }
});

// ============================================================
// 9. WATER NODES ROUTES
// ============================================================
app.get('/api/nodes', authenticate, async (req, res) => {
  try {
    let query = 'SELECT * FROM water_nodes';
    const params = [];
    if (req.user.role !== 'admin' && req.user.county) {
      query += ' WHERE county = $1';
      params.push(req.user.county);
    }
    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);
    res.json({ nodes: result.rows });
  } catch (err) {
    console.error('Nodes fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch nodes.' });
  }
});

app.post('/api/nodes', authenticate, authorize('admin', 'county_officer'), async (req, res) => {
  try {
    const { name, location, county, latitude, longitude, operator_id } = req.body;
    const result = await pool.query(
      `INSERT INTO water_nodes (name, location, county, latitude, longitude, operator_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, location || '', county || '', latitude || 0, longitude || 0, operator_id || null]
    );
    res.status(201).json({ node: result.rows[0] });
  } catch (err) {
    console.error('Node create error:', err);
    res.status(500).json({ error: 'Failed to create node.' });
  }
});

app.put('/api/nodes/:id', authenticate, authorize('admin', 'county_officer', 'operator'), async (req, res) => {
  try {
    const { name, location, county, status, latitude, longitude } = req.body;
    const result = await pool.query(
      `UPDATE water_nodes SET name=COALESCE($1,name), location=COALESCE($2,location),
       county=COALESCE($3,county), status=COALESCE($4,status),
       latitude=COALESCE($5,latitude), longitude=COALESCE($6,longitude), last_reading=NOW()
       WHERE id=$7 RETURNING *`,
      [name, location, county, status, latitude, longitude, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Node not found.' });
    res.json({ node: result.rows[0] });
  } catch (err) {
    console.error('Node update error:', err);
    res.status(500).json({ error: 'Failed to update node.' });
  }
});

app.delete('/api/nodes/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM water_nodes WHERE id = $1', [req.params.id]);
    res.json({ message: 'Node deleted.' });
  } catch (err) {
    console.error('Node delete error:', err);
    res.status(500).json({ error: 'Failed to delete node.' });
  }
});

// ============================================================
// 10. READINGS ROUTES
// ============================================================
app.get('/api/readings/:nodeId', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM readings WHERE node_id = $1 ORDER BY timestamp DESC LIMIT 100',
      [req.params.nodeId]
    );
    res.json({ readings: result.rows });
  } catch (err) {
    console.error('Readings fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch readings.' });
  }
});

app.post('/api/readings', authenticate, async (req, res) => {
  try {
    const { node_id, flow_rate, quality_index, pressure, ph_level, turbidity } = req.body;
    const result = await pool.query(
      `INSERT INTO readings (node_id, flow_rate, quality_index, pressure, ph_level, turbidity)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [node_id, flow_rate || 0, quality_index || 0, pressure || 0, ph_level || 7.0, turbidity || 0]
    );
    await pool.query(
      'UPDATE water_nodes SET flow_rate=$1, quality_index=$2, pressure=$3, last_reading=NOW() WHERE id=$4',
      [flow_rate || 0, quality_index || 0, pressure || 0, node_id]
    );
    res.status(201).json({ reading: result.rows[0] });
  } catch (err) {
    console.error('Reading create error:', err);
    res.status(500).json({ error: 'Failed to save reading.' });
  }
});

// ============================================================
// 11. ALERTS ROUTES
// ============================================================
app.get('/api/alerts', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT a.*, w.name as node_name FROM alerts a LEFT JOIN water_nodes w ON a.node_id = w.id ORDER BY a.created_at DESC LIMIT 200'
    );
    res.json({ alerts: result.rows });
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
    res.status(201).json({ alert: result.rows[0] });
  } catch (err) {
    console.error('Alert create error:', err);
    res.status(500).json({ error: 'Failed to create alert.' });
  }
});

app.put('/api/alerts/:id/resolve', authenticate, async (req, res) => {
  try {
    const result = await pool.query('UPDATE alerts SET resolved = TRUE WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Alert not found.' });
    res.json({ alert: result.rows[0] });
  } catch (err) {
    console.error('Alert resolve error:', err);
    res.status(500).json({ error: 'Failed to resolve alert.' });
  }
});

// ============================================================
// 12. USERS ROUTES
// ============================================================
app.get('/api/users', authenticate, authorize('admin', 'county_officer'), async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, role, county, phone, created_at FROM users ORDER BY created_at DESC');
    res.json({ users: result.rows });
  } catch (err) {
    console.error('Users fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

// ============================================================
// 13. TRANSACTIONS / BILLING ROUTES
// ============================================================
app.get('/api/transactions', authenticate, async (req, res) => {
  try {
    let query = 'SELECT * FROM transactions';
    const params = [];
    if (req.user.role !== 'admin') {
      query += ' WHERE user_id = $1';
      params.push(req.user.id);
    }
    query += ' ORDER BY created_at DESC LIMIT 100';
    const result = await pool.query(query, params);
    res.json({ transactions: result.rows });
  } catch (err) {
    console.error('Transactions fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch transactions.' });
  }
});

app.post('/api/transactions', authenticate, async (req, res) => {
  try {
    const { amount, type, description, reference } = req.body;
    const result = await pool.query(
      'INSERT INTO transactions (user_id, amount, type, description, reference) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.id, amount || 0, type || 'payment', description || '', reference || '']
    );
    res.status(201).json({ transaction: result.rows[0] });
  } catch (err) {
    console.error('Transaction create error:', err);
    res.status(500).json({ error: 'Failed to create transaction.' });
  }
});

// ============================================================
// 14. MAINTENANCE ROUTES
// ============================================================
app.get('/api/maintenance', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.*, w.name as node_name FROM maintenance m
       LEFT JOIN water_nodes w ON m.node_id = w.id
       ORDER BY m.created_at DESC LIMIT 100`
    );
    res.json({ maintenance: result.rows });
  } catch (err) {
    console.error('Maintenance fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch maintenance records.' });
  }
});

app.post('/api/maintenance', authenticate, authorize('admin', 'county_officer', 'operator'), async (req, res) => {
  try {
    const { node_id, description, priority, assigned_to, scheduled_date } = req.body;
    const result = await pool.query(
      `INSERT INTO maintenance (node_id, description, priority, assigned_to, scheduled_date)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [node_id, description || '', priority || 'medium', assigned_to || null, scheduled_date || null]
    );
    res.status(201).json({ record: result.rows[0] });
  } catch (err) {
    console.error('Maintenance create error:', err);
    res.status(500).json({ error: 'Failed to create maintenance record.' });
  }
});

app.put('/api/maintenance/:id', authenticate, async (req, res) => {
  try {
    const { status, completed_date } = req.body;
    const result = await pool.query(
      'UPDATE maintenance SET status=COALESCE($1,status), completed_date=COALESCE($2,completed_date) WHERE id=$3 RETURNING *',
      [status, completed_date, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found.' });
    res.json({ record: result.rows[0] });
  } catch (err) {
    console.error('Maintenance update error:', err);
    res.status(500).json({ error: 'Failed to update maintenance record.' });
  }
});

// ============================================================
// 15. COMMUNITY REPORTS ROUTES
// ============================================================
app.get('/api/reports', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT r.*, u.name as author_name FROM community_reports r LEFT JOIN users u ON r.user_id = u.id ORDER BY r.created_at DESC'
    );
    res.json({ reports: result.rows });
  } catch (err) {
    console.error('Reports fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch reports.' });
  }
});

app.post('/api/reports', authenticate, async (req, res) => {
  try {
    const { title, description, category, county } = req.body;
    const result = await pool.query(
      'INSERT INTO community_reports (user_id, title, description, category, county) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.id, title || '', description || '', category || 'general', county || '']
    );
    res.status(201).json({ report: result.rows[0] });
  } catch (err) {
    console.error('Report create error:', err);
    res.status(500).json({ error: 'Failed to create report.' });
  }
});

app.put('/api/reports/:id/upvote', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE community_reports SET upvotes = upvotes + 1 WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Report not found.' });
    res.json({ report: result.rows[0] });
  } catch (err) {
    console.error('Upvote error:', err);
    res.status(500).json({ error: 'Failed to upvote.' });
  }
});

// ============================================================
// 16. GLOBAL ERROR HANDLER
// ============================================================
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

app.use('*', (req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found.` });
});

// ============================================================
// 17. START SERVER
// ============================================================
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await initDB();
  app.listen(PORT, () => {
    console.log(`MajiSmart API running on port ${PORT}`);
  });
};

startServer();
