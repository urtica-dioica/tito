// Request Hooks for TITO HR Management System

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RequestService } from '../services/requestService';
import type { RequestListParams, RequestStats } from '../services/requestService';

export const useRequests = (params: RequestListParams = {}) => {
  return useQuery({
    queryKey: ['requests', params],
    queryFn: () => RequestService.getRequests(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useRequestStats = () => {
  return useQuery<RequestStats>({
    queryKey: ['requests', 'stats'],
    queryFn: RequestService.getRequestStats,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useRequest = (id: string) => {
  return useQuery({
    queryKey: ['requests', id],
    queryFn: () => RequestService.getRequest(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useApproveRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => RequestService.approveRequest(id),
    onSuccess: () => {
      // Invalidate and refetch requests
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    },
  });
};

export const useRejectRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => 
      RequestService.rejectRequest(id, reason),
    onSuccess: () => {
      // Invalidate and refetch requests
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    },
  });
};
