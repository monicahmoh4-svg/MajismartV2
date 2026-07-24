const router = require('express').Router();
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

function safetyLabel(t) {
  if (t === null || t === undefined) return { label: 'Unknown', color: '#9AA0A6', advice: 'No quality data available yet.' };
  if (t <= 4)  return { label: 'Safe to drink',       color: '#0D9E75', advice: 'Water quality meets WHO standards. Safe to drink.' };
  if (t <= 10) return { label: 'Boil before drinking', color: '#E8A020', advice: 'Turbidity is slightly elevated. Boil for 1 minute before drinking.' };
  return       { label: 'Do not drink',              color: '#D93025', advice: 'Water quality is poor. Use bottled water or boil for 5 minutes.' };
}

function availabilityLabel(activePct, crowdAvailable, crowdTotal) {
  let s = activePct >= 0.7 ? 'available' : activePct >= 0.3 ? 'limited' : 'unavailable';
  if (crowdTotal >= 3) {
    const cp = crowdAvailable / crowdTotal;
    s = cp >= 0.6 ? 'available' : cp <= 0.3 ? 'unavailable' : 'limited';
  }
  return { available: { label: 'Water is available', color: '#0D9E75', bg: '#E1F5EE', emoji: '🟢', detail: 'Water supply is running in your area right now.' },
           limited:   { label: 'Limited water supply',color: '#E8A020', bg: '#FEF3D8', emoji: '🟡', detail: 'Some water points are active but supply may be intermittent.' },
           unavailable:{ label: 'No water right now', color: '#D93025', bg: '#FCE8E6', emoji: '🔴', detail: 'Water supply is currently off in your area.' }
         }[s];
}

