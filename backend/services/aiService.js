const db = require('../db');
function mean(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
function stdDev(arr) {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  const variance = mean(arr.map(x => (x - m) ** 2));
  return Math.sqrt(variance);
}
function linearRegression(points) {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: points[0]?.y || 0 };
  const sumX = points.reduce((a, p) => a + p.x, 0);
  const sumY = points.reduce((a, p) => a + p.y, 0);
  const sumXY = points.reduce((a, p) => a + p.x * p.y, 0);
  const sumXX = points.reduce((a, p) => a + p.x * p.x, 0);
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return { slope: 0, intercept: sumY / n };
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}
async function detectLeak(nodeId) {
  const { rows } = await db.query(
    `SELECT water_level, flow_rate, recorded_at FROM sensor_readings
     WHERE node_id=$1 ORDER BY recorded_at DESC LIMIT 30`,
    [nodeId]
  );
  if (rows.length < 6) {
    return { node_id: nodeId, leak_probability: 0, status: 'insufficient_data', evidence: [] };
  }
  const ordered = rows.slice().reverse();
  const levels = ordered.map(r => r.water_level).filter(v => v !== null);
  const flows = ordered.map(r => r.flow_rate).filter(v => v !== null);
  const levelDrop = levels.length > 1 ? levels[0] - levels[levels.length - 1] : 0;
  const avgFlow = mean(flows);
  const sustainedFlow = flows.filter(f => f > 0.5).length / Math.max(flows.length, 1);
  const { rows: paymentRows } = await db.query(
    `SELECT COUNT(*) as cnt FROM payments
     WHERE node_id=$1 AND status='completed' AND created_at > NOW() - interval '6 hours'`,
    [nodeId]
  );
  const recentPayments = parseInt(paymentRows[0]?.cnt || 0);
  let score = 0;
  const evidence = [];
  if (levelDrop > 15) { score += 35; evidence.push(`Water level dropped ${levelDrop.toFixed(0)}% over recent readings`); }
  if (avgFlow > 3) { score += 25; evidence.push(`Average flow rate of ${avgFlow.toFixed(1)} L/min is unusually sustained`); }
  if (sustainedFlow > 0.7) { score += 20; evidence.push('Flow has been continuous rather than intermittent'); }
  if (recentPayments === 0 && avgFlow > 1) { score += 20; evidence.push('No completed payments correlate with this water usage'); }
  score = Math.min(score, 100);
  return {
    node_id: nodeId,
    leak_probability: score,
    status: score >= 60 ? 'likely_leak' : score >= 30 ? 'possible_leak' : 'normal',
    evidence,
    metrics: { level_drop_pct: levelDrop, avg_flow_lpm: avgFlow, recent_payments: recentPayments }
  };
}
async function detectLeaksSystemWide() {
  const { rows: nodes } = await db.query(`SELECT id, name, county FROM nodes WHERE status != 'offline'`);
  const results = [];
  for (const node of nodes) {
    const result = await detectLeak(node.id);
    if (result.leak_probability >= 30) {
      results.push({ ...result, node_name: node.name, county: node.county });
    }
  }
  return results.sort((a, b) => b.leak_probability - a.leak_probability);
}
async function forecastConsumption(nodeId, daysAhead = 7) {
  const { rows } = await db.query(
    `SELECT DATE(created_at) as date, COALESCE(SUM(litres),0) as litres
     FROM payments
     WHERE node_id=$1 AND status='completed' AND created_at > NOW() - interval '30 days'
     GROUP BY DATE(created_at) ORDER BY date ASC`,
    [nodeId]
  );
  if (rows.length < 3) {
    return { node_id: nodeId, forecast: [], confidence: 'low', message: 'Not enough payment history to forecast yet' };
  }
  const points = rows.map((r, i) => ({ x: i, y: Number(r.litres) }));
  const { slope, intercept } = linearRegression(points);
  const lastX = points.length - 1;
  const historicalAvg = mean(points.map(p => p.y));
  const forecast = [];
  for (let i = 1; i <= daysAhead; i++) {
    const x = lastX + i;
    let predicted = slope * x + intercept;
    predicted = Math.max(0, predicted);
    const date = new Date();
    date.setDate(date.getDate() + i);
    forecast.push({ date: date.toISOString().slice(0, 10), predicted_litres: Math.round(predicted) });
  }
  const trend = slope > 0.5 ? 'rising' : slope < -0.5 ? 'falling' : 'stable';
  const confidence = rows.length >= 14 ? 'high' : rows.length >= 7 ? 'medium' : 'low';
  return {
    node_id: nodeId,
    forecast,
    trend,
    confidence,
    historical_daily_avg: Math.round(historicalAvg)
  };
}
async function detectAnomalies(nodeId) {
  const { rows } = await db.query(
    `SELECT water_level, flow_rate, turbidity, temperature, recorded_at
     FROM sensor_readings WHERE node_id=$1
     ORDER BY recorded_at DESC LIMIT 50`,
    [nodeId]
  );
  if (rows.length < 8) return { node_id: nodeId, anomalies: [], status: 'insufficient_data' };
  const ordered = rows.slice().reverse();
  const metrics = ['flow_rate', 'turbidity', 'temperature', 'water_level'];
  const anomalies = [];
  for (const metric of metrics) {
    const values = ordered.map(r => r[metric]).filter(v => v !== null && v !== undefined);
    if (values.length < 8) continue;
    const m = mean(values);
    const sd = stdDev(values);
    if (sd === 0) continue;
    const latest = values[values.length - 1];
    const zScore = (latest - m) / sd;
    if (Math.abs(zScore) > 2.5) {
      anomalies.push({
        metric,
        latest_value: latest,
        baseline_avg: Number(m.toFixed(2)),
        z_score: Number(zScore.toFixed(2)),
        direction: zScore > 0 ? 'above_normal' : 'below_normal'
      });
    }
  }
  return { node_id: nodeId, anomalies, status: anomalies.length ? 'anomalies_found' : 'normal' };
}
async function getRecommendations(nodeId) {
  const [leak, anomalies, nodeRows] = await Promise.all([
    detectLeak(nodeId),
    detectAnomalies(nodeId),
    db.query(`SELECT * FROM nodes WHERE id=$1`, [nodeId])
  ]);
  const node = nodeRows.rows[0];
  const recommendations = [];
  if (leak.leak_probability >= 60) {
    recommendations.push({
      priority: 'critical',
      title: 'Possible leak detected',
      detail: `Dispatch a technician to inspect ${node?.name || 'this node'} for leaks. ${leak.evidence.join('. ')}.`
    });
  } else if (leak.leak_probability >= 30) {
    recommendations.push({
      priority: 'warning',
      title: 'Monitor for leak risk',
      detail: `Usage pattern looks unusual but isn't conclusive yet. Re-check in a few hours.`
    });
  }
  for (const a of anomalies.anomalies) {
    if (a.metric === 'turbidity' && a.direction === 'above_normal') {
      recommendations.push({
        priority: 'warning',
        title: 'Water quality check needed',
        detail: `Turbidity is ${a.latest_value} (baseline ${a.baseline_avg}) — consider a filter inspection.`
      });
    }
    if (a.metric === 'flow_rate' && a.direction === 'below_normal') {
      recommendations.push({
        priority: 'warning',
        title: 'Reduced flow detected',
        detail: `Flow rate dropped well below normal — check pump or blockage.`
      });
    }
  }
  if (node?.status === 'offline') {
    recommendations.push({
      priority: 'critical',
      title: 'Node offline',
      detail: 'This node has not reported in. Verify power, connectivity, or GSM signal.'
    });
  }
  if (recommendations.length === 0) {
    recommendations.push({ priority: 'info', title: 'All systems normal', detail: 'No action needed right now.' });
  }
  return { node_id: nodeId, recommendations };
}
async function systemInsights() {
  const [leaks, revenueRows, nodeRows] = await Promise.all([
    detectLeaksSystemWide(),
    db.query(`
      SELECT DATE(created_at) as date, COALESCE(SUM(amount_ksh),0) as revenue
      FROM payments WHERE status='completed' AND created_at > NOW() - interval '14 days'
      GROUP BY DATE(created_at) ORDER BY date ASC`),
    db.query(`SELECT id, name, county FROM nodes`)
  ]);
  const points = revenueRows.rows.map((r, i) => ({ x: i, y: Number(r.revenue) }));
  const { slope, intercept } = linearRegression(points);
  const lastX = points.length - 1;
  const revenueForecast = [];
  for (let i = 1; i <= 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    revenueForecast.push({
      date: date.toISOString().slice(0, 10),
      predicted_revenue: Math.max(0, Math.round(slope * (lastX + i) + intercept))
    });
  }
  return {
    leak_risks: leaks.slice(0, 5),
    total_nodes_at_risk: leaks.length,
    revenue_forecast_7d: revenueForecast,
    total_nodes: nodeRows.rows.length,
    generated_at: new Date().toISOString()
  };
}
async function chatAssistant(message) {
  const lower = message.toLowerCase();
  const [summary, openAlerts, leaks] = await Promise.all([
    db.query(`SELECT
        (SELECT COUNT(*) FROM nodes) as total_nodes,
        (SELECT COUNT(*) FROM nodes WHERE status='offline') as offline_nodes,
        (SELECT COALESCE(SUM(amount_ksh),0) FROM payments WHERE status='completed' AND created_at > NOW()-interval '24h') as today_revenue
    `),
    db.query(`SELECT a.message, a.severity, n.name as node_name FROM alerts a JOIN nodes n ON n.id=a.node_id WHERE a.resolved=false ORDER BY a.created_at DESC LIMIT 5`),
    detectLeaksSystemWide()
  ]);
  const s = summary.rows[0];
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const contextBlock = `
Live system snapshot:
- Total nodes: ${s.total_nodes}, offline: ${s.offline_nodes}
- Revenue today: Ksh ${s.today_revenue}
- Open alerts: ${openAlerts.rows.map(a => `${a.node_name}: ${a.message} (${a.severity})`).join('; ') || 'none'}
- Possible leaks: ${leaks.slice(0, 3).map(l => `${l.node_name} (${l.leak_probability}% risk)`).join('; ') || 'none detected'}
`.trim();
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 400,
          system: `You are the MajiSmart AI assistant, helping water system operators in Kenya. Be concise and practical. Use the live data provided when relevant.\n\n${contextBlock}`,
          messages: [{ role: 'user', content: message }]
        })
      });
      const data = await response.json();
      const text = data?.content?.find(c => c.type === 'text')?.text;
      if (text) return { reply: text, source: 'ai' };
    } catch (e) {
      // fall through to rule-based
    }
  }
  if (lower.includes('leak')) {
    if (leaks.length === 0) return { reply: 'No leaks detected across the network right now.', source: 'rules' };
    return {
      reply: `${leaks.length} node(s) show possible leak risk. Top concern: ${leaks[0].node_name} at ${leaks[0].leak_probability}% probability.`,
      source: 'rules'
    };
  }
  if (lower.includes('offline')) {
    return { reply: `${s.offline_nodes} node(s) are currently offline out of ${s.total_nodes} total.`, source: 'rules' };
  }
  if (lower.includes('revenue') || lower.includes('money') || lower.includes('ksh')) {
    return { reply: `Revenue collected today: Ksh ${Number(s.today_revenue).toLocaleString()}.`, source: 'rules' };
  }
  if (lower.includes('alert')) {
    if (!openAlerts.rows.length) return { reply: 'No open alerts at the moment — all clear.', source: 'rules' };
    return {
      reply: `${openAlerts.rows.length} open alert(s): ` + openAlerts.rows.map(a => `${a.node_name} — ${a.message}`).join('; '),
      source: 'rules'
    };
  }
  return {
    reply: `I can help with leak risks, offline nodes, revenue, and alerts. Try asking "any leaks?" or "how's revenue today?". (Network: ${s.total_nodes} nodes, ${s.offline_nodes} offline, Ksh ${Number(s.today_revenue).toLocaleString()} collected today.)`,
    source: 'rules'
  };
}
module.exports = {
  detectLeak,
  detectLeaksSystemWide,
  forecastConsumption,
  detectAnomalies,
  getRecommendations,
  systemInsights,
  chatAssistant
};
