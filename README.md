# MajiSmart OS v6 — Kenya Digital Water Utility Operating System

**Thesis: don't sell smart meters. Sell NRW cash recovery + prepaid collection.**
Kenya loses ~48% non-revenue water (WASREB Impact 18, KES 13.7–15.7B/yr). Meters exist; measurement doesn't.
MajiSmart OS is one cloud for **WSPs + estates/landlords + rural kiosks**: DMA water balance, M-Pesa STK + 20-digit prepaid tokens, WASREB KPIs, vendor permits (2025 Regs Sec.74), offline-first meters, AI leak triage.

## What changed in v6 (production-ready)
- **Boot-fixed backend**: `middleware/rbac.js` added, `authMiddleware` alias restored, all 20 routers mounted (`/api/nodes`, `/api/sensors`, `/api/users`, `/api/dashboard`, `/api/blockchain`, `/api/wasreb`, `/api/estates`, `/api/tokens`). CORS deny-by-default, helmet, rate-limit, `/api/health` + `/api/config`.
- **Real money**: `services/mpesa.js` Daraja STK Push + simulation fallback, 20-digit STS-style tokens, secure callback (`?secret=`), `routes/tokens.js` redeem/recover, SMS via Africa's Talking or console.
- **Kenya market tables**: `vendors` (permit registry), `estates` + `estate_units` (landlord billing), `prepaid_tokens`, `meter_readings`, `audit_logs`, WASREB KPIs + water-balance endpoints. Non-destructive `db-extensions.js` + `migrate:production`.
- **Frontend fixed**: `/app/*` shell wired to `Layout`, role guards, lazy routes, 404, single `src/api.js` client, 47 counties + role select, spinner CSS, PWA manifest points to real PNG icons.
- **Blockchain corrected**: `MajiToken.authorizeMinter` (WaterPayment can mint), `WaterQualityOracle.getSafetyLabel` returns "No data" on unknown nodes.
- **Security**: `.env` untracked (rotate Render `DATABASE_URL` + `JWT_SECRET` — they were committed), self-serve roles limited to citizen/operator/technician, error messages sanitized in prod.

## Target markets (Kenya first)
1. **Estates/landlords (P1 cash cow)**: 5–200 units Nairobi/Kiambu/Nakuru/Eldoret. HW KES 11,500–14,500, SaaS KES 150/meter/mo or 3.5% of sales. ROI <4 months from arrears cut.
2. **Small/medium + private WSPs (P1)**: Starter KES 45k/mo, NRW Pro KES 120–250k/mo/DMA + 15% gain-share. 90-day paid pilot KES 350k.
3. **Very large WSP NRW zones (P2)**: Nairobi, Mombasa, Kisumu, Nakuru — 1 DMA pilot, paid by savings.
4. **Rural kiosks/NGOs/counties (P2)**: smart tap KES 85k + 10% throughput, SLA KES 12k/point/yr.
5. **Industry (P3)**: sub-metering + ESG leak alerts.

See `MARKET_STRATEGY.md` for segments, KES pricing, competition kill-points (vs Wonderkid, Mobi-Water/Dayliff, Grundfos, eWATER, CityTaps, Upande), regulations (Water Act 2016, WASREB tariffs, DPA 2019, 2025 vending regs), GTM 0–12 months.

## Quick deploy
### Backend → Render
Root `backend`, Build `npm install`, Start `node server.js`. Env: see `backend/.env.example` (`DATABASE_URL`, `JWT_SECRET` 64-char, `FRONTEND_URL`, `MPESA_*`, `AT_*`, `TARIFF_KES_PER_LITRE=0.125`).

### Frontend → Vercel
Root `frontend`, Build `npm run build`, Output `dist`. Env: `VITE_API_URL=https://your-backend.onrender.com`.

### Blockchain (optional, Celo)
```bash
cd blockchain && npm install
cp .env.example .env  # DEPLOYER_PRIVATE_KEY
npx hardhat run scripts/deploy.js --network celo-sepolia
```
Add printed addresses + `CELO_RPC_URL` to backend env. Without it the app runs fully off-chain (`/api/blockchain/status` → `enabled:false`).

## Demo logins (disable seed in prod)
- admin@majismart.ke / admin123
- county@majismart.ke / admin123
- operator@majismart.ke / admin123

## Core API
- `GET /api/health`, `GET /api/config`
- Auth: `POST /api/auth/register|login`, `GET /api/auth/me`
- Water: `/api/nodes`, `/api/sensors`, `/api/gis/assets`, `/api/assets`
- Money: `POST /api/payments/initiate {phone, litres}`, `GET /api/payments/:id/status`, `/api/tokens/recover?phone=`, `POST /api/tokens/redeem`
- Utility: `/api/wasreb/kpis?county=`, `/api/wasreb/water-balance`, `/api/wasreb/vendors`, `/api/estates`
- Ops: `/api/reports-enhanced`, `/api/workorders`, `/api/alerts`, `/api/ai/predictive-maintenance`

## Roadmap to scale
- Daraja production certs + Paybill auto-split (WSP/landlord), token reseller via M-Pesa agents
- LoRa/ultrasonic meter drivers (Dayliff/Mobi-compatible first), pressure-logger ingest
- WASREB WARIS one-click export, rationing calendar from NCWSC notices, SomaMita self-read
- DPA: ODPC registration, Kenya-hosted DB, audit-log UI, consent receipts

> Security: rotate any secret ever committed. Set `MPESA_CALLBACK_SECRET`, strong `JWT_SECRET`, `CORS` allowlist via `FRONTEND_URL`.
