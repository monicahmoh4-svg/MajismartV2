const db = require('../db');

async function runWorkOrderMigrations() {
  console.log('🔧 Running Work Order Management migrations...\n');

  try {
    // Create work orders table
    await db.query(`
      CREATE TABLE IF NOT EXISTS work_orders (
        id SERIAL PRIMARY KEY,
        wo_number VARCHAR(20) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        source_type VARCHAR(50), -- 'report', 'predictive', 'manual'
        source_id INTEGER,
        assigned_to VARCHAR(255),
        status VARCHAR(30) DEFAULT 'pending', -- pending, assigned, in_progress, completed, verified
        priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, urgent
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

    // Create indexes for performance
    await db.query(`CREATE INDEX IF NOT EXISTS idx_wo_status ON work_orders (status)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_wo_assigned ON work_orders (assigned_to)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_wo_priority ON work_orders (priority)`);
    console.log('✅ Indexes created');

    // Seed sample work orders
    const sampleWOs = [
      {
        wo_number: 'WO-2024-001',
        title: 'Investigate Low Pressure in Westlands',
        description: 'Multiple citizen reports of low water pressure. Requires valve inspection and possible pipe flushing.',
        source_type: 'report',
        assigned_to: 'John Kamau (Team A)',
        status: 'in_progress',
        priority: 'high',
        location: 'Westlands, Nairobi',
        created_by: 'System Admin'
      },
      {
        wo_number: 'WO-2024-002',
        title: 'Preventive Maintenance: Nyali Reservoir Pump',
        description: 'AI predictive model indicates pump bearing wear. Schedule lubrication and inspection.',
        source_type: 'predictive',
        assigned_to: 'Maintenance Crew B',
        status: 'pending',
        priority: 'medium',
        location: 'Nyali Reservoir, Mombasa',
        created_by: 'AI Analytics Engine'
      },
      {
        wo_number: 'WO-2024-003',
        title: 'Repair Burst Pipe near Kibera Market',
        description: 'Major leak reported. Dispatch emergency team immediately to isolate and repair.',
        source_type: 'report',
        assigned_to: 'Emergency Response Team',
        status: 'completed',
        priority: 'urgent',
        location: 'Kibera, Nairobi',
        created_by: 'County Officer',
        completion_notes: 'Pipe section replaced. Pressure restored to normal levels. Site cleaned.'
      }
    ];

    for (const wo of sampleWOs) {
      await db.query(
        `INSERT INTO work_orders (wo_number, title, description, source_type, assigned_to, status, priority, location, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (wo_number) DO NOTHING`,
        [wo.wo_number, wo.title, wo.description, wo.source_type, wo.assigned_to, wo.status, wo.priority, wo.location, wo.created_by]
      );
    }
    console.log(`✅ Seeded ${sampleWOs.length} sample work orders`);

    console.log('\n🎉 Work Order Management migrations completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Work order migration failed:', error.message);
    process.exit(1);
  }
}

runWorkOrderMigrations();
