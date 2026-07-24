const router = require('express').Router();
const ai = require('../services/aiService');
const { authMiddleware } = require('../middleware/auth');

router.get('/leak-detection/:nodeId', async (req, res) => {
  try { res.json(await ai.detectLeak(req.params.nodeId)); } catch (err) { res.status(500).json({ error: err.message }); }
});
router.get('/leak-detection', async (req, res) => {
  try { res.json(await ai.detectLeaksSystemWide()); } catch (err) { res.status(500).json({ error: err.message }); }
});
router.get('/forecast/:nodeId', async (req, res) => {
  try { res.json(await ai.forecastConsumption(req.params.nodeId, parseInt(req.query.days)||7)); } catch (err) { res.status(500).json({ error: err.message }); }
});
router.get('/anomalies/:nodeId', async (req, res) => {
  try { res.json(await ai.detectAnomalies(req.params.nodeId)); } catch (err) { res.status(500).json({ error: err.message }); }
});
router.get('/recommendations/:nodeId', async (req, res) => {
  try { res.json(await ai.getRecommendations(req.params.nodeId)); } catch (err) { res.status(500).json({ error: err.message }); }
});
router.get('/insights', async (req, res) => {
  try { res.json(await ai.systemInsights()); } catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: 'message is required' });
    res.json(await ai.chatAssistant(message.trim()));
  } catch (err) { res.status(500).json({ error: err.message }); }
});
module.exports = router;