router.get('/area-status', async (req, res) => {
  try {
    const county = req.query.county;
    if (!county) return res.status(400).json({ error: 'county is required' });
    const [nodesRes, turbRes, crowdRes, alertsRes] = await Promise.all([
      db.query(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status='active') as active, COUNT(*) FILTER (WHERE status='offline') as offline FROM nodes WHERE county=$1`, [county]),
      db.query(`SELECT ROUND(AVG(sr.turbidity)::numeric,2) as avg_turbidity, ROUND(AVG(sr.water_level)::numeric,0) as avg_level FROM sensor_readings sr JOIN nodes n ON n.id=sr.node_id WHERE n.county=$1 AND sr.recorded_at > NOW()-interval '4 hours'`, [county]),
      db.query(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_available=true) as available FROM availability_reports WHERE county=$1 AND created_at > NOW()-interval '6 hours'`, [county]),
      db.query(`SELECT a.message,a.severity,n.name as node_name FROM alerts a JOIN nodes n ON n.id=a.node_id WHERE n.county=$1 AND a.resolved=false ORDER BY a.created_at DESC LIMIT 5`, [county]),
    ]);
    const nodes = nodesRes.rows[0]; const turb = turbRes.rows[0]; const crowd = crowdRes.rows[0];
    const total = parseInt(nodes.total)||0; const active = parseInt(nodes.active)||0;
    const activePct = total > 0 ? active/total : 0;
    const crowdAvail = parseInt(crowd.available)||0; const crowdTotal = parseInt(crowd.total)||0;
    const availability = availabilityLabel(activePct, crowdAvail, crowdTotal);
    const safety = safetyLabel(turb?.avg_turbidity !== null ? Number(turb.avg_turbidity) : null);
    res.json({ county, availability, safety, nodes: { total, active, offline: parseInt(nodes.offline)||0 }, crowd: { total: crowdTotal, available: crowdAvail }, avg_water_level: turb?.avg_level ? Number(turb.avg_level) : null, alerts: alertsRes.rows, updated_at: new Date().toISOString() });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/water-points', async (req, res) => {
  try {
    const { county, lat, lng } = req.query;
    if (!county) return res.status(400).json({ error: 'county is required' });
    const { rows } = await db.query(
      `SELECT DISTINCT ON (n.id) n.id,n.name,n.location,n.county,n.type,n.status,n.latitude,n.longitude,n.capacity_litres,sr.water_level,sr.turbidity,sr.flow_rate,sr.recorded_at as last_reading FROM nodes n LEFT JOIN sensor_readings sr ON sr.node_id=n.id WHERE n.county=$1 ORDER BY n.id,sr.recorded_at DESC`, [county]);
    let points = rows.map(p => {
      let distance_km = null;
      if (lat && lng && p.latitude && p.longitude) {
        const R=6371; const dLat=((p.latitude-lat)*Math.PI)/180; const dLng=((p.longitude-lng)*Math.PI)/180;
        const a=Math.sin(dLat/2)**2+Math.cos((lat*Math.PI)/180)*Math.cos((p.latitude*Math.PI)/180)*Math.sin(dLng/2)**2;
        distance_km=Number((R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))).toFixed(1));
      }
      const level=p.water_level;
      const levelLabel=level===null?'Unknown':level>60?'Plenty of water':level>30?'Water available':level>10?'Running low':'Nearly empty';
      const levelColor=level===null?'#9AA0A6':level>60?'#0D9E75':level>30?'#E8A020':'#D93025';
      return { ...p, distance_km, level_label: levelLabel, level_color: levelColor };
    });
    points.sort((a,b) => {
      if (a.status==='active'&&b.status!=='active') return -1;
      if (b.status==='active'&&a.status!=='active') return 1;
      if (a.distance_km!==null&&b.distance_km!==null) return a.distance_km-b.distance_km;
      return (b.water_level||0)-(a.water_level||0);
    });
    res.json(points);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/availability-report', authMiddleware, async (req, res) => {
  try {
    const { county, area, is_available } = req.body;
    if (!county || is_available === undefined) return res.status(400).json({ error: 'county and is_available are required' });
    await db.query(`INSERT INTO availability_reports (user_id,county,area,is_available) VALUES ($1,$2,$3,$4)`, [req.user.id, county, area||null, !!is_available]);
    res.status(201).json({ message: 'Thank you — your report helps your neighbours!' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/my-spending', authMiddleware, async (req, res) => {
  try {
    const { rows: userRows } = await db.query('SELECT phone FROM users WHERE id=$1', [req.user.id]);
    const phone = userRows[0]?.phone;
    if (!phone) return res.json({ has_data: false, message: 'Add your phone number in Settings to track your water spending.' });
    const [thisMonth, lastMonth, history] = await Promise.all([
      db.query(`SELECT COALESCE(SUM(amount_ksh),0) as total_ksh, COALESCE(SUM(litres),0) as total_litres, COUNT(*) as transactions FROM payments WHERE phone=$1 AND status='completed' AND created_at>=date_trunc('month',NOW())`, [phone]),
      db.query(`SELECT COALESCE(SUM(amount_ksh),0) as total_ksh, COALESCE(SUM(litres),0) as total_litres FROM payments WHERE phone=$1 AND status='completed' AND created_at>=date_trunc('month',NOW()-interval '1 month') AND created_at<date_trunc('month',NOW())`, [phone]),
      db.query(`SELECT p.amount_ksh,p.litres,p.created_at,p.mpesa_code,n.name as node_name,n.county FROM payments p LEFT JOIN nodes n ON n.id=p.node_id WHERE p.phone=$1 AND p.status='completed' ORDER BY p.created_at DESC LIMIT 20`, [phone]),
    ]);
    const tm=thisMonth.rows[0]; const lm=lastMonth.rows[0];
    const totalLitres=Number(tm.total_litres); const totalKsh=Number(tm.total_ksh);
    const costPerLitre=totalLitres>0?(totalKsh/totalLitres).toFixed(2):null;
    const changeVsLast=Number(lm.total_ksh)>0?Math.round(((totalKsh-Number(lm.total_ksh))/Number(lm.total_ksh))*100):null;
    res.json({ has_data: true, this_month: { total_ksh: totalKsh, total_litres: totalLitres, transactions: Number(tm.transactions), cost_per_litre: costPerLitre }, last_month: { total_ksh: Number(lm.total_ksh), total_litres: Number(lm.total_litres) }, change_pct: changeVsLast, history: history.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
