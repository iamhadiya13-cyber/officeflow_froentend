import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tripApi } from '../api/tripApi';
import toast from 'react-hot-toast';

export const useTrips = (params) => {
  return useQuery({
    queryKey: ['trips', params],
    queryFn: () => tripApi.getTrips(params).then(r => r.data),
    enabled: !!params,
  });
};

export const useTripDetail = (id) => {
  return useQuery({
    queryKey: ['trip', id],
    queryFn: () => tripApi.getTrip(id).then(r => r.data.data),
    enabled: !!id,
  });
};

export const useCreateTrip = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => tripApi.createTrip(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trips'] });
      toast.success('Trip request submitted');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });
};

export const useCancelTrip = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => tripApi.cancelTrip(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trips'] });
      toast.success('Trip cancelled');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });
};

export const useReviewTrip = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => tripApi.reviewTrip(id, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['trips'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(`Trip ${vars.data.status}`);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });
};

export const useCompleteTrip = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => tripApi.completeTrip(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trips'] });
      toast.success('Trip completed');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });
};
