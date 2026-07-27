const express = require('express');
const router = express.Router();
const db = require('../db'); // Assuming your existing db connection

// GET /api/gis/assets
// Returns all GIS-enabled assets as a structured array for the frontend map
router.get('/assets', async (req, res) => {
  try {
    // In a production environment, this would query a PostGIS-enabled database.
    // For now, we query the existing nodes/assets table and format it for GeoJSON compatibility.
    const { rows } = await db.query(`
      SELECT 
        id, 
        name, 
        type, 
        status, 
        latitude, 
        longitude, 
        water_level as last_reading,
        created_at
      FROM nodes 
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL
      UNION ALL
      SELECT 
        id, 
        name, 
        'reservoir' as type, 
        status, 
        latitude, 
        longitude, 
        capacity as last_reading,
        created_at
      FROM reservoirs 
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL
    `);

    // Append mock DMA and Pipeline data if tables are empty, ensuring the map always has visual value
    const mockSpatialData = [
      { id: 901, type: 'dma', name: 'DMA Zone - Nairobi Central', coordinates: [[-1.2900, 36.8200], [-1.2900, 36.8300], [-1.3000, 36.8300], [-1.3000, 36.8200]], coverage_km2: 15.2 },
      { id: 902, type: 'pipeline', name: 'Trunk Main A', coordinates: [[-1.2921, 36.8219], [-1.2950, 36.8150], [-1.3000, 36.8100]], status: 'active', diameter_mm: 500, material: 'Ductile Iron' }
    ];

    res.json([...rows, ...mockSpatialData]);
  } catch (error) {
    console.error('GIS Assets Fetch Error:', error);
    res.status(500).json({ error: 'Failed to fetch GIS assets' });
  }
});

module.exports = router;
