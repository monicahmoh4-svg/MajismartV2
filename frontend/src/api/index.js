import axios from 'axios'

// Get API URL from env, with fallback
const API_URL = import.meta.env.VITE_API_URL || 'https://majismartv2.onrender.com'

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add token to requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem('ms_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle responses and errors
api.interceptors.response.use(
  res => res.data,
  err => {
    // Log detailed error for debugging
    console.error('API Error:', {
      url: err.config?.url,
      method: err.config?.method,
      status: err.response?.status,
      message: err.response?.data?.error || err.message
    })

    // Clear auth on 401
    if (err.response?.status === 401) {
      localStorage.removeItem('ms_token')
      localStorage.removeItem('ms_user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    return Promise.reject(err.response?.data || { error: err.message || 'Network error' })
  }
)

export default api
