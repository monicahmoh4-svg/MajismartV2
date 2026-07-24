import { useState } from 'react'
import {
  Vote, Plus, Clock, CheckCircle2, XCircle,
  Zap, Users, TrendingUp, AlertTriangle, ChevronDown, ChevronUp
} from 'lucide-react'
import api from '../api'
import useWeb3 from '../hooks/useWeb3'
import WalletConnect from '../components/WalletConnect'
import { useApiData } from '../hooks/useApiData'
import { Loading, ErrorState, EmptyState, LiveBadge } from '../components/ui/StateViews'

const PROPOSAL_TYPES = [
  'Price Change', 'Maintenance Budget', 'Node Addition',
  'Emergency Action', 'Policy Change', 'Other'
]
const TYPE_ICONS = ['💰', '🔧', '📡', '🚨', '📋', '💬']

const STATUS_META = {
  Active:    { label: 'Voting Open',  color: '#2F3C7E', bg: '#E5E7F0', icon: Clock },
  Passed:    { label: 'Passed',       color: '#0D9E75', bg: '#E1F5EE', icon: CheckCircle2 },
  Failed:    { label: 'Failed',       color: '#D93025', bg: '#FCE8E6', icon: XCircle },
  Executed:  { label: 'Executed',     color: '#6B7099', bg: '#F1F3F4', icon: CheckCircle2 },
  Cancelled: { label: 'Cancelled',    color: '#9AA0A6', bg: '#F1F3F4', icon: XCircle },
}

