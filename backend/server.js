const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const VERSION = '6.0.1';

// Fail-fast env self-check: Render log showed NODE_ENV=development in prod
// (leaks stacks, disables prod SSL). This makes the misconfig unmissable.
if (process.env.NODE_ENV !== 'production') {
  console.warn(`⚠️  NODE_ENV=${process.env.NODE_ENV || '(unset)'} — set NODE_ENV=production on Render ` +
    `(Dashboard → Environment). Prod mode enables secure cookies/SSL and hides error stacks.`);
}
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET not set — set a 64-char random string on Render (all logins will break on restart without it)');
}

// ---- Security headers (zero-dependency fallback if helmet missing) ----
let helmetMw = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
};
try {
  const helmet = require('helmet');
  helmetMw = helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false });
} catch (e) { console.warn('helmet not installed, using minimal headers'); }
app.use(helmetMw);

// ---- Rate limiting (fallback if package missing) ----
let apiLimiter = (req, res, next) => next();
try {
  const rateLimit = require('express-rate-limit');
  apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 600, standardHeaders: true, legacyHeaders: false });
} catch (e) { console.warn('express-rate-limit not installed, skipping'); }

// ============================================
// CORS CONFIGURATION (deny-by-default)
// ============================================
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
  'https://majismart-v2-phi.vercel.app',
  'https://majismart-v2.vercel.app',
  'https://majismart-v2-git-main-monicahmoh4-svgs-projects.vercel.app',
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    console.warn('CORS blocked origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Request logging with request id
app.use((req, res, next) => {
  req.id = Math.random().toString(36).slice(2, 8);
  console.log(`[${new Date().toISOString()}] [${req.id}] ${req.method} ${req.path}`);
  next();
});
app.use('/api/', apiLimiter);

// ============================================
// DATABASE CONNECTION
// ============================================
const db = require('./db');

db.query('SELECT NOW()')
  .then(() => console.log('Database connected successfully'))
  .catch((err) => console.error('Database connection failed:', err.message));

// Best-effort schema init (non-blocking, never crashes boot)
db.initSchemaSafe = db.initSchemaSafe || (async () => {
  try {
    if (typeof db.initSchema === 'function') await db.initSchema();
    const { ensureProductionTables } = require('./db-extensions');
    await ensureProductionTables();
    console.log('Schema init complete');
  } catch (e) {
    console.warn('Schema init skipped:', e.message);
  }
});
db.initSchemaSafe();

// ============================================
// ROUTE IMPORTS (all mounted; failures isolated)
// ============================================
function safeRequire(path) {
  try { return require(path); }
  catch (e) { console.error(`Route ${path} failed to load:`, e.message); return null; }
}
const authRoutes = safeRequire('./routes/auth');
const citizenRoutes = safeRequire('./routes/citizen');
const reportRoutes = safeRequire('./routes/reports');
const alertRoutes = safeRequire('./routes/alerts');
const datasetRoutes = safeRequire('./routes/datasets');
const paymentRoutes = safeRequire('./routes/payments');
const gisRoutes = safeRequire('./routes/gis');
const adminRoutes = safeRequire('./routes/admin');
const countyRoutes = safeRequire('./routes/county');
const operatorRoutes = safeRequire('./routes/operator');
const assetsRoutes = safeRequire('./routes/assets');
const reportsEnhancedRoutes = safeRequire('./routes/reports-enhanced');
const aiAnalyticsRoutes = safeRequire('./routes/ai-analytics');
const workOrderRoutes = safeRequire('./routes/workorders');
// Previously unmounted (404 for frontend) — now live:
const nodesRoutes = safeRequire('./routes/nodes');
const sensorsRoutes = safeRequire('./routes/sensors');
const usersRoutes = safeRequire('./routes/users');
const dashboardRoutes = safeRequire('./routes/dashboard');
const aiLegacyRoutes = safeRequire('./routes/ai');
const blockchainRoutes = safeRequire('./routes/blockchain');
// New revenue/Kenya-market routes:
const wasrebRoutes = safeRequire('./routes/wasreb');
const estatesRoutes = safeRequire('./routes/estates');
const tokensRoutes = safeRequire('./routes/tokens');

// ============================================
// PUBLIC META
// ============================================
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the MajiSmart OS API',
    status: 'running',
    version: VERSION,
    mission: 'Cut non-revenue water, collect every shilling via M-Pesa, keep water flowing.',
    usefulEndpoints: {
      healthCheck: '/api/health',
      config: '/api/config',
      gisAssets: '/api/gis/assets',
      assetManagement: '/api/assets',
      waterPoints: '/api/nodes',
      sensors: '/api/sensors',
      citizenReports: '/api/reports-enhanced',
      aiAnalytics: '/api/ai/predictive-maintenance',
      workOrders: '/api/workorders',
      wasrebKpis: '/api/wasreb/kpis',
      estates: '/api/estates',
      prepaidTokens: '/api/tokens',
    }
  });
});

