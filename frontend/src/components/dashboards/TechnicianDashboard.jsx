import { useEffect, useMemo, useState } from 'react'
import { Wrench, Play, CheckCircle2, Clock, MapPin, AlertTriangle, RefreshCw, Wallet } from 'lucide-react'
import api from '../../api'
import { useTenant } from '../../hooks/useTenant'
import { CountUp } from '../ui/TextAnimate'

const STATUS_TONE = {
  open: 'bad', pending: 'bad', assigned: 'warn',
  in_progress: 'warn', completed: 'ok', verified: 'ok',
}

const PRIORITY_RANK = { urgent: 0, high: 1, medium: 2, low: 3 }

function ageDays(o) {
  if (!o.created_at) return null
  return Math.max(0, Math.floor((Date.now() - new Date(o.created_at).getTime()) / 86400000))
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
  const [notingId, setNotingId] = useState(null)
  const [note, setNote] = useState('')
  const [sortBy, setSortBy] = useState('priority')
  const [services, setServices] = useState([])
  const verified = !user?.kyc_status || user.kyc_status === 'verified'

  const load = async () => {
    setLoading(true); setError('')
    try {
      const [wo, sj] = await Promise.all([
        api.get(withCounty('/workorders?limit=200')),
        api.get('/services/assigned').catch(() => []),
      ])
      const list = Array.isArray(wo) ? wo : wo?.work_orders || wo?.data || []
      setOrders(list)
      setServices(Array.isArray(sj) ? sj : [])
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
    let list = [...pool]
    if (filter === 'open') list = list.filter((o) => ['open', 'pending', 'assigned'].includes(o.status))
    else if (filter === 'doing') list = list.filter((o) => o.status === 'in_progress')
    else if (filter === 'done') list = list.filter((o) => ['completed', 'verified'].includes(o.status))
    if (sortBy === 'priority') {
      list.sort((a, b) => (PRIORITY_RANK[a.priority] ?? 2) - (PRIORITY_RANK[b.priority] ?? 2))
    } else if (sortBy === 'oldest') {
      list.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0))
    } else {
      list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    }
    return list
  }, [orders, myOrders, filter, sortBy])

  const counts = useMemo(() => ({
    open: myOrders.filter((o) => ['open', 'pending', 'assigned'].includes(o.status)).length,
    doing: myOrders.filter((o) => o.status === 'in_progress').length,
    done: myOrders.filter((o) => ['completed', 'verified'].includes(o.status)).length,
  }), [myOrders])

  const doneThisWeek = useMemo(() => myOrders.filter((o) =>
    ['completed', 'verified'].includes(o.status) &&
    o.completed_at && (Date.now() - new Date(o.completed_at).getTime()) < 7 * 86400000
  ).length, [myOrders])

  const earnings = useMemo(() => myOrders
    .filter((o) => ['completed', 'verified'].includes(o.status))
    .reduce((s, o) => s + (Number(o.payout_ksh) || 0), 0), [myOrders])

  const advanceService = async (id, status) => {
    setBusy(id)
    try {
      await api.patch(`/services/${id}/status`, { status })
      await load()
    } catch (e) {
      setError(e.message || 'Update failed')
    } finally {
      setBusy(null)
    }
  }

  const setStatus = async (id, status, completionNotes) => {
    setBusy(id)
    try {
      const payload = { status };
      if (completionNotes) payload.completion_notes = completionNotes;
      await api.put(`/workorders/${id}`, payload)
      setNotingId(null); setNote('')
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

      {!verified && (
        <div className="alert-bar alert-bar-error" style={{ background: '#fef3d8', borderColor: '#fad99c', color: '#92400e' }}>
          <strong>Unverified account.</strong> An admin is reviewing your ID and certifications.
          You can explore your queue, but starting jobs unlocks after approval.
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card" data-tone="bad">
          <div className="stat-ic"><AlertTriangle size={18} /></div>
          <div><div className="stat-num">{loading ? '…' : <CountUp value={counts.open} />}</div><div className="stat-lbl">Awaiting action</div></div>
        </div>
        <div className="stat-card" data-tone="warn">
          <div className="stat-ic"><Clock size={18} /></div>
          <div><div className="stat-num">{loading ? '…' : <CountUp value={counts.doing} />}</div><div className="stat-lbl">In progress</div></div>
        </div>
        <div className="stat-card" data-tone="ok">
          <div className="stat-ic"><CheckCircle2 size={18} /></div>
          <div><div className="stat-num">{loading ? '…' : <CountUp value={counts.done} />}</div><div className="stat-lbl">Completed by me</div></div>
        </div>
        <div className="stat-card" data-tone="warn">
          <div className="stat-ic"><Wallet size={18} /></div>
          <div><div className="stat-num">Ksh {loading ? '…' : earnings.toLocaleString()}</div><div className="stat-lbl">Earned (county-settled)</div></div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-h">
          <h2><Wrench size={16} /> Work queue</h2>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="muted-sm">⚡ {doneThisWeek} closed this week</span>
            <div className="chip-row" role="tablist" aria-label="Filter tasks">
              {[['open', 'Open'], ['doing', 'Doing'], ['done', 'Done'], ['all', 'All']].map(([v, l]) => (
                <button key={v} role="tab" aria-selected={filter === v}
                  className={`chip${filter === v ? ' chip-on' : ''}`} onClick={() => setFilter(v)}>{l}</button>
              ))}
            </div>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sort tasks"
              style={{ width: 'auto', padding: '6px 10px', fontSize: 13 }}>
              <option value="priority">Sort: priority</option>
              <option value="oldest">Sort: oldest first</option>
              <option value="newest">Sort: newest first</option>
            </select>
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
                  {ageDays(o) !== null && !['completed', 'verified'].includes(o.status) && (
                    <span className="chip" style={ageDays(o) > 7 ? { borderColor: '#f5c6c3', color: '#a52820' } : undefined}>
                      {ageDays(o) === 0 ? 'opened today' : `${ageDays(o)}d open`}
                    </span>
                  )}
                  {(o.node_name || o.county) && (
                    <span className="muted-sm"><MapPin size={12} /> {[o.node_name, o.county].filter(Boolean).join(' · ')}</span>
                  )}
                </div>
                {o.description && <p className="task-desc">{o.description}</p>}
                {o.completion_notes && (
                  <p className="task-desc" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '8px 10px' }}>
                    <strong>Field notes:</strong> {o.completion_notes}
                  </p>
                )}
                {notingId === o.id && (
                  <div style={{ marginTop: 8 }}>
                    <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2}
                      placeholder="What was done? parts replaced, readings, follow-up needed…"
                      style={{ width: '100%', resize: 'vertical' }} />
                    <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                      <button className="btn btn-success btn-sm" disabled={busy === o.id || !verified}
                        title={verified ? '' : 'Unlocks after admin verification'}
                        onClick={() => setStatus(o.id, 'completed', note.trim() || undefined)}>
                        {busy === o.id ? 'Saving…' : 'Confirm completion'}
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => { setNotingId(null); setNote('') }}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
              <div className="task-actions">
                {['open', 'pending', 'assigned'].includes(o.status) && (
                  <button className="btn btn-primary btn-sm" disabled={busy === o.id || !verified}
                    title={verified ? '' : 'Unlocks after admin verification'}
                    onClick={() => setStatus(o.id, 'in_progress')}>
                    <Play size={14} /> {busy === o.id ? '…' : 'Start job'}
                  </button>
                )}
                {o.status === 'in_progress' && notingId !== o.id && (
                  <button className="btn btn-success btn-sm" disabled={busy === o.id || !verified}
                    title={verified ? '' : 'Unlocks after admin verification'}
                    onClick={() => setNotingId(o.id)}>
                    <CheckCircle2 size={14} /> {busy === o.id ? '…' : 'Mark done'}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel-h">
          <h2><MapPin size={16} /> Citizen service jobs ({services.filter((s) => !['completed', 'cancelled'].includes(s.status)).length} active)</h2>
        </div>
        {services.length === 0 && (
          <p className="muted">No citizen jobs dispatched to you yet. Matched requests appear here automatically.</p>
        )}
        <div className="task-list">
          {services.map((s) => (
            <article key={s.id} className="task-card">
              <div className="task-main">
                <div className="task-title">{(s.category || 'service').replace(/_/g, ' ')} — {s.area || s.county}</div>
                <div className="task-meta">
                  <span className={`badge badge-${['completed'].includes(s.status) ? 'active' : 'warning'}`}>{(s.status || 'open').replace('_', ' ')}</span>
                  {s.distance_km != null && <span className="chip">{s.distance_km} km away</span>}
                  {s.fee_ksh > 0 && <span className="chip">Ksh {Number(s.fee_ksh).toLocaleString()} job value</span>}
                  {s.citizen_name && <span className="muted-sm">for {s.citizen_name}</span>}
                </div>
                {s.description && <p className="task-desc">{s.description}</p>}
              </div>
              <div className="task-actions">
                {['open', 'assigned'].includes(s.status) && (
                  <button className="btn btn-primary btn-sm" disabled={busy === s.id || !verified} onClick={() => advanceService(s.id, 'in_progress')}>
                    {busy === s.id ? '…' : 'Accept job'}
                  </button>
                )}
                {s.status === 'in_progress' && (
                  <button className="btn btn-success btn-sm" disabled={busy === s.id || !verified} onClick={() => advanceService(s.id, 'completed')}>
                    {busy === s.id ? '…' : 'Complete'}
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
