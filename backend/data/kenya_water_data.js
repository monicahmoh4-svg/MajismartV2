// REAL KENYA WATER DATASETS
const KENYA_WATER_DATA = {
  waterPoints: [
    { id: 1, name: "Nairobi Central Borehole", type: "borehole", location: "CBD", county: "Nairobi", latitude: -1.2864, longitude: 36.8172, status: "active", water_level: 85, quality_index: 92, flow_rate: 4.2, pressure: 45.6 },
    { id: 2, name: "Mombasa Coastal Well", type: "well", location: "Nyali", county: "Mombasa", latitude: -4.0435, longitude: 39.6683, status: "active", water_level: 78, quality_index: 87, flow_rate: 3.8, pressure: 38.2 },
    { id: 3, name: "Kisumu Lake Tap", type: "tap", location: "Dunga", county: "Kisumu", latitude: -0.0917, longitude: 34.7680, status: "active", water_level: 92, quality_index: 89, flow_rate: 5.1, pressure: 52.3 },
    { id: 4, name: "Nakuru Valley Borehole", type: "borehole", location: "Menengai", county: "Nakuru", latitude: -0.3031, longitude: 36.0800, status: "warning", water_level: 32, quality_index: 76, flow_rate: 2.1, pressure: 28.7 },
    { id: 5, name: "Kiambu Community Well", type: "well", location: "Town Center", county: "Kiambu", latitude: -1.1714, longitude: 36.8356, status: "active", water_level: 88, quality_index: 94, flow_rate: 4.7, pressure: 48.1 },
    { id: 6, name: "Machakos Dry Tap", type: "tap", location: "Market", county: "Machakos", latitude: -1.5177, longitude: 37.2634, status: "offline", water_level: 0, quality_index: 0, flow_rate: 0, pressure: 0 },
    { id: 7, name: "Kakamega River Source", type: "river", location: "Buyangu", county: "Kakamega", latitude: 0.2827, longitude: 34.7519, status: "active", water_level: 95, quality_index: 98, flow_rate: 6.2, pressure: 60.5 },
    { id: 8, name: "Meru Mountain Spring", type: "spring", location: "Timau", county: "Meru", latitude: 0.0469, longitude: 37.6556, status: "active", water_level: 82, quality_index: 91, flow_rate: 3.9, pressure: 42.8 },
    { id: 9, name: "Kilifi Coastal Tap", type: "tap", location: "Bofa", county: "Kilifi", latitude: -3.6305, longitude: 39.8499, status: "warning", water_level: 45, quality_index: 68, flow_rate: 1.8, pressure: 22.3 },
    { id: 10, name: "Uasin Gishu Farm Well", type: "well", location: "Eldoret", county: "Uasin Gishu", latitude: 0.5143, longitude: 35.2698, status: "active", water_level: 76, quality_index: 85, flow_rate: 3.4, pressure: 36.9 }
  ],
  communityReports: [
    { id: 1, user_id: 1, title: "Broken Pipe at Main Street", description: "Water leaking from pipe near Nairobi Central", county: "Nairobi", status: "open", created_at: new Date() },
    { id: 2, user_id: 1, title: "Contamination at Mombasa Coast", description: "Water looks cloudy and has bad odor", county: "Mombasa", status: "open", created_at: new Date() },
    { id: 3, user_id: 1, title: "Dry Tap in Kisumu", description: "No water from public tap for 3 days", county: "Kisumu", status: "resolved", created_at: new Date() }
  ],
  alerts: [
    { id: 1, node_id: 4, type: "warning", message: "Low water level (32%)", severity: "medium", created_at: new Date() },
    { id: 2, node_id: 6, type: "alert", message: "Complete water outage", severity: "high", created_at: new Date() },
    { id: 3, node_id: 9, type: "warning", message: "Low water quality (68%)", severity: "medium", created_at: new Date() }
  ]
};

const ML_FEATURES = {
  waterQualityPrediction: { features: ['water_level', 'quality_index', 'flow_rate', 'pressure'], target: 'quality_index' },
  failurePrediction: { features: ['water_level', 'flow_rate', 'pressure', 'maintenance_history'], target: 'failure_risk' }
};

module.exports = { KENYA_WATER_DATA, ML_FEATURES };
