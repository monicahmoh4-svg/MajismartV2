import { useState, useEffect } from 'react'
import { Building2, Plus, X, Users, Wallet } from 'lucide-react'
import api from '../api'

// Estate billing: landlords/property managers onboard estates, register
// units with meters, and watch arrears clear as tenants buy prepaid water.
// (Top-ups credit unit balances automatically on token redeem.)
export default function Estates() {
  const [estates, setEstates] = useState([])
  const [loading, setLoading] = useState(true)
  const [showEstate, setShowEstate] = useState(false)
  const [estateForm, setEstateForm] = useState({ name: '', county: '', paybill: '', tariff_ksh_per_m3: 105 })
  const [openId, setOpenId] = useState(null)
  const [units, setUnits] = useState({})
  const [unitForm, setUnitForm] = useState({ unit_no: '', tenant_name: '', tenant_phone: '', meter_no: '' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/estates')
      setEstates(Array.isArray(res) ? res : [])
    } catch (e) {
      setMsg({ ok: false, text: e.message || 'Could not load estates' })
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const flash = (ok, text) => {
    setMsg({ ok, text })
    setTimeout(() => setMsg(null), 5000)
  }

  const createEstate = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      await api.post('/estates', { ...estateForm, tariff_ksh_per_m3: Number(estateForm.tariff_ksh_per_m3) || 105 })
      setEstateForm({ name: '', county: '', paybill: '', tariff_ksh_per_m3: 105 })
      setShowEstate(false)
      flash(true, 'Estate onboarded')
      load()
    } catch (err) {
      flash(false, err.message || 'Failed to create estate')
    } finally {
      setSaving(false)
    }
  }

  const toggleUnits = async (id) => {
    if (openId === id) { setOpenId(null); return }
    setOpenId(id)
    if (!units[id]) {
      try {
        const res = await api.get(`/estates/${id}/units`)
        setUnits((u) => ({ ...u, [id]: Array.isArray(res) ? res : [] }))
      } catch (e) {
        flash(false, e.message || 'Could not load units')
      }
    }
  }

  const saveUnit = async (e, estateId) => {
    e.preventDefault()
    if (!unitForm.unit_no.trim()) return
    setSaving(true)
    try {
      await api.post(`/estates/${estateId}/units`, unitForm)
      setUnitForm({ unit_no: '', tenant_name: '', tenant_phone: '', meter_no: '' })
      const res = await api.get(`/estates/${estateId}/units`)
      setUnits((u) => ({ ...u, [estateId]: Array.isArray(res) ? res : [] }))
      flash(true, 'Unit saved')
      load()
    } catch (err) {
      flash(false, err.message || 'Failed to save unit')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="page-loader"><div className="spinner" /></div>

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Estates & Landlords</h1>
          <p className="page-sub">Onboard rental properties, register metered units, watch arrears clear as tenants top up.</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowEstate(!showEstate)}>
          <Plus size={15} /> Onboard estate
        </button>
      </div>

      {msg && <div className={`alert-bar ${msg.ok ? 'alert-bar-success' : 'alert-bar-error'}`}>{msg.text}</div>}

      {showEstate && (
        <form className="panel" onSubmit={createEstate}>
          <div className="panel-h"><h2>New estate</h2></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Estate name *</label>
              <input required value={estateForm.name} onChange={(e) => setEstateForm({ ...estateForm, name: e.target.value })} placeholder="Ruaka Greens, Block B" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>County *</label>
              <input required value={estateForm.county} onChange={(e) => setEstateForm({ ...estateForm, county: e.target.value })} placeholder="Kiambu" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>M-Pesa Paybill</label>
              <input value={estateForm.paybill} onChange={(e) => setEstateForm({ ...estateForm, paybill: e.target.value })} placeholder="522522" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Tariff (Ksh/m³)</label>
              <input type="number" min="0" step="0.01" value={estateForm.tariff_ksh_per_m3} onChange={(e) => setEstateForm({ ...estateForm, tariff_ksh_per_m3: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>{saving ? 'Saving…' : 'Onboard estate'}</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowEstate(false)}>Cancel</button>
          </div>
        </form>
      )}

      {estates.length === 0 && (
        <div className="panel" style={{ textAlign: 'center', padding: 40 }}>
          <Building2 size={36} color="#9aa0a6" style={{ margin: '0 auto 12px', display: 'block' }} />
          <p className="muted">No estates yet. Onboard your first property to start zero-arrears billing.</p>
        </div>
      )}

      {estates.map((est) => (
        <div key={est.id} className="panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>{est.name}</h2>
              <p className="muted-sm">{est.county}{est.paybill ? ` · Paybill ${est.paybill}` : ''} · Ksh {est.tariff_ksh_per_m3}/m³</p>
            </div>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <span className="muted-sm"><Users size={12} /> {est.units || 0} units</span>
              <span className="muted-sm"><Wallet size={12} /> Ksh {Number(est.arrears_total || 0).toLocaleString()} arrears</span>
              <button className="btn btn-ghost btn-sm" onClick={() => toggleUnits(est.id)}>
                {openId === est.id ? 'Hide units' : 'Manage units'}
              </button>
            </div>
          </div>

          {openId === est.id && (
            <div style={{ marginTop: 16 }}>
              <form onSubmit={(e) => saveUnit(e, est.id)} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10, marginBottom: 14 }}>
                <input required value={unitForm.unit_no} onChange={(e) => setUnitForm({ ...unitForm, unit_no: e.target.value })} placeholder="Unit no. *" />
                <input value={unitForm.tenant_name} onChange={(e) => setUnitForm({ ...unitForm, tenant_name: e.target.value })} placeholder="Tenant name" />
                <input value={unitForm.tenant_phone} onChange={(e) => setUnitForm({ ...unitForm, tenant_phone: e.target.value })} placeholder="Tenant phone" inputMode="tel" />
                <input value={unitForm.meter_no} onChange={(e) => setUnitForm({ ...unitForm, meter_no: e.target.value })} placeholder="Meter no." />
                <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>{saving ? '…' : 'Add / update unit'}</button>
              </form>
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead><tr><th>Unit</th><th>Tenant</th><th>Phone</th><th>Meter</th><th>Balance (L)</th><th>Arrears (Ksh)</th></tr></thead>
                  <tbody>
                    {(units[est.id] || []).map((u) => (
                      <tr key={u.id}>
                        <td><strong>{u.unit_no}</strong></td>
                        <td>{u.tenant_name || '—'}</td>
                        <td>{u.tenant_phone || '—'}</td>
                        <td>{u.meter_no || '—'}</td>
                        <td className="tnum">{u.balance_litres || 0}</td>
                        <td className="tnum" style={{ color: Number(u.arrears_ksh) > 0 ? '#d93025' : '#0d9e75', fontWeight: 700 }}>
                          {Number(u.arrears_ksh || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {(units[est.id] || []).length === 0 && (
                      <tr><td colSpan={6} className="muted" style={{ textAlign: 'center', padding: 20 }}>No units registered yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
