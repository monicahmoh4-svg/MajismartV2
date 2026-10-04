const router = require('express').Router();
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { requireRole, requireVerified } = require('../middleware/rbac');
const { logAudit } = require('../services/audit');

const STAFF = ['admin', 'county_officer', 'operator', 'technician'];

// Default service fees (KES) — the county adjusts per work order via payout.
// These are starting points, shown to the citizen before confirming.
const SERVICE_FEES = {
  leak_repair: 1500,
  meter_issue: 800,
  new_connection: 2500,
  quality_test: 500,
  other: 500,
};

const CATEGORIES = Object.keys(SERVICE_FEES);

function haversineKm(aLat, aLng, bLat, bLng) {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) *
      Math.cos((bLat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// GIS + availability matching: nearest VERIFIED field staff in the county
// with live coords, ranked by (distance, open workload). Staff without
// coords or over capacity are skipped — never fake-matched.
async function matchTechnician({ county, lat, lng }) {
  const { rows: staff } = await db.query(
    `SELECT id, name, email, phone, role, county, base_latitude, base_longitude
     FROM users
     WHERE role IN ('technician','operator')
       AND (kyc_status IS NULL OR kyc_status = 'verified')
       AND county = $1
       AND base_latitude IS NOT NULL AND base_longitude IS NOT NULL`,
    [county]
  );
  if (!staff.length) return { match: null, reason: 'no verified staff with base location in county' };
  const { rows: load } = await db.query(
    `SELECT assigned_to, COUNT(*) FILTER (WHERE status IN ('open','pending','assigned','in_progress')) as open_jobs
     FROM work_orders WHERE assigned_to IS NOT NULL GROUP BY assigned_to`
  );
  const openByName = {};
  for (const r of load) openByName[String(r.assigned_to).toLowerCase()] = parseInt(r.open_jobs) || 0;

  const ranked = staff
    .map((s) => {
      const dist =
        lat != null && lng != null
          ? haversineKm(Number(lat), Number(lng), Number(s.base_latitude), Number(s.base_longitude))
          : null;
      const open = openByName[(s.name || '').toLowerCase()] ?? openByName[(s.email || '').toLowerCase()] ?? 0;
      return { ...s, distance_km: dist != null ? Math.round(dist * 10) / 10 : null, open_jobs: open };
    })
    .filter((s) => s.open_jobs < 10)
    .sort((a, b) => {
      if (a.distance_km != null && b.distance_km != null && Math.abs(a.distance_km - b.distance_km) > 2) {
        return a.distance_km - b.distance_km;
      }
      return a.open_jobs - b.open_jobs;
    });
  if (!ranked.length) return { match: null, reason: 'all nearby staff at capacity' };
  return { match: ranked[0], reason: null };
}

// POST /api/services/request — citizen requests a service (geolocated)
router.post('/request', authMiddleware, async (req, res) => {
  try {
    const { category, description, latitude, longitude, area, county } = req.body || {};
    if (!CATEGORIES.includes(category)) {
      return res.status(400).json({ error: `category must be one of ${CATEGORIES.join(', ')}` });
    }
    if (!description || String(description).trim().length < 10) {
      return res.status(400).json({ error: 'Please describe the problem (min 10 characters)' });
    }
    const lat = latitude != null && latitude !== '' ? Number(latitude) : null;
    const lng = longitude != null && longitude !== '' ? Number(longitude) : null;
    if ((lat != null && (!Number.isFinite(lat) || Math.abs(lat) > 90)) ||
        (lng != null && (!Number.isFinite(lng) || Math.abs(lng) > 180))) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }
    const userCounty = county || req.user.county;
    if (!userCounty) return res.status(400).json({ error: 'county is required' });

    const { rows: sr } = await db.query(
      `INSERT INTO service_requests
         (citizen_id, category, description, latitude, longitude, area, county, fee_ksh)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.user.id, category, String(description).trim().slice(0, 2000),
        lat, lng, area || null, userCounty, SERVICE_FEES[category]]
    );
    const request = sr[0];

    // Dispatch: match + create linked work order, or queue for the county.
    const { match, reason } = await matchTechnician({ county: userCounty, lat, lng });
    if (match) {
      const woNumber = `WO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      try {
        await db.query(
          `INSERT INTO work_orders
             (wo_number, title, description, source_type, source_id, assigned_to,
              status, priority, location, created_by, assigned_at, payout_ksh)
           VALUES ($1,$2,$3,'service_request',$4,$5,'assigned','high',$6,$7,NOW(),$8)`,
          [woNumber,
            `${category.replace(/_/g, ' ')} — ${request.area || userCounty}`,
            `${request.description} (service request ${request.id})`,
            request.id, match.name,
            [request.area, userCounty].filter(Boolean).join(', '),
            req.user.name || req.user.email,
            SERVICE_FEES[category]]
        );
      } catch (e) {
        console.warn('linked work order skipped:', e.message);
      }
      await db.query(
        `UPDATE service_requests SET status='assigned', assigned_to=$1, assigned_name=$2,
          distance_km=$3, updated_at=NOW() WHERE id=$4`,
        [match.id, match.name, match.distance_km, request.id]
      );
      logAudit(req.user.id, 'service.request.dispatched', 'service_requests', request.id,
        { tech: match.id, distance_km: match.distance_km });
      return res.status(201).json({
        ...request,
        status: 'assigned',
        assigned_to: match.id,
        assigned_name: match.name,
        distance_km: match.distance_km,
        message: `${match.name} (${match.role}) is ${match.distance_km != null ? match.distance_km + ' km away' : 'nearby'} and has your job.`,
      });
    }

    logAudit(req.user.id, 'service.request.queued', 'service_requests', request.id, { reason });
    return res.status(201).json({
      ...request,
      message: 'Request received. No verified technician is currently available — the county office will assign one shortly.',
    });
  } catch (e) {
    console.error('service request failed:', e.message);
    res.status(500).json({ error: 'Failed to submit service request' });
  }
});

// GET /api/services/mine — citizen's own requests with status + assignee
router.get('/mine', authMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT sr.*, u.phone as tech_phone
       FROM service_requests sr LEFT JOIN users u ON u.id = sr.assigned_to
       WHERE sr.citizen_id = $1 ORDER BY sr.created_at DESC LIMIT 50`,
      [req.user.id]
    );
    res.json(rows.map((r) => {
      const { tech_phone, ...rest } = r;
      // Privacy: share contact only once a tech is actively on the job.
      return ['assigned', 'in_progress'].includes(r.status) && tech_phone
        ? { ...rest, tech_contact: tech_phone.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2') }
        : rest;
    }));
  } catch (e) { res.status(500).json({ error: 'Failed to fetch requests' }); }
});

// GET /api/services/assigned — field staff: jobs dispatched to me
router.get('/assigned', authMiddleware, requireRole('admin', 'county_officer', 'operator', 'technician'), async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT sr.*, u.name as citizen_name
       FROM service_requests sr LEFT JOIN users u ON u.id = sr.citizen_id
       WHERE sr.assigned_to = $1 ORDER BY sr.created_at DESC LIMIT 100`,
      [req.user.id]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: 'Failed to fetch assigned jobs' }); }
});

