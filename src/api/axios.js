import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        await axios.post('/api/auth/refresh', {}, { withCredentials: true });
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
