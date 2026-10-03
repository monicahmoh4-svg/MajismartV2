require('@nomicfoundation/hardhat-toolbox');
require('dotenv').config();

const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || '0x'.padEnd(66, '0');
const CELOSCAN_KEY = process.env.CELOSCAN_API_KEY || '';

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: '0.8.20',
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },

  networks: {
    // ── Local ───────────────────────────────────────────────────────────
    hardhat: {},
    localhost: { url: 'http://127.0.0.1:8545' },

    // ── Celo Alfajores testnet (free test CELO from faucet.celo.org) ───
    alfajores: {
      url: 'https://alfajores-forno.celo-testnet.org',
      accounts: [PRIVATE_KEY],
      chainId: 44787,
      gasPrice: 'auto',
    },

    // ── Celo mainnet ────────────────────────────────────────────────────
    celo: {
      url: 'https://forno.celo.org',
      accounts: [PRIVATE_KEY],
      chainId: 42220,
      gasPrice: 'auto',
    },
  },

  etherscan: {
    apiKey: {
      alfajores: CELOSCAN_KEY,
      celo:      CELOSCAN_KEY,
    },
    customChains: [
      {
        network: 'alfajores',
        chainId: 44787,
        urls: {
          apiURL: 'https://api-alfajores.celoscan.io/api',
          browserURL: 'https://alfajores.celoscan.io',
        },
      },
      {
        network: 'celo',
        chainId: 42220,
        urls: {
          apiURL: 'https://api.celoscan.io/api',
          browserURL: 'https://celoscan.io',
        },
      },
    ],
  },

  paths: {
    sources:   './contracts',
    tests:     './test',
    cache:     './cache',
    artifacts: './artifacts',
  },
};
