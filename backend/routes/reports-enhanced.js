// POST /api/reports-enhanced - Submit new report
router.post('/', async (req, res) => {
  console.log('📥 POST /api/reports-enhanced - Received request')
  console.log('Request body:', req.body)
  
  try {
    if (!(await tableExists('reports'))) {
      console.error('❌ Reports table does not exist')
      return res.status(503).json({ error: 'Reports system not available. Please run migration first.' })
    }

    const {
      title, description, category, priority,
      reporter_name, reporter_email, reporter_phone, is_anonymous,
      latitude, longitude, address, county, ward,
      asset_id
    } = req.body;

    console.log('📋 Extracted fields:', { title, description, category, priority })

    if (!title || !description || !category) {
      console.error('❌ Missing required fields:', { title: !!title, description: !!description, category: !!category })
      return res.status(400).json({ 
        error: 'title, description, and category are required',
        received: { title, description, category }
      })
    }

    const reportNumber = generateReportNumber()
    console.log('🔢 Generated report number:', reportNumber)

    const { rows } = await db.query(
      `INSERT INTO reports (
        report_number, title, description, category, priority,
        reporter_name, reporter_email, reporter_phone, is_anonymous,
        latitude, longitude, address, county, ward, asset_id
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      RETURNING *`,
      [
        reportNumber, title, description, category, priority || 'medium',
        is_anonymous ? 'Anonymous' : reporter_name, reporter_email, reporter_phone, is_anonymous || false,
        latitude, longitude, address, county, ward, asset_id
      ]
    )

    console.log('✅ Report created successfully:', rows[0].id)

    res.status(201).json({ 
      message: 'Report submitted successfully', 
      report: rows[0],
      report_number: reportNumber
    })
  } catch (error) {
    console.error('❌ Report create error:', error)
    console.error('Error stack:', error.stack)
    res.status(500).json({ error: 'Failed to submit report', message: error.message })
  }
})
