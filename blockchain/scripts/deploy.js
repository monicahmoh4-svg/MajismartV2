// scripts/deploy.js
// Run:
//   npx hardhat run scripts/deploy.js --network alfajores   (testnet)
//   npx hardhat run scripts/deploy.js --network celo        (mainnet)

const { ethers } = require('hardhat');

// ── Celo cUSD addresses ──────────────────────────────────────────────────
const CUSD_ADDRESSES = {
  alfajores: '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1',
  celo:      '0x765DE816845861e75A25fCA122bb6898B8B1282a',
};

// ── Initial water price ──────────────────────────────────────────────────
// 0.001 cUSD per MAJI token → 0.0001 cUSD per litre (very affordable)
const PRICE_PER_TOKEN = ethers.parseUnits('0.001', 18);

async function main() {
  const [deployer] = await ethers.getSigners();
  const network    = hre.network.name;
  const cUSD       = CUSD_ADDRESSES[network] || CUSD_ADDRESSES.alfajores;

  console.log(`\n🚀 Deploying MajiSmart contracts on: ${network}`);
  console.log(`   Deployer:  ${deployer.address}`);
  console.log(`   cUSD addr: ${cUSD}`);
  console.log(`   Balance:   ${ethers.formatEther(await deployer.provider.getBalance(deployer.address))} CELO\n`);

  // 1. MajiToken ────────────────────────────────────────────────────────
  console.log('📦 Deploying MajiToken...');
  const MajiToken  = await ethers.getContractFactory('MajiToken');
  const majiToken  = await MajiToken.deploy();
  await majiToken.waitForDeployment();
  const majiAddr   = await majiToken.getAddress();
  console.log(`   ✅ MajiToken deployed: ${majiAddr}`);

  // 2. WaterPayment ─────────────────────────────────────────────────────
  console.log('📦 Deploying WaterPayment...');
  const WaterPayment = await ethers.getContractFactory('WaterPayment');
  const waterPayment = await WaterPayment.deploy(cUSD, majiAddr, PRICE_PER_TOKEN);
  await waterPayment.waitForDeployment();
  const paymentAddr  = await waterPayment.getAddress();
  console.log(`   ✅ WaterPayment deployed: ${paymentAddr}`);

  // 3. WaterQualityOracle ───────────────────────────────────────────────
  console.log('📦 Deploying WaterQualityOracle...');
  const WaterQualityOracle = await ethers.getContractFactory('WaterQualityOracle');
  const oracle             = await WaterQualityOracle.deploy();
  await oracle.waitForDeployment();
  const oracleAddr         = await oracle.getAddress();
  console.log(`   ✅ WaterQualityOracle deployed: ${oracleAddr}`);

  // 4. WaterDAO (per county — deploy one per county if needed) ──────────
  console.log('📦 Deploying WaterDAO (Nairobi County)...');
  const WaterDAO = await ethers.getContractFactory('WaterDAO');
  const waterDAO = await WaterDAO.deploy(majiAddr, 'Nairobi');
  await waterDAO.waitForDeployment();
  const daoAddr  = await waterDAO.getAddress();
  console.log(`   ✅ WaterDAO deployed: ${daoAddr}`);

  // ── Post-deployment setup ────────────────────────────────────────────
  console.log('\n⚙️  Running post-deploy setup...');

  // Allow WaterPayment to mint MAJI tokens
  const tx1 = await majiToken.authorizeOracle(paymentAddr, true);
  await tx1.wait();
  console.log(`   ✅ WaterPayment authorised to mint MAJI`);

  // Authorise the deployer's wallet as oracle submitter on quality oracle
  // (in production this would be your Render backend wallet)
  const tx2 = await oracle.authorizeSubmitter(deployer.address, true);
  await tx2.wait();
  console.log(`   ✅ Deployer authorised as oracle submitter`);

  // ── Print env vars ────────────────────────────────────────────────────
  console.log('\n📋 Add these to your .env files:\n');
  console.log(`MAJI_TOKEN_ADDRESS=${majiAddr}`);
  console.log(`WATER_PAYMENT_ADDRESS=${paymentAddr}`);
  console.log(`WATER_ORACLE_ADDRESS=${oracleAddr}`);
  console.log(`WATER_DAO_ADDRESS=${daoAddr}`);
  console.log(`CELO_NETWORK=${network}`);
  console.log(`CELO_RPC_URL=${network === 'celo' ? 'https://forno.celo.org' : 'https://alfajores-forno.celo-testnet.org'}`);
  console.log(`CUSD_ADDRESS=${cUSD}`);

  console.log('\n🎉 All contracts deployed and configured!\n');

  // ── Verify on Celoscan (optional) ─────────────────────────────────────
  if (process.env.CELOSCAN_API_KEY) {
    console.log('🔍 Verifying contracts on Celoscan...');
    try {
      await hre.run('verify:verify', { address: majiAddr, constructorArguments: [] });
      await hre.run('verify:verify', { address: paymentAddr, constructorArguments: [cUSD, majiAddr, PRICE_PER_TOKEN] });
      await hre.run('verify:verify', { address: oracleAddr, constructorArguments: [] });
      await hre.run('verify:verify', { address: daoAddr, constructorArguments: [majiAddr, 'Nairobi'] });
      console.log('✅ All contracts verified!');
    } catch (e) {
      console.warn('⚠️  Verification failed (may already be verified):', e.message);
    }
  }

  return { majiAddr, paymentAddr, oracleAddr, daoAddr };
}

main().catch(e => { console.error(e); process.exit(1); });
