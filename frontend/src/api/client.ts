import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const resolveApiAssetUrl = (assetUrl?: string) => {
  if (!assetUrl || !assetUrl.startsWith('/api/v1/')) return assetUrl || '/logo.png';
  try {
    const apiOrigin = new URL(api.defaults.baseURL || window.location.origin, window.location.origin).origin;
    return new URL(assetUrl, apiOrigin).toString();
  } catch {
    return assetUrl;
  }
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('maraayn_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Let the browser add the multipart boundary when uploading FormData.
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    config.headers.delete('Content-Type');
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

