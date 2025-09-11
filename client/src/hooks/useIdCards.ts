import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import IdCardService from '../services/idCardService';
import type { CreateIdCardRequest, IdCardListParams } from '../types';

// Query Keys
export const idCardKeys = {
  all: ['idCards'] as const,
  lists: () => [...idCardKeys.all, 'list'] as const,
  list: (params: IdCardListParams) => [...idCardKeys.lists(), params] as const,
  details: () => [...idCardKeys.all, 'detail'] as const,
  detail: (id: string) => [...idCardKeys.details(), id] as const,
  stats: () => [...idCardKeys.all, 'stats'] as const,
  qrCode: (id: string) => [...idCardKeys.all, 'qrCode', id] as const,
};

// Hooks for ID Cards
export const useIdCards = (params?: IdCardListParams) => {
  return useQuery({
    queryKey: idCardKeys.list(params || {}),
    queryFn: () => IdCardService.getIdCards(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useIdCard = (id: string) => {
  return useQuery({
    queryKey: idCardKeys.detail(id),
    queryFn: () => IdCardService.getIdCard(id),
    enabled: !!id,
  });
};

export const useIdCardStats = () => {
  return useQuery({
    queryKey: idCardKeys.stats(),
    queryFn: () => IdCardService.getIdCardStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useQrCodeData = (idCardId: string) => {
  return useQuery({
    queryKey: idCardKeys.qrCode(idCardId),
    queryFn: () => IdCardService.getQrCodeData(idCardId),
    enabled: !!idCardId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Mutations
export const useCreateIdCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateIdCardRequest) => IdCardService.createIdCard(data),
    onSuccess: () => {
      // Invalidate and refetch ID cards list
      queryClient.invalidateQueries({ queryKey: idCardKeys.lists() });
      queryClient.invalidateQueries({ queryKey: idCardKeys.stats() });
    },
  });
};

export const useDeactivateIdCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => IdCardService.deactivateIdCard(id),
    onSuccess: (_, id) => {
      // Invalidate specific ID card and lists
      queryClient.invalidateQueries({ queryKey: idCardKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: idCardKeys.lists() });
      queryClient.invalidateQueries({ queryKey: idCardKeys.stats() });
    },
  });
};

export const useGenerateDepartmentIdCards = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (departmentId: string) => IdCardService.generateDepartmentIdCards(departmentId),
    onSuccess: () => {
      // Invalidate and refetch ID cards list and stats
      queryClient.invalidateQueries({ queryKey: idCardKeys.lists() });
      queryClient.invalidateQueries({ queryKey: idCardKeys.stats() });
    },
  });
};

