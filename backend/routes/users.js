const router = require('express').Router();
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
router.get('/', authMiddleware, requireRole('admin','county_officer'), async (req, res) => {
  try {
    const { rows } = await db.query('SELECT id,name,email,role,county,phone,created_at FROM users ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT id,name,email,role,county,phone,created_at FROM users WHERE id=$1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    // Users may edit their own profile; editing others requires staff role.
    const { normalizeRole } = require('../middleware/auth');
    const role = normalizeRole(req.user.role);
    if (req.user.id !== req.params.id && !['super_admin', 'county_admin'].includes(role)) {
      return res.status(403).json({ error: 'You can only edit your own profile' });
    }
    const { name, phone, county } = req.body;
    const { rows } = await db.query(
      `UPDATE users SET name=COALESCE($1,name), phone=COALESCE($2,phone), county=COALESCE($3,county), updated_at=NOW()
       WHERE id=$4 RETURNING id,name,email,role,county,phone`,
      [name, phone, county, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;
