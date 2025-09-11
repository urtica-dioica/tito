import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BenefitTypeService } from '../services/benefitTypeService';
import type { 
  CreateBenefitTypeRequest, 
  UpdateBenefitTypeRequest 
} from '../types';

// Query keys
export const benefitTypeKeys = {
  all: ['benefitTypes'] as const,
  lists: () => [...benefitTypeKeys.all, 'list'] as const,
  list: (params: any) => [...benefitTypeKeys.lists(), params] as const,
  details: () => [...benefitTypeKeys.all, 'detail'] as const,
  detail: (id: string) => [...benefitTypeKeys.details(), id] as const,
  active: () => [...benefitTypeKeys.all, 'active'] as const,
};

// Hooks for benefit types
export const useBenefitTypes = (params?: {
  page?: number;
  limit?: number;
  isActive?: boolean;
  search?: string;
}) => {
  return useQuery({
    queryKey: benefitTypeKeys.list(params),
    queryFn: () => BenefitTypeService.getBenefitTypes(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useBenefitType = (id: string) => {
  return useQuery({
    queryKey: benefitTypeKeys.detail(id),
    queryFn: () => BenefitTypeService.getBenefitType(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useActiveBenefitTypes = () => {
  return useQuery({
    queryKey: benefitTypeKeys.active(),
    queryFn: () => BenefitTypeService.getActiveBenefitTypes(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateBenefitType = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateBenefitTypeRequest) => BenefitTypeService.createBenefitType(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: benefitTypeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: benefitTypeKeys.active() });
    },
  });
};

export const useUpdateBenefitType = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBenefitTypeRequest }) => 
      BenefitTypeService.updateBenefitType(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: benefitTypeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: benefitTypeKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: benefitTypeKeys.active() });
    },
  });
};

export const useDeleteBenefitType = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => BenefitTypeService.deleteBenefitType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: benefitTypeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: benefitTypeKeys.active() });
    },
  });
};
