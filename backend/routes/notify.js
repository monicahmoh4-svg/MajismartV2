const router = require('express').Router();
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { logAudit } = require('../services/audit');

// POST /api/notifications — admin composes a notice to one user or all
// (user_id NULL = broadcast). County admins may only write their county.
router.post('/', authMiddleware, requireRole('super_admin', 'county_admin'), async (req, res) => {
  try {
    const { user_id, title, message, broadcast } = req.body || {};
    if (!title || !message) return res.status(400).json({ error: 'title and message are required' });
    const { normalizeRole } = require('../middleware/auth');
    const role = normalizeRole(req.user.role);
    let target = null;
    if (!broadcast) {
      if (!user_id) return res.status(400).json({ error: 'user_id or broadcast:true required' });
      const { rows: u } = await db.query('SELECT id, county FROM users WHERE id=$1', [user_id]);
      if (!u.length) return res.status(404).json({ error: 'User not found' });
      if (role === 'county_admin' && req.user.county && u[0].county !== req.user.county) {
        return res.status(403).json({ error: 'Cannot notify users outside your county' });
      }
      target = user_id;
    }
    const { rows } = await db.query(
      `INSERT INTO notifications (user_id, title, message, created_by) VALUES ($1,$2,$3,$4) RETURNING *`,
      [target, String(title).slice(0, 200), String(message).slice(0, 2000), req.user.id]
    );
    logAudit(req.user.id, 'notification.send', 'notifications', rows[0].id, { broadcast: !!broadcast });
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: 'Failed to send notification' }); }
});

// GET /api/notifications/mine — own notices + broadcasts, newest first
router.get('/mine', authMiddleware, async (req, res) => {
  try {
    const onlyUnread = req.query.unread === '1';
    const { rows } = await db.query(
      `SELECT * FROM notifications WHERE user_id=$1 OR user_id IS NULL
       ${onlyUnread ? 'AND is_read=false' : ''} ORDER BY created_at DESC LIMIT 50`,
      [req.user.id]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: 'Failed to fetch notifications' }); }
});

// PATCH /api/notifications/:id/read — mark own notice read
router.patch('/:id/read', authMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query(
      `UPDATE notifications SET is_read=true WHERE id=$1 AND (user_id=$2 OR user_id IS NULL) RETURNING id`,
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Notification not found' });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: 'Failed to update notification' }); }
});

module.exports = router;
