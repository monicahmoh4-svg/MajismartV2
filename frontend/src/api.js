import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 
  (window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api' 
    : 'https://majismartv2.onrender.com/api')

console.log('🌐 MajiSmart API connecting to:', API_URL)

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
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
  (error) => Promise.reject(error)
)

// Response interceptor - handle errors gracefully
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('⏱️ Request timeout')
      return Promise.reject(new Error('Request timed out. Please try again.'))
    }
    
    if (!error.response) {
      console.error('🌐 Network error - cannot reach server at', API_URL)
      return Promise.reject(new Error('Network error. Please check your internet connection.'))
    }
    
    // ✅ Handle 401 Unauthorized - clear state but DON'T hard redirect
    if (error.response.status === 401) {
      console.warn('⚠️ 401 Unauthorized - clearing auth state')
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      // Don't do window.location.href redirect - let React Router handle it
    }
    
    return Promise.reject(error.response.data || error.response)
  }
)

export default api
