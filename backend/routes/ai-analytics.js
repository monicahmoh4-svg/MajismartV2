const express = require('express');
const router = express.Router();
const db = require('../db');

// Helper: Calculate predictive risk score (0-100)
async function calculateRiskScore(asset) {
  let score = 20; // Base risk
  
  // Condition factor
  if (asset.condition === 'critical') score += 40;
  else if (asset.condition === 'poor') score += 25;
  else if (asset.condition === 'fair') score += 10;
  
  // Age factor
  if (asset.age_years && asset.expected_lifespan_years) {
    if (asset.age_years >= asset.expected_lifespan_years) score += 20;
    else if (asset.age_years >= asset.expected_lifespan_years * 0.8) score += 10;
  }
  
  // Maintenance history factor: assets with no logged maintenance in 2
  // years carry extra risk (queries asset_maintenance when the table exists).
  try {
    const { rows: stale } = await db.query(`
      SELECT DISTINCT asset_id FROM asset_maintenance
      WHERE performed_at < NOW() - interval '2 years'
    `).catch(() => ({ rows: null }));
    if (stale && asset.id) {
      const ids = new Set(stale.map((r) => String(r.asset_id)));
      if (ids.has(String(asset.id))) score += 10;
    }
  } catch (e) { /* maintenance history unavailable — skip factor */ }
  
  return Math.min(score, 100); // Cap at 100
}

