const express = require('express');
const router = express.Router();
const db = require('../db');

// Helper: Calculate predictive risk score (0-100)
function calculateRiskScore(asset) {
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
  
  // Maintenance factor (mocked logic: if no maintenance in 2 years, add risk)
  // In a real system, this would query the maintenance table
  
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

    const predictions = rows.map(asset => {
      const riskScore = calculateRiskScore(asset);
      
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
    });

    // Sort by highest risk first
    predictions.sort((a, b) => b.risk_score - a.risk_score);

    res.json({ predictions });
  } catch (error) {
    console.error('Predictive maintenance error:', error);
    res.status(500).json({ error: 'Failed to fetch predictions', message: error.message });
  }
});

// GET /api/ai/anomalies
router.get('/anomalies', async (req, res) => {
  try {
    // Mock anomaly detection based on typical water utility thresholds
    // In production, this would query the actual IoT readings table
    const anomalies = [
      {
        id: 1,
        asset_name: 'Kibera Sensor Node 1',
        metric: 'Pressure',
        current_value: '12 PSI',
        expected_range: '40-60 PSI',
        severity: 'High',
        detected_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        recommendation: 'Immediate inspection required. Possible pipe burst or major leak.'
      },
      {
        id: 2,
        asset_name: 'Nyali Reservoir',
        metric: 'Water Level',
        current_value: '15%',
        expected_range: '40-90%',
        severity: 'Medium',
        detected_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        recommendation: 'Schedule pump activation or investigate supply line restrictions.'
      },
      {
        id: 3,
        asset_name: 'Kisumu Central Sensor',
        metric: 'Turbidity',
        current_value: '6.5 NTU',
        expected_range: '< 5.0 NTU',
        severity: 'Low',
        detected_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        recommendation: 'Monitor closely. May indicate upstream sediment disturbance.'
      }
    ];

    res.json({ anomalies });
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

    const recommendations = highRiskAssets.map(asset => ({
      id: Math.random().toString(36).substr(2, 9),
      priority: asset.condition === 'critical' ? 'Urgent' : 'High',
      asset_name: asset.name,
      asset_type: asset.type,
      county: asset.county,
      action: asset.condition === 'critical' 
        ? `Immediate replacement recommended for ${asset.name}. Asset has exceeded safe operational limits.`
        : `Schedule preventive maintenance for ${asset.name} within the next 30 days to prevent failure.`,
      estimated_cost_ksh: asset.condition === 'critical' ? 150000 : 45000,
      generated_at: new Date().toISOString()
    }));

    // Add a general optimization recommendation
    recommendations.push({
      id: 'opt-1',
      priority: 'Medium',
      asset_name: 'System-wide',
      asset_type: 'Network',
      county: 'All',
      action: 'Shift non-essential pumping operations to off-peak hours (10 PM - 5 AM) to reduce energy costs by an estimated 15%.',
      estimated_cost_ksh: 0,
      generated_at: new Date().toISOString()
    });

    res.json({ recommendations });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations', message: error.message });
  }
});

module.exports = router;
