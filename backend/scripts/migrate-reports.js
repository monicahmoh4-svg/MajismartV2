const db = require('../db');

async function runReportMigrations() {
  console.log('📝 Running Enhanced Citizen Reports migrations...\n');

  try {
    // Drop existing reports table if it exists (for clean migration)
    await db.query(`DROP TABLE IF EXISTS report_attachments CASCADE`);
    await db.query(`DROP TABLE IF EXISTS report_comments CASCADE`);
    await db.query(`DROP TABLE IF EXISTS reports CASCADE`);

    // Create enhanced reports table
    await db.query(`
      CREATE TABLE reports (
        id SERIAL PRIMARY KEY,
        report_number VARCHAR(20) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(50) NOT NULL,
        priority VARCHAR(20) DEFAULT 'medium',
        status VARCHAR(30) DEFAULT 'submitted',
        
        -- Reporter info
        reporter_name VARCHAR(255),
        reporter_email VARCHAR(255),
        reporter_phone VARCHAR(50),
        reporter_user_id INTEGER,
        is_anonymous BOOLEAN DEFAULT false,
        
        -- Location
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        address TEXT,
        county VARCHAR(100),
        ward VARCHAR(100),
        
        -- Assignment
        assigned_to VARCHAR(255),
        assigned_user_id INTEGER,
        assigned_at TIMESTAMP,
        
        -- Asset linkage
        asset_id INTEGER,
        
        -- Timeline
        submitted_at TIMESTAMP DEFAULT NOW(),
        acknowledged_at TIMESTAMP,
        resolved_at TIMESTAMP,
        closed_at TIMESTAMP,
        
        -- Resolution
        resolution_notes TEXT,
        resolution_category VARCHAR(50),
        
        -- Metadata
        severity INTEGER DEFAULT 3,
        view_count INTEGER DEFAULT 0,
        upvotes INTEGER DEFAULT 0,
        
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ reports table created');

    // Create report attachments table
    await db.query(`
      CREATE TABLE report_attachments (
        id SERIAL PRIMARY KEY,
        report_id INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
        filename VARCHAR(255) NOT NULL,
        file_type VARCHAR(50),
        file_data TEXT NOT NULL,
        uploaded_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ report_attachments table created');

    // Create report comments/updates table
    await db.query(`
      CREATE TABLE report_comments (
        id SERIAL PRIMARY KEY,
        report_id INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
        author_name VARCHAR(255),
        author_role VARCHAR(50),
        comment TEXT NOT NULL,
        is_internal BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ report_comments table created');

    // Create indexes
    await db.query(`CREATE INDEX IF NOT EXISTS idx_reports_status ON reports (status)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_reports_category ON reports (category)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_reports_county ON reports (county)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_reports_priority ON reports (priority)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_reports_submitted ON reports (submitted_at DESC)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_report_attachments_report ON report_attachments (report_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_report_comments_report ON report_comments (report_id)`);
    console.log('✅ Indexes created');

    // Seed sample reports
    console.log('\n📍 Seeding sample citizen reports...\n');
    
    const sampleReports = [
      {
        title: 'Major water pipe burst in Kibera',
        description: 'Large water pipe has burst near Kibera Market. Water is flooding the road and affecting multiple households. Urgent repair needed.',
        category: 'leak',
        priority: 'high',
        status: 'in_progress',
        reporter_name: 'Jane Wanjiku',
        reporter_phone: '+254712345678',
        latitude: -1.3031,
        longitude: 36.7989,
        county: 'Nairobi',
        ward: 'Kibera',
        assigned_to: 'Nairobi Water Technicians',
        severity: 2
      },
      {
        title: 'No water supply for 3 days in Westlands',
        description: 'Our area has had no water supply since Monday. Multiple households affected. Please investigate.',
        category: 'no_supply',
        priority: 'high',
        status: 'acknowledged',
        reporter_name: 'Peter Kamau',
        reporter_email: 'peter.kamau@example.com',
        latitude: -1.2635,
        longitude: 36.8033,
        county: 'Nairobi',
        ward: 'Westlands',
        severity: 2
      },
      {
        title: 'Brown/discolored water in Karen',
        description: 'Water from our taps has been brown and smelly for the past week. Concerned about water quality and health implications.',
        category: 'water_quality',
        priority: 'high',
        status: 'submitted',
        reporter_name: 'Mary Akinyi',
        reporter_phone: '+254723456789',
        latitude: -1.3099,
        longitude: 36.7096,
        county: 'Nairobi',
        ward: 'Karen',
        severity: 2
      },
      {
        title: 'Low water pressure in CBD',
        description: 'Water pressure has been very low in the CBD area, especially during peak hours (6-9 AM and 6-9 PM).',
        category: 'low_pressure',
        priority: 'medium',
        status: 'submitted',
        reporter_name: 'David Ochieng',
        latitude: -1.2864,
        longitude: 36.8172,
        county: 'Nairobi',
        ward: 'CBD',
        severity: 3
      },
      {
        title: 'Illegal water connection near Nyali',
        description: 'There appears to be an illegal water connection tapping from the main line near Nyali Beach Hotel. This is affecting pressure for legitimate customers.',
        category: 'illegal_connection',
        priority: 'medium',
        status: 'submitted',
        reporter_name: 'Anonymous',
        is_anonymous: true,
        latitude: -4.0167,
        longitude: 39.7000,
        county: 'Mombasa',
        ward: 'Nyali',
        severity: 3
      },
      {
        title: 'Broken water meter in Kisumu',
        description: 'Our water meter is not working properly. It shows zero consumption even when we use water regularly.',
        category: 'meter_issue',
        priority: 'low',
        status: 'submitted',
        reporter_name: 'Grace Atieno',
        reporter_phone: '+254734567890',
        latitude: -0.0917,
        longitude: 34.7680,
        county: 'Kisumu',
        ward: 'Kisumu Central',
        severity: 4
      },
      {
        title: 'Water tower leaking in Nakuru',
        description: 'The main water tower in Nakuru town appears to be leaking. Water is pooling at the base.',
        category: 'leak',
        priority: 'high',
        status: 'acknowledged',
        reporter_name: 'Samuel Kipchoge',
        latitude: -0.3031,
        longitude: 36.0800,
        county: 'Nakuru',
        ward: 'Nakuru Town',
        assigned_to: 'Nakuru Water Services',
        severity: 2
      },
      {
        title: 'Damaged water pipe in Eldoret',
        description: 'Construction work has damaged a water pipe on Uganda Road. Water is gushing out.',
        category: 'infrastructure_damage',
        priority: 'high',
        status: 'resolved',
        reporter_name: 'John Cheruiyot',
        latitude: 0.5143,
        longitude: 35.2698,
        county: 'Uasin Gishu',
        ward: 'Eldoret Central',
        assigned_to: 'Eldoret Water Technicians',
        resolved_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        resolution_notes: 'Pipe replaced and service restored within 24 hours.',
        severity: 2
      },
      {
        title: 'Billing error on my water bill',
        description: 'My water bill shows consumption of 50 cubic meters but I have been away for the entire month. Please review.',
        category: 'billing',
        priority: 'medium',
        status: 'submitted',
        reporter_name: 'Faith Muthoni',
        reporter_email: 'faith.m@example.com',
        latitude: -1.1719,
        longitude: 36.8311,
        county: 'Kiambu',
        ward: 'Kiambu Town',
        severity: 3
      },
      {
        title: 'Request for new water connection',
        description: 'We are a new housing estate with 20 units. We need water connection to our estate. Please advise on the process.',
        category: 'service_request',
        priority: 'low',
        status: 'submitted',
        reporter_name: 'Hassan Mohammed',
        reporter_phone: '+254745678901',
        latitude: -4.0435,
        longitude: 39.6682,
        county: 'Mombasa',
        ward: 'Mombasa Island',
        severity: 4
      }
    ];

    for (let i = 0; i < sampleReports.length; i++) {
      const r = sampleReports[i];
      const reportNumber = `RPT-${new Date().getFullYear()}-${String(i + 1).padStart(5, '0')}`;
      
      await db.query(
        `INSERT INTO reports (
          report_number, title, description, category, priority, status,
          reporter_name, reporter_email, reporter_phone, is_anonymous,
          latitude, longitude, county, ward, assigned_to,
          submitted_at, acknowledged_at, resolved_at, resolution_notes, severity
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)`,
        [
          reportNumber, r.title, r.description, r.category, r.priority, r.status,
          r.reporter_name, r.reporter_email || null, r.reporter_phone || null, r.is_anonymous || false,
          r.latitude, r.longitude, r.county, r.ward, r.assigned_to || null,
          new Date(Date.now() - Math.floor(Math.random() * 14) * 24 * 60 * 60 * 1000),
          r.status === 'acknowledged' || r.status === 'in_progress' || r.status === 'resolved' ? new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000) : null,
          r.resolved_at || null, r.resolution_notes || null, r.severity
        ]
      );
    }
    console.log(`✅ Seeded ${sampleReports.length} sample citizen reports`);

    console.log('\n🎉 Enhanced Citizen Reports migrations completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Report migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runReportMigrations();
