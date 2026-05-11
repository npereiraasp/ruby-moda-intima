import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  timeout: 15000,
});

// Attach JWT automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ruby_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle auth errors globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ruby_token');
      localStorage.removeItem('ruby_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