// GET /api/services/queue — county/admin: unassigned + county queue
router.get('/queue', authMiddleware, requireRole('admin', 'county_officer'), async (req, res) => {
  try {
    const { county, status } = req.query;
    let sql = `SELECT sr.*, u.name as citizen_name FROM service_requests sr LEFT JOIN users u ON u.id=sr.citizen_id WHERE 1=1`;
    const params = [];
    if (county) { params.push(county); sql += ` AND sr.county=$${params.length}`; }
    if (status) { params.push(status); sql += ` AND sr.status=$${params.length}`; }
    sql += ` ORDER BY sr.created_at DESC LIMIT 200`;
    const { rows } = await db.query(sql, params);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: 'Failed to fetch queue' }); }
});

// PATCH /api/services/:id/status — assignee/county advance the job
router.patch('/:id/status', authMiddleware, requireRole('admin', 'county_officer', 'operator', 'technician'), requireVerified, async (req, res) => {
  try {
    const { status } = req.body || {};
    if (!['assigned', 'in_progress', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const { rows: found } = await db.query('SELECT * FROM service_requests WHERE id=$1', [req.params.id]);
    if (!found.length) return res.status(404).json({ error: 'Request not found' });
    const { normalizeRole } = require('../middleware/auth');
    const role = normalizeRole(req.user.role);
    const isAssignee = found[0].assigned_to === req.user.id;
    const isStaff = ['super_admin', 'county_admin'].includes(role);
    if (!isAssignee && !isStaff) {
      return res.status(403).json({ error: 'Only the assigned technician or county staff can update this job' });
    }
    const { rows } = await db.query(
      `UPDATE service_requests SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *`,
      [status, req.params.id]
    );
    logAudit(req.user.id, 'service.status.update', 'service_requests', rows[0].id, { status });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: 'Failed to update request' }); }
});

// GET /api/services/fees — public price list for service categories
router.get('/fees', (req, res) => {
  res.json({ fees: SERVICE_FEES, currency: 'KES', note: 'Indicative starting points — county-confirmed rates apply. Citizen requests are free during the pilot.' });
});

module.exports = router;
