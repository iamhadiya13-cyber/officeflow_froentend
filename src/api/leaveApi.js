import api from './axios';

export const leaveApi = {
  getTypes: () => api.get('/leave/types'),
  getBalances: (userId = '') => userId ? api.get(`/leave/balances/${userId}`) : api.get('/leave/balances'),
  addExtraLeaves: (userId, data) => api.put(`/leave/balance/${userId}/extra`, data),
  addExtraLeavesBulk: (data) => api.put('/leave/balances/bulk-extra', data),
  adjustExtraLeaves: (userId, data) => api.put(`/leave/balance/${userId}/adjust`, data),
  getRequests: (params) => api.get('/leave/requests', { params }),
  createRequest: (data) => api.post('/leave/requests', data),
  deleteRequest: (id) => api.delete(`/leave/requests/${id}`),
  reviewRequest: (id, data) => api.put(`/leave/requests/${id}/review`, data),
  
  getOtherRequests: (params) => api.get('/leave/other-requests', { params }),
  createOtherRequest: (data) => api.post('/leave/other-requests', data),
  reviewOtherRequest: (id, data) => api.put(`/leave/other-requests/${id}/review`, data),
};
