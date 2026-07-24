import { Wallet, Unplug, ExternalLink, Droplets } from 'lucide-react'
import useWeb3 from '../hooks/useWeb3'

export default function WalletConnect({ compact = false }) {
  const {
    account, connected, connecting, error,
    majiBalance, celoBalance, networkInfo,
    hasWallet, connect, disconnect,
  } = useWeb3()

  const short = (addr) => addr ? addr.slice(0, 6) + '...' + addr.slice(-4) : ''
  const explorer = networkInfo?.explorerBase || 'https://celoscan.io'

  if (!hasWallet) {
    return (
      <a
        href="https://metamask.io/download/"
        target="_blank"
        rel="noreferrer"
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: compact ? '6px 10px' : '9px 14px',
          background: '#F96167', color: 'white',
          borderRadius: 8, textDecoration: 'none', fontSize: 12, fontWeight: 600
        }}
      >
        <Wallet size={14} /> Install MetaMask
      </a>
    )
  }

  if (connected && account) {
    return (
      <div style={{
        background: '#E1F5EE', borderRadius: 10,
        padding: compact ? '6px 10px' : '10px 14px',
        border: '1.5px solid #0D9E75'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: compact ? 0 : 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0D9E75', flexShrink: 0 }} />
            <a
              href={`${explorer}/address/${account}`}
              target="_blank" rel="noreferrer"
              style={{ fontSize: 12, fontWeight: 700, color: '#0A7A5C', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}
            >
              {short(account)} <ExternalLink size={11} />
            </a>
          </div>
          <button
            onClick={disconnect}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
            title="Disconnect"
          >
            <Unplug size={14} color="#D93025" />
          </button>
        </div>

        {!compact && (
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <div style={{ fontSize: 11, color: '#0A7A5C' }}>
              <Droplets size={11} style={{ display: 'inline', marginRight: 3 }} />
              <strong>{parseFloat(majiBalance).toFixed(1)}</strong> MAJI
            </div>
            <div style={{ fontSize: 11, color: '#5F6368' }}>
              <strong>{parseFloat(celoBalance).toFixed(2)}</strong> CELO
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={connect}
        disabled={connecting}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: compact ? '6px 10px' : '9px 14px',
          background: connecting ? '#9AA0C9' : '#2F3C7E',
          color: 'white', border: 'none', borderRadius: 8,
          fontSize: 12, fontWeight: 700, cursor: 'pointer',
          width: '100%', justifyContent: 'center'
        }}
      >
        <Wallet size={14} />
        {connecting ? 'Connecting…' : 'Connect Wallet'}
      </button>
      {error && (
        <div style={{ fontSize: 11, color: '#D93025', marginTop: 4 }}>{error}</div>
      )}
    </div>
  )
}
