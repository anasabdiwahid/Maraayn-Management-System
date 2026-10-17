import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('maraayn_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't auto-redirect if already on login page
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('maraayn_access_token');
        localStorage.removeItem('maraayn_refresh_token');
        localStorage.removeItem('maraayn_user');
        localStorage.removeItem('maraayn_tenant');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;

