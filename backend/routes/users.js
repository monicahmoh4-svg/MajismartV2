const router = require('express').Router();
const db = require('../db');
const { authMiddleware, requireRole } = require('../middleware/auth');

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
