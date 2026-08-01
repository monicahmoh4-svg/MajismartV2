const express = require('express');
const router = express.Router();
const db = require('../db');

function generateWONumber() {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `WO-${year}-${random}`;
}

// SELF-HEALING: Automatically create table and seed data if missing
async function ensureWorkOrdersTable() {
  try {
    const { rows } = await db.query(`
      SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'work_orders')
    `);

    if (!rows[0].exists) {
      console.log('🔧 Auto-creating work_orders table (self-healing)...');

      await db.query(`
        CREATE TABLE work_orders (
          id SERIAL PRIMARY KEY,
          wo_number VARCHAR(20) UNIQUE NOT NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          source_type VARCHAR(50),
          source_id INTEGER,
          assigned_to VARCHAR(255),
          status VARCHAR(30) DEFAULT 'pending',
          priority VARCHAR(20) DEFAULT 'medium',
          location TEXT,
          created_by VARCHAR(255),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          assigned_at TIMESTAMP,
          completed_at TIMESTAMP,
          completion_notes TEXT
        )
      `);
      console.log('✅ work_orders table created');

      await db.query(`CREATE INDEX IF NOT EXISTS idx_wo_status ON work_orders (status)`);
      await db.query(`CREATE INDEX IF NOT EXISTS idx_wo_assigned ON work_orders (assigned_to)`);
      await db.query(`CREATE INDEX IF NOT EXISTS idx_wo_priority ON work_orders (priority)`);
      console.log('✅ Indexes created');

      // Seed sample work orders
      const sampleWOs = [
        { wo_number: 'WO-2024-001', title: 'Investigate Low Pressure in Westlands', description: 'Multiple citizen reports of low water pressure. Requires valve inspection and possible pipe flushing.', source_type: 'report', assigned_to: 'John Kamau (Team A)', status: 'in_progress', priority: 'high', location: 'Westlands, Nairobi', created_by: 'System Admin' },
        { wo_number: 'WO-2024-002', title: 'Preventive Maintenance: Nyali Reservoir Pump', description: 'AI predictive model indicates pump bearing wear. Schedule lubrication and inspection.', source_type: 'predictive', assigned_to: 'Maintenance Crew B', status: 'pending', priority: 'medium', location: 'Nyali Reservoir, Mombasa', created_by: 'AI Analytics Engine' },
        { wo_number: 'WO-2024-003', title: 'Repair Burst Pipe near Kibera Market', description: 'Major leak reported. Dispatch emergency team immediately to isolate and repair.', source_type: 'report', assigned_to: 'Emergency Response Team', status: 'completed', priority: 'urgent', location: 'Kibera, Nairobi', created_by: 'County Officer', completion_notes: 'Pipe section replaced. Pressure restored to normal levels. Site cleaned.' },
        { wo_number: 'WO-2024-004', title: 'Water Quality Testing - Kisumu Central', description: 'Routine monthly water quality sampling and lab analysis required.', source_type: 'manual', assigned_to: 'Lab Team C', status: 'assigned', priority: 'medium', location: 'Kisumu Central', created_by: 'County Officer' },
        { wo_number: 'WO-2024-005', title: 'Replace Faulty Meter - Eldoret', description: 'Customer reported inaccurate meter readings. Inspection and replacement needed.', source_type: 'report', assigned_to: 'Meter Team D', status: 'pending', priority: 'low', location: 'Eldoret Central', created_by: 'System Admin' }
      ];

      for (const wo of sampleWOs) {
        await db.query(
          `INSERT INTO work_orders (wo_number, title, description, source_type, assigned_to, status, priority, location, created_by, completion_notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT (wo_number) DO NOTHING`,
          [wo.wo_number, wo.title, wo.description, wo.source_type, wo.assigned_to, wo.status, wo.priority, wo.location, wo.created_by, wo.completion_notes || null]
        );
      }
      console.log(`✅ Seeded ${sampleWOs.length} sample work orders`);
    }
  } catch (error) {
    console.error('❌ Failed to ensure work_orders table:', error.message);
    throw error;
  }
}

