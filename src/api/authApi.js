import api from './axios';

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  logout: (data) => api.post('/auth/logout', data),
  refresh: () => api.post('/auth/refresh'),
  changePassword: (data) => api.put('/auth/change-password', data),
};
