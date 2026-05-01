import api from './axios';
import axios from 'axios';

export const exportApi = {
  expensesExcel: async (filters) => {
    const params = new URLSearchParams();
    if (filters.employee_ids?.length) params.set('employee_ids', filters.employee_ids);
    if (filters.month) params.set('month', filters.month);
    if (filters.year) params.set('year', filters.year);
    if (filters.expense_type) params.set('expense_type', filters.expense_type);
    if (filters.is_settled !== undefined && filters.is_settled !== '') params.set('is_settled', filters.is_settled);
    if (filters.search) params.set('search', filters.search);
    
    const response = await api.get(`/export/expenses/excel?${params.toString()}`, {
      responseType: 'blob'
    });
    
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    const now = new Date();
    a.download = `expenses-${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}.xlsx`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
  
  leaveExcel: async () => {
    const response = await api.get('/export/leave/excel', { responseType: 'blob' });
    const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leave-${Date.now()}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
  
  tripsExcel: async () => {
    const response = await api.get('/export/trips/excel', { responseType: 'blob' });
    const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trips-${Date.now()}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};
