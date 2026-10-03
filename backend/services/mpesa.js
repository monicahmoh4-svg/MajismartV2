// M-Pesa Daraja integration with safe simulation fallback.
// Real mode requires: MPESA_CONSUMER_KEY/SECRET, MPESA_SHORTCODE, MPESA_PASSKEY, MPESA_CALLBACK_URL
// In simulation mode we issue a local 20-digit STS-style token immediately.
const db = require('../db');

function isDarajaConfigured() {
  return Boolean(process.env.MPESA_CONSUMER_KEY && process.env.MPESA_CONSUMER_SECRET
    && process.env.MPESA_SHORTCODE && process.env.MPESA_PASSKEY);
}

function mode() {
  if ((process.env.MPESA_MODE || '').toLowerCase() === 'simulation') return 'simulation';
  return isDarajaConfigured() ? 'daraja' : 'simulation';
}

function normalizeKEPhone(phone) {
  if (!phone) return null;
  let p = String(phone).replace(/[\s-]/g, '');
  if (/^0[17]\d{8}$/.test(p)) return '254' + p.slice(1);
  if (/^254[17]\d{8}$/.test(p)) return p;
  if (/^\+254[17]\d{8}$/.test(p)) return p.slice(1);
  return null;
}

// 20-digit numeric token grouped 4-4-4-4-4 (STS-style UX, locally verifiable)
function generateToken() {
  let d = '';
  while (d.length < 20) d += Math.floor(Math.random() * 10);
  return d;
}

async function getAccessToken() {
  const key = process.env.MPESA_CONSUMER_KEY;
  const secret = process.env.MPESA_CONSUMER_SECRET;
  const auth = Buffer.from(`${key}:${secret}`).toString('base64');
  const env = (process.env.MPESA_ENV || 'sandbox').toLowerCase();
  const base = env === 'production' ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke';
  const res = await fetch(`${base}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  if (!res.ok) throw new Error(`Daraja oauth failed: ${res.status}`);
  const data = await res.json();
  return data.access_token;
}

async function stkPush({ phone, amount, accountRef, callbackUrl }) {
  const env = (process.env.MPESA_ENV || 'sandbox').toLowerCase();
  const base = env === 'production' ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke';
  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
  const token = await getAccessToken();
  const res = await fetch(`${base}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: phone,
      PartyB: shortcode,
      PhoneNumber: phone,
      CallBackURL: callbackUrl || process.env.MPESA_CALLBACK_URL,
      AccountReference: (accountRef || 'MAJIWATER').slice(0, 12),
      TransactionDesc: 'MajiSmart water purchase',
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`STK push failed: ${JSON.stringify(data)}`);
  return data; // { CheckoutRequestID, ResponseCode, ... }
}

module.exports = { isDarajaConfigured, mode, normalizeKEPhone, generateToken, stkPush, getAccessToken };
