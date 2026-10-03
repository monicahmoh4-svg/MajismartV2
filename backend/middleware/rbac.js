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

module.exports = { requireRole, requirePermission, hasPermission, ROLE_RANK, PERMISSIONS };
