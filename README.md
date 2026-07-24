# MajiSmart — AI-Powered Water Intelligence Platform

## Quick Deploy

### Backend → Render
1. New Web Service · Root: `backend` · Build: `npm install` · Start: `node server.js`
2. Add PostgreSQL on Render, link the instance
3. Set env vars:

```
NODE_ENV=production
DATABASE_URL=<from Render Postgres>
JWT_SECRET=<random 64-char string>
FRONTEND_URL=https://your-app.vercel.app
ANTHROPIC_API_KEY=<optional — enables Claude AI chat>
```

### Frontend → Vercel
1. Root: `frontend` · Build: `npm run build` · Output: `dist`
2. Set env var: `VITE_API_URL=https://your-backend.onrender.com`

### Web3 / Blockchain (optional)
```bash
cd blockchain && npm install
cp .env.example .env  # fill in DEPLOYER_PRIVATE_KEY
npx hardhat run scripts/deploy.js --network alfajores
```
Then add the printed contract addresses + `CELO_RPC_URL` + `DEPLOYER_PRIVATE_KEY` to Render env vars.

## Demo Login
- admin@majismart.ke / admin123
- county@majismart.ke / admin123
- operator@majismart.ke / admin123

## Features
- AI leak detection, anomaly detection, consumption forecasting
- Citizen water status (crowdsourced + sensor data)
- Community issue reporting with GPS + photo
- Find nearest water point with directions
- Personal water spending tracker
- Water DAO governance on Celo blockchain
- MAJI token water payments (Web3)
- On-chain water quality oracle
