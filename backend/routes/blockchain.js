// backend/routes/blockchain.js
const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth');
const bc = require('../services/blockchainService');

// Helper — consistent "not configured" response
const notConfigured = (res) => res.status(503).json({
  error: 'Blockchain not configured',
  message: 'Set CELO_RPC_URL, DEPLOYER_PRIVATE_KEY and contract addresses on Render to enable Web3 features.',
  docs: 'https://docs.celo.org/developer/deploy/mainnet',
});

// ── GET /api/blockchain/status ─────────────────────────────────────────
// Public — frontend uses this to know if Web3 is live
router.get('/status', async (req, res) => {
  try {
    if (!bc.isEnabled()) {
      return res.json({ enabled: false, message: 'Blockchain not configured on this deployment.' });
    }
    const info = await bc.getNetworkInfo();
    res.json({ enabled: true, ...info });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/blockchain/balance/:address ────────────────────────────────
// Returns MAJI token balance + litre equivalent for a wallet address
router.get('/balance/:address', async (req, res) => {
  if (!bc.isEnabled()) return notConfigured(res);
  try {
    const bal = await bc.getMajiBalance(req.params.address);
    if (!bal) return res.status(404).json({ error: 'Could not fetch balance' });
    res.json({ address: req.params.address, ...bal });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/blockchain/payment-stats ──────────────────────────────────
router.get('/payment-stats', async (req, res) => {
  if (!bc.isEnabled()) return notConfigured(res);
  try {
    const stats = await bc.getPaymentStats();
    res.json(stats || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/blockchain/quality/:nodeId ─────────────────────────────────
// On-chain quality data for a specific node
router.get('/quality/:nodeId', async (req, res) => {
  if (!bc.isEnabled()) return notConfigured(res);
  try {
    const quality = await bc.getOnChainQuality(req.params.nodeId);
    if (!quality) return res.status(404).json({ error: 'No on-chain data for this node' });
    res.json(quality);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/blockchain/proposals ──────────────────────────────────────
// List DAO proposals (paginated)
router.get('/proposals', async (req, res) => {
  if (!bc.isEnabled()) return notConfigured(res);
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const proposals = await bc.getDAOProposals(limit);
    res.json(proposals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/blockchain/register-node ──────────────────────────────────
// Admin only — register a node on the oracle
router.post('/register-node', authMiddleware, async (req, res) => {
  if (!bc.isEnabled()) return notConfigured(res);
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const { nodeId } = req.body;
  if (!nodeId) return res.status(400).json({ error: 'nodeId required' });
  try {
    const txHash = await bc.registerNodeOnChain(nodeId);
    res.json({ success: true, txHash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/blockchain/reward-reporter ────────────────────────────────
// County officer / admin resolves a report → rewards the citizen with MAJI
router.post('/reward-reporter', authMiddleware, async (req, res) => {
  if (!bc.isEnabled()) return notConfigured(res);
  const allowed = ['admin', 'county_officer'];
  if (!allowed.includes(req.user.role)) return res.status(403).json({ error: 'Not authorised' });
  const { reporterWallet, reportId } = req.body;
  if (!reporterWallet || !reportId) return res.status(400).json({ error: 'reporterWallet and reportId required' });
  try {
    const txHash = await bc.rewardReporter(reporterWallet, reportId);
    res.json({ success: true, txHash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
