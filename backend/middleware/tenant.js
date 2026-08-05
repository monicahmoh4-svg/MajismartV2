// Tenant scoping middleware - automatically filters queries by tenant
function tenantScope(req, res, next) {
  // Super admins see all data
  if (req.user?.role === 'super_admin') {
    req.tenantFilter = {};
    req.tenantId = null;
    return next();
  }

  // All other users are scoped to their tenant
  if (!req.user?.tenant_id) {
    return res.status(403).json({ error: 'Tenant context required' });
  }

  req.tenantFilter = { tenant_id: req.user.tenant_id };
  req.tenantId = req.user.tenant_id;
  next();
}

// Helper to build tenant-scoped WHERE clauses
function buildTenantWhere(req, additionalConditions = {}, params = [], startParam = 1) {
  const conditions = [];
  
  // Add tenant filter for non-super-admins
  if (req.user?.role !== 'super_admin' && req.user?.tenant_id) {
    conditions.push(`tenant_id = $${startParam}`);
    params.push(req.user.tenant_id);
    startParam++;
  }

  // Add additional conditions
  for (const [key, value] of Object.entries(additionalConditions)) {
    if (value !== undefined && value !== null && value !== '') {
      conditions.push(`${key} = $${startParam}`);
      params.push(value);
      startParam++;
    }
  }

  return {
    where: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    params,
    nextParam: startParam
  };
}

module.exports = { tenantScope, buildTenantWhere };
