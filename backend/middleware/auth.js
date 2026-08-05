const jwt = require('jsonwebtoken');

// Enhanced auth middleware that extracts role and tenant
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'majismart-secret-key');
    
    // Attach user info to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role || 'citizen',
      tenant_id: decoded.tenant_id || decoded.county || 'system',
      county: decoded.county
    };
    
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

// Optional auth - doesn't fail if no token (for public routes)
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
      role: decoded.role || 'citizen',
      tenant_id: decoded.tenant_id || decoded.county || 'system',
      county: decoded.county
    };
    next();
  } catch (error) {
    req.user = null;
    next();
  }
}

module.exports = { authenticateToken, optionalAuth };
