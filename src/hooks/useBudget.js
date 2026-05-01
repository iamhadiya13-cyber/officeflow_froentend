import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { budgetApi } from '../api/budgetApi';
import toast from 'react-hot-toast';

export const useBudgetUsage = () => {
  return useQuery({
    queryKey: ['budget-usage'],
    queryFn: () => budgetApi.getUsage().then(r => r.data.data),
    staleTime: 2 * 60 * 1000,
  });
};

export const useCurrentBudget = () => {
  return useQuery({
    queryKey: ['current-budget'],
    queryFn: () => budgetApi.getCurrentQuarter().then(r => r.data.data),
    staleTime: 2 * 60 * 1000,
  });
};

export const useQuarterlyBudgets = (params) => {
  return useQuery({
    queryKey: ['quarterly-budgets', params],
    queryFn: () => budgetApi.getQuarterly(params).then(r => r.data.data),
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateBudget = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => budgetApi.createQuarterly(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quarterly-budgets'] });
      qc.invalidateQueries({ queryKey: ['budget-usage'] });
      toast.success('Budget updated');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });
};
