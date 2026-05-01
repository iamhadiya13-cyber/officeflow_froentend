import api from './axios';

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  refresh: () => api.post('/auth/refresh'),
  changePassword: (data) => api.put('/auth/change-password', data),
};