// GET /api/workorders - List all work orders with filters
router.get('/', async (req, res) => {
  try {
    // Self-healing: ensure table exists before querying
    await ensureWorkOrdersTable();

    const { status, priority, assigned_to, search, limit = 50, offset = 0 } = req.query;
    let query = `SELECT * FROM work_orders WHERE 1=1`;
    const params = [];
    let paramCount = 1;

    if (status) { params.push(status); query += ` AND status = $${paramCount++}`; }
    if (priority) { params.push(priority); query += ` AND priority = $${paramCount++}`; }
    if (assigned_to) { 
      params.push(`%${assigned_to}%`); 
      query += ` AND assigned_to ILIKE $${paramCount++}`; 
    }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (title ILIKE $${paramCount} OR wo_number ILIKE $${paramCount} OR location ILIKE $${paramCount})`;
      paramCount++;
    }

    query += ` ORDER BY 
      CASE priority 
        WHEN 'urgent' THEN 1 
        WHEN 'high' THEN 2 
        WHEN 'medium' THEN 3 
        WHEN 'low' THEN 4 
      END,
      created_at DESC 
      LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    params.push(parseInt(limit), parseInt(offset));

    const { rows } = await db.query(query, params);
    
    const { rows: countResult } = await db.query(`SELECT COUNT(*) FROM work_orders`);

    res.json({
      work_orders: rows,
      total: parseInt(countResult[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Work orders list error:', error);
    res.status(500).json({ error: 'Failed to fetch work orders', message: error.message });
  }
});

// GET /api/workorders/stats - Dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    await ensureWorkOrdersTable();

    const { rows } = await db.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'assigned') as assigned,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'verified') as verified,
        COUNT(*) FILTER (WHERE priority IN ('urgent', 'high')) as high_priority
      FROM work_orders
    `);
    res.json(rows[0]);
  } catch (error) {
    console.error('Work order stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats', message: error.message });
  }
});

// POST /api/workorders - Create new work order
router.post('/', async (req, res) => {
  try {
    await ensureWorkOrdersTable();

    const { title, description, source_type, source_id, assigned_to, priority, location, created_by } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const wo_number = generateWONumber();
    const initial_status = assigned_to ? 'assigned' : 'pending';

    const { rows } = await db.query(
      `INSERT INTO work_orders (wo_number, title, description, source_type, source_id, assigned_to, status, priority, location, created_by, assigned_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [wo_number, title, description, source_type, source_id, assigned_to, initial_status, priority || 'medium', location, created_by, assigned_to ? new Date() : null]
    );

    res.status(201).json({ message: 'Work order created', work_order: rows[0] });
  } catch (error) {
    console.error('Work order create error:', error);
    res.status(500).json({ error: 'Failed to create work order', message: error.message });
  }
});

// PUT /api/workorders/:id - Update work order
router.put('/:id', async (req, res) => {
  try {
    const updates = req.body;
    const setClauses = [];
    const values = [];
    let paramCount = 1;

    const allowedFields = ['status', 'assigned_to', 'priority', 'completion_notes'];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        setClauses.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (updates.status === 'assigned') {
      setClauses.push('assigned_at = NOW()');
    } else if (updates.status === 'completed' || updates.status === 'verified') {
      setClauses.push('completed_at = NOW()');
    }

    if (setClauses.length === 0) return res.status(400).json({ error: 'No valid fields to update' });

    setClauses.push('updated_at = NOW()');
    values.push(req.params.id);

    const { rows } = await db.query(
      `UPDATE work_orders SET ${setClauses.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Work order not found' });
    res.json({ message: 'Work order updated', work_order: rows[0] });
  } catch (error) {
    console.error('Work order update error:', error);
    res.status(500).json({ error: 'Failed to update work order', message: error.message });
  }
});

// DELETE /api/workorders/:id
router.delete('/:id', async (req, res) => {
  try {
    const { rows } = await db.query('DELETE FROM work_orders WHERE id = $1 RETURNING *', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Work order not found' });
    res.json({ message: 'Work order deleted' });
  } catch (error) {
    console.error('Work order delete error:', error);
    res.status(500).json({ error: 'Failed to delete work order', message: error.message });
  }
});

module.exports = router;
