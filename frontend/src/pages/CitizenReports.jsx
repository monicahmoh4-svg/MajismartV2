const handleSubmitReport = async (e) => {
  e.preventDefault()
  
  // Debug: Log the form data
  console.log('📝 Submitting report with data:', newReport)
  
  // Validate required fields
  if (!newReport.title.trim()) {
    alert('❌ Please enter a title for your report')
    return
  }
  if (!newReport.description.trim()) {
    alert('❌ Please provide a description')
    return
  }
  if (!newReport.category) {
    alert('❌ Please select an issue category')
    return
  }
  
  try {
    console.log('📡 Sending request to /api/reports-enhanced...')
    
    const payload = {
      title: newReport.title,
      description: newReport.description,
      category: newReport.category,
      priority: newReport.priority,
      reporter_name: newReport.is_anonymous ? null : newReport.reporter_name,
      reporter_email: newReport.is_anonymous ? null : newReport.reporter_email,
      reporter_phone: newReport.is_anonymous ? null : newReport.reporter_phone,
      is_anonymous: newReport.is_anonymous,
      latitude: newReport.latitude ? parseFloat(newReport.latitude) : null,
      longitude: newReport.longitude ? parseFloat(newReport.longitude) : null,
      address: newReport.address || null,
      county: newReport.county || null,
      ward: newReport.ward || null
    }
    
    console.log('📦 Payload:', payload)
    
    const response = await api.post('/reports-enhanced', payload)
    
    console.log('✅ Response received:', response)
    
    alert(`✅ Report submitted successfully!\n\nYour report number is: ${response.report_number}\n\nPlease save this number for tracking.`)
    setShowSubmitModal(false)
    resetForm()
    fetchReports()
    fetchStats()
  } catch (err) {
    console.error('❌ Report submission error:', err)
    console.error('Error details:', err?.response?.data || err?.message || err)
    
    const errorMessage = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Unknown error'
    alert(`❌ Failed to submit report: ${errorMessage}\n\nPlease check the browser console (F12) for more details.`)
  }
}
