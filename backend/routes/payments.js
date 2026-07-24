const router = require('express').Router();
const db = require('../db');

// GET /api/payments - list payments
router.get('/', async (req, res) => {
  try {
    const { node_id, status, limit = 50 } = req.query;
    let sql = `
      SELECT p.*, n.name as node_name, n.county
      FROM payments p JOIN nodes n ON n.id=p.node_id
      WHERE 1=1
    `;
    const params = [];
    if (node_id) { params.push(node_id); sql += ` AND p.node_id=$${params.length}`; }
    if (status)  { params.push(status);  sql += ` AND p.status=$${params.length}`; }
    params.push(parseInt(limit));
    sql += ` ORDER BY p.created_at DESC LIMIT $${params.length}`;
    const { rows } = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/payments/initiate - initiate M-Pesa STK push (simulated)
router.post('/initiate', async (req, res) => {
  try {
    const { node_id, phone, litres } = req.body;
    if (!node_id || !phone || !litres) return res.status(400).json({ error: 'Missing fields' });
    const amount = parseFloat((litres * 0.1).toFixed(2));
    const { rows } = await db.query(
      `INSERT INTO payments (node_id,phone,amount_ksh,litres,status) VALUES ($1,$2,$3,$4,'pending') RETURNING *`,
      [node_id, phone, amount, litres]
    );
    const payment = rows[0];

    // In production: call Safaricom Daraja API here
    // Simulating successful payment after 2 seconds
    setTimeout(async () => {
      const mpesaCode = 'QK' + Math.random().toString(36).substr(2,8).toUpperCase();
      await db.query(
        `UPDATE payments SET status='completed', mpesa_code=$1, completed_at=NOW() WHERE id=$2`,
        [mpesaCode, payment.id]
      );
    }, 2000);

    res.json({
      payment_id: payment.id,
      amount_ksh: amount,
      litres,
      phone,
      message: `M-Pesa prompt sent to ${phone}. Pay Ksh ${amount} for ${litres}L.`,
      status: 'pending'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/payments/mpesa-callback - Daraja webhook
router.post('/mpesa-callback', async (req, res) => {
  try {
    const { Body } = req.body;
    if (Body?.stkCallback?.ResultCode === 0) {
      const meta = Body.stkCallback.CallbackMetadata?.Item || [];
      const mpesaCode = meta.find(i => i.Name === 'MpesaReceiptNumber')?.Value;
      const phone = meta.find(i => i.Name === 'PhoneNumber')?.Value?.toString();
      if (phone) {
        await db.query(
          `UPDATE payments SET status='completed', mpesa_code=$1, completed_at=NOW()
           WHERE phone LIKE $2 AND status='pending' ORDER BY created_at DESC LIMIT 1`,
          [mpesaCode, '%' + phone.toString().slice(-9)]
        );
      }
    }
    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (err) {
    res.status(500).json({ ResultCode: 1, ResultDesc: err.message });
  }
});

// GET /api/payments/:id/status
router.get('/:id/status', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM payments WHERE id=$1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Payment not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/payments/stats/summary
router.get('/stats/summary', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT
        COUNT(*) FILTER (WHERE status='completed') as total_transactions,
        COALESCE(SUM(amount_ksh) FILTER (WHERE status='completed'), 0) as total_revenue,
        COALESCE(SUM(litres) FILTER (WHERE status='completed'), 0) as total_litres,
        COUNT(*) FILTER (WHERE status='pending') as pending,
        COUNT(*) FILTER (WHERE created_at > NOW() - interval '24 hours' AND status='completed') as today_transactions
      FROM payments
    `);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
