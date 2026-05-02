import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expenseApi } from '../api/expenseApi';
import toast from 'react-hot-toast';

export const useExpenses = (params) => {
  return useQuery({
    queryKey: ['expenses', params],
    queryFn: async () => {
      const res = await expenseApi.getExpenses(params);
      const body = res.data;
      // Normalize: the backend returns { success, message, data, meta }
      return {
        data: body.data || [],
        meta: body.meta || null,
      };
    },
    enabled: !!params,
  });
};

export const useExpenseById = (id) => {
  return useQuery({
    queryKey: ['expenses', id],
    queryFn: () => expenseApi.getExpense(id).then(r => r.data.data),
    enabled: !!id,
  });
};

export const useExpenseYears = () => {
  return useQuery({
    queryKey: ['expense-years'],
    queryFn: () => expenseApi.getYears().then(r => r.data.data || []),
    staleTime: 10 * 60 * 1000,
  });
};

export const useQuarterSnapshots = (params) => {
  return useQuery({
    queryKey: ['quarter-snapshots', params],
    queryFn: () => expenseApi.getQuarterSnapshots(params).then(r => r.data.data || []),
    enabled: !!params,
    staleTime: 2 * 60 * 1000,
  });
};

export const usePersonSummary = (params) => {
  return useQuery({
    queryKey: ['person-summary', params],
    queryFn: () => expenseApi.getPersonSummary(params).then(r => r.data.data),
    enabled: !!params?.employee_ids,
    staleTime: 60 * 1000,
  });
};

export const useCreateExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => expenseApi.createExpense(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['person-summary'] });
      if (res.data?.warning) {
        toast(res.data.warning.message, { icon: '⚠️', style: { background: '#fef3c7', color: '#92400e' } });
      } else {
        toast.success('Expense submitted');
      }
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to submit expense'),
  });
};

export const useUpdateExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => expenseApi.updateExpense(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['person-summary'] });
      toast.success('Expense updated');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update expense'),
  });
};

export const useArchiveExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => expenseApi.archiveExpense(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Expense archived');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to archive'),
  });
};

export const useDeleteExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => expenseApi.deleteExpense(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['person-summary'] });
      toast.success('Expense deleted');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete'),
  });
};

export const useRestoreExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => expenseApi.restoreExpense(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense restored');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to restore'),
  });
};

export const useSettleExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => expenseApi.settleExpense(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['person-summary'] });
      qc.invalidateQueries({ queryKey: ['settlements'] });
      qc.invalidateQueries({ queryKey: ['settlement-employees'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to toggle settle status'),
  });
};

export const useSettleMonth = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => expenseApi.settleMonth(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['settlements'] });
      toast.success(res.data.message);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to settle month'),
  });
};

export const useBatchSettleExpenses = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => expenseApi.batchSettle(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['person-summary'] });
      qc.invalidateQueries({ queryKey: ['settlements'] });
      toast.success(res.data?.message || 'Batch settlement successful');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to batch update expenses'),
  });
};

export const useSettlements = (params) => {
  return useQuery({
    queryKey: ['settlements', params],
    queryFn: async () => {
      const res = await expenseApi.getSettlements(params);
      const body = res.data;
      return {
        data: body.data || [],
        meta: body.meta || null,
      };
    },
    enabled: !!params,
    staleTime: 60 * 1000,
  });
};

export const useSettlePreview = (params) => {
  return useQuery({
    queryKey: ['settle-preview', params],
    queryFn: () => expenseApi.getSettlePreview(params).then(r => r.data.data),
    enabled: !!params?.employee_ids && !!params?.month && !!params?.year,
    staleTime: 30 * 1000,
  });
};
