/**
 * backend/services/blockchainService.js
 *
 * Connects the MajiSmart Node.js backend to the Celo blockchain.
 * Works in graceful-degradation mode: if env vars are missing the
 * platform continues to run — blockchain features simply return
 * "blockchain not configured" responses.
 *
 * Environment variables required (set on Render):
 *   CELO_RPC_URL           e.g. https://alfajores-forno.celo-testnet.org
 *   DEPLOYER_PRIVATE_KEY   wallet that owns / submits to oracle
 *   MAJI_TOKEN_ADDRESS
 *   WATER_PAYMENT_ADDRESS
 *   WATER_ORACLE_ADDRESS
 *   WATER_DAO_ADDRESS
 *   CUSD_ADDRESS
 */

const { ethers } = require('ethers');
const db = require('../db');

// ── ABIs (minimal — only functions we call from backend) ─────────────────

const MAJI_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function litresBalance(address) view returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function mint(address,uint256)',
  'function authorizeOracle(address,bool)',
  'event ReportRewarded(address indexed reporter, uint256 tokens, string reportId)',
];

const PAYMENT_ABI = [
  'function pricePerToken() view returns (uint256)',
  'function totalRevenue() view returns (uint256)',
  'function totalTokensSold() view returns (uint256)',
  'function userTotalSpent(address) view returns (uint256)',
  'function cUSDToLitres(uint256) view returns (uint256)',
  'function litrePrice() view returns (uint256)',
  'event WaterPurchased(address indexed buyer, uint256 cUSDAmount, uint256 majiTokens, string nodeId, uint256 timestamp)',
];

const ORACLE_ABI = [
  'function submitReading(string,uint32,uint32,uint16,uint8,uint8)',
  'function getLatestReading(string) view returns (tuple(uint32 turbidity,uint32 flowRate,uint16 temperature,uint8 ph,uint8 safetyScore,uint8 safety,uint256 timestamp,address submittedBy))',
  'function getSafetyLabel(string) view returns (string)',
  'function readingCount(string) view returns (uint256)',
  'function alertsCount() view returns (uint256)',
  'function getAlert(uint256) view returns (tuple(string nodeId,string alertType,string message,uint8 severity,uint256 timestamp,bool resolved,address resolvedBy,uint256 resolvedAt))',
  'function resolveAlert(uint256)',
  'function registerNode(string,bool)',
  'function authorizeSubmitter(address,bool)',
  'event ReadingSubmitted(string indexed nodeId, uint32 turbidity, uint8 safety, uint256 timestamp, address submitter)',
  'event AlertRaised(uint256 indexed alertId, string nodeId, string alertType, uint8 severity, uint256 timestamp)',
];

const DAO_ABI = [
  'function createProposal(string,string,string,uint8,uint256) returns (uint256)',
  'function castVote(uint256,uint8)',
  'function finalizeProposal(uint256)',
  'function getProposal(uint256) view returns (tuple(uint256 id,string title,string description,string ipfsHash,address proposer,uint8 proposalType,uint256 value,uint256 forVotes,uint256 againstVotes,uint256 abstainVotes,uint256 startTime,uint256 endTime,uint8 status,bool executed,string executionNote))',
  'function proposalsCount() view returns (uint256)',
  'function getActiveProposals() view returns (uint256[])',
  'function quorumProgress(uint256) view returns (uint256 current, uint256 required, bool met)',
  'event ProposalCreated(uint256 indexed proposalId, string title, address indexed proposer, uint8 proposalType, uint256 endTime)',
];

// ── Module state ─────────────────────────────────────────────────────────

let provider = null;
let signer   = null;
let contracts = {};
let initialized = false;

const STATUS_LABELS = ['SAFE', 'BOIL_FIRST', 'UNSAFE', 'UNKNOWN'];

// ── Initialise ───────────────────────────────────────────────────────────

