import { useState, useEffect, useCallback } from 'react'

// Celo chain IDs
const CELO_CHAIN_IDS = { mainnet: '0xa4ec', alfajores: '0xaef3' }

// Minimal ERC-20 ABI for cUSD approval + MAJI balance
const ERC20_ABI = [
  { name: 'balanceOf', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }] },
  { name: 'approve', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'spender', type: 'address' },{ name: 'amount', type: 'uint256' }],
    outputs: [{ name: '', type: 'bool' }] },
  { name: 'allowance', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' },{ name: 'spender', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }] },
]

// WaterPayment ABI (buy water)
const PAYMENT_ABI = [
  { name: 'buyWater', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'cUSDAmount', type: 'uint256' },{ name: 'nodeId', type: 'string' }],
    outputs: [{ name: 'majiTokens', type: 'uint256' }] },
  { name: 'pricePerToken', type: 'function', stateMutability: 'view',
    inputs: [], outputs: [{ name: '', type: 'uint256' }] },
]

// WaterDAO ABI (vote)
const DAO_ABI = [
  { name: 'castVote', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'proposalId', type: 'uint256' },{ name: 'voteType', type: 'uint8' }],
    outputs: [] },
  { name: 'createProposal', type: 'function', stateMutability: 'nonpayable',
    inputs: [
      { name: 'title', type: 'string' },{ name: 'description', type: 'string' },
      { name: 'ipfsHash', type: 'string' },{ name: 'proposalType', type: 'uint8' },
      { name: 'value', type: 'uint256' }
    ],
    outputs: [{ name: 'proposalId', type: 'uint256' }] },
  { name: 'finalizeProposal', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'proposalId', type: 'uint256' }], outputs: [] },
]

// Simple ethers-like hex encoder (avoids adding ethers as a dep)
function toHex(n) { return '0x' + BigInt(n).toString(16) }
function parseUnits(val, dec = 18) { return BigInt(Math.round(Number(val) * 10 ** dec)) }
function formatUnits(val, dec = 18) {
  if (!val) return '0'
  const big = BigInt(val)
  const divisor = BigInt(10 ** dec)
  const whole = big / divisor
  const frac  = big % divisor
  const fracStr = frac.toString().padStart(dec, '0').slice(0, 4)
  return `${whole}.${fracStr}`
}

// Encode a function call (minimal ABI encoder for simple types)
function encodeFunctionCall(name, types, values) {
  // Use window.ethereum's own request with eth_call for reads
  // For writes, we encode via MetaMask's eth_sendTransaction
  // This helper just builds the data field using a simplified approach
  const sig = `${name}(${types.join(',')})`
  const hash = keccak256Selector(sig)

  let data = hash
  for (let i = 0; i < types.length; i++) {
    const t = types[i]
    if (t === 'address') {
      data += values[i].slice(2).padStart(64, '0')
    } else if (t === 'uint256' || t === 'uint8') {
      data += BigInt(values[i]).toString(16).padStart(64, '0')
    } else if (t === 'string') {
      // strings are ABI-encoded as dynamic types
      const str = values[i]
      const offset = (types.length * 32).toString(16).padStart(64, '0')
      const len    = str.length.toString(16).padStart(64, '0')
      const bytes  = Array.from(str).map(c => c.charCodeAt(0).toString(16).padStart(2,'0')).join('')
      const padded = bytes.padEnd(Math.ceil(bytes.length / 64) * 64, '0')
      // Simplified: for single string args this works
      data += offset + len + padded
    }
  }
  return data
}

// Keccak256 first 4 bytes selector — use window.ethereum eth_call to avoid dep
// We pre-compute the selectors for the functions we need
const SELECTORS = {
  buyWater:      '0x4b25de7c', // keccak256("buyWater(uint256,string)")[:4]
  approve:       '0x095ea7b3', // keccak256("approve(address,uint256)")[:4]
  castVote:      '0x3e0d9ac0', // keccak256("castVote(uint256,uint8)")[:4]
}

function keccak256Selector(sig) { return SELECTORS[sig.split('(')[0]] || '0x' }

