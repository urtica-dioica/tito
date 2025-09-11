import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EmployeeBenefitService } from '../services/employeeBenefitService';
import type { 
  CreateEmployeeBenefitRequest, 
  UpdateEmployeeBenefitRequest 
} from '../types';

// Query keys
export const employeeBenefitKeys = {
  all: ['employeeBenefits'] as const,
  lists: () => [...employeeBenefitKeys.all, 'list'] as const,
  list: (params: any) => [...employeeBenefitKeys.lists(), params] as const,
  details: () => [...employeeBenefitKeys.all, 'detail'] as const,
  detail: (id: string) => [...employeeBenefitKeys.details(), id] as const,
  byEmployee: (employeeId: string) => [...employeeBenefitKeys.all, 'employee', employeeId] as const,
  activeByEmployee: (employeeId: string) => [...employeeBenefitKeys.all, 'employee', employeeId, 'active'] as const,
};

// Hooks for employee benefits
export const useEmployeeBenefits = (params?: {
  page?: number;
  limit?: number;
  employeeId?: string;
  benefitTypeId?: string;
  isActive?: boolean;
  search?: string;
}) => {
  return useQuery({
    queryKey: employeeBenefitKeys.list(params),
    queryFn: () => EmployeeBenefitService.getEmployeeBenefits(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useEmployeeBenefit = (id: string) => {
  return useQuery({
    queryKey: employeeBenefitKeys.detail(id),
    queryFn: () => EmployeeBenefitService.getEmployeeBenefit(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useEmployeeBenefitsByEmployee = (employeeId: string) => {
  return useQuery({
    queryKey: employeeBenefitKeys.byEmployee(employeeId),
    queryFn: () => EmployeeBenefitService.getEmployeeBenefitsByEmployee(employeeId),
    enabled: !!employeeId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useActiveEmployeeBenefitsByEmployee = (employeeId: string) => {
  return useQuery({
    queryKey: employeeBenefitKeys.activeByEmployee(employeeId),
    queryFn: () => EmployeeBenefitService.getActiveEmployeeBenefitsByEmployee(employeeId),
    enabled: !!employeeId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateEmployeeBenefit = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateEmployeeBenefitRequest) => 
      EmployeeBenefitService.createEmployeeBenefit(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: employeeBenefitKeys.lists() });
      queryClient.invalidateQueries({ queryKey: employeeBenefitKeys.byEmployee(variables.employeeId) });
      queryClient.invalidateQueries({ queryKey: employeeBenefitKeys.activeByEmployee(variables.employeeId) });
    },
  });
};

export const useUpdateEmployeeBenefit = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEmployeeBenefitRequest }) => 
      EmployeeBenefitService.updateEmployeeBenefit(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: employeeBenefitKeys.lists() });
      queryClient.invalidateQueries({ queryKey: employeeBenefitKeys.detail(id) });
      // Invalidate employee-specific queries if we have the employee ID
      queryClient.invalidateQueries({ queryKey: employeeBenefitKeys.all });
    },
  });
};

export const useDeleteEmployeeBenefit = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => EmployeeBenefitService.deleteEmployeeBenefit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeBenefitKeys.lists() });
      queryClient.invalidateQueries({ queryKey: employeeBenefitKeys.all });
    },
  });
};

export const useUploadEmployeeBenefits = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (csvData: any[]) => EmployeeBenefitService.uploadEmployeeBenefits(csvData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeBenefitKeys.lists() });
      queryClient.invalidateQueries({ queryKey: employeeBenefitKeys.all });
    },
  });
};
