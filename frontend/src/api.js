import axios from 'axios'

// 1. Determine base URL
let API_URL = import.meta.env.VITE_API_URL || 
  (window.location.hostname === 'localhost' 
    ? 'http://localhost:5000' 
    : 'https://majismartv2.onrender.com')

// 2. Force /api suffix to prevent 404s
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
    console.log(`📤 Request: ${config.method.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => {
    console.log(`✅ Response: ${response.status} from ${response.config.url}`)
    return response.data
  },
  (error) => {
    console.error('❌ API Error:', error)
    if (error.code === 'ECONNABORTED') return Promise.reject(new Error('Request timed out.'))
    if (!error.response) return Promise.reject(new Error('Network error: Cannot reach server. Check backend URL.'))
    if (error.response.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
    return Promise.reject(error)
  }
)

export default api
