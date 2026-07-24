import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, Wifi, CreditCard, Bell, BarChart3,
  Settings, LogOut, Menu, X, Droplets, Users, Wrench,
  Brain, MessageSquareWarning, Navigation, Wallet, Vote
} from 'lucide-react'

const NAV_BY_ROLE = {
  admin: [
    { to: '/app/dashboard',   icon: LayoutDashboard,      label: 'Dashboard' },
    { to: '/app/nodes',       icon: Wifi,                 label: 'All Nodes' },
    { to: '/app/payments',    icon: CreditCard,           label: 'Payments' },
    { to: '/app/alerts',      icon: Bell,                 label: 'Alerts' },
    { to: '/app/ai-insights', icon: Brain,                label: 'AI Insights' },
    { to: '/app/community',   icon: MessageSquareWarning, label: 'Community Reports' },
    { to: '/app/web3',        icon: Wallet,               label: 'Web3 Wallet', badge: 'NEW' },
    { to: '/app/dao',         icon: Vote,                 label: 'Water DAO',  badge: 'NEW' },
    { to: '/app/analytics',   icon: BarChart3,            label: 'Analytics' },
    { to: '/app/users',       icon: Users,                label: 'Users' },
    { to: '/app/settings',    icon: Settings,             label: 'Settings' },
  ],
  county_officer: [
    { to: '/app/dashboard',   icon: LayoutDashboard,      label: 'Dashboard' },
    { to: '/app/nodes',       icon: Wifi,                 label: 'County Nodes' },
    { to: '/app/payments',    icon: CreditCard,           label: 'Revenue' },
    { to: '/app/alerts',      icon: Bell,                 label: 'Alerts' },
    { to: '/app/ai-insights', icon: Brain,                label: 'AI Insights' },
    { to: '/app/community',   icon: MessageSquareWarning, label: 'Community Reports' },
    { to: '/app/web3',        icon: Wallet,               label: 'Web3 Wallet', badge: 'NEW' },
    { to: '/app/dao',         icon: Vote,                 label: 'Water DAO',  badge: 'NEW' },
    { to: '/app/analytics',   icon: BarChart3,            label: 'Analytics' },
    { to: '/app/settings',    icon: Settings,             label: 'Settings' },
  ],
  operator: [
    { to: '/app/dashboard',   icon: LayoutDashboard,      label: 'Dashboard' },
    { to: '/app/nodes',       icon: Wifi,                 label: 'My Nodes' },
    { to: '/app/payments',    icon: CreditCard,           label: 'Payments' },
    { to: '/app/alerts',      icon: Bell,                 label: 'Alerts' },
    { to: '/app/ai-insights', icon: Brain,                label: 'AI Insights' },
    { to: '/app/community',   icon: MessageSquareWarning, label: 'Community Reports' },
    { to: '/app/web3',        icon: Wallet,               label: 'Web3 Wallet', badge: 'NEW' },
    { to: '/app/dao',         icon: Vote,                 label: 'Water DAO',  badge: 'NEW' },
    { to: '/app/maintenance', icon: Wrench,               label: 'Maintenance' },
    { to: '/app/settings',    icon: Settings,             label: 'Settings' },
  ],
  community: [
    { to: '/app/dashboard',   icon: LayoutDashboard,      label: 'My Home' },
    { to: '/app/find-water',  icon: Navigation,           label: 'Find Water' },
    { to: '/app/my-water',    icon: Wallet,               label: 'My Spending' },
    { to: '/app/community',   icon: MessageSquareWarning, label: 'Report Issue' },
    { to: '/app/ai-insights', icon: Brain,                label: 'AI Insights' },
    { to: '/app/web3',        icon: Wallet,               label: 'Web3 Wallet', badge: 'NEW' },
    { to: '/app/dao',         icon: Vote,                 label: 'Water DAO',  badge: 'NEW' },
    { to: '/app/settings',    icon: Settings,             label: 'Settings' },
  ],
}