app.get('/api/health', async (req, res) => {
  let dbOk = false;
  try { await db.query('SELECT 1'); dbOk = true; } catch (e) { dbOk = false; }
  res.json({ status: dbOk ? 'ok' : 'degraded', timestamp: new Date().toISOString(), version: VERSION, service: 'MajiSmart API', db: dbOk ? 'up' : 'down' });
});

app.get('/api/config', (req, res) => {
  res.json({
    version: VERSION,
    mpesaMode: process.env.MPESA_MODE || (process.env.MPESA_CONSUMER_KEY ? 'daraja' : 'simulation'),
    tariffsKESperM3: 105,
    costPerLitreKES: 0.105,
    supportUssd: '*384*99#',
    counties: 47,
  });
});

// ============================================
// ROUTE MOUNTING
// ============================================
if (authRoutes) app.use('/api/auth', authRoutes);
if (citizenRoutes) app.use('/api/citizen', citizenRoutes);
if (reportRoutes) app.use('/api/reports', reportRoutes);
if (alertRoutes) app.use('/api/alerts', alertRoutes);
if (datasetRoutes) app.use('/api/datasets', datasetRoutes);
if (paymentRoutes) app.use('/api/payments', paymentRoutes);
if (gisRoutes) app.use('/api/gis', gisRoutes);
if (adminRoutes) app.use('/api/admin', adminRoutes);
if (countyRoutes) app.use('/api/county', countyRoutes);
if (operatorRoutes) app.use('/api/operator', operatorRoutes);
if (assetsRoutes) app.use('/api/assets', assetsRoutes);
if (reportsEnhancedRoutes) app.use('/api/reports-enhanced', reportsEnhancedRoutes);
if (aiAnalyticsRoutes) app.use('/api/ai', aiAnalyticsRoutes);
if (workOrderRoutes) app.use('/api/workorders', workOrderRoutes);
if (nodesRoutes) app.use('/api/nodes', nodesRoutes);
if (sensorsRoutes) app.use('/api/sensors', sensorsRoutes);
if (usersRoutes) app.use('/api/users', usersRoutes);
if (dashboardRoutes) app.use('/api/dashboard', dashboardRoutes);
if (aiLegacyRoutes) app.use('/api/ai-legacy', aiLegacyRoutes);
if (blockchainRoutes) app.use('/api/blockchain', blockchainRoutes);
if (wasrebRoutes) app.use('/api/wasreb', wasrebRoutes);
if (estatesRoutes) app.use('/api/estates', estatesRoutes);
if (tokensRoutes) app.use('/api/tokens', tokensRoutes);

// ============================================
// ERROR HANDLING (never leak stack in production)
// ============================================
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', message: `Route ${req.originalUrl} not found.` });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.message);
  const isProd = process.env.NODE_ENV === 'production';
  res.status(err.status || 500).json(isProd ? { error: 'Internal Server Error' } : { error: err.message || 'Internal Server Error' });
});

// ============================================
// SERVER STARTUP
// ============================================
const PORT = process.env.PORT || 5000;

if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log(`MajiSmart OS API v${VERSION} on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('='.repeat(60));
  });
  const shutdown = () => { console.log('Shutting down...'); server.close(() => process.exit(0)); };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

module.exports = app;
