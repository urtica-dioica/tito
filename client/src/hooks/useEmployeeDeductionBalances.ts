import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EmployeeDeductionBalanceService } from '../services/employeeDeductionBalanceService';
import type { 
  CreateEmployeeDeductionBalanceRequest, 
  UpdateEmployeeDeductionBalanceRequest,
  EmployeeDeductionBalanceCSVRow
} from '../types';

// Query keys
export const employeeDeductionBalanceKeys = {
  all: ['employeeDeductionBalances'] as const,
  lists: () => [...employeeDeductionBalanceKeys.all, 'list'] as const,
  list: (params: any) => [...employeeDeductionBalanceKeys.lists(), params] as const,
  details: () => [...employeeDeductionBalanceKeys.all, 'detail'] as const,
  detail: (id: string) => [...employeeDeductionBalanceKeys.details(), id] as const,
  byEmployee: (employeeId: string) => [...employeeDeductionBalanceKeys.all, 'employee', employeeId] as const,
  activeByEmployee: (employeeId: string) => [...employeeDeductionBalanceKeys.all, 'employee', employeeId, 'active'] as const,
};

// Hooks for employee deduction balances
export const useEmployeeDeductionBalances = (params?: {
  page?: number;
  limit?: number;
  employeeId?: string;
  deductionTypeId?: string;
  isActive?: boolean;
  search?: string;
}) => {
  return useQuery({
    queryKey: employeeDeductionBalanceKeys.list(params),
    queryFn: () => EmployeeDeductionBalanceService.getEmployeeDeductionBalances(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useEmployeeDeductionBalance = (id: string) => {
  return useQuery({
    queryKey: employeeDeductionBalanceKeys.detail(id),
    queryFn: () => EmployeeDeductionBalanceService.getEmployeeDeductionBalance(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useEmployeeDeductionBalancesByEmployee = (employeeId: string) => {
  return useQuery({
    queryKey: employeeDeductionBalanceKeys.byEmployee(employeeId),
    queryFn: () => EmployeeDeductionBalanceService.getEmployeeDeductionBalancesByEmployee(employeeId),
    enabled: !!employeeId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useActiveEmployeeDeductionBalancesByEmployee = (employeeId: string) => {
  return useQuery({
    queryKey: employeeDeductionBalanceKeys.activeByEmployee(employeeId),
    queryFn: () => EmployeeDeductionBalanceService.getActiveEmployeeDeductionBalancesByEmployee(employeeId),
    enabled: !!employeeId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateEmployeeDeductionBalance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateEmployeeDeductionBalanceRequest) => 
      EmployeeDeductionBalanceService.createEmployeeDeductionBalance(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: employeeDeductionBalanceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: employeeDeductionBalanceKeys.byEmployee(variables.employeeId) });
      queryClient.invalidateQueries({ queryKey: employeeDeductionBalanceKeys.activeByEmployee(variables.employeeId) });
    },
  });
};

export const useUpdateEmployeeDeductionBalance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEmployeeDeductionBalanceRequest }) => 
      EmployeeDeductionBalanceService.updateEmployeeDeductionBalance(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: employeeDeductionBalanceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: employeeDeductionBalanceKeys.detail(id) });
      // Invalidate employee-specific queries if we have the employee ID
      queryClient.invalidateQueries({ queryKey: employeeDeductionBalanceKeys.all });
    },
  });
};

export const useDeleteEmployeeDeductionBalance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => EmployeeDeductionBalanceService.deleteEmployeeDeductionBalance(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeDeductionBalanceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: employeeDeductionBalanceKeys.all });
    },
  });
};

export const useUploadEmployeeDeductionBalances = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (csvData: EmployeeDeductionBalanceCSVRow[]) => 
      EmployeeDeductionBalanceService.uploadEmployeeDeductionBalances(csvData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeDeductionBalanceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: employeeDeductionBalanceKeys.all });
    },
  });
};
