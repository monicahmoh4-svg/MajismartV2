  const handleSubmitReport = async (e) => {
    e.preventDefault()
    if (!newReport.title.trim() || !newReport.description.trim() || !newReport.category) {
      alert('❌ Please fill in all required fields (Title, Description, Category)')
      return
    }
    
    setSubmitting(true)
    try {
      console.log('📡 Sending report to backend:', newReport)
      
      const response = await api.post('/reports-enhanced', {
        ...newReport,
        latitude: newReport.latitude ? parseFloat(newReport.latitude) : null,
        longitude: newReport.longitude ? parseFloat(newReport.longitude) : null
      })
      
      console.log('✅ Backend response:', response)
      alert(`✅ Report submitted successfully!\n\nYour report number is: ${response.report_number}\n\nPlease save this number for tracking.`)
      
      setShowSubmitModal(false)
      setNewReport({
        title: '', description: '', category: 'leak', priority: 'medium',
        reporter_name: '', reporter_email: '', reporter_phone: '',
        latitude: '', longitude: '', address: '', county: '', ward: '',
        is_anonymous: false
      })
      fetchReports()
      fetchStats()
    } catch (err) {
      console.error('❌ Report submission error:', err)
      console.error('❌ Full error object:', JSON.stringify(err, null, 2))
      
      let errorMessage = 'Unknown error'
      if (err.response) {
        // The request was made and the server responded with a status code
        errorMessage = err.response.data?.message || err.response.data?.error || err.response.data?.details || `Server error: ${err.response.status}`
      } else if (err.request) {
        // The request was made but no response was received
        errorMessage = 'Network error: No response from server. Check your internet connection or backend URL.'
      } else {
        // Something happened in setting up the request
        errorMessage = err.message
      }
      
      alert(`❌ Failed to submit report:\n\n${errorMessage}\n\nPlease open Browser Console (F12) for full details.`)
    } finally {
      setSubmitting(false)
    }
  }
