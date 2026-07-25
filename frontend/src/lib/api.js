import axios from 'axios';

// Remove any trailing slashes from the environment variable to prevent double-slash URLs
const baseURL = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace(/\/+$/, '') 
  : 'http://localhost:5000';

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add a request interceptor to attach tokens if needed
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Add a response interceptor to catch network errors clearly
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      console.error('NETWORK ERROR: Cannot reach backend at', baseURL);
      console.error('Check that VITE_API_URL is correct and the backend is running.');
    }
    return Promise.reject(error);
  }
);

export default api;
