import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DepartmentHeadService } from '../services/departmentHeadService';
import type { Department } from '../types';

// Department Info
export const useDepartmentInfo = () => {
  return useQuery<Department>({
    queryKey: ['departmentHead', 'department'],
    queryFn: DepartmentHeadService.getDepartmentInfo,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Employee Statistics
export const useDepartmentHeadEmployeeStats = () => {
  return useQuery({
    queryKey: ['departmentHead', 'employeeStats'],
    queryFn: DepartmentHeadService.getEmployeeStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Department Employees
export const useDepartmentHeadEmployees = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive' | 'terminated' | 'on_leave';
}) => {
  return useQuery({
    queryKey: ['departmentHead', 'employees', params],
    queryFn: () => DepartmentHeadService.getEmployees(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Employee Performance Statistics
export const useDepartmentHeadEmployeePerformance = () => {
  return useQuery({
    queryKey: ['departmentHead', 'employeePerformance'],
    queryFn: DepartmentHeadService.getEmployeePerformanceStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Department Requests
export const useDepartmentHeadRequests = (params?: {
  page?: number;
  limit?: number;
  type?: 'time_correction' | 'overtime' | 'leave';
  status?: 'pending' | 'approved' | 'rejected';
}) => {
  return useQuery({
    queryKey: ['departmentHead', 'requests', params],
    queryFn: () => DepartmentHeadService.getRequests(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Request Statistics
export const useDepartmentHeadRequestStats = () => {
  return useQuery({
    queryKey: ['departmentHead', 'requestStats'],
    queryFn: DepartmentHeadService.getRequestStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Approve Request Mutation
export const useApproveRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: DepartmentHeadService.approveRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departmentHead', 'requests'] });
      queryClient.invalidateQueries({ queryKey: ['departmentHead', 'requestStats'] });
    },
  });
};

// Reject Request Mutation
export const useRejectRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, reason }: { requestId: string; reason?: string }) =>
      DepartmentHeadService.rejectRequest(requestId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departmentHead', 'requests'] });
      queryClient.invalidateQueries({ queryKey: ['departmentHead', 'requestStats'] });
    },
  });
};

// Payroll Periods
export const useDepartmentHeadPayrollPeriods = () => {
  return useQuery({
    queryKey: ['departmentHead', 'payrollPeriods'],
    queryFn: DepartmentHeadService.getPayrollPeriods,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Payroll Records for a specific period
export const useDepartmentHeadPayrollRecords = (periodId: string) => {
  return useQuery({
    queryKey: ['departmentHead', 'payrollRecords', periodId],
    queryFn: () => DepartmentHeadService.getPayrollRecords(periodId),
    enabled: !!periodId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Payroll Statistics
export const useDepartmentHeadPayrollStats = () => {
  return useQuery({
    queryKey: ['departmentHead', 'payrollStats'],
    queryFn: DepartmentHeadService.getPayrollStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
