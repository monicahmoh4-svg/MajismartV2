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

// 1. DATABASE CONNECTION
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});
pool.on('error', (err) => console.error('Database error:', err));

// 2. CORS & MIDDLEWARE
const allowedOrigins = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map(o => o.trim().replace(/\/+$/, '')) : ['http://localhost:5173', 'http://localhost:3000'];
app.use(cors({ origin: (origin, callback) => callback(null, true), credentials: true, methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'], allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const JWT_SECRET = process.env.JWT_SECRET || 'majismart_secret_key_2024';

// 3. DATABASE INITIALIZATION (NO FAKE SEEDING - READY FOR REAL DATA)
const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, email VARCHAR(255) UNIQUE NOT NULL, 
        password VARCHAR(255) NOT NULL, role VARCHAR(50) DEFAULT 'operator', county VARCHAR(100) DEFAULT '', 
        phone VARCHAR(50) DEFAULT '', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS water_nodes (
        id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, type VARCHAR(50) DEFAULT 'borehole', 
        location VARCHAR(255) DEFAULT '', county VARCHAR(100) DEFAULT '', latitude DECIMAL(10,6) DEFAULT 0, 
        longitude DECIMAL(10,6) DEFAULT 0, status VARCHAR(50) DEFAULT 'active', water_level INTEGER DEFAULT 50, 
        flow_rate DECIMAL(10,2) DEFAULT 0, quality_index DECIMAL(5,2) DEFAULT 0, pressure DECIMAL(10,2) DEFAULT 0, 
        last_reading TIMESTAMP DEFAULT CURRENT_TIMESTAMP, operator_id INTEGER, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS readings (
        id SERIAL PRIMARY KEY, node_id INTEGER, flow_rate DECIMAL(10,2) DEFAULT 0, quality_index DECIMAL(5,2) DEFAULT 0, 
        pressure DECIMAL(10,2) DEFAULT 0, ph_level DECIMAL(5,2) DEFAULT 7.0, turbidity DECIMAL(10,2) DEFAULT 0, 
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS alerts (
        id SERIAL PRIMARY KEY, node_id INTEGER, type VARCHAR(100) DEFAULT 'warning', message TEXT DEFAULT '', 
        severity VARCHAR(50) DEFAULT 'medium', resolved BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY, user_id INTEGER, node_id INTEGER, amount DECIMAL(12,2) DEFAULT 0, 
        type VARCHAR(50) DEFAULT 'payment', description TEXT DEFAULT '', status VARCHAR(50) DEFAULT 'completed', 
        reference VARCHAR(255) DEFAULT '', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS maintenance (
        id SERIAL PRIMARY KEY, node_id INTEGER, description TEXT DEFAULT '', status VARCHAR(50) DEFAULT 'pending', 
        priority VARCHAR(50) DEFAULT 'medium', assigned_to INTEGER, scheduled_date TIMESTAMP, 
        completed_date TIMESTAMP, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS community_reports (
        id SERIAL PRIMARY KEY, user_id INTEGER, title VARCHAR(255) DEFAULT '', description TEXT DEFAULT '', 
        category VARCHAR(100) DEFAULT 'general', type VARCHAR(100) DEFAULT 'other', county VARCHAR(100) DEFAULT '', 
        location VARCHAR(255) DEFAULT '', latitude DECIMAL(10,6), longitude DECIMAL(10,6), status VARCHAR(50) DEFAULT 'open', 
        upvotes INTEGER DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Database schema verified/created successfully. Ready for real data.');
    
    // Create default admin if not exists
    const adminPwd = await bcrypt.hash('admin123', 10);
    await pool.query(
      `INSERT INTO users (name, email, password, role, county, phone) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (email) DO NOTHING`,
      ['System Admin', 'admin@majismart.co.ke', adminPwd, 'admin', 'Nairobi', '+254700000000']
    );
  } catch (err) {
    console.error('❌ DB Init Error:', err.message);
  }
};

// 4. MIDDLEWARE
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Access denied. No token provided.' });
  try { req.user = jwt.verify(authHeader.split(' ')[1], JWT_SECRET); next(); } 
  catch (err) { return res.status(401).json({ error: 'Invalid or expired token.' }); }
};
const authorize = (...roles) => (req, res, next) => roles.includes(req.user.role) ? next() : res.status(403).json({ error: 'Insufficient permissions.' });

// 5. ROUTES
app.get('/', (req, res) => res.json({ message: 'MajiSmart API is running', version: '2.0.0' }));
app.get('/api/health', async (req, res) => {
  try { const r = await pool.query('SELECT NOW()'); res.json({ status: 'healthy', database: 'connected', time: r.rows[0].now }); }
  catch (err) { res.status(500).json({ status: 'unhealthy', error: err.message }); }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role, county, phone } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password are required.' });
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) return res.status(400).json({ error: 'Email already exists.' });
    const hashed = await bcrypt.hash(password, await bcrypt.genSalt(10));
    const result = await pool.query(`INSERT INTO users (name, email, password, role, county, phone) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, role, county, phone`, [name, email.toLowerCase(), hashed, role || 'operator', county || '', phone || '']);
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ message: 'Registration successful.', token, user });
  } catch (err) { res.status(500).json({ error: 'Registration failed.' }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (result.rows.length === 0 || !(await bcrypt.compare(password, result.rows[0].password))) return res.status(401).json({ error: 'Invalid email or password.' });
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Login successful.', token, user: { id: user.id, name: user.name, email: user.email, role: user.role, county: user.county, phone: user.phone } });
  } catch (err) { res.status(500).json({ error: 'Login failed.' }); }
});

app.get('/api/auth/me', authenticate, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, role, county, phone FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found.' });
    res.json({ user: result.rows[0] });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch profile.' }); }
});

