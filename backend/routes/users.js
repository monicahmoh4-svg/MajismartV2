const router = require('express').Router();
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
router.get('/', authMiddleware, requireRole('admin','county_officer'), async (req, res) => {
  try {
    const { role, kyc_status, county } = req.query;
    let sql = 'SELECT id,name,email,role,county,phone,kyc_status,created_at FROM users WHERE 1=1';
    const params = [];
    if (role) { params.push(role); sql += ` AND role=$${params.length}`; }
    if (kyc_status) { params.push(kyc_status); sql += ` AND COALESCE(kyc_status,'verified')=$${params.length}`; }
    if (county) { params.push(county); sql += ` AND county=$${params.length}`; }
    sql += ' ORDER BY created_at DESC';
    const { rows } = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// GET /api/users/kyc-pending — KYC review queue with documents
router.get('/kyc-pending', authMiddleware, requireRole('admin','county_officer'), async (req, res) => {
  try {
    const { normalizeRole } = require('../middleware/auth');
    const role = normalizeRole(req.user.role);
    let sql = `SELECT id,name,email,phone,county,role,kyc_status,national_id,
      id_document,certifications,base_location,base_latitude,base_longitude,created_at
      FROM users WHERE COALESCE(kyc_status,'verified')='pending'
      AND role IN ('operator','technician','county_officer','admin')`;
    const params = [];
    if (role === 'county_admin' && req.user.county) {
      params.push(req.user.county);
      sql += ` AND county=$${params.length}`;
    }
    sql += ' ORDER BY created_at ASC';
    const { rows } = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// PATCH /api/users/:id/kyc — approve or reject a field account
router.patch('/:id/kyc', authMiddleware, requireRole('admin','county_officer'), async (req, res) => {
  try {
    const { status } = req.body || {};
    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'status must be verified or rejected' });
    }
    const { normalizeRole } = require('../middleware/auth');
    const role = normalizeRole(req.user.role);
    const { rows: found } = await db.query('SELECT id, county, role FROM users WHERE id=$1', [req.params.id]);
    if (!found.length) return res.status(404).json({ error: 'User not found' });
    if (role === 'county_admin' && req.user.county && found[0].county !== req.user.county) {
      return res.status(403).json({ error: 'Cannot decide accounts outside your county' });
    }
    const { rows } = await db.query(
      `UPDATE users SET kyc_status=$1, updated_at=NOW() WHERE id=$2
       RETURNING id,name,email,role,county,kyc_status`,
      [status, req.params.id]
    );
    try {
      const { logAudit } = require('../services/audit');
      logAudit(req.user.id, 'user.kyc.decision', 'users', rows[0].id, { status });
    } catch (_) { /* audit never blocks */ }
    res.json(rows[0]);
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
