import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { KioskService } from '../services/kioskService';
import type { SessionType } from '../services/kioskService';
// import type { KioskEmployee, KioskAttendanceRecord } from '../services/kioskService';

// Query Keys
export const kioskKeys = {
  all: ['kiosk'] as const,
  employee: (qrCode: string) => [...kioskKeys.all, 'employee', qrCode] as const,
  lastAttendance: (employeeId: string) => [...kioskKeys.all, 'lastAttendance', employeeId] as const,
  attendanceHistory: (employeeId: string) => [...kioskKeys.all, 'attendanceHistory', employeeId] as const,
  nextSession: (employeeId: string) => [...kioskKeys.all, 'nextSession', employeeId] as const,
  todaySummary: (employeeId: string) => [...kioskKeys.all, 'todaySummary', employeeId] as const,
};

// Hooks for Kiosk Operations
export const useVerifyEmployeeByQR = (qrCode: string, enabled: boolean = false) => {
  return useQuery({
    queryKey: kioskKeys.employee(qrCode),
    queryFn: () => KioskService.verifyEmployeeByQR(qrCode),
    enabled: enabled && !!qrCode,
    retry: false,
    staleTime: 0, // Always fetch fresh data
  });
};

export const useLastAttendance = (employeeId: string, enabled: boolean = false) => {
  return useQuery({
    queryKey: kioskKeys.lastAttendance(employeeId),
    queryFn: () => KioskService.getLastAttendance(employeeId),
    enabled: enabled && !!employeeId,
    staleTime: 0, // Always fetch fresh data
  });
};

export const useAttendanceHistory = (employeeId: string, limit: number = 10, enabled: boolean = false) => {
  return useQuery({
    queryKey: [...kioskKeys.attendanceHistory(employeeId), limit],
    queryFn: () => KioskService.getAttendanceHistory(employeeId, limit),
    enabled: enabled && !!employeeId,
    staleTime: 0, // Always fetch fresh data
  });
};

export const useRecordAttendance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: {
      employeeId: string;
      type: 'clock_in' | 'clock_out';
      location: string;
      qrCodeData: string;
      selfieUrl?: string;
    }) => KioskService.recordAttendance(data),
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: kioskKeys.lastAttendance(data.employeeId) });
      queryClient.invalidateQueries({ queryKey: kioskKeys.attendanceHistory(data.employeeId) });
    },
  });
};

// New time-based attendance hooks
export const useNextExpectedSession = (employeeId: string, enabled: boolean = false) => {
  return useQuery({
    queryKey: kioskKeys.nextSession(employeeId),
    queryFn: () => KioskService.getNextExpectedSession(employeeId),
    enabled: enabled && !!employeeId,
    staleTime: 0, // Always fetch fresh data
  });
};

export const useTodayAttendanceSummary = (employeeId: string, enabled: boolean = false) => {
  return useQuery({
    queryKey: kioskKeys.todaySummary(employeeId),
    queryFn: () => KioskService.getTodayAttendanceSummary(employeeId),
    enabled: enabled && !!employeeId,
    staleTime: 0, // Always fetch fresh data
  });
};

export const useRecordTimeBasedAttendance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: {
      employeeId: string;
      sessionType: SessionType;
      location: string;
      qrCodeData: string;
      selfieUrl?: string;
    }) => KioskService.recordTimeBasedAttendance(data),
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: kioskKeys.lastAttendance(data.employeeId) });
      queryClient.invalidateQueries({ queryKey: kioskKeys.attendanceHistory(data.employeeId) });
      queryClient.invalidateQueries({ queryKey: kioskKeys.nextSession(data.employeeId) });
      queryClient.invalidateQueries({ queryKey: kioskKeys.todaySummary(data.employeeId) });
    },
  });
};

export const useValidateAttendanceAction = () => {
  return useMutation({
    mutationFn: ({ employeeId, sessionType }: { employeeId: string; sessionType: SessionType }) =>
      KioskService.validateAttendanceAction(employeeId, sessionType),
  });
};
