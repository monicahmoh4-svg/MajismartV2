const db = require('../db');
const { detectLeakPatterns, forecastWaterDemand, analyzeAnomalies } = require('./aiModels');

class AIService {
  async detectLeak(nodeId) {
    const { rows } = await db.query(
      'SELECT * FROM sensor_readings WHERE node_id=$1 ORDER BY recorded_at DESC LIMIT 48',
      [nodeId]
    );
    if (rows.length < 24) return { leak_detected: false, confidence: 0, reason: 'Insufficient data' };
    return detectLeakPatterns(rows);
  }

  async detectLeaksSystemWide() {
    const { rows: nodes } = await db.query('SELECT id, name, county FROM nodes WHERE status != \'offline\'');
    const results = await Promise.all(nodes.map(async node => {
      const leak = await this.detectLeak(node.id);
      return { ...node, ...leak };
    }));
    return results.filter(r => r.leak_detected);
  }

  async forecastConsumption(nodeId, days = 7) {
    const { rows } = await db.query(
      'SELECT * FROM sensor_readings WHERE node_id=$1 AND recorded_at > NOW() - INTERVAL \'30 days\' ORDER BY recorded_at',
      [nodeId]
    );
    return forecastWaterDemand(rows, days);
  }

  async detectAnomalies(nodeId) {
    const { rows } = await db.query(
      'SELECT * FROM sensor_readings WHERE node_id=$1 AND recorded_at > NOW() - INTERVAL \'7 days\' ORDER BY recorded_at DESC',
      [nodeId]
    );
    return analyzeAnomalies(rows);
  }

  async getRecommendations(nodeId) {
    const leak = await this.detectLeak(nodeId);
    const forecast = await this.forecastConsumption(nodeId, 7);
    const anomalies = await this.detectAnomalies(nodeId);
    
    const recommendations = [];
    if (leak.leak_detected) {
      recommendations.push({
        priority: 'critical',
        title: 'Immediate Leak Investigation Required',
        detail: `Leak detected with ${leak.confidence}% confidence. ${leak.reason}`,
        action: 'Schedule maintenance inspection within 24 hours'
      });
    }
    if (forecast.trend === 'increasing' && forecast.confidence > 0.7) {
      recommendations.push({
        priority: 'warning',
        title: 'High Demand Forecasted',
        detail: `Water demand expected to increase by ${forecast.increase_percentage}% over next 7 days`,
        action: 'Prepare backup water sources or increase pumping capacity'
      });
    }
    if (anomalies.length > 0) {
      recommendations.push({
        priority: 'info',
        title: 'Sensor Anomalies Detected',
        detail: `${anomalies.length} unusual readings detected in the past week`,
        action: 'Review sensor calibration and data quality'
      });
    }
    return { recommendations, generated_at: new Date().toISOString() };
  }

  async systemInsights() {
    const { rows: nodes } = await db.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status != \'active\') as issues FROM nodes');
    const { rows: alerts } = await db.query('SELECT COUNT(*) as total FROM alerts WHERE resolved=false');
    const { rows: revenue } = await db.query('SELECT COALESCE(SUM(amount_ksh),0) as total FROM payments WHERE status=\'completed\' AND created_at > NOW() - INTERVAL \'30 days\'');
    
    return {
      total_nodes: parseInt(nodes[0].total),
      nodes_with_issues: parseInt(nodes[0].issues),
      active_alerts: parseInt(alerts[0].total),
      monthly_revenue: parseFloat(revenue[0].total),
      generated_at: new Date().toISOString()
    };
  }

  async chatAssistant(message) {
    // Simple rule-based assistant (can be enhanced with Claude/GPT)
    const lower = message.toLowerCase();
    let reply = '';
    
    if (lower.includes('leak') || lower.includes('leakage')) {
      const leaks = await this.detectLeaksSystemWide();
      reply = `I found ${leaks.length} potential leak${leaks.length !== 1 ? 's' : ''} in the system. `;
      if (leaks.length > 0) {
        reply += `Most critical: ${leaks[0].name} in ${leaks[0].county} with ${leaks[0].confidence}% confidence.`;
      }
    } else if (lower.includes('revenue') || lower.includes('money') || lower.includes('income')) {
      const insights = await this.systemInsights();
      reply = `Total revenue this month: Ksh ${insights.monthly_revenue.toLocaleString()}. `;
    } else if (lower.includes('offline') || lower.includes('down') || lower.includes('not working')) {
      const { rows } = await db.query('SELECT name, county, status FROM nodes WHERE status != \'active\'');
      reply = `${rows.length} node${rows.length !== 1 ? 's' : ''} currently ${rows.length !== 1 ? 'are' : 'is'} offline or have issues.`;
      if (rows.length > 0) {
        reply += ` First: ${rows[0].name} in ${rows[0].county} (${rows[0].status}).`;
      }
    } else if (lower.includes('alert')) {
      const { rows } = await db.query('SELECT COUNT(*) FROM alerts WHERE resolved=false');
      reply = `There are ${rows[0].count} unresolved alerts in the system.`;
    } else {
      reply = "I can help you with leaks, revenue, offline nodes, and alerts. What would you like to know?";
    }
    
    return { reply, timestamp: new Date().toISOString() };
  }
}

module.exports = new AIService();