// CITIZEN ROUTES
app.get('/api/citizen/area-status', async (req, res) => {
  try {
    const { county } = req.query;
    const where = county ? ' WHERE county = $1' : '';
    const params = county ? [county] : [];
    const total = await pool.query(`SELECT COUNT(*) FROM water_nodes${where}`, params);
    const active = await pool.query(`SELECT COUNT(*) FROM water_nodes WHERE status = 'active'${county ? ' AND county = $1' : ''}`, params);
    const alerts = await pool.query(`SELECT COUNT(*) FROM alerts WHERE resolved = FALSE`);
    const quality = await pool.query(`SELECT AVG(quality_index) as avg FROM water_nodes${where}`, params);
    const avgQ = parseFloat(quality.rows[0].avg) || 85;
    
    res.json({
      county: county || 'National',
      status: parseInt(alerts.rows[0].count) > 0 ? 'alert' : 'normal',
      active_nodes: parseInt(active.rows[0].count),
      total_nodes: parseInt(total.rows[0].count),
      recent_alerts: parseInt(alerts.rows[0].count),
      safety: { label: avgQ >= 80 ? 'Safe' : 'Caution', advice: avgQ >= 80 ? 'Water quality is within safe limits.' : 'Consider boiling water before consumption.' }
    });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch area status.' }); }
});

app.get('/api/citizen/water-points', async (req, res) => {
  try {
    const { county, lat, lng } = req.query;
    const where = county ? ' WHERE county = $1' : '';
    const params = county ? [county] : [];
    const result = await pool.query(`SELECT id, name, type, status, county, location, latitude, longitude, water_level, quality_index FROM water_nodes${where} ORDER BY name ASC`, params);
    res.json(result.rows.map(p => ({
      ...p, type: p.type || 'borehole', water_level: p.water_level !== null ? parseInt(p.water_level) : 50,
      level_label: (p.water_level !== null ? p.water_level : 50) > 50 ? 'Good' : 'Low',
      distance_km: lat && lng && p.latitude && p.longitude ? parseFloat(Math.sqrt(Math.pow(p.latitude - lat, 2) + Math.pow(p.longitude - lng, 2)) * 111).toFixed(1) : null
    })));
  } catch (err) { res.status(500).json({ error: 'Failed to fetch water points.' }); }
});

app.get('/api/citizen/my-spending', authenticate, async (req, res) => {
  try {
    const result = await pool.query('SELECT SUM(amount) as total_ksh, COUNT(*) as transactions FROM transactions WHERE user_id = $1 AND created_at >= DATE_TRUNC(\'month\', CURRENT_DATE)', [req.user.id]);
    res.json({ has_data: true, this_month: { total_ksh: parseFloat(result.rows[0].total_ksh) || 0, total_litres: 0, cost_per_litre: 0.50, transactions: parseInt(result.rows[0].transactions) || 0 }, last_month: { total_ksh: 0, total_litres: 0 }, history: [] });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch spending data.' }); }
});

// DASHBOARD ROUTES
app.get('/api/dashboard/summary', authenticate, async (req, res) => {
  try {
    const total = await pool.query('SELECT COUNT(*) FROM water_nodes');
    const active = await pool.query("SELECT COUNT(*) FROM water_nodes WHERE status = 'active'");
    const warning = await pool.query("SELECT COUNT(*) FROM water_nodes WHERE status IN ('warning', 'maintenance')");
    const offline = await pool.query("SELECT COUNT(*) FROM water_nodes WHERE status = 'offline'");
    res.json({ nodes: { total: parseInt(total.rows[0].count), active: parseInt(active.rows[0].count), warning: parseInt(warning.rows[0].count), offline: parseInt(offline.rows[0].count) } });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch summary.' }); }
});

app.get('/api/dashboard/revenue-chart', authenticate, async (req, res) => {
  try {
    const result = await pool.query(`SELECT TO_CHAR(created_at, 'Mon DD') as date, COALESCE(SUM(amount), 0) as value FROM transactions WHERE created_at >= NOW() - INTERVAL '7 days' GROUP BY TO_CHAR(created_at, 'Mon DD'), DATE(created_at) ORDER BY DATE(created_at) ASC`);
    res.json(result.rows);
  } catch (err) { res.json([]); }
});

app.get('/api/dashboard/water-levels', authenticate, async (req, res) => {
  try {
    const result = await pool.query('SELECT name, COALESCE(water_level, 0) as water_level FROM water_nodes ORDER BY water_level DESC NULLS LAST LIMIT 10');
    res.json(result.rows);
  } catch (err) { res.json([]); }
});

app.get('/api/dashboard/county-stats', authenticate, async (req, res) => {
  try {
    const result = await pool.query("SELECT county, COUNT(*) as nodes, 0 as revenue FROM water_nodes WHERE county != '' AND county IS NOT NULL GROUP BY county ORDER BY county ASC");
    res.json(result.rows);
  } catch (err) { res.json([]); }
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
  } catch (err) { res.status(500).json({ error: 'Failed to fetch nodes.' }); }
});

app.post('/api/nodes', authenticate, authorize('admin', 'county_officer'), async (req, res) => {
  try {
    const { name, type, location, county, latitude, longitude, operator_id } = req.body;
    const result
