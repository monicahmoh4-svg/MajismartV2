require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(morgan('combined'));

const allowedOrigins = (process.env.FRONTEND_URL || '*').split(',').map(o => o.trim());
app.use(cors({ origin: allowedOrigins.includes('*') ? '*' : allowedOrigins, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => res.json({ service: 'MajiSmart API', status: 'running', health: '/api/health' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '2.0.0', web3: require('./services/blockchainService').isEnabled(), time: new Date().toISOString() });
});

app.use('/api/auth',       require('./routes/auth'));
app.use('/api/nodes',      require('./routes/nodes'));
app.use('/api/sensors',    require('./routes/sensors'));
app.use('/api/payments',   require('./routes/payments'));
app.use('/api/alerts',     require('./routes/alerts'));
app.use('/api/dashboard',  require('./routes/dashboard'));
app.use('/api/users',      require('./routes/users'));
app.use('/api/ai',         require('./routes/ai'));
app.use('/api/reports',    require('./routes/reports'));
app.use('/api/citizen',    require('./routes/citizen'));
app.use('/api/blockchain', require('./routes/blockchain'));

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => console.log(`✅ MajiSmart API running on port ${PORT}`));

const db = require('./db');
const bc = require('./services/blockchainService');

db.initSchema()
  .then(async () => {
    console.log('✅ Database ready');
    await bc.init();
    startCron();
  })
  .catch(err => {
    console.error('⚠️  DB init failed (server still running):', err.message);
    bc.init().catch(() => {});
  });

function startCron() {
  try {
    const cron = require('node-cron');
    cron.schedule('*/2 * * * *', async () => {
      try {
        const { rows: nodes } = await db.query(`SELECT id FROM nodes WHERE status='active' LIMIT 20`);
        for (const node of nodes) {
          const level = Math.floor(40 + Math.random() * 55);
          const flow  = parseFloat((2 + Math.random() * 8).toFixed(2));
          const turb  = parseFloat((0.3 + Math.random() * 3).toFixed(2));
          const temp  = parseFloat((18 + Math.random() * 10).toFixed(1));
          await db.query(
            `INSERT INTO sensor_readings (node_id, water_level, flow_rate, turbidity, temperature) VALUES ($1,$2,$3,$4,$5)`,
            [node.id, level, flow, turb, temp]
          );
          if (level < 20) {
            await db.query(
              `INSERT INTO alerts (node_id, type, message, severity) VALUES ($1,'low_water','Tank level critically low: '||$2||'%','critical')`,
              [node.id, level]
            );
          }
          const { rows: cnt } = await db.query(`SELECT COUNT(*) FROM sensor_readings WHERE node_id=$1`, [node.id]);
          if (parseInt(cnt[0].count) % 10 === 0 && bc.isEnabled()) {
            bc.submitReadingToOracle(node.id, turb, flow, temp).catch(() => {});
          }
        }
      } catch (e) {}
    });
    cron.schedule('0 * * * *', async () => {
      try {
        if (!bc.isEnabled()) return;
        const { rows } = await db.query(`
          SELECT cr.id, cr.reported_by, u.wallet_address FROM community_reports cr
          JOIN users u ON u.id = cr.reported_by
          WHERE cr.status='resolved' AND cr.updated_at > NOW()-interval '1 hour'
            AND u.wallet_address IS NOT NULL AND cr.blockchain_rewarded=false
        `);
        for (const r of rows) {
          const txHash = await bc.rewardReporter(r.wallet_address, r.id);
          if (txHash) await db.query(`UPDATE community_reports SET blockchain_rewarded=true WHERE id=$1`, [r.id]);
        }
      } catch (e) {}
    });
    console.log('✅ Cron jobs started');
  } catch (e) { console.error('Cron init error:', e.message); }
}

module.exports = app;