export default function useWeb3() {
  const [account,     setAccount]     = useState(null)
  const [chainId,     setChainId]     = useState(null)
  const [connected,   setConnected]   = useState(false)
  const [connecting,  setConnecting]  = useState(false)
  const [majiBalance, setMajiBalance] = useState('0')
  const [celoBalance, setCeloBalance] = useState('0')
  const [error,       setError]       = useState(null)
  const [networkInfo, setNetworkInfo] = useState(null)

  const hasWallet = typeof window !== 'undefined' && !!window.ethereum

  // ── Fetch balances ────────────────────────────────────────────────────
  const fetchBalances = useCallback(async (addr, info) => {
    if (!addr || !info) return
    try {
      // CELO native balance
      const balHex = await window.ethereum.request({
        method: 'eth_getBalance', params: [addr, 'latest']
      })
      setCeloBalance(formatUnits(parseInt(balHex, 16).toString()))

      // MAJI token balance via eth_call
      const majiData = '0x70a08231' + addr.slice(2).padStart(64, '0') // balanceOf(address)
      const majiHex  = await window.ethereum.request({
        method: 'eth_call',
        params: [{ to: info.majiToken, data: majiData }, 'latest']
      })
      setMajiBalance(formatUnits(parseInt(majiHex || '0x0', 16).toString()))
    } catch { /* silent */ }
  }, [])

  // ── Connect wallet ────────────────────────────────────────────────────
  const connect = useCallback(async () => {
    if (!hasWallet) {
      setError('No Web3 wallet detected. Install MetaMask or Valora.')
      return
    }
    setConnecting(true); setError(null)
    try {
      // Fetch network info from backend first
      const res  = await fetch(`${import.meta.env.VITE_API_URL}/api/blockchain/status`)
      const info = await res.json()
      setNetworkInfo(info)

      // Request accounts
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      const addr     = accounts[0]
      const cid      = await window.ethereum.request({ method: 'eth_chainId' })

      setAccount(addr)
      setChainId(cid)
      setConnected(true)

      // Switch to Celo network if needed
      const targetChainId = info.chainId === 42220
        ? CELO_CHAIN_IDS.mainnet
        : CELO_CHAIN_IDS.alfajores

      if (cid !== targetChainId) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: targetChainId }]
          })
        } catch (switchErr) {
          if (switchErr.code === 4902) {
            // Add Celo network
            const isMainnet = info.chainId === 42220
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId:         targetChainId,
                chainName:       isMainnet ? 'Celo Mainnet' : 'Celo Alfajores Testnet',
                nativeCurrency:  { name: 'CELO', symbol: 'CELO', decimals: 18 },
                rpcUrls:         [isMainnet ? 'https://forno.celo.org' : 'https://alfajores-forno.celo-testnet.org'],
                blockExplorerUrls:[info.explorerBase],
              }]
            })
          }
        }
      }

      await fetchBalances(addr, info)
    } catch (err) {
      setError(err.message || 'Connection failed')
    } finally {
      setConnecting(false)
    }
  }, [hasWallet, fetchBalances])

  // ── Disconnect ────────────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    setAccount(null); setConnected(false)
    setMajiBalance('0'); setCeloBalance('0')
  }, [])

  // ── Buy water tokens ──────────────────────────────────────────────────
  const buyWater = useCallback(async (cUSDAmount, nodeId) => {
    if (!connected || !networkInfo) throw new Error('Wallet not connected')
    const amountWei = parseUnits(cUSDAmount).toString()

    // Step 1: approve cUSD spend
    const approveData = '0x095ea7b3'
      + networkInfo.waterPayment.slice(2).padStart(64, '0')
      + BigInt(amountWei).toString(16).padStart(64, '0')

    const approveTx = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [{ from: account, to: networkInfo.cusdAddress, data: approveData }]
    })

    // Wait briefly then send the purchase
    await new Promise(r => setTimeout(r, 2000))

    // Step 2: buyWater — encode call manually
    // buyWater(uint256 cUSDAmount, string nodeId)
    const nodeBytes   = new TextEncoder().encode(nodeId)
    const strOffset   = '0000000000000000000000000000000000000000000000000000000000000040'
    const amountHex   = BigInt(amountWei).toString(16).padStart(64, '0')
    const strLen      = nodeBytes.length.toString(16).padStart(64, '0')
    const strData     = Array.from(nodeBytes).map(b => b.toString(16).padStart(2,'0')).join('')
    const strPadded   = strData.padEnd(Math.ceil(strData.length / 64) * 64, '0')
    const buyData     = '0x4b25de7c' + amountHex + strOffset + strLen + strPadded

    const buyTx = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [{ from: account, to: networkInfo.waterPayment, data: buyData }]
    })

    await fetchBalances(account, networkInfo)
    return { approveTx, buyTx }
  }, [connected, networkInfo, account, fetchBalances])

  // ── Vote on DAO proposal ──────────────────────────────────────────────
  const castVote = useCallback(async (proposalId, voteType) => {
    // voteType: 1=For, 2=Against, 3=Abstain
    if (!connected || !networkInfo) throw new Error('Wallet not connected')
    const data = '0x3e0d9ac0'
      + BigInt(proposalId).toString(16).padStart(64, '0')
      + BigInt(voteType).toString(16).padStart(64, '0')

    return window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [{ from: account, to: networkInfo.waterDAO, data }]
    })
  }, [connected, networkInfo, account])

  // ── Listen for account / chain changes ───────────────────────────────
  useEffect(() => {
    if (!hasWallet) return
    const onAccounts = (accounts) => {
      if (accounts.length === 0) disconnect()
      else { setAccount(accounts[0]); fetchBalances(accounts[0], networkInfo) }
    }
    const onChain = (cid) => setChainId(cid)
    window.ethereum.on('accountsChanged', onAccounts)
    window.ethereum.on('chainChanged',    onChain)
    return () => {
      window.ethereum.removeListener('accountsChanged', onAccounts)
      window.ethereum.removeListener('chainChanged',    onChain)
    }
  }, [hasWallet, disconnect, fetchBalances, networkInfo])

  return {
    account, chainId, connected, connecting, error,
    majiBalance, celoBalance, networkInfo, hasWallet,
    connect, disconnect, buyWater, castVote,
    refresh: () => fetchBalances(account, networkInfo),
  }
}