function ProposalCard({ proposal, web3, onVoted }) {
  const [expanded, setExpanded]   = useState(false)
  const [voting,   setVoting]     = useState(false)
  const [voted,    setVoted]      = useState(false)
  const [voteErr,  setVoteErr]    = useState('')

  const sm    = STATUS_META[proposal.status] || STATUS_META.Active
  const Icon  = sm.icon
  const isActive = proposal.status === 'Active'
  const endsAt   = new Date(proposal.endTime)
  const hoursLeft = Math.max(0, Math.round((endsAt - Date.now()) / 3600000))

  const totalVotes = parseFloat(proposal.forVotes) + parseFloat(proposal.againstVotes) + parseFloat(proposal.abstainVotes)
  const forPct  = totalVotes > 0 ? (parseFloat(proposal.forVotes)     / totalVotes * 100).toFixed(0) : 0
  const agtPct  = totalVotes > 0 ? (parseFloat(proposal.againstVotes) / totalVotes * 100).toFixed(0) : 0
  const quorum  = 100 // 100 MAJI needed
  const quorumPct = Math.min(100, (totalVotes / quorum * 100)).toFixed(0)

  const handleVote = async (voteType) => {
    if (!web3.connected) { setVoteErr('Connect your wallet first'); return }
    setVoting(true); setVoteErr('')
    try {
      await web3.castVote(proposal.id, voteType)
      setVoted(true)
      onVoted?.()
    } catch (e) {
      setVoteErr(e.message?.slice(0, 80) || 'Transaction failed')
    } finally {
      setVoting(false)
    }
  }

  return (
    <div className="card fade-in" style={{ padding: 18, marginBottom: 14 }}>
      {/* Header row */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
        <span style={{ fontSize: 22, flexShrink: 0 }}>{TYPE_ICONS[proposal.proposalType] || '💬'}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 3 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#26264A' }}>{proposal.title}</span>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
              background: sm.bg, color: sm.color,
              display: 'flex', alignItems: 'center', gap: 3
            }}>
              <Icon size={10} />{sm.label}
            </span>
          </div>
          <div style={{ fontSize: 11, color: '#9AA0A6' }}>
            {PROPOSAL_TYPES[proposal.proposalType]} · by {proposal.proposer?.slice(0,6)}…{proposal.proposer?.slice(-4)}
            {isActive && ` · ${hoursLeft}h left`}
          </div>
        </div>
        <button
          onClick={() => setExpanded(e => !e)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, flexShrink: 0 }}
        >
          {expanded ? <ChevronUp size={16} color="#9AA0A6" /> : <ChevronDown size={16} color="#9AA0A6" />}
        </button>
      </div>

      {/* Vote bars */}
      <div style={{ marginBottom: isActive ? 12 : 0 }}>
        {[['For', forPct, '#0D9E75'], ['Against', agtPct, '#D93025']].map(([label, pct, col]) => (
          <div key={label} style={{ marginBottom: 5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
              <span style={{ color: '#6B7099' }}>{label}</span>
              <span style={{ fontWeight: 700, color: col }}>{pct}%</span>
            </div>
            <div style={{ height: 5, background: '#F1F3F4', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: col, borderRadius: 99, transition: 'width 1s' }} />
            </div>
          </div>
        ))}
        {/* Quorum progress */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#9AA0A6', marginTop: 4 }}>
          <span>Quorum: {quorumPct}% of 100 MAJI needed</span>
          <span>{totalVotes.toFixed(1)} MAJI cast</span>
        </div>
      </div>

      {/* Expanded description */}
      {expanded && (
        <div style={{ padding: '10px 14px', background: '#FAFAFC', borderRadius: 8, fontSize: 12, color: '#6B7099', marginBottom: 12, lineHeight: 1.6 }}>
          {proposal.description}
          {proposal.executionNote && (
            <div style={{ marginTop: 8, color: '#0D9E75', fontWeight: 600 }}>
              ✓ Execution note: {proposal.executionNote}
            </div>
          )}
        </div>
      )}

      {/* Voting buttons */}
      {isActive && !voted && (
        <div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            {[['✅ For', 1, '#0D9E75'], ['❌ Against', 2, '#D93025'], ['⬜ Abstain', 3, '#6B7099']].map(([label, vtype, col]) => (
              <button
                key={vtype}
                onClick={() => handleVote(vtype)}
                disabled={voting || !web3.connected}
                style={{
                  flex: 1, padding: '7px 4px', borderRadius: 7, border: `1.5px solid ${col}`,
                  background: 'white', color: col, fontSize: 11, fontWeight: 700,
                  cursor: web3.connected ? 'pointer' : 'not-allowed', opacity: voting ? 0.6 : 1
                }}
              >
                {voting ? '…' : label}
              </button>
            ))}
          </div>
          {!web3.connected && (
            <div style={{ fontSize: 11, color: '#9AA0A6', textAlign: 'center' }}>Connect wallet to vote</div>
          )}
          {voteErr && <div style={{ fontSize: 11, color: '#D93025', marginTop: 4 }}>{voteErr}</div>}
        </div>
      )}

      {voted && (
        <div style={{ fontSize: 12, color: '#0D9E75', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
          <CheckCircle2 size={14} /> Vote cast! Transaction confirmed on Celo.
        </div>
      )}
    </div>
  )
}

function CreateProposalModal({ web3, onCreated, onClose }) {
  const [form, setForm] = useState({ title: '', description: '', type: 0, value: '' })
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.description.trim()) { setErr('Title and description required'); return }
    if (!web3.connected) { setErr('Connect your wallet first'); return }
    const balance = parseFloat(web3.majiBalance)
    if (balance < 10) { setErr('You need at least 10 MAJI tokens to create a proposal'); return }
    setSubmitting(true); setErr('')
    try {
      // createProposal(title, description, ipfsHash, proposalType, value)
      // We call via the blockchain - encode the function call
      const ni = web3.networkInfo
      if (!ni?.waterDAO) { setErr('DAO contract not configured'); return }

      // Use eth_sendTransaction with the encoded call
      // For now: we construct the call data manually (title, description, '', type, value)
      const strEncode = (s) => {
        const bytes = new TextEncoder().encode(s)
        const hex   = Array.from(bytes).map(b => b.toString(16).padStart(2,'0')).join('')
        const len   = bytes.length.toString(16).padStart(64,'0')
        const padded = hex.padEnd(Math.ceil(hex.length / 64) * 64, '0')
        return { len, padded }
      }
      const title = strEncode(form.title)
      const desc  = strEncode(form.description)
      const ipfs  = strEncode('')

      // createProposal(string,string,string,uint8,uint256) selector
      const selector = '0x4f455a3c'
      // Dynamic types: 5 params, offsets at slots 0-4
      // Offset for title at slot 0 = 5*32 = 160 = 0xa0
      // Offset for desc at slot 1 = 0xa0 + 32 + ceil(title_bytes/32)*32
      const titleSlots = Math.ceil(title.padded.length / 64)
      const descOffset  = (5 * 32 + 32 + titleSlots * 32).toString(16).padStart(64, '0')
      const descSlots   = Math.ceil(desc.padded.length / 64)
      const ipfsOffset  = (5 * 32 + 32 + titleSlots * 32 + 32 + descSlots * 32).toString(16).padStart(64, '0')
      const titleOffset = (5 * 32).toString(16).padStart(64, '0')
      const typeHex     = BigInt(form.type).toString(16).padStart(64, '0')
      const valueHex    = BigInt(Math.round(Number(form.value || 0) * 1e18)).toString(16).padStart(64, '0')

      const data = selector
        + titleOffset + descOffset + ipfsOffset
        + typeHex + valueHex
        + title.len + title.padded
        + desc.len + desc.padded
        + ipfs.len + ipfs.padded

      await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{ from: web3.account, to: ni.waterDAO, data }]
      })
      onCreated?.()
      onClose?.()
    } catch (e) {
      setErr(e.message?.slice(0, 100) || 'Transaction failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 200, padding: '0 16px'
    }}>
      <div className="card" style={{ padding: 24, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#26264A' }}>New Governance Proposal</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#9AA0A6' }}>×</button>
        </div>
        <div className="form-group">
          <label>Proposal Title *</label>
          <input placeholder="e.g. Reduce water price by 20%" value={form.title} onChange={e => set('title', e.target.value)} maxLength={120} />
        </div>
        <div className="form-group">
          <label>Description *</label>
          <textarea rows={4} placeholder="Explain your proposal and why the community should vote for it…" value={form.description} onChange={e => set('description', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Proposal Type</label>
          <select value={form.type} onChange={e => set('type', Number(e.target.value))}>
            {PROPOSAL_TYPES.map((t, i) => <option key={i} value={i}>{TYPE_ICONS[i]} {t}</option>)}
          </select>
        </div>
        {form.type === 0 && (
          <div className="form-group">
            <label>Proposed new price (cUSD per litre)</label>
            <input type="number" step="0.0001" placeholder="e.g. 0.008" value={form.value} onChange={e => set('value', e.target.value)} />
          </div>
        )}
        <div style={{ padding: '10px 14px', background: '#E5E7F0', borderRadius: 8, fontSize: 12, color: '#6B7099', marginBottom: 14 }}>
          Requires <strong>10 MAJI</strong> to propose · Your balance: <strong>{parseFloat(web3.majiBalance || 0).toFixed(1)} MAJI</strong>
        </div>
        {err && <div style={{ fontSize: 12, color: '#D93025', marginBottom: 10 }}>{err}</div>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting} style={{ flex: 2 }}>
            {submitting ? 'Submitting to Celo…' : '🗳️ Submit Proposal'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function DAOGovernance() {
  const web3 = useWeb3()
  const [showCreate, setShowCreate] = useState(false)
  const [filterStatus, setFilter]   = useState('all')

  const { data: proposals, loading, error, lastUpdated, refetch } = useApiData(
    () => api.get('/blockchain/proposals'),
    { pollMs: 30000, isEmpty: d => !d?.length }
  )
  const { data: status } = useApiData(() => api.get('/blockchain/status'))

  const filtered = (proposals || []).filter(p =>
    filterStatus === 'all' || p.status === filterStatus
  )
  const activeCount = (proposals || []).filter(p => p.status === 'Active').length

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <Vote size={22} color="#2F3C7E" />
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#26264A' }}>Water DAO</h1>
          </div>
          <p style={{ fontSize: 14, color: '#6B7099' }}>
            Community governance — vote on water pricing, maintenance, and platform decisions using your MAJI tokens.
          </p>
        </div>
        <LiveBadge lastUpdated={lastUpdated} />
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 18 }}>
        <div className="card" style={{ padding: '14px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#2F3C7E' }}>{(proposals || []).length}</div>
          <div style={{ fontSize: 11, color: '#6B7099' }}>Total Proposals</div>
        </div>
        <div className="card" style={{ padding: '14px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#F96167' }}>{activeCount}</div>
          <div style={{ fontSize: 11, color: '#6B7099' }}>Voting Now</div>
        </div>
        <div className="card" style={{ padding: '14px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0D9E75' }}>
            {parseFloat(web3.majiBalance || 0).toFixed(1)}
          </div>
          <div style={{ fontSize: 11, color: '#6B7099' }}>Your MAJI</div>
        </div>
      </div>

      {/* Wallet + create row */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'stretch', marginBottom: 18, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <WalletConnect compact={false} />
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreate(true)}
          disabled={!web3.connected || !status?.enabled}
          style={{ flexShrink: 0, fontWeight: 700, alignSelf: 'stretch' }}
          title={!status?.enabled ? 'Blockchain not configured' : !web3.connected ? 'Connect wallet first' : ''}
        >
          <Plus size={15} /> New Proposal
        </button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {['all', 'Active', 'Passed', 'Failed', 'Executed'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '5px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600,
            background: filterStatus === f ? '#26264A' : 'white',
            color: filterStatus === f ? 'white' : '#6B7099',
            border: `1.5px solid ${filterStatus === f ? '#26264A' : '#E8EAED'}`,
            cursor: 'pointer'
          }}>
            {f === 'all' ? 'All' : f}
          </button>
        ))}
      </div>

      {/* Not configured notice */}
      {!status?.enabled && (
        <div style={{ padding: '14px 16px', background: '#FEF3D8', border: '1px solid #E8A020', borderRadius: 10, marginBottom: 16, fontSize: 13, color: '#A07010' }}>
          ⚠️ DAO is in preview mode — blockchain not yet configured on this deployment. Proposals shown are samples.
        </div>
      )}

      {/* Proposals */}
      {loading ? <Loading rows={3} /> : error ? <ErrorState message={error} onRetry={refetch} /> :
        filtered.length === 0 ? (
          <EmptyState icon={Vote} title="No proposals yet" subtitle="Be the first to propose a change to your water community" />
        ) : (
          filtered.map(p => (
            <ProposalCard key={p.id} proposal={p} web3={web3} onVoted={refetch} />
          ))
        )
      }

      {/* How DAO works */}
      <div className="card fade-in" style={{ padding: 18, marginTop: 18, background: '#FAFAFC' }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: '#26264A', marginBottom: 10 }}>🏛️ How the Water DAO Works</h3>
        <div style={{ fontSize: 12, color: '#6B7099', lineHeight: 1.7 }}>
          <div>• Hold <strong>10+ MAJI tokens</strong> to create a proposal</div>
          <div>• Voting is <strong>token-weighted</strong> — more MAJI = more voting power</div>
          <div>• Proposals require <strong>100 MAJI quorum</strong> and a simple majority to pass</div>
          <div>• <strong>3-day voting period</strong> (1 day for emergency actions)</div>
          <div>• Passed proposals are executed by county water administrators</div>
          <div>• All votes are permanently recorded on the Celo blockchain</div>
        </div>
      </div>

      {showCreate && <CreateProposalModal web3={web3} onCreated={refetch} onClose={() => setShowCreate(false)} />}
    </div>
  )
}
