import { useState } from 'react'
import {
  Wallet, Droplets, ShieldCheck, Zap,
  ArrowRight, ExternalLink, RefreshCw, CheckCircle, AlertTriangle, Info
} from 'lucide-react'
import api from '../api'
import useWeb3 from '../hooks/useWeb3'
import WalletConnect from '../components/WalletConnect'
import { useApiData } from '../hooks/useApiData'
import { Loading, ErrorState, EmptyState } from '../components/ui/StateViews'

const PROPOSAL_TYPES = ['Price Change','Maintenance Budget','Node Addition','Emergency Action','Policy Change','Other']
const STATUS_COLOR = {
  SAFE:       { color: '#0D9E75', bg: '#E1F5EE', label: 'Safe to Drink' },
  BOIL_FIRST: { color: '#E8A020', bg: '#FEF3D8', label: 'Boil Before Drinking' },
  UNSAFE:     { color: '#D93025', bg: '#FCE8E6', label: 'Do Not Drink' },
  UNKNOWN:    { color: '#9AA0A6', bg: '#F1F3F4', label: 'No Data' },
}

function StatBox({ label, value, sub, color }) {
  return (
    <div style={{ padding: '14px 16px', background: 'white', borderRadius: 10, border: '1px solid #E8EAED', flex: 1 }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: color || '#26264A' }}>{value}</div>
      <div style={{ fontSize: 12, color: '#6B7099', marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: '#9AA0C9', marginTop: 1 }}>{sub}</div>}
    </div>
  )
}

