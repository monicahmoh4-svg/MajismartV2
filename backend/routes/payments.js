const router = require('express').Router();
const db = require('../db');
const { mode, normalizeKEPhone, generateToken, stkPush } = require('../services/mpesa');
const { sendSms } = require('../services/sms');

// Kenya tariff: ~KES 105/m3 billed => KES 0.105/litre. Keep flat for prepaid simplicity.
const KES_PER_LITRE = parseFloat(process.env.TARIFF_KES_PER_LITRE || '2.5') / 20; // default KES 2.50 per 20L

router.get('/', async (req, res) => {
  try {
    const { node_id, status, limit = 50 } = req.query;
    const lim = Math.min(Math.max(parseInt(limit) || 50, 1), 200);
    let sql = `SELECT p.*, n.name as node_name, n.county FROM payments p LEFT JOIN nodes n ON n.id=p.node_id WHERE 1=1`;
    const params = [];
    if (node_id) { params.push(node_id); sql += ` AND p.node_id=$${params.length}`; }
    if (status) { params.push(status); sql += ` AND p.status=$${params.length}`; }
    params.push(lim);
    sql += ` ORDER BY p.created_at DESC LIMIT $${params.length}`;
    const { rows } = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// POST /api/payments/initiate { phone, litres, node_id?, meter_no?, estate_id? }
router.post('/initiate', async (req, res) => {
  try {
    const { node_id, phone, litres, meter_no, estate_id } = req.body;
    const phone254 = normalizeKEPhone(phone);
    const L = parseInt(litres);
    if (!phone254) return res.status(400).json({ error: 'Invalid Safaricom phone. Use 07XXXXXXXX or 2547XXXXXXXX' });
    if (!L || L < 1 || L > 5000) return res.status(400).json({ error: 'Litres must be 1-5000' });
    const amount = parseFloat((L * (parseFloat(process.env.TARIFF_KES_PER_LITRE || '0.125'))).toFixed(2));
    // NOTE: tariff env is KES per litre; default 0.125 => KES 2.50 per 20L jerrican
    void KES_PER_LITRE;

    const { rows } = await db.query(
      `INSERT INTO payments (node_id,phone,amount_ksh,litres,status) VALUES ($1,$2,$3,$4,'pending') RETURNING *`,
      [node_id || null, phone254, amount, L]
    );
    const payment = rows[0];

    if (mode() === 'daraja') {
      try {
        const stk = await stkPush({ phone: phone254, amount, accountRef: `MAJI-${String(payment.id).slice(0, 8)}` });
        await db.query(`UPDATE payments SET mpesa_code=$1 WHERE id=$2`, [stk.CheckoutRequestID || null, payment.id]);
        return res.json({ payment_id: payment.id, amount_ksh: amount, litres: L, phone: phone254, mode: 'daraja', checkoutRequestID: stk.CheckoutRequestID, message: `M-Pesa STK sent to ${phone}. Enter PIN to pay Ksh ${amount}.` });
      } catch (e) {
        console.error('Daraja STK failed, falling back to token hold:', e.message);
      }
    }

    // Simulation / offline-capable: issue STS-style token immediately, mark completed for demo revenue
    const token = generateToken();
    const mpesaCode = 'SIM' + Math.random().toString(36).slice(2, 10).toUpperCase();
    await db.query(`UPDATE payments SET status='completed', mpesa_code=$1, completed_at=NOW() WHERE id=$2`, [mpesaCode, payment.id]);
    await db.query(`INSERT INTO prepaid_tokens (payment_id, meter_no, phone, litres, amount_ksh, token, status) VALUES ($1,$2,$3,$4,$5,$6,'issued')`,
      [payment.id, meter_no || null, phone254, L, amount, token]);
    try { await sendSms(phone254, `MajiSmart: Ksh ${amount} for ${L}L received. Token: ${token.match(/.{1,4}/g).join('-')}. Dial *384*99# for help.`); } catch (e) { /* log-only */ }
    void estate_id;
    return res.json({ payment_id: payment.id, amount_ksh: amount, litres: L, phone: phone254, mode: 'simulation', token, token_formatted: token.match(/.{1,4}/g).join('-'), message: `Simulated M-Pesa confirmed. Token for ${L}L: ${token}` });
  } catch (err) {
    console.error('initiate failed:', err.message);
    res.status(500).json({ error: 'Failed to initiate payment' });
  }
});

// Secure Daraja callback: requires secret query param (?secret=MPESA_CALLBACK_SECRET) when set
router.post('/mpesa-callback', async (req, res) => {
  try {
    const required = process.env.MPESA_CALLBACK_SECRET;
    if (required && req.query.secret !== required) {
      return res.status(401).json({ ResultCode: 1, ResultDesc: 'Unauthorized' });
    }
    const cb = req.body?.Body?.stkCallback;
    if (!cb) return res.json({ ResultCode: 0, ResultDesc: 'Ignored' });
    if (cb.ResultCode === 0) {
      const items = cb.CallbackMetadata?.Item || [];
      const get = (n) => items.find((i) => i.Name === n)?.Value;
      const receipt = get('MpesaReceiptNumber');
      const phoneRaw = get('PhoneNumber')?.toString();
      const checkoutId = cb.CheckoutRequestID;
      // Prefer exact checkout match, fallback to latest pending for phone
      let updated = 0;
      if (checkoutId) {
        const r = await db.query(`UPDATE payments SET status='completed', mpesa_code=$1, completed_at=NOW() WHERE mpesa_code=$2 AND status='pending'`, [receipt || checkoutId, checkoutId]);
        updated = r.rowCount;
      }
      if (!updated && phoneRaw) {
        const suffix = phoneRaw.slice(-9);
        await db.query(
          `UPDATE payments SET status='completed', mpesa_code=$1, completed_at=NOW() WHERE id=(SELECT id FROM payments WHERE phone LIKE $2 AND status='pending' ORDER BY created_at DESC LIMIT 1)`,
          [receipt || checkoutId || 'UNKNOWN', `%${suffix}`]
        );
      }
      if (receipt && phoneRaw) {
        const token = generateToken();
        await db.query(`INSERT INTO prepaid_tokens (phone, litres, amount_ksh, token, status) VALUES ($1,$2,$3,$4,'issued')`, [phoneRaw, 20, 2.5, token]).catch(() => {});
      }
    } else {
      // mark most recent daraja attempt failed (best effort, no PII leak in logs)
      console.warn('STK failed:', cb.ResultCode, cb.ResultDesc);
    }
    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (err) {
    console.error('callback error:', err.message);
    res.status(500).json({ ResultCode: 1, ResultDesc: 'Failed' });
  }
});

router.get('/:id/status', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM payments WHERE id=$1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Payment not found' });
    const { rows: toks } = await db.query('SELECT token, status, litres FROM prepaid_tokens WHERE payment_id=$1 ORDER BY created_at DESC LIMIT 1', [req.params.id]);
    res.json({ ...rows[0], token: toks[0]?.token || null });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payment' });
  }
});

router.get('/stats/summary', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT COUNT(*) FILTER (WHERE status='completed') as total_transactions,
        COALESCE(SUM(amount_ksh) FILTER (WHERE status='completed'), 0) as total_revenue,
        COALESCE(SUM(litres) FILTER (WHERE status='completed'), 0) as total_litres,
        COUNT(*) FILTER (WHERE status='pending') as pending,
        COUNT(*) FILTER (WHERE created_at > NOW() - interval '24 hours' AND status='completed') as today_transactions
      FROM payments`);
    res.json({ ...rows[0], mpesa_mode: mode() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
