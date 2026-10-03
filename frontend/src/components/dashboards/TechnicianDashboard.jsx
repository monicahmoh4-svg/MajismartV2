import { useEffect, useMemo, useState } from 'react'
import { Wrench, Play, CheckCircle2, Clock, MapPin, AlertTriangle, RefreshCw } from 'lucide-react'
import api from '../../api'
import { useTenant } from '../../hooks/useTenant'

const STATUS_TONE = {
  open: 'bad', pending: 'bad', assigned: 'warn',
  in_progress: 'warn', completed: 'ok', verified: 'ok',
}

function mine(wo, user) {
  if (!user) return false
  const a = String(wo.assigned_to || '').toLowerCase()
  return [user.id, user.name, user.email]
    .filter(Boolean)
    .some((me) => String(me).toLowerCase() === a || (a && String(me).toLowerCase().includes(a)) || (a && a.includes(String(me).toLowerCase())))
}

export default function TechnicianDashboard() {
  const { user, county, withCounty } = useTenant()
  const [orders, setOrders] = useState([])
  const [filter, setFilter] = useState('open')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(null)

  const load = async () => {
    setLoading(true); setError('')
    try {
      const res = await api.get(withCounty('/workorders?limit=200'))
      setOrders(Array.isArray(res) ? res : res?.data || [])
    } catch (e) {
      setError(e.message || 'Could not load work orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const myOrders = useMemo(
    () => orders.filter((o) => mine(o, user)),
    [orders, user]
  )
  const visible = useMemo(() => {
    const pool = myOrders.length ? myOrders : orders
    if (filter === 'all') return pool
    if (filter === 'open') return pool.filter((o) => ['open', 'pending', 'assigned'].includes(o.status))
    if (filter === 'doing') return pool.filter((o) => o.status === 'in_progress')
    return pool.filter((o) => ['completed', 'verified'].includes(o.status))
  }, [orders, myOrders, filter])

  const counts = useMemo(() => ({
    open: myOrders.filter((o) => ['open', 'pending', 'assigned'].includes(o.status)).length,
    doing: myOrders.filter((o) => o.status === 'in_progress').length,
    done: myOrders.filter((o) => ['completed', 'verified'].includes(o.status)).length,
  }), [myOrders])

  const setStatus = async (id, status) => {
    setBusy(id)
    try {
      await api.put(`/workorders/${id}`, { status })
      await load()
    } catch (e) {
      setError(e.message || 'Update failed')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">My Tasks</h1>
          <p className="page-sub">
            {user?.name || 'Technician'}{county ? ` · ${county} County` : ''} — repairs assigned to you
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load} disabled={loading}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card" data-tone="bad">
          <div className="stat-ic"><AlertTriangle size={18} /></div>
          <div><div className="stat-num">{loading ? '…' : counts.open}</div><div className="stat-lbl">Awaiting action</div></div>
        </div>
        <div className="stat-card" data-tone="warn">
          <div className="stat-ic"><Clock size={18} /></div>
          <div><div className="stat-num">{loading ? '…' : counts.doing}</div><div className="stat-lbl">In progress</div></div>
        </div>
        <div className="stat-card" data-tone="ok">
          <div className="stat-ic"><CheckCircle2 size={18} /></div>
          <div><div className="stat-num">{loading ? '…' : counts.done}</div><div className="stat-lbl">Completed by me</div></div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-h">
          <h2><Wrench size={16} /> Work queue</h2>
          <div className="chip-row" role="tablist" aria-label="Filter tasks">
            {[['open', 'Open'], ['doing', 'Doing'], ['done', 'Done'], ['all', 'All']].map(([v, l]) => (
              <button key={v} role="tab" aria-selected={filter === v}
                className={`chip${filter === v ? ' chip-on' : ''}`} onClick={() => setFilter(v)}>{l}</button>
            ))}
          </div>
        </div>

        {loading && <p className="muted">Loading your tasks…</p>}
        {error && !loading && <div className="alert-bar alert-bar-error">{error}</div>}
        {!loading && !error && visible.length === 0 && (
          <p className="muted">No tasks here. New assignments from your county officer will appear automatically.</p>
        )}

        <div className="task-list">
          {visible.map((o) => (
            <article key={o.id} className="task-card">
              <div className="task-main">
                <div className="task-title">{o.title || `Work order ${o.wo_number || o.id}`}</div>
                <div className="task-meta">
                  <span className={`badge badge-${STATUS_TONE[o.status] === 'ok' ? 'active' : STATUS_TONE[o.status] === 'warn' ? 'warning' : 'critical'}`}>
                    {(o.status || 'open').replace('_', ' ')}
                  </span>
                  {o.priority && <span className="chip">{o.priority} priority</span>}
                  {(o.node_name || o.county) && (
                    <span className="muted-sm"><MapPin size={12} /> {[o.node_name, o.county].filter(Boolean).join(' · ')}</span>
                  )}
                </div>
                {o.description && <p className="task-desc">{o.description}</p>}
              </div>
              <div className="task-actions">
                {['open', 'pending', 'assigned'].includes(o.status) && (
                  <button className="btn btn-primary btn-sm" disabled={busy === o.id}
                    onClick={() => setStatus(o.id, 'in_progress')}>
                    <Play size={14} /> {busy === o.id ? '…' : 'Start job'}
                  </button>
                )}
                {o.status === 'in_progress' && (
                  <button className="btn btn-success btn-sm" disabled={busy === o.id}
                    onClick={() => setStatus(o.id, 'completed')}>
                    <CheckCircle2 size={14} /> {busy === o.id ? '…' : 'Mark done'}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}
