const router = require('express').Router();
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

// User <-> admin support channel. Citizens write to the admin pool
// (recipient_id NULL); admins read everything and reply via notifications.

// POST /api/messages — any signed-in user writes to admins
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { subject, body, recipient_id } = req.body || {};
    if (!body || !String(body).trim()) return res.status(400).json({ error: 'Message body is required' });
    let to = null;
    if (recipient_id) {
      const { rows: u } = await db.query(
        `SELECT id FROM users WHERE id=$1 AND role IN ('admin','super_admin','county_officer','county_admin')`,
        [recipient_id]
      );
      if (!u.length) return res.status(404).json({ error: 'Recipient is not support staff' });
      to = recipient_id;
    }
    const { rows } = await db.query(
      `INSERT INTO messages (sender_id, recipient_id, subject, body) VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.user.id, to, subject ? String(subject).slice(0, 200) : null, String(body).slice(0, 4000)]
    );
    res.status(201).json({ ...rows[0], message: 'Message sent — the admin team will respond as a notification.' });
  } catch (e) { res.status(500).json({ error: 'Failed to send message' }); }
});

// GET /api/messages/mine — my sent messages
router.get('/mine', authMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT m.*, u.name as recipient_name FROM messages m
       LEFT JOIN users u ON u.id=m.recipient_id
       WHERE m.sender_id=$1 ORDER BY m.created_at DESC LIMIT 50`,
      [req.user.id]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: 'Failed to fetch messages' }); }
});

// GET /api/messages/inbox — admin pool: everything, unread first
router.get('/inbox', authMiddleware, requireRole('super_admin', 'county_admin'), async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT m.*, s.name as sender_name, s.email as sender_email, s.county as sender_county, s.role as sender_role
       FROM messages m LEFT JOIN users s ON s.id=m.sender_id
       ORDER BY m.is_read ASC, m.created_at DESC LIMIT 200`
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: 'Failed to fetch inbox' }); }
});

// PATCH /api/messages/:id/read — admin marks handled
router.patch('/:id/read', authMiddleware, requireRole('super_admin', 'county_admin'), async (req, res) => {
  try {
    await db.query('UPDATE messages SET is_read=true WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: 'Failed to update message' }); }
});

module.exports = router;
