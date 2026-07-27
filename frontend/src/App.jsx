import axios from 'axios'

// Determine the correct API URL based on environment
const API_URL = import.meta.env.VITE_API_URL || 
  (window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api' 
    : 'https://majismartv2.onrender.com/api')

console.log('🌐 MajiSmart API connecting to:', API_URL)

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - attach auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - handle errors gracefully
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Provide meaningful error messages
    if (error.code === 'ECONNABORTED') {
      console.error('⏱️ Request timeout - server took too long to respond')
      return Promise.reject(new Error('Request timed out. Please try again.'))
    }
    
    if (!error.response) {
      console.error('🌐 Network error - cannot reach server at', API_URL)
      return Promise.reject(new Error('Network error. Please check your internet connection or try again later.'))
    }
    
    // Handle 401 Unauthorized - token expired
    if (error.response.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    
    return Promise.reject(error.response.data || error.response)
  }
)

export default api
