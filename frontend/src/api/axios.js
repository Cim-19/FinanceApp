import axios from 'axios';
import useAuthStore from '../store/authStore';
import { clearUserDataCaches } from '../utils/clearAppCaches';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL:         BASE,
  withCredentials: true,
});

// ── Request: adjuntar access token ───────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response: manejar 401 → intentar refresh ─────────────────────────────────
let isRefreshing  = false;
let failedQueue   = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

// Pide un accessToken nuevo usando la cookie httpOnly de refresh. Se usa tanto
// en el interceptor de 401 como en el bootstrap inicial de App.jsx.
export async function refreshAccessToken() {
  const { data } = await axios.post(`${BASE}/auth/refresh`, {}, { withCredentials: true });
  const newToken = data.data.accessToken;
  useAuthStore.getState().setAuth(useAuthStore.getState().user, newToken);
  return newToken;
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => failedQueue.push({ resolve, reject }))
        .then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
    }

    original._retry  = true;
    isRefreshing     = true;

    try {
      const newToken = await refreshAccessToken();
      processQueue(null, newToken);
      original.headers.Authorization = `Bearer ${newToken}`;
      return api(original);
    } catch (refreshError) {
      processQueue(refreshError, null);
      useAuthStore.getState().clearAuth();
      clearUserDataCaches().finally(() => { window.location.href = '/login'; });
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
