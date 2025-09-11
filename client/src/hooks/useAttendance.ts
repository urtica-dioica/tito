import { useQuery } from '@tanstack/react-query';
import { AttendanceService } from '../services/attendanceService';

// Query keys
export const attendanceKeys = {
  all: ['attendance'] as const,
  recent: (limit: number) => [...attendanceKeys.all, 'recent', limit] as const,
  stats: () => [...attendanceKeys.all, 'stats'] as const,
  detail: (id: string) => [...attendanceKeys.all, 'detail', id] as const,
};

/**
 * Hook to fetch recent attendance records
 */
export const useRecentAttendance = (limit: number = 10) => {
  return useQuery({
    queryKey: attendanceKeys.recent(limit),
    queryFn: () => AttendanceService.getRecentAttendance(limit),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds for real-time updates
  });
};

/**
 * Hook to fetch attendance statistics
 */
export const useAttendanceStats = () => {
  return useQuery({
    queryKey: attendanceKeys.stats(),
    queryFn: () => AttendanceService.getAttendanceStats(),
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000, // Refetch every minute
  });
};

/**
 * Hook to fetch daily attendance records
 */
export const useDailyAttendance = (limit: number = 10, date?: string) => {
  return useQuery({
    queryKey: [...attendanceKeys.all, 'daily', limit, date],
    queryFn: () => AttendanceService.getDailyAttendance(limit, date),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds for real-time updates
  });
};

/**
 * Hook to fetch attendance record sessions
 */
export const useAttendanceRecordSessions = (attendanceRecordId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: [...attendanceKeys.all, 'record-sessions', attendanceRecordId],
    queryFn: () => AttendanceService.getAttendanceRecordSessions(attendanceRecordId),
    enabled: enabled && !!attendanceRecordId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to fetch detailed attendance record
 */
export const useAttendanceDetail = (id: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: attendanceKeys.detail(id),
    queryFn: () => AttendanceService.getAttendanceDetail(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
