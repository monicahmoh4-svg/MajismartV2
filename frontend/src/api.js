import axios from 'axios'

// Determine base URL
let API_URL = import.meta.env.VITE_API_URL || 
  (window.location.hostname === 'localhost' 
    ? 'http://localhost:5000' 
    : 'https://majismartv2.onrender.com')

// ✅ CRITICAL FIX: Force the /api suffix to prevent 404s
if (!API_URL.endsWith('/api')) {
  API_URL = API_URL.replace(/\/$/, '') + '/api'
}

console.log('🌐 MajiSmart API connecting to:', API_URL)

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.code === 'ECONNABORTED') return Promise.reject(new Error('Request timed out.'))
    if (!error.response) return Promise.reject(new Error('Network error.'))
    if (error.response.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
    return Promise.reject(error.response.data || error.response)
  }
)

export default api
