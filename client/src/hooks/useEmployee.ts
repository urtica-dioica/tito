import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EmployeeService } from '../services/employeeService';
// import type { 
//   EmployeeDashboard, 
//   AttendanceRecord, 
//   AttendanceSummary, 
//   LeaveBalance, 
//   Request,
//   RequestStats
// } from '../services/employeeService';

// Query Keys
export const employeeKeys = {
  all: ['employee'] as const,
  dashboard: () => [...employeeKeys.all, 'dashboard'] as const,
  attendance: {
    all: () => [...employeeKeys.all, 'attendance'] as const,
    history: (params: any) => [...employeeKeys.attendance.all(), 'history', params] as const,
    stats: (params: any) => [...employeeKeys.attendance.all(), 'stats', params] as const,
    status: () => [...employeeKeys.attendance.all(), 'status'] as const,
  },
  leave: {
    all: () => [...employeeKeys.all, 'leave'] as const,
    balance: (year?: number) => [...employeeKeys.leave.all(), 'balance', year] as const,
    requests: (params: any) => [...employeeKeys.leave.all(), 'requests', params] as const,
  },
  requests: {
    all: () => [...employeeKeys.all, 'requests'] as const,
    list: (params: any) => [...employeeKeys.requests.all(), 'list', params] as const,
    stats: () => [...employeeKeys.requests.all(), 'stats'] as const,
    timeCorrections: (params: any) => [...employeeKeys.requests.all(), 'timeCorrections', params] as const,
    overtime: (params: any) => [...employeeKeys.requests.all(), 'overtime', params] as const,
  },
  payroll: {
    all: () => [...employeeKeys.all, 'payroll'] as const,
    paystubs: (params: any) => [...employeeKeys.payroll.all(), 'paystubs', params] as const,
    latest: () => [...employeeKeys.payroll.all(), 'latest'] as const,
  },
};

// Dashboard Hooks
export const useEmployeeDashboard = () => {
  return useQuery({
    queryKey: employeeKeys.dashboard(),
    queryFn: () => EmployeeService.getDashboard(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Attendance Hooks
export const useAttendanceHistory = (params: {
  month?: string;
} = {}) => {
  return useQuery({
    queryKey: employeeKeys.attendance.history(params),
    queryFn: () => EmployeeService.getAttendanceHistory(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useAttendanceSummary = (params: {
  month?: string;
} = {}) => {
  return useQuery({
    queryKey: employeeKeys.attendance.stats(params),
    queryFn: () => EmployeeService.getAttendanceSummary(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Removed useCurrentAttendanceStatus - endpoint doesn't exist
// Attendance status is available through useEmployeeDashboard

export const useClockIn = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: {
      qrCodeHash?: string;
      selfieImagePath?: string;
      timestamp?: string;
    }) => EmployeeService.clockIn(data),
    onSuccess: () => {
      // Invalidate attendance-related queries
      queryClient.invalidateQueries({ queryKey: employeeKeys.attendance.all() });
      queryClient.invalidateQueries({ queryKey: employeeKeys.dashboard() });
    },
  });
};

export const useClockOut = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: {
      qrCodeHash?: string;
      selfieImagePath?: string;
      timestamp?: string;
    }) => EmployeeService.clockOut(data),
    onSuccess: () => {
      // Invalidate attendance-related queries
      queryClient.invalidateQueries({ queryKey: employeeKeys.attendance.all() });
      queryClient.invalidateQueries({ queryKey: employeeKeys.dashboard() });
    },
  });
};

// Leave Hooks
export const useLeaveBalance = (year?: number) => {
  return useQuery({
    queryKey: employeeKeys.leave.balance(year),
    queryFn: () => EmployeeService.getLeaveBalance(year),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useLeaveRequests = (params: {
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
} = {}) => {
  return useQuery({
    queryKey: employeeKeys.leave.requests(params),
    queryFn: () => EmployeeService.getLeaveRequests(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useCreateLeaveRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: {
      leaveType: 'vacation' | 'sick' | 'maternity' | 'other';
      startDate: string;
      endDate: string;
      reason: string;
    }) => EmployeeService.createLeaveRequest(data),
    onSuccess: () => {
      // Invalidate leave-related queries
      queryClient.invalidateQueries({ queryKey: employeeKeys.leave.all() });
      queryClient.invalidateQueries({ queryKey: employeeKeys.dashboard() });
    },
  });
};

// Request Hooks
export const useTimeCorrectionRequests = (params: {
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
} = {}) => {
  return useQuery({
    queryKey: employeeKeys.requests.timeCorrections(params),
    queryFn: () => EmployeeService.getTimeCorrectionRequests(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useOvertimeRequests = (params: {
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
} = {}) => {
  return useQuery({
    queryKey: employeeKeys.requests.overtime(params),
    queryFn: () => EmployeeService.getOvertimeRequests(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useCreateTimeCorrectionRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: {
      correctionDate: string;
      sessionType: 'morning' | 'afternoon' | 'full_day';
      requestedClockIn?: string;
      requestedClockOut?: string;
      reason: string;
    }) => EmployeeService.createTimeCorrectionRequest(data),
    onSuccess: () => {
      // Invalidate request-related queries
      queryClient.invalidateQueries({ queryKey: employeeKeys.requests.all() });
      queryClient.invalidateQueries({ queryKey: employeeKeys.dashboard() });
    },
  });
};

export const useCreateOvertimeRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: {
      overtimeDate: string;
      startTime: string;
      endTime: string;
      reason: string;
    }) => EmployeeService.createOvertimeRequest(data),
    onSuccess: () => {
      // Invalidate request-related queries
      queryClient.invalidateQueries({ queryKey: employeeKeys.requests.all() });
      queryClient.invalidateQueries({ queryKey: employeeKeys.dashboard() });
    },
  });
};

// Request Hooks
export const useEmployeeRequests = (params: {
  type?: string;
  status?: string;
  limit?: number;
  offset?: number;
} = {}) => {
  return useQuery({
    queryKey: employeeKeys.requests.list(params),
    queryFn: () => EmployeeService.getEmployeeRequests(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useRequestStats = () => {
  return useQuery({
    queryKey: employeeKeys.requests.stats(),
    queryFn: () => EmployeeService.getRequestStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Payroll Hooks
export const useEmployeePaystubs = (params: {
  year?: number;
  month?: number;
  page?: number;
  limit?: number;
} = {}) => {
  return useQuery({
    queryKey: employeeKeys.payroll.paystubs(params),
    queryFn: () => EmployeeService.getPaystubs(params),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useLatestPaystub = () => {
  return useQuery({
    queryKey: employeeKeys.payroll.latest(),
    queryFn: () => EmployeeService.getLatestPaystub(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};
