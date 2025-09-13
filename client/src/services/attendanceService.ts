import { apiMethods } from '../lib/api';

export interface RecentAttendanceRecord {
  id: string;
  sessionType: string;
  clockIn: string | null;
  clockOut: string | null;
  createdAt: string;
  selfieImageUrl?: string;
  date: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  departmentName: string;
  action: string;
  timestamp: string;
}

export interface AttendanceDetail extends RecentAttendanceRecord {
  regularHours?: number;
  overtimeHours?: number;
  lateMinutes?: number;
  lateHours?: number;
  position?: string;
}

export interface AttendanceStats {
  totalEmployeesToday: number;
  clockInsToday: number;
  clockOutsToday: number;
  completedSessionsToday: number;
}

export interface DailyAttendanceRecord {
  attendanceRecordId: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  departmentName: string;
  position: string;
  date: string;
  overallStatus: string;
  morningIn: string | null;
  morningOut: string | null;
  afternoonIn: string | null;
  afternoonOut: string | null;
  totalHours: number;
}

export interface AttendanceSession {
  id: string;
  sessionType: string;
  clockIn: string | null;
  clockOut: string | null;
  createdAt: string;
  selfieImagePath: string | null;
  calculatedHours: number | string;
  lateHours: number | string;
  status: string;
}

export interface AttendanceRecordSessions {
  attendanceRecordId: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  position: string;
  departmentName: string;
  date: string;
  overallStatus: string;
  sessions: AttendanceSession[];
}

export class AttendanceService {
  /**
   * Get recent attendance records for dashboard
   */
  static async getRecentAttendance(limit: number = 10): Promise<RecentAttendanceRecord[]> {
    const response = await apiMethods.get<RecentAttendanceRecord[]>(`/attendance/recent?limit=${limit}`);
    return response.data || [];
  }

  /**
   * Get attendance statistics for dashboard
   */
  static async getAttendanceStats(): Promise<AttendanceStats> {
    const response = await apiMethods.get<AttendanceStats>('/attendance/stats');
    if (!response.data) {
      throw new Error('Failed to fetch attendance stats');
    }
    return response.data;
  }

  /**
   * Get daily attendance records for dashboard
   */
  static async getDailyAttendance(limit: number = 10, date?: string): Promise<DailyAttendanceRecord[]> {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    if (date) {
      params.append('date', date);
    }

    const response = await apiMethods.get<DailyAttendanceRecord[]>(`/attendance/daily?${params.toString()}`);
    return response.data || [];
  }

  /**
   * Get all sessions for an attendance record
   */
  static async getAttendanceRecordSessions(attendanceRecordId: string): Promise<AttendanceRecordSessions> {
    const response = await apiMethods.get<AttendanceRecordSessions>(`/attendance/record/${attendanceRecordId}/sessions`);
    if (!response.data) {
      throw new Error('Failed to fetch attendance record sessions');
    }
    return response.data;
  }

  /**
   * Get detailed attendance record by ID
   */
  static async getAttendanceDetail(id: string): Promise<AttendanceDetail> {
    const response = await apiMethods.get<AttendanceDetail>(`/attendance/${id}`);
    if (!response.data) {
      throw new Error('Failed to fetch attendance detail');
    }
    return response.data;
  }
}
