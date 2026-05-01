import api from './axios';

export const userApi = {
  getUsers: (params) => api.get('/users/all', { params }),
  getEmployeeList: () => api.get('/users/employees'),
  createUser: (data) => api.post('/users', data),
  getUser: (id) => api.get(`/users/${id}`),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`),
};
