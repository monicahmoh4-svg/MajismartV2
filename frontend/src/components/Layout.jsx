import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTenant } from '../hooks/useTenant'
import { NAV_BY_ROLE, ROLES, normalizeUiRole, tenantLabel, dashboardFor } from '../lib/roles'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, Wifi, CreditCard, Bell, BarChart3,
  Settings, LogOut, Menu, X, Droplets, Users, Wrench, Brain, Flag, MapPin,
  FileText, Package, Map, ClipboardList, Cpu, Building2,
} from 'lucide-react'
import api from '../api'

const ICONS = {
  dashboard: LayoutDashboard, nodes: Wifi, payments: CreditCard,
  mywater: Droplets, report: Flag, alerts: Bell, ai: Brain,
  analytics: BarChart3, users: Users, maintenance: Wrench, settings: Settings,
  reports: FileText, assets: Package, gis: Map, workorders: ClipboardList, devices: Cpu, estates: Building2,
}

function useIsDesktop(breakpoint = 960) {
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= breakpoint : true
  )
  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= breakpoint)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [breakpoint])
  return isDesktop
}

export default function Layout() {
  const { user, logout } = useAuth()
  const { county } = useTenant()
  const navigate = useNavigate()
  const location = useLocation()
  const isDesktop = useIsDesktop()
  const [mobileOpen, setMobileOpen] = useState(false)

  const role = normalizeUiRole(user?.role)
  const nav = NAV_BY_ROLE[role] || NAV_BY_ROLE.community
  const rc = (ROLES[role] || ROLES.community).color
  const roleLabel = (ROLES[role] || ROLES.community).label
  const sidebarVisible = isDesktop || mobileOpen

  // Close the drawer on navigation (mobile)
  useEffect(() => { setMobileOpen(false) }, [location.pathname])
  // Lock body scroll while drawer is open (mobile)
  useEffect(() => {
    document.body.style.overflow = !isDesktop && mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isDesktop, mobileOpen])

  const handleLogout = () => { logout(); navigate('/') }

  // Notifications inbox (all roles): unread badge + dropdown, mark-read.
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifs, setNotifs] = useState([])
  const unread = notifs.filter((n) => !n.is_read).length
  useEffect(() => {
    let alive = true
    api.get('/notifications/mine?unread=1').then((r) => {
      if (alive) setNotifs(Array.isArray(r) ? r : [])
    }).catch(() => {})
    const id = setInterval(() => {
      api.get('/notifications/mine?unread=1').then((r) => {
        if (alive) setNotifs(Array.isArray(r) ? r : [])
      }).catch(() => {})
    }, 60000)
    return () => { alive = false; clearInterval(id) }
  }, [])
  const openInbox = async () => {
    const next = !notifOpen
    setNotifOpen(next)
    if (next) {
      try {
        const full = await api.get('/notifications/mine')
        setNotifs(Array.isArray(full) ? full : [])
      } catch (e) { /* keep unread list */ }
    }
  }
  const markAllRead = async () => {
    const ids = notifs.filter((n) => !n.is_read).map((n) => n.id)
    await Promise.all(ids.map((id) => api.patch(`/notifications/${id}/read`, {}).catch(() => {})))
    setNotifs((list) => list.map((n) => ({ ...n, is_read: true })))
  }

  // Citizen roles ship their own complete chrome inside CitizenDashboard
  // (header + section tabs). Rendering the app sidebar as well would double
  // every navigation control — so citizen dashboards go full-bleed.
  if (dashboardFor(user?.role) === 'citizen') {
    return <Outlet />
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--gray-50)' }}>
      <aside aria-label="Primary navigation" style={{
        width: 248, background: 'linear-gradient(180deg,#0b1a30 0%,#0c2340 60%,#0b3b39 100%)', color: 'white',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: sidebarVisible ? 0 : -260,
        height: '100dvh', zIndex: 100, transition: 'left .25s ease',
        boxShadow: !isDesktop && mobileOpen ? '4px 0 24px rgba(0,0,0,.35)' : 'none',
      }}>
        <div style={{ padding: '22px 18px 14px', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              background: `linear-gradient(135deg,${rc.bg},#0d9e75)`,
              borderRadius: 11, width: 38, height: 38,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Droplets size={20} color="white" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-.01em' }}>MajiSmart</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.45)' }}>Water Intelligence</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
            <span className="side-badge" style={{ background: rc.bg }}>{roleLabel}</span>
            <span className="side-badge side-badge-dim">
              <MapPin size={11} /> {county || 'All counties'}
            </span>
          </div>
        </div>
        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
          {nav.map(({ to, icon, label }) => {
            const Icon = ICONS[icon] || LayoutDashboard
            return (
              <NavLink key={to} to={to}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: 11,
                  padding: '10px 12px', borderRadius: 9, marginBottom: 2,
                  fontSize: 14, fontWeight: isActive ? 650 : 400,
                  color: isActive ? 'white' : 'rgba(255,255,255,.58)',
                  background: isActive ? 'rgba(255,255,255,.10)' : 'transparent',
                  transition: 'all .15s', textDecoration: 'none',
                  borderLeft: isActive ? `3px solid ${rc.bg}` : '3px solid transparent',
                })}>
                <Icon size={17} aria-hidden />
                {label}
              </NavLink>
            )
          })}
        </nav>
        <div style={{ padding: '14px 12px calc(14px + env(safe-area-inset-bottom))', borderTop: '1px solid rgba(255,255,255,.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, minWidth: 0 }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: `linear-gradient(135deg,${rc.bg},#0d9e75)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: 14, flexShrink: 0,
            }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.88)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.email}
              </div>
            </div>
          </div>
          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: 8, width: '100%',
            padding: '9px 12px', background: 'rgba(217,48,37,.16)',
            color: '#f5a19a', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </aside>
      {!isDesktop && mobileOpen && (
        <div onClick={() => setMobileOpen(false)} aria-hidden
          style={{ position: 'fixed', inset: 0, background: 'rgba(2,8,20,.5)', zIndex: 99 }} />
      )}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0,
        marginLeft: isDesktop ? 248 : 0, transition: 'margin-left .25s ease',
      }}>
        <header style={{
          background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(8px)',
          borderBottom: '1px solid var(--gray-200)',
          padding: '0 max(16px, env(safe-area-inset-left))', height: 60, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50,
          boxShadow: '0 1px 4px rgba(0,0,0,.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            {!isDesktop && (
              <button onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu" style={{
                background: 'none', border: 'none', padding: 8,
                borderRadius: 8, color: 'var(--gray-600)', cursor: 'pointer',
              }}>
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            )}
            <span className="tenant-chip" title={tenantLabel(user)}>
              <MapPin size={12} /> {tenantLabel(user)}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ position: 'relative' }}>
              <button onClick={openInbox} aria-label="Notifications" title="Notifications"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, color: 'var(--gray-600)', position: 'relative' }}>
                <Bell size={20} />
                {unread > 0 && (
                  <span style={{ position: 'absolute', top: 0, right: 0, minWidth: 17, height: 17, borderRadius: 99, background: '#d93025', color: 'white', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 'min(340px, 86vw)', maxHeight: 380, overflowY: 'auto', background: 'white', border: '1px solid var(--gray-200)', borderRadius: 12, boxShadow: '0 16px 40px rgba(0,0,0,.16)', zIndex: 200 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderBottom: '1px solid var(--gray-200)' }}>
                    <strong style={{ fontSize: 13 }}>Notifications</strong>
                    {unread > 0 && <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: 'var(--blue)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Mark all read</button>}
                  </div>
                  {notifs.length === 0 && <p className="muted" style={{ padding: '16px 14px' }}>No notifications yet.</p>}
                  {notifs.slice(0, 20).map((n) => (
                    <div key={n.id} style={{ padding: '10px 14px', borderBottom: '1px solid var(--gray-100)', opacity: n.is_read ? 0.7 : 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, display: 'flex', gap: 6, alignItems: 'center' }}>
                        {!n.is_read && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#d93025', flexShrink: 0 }} />}
                        {n.title}
                      </div>
                      <div style={{ fontSize: 12.5, color: 'var(--gray-600)', marginTop: 2 }}>{n.message}</div>
                      <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 2 }}>{new Date(n.created_at).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <span className="role-chip" style={{ background: rc.badge, color: rc.text }}>
              {roleLabel}
            </span>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: `linear-gradient(135deg,${rc.bg},#0d9e75)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: 13, flexShrink: 0,
            }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>
        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
