import axios from 'axios'

// Single canonical API client. All pages must import from '../api' or '../../api'.
let API_URL = import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : 'https://majismartv2.onrender.com')

if (!API_URL.endsWith('/api')) {
  API_URL = API_URL.replace(/\/$/, '') + '/api'
}

const isDev = import.meta.env.DEV
if (isDev) console.log('MajiSmart API:', API_URL)

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
    if (error.code === 'ECONNABORTED') return Promise.reject(new Error('Request timed out. Check connection and retry.'))
    if (!error.response) return Promise.reject(new Error('Cannot reach MajiSmart server. Check network or try *384*99# USSD fallback.'))
    if (error.response.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
    const msg = error.response.data?.error || error.message
    return Promise.reject(new Error(msg))
  }
)

export default api
export { API_URL }