async function init() {
  const {
    CELO_RPC_URL, DEPLOYER_PRIVATE_KEY,
    MAJI_TOKEN_ADDRESS, WATER_PAYMENT_ADDRESS,
    WATER_ORACLE_ADDRESS, WATER_DAO_ADDRESS,
  } = process.env;

  if (!CELO_RPC_URL || !DEPLOYER_PRIVATE_KEY || !MAJI_TOKEN_ADDRESS) {
    console.log('⚠️  Blockchain env vars not set — blockchain features disabled (platform runs normally)');
    return false;
  }

  try {
    provider = new ethers.JsonRpcProvider(CELO_RPC_URL);
    signer   = new ethers.Wallet(DEPLOYER_PRIVATE_KEY, provider);

    const block = await provider.getBlockNumber();
    console.log(`✅ Connected to Celo — block #${block} — wallet: ${signer.address}`);

    contracts.maji    = new ethers.Contract(MAJI_TOKEN_ADDRESS,    MAJI_ABI,    signer);
    contracts.payment = new ethers.Contract(WATER_PAYMENT_ADDRESS, PAYMENT_ABI, signer);
    contracts.oracle  = new ethers.Contract(WATER_ORACLE_ADDRESS,  ORACLE_ABI,  signer);
    contracts.dao     = new ethers.Contract(WATER_DAO_ADDRESS,      DAO_ABI,    signer);

    initialized = true;

    // Listen for on-chain payment events and mirror to Postgres
    _listenForPayments();
    // Listen for oracle alerts and mirror to alerts table
    _listenForOracleAlerts();

    console.log('✅ Blockchain event listeners started');
    return true;
  } catch (err) {
    console.error('⚠️  Blockchain init failed (platform still runs):', err.message);
    return false;
  }
}

// ── Internal event listeners ─────────────────────────────────────────────

function _listenForPayments() {
  if (!contracts.payment) return;
  contracts.payment.on('WaterPurchased', async (buyer, cUSDAmount, majiTokens, nodeId, timestamp) => {
    try {
      const txHash = (await contracts.payment.runner.provider.getLogs({
        address: await contracts.payment.getAddress(),
        fromBlock: 'latest',
      }))[0]?.transactionHash || 'unknown';

      await db.query(
        `INSERT INTO payments (node_id, phone, amount_ksh, litres, mpesa_code, status, completed_at)
         SELECT id, $2, $3, $4, $5, 'completed', NOW()
         FROM nodes WHERE id = $1
         ON CONFLICT DO NOTHING`,
        [
          nodeId,
          buyer,   // wallet address used as "phone" for on-chain payments
          (Number(ethers.formatUnits(cUSDAmount, 18)) * 130).toFixed(2), // cUSD → KSh approx
          Number(majiTokens) / 1e18 * 10,   // MAJI tokens × 10 litres/token
          'CELO:' + txHash.slice(0, 16),
        ]
      );
      console.log(`⛓️  On-chain payment mirrored: ${buyer} → node ${nodeId}`);
    } catch (e) {
      console.error('Failed to mirror blockchain payment:', e.message);
    }
  });
}

function _listenForOracleAlerts() {
  if (!contracts.oracle) return;
  contracts.oracle.on('AlertRaised', async (alertId, nodeId, alertType, severity) => {
    try {
      const { rows } = await db.query('SELECT id FROM nodes WHERE id = $1', [nodeId]);
      if (!rows.length) return;

      const severityMap = { 1: 'info', 2: 'warning', 3: 'critical' };
      await db.query(
        `INSERT INTO alerts (node_id, type, message, severity)
         VALUES ($1, $2, $3, $4)`,
        [
          nodeId,
          alertType,
          `[On-chain] ${alertType.replace(/_/g, ' ')} — alert #${alertId}`,
          severityMap[severity] || 'warning',
        ]
      );
      console.log(`⛓️  On-chain alert #${alertId} mirrored to DB`);
    } catch (e) {
      console.error('Failed to mirror oracle alert:', e.message);
    }
  });
}

// ── Public API ────────────────────────────────────────────────────────────

function isEnabled() { return initialized; }

async function getMajiBalance(address) {
  if (!initialized) return null;
  const raw     = await contracts.maji.balanceOf(address);
  const litres  = await contracts.maji.litresBalance(address);
  return {
    maji:   ethers.formatUnits(raw, 18),
    litres: litres.toString(),
  };
}

async function getPaymentStats() {
  if (!initialized) return null;
  const [price, revenue, sold] = await Promise.all([
    contracts.payment.pricePerToken(),
    contracts.payment.totalRevenue(),
    contracts.payment.totalTokensSold(),
  ]);
  return {
    pricePerToken_cUSD: ethers.formatUnits(price, 18),
    totalRevenue_cUSD:  ethers.formatUnits(revenue, 18),
    totalTokensSold:    ethers.formatUnits(sold, 18),
  };
}

