const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// ============================================
// CORS CONFIGURATION (Critical for cross-origin requests)
// ============================================
const allowedOrigins = [
  'http://localhost:5173',           // Vite dev server
  'http://localhost:3000',           // Alternative local port
  'https://majismart-v2-phi.vercel.app',  // Production Vercel
  'https://majismart-v2.vercel.app',      // Alternative Vercel URL
  'https://majismart-v2-git-main-monicahmoh4-svgs-projects.vercel.app', // Preview deployments
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      console.warn('⚠️ CORS blocked origin:', origin);
      callback(null, true); // Temporarily allow all during development
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} from ${req.headers.origin || 'unknown'}`);
  next();
});

// ============================================
// DATABASE CONNECTION
// ============================================
const db = require('./db');

// Test database connection on startup
db.query('SELECT NOW()')
  .then(() => console.log('✅ Database connected successfully'))
  .catch((err) => console.error('❌ Database connection failed:', err.message));

// ============================================
// ROUTE IMPORTS
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

// ============================================
// ROUTE MOUNTING
// ============================================

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    service: 'MajiSmart API'
  });
});

// Authentication routes
app.use('/api/auth', authRoutes);

// Citizen portal routes
app.use('/api/citizen', citizenRoutes);

// Community reports
app.use('/api/reports', reportRoutes);

// System alerts
app.use('/api/alerts', alertRoutes);

// Public datasets
app.use('/api/datasets', datasetRoutes);

// Payments and billing
app.use('/api/payments', paymentRoutes);

// AI and analytics
app.use('/api/ai', aiRoutes);

// Enterprise GIS Platform
app.use('/api/gis', gisRoutes);

// Admin Dashboard
app.use('/api/admin', adminRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    method: req.method
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Unhandled Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================
// SERVER STARTUP
// ============================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🚀 MajiSmart Enterprise API Server');
  console.log('='.repeat(60));
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✅ API Base: http://localhost:${PORT}/api`);
  console.log(`✅ Health Check: http://localhost:${PORT}/api/health`);
  console.log(`✅ GIS Endpoint: http://localhost:${PORT}/api/gis/assets`);
  console.log(`✅ Admin Endpoint: http://localhost:${PORT}/api/admin/dashboard-stats`);
  console.log('='.repeat(60));
});

module.exports = app;
