import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken }, { withCredentials: true });
        if (res.data?.data?.accessToken) {
          const { accessToken, refreshToken: newRefresh } = res.data.data;
          const user = useAuthStore.getState().user;
          useAuthStore.getState().setAuth(user, accessToken, newRefresh);
          
          original.headers.Authorization = `Bearer ${accessToken}`;
        }
        return api(original);
      } catch {
        useAuthStore.getState().clearUser();
        window.location.href = '/login';
      }
    }
    if (error.response?.status === 403 && error.response?.data?.code === 'MUST_CHANGE_PASSWORD') {
      window.location.href = '/change-password';
    }
    return Promise.reject(error);
  }
);

export default api;