async function getOnChainQuality(nodeId) {
  if (!initialized) return null;
  try {
    const reading = await contracts.oracle.getLatestReading(nodeId);
    const label   = await contracts.oracle.getSafetyLabel(nodeId);
    const count   = await contracts.oracle.readingCount(nodeId);
    return {
      turbidity:   (reading.turbidity / 100).toFixed(2) + ' NTU',
      flowRate:    (reading.flowRate   / 100).toFixed(2) + ' L/min',
      temperature: (reading.temperature / 10).toFixed(1) + ' °C',
      safety:      STATUS_LABELS[reading.safety] || 'UNKNOWN',
      safetyLabel: label,
      timestamp:   new Date(Number(reading.timestamp) * 1000).toISOString(),
      totalReadings: count.toString(),
      onChain:     true,
    };
  } catch {
    return null;
  }
}

/**
 * Called from the cron job in server.js after a sensor reading is saved to Postgres.
 * Submits the reading to the immutable on-chain oracle.
 */
async function submitReadingToOracle(nodeId, turbidity, flowRate, temperature, ph = 7) {
  if (!initialized) return null;
  try {
    const tx = await contracts.oracle.submitReading(
      nodeId,
      Math.round(turbidity * 100),   // NTU → stored * 100
      Math.round(flowRate  * 100),   // L/min → stored * 100
      Math.round(temperature * 10),  // °C → stored * 10
      Math.round(ph * 10),           // pH → stored * 10
      Math.min(100, Math.max(0, Math.round(100 - turbidity * 10)))  // simple score
    );
    await tx.wait();
    console.log(`⛓️  Oracle reading submitted for node ${nodeId.slice(0, 8)}...`);
    return tx.hash;
  } catch (e) {
    console.error('Oracle submission failed:', e.message);
    return null;
  }
}

async function registerNodeOnChain(nodeId) {
  if (!initialized) return null;
  try {
    const tx = await contracts.oracle.registerNode(nodeId, true);
    await tx.wait();
    return tx.hash;
  } catch (e) {
    console.error('Node registration failed:', e.message);
    return null;
  }
}

async function rewardReporter(reporterWallet, reportId) {
  if (!initialized || !reporterWallet) return null;
  try {
    const tx = await contracts.maji.rewardReporter(reporterWallet, reportId);
    await tx.wait();
    console.log(`⛓️  Reporter rewarded: ${reporterWallet} for report ${reportId}`);
    return tx.hash;
  } catch (e) {
    console.error('Reporter reward failed:', e.message);
    return null;
  }
}

async function getDAOProposals(limit = 20) {
  if (!initialized) return [];
  try {
    const count = Number(await contracts.dao.proposalsCount());
    const proposals = [];
    const start = Math.max(0, count - limit);
    for (let i = start; i < count; i++) {
      const p = await contracts.dao.getProposal(i);
      proposals.push({
        id:            Number(p.id),
        title:         p.title,
        description:   p.description,
        proposer:      p.proposer,
        proposalType:  Number(p.proposalType),
        forVotes:      ethers.formatUnits(p.forVotes, 18),
        againstVotes:  ethers.formatUnits(p.againstVotes, 18),
        abstainVotes:  ethers.formatUnits(p.abstainVotes, 18),
        startTime:     new Date(Number(p.startTime) * 1000).toISOString(),
        endTime:       new Date(Number(p.endTime)   * 1000).toISOString(),
        status:        ['Active','Passed','Failed','Executed','Cancelled'][Number(p.status)],
        executed:      p.executed,
        executionNote: p.executionNote,
      });
    }
    return proposals.reverse(); // newest first
  } catch (e) {
    console.error('getDAOProposals failed:', e.message);
    return [];
  }
}

async function getNetworkInfo() {
  if (!initialized) return null;
  try {
    const network = await provider.getNetwork();
    const block   = await provider.getBlockNumber();
    return {
      chainId:         Number(network.chainId),
      networkName:     network.name || (Number(network.chainId) === 44787 ? 'Celo Alfajores' : 'Celo Mainnet'),
      latestBlock:     block,
      majiToken:       await contracts.maji.getAddress(),
      waterPayment:    await contracts.payment.getAddress(),
      waterOracle:     await contracts.oracle.getAddress(),
      waterDAO:        await contracts.dao.getAddress(),
      cusdAddress:     process.env.CUSD_ADDRESS,
      explorerBase:    Number(network.chainId) === 42220
                         ? 'https://celoscan.io'
                         : 'https://alfajores.celoscan.io',
    };
  } catch (e) {
    return null;
  }
}

module.exports = {
  init,
  isEnabled,
  getMajiBalance,
  getPaymentStats,
  getOnChainQuality,
  submitReadingToOracle,
  registerNodeOnChain,
  rewardReporter,
  getDAOProposals,
  getNetworkInfo,
};
