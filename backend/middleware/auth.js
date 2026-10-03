const jwt = require('jsonwebtoken');

// Canonical role model for MajiSmart OS v6
// super_admin > county_admin > operator > technician > citizen > viewer
// Legacy aliases: admin -> super_admin, county_officer -> county_admin,
// community/community_manager -> citizen
const ROLE_ALIASES = {
  admin: 'super_admin',
  county_officer: 'county_admin',
  community: 'citizen',
  community_manager: 'citizen',
};

function normalizeRole(role) {
  if (!role) return 'citizen';
  return ROLE_ALIASES[role] || role;
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
    console.error('FATAL: JWT_SECRET not set in production');
    return res.status(500).json({ error: 'Server misconfigured' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'majismart-secret-key');
    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: normalizeRole(decoded.role),
      tenant_id: decoded.tenant_id || decoded.county || 'system',
      county: decoded.county,
    };
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

// Backwards-compatible alias: many legacy routes import { authMiddleware }
function authMiddleware(req, res, next) {
  return authenticateToken(req, res, next);
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    req.user = null;
    return next();
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'majismart-secret-key');
    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: normalizeRole(decoded.role),
      tenant_id: decoded.tenant_id || decoded.county || 'system',
      county: decoded.county,
    };
    next();
  } catch (error) {
    req.user = null;
    next();
  }
}

module.exports = { authenticateToken, authMiddleware, optionalAuth, normalizeRole, ROLE_ALIASES };
