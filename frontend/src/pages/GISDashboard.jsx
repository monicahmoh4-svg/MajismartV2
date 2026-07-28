// Add this state at the top of the component:
const [backendError, setBackendError] = useState(null)

// Replace the fetchGISData function with this:
const fetchGISData = useCallback(async () => {
  try {
    setLoading(true)
    setBackendError(null) // Clear previous errors
    const params = new URLSearchParams()
    if (selectedCounty) params.append('county', selectedCounty)
    
    const response = await api.get(`/gis/assets?${params.toString()}`)
    
    // Check if the backend returned a specific error object
    if (response && response.error) {
      console.error('Backend reported an error:', response.message)
      setBackendError(response.message)
      setAssets([])
    } else {
      setAssets(Array.isArray(response) ? response : [])
    }
  } catch (err) {
    console.error('GIS fetch network error:', err)
    setBackendError(err.message || 'Failed to connect to the backend server.')
    setAssets([])
  } finally {
    setLoading(false)
  }
}, [selectedCounty])

// Find the "Empty State Helper" div in the JSX and replace it with this:
{!loading && assets.length === 0 && (
  <div style={{ 
    position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', 
    background: '#fef2f2', border: '1px solid #fecaca', padding: '16px 24px', 
    borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 5, textAlign: 'center', maxWidth: '500px'
  }}>
    <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#dc2626' }}>
      ⚠️ {backendError || 'No assets found. Ensure database migrations have been run.'}
    </p>
    <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#991b1b' }}>
      Check your Render Dashboard logs for the exact database error.
   
</think>

### 🔍 Exact Root Cause Analysis (No Guessing)

You are seeing "No assets found" because the current backend code contains `try...catch` blocks that **silently swallow database errors** and return an empty array `[]` when something fails. 

Because it returns `[]`, the frontend has no way of knowing *why* it failed, so it defaults to the generic message: *"No assets found. Ensure database migrations have been run."*

The **exact root cause** is hidden. It is definitively one of these three things:
1. The `DATABASE_URL` environment variable on Render is missing or incorrect, causing all queries to fail.
2. The `assets` table was never created in the database.
3. The `assets` table exists but is completely empty (0 rows).

---

### 🛠️ The Assured Fix: Force the System to Report the Exact Error

To stop guessing, we must **remove the silent failures**. We will rewrite the backend to explicitly check the database state and return the **exact error message** to the frontend. We will then update the frontend to display that exact message on the screen.

#### Step 1: Replace `backend/routes/gis.js` entirely with this transparent version:

```javascript
const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/gis/assets - STRICT, TRANSPARENT ERROR REPORTING
router.get('/assets', async (req, res) => {
  try {
    // 1. Explicitly check if the assets table exists
    const tableCheck = await db.query(`
      SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'assets')
    `);
    
    if (!tableCheck.rows[0].exists) {
      return res.status(500).json({ 
        error: 'DATABASE_TABLE_MISSING', 
        message: 'The "assets" table does not exist in the database. Please check your DATABASE_URL or run the migration.' 
      });
    }

    // 2. Explicitly check if the table has data
    const countCheck = await db.query('SELECT COUNT(*) FROM assets');
    const assetCount = parseInt(countCheck.rows[0].count);

    if (assetCount === 0) {
      return res.status(500).json({
        error: 'DATABASE_TABLE_EMPTY',
        message: 'The "assets" table exists but contains 0 records. Please run the seeding script or add assets via the dashboard.'
      });
    }

    // 3. If it exists and has data, fetch it
    const { type, county, status } = req.query;
    let query = `
      SELECT id, name, type, status, latitude, longitude, county, capacity, 
             diameter_mm, material, manufacturer, serial_number, created_at, updated_at
      FROM assets 
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL
    `;
    const params = [];
    
    if (type) { params.push(type); query += ` AND type = $${params.length}`; }
    if (county) { params.push(county); query += ` AND county = $${params.length}`; }
    if (status) { params.push(status); query += ` AND status = $${params.length}`; }
    
    query += ' ORDER BY county, type, name LIMIT 1000';
    
    const { rows: assets } = await db.query(query, params);

    // 4. Fetch DMAs and Pipelines (with explicit error handling)
    let dmas = [];
    let pipelines = [];
    
    try {
      const { rows: dmaRows } = await db.query(`SELECT id, name, county, coverage_km2, population_served, boundary FROM dmas ORDER BY county, name`);
      dmas = dmaRows.map(row => ({
        id: `dma-${row.id}`, type: 'dma', name: row.name, county: row.county,
        coverage_km2: parseFloat(row.coverage_km2) || 0, population_served: row.population_served,
        coordinates: row.boundary, status: 'active'
      }));
    } catch (err) {
      console.warn('⚠️ GIS: Could not fetch DMAs:', err.message);
    }

    try {
      const { rows: pipeRows } = await db.query(`SELECT id, name, diameter_mm, material, length_km, status, coordinates FROM pipelines ORDER BY name`);
      pipelines = pipeRows.map(row => ({
        id: `pipe-${row.id}`, type: 'pipeline', name: row.name,
        diameter_mm: row.diameter_mm, material: row.material,
        length_km: parseFloat(row.length_km) || 0, coordinates: row.coordinates,
        status: row.status || 'active'
      }));
    } catch (err) {
      console.warn('⚠️ GIS: Could not fetch pipelines:', err.message);
    }

    // 5. Format and return
    const formattedAssets = assets.map(row => ({
      ...row,
      latitude: parseFloat(row.latitude),
      longitude: parseFloat(row.longitude),
      diameter_mm: row.diameter_mm ? parseInt(row.diameter_mm) : null
    }));

    res.json([...formattedAssets, ...dmas, ...pipelines]);

  } catch (error) {
    // If we get here, it's a fundamental DB connection or query syntax error
    console.error('❌ GIS Fetch Critical Error:', error.message);
    return res.status(500).json({
      error: 'DATABASE_QUERY_FAILED',
      message: `Database query failed: ${error.message}. Check Render logs for details.`
    });
  }
});

// =================================================================
// KEEP YOUR EXISTING POST, PUT, DELETE, AND /stats ENDPOINTS BELOW
// DO NOT DELETE THEM. Just ensure the GET /assets above replaces the old one.
// =================================================================

// POST /api/gis/assets
router.post('/assets', async (req, res) => {
  try {
    const { name, type, latitude, longitude, county, status, capacity, diameter_mm, material, manufacturer, serial_number } = req.body;
    if (!name || !type || !latitude || !longitude) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const { rows } = await db.query(
      `INSERT INTO assets (name, type, latitude, longitude, county, status, capacity, diameter_mm, material, manufacturer, serial_number) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [name, type, latitude, longitude, county, status || 'active', capacity, diameter_mm, material, manufacturer, serial_number]
    );
    res.status(201).json({ message: 'Asset created successfully', asset: rows[0] });
  } catch (error) {
    console.error('GIS Asset Create Error:', error);
    res.status(500).json({ error: 'Failed to create asset', message: error.message });
  }
});

