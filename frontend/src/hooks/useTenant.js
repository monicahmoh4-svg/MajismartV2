import { useAuth } from '../context/AuthContext'
import { normalizeUiRole, ROLES } from '../lib/roles'

// Multi-tenant hook: every dashboard reads scope from here instead of
// guessing. scope === 'all' (system admin) or a single county tenant.
export function useTenant() {
  const { user } = useAuth()
  const role = normalizeUiRole(user?.role)
  const meta = ROLES[role] || ROLES.community
  const county = user?.county || null
  const scoped = meta.scope !== 'all' && !!county
  return {
    user,
    role,
    meta,
    county,
    scope: meta.scope,
    isAllCounties: meta.scope === 'all',
    // Append to list endpoints that accept ?county=
    countyParam: scoped ? `county=${encodeURIComponent(county)}` : '',
    withCounty: (base) => {
      if (!scoped) return base
      const sep = base.includes('?') ? '&' : '?'
      return `${base}${sep}county=${encodeURIComponent(county)}`
    },
  }
}
