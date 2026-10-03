const router = require('express').Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// Estates = landlords / property managers (P1 beachhead).
// Minimal viable: estates -> units -> billing via M-Pesa + prepaid tokens.
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT e.*, COUNT(u.id) as units,
        COALESCE(SUM(u.arrears_ksh),0) as arrears_total
      FROM estates e LEFT JOIN estate_units u ON u.estate_id=e.id
      GROUP BY e.id ORDER BY e.created_at DESC LIMIT 100`);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: 'Failed to fetch estates' }); }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, county, paybill, tariff_ksh_per_m3 } = req.body;
    if (!name || !county) return res.status(400).json({ error: 'name and county required' });
    const { rows } = await db.query(
      `INSERT INTO estates (name,county,manager_id,paybill,tariff_ksh_per_m3) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [name, county, req.user.id, paybill || null, tariff_ksh_per_m3 || 105]);
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: 'Failed to create estate' }); }
});

router.get('/:id/units', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM estate_units WHERE estate_id=$1 ORDER BY unit_no', [req.params.id]);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: 'Failed to fetch units' }); }
});

router.post('/:id/units', authenticateToken, async (req, res) => {
  try {
    const { unit_no, tenant_name, tenant_phone, meter_no } = req.body;
    if (!unit_no) return res.status(400).json({ error: 'unit_no required' });
    const { rows } = await db.query(
      `INSERT INTO estate_units (estate_id,unit_no,tenant_name,tenant_phone,meter_no) VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (estate_id, unit_no) DO UPDATE SET tenant_name=EXCLUDED.tenant_name, tenant_phone=EXCLUDED.tenant_phone, meter_no=EXCLUDED.meter_no
       RETURNING *`,
      [req.params.id, unit_no, tenant_name || null, tenant_phone || null, meter_no || null]);
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: 'Failed to upsert unit' }); }
});

module.exports = router;
