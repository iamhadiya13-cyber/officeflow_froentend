import api from './axios';

export const dashboardApi = {
  getStats: (params) => api.get('/dashboard/stats', { params }),
  getAllStats: (params) => api.get('/dashboard/all-stats', { params }),
  getAllLeave: (params) => api.get('/dashboard/all-leave', { params }),
  getAllExpenseTrend: (params) => api.get('/dashboard/all-expense-trend', { params }),
};
