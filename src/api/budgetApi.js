import api from './axios';

export const budgetApi = {
  getQuarterly: (params) => api.get('/budget/quarterly', { params }),
  createQuarterly: (data) => api.post('/budget/quarterly', data),
  getCurrentQuarter: () => api.get('/budget/quarterly/current'),
  getUsage: () => api.get('/budget/quarterly/usage'),
};
