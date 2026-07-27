import axios from 'axios';

// Use the environment variable, or fallback to a default if missing.
// IMPORTANT: You MUST set VITE_API_URL in your Vercel settings to your actual backend URL.
const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const baseURL = rawUrl.replace(/\/+$/, '') + '/api';

console.log('🚀 MajiSmart API configured for:', baseURL);

const api = axios.create({
  baseURL,
  timeout: 15000
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('ms_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  res => res.data,
  err => {
    // Log the exact error to the browser console for debugging
    console.error('❌ API REQUEST FAILED:', {
      url: err.config?.url,
      method: err.config?.method,
      status: err.response?.status,
      errorMessage: err.response?.data?.error || err.message,
      fullError: err
    });

    if (err.response?.status === 401) {
      localStorage.removeItem('ms_token');
      localStorage.removeItem('ms_user');
      window.location.href = '/login';
    }
    return Promise.reject(err.response?.data || err);
  }
);

export default api;
