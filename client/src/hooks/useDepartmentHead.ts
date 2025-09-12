import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DepartmentHeadService, type DepartmentHeadDashboard } from '../services/departmentHeadService';
import type { Department } from '../types';
import { useAuth } from '../contexts/AuthContext';

// Dashboard
export const useDepartmentHeadDashboard = () => {
  const { user } = useAuth();
  return useQuery<DepartmentHeadDashboard>({
    queryKey: ['departmentHead', 'dashboard', user?.id],
    queryFn: DepartmentHeadService.getDashboard,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!user?.id, // Only run query if user is available
  });
};

// Department Info
export const useDepartmentInfo = () => {
  const { user } = useAuth();
  return useQuery<Department>({
    queryKey: ['departmentHead', 'department', user?.id],
    queryFn: DepartmentHeadService.getDepartmentInfo,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!user?.id, // Only run query if user is available
  });
};

// Employee Statistics
export const useDepartmentHeadEmployeeStats = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['departmentHead', 'employeeStats', user?.id],
    queryFn: DepartmentHeadService.getEmployeeStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!user?.id, // Only run query if user is available
  });
};

// Department Employees
export const useDepartmentHeadEmployees = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive' | 'terminated' | 'on_leave';
}) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['departmentHead', 'employees', user?.id, params],
    queryFn: () => DepartmentHeadService.getEmployees(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!user?.id, // Only run query if user is available
  });
};

// Employee Performance Statistics
export const useDepartmentHeadEmployeePerformance = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['departmentHead', 'employeePerformance', user?.id],
    queryFn: DepartmentHeadService.getEmployeePerformanceStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!user?.id, // Only run query if user is available
  });
};

// Department Requests
export const useDepartmentHeadRequests = (params?: {
  page?: number;
  limit?: number;
  type?: 'time_correction' | 'overtime' | 'leave';
  status?: 'pending' | 'approved' | 'rejected';
}) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['departmentHead', 'requests', user?.id, params],
    queryFn: () => DepartmentHeadService.getRequests(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!user?.id, // Only run query if user is available
  });
};

// Request Statistics
export const useDepartmentHeadRequestStats = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['departmentHead', 'requestStats', user?.id],
    queryFn: DepartmentHeadService.getRequestStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!user?.id, // Only run query if user is available
  });
};

// Approve Request Mutation
export const useApproveRequest = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: DepartmentHeadService.approveRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departmentHead', 'requests', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['departmentHead', 'requestStats', user?.id] });
    },
  });
};

// Reject Request Mutation
export const useRejectRequest = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: ({ requestId, reason }: { requestId: string; reason?: string }) =>
      DepartmentHeadService.rejectRequest(requestId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departmentHead', 'requests', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['departmentHead', 'requestStats', user?.id] });
    },
  });
};

// Payroll Periods
export const useDepartmentHeadPayrollPeriods = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['departmentHead', 'payrollPeriods', user?.id],
    queryFn: DepartmentHeadService.getPayrollPeriods,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!user?.id, // Only run query if user is available
  });
};

// Payroll Records for a specific period
export const useDepartmentHeadPayrollRecords = (periodId: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['departmentHead', 'payrollRecords', user?.id, periodId],
    queryFn: () => DepartmentHeadService.getPayrollRecords(periodId),
    enabled: !!periodId && !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Payroll Statistics
export const useDepartmentHeadPayrollStats = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['departmentHead', 'payrollStats', user?.id],
    queryFn: DepartmentHeadService.getPayrollStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!user?.id, // Only run query if user is available
  });
};

// Payroll Approvals
export const useDepartmentHeadPayrollApprovals = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['departmentHead', 'payrollApprovals', user?.id],
    queryFn: DepartmentHeadService.getPayrollApprovals,
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!user?.id, // Only run query if user is available
  });
};

// Approve Payroll Approval
export const useApprovePayrollApproval = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ approvalId, status, comments }: { 
      approvalId: string; 
      status: 'approved' | 'rejected'; 
      comments?: string; 
    }) => DepartmentHeadService.approvePayrollApproval(approvalId, status, comments),
    onSuccess: () => {
      // Invalidate and refetch payroll approvals
      queryClient.invalidateQueries({ queryKey: ['departmentHead', 'payrollApprovals'] });
      // Also invalidate payroll periods to update approval status
      queryClient.invalidateQueries({ queryKey: ['departmentHead', 'payrollPeriods'] });
    },
  });
};

