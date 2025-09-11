import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DeductionTypeService } from '../services/deductionTypeService';
import type { 
  CreateDeductionTypeRequest, 
  UpdateDeductionTypeRequest 
} from '../types';

// Query keys
export const deductionTypeKeys = {
  all: ['deductionTypes'] as const,
  lists: () => [...deductionTypeKeys.all, 'list'] as const,
  list: (params: any) => [...deductionTypeKeys.lists(), params] as const,
  details: () => [...deductionTypeKeys.all, 'detail'] as const,
  detail: (id: string) => [...deductionTypeKeys.details(), id] as const,
  active: () => [...deductionTypeKeys.all, 'active'] as const,
};

// Hooks for deduction types
export const useDeductionTypes = (params?: {
  page?: number;
  limit?: number;
  isActive?: boolean;
  search?: string;
}) => {
  return useQuery({
    queryKey: deductionTypeKeys.list(params),
    queryFn: () => DeductionTypeService.getDeductionTypes(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useDeductionType = (id: string) => {
  return useQuery({
    queryKey: deductionTypeKeys.detail(id),
    queryFn: () => DeductionTypeService.getDeductionType(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useActiveDeductionTypes = () => {
  return useQuery({
    queryKey: deductionTypeKeys.active(),
    queryFn: () => DeductionTypeService.getActiveDeductionTypes(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateDeductionType = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateDeductionTypeRequest) => DeductionTypeService.createDeductionType(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deductionTypeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: deductionTypeKeys.active() });
    },
  });
};

export const useUpdateDeductionType = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDeductionTypeRequest }) => 
      DeductionTypeService.updateDeductionType(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: deductionTypeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: deductionTypeKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: deductionTypeKeys.active() });
    },
  });
};

export const useDeleteDeductionType = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => DeductionTypeService.deleteDeductionType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deductionTypeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: deductionTypeKeys.active() });
    },
  });
};