const ROLE_COLOR = {
  admin:          { bg: '#2F3C7E', badge: '#E5E7F0', text: '#2F3C7E', label: 'System Admin' },
  county_officer: { bg: '#0D6E56', badge: '#E1F5EE', text: '#0D6E56', label: 'County Officer' },
  operator:       { bg: '#7A3FB5', badge: '#F0E8FC', text: '#7A3FB5', label: 'Node Operator' },
  community:      { bg: '#1A7FD4', badge: '#E8F4FD', text: '#1A7FD4', label: 'Citizen' },
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
  const navigate         = useNavigate()
  const isDesktop        = useIsDesktop()
  const [mobileOpen, setMobileOpen] = useState(false)

  const role = user?.role || 'community'
  const nav  = NAV_BY_ROLE[role] || NAV_BY_ROLE.community
  const rc   = ROLE_COLOR[role]  || ROLE_COLOR.community
  const sidebarVisible = isDesktop || mobileOpen

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#FAFAFC' }}>

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside style={{
        width: 238, background: '#26264A', color: 'white',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: sidebarVisible ? 0 : -238,
        height: '100vh', zIndex: 100, transition: 'left .25s ease',
        boxShadow: !isDesktop && mobileOpen ? '4px 0 20px rgba(0,0,0,.35)' : 'none'
      }}>

        {/* Logo */}
        <div style={{ padding: '20px 18px 14px', borderBottom: '1px solid rgba(255,255,255,.08)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ background: `linear-gradient(135deg,${rc.bg},#0D9E75)`, borderRadius: 9, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Droplets size={18} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'white' }}>MajiSmart</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,.38)', marginTop: -1 }}>Water Intelligence</div>
            </div>
          </div>
        </div>

        {/* Role pill */}
        <div style={{ padding: '8px 14px', borderBottom: '1px solid rgba(255,255,255,.05)', flexShrink: 0 }}>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: rc.bg, color: 'white', textTransform: 'uppercase', letterSpacing: .6 }}>
            {rc.label}
          </span>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
          {nav.map(({ to, icon: Icon, label, badge }) => (
            <NavLink key={to} to={to} onClick={() => setMobileOpen(false)}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '9px 11px', borderRadius: 8, marginBottom: 2,
                fontSize: 13.5, fontWeight: isActive ? 600 : 400,
                color: isActive ? 'white' : 'rgba(255,255,255,.52)',
                background: isActive ? `${rc.bg}55` : 'transparent',
                transition: 'all .15s', textDecoration: 'none',
                borderLeft: isActive ? `3px solid ${rc.bg}` : '3px solid transparent'
              })}>
              <Icon size={16} />
              <span style={{ flex: 1 }}>{label}</span>
              {badge && (
                <span style={{ fontSize: 8, fontWeight: 800, padding: '1px 5px', borderRadius: 99, background: '#F96167', color: 'white', letterSpacing: .3 }}>
                  {badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,.07)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg,${rc.bg},#0D9E75)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.82)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,.32)' }}>{user?.county || 'Kenya'}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 7, width: '100%', padding: '7px 11px', background: 'rgba(249,97,103,.14)', color: '#F96167', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {!isDesktop && mobileOpen && (
        <div onClick={() => setMobileOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.42)', zIndex: 99 }} />
      )}

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, marginLeft: isDesktop ? 238 : 0, transition: 'margin-left .25s ease' }}>

        <header style={{ background: 'white', borderBottom: '1px solid #E8EAED', padding: '0 20px', height: 54, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 1px 4px rgba(0,0,0,.05)' }}>
          {!isDesktop ? (
            <button onClick={() => setMobileOpen(!mobileOpen)} style={{ background: 'none', border: 'none', padding: 6, borderRadius: 6, color: '#6B7099', cursor: 'pointer' }}>
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          ) : <div />}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: rc.badge, color: rc.text }}>{rc.label}</span>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: `linear-gradient(135deg,${rc.bg},#0D9E75)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 12 }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main style={{ flex: 1, padding: '22px 18px', maxWidth: 1200, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
