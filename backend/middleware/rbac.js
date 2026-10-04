// RBAC + tenant enforcement for MajiSmart OS v6
// Provides requireRole / requirePermission used by routes/auth.js and others.
const { normalizeRole } = require('./auth');

const ROLE_RANK = {
  viewer: 0,
  citizen: 1,
  technician: 2,
  operator: 3,
  county_admin: 4,
  super_admin: 5,
};

function requireRole(...allowed) {
  const normalized = allowed.map(normalizeRole);
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    const role = normalizeRole(req.user.role);
    if (!normalized.includes(role)) {
      return res.status(403).json({ error: 'Forbidden: insufficient role' });
    }
    next();
  };
}

// Minimal permission map. county_admin and super_admin get broad access.
// Operators/technicians get operational read/write. Citizens get self-service.
const PERMISSIONS = {
  super_admin: ['*'],
  county_admin: ['users:read', 'reports:read', 'reports:write', 'assets:read', 'assets:write', 'payments:read', 'gis:read', 'gis:write', 'workorders:read', 'workorders:write'],
  operator: ['reports:read', 'reports:write', 'assets:read', 'gis:read', 'workorders:read', 'workorders:write', 'payments:read'],
  technician: ['reports:read', 'reports:write', 'assets:read', 'workorders:read', 'workorders:write'],
  citizen: ['reports:write', 'payments:write'],
  viewer: [],
};

function hasPermission(role, resource, action) {
  role = normalizeRole(role);
  const perms = PERMISSIONS[role] || [];
  if (perms.includes('*')) return true;
  return perms.includes(`${resource}:${action}`) || perms.includes(`${resource}:write`);
}

function requirePermission(resource, action) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    if (hasPermission(req.user.role, resource, action)) return next();
    return res.status(403).json({ error: `Forbidden: need ${resource}:${action}` });
  };
}

// Field-work gate: operators/technicians with pending/rejected KYC cannot
// take jobs, update work orders, provision devices or create nodes — until an
// admin approves them. Everyone else passes through. Fresh kyc_status lookup
// (not JWT) so approval takes effect without re-login. Unknown/query errors
// fail OPEN to keep field ops running through transient DB hiccups.
function requireVerified(req, res, next) {
  const role = normalizeRole(req.user && req.user.role);
  if (role !== 'operator' && role !== 'technician') return next();
  try {
    const db = require('../db');
    db.query('SELECT kyc_status FROM users WHERE id=$1', [req.user.id])
      .then(({ rows }) => {
        const status = (rows[0] && rows[0].kyc_status) || 'verified';
        if (status !== 'verified') {
          return res.status(403).json({
            error: 'Account pending verification — jobs unlock once an admin approves your ID and certifications.',
          });
        }
        next();
      })
      .catch(() => next());
  } catch (e) {
    next();
  }
}

module.exports = { requireRole, requirePermission, hasPermission, ROLE_RANK, PERMISSIONS, requireVerified };
