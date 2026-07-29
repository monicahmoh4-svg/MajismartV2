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
const countyRoutes = require('./routes/county');
const operatorRoutes = require('./routes/operator');
const assetsRoutes = require('./routes/assets');

// ============================================
// ROUTE VALIDATION & MOUNTING (NO MORE GUESSING)
// ============================================
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the MajiSmart Enterprise API', status: 'running', version: '2.0.0' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '2.0.0', service: 'MajiSmart API' });
});

const routesToMount = [
  { path: '/api/auth', route: authRoutes, name: 'auth' },
  { path: '/api/citizen', route: citizenRoutes, name: 'citizen' },
  { path: '/api/reports', route: reportRoutes, name: 'reports' },
  { path: '/api/alerts', route: alertRoutes, name: 'alerts' },
  { path: '/api/datasets', route: datasetRoutes, name: 'datasets' },
  { path: '/api/payments', route: paymentRoutes, name: 'payments' },
  { path: '/api/ai', route: aiRoutes, name: 'ai' },
  { path: '/api/gis', route: gisRoutes, name: 'gis' },
  { path: '/api/admin', route: adminRoutes, name: 'admin' },
  { path: '/api/county', route: countyRoutes, name: 'county' },
  { path: '/api/operator', route: operatorRoutes, name: 'operator' },
  { path: '/api/assets', route: assetsRoutes, name: 'assets' }
];

for (const { path, route, name } of routesToMount) {
  if (typeof route !== 'function') {
    console.error(`\n❌ FATAL ERROR: ${name}Routes is not a function!`);
    console.error(`   Type received: ${typeof route}`);
    console.error(`   ACTION REQUIRED: Open backend/routes/${name}.js and ensure the VERY LAST LINE is exactly:`);
    console.error(`   module.exports = router;\n`);
    process.exit(1); // Stop the server immediately and show the error
  }
  app.use(path, route);
}

// ============================================
// ERROR HANDLING
// ============================================
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', message: `Route ${req.originalUrl} not found.` });
});

app.use((err, req, res, next) => {
  console.error('❌ Unhandled Error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
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
  console.log('='.repeat(60));
});

module.exports = app;
