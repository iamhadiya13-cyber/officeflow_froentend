import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import toast from 'react-hot-toast';

const API_URL = '/deliveries'; // Relative to baseURL in api/axios

export const useDeliveries = (month) => {
  return useQuery({
    queryKey: ['deliveries', month],
    queryFn: async () => {
      const { data } = await api.get(`${API_URL}?month=${month}`);
      return data;
    },
    enabled: !!month,
  });
};

export const useUpdateDailyDelivery = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post(API_URL, payload);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      toast.success('Delivery updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update delivery');
    },
  });
};

export const useDeleteDailyDelivery = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (date) => {
      const { data } = await api.delete(`${API_URL}/${date}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      toast.success('Delivery deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete delivery');
    },
  });
};

export const useUpdateDeliveryPrice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post(`${API_URL}/price`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      toast.success('Prices updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update prices');
    },
  });
};
