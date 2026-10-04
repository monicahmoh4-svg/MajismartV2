const router = require('express').Router();
const crypto = require('crypto');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { requireRole, requireVerified } = require('../middleware/rbac');
const { logAudit } = require('../services/audit');

const PROVISION_ROLES = ['admin', 'county_officer', 'operator'];

function sha256(s) {
  return crypto.createHash('sha256').update(String(s)).digest('hex');
}

function publicView(d) {
  if (!d) return d;
  const { api_key_hash, ...rest } = d;
  return rest;
}

// GET /api/devices — fleet list (key material never leaves the server)
router.get('/', authMiddleware, requireRole(...PROVISION_ROLES), async (req, res) => {
  try {
    const { status, node_id, limit = 100 } = req.query;
    let sql = `SELECT d.*, n.name as node_name, n.county FROM devices d LEFT JOIN nodes n ON n.id=d.node_id WHERE 1=1`;
    const params = [];
    if (status) { params.push(status); sql += ` AND d.status=$${params.length}`; }
    if (node_id) { params.push(node_id); sql += ` AND d.node_id=$${params.length}`; }
    params.push(Math.min(parseInt(limit) || 100, 500));
    sql += ` ORDER BY d.last_seen DESC NULLS LAST, d.created_at DESC LIMIT $${params.length}`;
    const { rows } = await db.query(sql, params);
    res.json(rows.map(publicView));
  } catch (e) { res.status(500).json({ error: 'Failed to list devices' }); }
});

// POST /api/devices/register — provision a device; api_key shown ONCE
router.post('/register', authMiddleware, requireRole(...PROVISION_ROLES), requireVerified, async (req, res) => {
  try {
    const { device_id, node_id, name, kind, firmware } = req.body;
    if (!device_id || !name) return res.status(400).json({ error: 'device_id and name are required' });
    if (!/^[A-Za-z0-9][A-Za-z0-9-_]{2,60}$/.test(device_id)) {
      return res.status(400).json({ error: 'device_id must be 3-60 chars: letters, digits, - _' });
    }
    const kinds = ['level', 'flow', 'pressure', 'quality', 'meter', 'valve', 'gateway', 'simulator', 'other'];
    if (kind && !kinds.includes(kind)) return res.status(400).json({ error: `kind must be one of ${kinds.join(', ')}` });
    if (node_id) {
      const { rows: n } = await db.query('SELECT id FROM nodes WHERE id=$1', [node_id]);
      if (!n.length) return res.status(404).json({ error: 'node_id not found' });
    }
    const apiKey = 'msk_' + crypto.randomBytes(32).toString('hex');
    try {
      const { rows } = await db.query(
        `INSERT INTO devices (device_id, node_id, name, kind, api_key_hash, firmware)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [device_id.trim(), node_id || null, name, kind || 'level', sha256(apiKey), firmware || null]
      );
      logAudit(req.user.id, 'device.register', 'devices', rows[0].id, { device_id, node_id });
      res.status(201).json({
        ...publicView(rows[0]),
        api_key: apiKey,
        warning: 'Store this key on the device now — it is never shown again. Use Rotate if lost.',
      });
    } catch (e) {
      if (e.code === '23505') return res.status(409).json({ error: 'device_id already registered' });
      throw e;
    }
  } catch (e) { res.status(500).json({ error: 'Failed to register device' }); }
});

// POST /api/devices/:id/rotate — replace a lost/compromised key
router.post('/:id/rotate', authMiddleware, requireRole(...PROVISION_ROLES), requireVerified, async (req, res) => {
  try {
    const apiKey = 'msk_' + crypto.randomBytes(32).toString('hex');
    const { rows } = await db.query(
      `UPDATE devices SET api_key_hash=$1 WHERE id=$2 RETURNING *`, [sha256(apiKey), req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Device not found' });
    logAudit(req.user.id, 'device.key.rotate', 'devices', rows[0].id, { device_id: rows[0].device_id });
    res.json({ ...publicView(rows[0]), api_key: apiKey, warning: 'Old key is revoked effective immediately.' });
  } catch (e) { res.status(500).json({ error: 'Failed to rotate key' }); }
});

// PATCH /api/devices/:id — status/node/config/firmware (never the key)
router.patch('/:id', authMiddleware, requireRole(...PROVISION_ROLES), requireVerified, async (req, res) => {
  try {
    const allowed = ['status', 'node_id', 'firmware', 'config', 'name'];
    const updates = [];
    const params = [];
    for (const f of allowed) {
      if (req.body[f] !== undefined) {
        if (f === 'status' && !['active', 'suspended', 'retired'].includes(req.body[f])) {
          return res.status(400).json({ error: 'invalid status' });
        }
        params.push(f === 'config' ? JSON.stringify(req.body[f]) : req.body[f]);
        updates.push(f === 'config' ? `${f}=$${params.length}::jsonb` : `${f}=$${params.length}`);
      }
    }
    if (!updates.length) return res.status(400).json({ error: 'No fields to update' });
    params.push(req.params.id);
    const { rows } = await db.query(
      `UPDATE devices SET ${updates.join(', ')} WHERE id=$${params.length} RETURNING *`, params);
    if (!rows.length) return res.status(404).json({ error: 'Device not found' });
    logAudit(req.user.id, 'device.update', 'devices', rows[0].id, { fields: updates.map((u) => u.split('=')[0]) });
    res.json(publicView(rows[0]));
  } catch (e) { res.status(500).json({ error: 'Failed to update device' }); }
});

module.exports = router;
