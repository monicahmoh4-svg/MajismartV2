import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, Wifi, CreditCard, Bell, BarChart3,
  Settings, LogOut, Menu, X, Droplets, Users, Wrench, Brain
} from 'lucide-react'

const NAV_BY_ROLE = {
  admin: [
    { to: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/app/nodes',     icon: Wifi,            label: 'All Nodes' },
    { to: '/app/payments',  icon: CreditCard,       label: 'Payments' },
    { to: '/app/alerts',    icon: Bell,             label: 'Alerts' },
    { to: '/app/ai-insights', icon: Brain,          label: 'AI Insights' },
    { to: '/app/analytics', icon: BarChart3,        label: 'Analytics' },
    { to: '/app/users',     icon: Users,            label: 'Users' },
    { to: '/app/settings',  icon: Settings,         label: 'Settings' },
  ],
  county_officer: [
    { to: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/app/nodes',     icon: Wifi,            label: 'County Nodes' },
    { to: '/app/payments',  icon: CreditCard,       label: 'Revenue' },
    { to: '/app/alerts',    icon: Bell,             label: 'Alerts' },
    { to: '/app/ai-insights', icon: Brain,          label: 'AI Insights' },
    { to: '/app/analytics', icon: BarChart3,        label: 'Analytics' },
    { to: '/app/settings',  icon: Settings,         label: 'Settings' },
  ],
  operator: [
    { to: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/app/nodes',     icon: Wifi,            label: 'My Nodes' },
    { to: '/app/payments',  icon: CreditCard,       label: 'Payments' },
    { to: '/app/alerts',    icon: Bell,             label: 'Alerts' },
    { to: '/app/ai-insights', icon: Brain,          label: 'AI Insights' },
    { to: '/app/maintenance', icon: Wrench,         label: 'Maintenance' },
    { to: '/app/settings',  icon: Settings,         label: 'Settings' },
  ],
  community: [
    { to: '/app/dashboard', icon: LayoutDashboard, label: 'Overview' },
    { to: '/app/nodes',     icon: Wifi,            label: 'Water Points' },
    { to: '/app/payments',  icon: CreditCard,       label: 'Pay for Water' },
    { to: '/app/alerts',    icon: Bell,             label: 'Alerts' },
    { to: '/app/ai-insights', icon: Brain,          label: 'AI Insights' },
  ],
}

const ROLE_COLOR = {
  admin:          { bg: '#1a5f9e', badge: '#e8f4fd', text: '#1a5f9e', label: 'System Admin' },
  county_officer: { bg: '#0d6e56', badge: '#e1f5ee', text: '#0d6e56', label: 'County Officer' },
  operator:       { bg: '#7a3fb5', badge: '#f0e8fc', text: '#7a3fb5', label: 'Node Operator' },
  community:      { bg: '#b5720a', badge: '#fef3d8', text: '#b5720a', label: 'Community Manager' },
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 960 : true
  )
  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 960)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return isDesktop
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const isDesktop = useIsDesktop()
  const [mobileOpen, setMobileOpen] = useState(false)
  
  const role = user?.role || 'community'
  const nav = NAV_BY_ROLE[role] || NAV_BY_ROLE.community
  const rc = ROLE_COLOR[role] || ROLE_COLOR.community
  const sidebarVisible = isDesktop || mobileOpen
  
  const handleLogout = () => { 
    logout()
    navigate('/') 
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--gray-50)' }}>
      {/* Sidebar */}
      <aside style={{
        width: 240, background: '#0c1a2e', color: 'white',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: sidebarVisible ? 0 : -240,
        height: '100vh', zIndex: 100, transition: 'left .25s ease',
        boxShadow: !isDesktop && mobileOpen ? '4px 0 20px rgba(0,0,0,.3)' : 'none'
      }}>
        <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              background: `linear-gradient(135deg,${rc.bg},#0d9e75)`,
              borderRadius: 10, width: 36, height: 36,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Droplets size={20} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>MajiSmart</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: -2 }}>Water Intelligence</div>
            </div>
          </div>
        </div>
        
        <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 99,
            background: rc.bg, color: 'white', textTransform: 'uppercase', letterSpacing: .5
          }}>
            {rc.label}
          </span>
        </div>
        
        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} onClick={() => setMobileOpen(false)}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 8, marginBottom: 2,
                fontSize: 14, fontWeight: isActive ? 600 : 400,
                color: isActive ? 'white' : 'rgba(255,255,255,.55)',
                background: isActive ? `${rc.bg}55` : 'transparent',
                transition: 'all .15s', textDecoration: 'none',
                borderLeft: isActive ? `3px solid ${rc.bg === '#0c1a2e' ? '#1a7fd4' : rc.bg}` : '3px solid transparent'
              })}>
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>
        
        <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: `linear-gradient(135deg,${rc.bg},#0d9e75)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: 14, flexShrink: 0
            }}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.85)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name || 'User'}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)' }}>
                {user?.county || 'Kenya'}
              </div>
            </div>
          </div>
          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: 8, width: '100%',
            padding: '8px 12px', background: 'rgba(217,48,37,.15)',
            color: '#f28b82', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer'
          }}>
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {!isDesktop && mobileOpen && (
        <div onClick={() => setMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 99 }} />
      )}

      {/* Main area */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0,
        marginLeft: isDesktop ? 240 : 0, transition: 'margin-left .25s ease'
      }}>
        <header style={{
          background: 'white', borderBottom: '1px solid var(--gray-200)',
          padding: '0 20px', height: 58, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50,
          boxShadow: '0 1px 4px rgba(0,0,0,.06)'
        }}>
          {!isDesktop ? (
            <button onClick={() => setMobileOpen(!mobileOpen)} style={{
              background: 'none', border: 'none', padding: 6,
              borderRadius: 6, color: 'var(--gray-600)', cursor: 'pointer'
            }}>
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          ) : <div />}
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99,
              background: rc.badge, color: rc.text
            }}>
              {rc.label}
            </span>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: `linear-gradient(135deg,${rc.bg},#0d9e75)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: 13
            }}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
        </header>
        
        <main style={{ flex: 1, padding: '24px 20px', maxWidth: 1200, width: '100%', margin: '0 auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