function BuyWaterPanel({ web3, nodes }) {
  const [amount,   setAmount]   = useState('')
  const [nodeId,   setNodeId]   = useState('')
  const [buying,   setBuying]   = useState(false)
  const [success,  setSuccess]  = useState(null)
  const [err,      setErr]      = useState('')

  const priceInfo = web3.networkInfo
  const litres    = amount && priceInfo ? Math.floor(Number(amount) / 0.001 * 10) : 0

  const handleBuy = async () => {
    if (!amount || !nodeId) { setErr('Select a node and enter an amount'); return }
    if (Number(amount) < 0.01) { setErr('Minimum 0.01 cUSD'); return }
    setBuying(true); setErr('')
    try {
      const result = await web3.buyWater(amount, nodeId)
      setSuccess(result)
      setAmount('')
    } catch (e) {
      setErr(e.message || 'Transaction failed')
    } finally {
      setBuying(false)
    }
  }

  if (success) return (
    <div style={{ textAlign: 'center', padding: '24px 16px' }}>
      <CheckCircle size={40} color="#0D9E75" style={{ display: 'block', margin: '0 auto 12px' }} />
      <div style={{ fontSize: 16, fontWeight: 700, color: '#26264A', marginBottom: 6 }}>Water Credits Purchased!</div>
      <div style={{ fontSize: 13, color: '#6B7099', marginBottom: 16 }}>
        Your MAJI tokens are in your wallet. Use them at any MajiSmart node.
      </div>
      <a href={`${web3.networkInfo?.explorerBase}/tx/${success.buyTx}`}
         target="_blank" rel="noreferrer"
         style={{ fontSize: 12, color: '#2F3C7E', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
        View transaction <ExternalLink size={12} />
      </a>
      <button className="btn btn-outline" onClick={() => setSuccess(null)} style={{ marginTop: 12, fontSize: 13 }}>
        Buy More
      </button>
    </div>
  )

  return (
    <div>
      <div className="form-group">
        <label>Select Water Node</label>
        <select value={nodeId} onChange={e => setNodeId(e.target.value)}>
          <option value="">Choose a node…</option>
          {(nodes || []).filter(n => n.status === 'active').map(n => (
            <option key={n.id} value={n.id}>{n.name} — {n.county}</option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label>Amount to pay (cUSD)</label>
        <input
          type="number" min="0.01" step="0.01"
          placeholder="e.g. 1.00"
          value={amount}
          onChange={e => setAmount(e.target.value)}
        />
        {amount && (
          <div style={{ fontSize: 12, color: '#0D9E75', marginTop: 4 }}>
            ≈ {litres} litres of water
          </div>
        )}
      </div>
      <div style={{ padding: '10px 14px', background: '#E5E7F0', borderRadius: 8, fontSize: 12, color: '#6B7099', marginBottom: 14 }}>
        <strong>Rate:</strong> 0.001 cUSD / MAJI · 1 MAJI = 10 litres · No middleman, no bank needed
      </div>
      {err && <div style={{ fontSize: 12, color: '#D93025', marginBottom: 10 }}>{err}</div>}
      <button
        className="btn btn-primary"
        onClick={handleBuy}
        disabled={buying || !web3.connected}
        style={{ width: '100%', fontWeight: 700 }}
      >
        {buying ? 'Sending transaction…' : <><Zap size={15} /> Buy Water with cUSD</>}
      </button>
      <div style={{ fontSize: 11, color: '#9AA0C9', marginTop: 6, textAlign: 'center' }}>
        You'll be asked to approve 2 transactions in MetaMask/Valora
      </div>
    </div>
  )
}

function OnChainQualityCard({ nodeId, explorerBase }) {
  const { data, loading, error, refetch } = useApiData(
    () => nodeId ? api.get(`/blockchain/quality/${nodeId}`) : Promise.resolve(null),
    { deps: [nodeId], isEmpty: d => !d }
  )
  if (!nodeId) return null
  if (loading) return <Loading rows={1} />
  if (error || !data) return (
    <div style={{ fontSize: 12, color: '#9AA0C9', padding: '10px 0' }}>No on-chain data yet for this node</div>
  )
  const sc = STATUS_COLOR[data.safety] || STATUS_COLOR.UNKNOWN
  return (
    <div style={{ padding: '12px 14px', background: sc.bg, borderRadius: 8, border: `1px solid ${sc.color}30` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: sc.color }}>{sc.label}</span>
        <button onClick={refetch} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <RefreshCw size={12} color={sc.color} />
        </button>
      </div>
      <div style={{ fontSize: 11, color: '#6B7099', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
        <span>Turbidity: <strong>{data.turbidity}</strong></span>
        <span>Flow: <strong>{data.flowRate}</strong></span>
        <span>Temp: <strong>{data.temperature}</strong></span>
        <span>Readings: <strong>{data.totalReadings}</strong></span>
      </div>
      <div style={{ fontSize: 10, color: '#9AA0C9', marginTop: 6 }}>
        ⛓️ Verified on Celo blockchain — tamper-proof
        {data.timestamp && ` · ${new Date(data.timestamp).toLocaleString()}`}
      </div>
    </div>
  )
}

export default function Web3Dashboard() {
  const web3 = useWeb3()
  const [selectedNode, setSelectedNode] = useState('')

  const { data: blockchainStatus } = useApiData(() => api.get('/blockchain/status'))
  const { data: nodes } = useApiData(() => api.get('/nodes'), { isEmpty: d => !d?.length })
  const { data: payStats } = useApiData(() => api.get('/blockchain/payment-stats'))

  const isLive = blockchainStatus?.enabled

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <Wallet size={22} color="#2F3C7E" />
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#26264A' }}>Web3 Water Wallet</h1>
        </div>
        <p style={{ fontSize: 14, color: '#6B7099' }}>
          Pay for water with cUSD on Celo blockchain. No bank, no middleman. Earn MAJI tokens for reporting issues.
        </p>
      </div>

      {/* Network status banner */}
      {!isLive && (
        <div style={{ padding: '12px 16px', background: '#FEF3D8', border: '1px solid #E8A020', borderRadius: 10, marginBottom: 18, fontSize: 13, color: '#A07010', display: 'flex', gap: 8 }}>
          <Info size={15} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>Blockchain not yet configured on this deployment. Web3 features are in preview — the platform works fully without them. Contact the admin to enable Celo integration.</span>
        </div>
      )}

      {isLive && (
        <div style={{ padding: '8px 14px', background: '#E1F5EE', border: '1px solid #0D9E75', borderRadius: 8, marginBottom: 16, fontSize: 12, color: '#0A7A5C', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0D9E75', animation: 'pulse-dot 1.6s infinite' }} />
          Connected to {blockchainStatus.networkName} · Block #{blockchainStatus.latestBlock?.toLocaleString()}
          <a href={blockchainStatus.explorerBase} target="_blank" rel="noreferrer" style={{ marginLeft: 'auto', color: '#0A7A5C' }}>
            <ExternalLink size={12} />
          </a>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 18 }}>

        {/* Wallet connection panel */}
        <div className="card fade-in" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#26264A', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Wallet size={15} color="#2F3C7E" /> Your Wallet
          </h3>
          <WalletConnect compact={false} />

          {web3.connected && (
            <div style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <StatBox label="MAJI Tokens"  value={parseFloat(web3.majiBalance).toFixed(2)} sub="water credits" color="#0D9E75" />
                <StatBox label="CELO Balance" value={parseFloat(web3.celoBalance).toFixed(3)} sub="for gas fees" color="#2F3C7E" />
              </div>
              <div style={{ padding: '8px 12px', background: '#E5E7F0', borderRadius: 8, fontSize: 12, color: '#6B7099' }}>
                💧 <strong>{(parseFloat(web3.majiBalance) * 10).toFixed(0)}</strong> litres of water credit available
              </div>
              {blockchainStatus?.majiToken && (
                <a href={`${blockchainStatus.explorerBase}/token/${blockchainStatus.majiToken}`}
                   target="_blank" rel="noreferrer"
                   style={{ fontSize: 11, color: '#6B7099', display: 'flex', alignItems: 'center', gap: 3, marginTop: 8 }}>
                  View MAJI token on Celoscan <ExternalLink size={10} />
                </a>
              )}
            </div>
          )}

          {!web3.connected && (
            <div style={{ marginTop: 12, fontSize: 12, color: '#9AA0C9' }}>
              Supports MetaMask · Valora · WalletConnect · Any Celo-compatible wallet
            </div>
          )}
        </div>

        {/* Buy water panel */}
        <div className="card fade-in" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#26264A', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Droplets size={15} color="#0D9E75" /> Buy Water Credits
          </h3>
          {!web3.connected ? (
            <div style={{ textAlign: 'center', color: '#9AA0A6', padding: '20px 0', fontSize: 13 }}>
              Connect your wallet to buy water with cUSD
            </div>
          ) : (
            <BuyWaterPanel web3={web3} nodes={nodes} />
          )}
        </div>
      </div>

      {/* On-chain water quality */}
      <div className="card fade-in" style={{ padding: 20, marginTop: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
          <ShieldCheck size={15} color="#2F3C7E" />
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#26264A' }}>On-Chain Water Quality Verification</h3>
        </div>
        <p style={{ fontSize: 13, color: '#6B7099', marginBottom: 14 }}>
          Sensor readings submitted to the Celo blockchain cannot be altered. Citizens, NGOs, and regulators can verify water quality data directly.
        </p>
        <div className="form-group" style={{ marginBottom: 12 }}>
          <label>Select a node to verify</label>
          <select value={selectedNode} onChange={e => setSelectedNode(e.target.value)}>
            <option value="">Choose a node…</option>
            {(nodes || []).map(n => <option key={n.id} value={n.id}>{n.name} — {n.county}</option>)}
          </select>
        </div>
        <OnChainQualityCard nodeId={selectedNode} explorerBase={blockchainStatus?.explorerBase} />
      </div>

      {/* Platform blockchain stats */}
      {payStats && (
        <div className="card fade-in" style={{ padding: 20, marginTop: 18 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#26264A', marginBottom: 14 }}>
            📊 Platform Blockchain Stats
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            <StatBox label="Total Revenue" value={`$${Number(payStats.totalRevenue_cUSD).toFixed(2)}`} sub="cUSD on-chain" color="#0D9E75" />
            <StatBox label="Tokens Sold"   value={Number(payStats.totalTokensSold).toFixed(0)} sub="MAJI tokens" color="#2F3C7E" />
            <StatBox label="Token Price"   value={`$${payStats.pricePerToken_cUSD}`} sub="cUSD per MAJI" color="#E8A020" />
          </div>
        </div>
      )}

      {/* How it works */}
      <div className="card fade-in" style={{ padding: 20, marginTop: 18, background: '#FAFAFC' }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#26264A', marginBottom: 14 }}>⛓️ How Web3 Works in MajiSmart</h3>
        <div style={{ display: 'grid', gap: 10 }}>
          {[
            ['1', 'Connect your Celo wallet (MetaMask or Valora — free to download)', '#2F3C7E'],
            ['2', 'Buy MAJI water tokens with cUSD (Celo\'s stable coin, pegged 1:1 to USD)', '#0D9E75'],
            ['3', 'Use MAJI tokens at any MajiSmart IoT node — the smart contract burns them and releases water', '#E8A020'],
            ['4', 'Submit community issue reports — resolved reports reward you with MAJI tokens automatically', '#D93025'],
            ['5', 'Water quality readings are submitted to the blockchain oracle — permanently and verifiably', '#7A3FB5'],
            ['6', 'Vote on community governance proposals with your MAJI tokens — token-weighted DAO democracy', '#2F3C7E'],
          ].map(([num, text, col]) => (
            <div key={num} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: col, color: 'white', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{num}</div>
              <div style={{ fontSize: 13, color: '#6B7099', paddingTop: 3 }}>{text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
