import axios from 'axios';

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
