const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

// ✅ CORRECT IMPORTS
const { authenticateToken } = require('../middleware/auth');
const { requirePermission, requireRole } = require('../middleware/rbac');

const JWT_SECRET = process.env.JWT_SECRET || 'majismart-secret-key';

// Self-healing: ensure users table carries auth + KYC columns
async function ensureUserSchema() {
  const adds = [
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(30) DEFAULT 'citizen'`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(100)`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20)`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS national_id VARCHAR(30)`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS id_document TEXT`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS certifications TEXT`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_status VARCHAR(20) DEFAULT 'verified'`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS base_latitude DECIMAL(10,7)`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS base_longitude DECIMAL(10,7)`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS base_location VARCHAR(200)`,
  ];
  for (const ddl of adds) {
    try {
      // eslint-disable-next-line no-await-in-loop
      await db.query(ddl);
    } catch (error) {
      console.error('Failed to ensure user schema:', error.message);
    }
  }
}

// POST /api/auth/register — self-serve only citizen/operator/technician.
// county_admin/super_admin must be granted by an admin (prevents privilege escalation).
router.post('/register', async (req, res) => {
  try {
    await ensureUserSchema();

    const { name, email, password, county, role,
      phone, national_id, id_document, certifications,
      base_latitude, base_longitude, base_location } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const { rows: existing } = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const SELF_SERVE_ROLES = ['citizen', 'operator', 'technician', 'viewer'];
    const safeRole = SELF_SERVE_ROLES.includes(role) ? role : 'citizen';

    // Field staff (operator/technician) submit KYC and start UNVERIFIED —
    // an admin reviews ID + certifications before they can take jobs.
    const needsKyc = ['operator', 'technician'].includes(safeRole);
    if (needsKyc && !national_id) {
      return res.status(400).json({ error: 'National ID number is required for operator/technician accounts' });
    }
    for (const [label, doc] of [['ID document', id_document], ['certifications', certifications]]) {
      if (doc && String(doc).length > 2_500_000) {
        return res.status(413).json({ error: `${label} file too large (max ~2MB)` });
      }
    }
    const lat = base_latitude != null && base_latitude !== '' ? Number(base_latitude) : null;
    const lng = base_longitude != null && base_longitude !== '' ? Number(base_longitude) : null;
    if ((lat != null && (!Number.isFinite(lat) || Math.abs(lat) > 90)) ||
        (lng != null && (!Number.isFinite(lng) || Math.abs(lng) > 180))) {
      return res.status(400).json({ error: 'Invalid base location coordinates' });
    }

    const { rows } = await db.query(
      `INSERT INTO users (name, email, password, county, role, tenant_id, phone,
          national_id, id_document, certifications,
          base_latitude, base_longitude, base_location, kyc_status)
       VALUES ($1,$2,$3,$4,$5,$4,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING id, name, email, county, role, tenant_id, phone, kyc_status`,
      [name, email, hashedPassword, county || null, safeRole,
        phone || null, national_id || null, id_document || null, certifications || null,
        lat, lng, base_location || null, needsKyc ? 'pending' : 'verified']
    );

    const user = rows[0];
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role, tenant_id: user.tenant_id, county: user.county },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: needsKyc
        ? 'Account created — pending admin verification of your ID and certifications. You can explore your dashboard meanwhile.'
        : 'Registration successful',
      token,
      user: { id: user.id, name: user.name, email: user.email, county: user.county, role: user.role, phone: user.phone, kyc_status: user.kyc_status }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed', message: error.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    await ensureUserSchema();
    
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        name: user.name, 
        role: user.role || 'citizen', 
        tenant_id: user.tenant_id || user.county || 'system',
        county: user.county 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        county: user.county,
        role: user.role || 'citizen',
        phone: user.phone || null,
        kyc_status: user.kyc_status || 'verified'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed', message: error.message });
  }
});

