import axios from 'axios';

// 1. Get URL from env, or fallback to your actual Render backend URL
const RAW_URL = import.meta.env.VITE_API_URL || 'https://majismartv2.onrender.com';

// 2. Clean the URL (remove any trailing slashes)
const CLEAN_URL = RAW_URL.replace(/\/+$/, '');

// 3. Create Axios instance
const api = axios.create({
  baseURL: `${CLEAN_URL}/api`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// DEBUG: Check your browser console (F12) to see this message
console.log(' MajiSmart API connecting to:', `${CLEAN_URL}/api`);

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ms_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Distinguish between "Server Unreachable" and "Server Error"
    if (error.code === 'ERR_NETWORK' || !error.response) {
      console.error(' NETWORK ERROR: Cannot reach backend server.');
      console.error('Target URL:', error.config?.url);
      console.error('Check if backend is running and VITE_API_URL is correct.');
    } else {
      console.error(' API Error:', error.response.status, error.response.data);
    }

    // Handle Session Expiry
    if (error.response?.status === 401) {
      localStorage.removeItem('ms_token');
      localStorage.removeItem('ms_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error.response?.data || { error: 'Network error. Please check your connection.' });
  }
);

export default api;
