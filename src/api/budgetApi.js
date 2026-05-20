import api from './axios';

export const budgetApi = {
  getQuarterly: (params) => api.get('/budget/quarterly', { params }),
  createQuarterly: (data) => api.post('/budget/quarterly', data),
  getCurrentQuarter: (params) => api.get('/budget/quarterly/current', { params }),
  getUsage: () => api.get('/budget/quarterly/usage'),
};