// POST /api/auth/admin-login — the ONLY admin entry point (serves /admin).
// Same credential check as login, but non-admin roles are rejected here
// (no token is issued to them) and the attempt is audited.
router.post('/admin-login', async (req, res) => {
  try {
    await ensureUserSchema();

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { normalizeRole } = require('../middleware/auth');
    if (normalizeRole(user.role) !== 'super_admin') {
      try {
        const { logAudit } = require('../services/audit');
        logAudit(user.id, 'auth.admin_login.denied', 'users', user.id, { role: user.role });
      } catch (_) { /* audit never blocks */ }
      return res.status(403).json({ error: 'Admin access only. Staff and citizens use the main login.' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role || 'admin',
        tenant_id: user.tenant_id || user.county || 'system',
        county: user.county
      },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    try {
      const { logAudit } = require('../services/audit');
      logAudit(user.id, 'auth.admin_login', 'users', user.id, {});
    } catch (_) { /* audit never blocks */ }

    res.json({
      message: 'Admin login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        county: user.county,
        role: user.role || 'admin',
        phone: user.phone || null,
        kyc_status: user.kyc_status || 'verified'
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/change-password - rotate own password (verifies current)
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { current_password, new_password } = req.body || {};
    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }
    if (String(new_password).length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }
    const { rows } = await db.query('SELECT password FROM users WHERE id=$1', [req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    const ok = await bcrypt.compare(current_password, rows[0].password);
    if (!ok) return res.status(401).json({ error: 'Current password is incorrect' });
    const hash = await bcrypt.hash(new_password, 10);
    await db.query('UPDATE users SET password=$1, updated_at=NOW() WHERE id=$2', [hash, req.user.id]);
    try {
      const { logAudit } = require('../services/audit');
      logAudit(req.user.id, 'user.password.change', 'users', req.user.id, {});
    } catch (_) { /* audit never blocks */ }
    res.json({ message: 'Password updated. Use it on your next login.' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// GET /api/auth/me - Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, name, email, county, role, tenant_id, phone, kyc_status FROM users WHERE id = $1',
      [req.user.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// GET /api/auth/users - List users (admin only, tenant-scoped)
// ✅ FIXED: requirePermission is now correctly imported and used
router.get('/users', 
  authenticateToken, 
  requirePermission('users', 'read'), 
  async (req, res) => {
  try {
    let query = 'SELECT id, name, email, county, role, tenant_id FROM users';
    const params = [];
    
    // Non-super-admins only see users in their tenant
    if (req.user.role !== 'super_admin') {
      query += ' WHERE tenant_id = $1';
      params.push(req.user.tenant_id);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const { rows } = await db.query(query, params);
    res.json({ users: rows, total: rows.length });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// PUT /api/auth/users/:id/role - Update user role (admin only)
// ✅ FIXED: requireRole is now correctly imported and used
router.put('/users/:id/role',
  authenticateToken,
  requireRole('super_admin', 'county_admin'),
  async (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = ['super_admin', 'county_admin', 'operator', 'technician', 'citizen', 'viewer'];
    
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // County admins can only modify users in their tenant
    if (req.user.role === 'county_admin') {
      const { rows: targetUser } = await db.query(
        'SELECT tenant_id FROM users WHERE id = $1',
        [req.params.id]
      );
      
      if (targetUser.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      if (targetUser[0].tenant_id !== req.user.tenant_id) {
        return res.status(403).json({ error: 'Cannot modify users from other counties' });
      }
      
      // County admins cannot assign super_admin role
      if (role === 'super_admin') {
        return res.status(403).json({ error: 'Cannot assign super_admin role' });
      }
    }

    const { rows } = await db.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role, tenant_id',
      [role, req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    try {
      const { logAudit } = require('../services/audit');
      logAudit(req.user.id, 'user.role.update', 'users', rows[0].id, { role });
    } catch (_) { /* audit never blocks */ }

    res.json({ message: 'Role updated', user: rows[0] });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

module.exports = router;
