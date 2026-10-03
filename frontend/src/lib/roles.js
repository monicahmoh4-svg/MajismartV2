// Single source of truth for roles, tenants and navigation.
// Backend roles (super_admin, county_admin, operator, technician, citizen,
// viewer + legacy admin/county_officer/community) are normalized to the UI
// role keys the dashboards and nav understand. Tenancy: tenant_id = county;
// `scope` decides whether a role sees everything or only their county.

export const ROLE_ALIASES = {
  super_admin: 'admin',
  county_admin: 'county_officer',
  community: 'community',
  community_manager: 'community',
  citizen: 'community',
};

export const UI_ROLES = ['admin', 'county_officer', 'operator', 'technician', 'community', 'viewer'];

export function normalizeUiRole(role) {
  if (!role) return 'community';
  const r = String(role).toLowerCase();
  const mapped = ROLE_ALIASES[r] || r;
  return UI_ROLES.includes(mapped) ? mapped : 'community';
}

export const ROLES = {
  admin: {
    label: 'System Admin', scope: 'all', countyLocked: false,
    tagline: 'Every county, every shilling, every asset',
    color: { bg: '#1a5f9e', badge: '#e8f4fd', text: '#1a5f9e' },
  },
  county_officer: {
    label: 'County Officer', scope: 'county', countyLocked: true,
    tagline: 'Your county: NRW, revenue, vendors, compliance',
    color: { bg: '#0d6e56', badge: '#e1f5ee', text: '#0d6e56' },
  },
  operator: {
    label: 'Node Operator', scope: 'county', countyLocked: true,
    tagline: 'Your points, readings and collections',
    color: { bg: '#7a3fb5', badge: '#f0e8fc', text: '#7a3fb5' },
  },
  technician: {
    label: 'Technician', scope: 'county', countyLocked: true,
    tagline: 'Your assigned repairs and maintenance',
    color: { bg: '#b45309', badge: '#fef3d8', text: '#b45309' },
  },
  community: {
    label: 'Community', scope: 'county', countyLocked: true,
    tagline: 'Pay, track and report your water',
    color: { bg: '#0e7490', badge: '#e0f7fc', text: '#0e7490' },
  },
  viewer: {
    label: 'Viewer', scope: 'county', countyLocked: true,
    tagline: 'Read-only operational picture',
    color: { bg: '#475569', badge: '#eef2f7', text: '#475569' },
  },
};

// Icon is a string key resolved to lucide components in Layout.jsx.
// Every `to` MUST exist as a route in App.jsx (verified by consistency test).
export const NAV_BY_ROLE = {
  admin: [
    { to: '/app/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { to: '/app/nodes', icon: 'nodes', label: 'All Nodes' },
    { to: '/app/payments', icon: 'payments', label: 'Payments' },
    { to: '/app/maintenance', icon: 'maintenance', label: 'Work Orders' },
    { to: '/app/alerts', icon: 'alerts', label: 'Alerts' },
    { to: '/app/ai-insights', icon: 'ai', label: 'AI Insights' },
    { to: '/app/analytics', icon: 'analytics', label: 'Analytics' },
    { to: '/app/users', icon: 'users', label: 'Users' },
    { to: '/app/settings', icon: 'settings', label: 'Settings' },
  ],
  county_officer: [
    { to: '/app/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { to: '/app/nodes', icon: 'nodes', label: 'County Nodes' },
    { to: '/app/payments', icon: 'payments', label: 'Revenue' },
    { to: '/app/maintenance', icon: 'maintenance', label: 'Work Orders' },
    { to: '/app/alerts', icon: 'alerts', label: 'Alerts' },
    { to: '/app/ai-insights', icon: 'ai', label: 'AI Insights' },
    { to: '/app/analytics', icon: 'analytics', label: 'Analytics' },
    { to: '/app/users', icon: 'users', label: 'Users' },
    { to: '/app/settings', icon: 'settings', label: 'Settings' },
  ],
  operator: [
    { to: '/app/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { to: '/app/nodes', icon: 'nodes', label: 'My Nodes' },
    { to: '/app/payments', icon: 'payments', label: 'Payments' },
    { to: '/app/maintenance', icon: 'maintenance', label: 'Maintenance' },
    { to: '/app/alerts', icon: 'alerts', label: 'Alerts' },
    { to: '/app/ai-insights', icon: 'ai', label: 'AI Insights' },
    { to: '/app/settings', icon: 'settings', label: 'Settings' },
  ],
  technician: [
    { to: '/app/dashboard', icon: 'dashboard', label: 'My Tasks' },
    { to: '/app/maintenance', icon: 'maintenance', label: 'Work Orders' },
    { to: '/app/nodes', icon: 'nodes', label: 'Water Points' },
    { to: '/app/alerts', icon: 'alerts', label: 'Alerts' },
    { to: '/app/settings', icon: 'settings', label: 'Settings' },
  ],
  community: [
    { to: '/app/dashboard', icon: 'dashboard', label: 'Overview' },
    { to: '/app/nodes', icon: 'nodes', label: 'Water Points' },
    { to: '/app/my-water', icon: 'mywater', label: 'My Water' },
    { to: '/app/payments', icon: 'payments', label: 'Pay for Water' },
    { to: '/app/report', icon: 'report', label: 'Report Issue' },
    { to: '/app/alerts', icon: 'alerts', label: 'Alerts' },
    { to: '/app/settings', icon: 'settings', label: 'Settings' },
  ],
  viewer: [
    { to: '/app/dashboard', icon: 'dashboard', label: 'Overview' },
    { to: '/app/nodes', icon: 'nodes', label: 'Water Points' },
    { to: '/app/alerts', icon: 'alerts', label: 'Alerts' },
    { to: '/app/analytics', icon: 'analytics', label: 'Analytics' },
  ],
};

// Which dashboard component a (raw backend) role lands on.
// community_manager keeps the rich manager console; plain citizens get theirs.
export function dashboardFor(role) {
  const r = String(role || '').toLowerCase();
  if (r === 'community_manager') return 'community-mgr';
  const ui = normalizeUiRole(r);
  if (ui === 'admin') return 'admin';
  if (ui === 'county_officer') return 'county';
  if (ui === 'operator') return 'operator';
  if (ui === 'technician') return 'technician';
  if (ui === 'viewer') return 'viewer';
  return 'citizen';
}

export function tenantLabel(user) {
  const role = normalizeUiRole(user?.role);
  if (ROLES[role].scope === 'all') return 'All counties · System';
  return user?.county ? `${user.county} County` : 'County not set';
}

// Expertise gates: viewer is strictly read-only; only staff mutate
// infrastructure (nodes, alerts, assets, user admin).
export function canWrite(role) {
  return normalizeUiRole(role) !== 'viewer';
}
export function canManageNodes(role) {
  return ['admin', 'county_officer', 'operator', 'technician'].includes(normalizeUiRole(role));
}
