const router = require('express').Router();
const brain = require('../services/assistantBrain');

// Public assistant API — visitors need help BEFORE they have accounts,
// so these endpoints require no auth. Input is length-capped, nothing
// personal is stored.

// GET /api/assistant/topics — quick-topic chips for the widget
router.get('/topics', (req, res) => {
  res.json(brain.TOPICS);
});

// POST /api/assistant/chat { message } — ask Maji anything
router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body || {};
    if (!message || !String(message).trim()) {
      return res.status(400).json({ error: 'message is required' });
    }
    if (String(message).length > 500) {
      return res.status(400).json({ error: 'message too long (max 500 chars)' });
    }
    const out = await brain.answer(String(message).trim());
    res.json(out);
  } catch (err) {
    console.error('assistant chat failed:', err.message);
    res.json(brain.fallback(''));
  }
});

// POST /api/assistant/topic/:id — one-tap topic answer (no typing needed)
router.post('/topic/:id', async (req, res) => {
  try {
    res.json(brain.topicById(req.params.id));
  } catch (err) {
    res.json(brain.fallback(''));
  }
});

module.exports = router;
