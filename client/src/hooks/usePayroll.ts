import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PayrollService, type CreatePayrollPeriodRequest } from '../services/payrollService';
import type { PayrollRecord, NewPayrollRecord } from '../types';

// Query keys
export const payrollKeys = {
  all: ['payroll'] as const,
  periods: () => [...payrollKeys.all, 'periods'] as const,
  period: (id: string) => [...payrollKeys.periods(), id] as const,
  records: () => [...payrollKeys.all, 'records'] as const,
  record: (id: string) => [...payrollKeys.records(), id] as const,
  newRecords: () => [...payrollKeys.all, 'newRecords'] as const,
  newRecord: (id: string) => [...payrollKeys.newRecords(), id] as const,
  summary: (id: string) => [...payrollKeys.all, 'summary', id] as const,
  stats: () => [...payrollKeys.all, 'stats'] as const,
};

// Hooks for payroll periods
export const usePayrollPeriods = (params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}) => {
  return useQuery({
    queryKey: [...payrollKeys.periods(), params],
    queryFn: () => PayrollService.getPayrollPeriods(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnMount: true, // Always refetch on mount
  });
};

export const usePayrollPeriod = (id: string) => {
  return useQuery({
    queryKey: payrollKeys.period(id),
    queryFn: () => PayrollService.getPayrollPeriods({ page: 1, limit: 1 }).then(data => 
      data.periods.find(period => period.id === id)
    ),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreatePayrollPeriod = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreatePayrollPeriodRequest) => PayrollService.createPayrollPeriod(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.periods() });
      queryClient.invalidateQueries({ queryKey: payrollKeys.stats() });
    },
  });
};

export const useUpdatePayrollPeriod = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreatePayrollPeriodRequest> }) => 
      PayrollService.updatePayrollPeriod(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.periods() });
      queryClient.invalidateQueries({ queryKey: payrollKeys.period(id) });
      queryClient.invalidateQueries({ queryKey: payrollKeys.stats() });
    },
  });
};

export const useDeletePayrollPeriod = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => PayrollService.deletePayrollPeriod(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.periods() });
      queryClient.invalidateQueries({ queryKey: payrollKeys.stats() });
    },
  });
};

// Hooks for payroll records
export const usePayrollRecords = (params?: {
  page?: number;
  limit?: number;
  payrollPeriodId?: string;
  employeeId?: string;
  status?: string;
}) => {
  // Transform camelCase to snake_case for API
  const apiParams = params ? {
    page: params.page,
    limit: params.limit,
    payroll_period_id: params.payrollPeriodId,
    employee_id: params.employeeId,
    status: params.status
  } : undefined;

  return useQuery({
    queryKey: [...payrollKeys.records(), params],
    queryFn: () => PayrollService.getPayrollRecords(apiParams),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
};

export const usePayrollRecord = (id: string) => {
  return useQuery({
    queryKey: payrollKeys.record(id),
    queryFn: () => PayrollService.getPayrollRecord(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdatePayrollRecord = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PayrollRecord> }) => 
      PayrollService.updatePayrollRecord(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.records() });
      queryClient.invalidateQueries({ queryKey: payrollKeys.record(id) });
    },
  });
};

// Hooks for payroll operations
export const useGeneratePayrollRecords = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (periodId: string) => PayrollService.generatePayrollRecords(periodId),
    onSuccess: (_, periodId) => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.records() });
      queryClient.invalidateQueries({ queryKey: payrollKeys.period(periodId) });
      queryClient.invalidateQueries({ queryKey: payrollKeys.summary(periodId) });
    },
  });
};

export const usePayrollSummary = (periodId: string) => {
  return useQuery({
    queryKey: payrollKeys.summary(periodId),
    queryFn: () => PayrollService.getPayrollSummary(periodId),
    enabled: !!periodId,
    staleTime: 5 * 60 * 1000,
  });
};

// Hook for payroll statistics
export const usePayrollStats = () => {
  return useQuery({
    queryKey: payrollKeys.stats(),
    queryFn: () => PayrollService.getPayrollStats(),
    staleTime: 5 * 60 * 1000,
  });
};

// Hooks for new payroll system
export const useNewPayrollRecords = (params?: {
  page?: number;
  limit?: number;
  payrollPeriodId?: string;
  employeeId?: string;
  status?: string;
  search?: string;
}) => {
  return useQuery({
    queryKey: [...payrollKeys.newRecords(), params],
    queryFn: () => PayrollService.getNewPayrollRecords(params),
    staleTime: 5 * 60 * 1000,
  });
};

export const useNewPayrollRecord = (id: string) => {
  return useQuery({
    queryKey: payrollKeys.newRecord(id),
    queryFn: () => PayrollService.getNewPayrollRecord(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateNewPayrollRecord = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<NewPayrollRecord> }) => 
      PayrollService.updateNewPayrollRecord(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.newRecords() });
      queryClient.invalidateQueries({ queryKey: payrollKeys.newRecord(id) });
    },
  });
};

// Hooks for payroll approvals
export const usePayrollApprovals = (params?: {
  page?: number;
  limit?: number;
  payrollPeriodId?: string;
  approverId?: string;
  status?: string;
}) => {
  return useQuery({
    queryKey: [...payrollKeys.all, 'approvals', params],
    queryFn: () => PayrollService.getPayrollApprovals(params),
    staleTime: 5 * 60 * 1000,
  });
};

export const usePayrollApproval = (id: string) => {
  return useQuery({
    queryKey: [...payrollKeys.all, 'approvals', id],
    queryFn: () => PayrollService.getPayrollApproval(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useApprovePayrollApproval = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { status: 'approved' | 'rejected'; comments?: string } }) => 
      PayrollService.approvePayrollApproval(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...payrollKeys.all, 'approvals'] });
    },
  });
};

export const useCreatePayrollApprovals = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payrollPeriodId: string) => PayrollService.createPayrollApprovals(payrollPeriodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...payrollKeys.all, 'approvals'] });
      queryClient.invalidateQueries({ queryKey: payrollKeys.periods() });
    },
  });
};

export const useInitializePayrollPeriods = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => PayrollService.initializePayrollPeriods(),
    onSuccess: () => {
      // Invalidate all payroll periods queries
      queryClient.invalidateQueries({ queryKey: ['payroll', 'periods'] });
      queryClient.invalidateQueries({ queryKey: payrollKeys.periods() });
    },
  });
};

export const useGenerateCurrentMonthPeriod = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => PayrollService.generateCurrentMonthPeriod(),
    onSuccess: () => {
      // Invalidate all payroll periods queries
      queryClient.invalidateQueries({ queryKey: ['payroll', 'periods'] });
      queryClient.invalidateQueries({ queryKey: payrollKeys.periods() });
    },
  });
};

export const useExpectedMonthlyHours = () => {
  return useQuery({
    queryKey: [...payrollKeys.all, 'expected-hours'],
    queryFn: () => PayrollService.getExpectedMonthlyHours(),
    staleTime: 5 * 60 * 1000,
  });
};


// Mutation hooks for payroll records
export const useApprovePayrollRecord = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (recordId: string) => PayrollService.approvePayrollRecord(recordId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.records() });
      queryClient.invalidateQueries({ queryKey: payrollKeys.stats() });
    },
  });
};

export const useMarkPayrollAsPaid = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (recordId: string) => PayrollService.markPayrollAsPaid(recordId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.records() });
      queryClient.invalidateQueries({ queryKey: payrollKeys.stats() });
    },
  });
};