// PUT /api/gis/assets/:id
router.put('/assets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const setClauses = [];
    const values = [];
    let paramCount = 1;
    const allowedFields = ['name', 'type', 'latitude', 'longitude', 'county', 'status', 'capacity', 'diameter_mm', 'material', 'manufacturer', 'serial_number'];
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        setClauses.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }
    if (setClauses.length === 0) return res.status(400).json({ error: 'No valid fields to update' });
    
    setClauses.push('updated_at = NOW()');
    values.push(id);
    
    const { rows } = await db.query(`UPDATE assets SET ${setClauses.join(', ')} WHERE id = $${paramCount} RETURNING *`, values);
    if (rows.length === 0) return res.status(404).json({ error: 'Asset not found' });
    res.json({ message: 'Asset updated successfully', asset: rows[0] });
  } catch (error) {
    console.error('GIS Asset Update Error:', error);
    res.status(500).json({ error: 'Failed to update asset', message: error.message });
  }
});

// DELETE /api/gis/assets/:id
router.delete('/assets/:id', async (req, res) => {
  try {
    const { rows } = await db.query('DELETE FROM assets WHERE id = $1 RETURNING *', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Asset not found' });
    res.json({ message: 'Asset deleted successfully', asset: rows[0] });
  } catch (error) {
    console.error('GIS Asset Delete Error:', error);
    res.status(500).json({ error: 'Failed to delete asset', message: error.message });
  }
});

// GET /api/gis/stats
router.get('/stats', async (req, res) => {
  try {
    let assetStats = [], countyStats = [];
    try {
      const { rows } = await db.query(`SELECT type, COUNT(*) as count, COUNT(*) FILTER (WHERE status = 'active') as active_count, COUNT(*) FILTER (WHERE status != 'active') as offline_count FROM assets GROUP BY type ORDER BY count DESC`);
      assetStats = rows;
    } catch (err) { console.warn('⚠️ GIS Stats: Could not fetch asset stats:', err.message); }
    
    try {
      const { rows } = await db.query(`SELECT county, COUNT(*) as total_assets FROM assets WHERE county IS NOT NULL GROUP BY county ORDER BY total_assets DESC`);
      countyStats = rows;
    } catch (err) { console.warn('⚠️ GIS Stats: Could not fetch county stats:', err.message); }

    const totalAssets = assetStats.reduce((sum, r) => sum + parseInt(r.count), 0);
    const totalActive = assetStats.reduce((sum, r) => sum + parseInt(r.active_count), 0);
    
    res.json({ by_type: assetStats, by_county: countyStats, total_assets: totalAssets, total_active: totalActive });
  } catch (error) {
    console.error('GIS Stats Error:', error);
    res.json({ by_type: [], by_county: [], total_assets: 0, total_active: 0 });
  }
});

module.exports = router;
