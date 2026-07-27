function detectLeakPatterns(readings) {
  if (readings.length < 24) return { leak_detected: false, confidence: 0, reason: 'Insufficient data' };
  
  let consecutiveZeroFlow = 0;
  let abnormalDrop = 0;
  let highTurbidity = 0;
  
  for (let i = 1; i < readings.length; i++) {
    const curr = readings[i];
    const prev = readings[i-1];
    
    if (curr.flow_rate === 0 && curr.water_level < prev.water_level - 5) {
      consecutiveZeroFlow++;
    }
    
    if (prev.water_level && curr.water_level < prev.water_level - 15) {
      abnormalDrop++;
    }
    
    if (curr.turbidity > 5) {
      highTurbidity++;
    }
  }
  
  const total = readings.length;
  const leakScore = (consecutiveZeroFlow * 0.4 + abnormalDrop * 0.5 + highTurbidity * 0.1) / total;
  
  if (leakScore > 0.3) {
    return {
      leak_detected: true,
      confidence: Math.min(leakScore * 100, 95),
      reason: `Abnormal patterns detected: ${consecutiveZeroFlow} zero-flow events, ${abnormalDrop} sudden drops`,
      metrics: { consecutiveZeroFlow, abnormalDrop, highTurbidity }
    };
  }
  
  return { leak_detected: false, confidence: 0, reason: 'No leak patterns detected' };
}

function forecastWaterDemand(readings, days) {
  if (readings.length < 7) {
    return { forecast: [], trend: 'unknown', confidence: 0 };
  }
  
  const dailyAvg = {};
  readings.forEach(r => {
    const date = new Date(r.recorded_at).toISOString().split('T')[0];
    if (!dailyAvg[date]) dailyAvg[date] = [];
    dailyAvg[date].push(r.flow_rate || 0);
  });
  
  const averages = Object.entries(dailyAvg).map(([date, values]) => ({
    date,
    avg: values.reduce((a, b) => a + b, 0) / values.length
  }));
  
  const trend = calculateTrend(averages.map(a => a.avg));
  const forecast = generateForecast(averages, days, trend);
  
  return {
    forecast,
    trend: trend > 0.1 ? 'increasing' : trend < -0.1 ? 'decreasing' : 'stable',
    confidence: Math.min(averages.length / 14, 0.9),
    increase_percentage: trend > 0 ? (trend * 100).toFixed(1) : 0
  };
}

function calculateTrend(values) {
  if (values.length < 2) return 0;
  const n = values.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumXX += i * i;
  }
  
  return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
}

function generateForecast(historical, days, trend) {
  const lastVal = historical[historical.length - 1]?.avg || 0;
  const forecast = [];
  
  for (let i = 1; i <= days; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    forecast.push({
      date: date.toISOString().split('T')[0],
      predicted: Math.max(0, lastVal + (trend * i))
    });
  }
  
  return forecast;
}

function analyzeAnomalies(readings) {
  const anomalies = [];
  const avgFlow = readings.reduce((sum, r) => sum + (r.flow_rate || 0), 0) / readings.length;
  const avgTurbidity = readings.reduce((sum, r) => sum + (r.turbidity || 0), 0) / readings.length;
  
  readings.forEach((r, i) => {
    if (r.flow_rate && Math.abs(r.flow_rate - avgFlow) > avgFlow * 2) {
      anomalies.push({ type: 'flow_anomaly', reading: r, index: i });
    }
    if (r.turbidity && r.turbidity > avgTurbidity * 3) {
      anomalies.push({ type: 'turbidity_spike', reading: r, index: i });
    }
  });
  
  return anomalies;
}

module.exports = { detectLeakPatterns, forecastWaterDemand, analyzeAnomalies };