// GET /api/ai/predictive-maintenance
router.get('/predictive-maintenance', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT 
        id, name, type, county, condition, status,
        installation_date, expected_lifespan_years,
        EXTRACT(YEAR FROM AGE(NOW(), installation_date))::INTEGER as age_years
      FROM assets
      WHERE installation_date IS NOT NULL
      ORDER BY id ASC
    `);

    const predictions = await Promise.all(rows.map(async (asset) => {
      const riskScore = await calculateRiskScore(asset);
      
      // Predict failure date: if high risk, predict within 3-6 months
      let predictedFailureDate = null;
      if (riskScore >= 70) {
        const months = riskScore >= 90 ? 3 : 6;
        const date = new Date();
        date.setMonth(date.getMonth() + months);
        predictedFailureDate = date.toISOString().split('T')[0];
      }

      return {
        ...asset,
        risk_score: riskScore,
        risk_level: riskScore >= 80 ? 'Critical' : riskScore >= 60 ? 'High' : riskScore >= 40 ? 'Medium' : 'Low',
        predicted_failure_date: predictedFailureDate
      };
    }));

    // Sort by highest risk first
    predictions.sort((a, b) => b.risk_score - a.risk_score);

    res.json({ predictions });
  } catch (error) {
    console.error('Predictive maintenance error:', error);
    res.status(500).json({ error: 'Failed to fetch predictions', message: error.message });
  }
});

// GET /api/ai/anomalies — computed LIVE from sensor telemetry.
// Explainable rules (WHO/KEBS thresholds + statistical deviation):
//  turbidity > 10 NTU (critical) / > 5 NTU and 2x its 24h mean (warning),
//  tank level < 10% (critical) / < 20% (warning),
//  zero flow on an active node (critical: pump/valve failure),
//  telemetry stale > 6h on a non-offline node (warning: device down).
// Empty { anomalies: [] } with an honest note when there is no recent data —
// never invented sample incidents.
router.get('/anomalies', async (req, res) => {
  try {
    const { rows } = await db.query(`
      WITH latest AS (
        SELECT DISTINCT ON (node_id) node_id, water_level, flow_rate,
               turbidity, temperature, recorded_at
        FROM sensor_readings ORDER BY node_id, recorded_at DESC
      ), avg24 AS (
        SELECT node_id, AVG(turbidity) AS avg_turbidity
        FROM sensor_readings
        WHERE recorded_at > NOW() - interval '24 hours'
        GROUP BY node_id
      )
      SELECT n.id, n.name, n.county, n.status, n.type,
             l.water_level, l.flow_rate, l.turbidity, l.temperature, l.recorded_at,
             a.avg_turbidity
      FROM nodes n LEFT JOIN latest l ON l.node_id = n.id
                   LEFT JOIN avg24 a ON a.node_id = n.id
    `);

    const anomalies = [];
    const hoursSince = (ts) => ts ? (Date.now() - new Date(ts).getTime()) / 3600000 : Infinity;
    for (const n of rows) {
      const at = (metric, current, expected, severity, why) =>
        anomalies.push({
          id: `${n.id}-${metric}`,
          asset_name: n.name,
          county: n.county,
          metric,
          current_value: current,
          expected_range: expected,
          severity,
          detected_at: n.recorded_at || new Date().toISOString(),
          recommendation: why,
          basis: 'live sensor telemetry (last 24h)',
        });
      if (n.turbidity != null && Number(n.turbidity) > 10) {
        at('Turbidity', `${n.turbidity} NTU`, '< 5.0 NTU', 'High',
          'Turbidity above the 10 NTU action limit. Inspect upstream intake for sediment or contamination and consider treatment before distribution.');
      } else if (n.turbidity != null && Number(n.turbidity) > 5 &&
                 (n.avg_turbidity == null || Number(n.turbidity) > Number(n.avg_turbidity) * 2)) {
        at('Turbidity', `${n.turbidity} NTU`, '< 5.0 NTU', 'Medium',
          'Turbidity above the 5 NTU guideline and double its 24h mean. Monitor closely; check for upstream disturbance.');
      }
      if (n.water_level != null && Number(n.water_level) < 10) {
        at('Water Level', `${n.water_level}%`, '20-100%', 'High',
          'Storage nearly empty. Trigger refill/pumping immediately to avoid dry taps.');
      } else if (n.water_level != null && Number(n.water_level) < 20) {
        at('Water Level', `${n.water_level}%`, '20-100%', 'Medium',
          'Storage below the 20% refill threshold. Schedule pumping.');
      }
      if (n.flow_rate != null && Number(n.flow_rate) === 0 && n.status === 'active') {
        at('Flow', '0 L/min', '> 0 L/min while active', 'High',
          'Zero flow on an active point suggests pump failure or a closed/burst valve. Dispatch a technician.');
      }
      if (n.status !== 'offline' && hoursSince(n.recorded_at) > 6) {
        at('Telemetry', n.recorded_at ? `${Math.round(hoursSince(n.recorded_at))}h stale` : 'no readings', '< 6h fresh', 'Medium',
          'No telemetry for over 6 hours. Check device power, solar/battery and GSM signal.');
      }
    }

    const hasTelemetry = rows.some((n) => n.recorded_at);
    res.json({
      anomalies,
      source: 'live',
      generated_at: new Date().toISOString(),
      ...(hasTelemetry ? {} : { note: 'No sensor readings in the database yet — connect a device (see IOT.md) to enable live detection.' }),
    });
  } catch (error) {
    console.error('Anomaly detection error:', error);
    res.status(500).json({ error: 'Failed to fetch anomalies', message: error.message });
  }
});

// GET /api/ai/recommendations
router.get('/recommendations', async (req, res) => {
  try {
    const { rows: highRiskAssets } = await db.query(`
      SELECT name, type, county, condition, expected_lifespan_years,
             EXTRACT(YEAR FROM AGE(NOW(), installation_date))::INTEGER as age_years
      FROM assets
      WHERE condition IN ('poor', 'critical')
      LIMIT 5
    `);

    const recommendations = highRiskAssets.map((asset, i) => ({
      id: `rec-${asset.name}-${i}`.toLowerCase().replace(/[^a-z0-9-]+/g, '-'),
      priority: asset.condition === 'critical' ? 'Urgent' : 'High',
      asset_name: asset.name,
      asset_type: asset.type,
      county: asset.county,
      action: asset.condition === 'critical'
        ? `Immediate replacement recommended for ${asset.name}. Asset has exceeded safe operational limits.`
        : `Schedule preventive maintenance for ${asset.name} within the next 30 days to prevent failure.`,
      // Indicative planning figure, NOT a quote — confirm against county procurement.
      estimated_cost_ksh: asset.condition === 'critical' ? 150000 : 45000,
      cost_basis: 'indicative estimate — confirm against county procurement rates',
      generated_at: new Date().toISOString()
    }));

    // General operational practice (no invented savings percentage).
    recommendations.push({
      id: 'opt-offpeak',
      priority: 'Medium',
      asset_name: 'System-wide',
      asset_type: 'Network',
      county: 'All',
      action: 'Consider shifting non-essential pumping to off-peak night hours to cut energy bills.',
      estimated_cost_ksh: 0,
      cost_basis: 'operational practice, savings vary by tariff',
      generated_at: new Date().toISOString()
    });

    res.json({ recommendations });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations', message: error.message });
  }
});

module.exports = router;
