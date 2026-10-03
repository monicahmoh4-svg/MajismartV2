const router = require('express').Router();
const db = require('../db');

// Prepaid STS-style tokens: validate / redeem / recover last-5.
router.get('/recover', async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) return res.status(400).json({ error: 'phone required' });
    const suffix = String(phone).slice(-9);
    const { rows } = await db.query(
      `SELECT token, litres, amount_ksh, status, created_at FROM prepaid_tokens WHERE phone LIKE $1 ORDER BY created_at DESC LIMIT 5`,
      [`%${suffix}`]);
    res.json(rows.map((r) => ({ ...r, token_formatted: String(r.token).match(/.{1,4}/g)?.join('-') })));
  } catch (e) { res.status(500).json({ error: 'Failed to recover tokens' }); }
});

router.post('/redeem', async (req, res) => {
  try {
    const { token, meter_no } = req.body;
    if (!token) return res.status(400).json({ error: 'token required' });
    const clean = String(token).replace(/[^0-9]/g, '');
    const { rows } = await db.query('SELECT * FROM prepaid_tokens WHERE token=$1', [clean]);
    if (!rows.length) return res.status(404).json({ error: 'Invalid token' });
    if (rows[0].status === 'redeemed') return res.status(409).json({ error: 'Token already redeemed' });
    await db.query(`UPDATE prepaid_tokens SET status='redeemed', redeemed_at=NOW() WHERE token=$1`, [clean]);
    if (meter_no) {
      await db.query(`UPDATE estate_units SET balance_litres = COALESCE(balance_litres,0) + $1 WHERE meter_no=$2`, [rows[0].litres, meter_no]).catch(() => {});
    }
    res.json({ message: `Loaded ${rows[0].litres}L`, litres: rows[0].litres });
  } catch (e) { res.status(500).json({ error: 'Failed to redeem token' }); }
});

module.exports = router;
