import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveApi } from '../api/leaveApi';
import toast from 'react-hot-toast';

export const useLeaveTypes = () => {
  return useQuery({
    queryKey: ['leave-types'],
    queryFn: () => leaveApi.getTypes().then(r => r.data.data),
    staleTime: 10 * 60 * 1000,
  });
};

export const useLeaveBalances = (userId = '') => {
  return useQuery({
    queryKey: ['leave-balances', userId],
    queryFn: () => leaveApi.getBalances(userId).then(r => r.data.data),
    staleTime: 2 * 60 * 1000,
  });
};

export const useAddExtraLeaves = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, data }) => leaveApi.addExtraLeaves(userId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leave-balances'] });
      toast.success('Extra leaves added');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });
};

export const useAdjustExtraLeaves = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, data }) => leaveApi.adjustExtraLeaves(userId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leave-balances'] });
      toast.success('Leave balance adjusted');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });
};

export const useAddExtraLeavesBulk = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => leaveApi.addExtraLeavesBulk(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leave-balances'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Leave days added');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });
};

export const useLeaveRequests = (params) => {
  return useQuery({
    queryKey: ['leave-requests', params],
    queryFn: () => leaveApi.getRequests(params).then(r => r.data),
    enabled: !!params,
  });
};

export const useCreateLeave = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => leaveApi.createRequest(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leave-requests'] });
      qc.invalidateQueries({ queryKey: ['leave-balances'] });
      toast.success('Leave request submitted');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });
};

export const useDeleteLeave = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => leaveApi.deleteRequest(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leave-requests'] });
      toast.success('Leave request deleted');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });
};

export const useReviewLeave = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => leaveApi.reviewRequest(id, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['leave-requests'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(`Leave ${vars.data.status}`);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });
};

export const useOtherLeaveRequests = (params) => {
  return useQuery({
    queryKey: ['other-leave-requests', params],
    queryFn: () => leaveApi.getOtherRequests(params).then(r => r.data),
    enabled: !!params,
  });
};

export const useCreateOtherLeave = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => leaveApi.createOtherRequest(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['other-leave-requests'] });
      toast.success('Other leave request submitted');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });
};

export const useReviewOtherLeave = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => leaveApi.reviewOtherRequest(id, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['other-leave-requests'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(`Other Leave ${vars.data.status}`);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });
};
