import api from './axios';

export const expenseApi = {
  getPersonSummary: (params) => api.get('/expenses/person-summary', { params }),
  getExpenses: (params) => api.get('/expenses', { params }),
  getYears: () => api.get('/expenses/years'),
  getQuarterSnapshots: (params) => api.get('/expenses/quarter-snapshots', { params }),
  createExpense: (data) => api.post('/expenses', data),
  getExpense: (id) => api.get(`/expenses/${id}`),
  updateExpense: (id, data) => api.put(`/expenses/${id}`, data),
  archiveExpense: (id, data) => api.put(`/expenses/${id}/archive`, data),
  deleteExpense: (id) => api.delete(`/expenses/${id}`),
  restoreExpense: (id) => api.put(`/expenses/${id}/restore`),
  settleExpense: (id) => api.put(`/expenses/${id}/settle`),
  batchSettle: (data) => api.patch('/expenses/settlements/batch', data),
  settleMonth: (data) => api.post(`/expenses/settle-month`, data),
  getSettlePreview: (params) => api.get('/expenses/settle-preview', { params }),
  getSettlements: (params) => api.get(`/expenses/settlements`, { params }),
  getArchivedExpenses: (params) => api.get('/expenses/archived', { params }),
  getSummary: (params) => api.get('/expenses/summary', { params }),
  getTeamTotal: () => api.get('/expenses/team-total'),
  getSettlementEmployees: (params) => api.get('/expenses/settlement-employees', { params }),
};
