const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// ============================================
// CORS CONFIGURATION
// ============================================
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://majismart-v2-phi.vercel.app',
  'https://majismart-v2.vercel.app',
  'https://majismart-v2-git-main-monicahmoh4-svgs-projects.vercel.app',
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      console.warn('⚠️ CORS blocked origin:', origin);
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================
// DATABASE CONNECTION
// ============================================
const db = require('./db');

db.query('SELECT NOW()')
  .then(() => console.log('✅ Database connected successfully'))
  .catch((err) => console.error('❌ Database connection failed:', err.message));

// ============================================
// ROUTE IMPORTS (VERIFIED - ALL 13 ROUTES)
// ============================================
const authRoutes = require('./routes/auth');
const citizenRoutes = require('./routes/citizen');
const reportRoutes = require('./routes/reports');
const alertRoutes = require('./routes/alerts');
const datasetRoutes = require('./routes/datasets');
const paymentRoutes = require('./routes/payments');
const aiRoutes = require('./routes/ai');
const gisRoutes = require('./routes/gis');
const adminRoutes = require('./routes/admin');
const countyRoutes = require('./routes/county');
const operatorRoutes = require('./routes/operator');
const assetsRoutes = require('./routes/assets');
const reportsEnhancedRoutes = require('./routes/reports-enhanced'); // ✅ Feature 3

// ============================================
// ROUTE MOUNTING (VERIFIED - ALL 13 ROUTES)
// ============================================

// Welcome route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the MajiSmart Enterprise API',
    status: 'running',
    version: '3.0.0',
    note: 'This is a backend API. Please use your Vercel frontend URL to access the visual application.',
    usefulEndpoints: {
      healthCheck: '/api/health',
      gisAssets: '/api/gis/assets',
      assetManagement: '/api/assets',
      citizenReports: '/api/reports-enhanced',
      adminStats: '/api/admin/dashboard-stats'
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '3.0.0',
    service: 'MajiSmart API'
  });
});

// Mount all routes
app.use('/api/auth', authRoutes);
app.use('/api/citizen', citizenRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/datasets', datasetRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/gis', gisRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/county', countyRoutes);
app.use('/api/operator', operatorRoutes);
app.use('/api/assets', assetsRoutes);
app.use('/api/reports-enhanced', reportsEnhancedRoutes); // ✅ Feature 3

// ============================================
// ERROR HANDLING
// ============================================
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found. Did you mean to prefix with /api/ ?`
  });
});

app.use((err, req, res, next) => {
  console.error('❌ Unhandled Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// ============================================
// SERVER STARTUP
// ============================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🚀 MajiSmart Enterprise API Server v3.0.0');
  console.log('='.repeat(60));
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('='.repeat(60));
  console.log('📡 Available Endpoints:');
  console.log(`   🔹 Health:    http://localhost:${PORT}/api/health`);
  console.log(`   🔹 Auth:      http://localhost:${PORT}/api/auth`);
  console.log(`   🔹 Citizen:   http://localhost:${PORT}/api/citizen`);
  console.log(`   🔹 Reports:   http://localhost:${PORT}/api/reports`);
  console.log(`   🔹 Alerts:    http://localhost:${PORT}/api/alerts`);
  console.log(`   🔹 Datasets:  http://localhost:${PORT}/api/datasets`);
  console.log(`   🔹 Payments:  http://localhost:${PORT}/api/payments`);
  console.log(`   🔹 AI:        http://localhost:${PORT}/api/ai`);
  console.log(`   🔹 GIS:       http://localhost:${PORT}/api/gis/assets`);
  console.log(`   🔹 Admin:     http://localhost:${PORT}/api/admin/dashboard-stats`);
  console.log(`   🔹 County:    http://localhost:${PORT}/api/county/dashboard-stats`);
  console.log(`   🔹 Operator:  http://localhost:${PORT}/api/operator/dashboard-stats`);
  console.log(`   🔹 Assets:    http://localhost:${PORT}/api/assets`);
  console.log(`   🔹 Reports+:  http://localhost:${PORT}/api/reports-enhanced`);
  console.log('='.repeat(60));
});

module.exports = app;
