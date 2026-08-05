const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

// ✅ CORRECT IMPORTS
const { authenticateToken } = require('../middleware/auth');
const { requirePermission, requireRole } = require('../middleware/rbac');

const JWT_SECRET = process.env.JWT_SECRET || 'majismart-secret-key';

// Self-healing: ensure users table has role and tenant_id columns
async function ensureUserSchema() {
  try {
    const { rows: roleCheck } = await db.query(`
      SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role')
    `);
    
    if (!roleCheck[0].exists) {
      await db.query(`ALTER TABLE users ADD COLUMN role VARCHAR(30) DEFAULT 'citizen'`);
      await db.query(`ALTER TABLE users ADD COLUMN tenant_id VARCHAR(100)`);
      console.log('✅ Added role and tenant_id to users table');
    }
  } catch (error) {
    console.error('Failed to ensure user schema:', error.message);
  }
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    await ensureUserSchema();
    
    const { name, email, password, county } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const { rows: existing } = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const { rows } = await db.query(
      `INSERT INTO users (name, email, password, county, role, tenant_id) 
       VALUES ($1, $2, $3, $4, 'citizen', $4) RETURNING id, name, email, county, role, tenant_id`,
      [name, email, hashedPassword, county || null]
    );

    const user = rows[0];
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role, tenant_id: user.tenant_id, county: user.county },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: { id: user.id, name: user.name, email: user.email, county: user.county, role: user.role }
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
        role: user.role || 'citizen' 
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed', message: error.message });
  }
});

// GET /api/auth/me - Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, name, email, county, role, tenant_id FROM users WHERE id = $1',
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

    res.json({ message: 'Role updated', user: rows[0] });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

module.exports = router;
