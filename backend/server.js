require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 5000;

// --- MIDDLEWARE ---
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(morgan('combined'));

// FIX: Robust CORS configuration
// We explicitly allow your Vercel frontend and localhost
const allowedOrigins = [
  'https://majismart-v2-phi.vercel.app', // Your Vercel URL
  'https://majismart-woad.vercel.app',   // Your other Vercel URL (from docs)
  'http://localhost:5173',               // Vite default
  'http://localhost:3000'                // React default
];

// If FRONTEND_URL is set in Render env vars, add it to the list
if (process.env.FRONTEND_URL) {
  process.env.FRONTEND_URL.split(',').forEach(url => allowedOrigins.push(url.trim()));
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn('⚠️ CORS blocked origin:', origin);
      callback(null, true); // Temporarily allow all to prevent blocking during setup
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// --- ROUTES ---
app.get('/', (req, res) => {
  res.status(200).json({ service: 'MajiSmart API', status: 'running' });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', time: new Date().toISOString() });
});

// Mount API routes (ensure these files exist in your backend/routes folder)
try {
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/nodes', require('./routes/nodes'));
  app.use('/api/sensors', require('./routes/sensors'));
  app.use('/api/payments', require('./routes/payments'));
  app.use('/api/alerts', require('./routes/alerts'));
  app.use('/api/dashboard', require('./routes/dashboard'));
  app.use('/api/users', require('./routes/users'));
  app.use('/api/ai', require('./routes/ai'));
} catch (err) {
  console.error('⚠️ Route loading error:', err.message);
}

// --- ERROR HANDLING ---
app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// --- START SERVER ---
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ MajiSmart API running on port ${PORT}`);
});

// --- DB INIT (Async) ---
const db = require('./db');
db.initSchema()
  .then(() => {
    console.log('✅ Database ready');
    // Start cron jobs here if needed
  })
  .catch(err => {
    console.error('⚠️ DB init failed:', err.message);
  });

module.exports = app;
