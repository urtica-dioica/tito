import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LeaveBalanceService, type LeaveBalanceListParams, type CreateLeaveBalanceData, type UpdateLeaveBalanceData, type BulkLeaveBalanceData, type InitializationData } from '../services/leaveBalanceService';

// Query Keys
export const leaveBalanceKeys = {
  all: ['leaveBalances'] as const,
  lists: () => [...leaveBalanceKeys.all, 'list'] as const,
  list: (params: LeaveBalanceListParams) => [...leaveBalanceKeys.lists(), params] as const,
  details: () => [...leaveBalanceKeys.all, 'detail'] as const,
  detail: (id: string) => [...leaveBalanceKeys.details(), id] as const,
  stats: (departmentId?: string, year?: number) => [...leaveBalanceKeys.all, 'stats', departmentId, year] as const,
  employee: (employeeId: string, year?: number) => [...leaveBalanceKeys.all, 'employee', employeeId, year] as const,
  templates: () => [...leaveBalanceKeys.all, 'templates'] as const,
  withoutBalances: (year: number, departmentId?: string) => [...leaveBalanceKeys.all, 'withoutBalances', year, departmentId] as const,
};

/**
 * Hook to list leave balances with filtering and pagination
 */
export const useLeaveBalances = (params: LeaveBalanceListParams = {}) => {
  return useQuery({
    queryKey: leaveBalanceKeys.list(params),
    queryFn: () => LeaveBalanceService.listLeaveBalances(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook to get leave balance by ID
 */
export const useLeaveBalance = (id: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: leaveBalanceKeys.detail(id),
    queryFn: () => LeaveBalanceService.getLeaveBalance(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to get leave balance statistics
 */
export const useLeaveBalanceStats = (departmentId?: string, year?: number) => {
  return useQuery({
    queryKey: leaveBalanceKeys.stats(departmentId, year),
    queryFn: () => LeaveBalanceService.getLeaveBalanceStats(departmentId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to get employee leave balances
 */
export const useEmployeeLeaveBalances = (employeeId: string, year?: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: leaveBalanceKeys.employee(employeeId, year),
    queryFn: () => LeaveBalanceService.getEmployeeLeaveBalances(employeeId),
    enabled: enabled && !!employeeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to get leave balance templates
 */
export const useLeaveBalanceTemplates = () => {
  return useQuery({
    queryKey: leaveBalanceKeys.templates(),
    queryFn: () => LeaveBalanceService.getLeaveBalanceTemplates(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook to get employees without leave balances
 */
export const useEmployeesWithoutLeaveBalances = (year: number, departmentId?: string) => {
  return useQuery({
    queryKey: leaveBalanceKeys.withoutBalances(year, departmentId),
    queryFn: () => LeaveBalanceService.getEmployeesWithoutLeaveBalances(departmentId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to create leave balance
 */
export const useCreateLeaveBalance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateLeaveBalanceData) => LeaveBalanceService.createLeaveBalance(data),
    onSuccess: () => {
      // Invalidate all leave balance queries
      queryClient.invalidateQueries({ queryKey: leaveBalanceKeys.all });
    },
  });
};

/**
 * Hook to update leave balance
 */
export const useUpdateLeaveBalance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLeaveBalanceData }) => 
      LeaveBalanceService.updateLeaveBalance(id, data),
    onSuccess: (_, { id }) => {
      // Invalidate specific leave balance and all lists
      queryClient.invalidateQueries({ queryKey: leaveBalanceKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: leaveBalanceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leaveBalanceKeys.stats() });
    },
  });
};

/**
 * Hook to delete leave balance
 */
export const useDeleteLeaveBalance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => LeaveBalanceService.deleteLeaveBalance(id),
    onSuccess: () => {
      // Invalidate all leave balance queries
      queryClient.invalidateQueries({ queryKey: leaveBalanceKeys.all });
    },
  });
};

/**
 * Hook to bulk update leave balances
 */
export const useBulkUpdateLeaveBalances = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (balances: BulkLeaveBalanceData[]) => LeaveBalanceService.bulkUpdateLeaveBalances(balances),
    onSuccess: () => {
      // Invalidate all leave balance queries
      queryClient.invalidateQueries({ queryKey: leaveBalanceKeys.all });
    },
  });
};

/**
 * Hook to initialize year leave balances
 */
export const useInitializeYearLeaveBalances = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: InitializationData) => LeaveBalanceService.initializeLeaveBalances(data),
    onSuccess: () => {
      // Invalidate all leave balance queries
      queryClient.invalidateQueries({ queryKey: leaveBalanceKeys.all });
    },
  });
};

