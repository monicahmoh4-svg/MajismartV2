const express = require('express');
const router = express.Router();
const db = require('../db');

function generateWONumber() {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `WO-${year}-${random}`;
}

// GET /api/workorders - List all work orders with filters
router.get('/', async (req, res) => {
  try {
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
        WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 
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

// PUT /api/workorders/:id - Update work order (status, assignment, notes)
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

    // Auto-update timestamps based on status changes
    if (updates.status === 'assigned' && !updates.assigned_at) {
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
