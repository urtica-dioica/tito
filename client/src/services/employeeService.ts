import { apiMethods } from '../lib/api';

export interface EmployeeDashboard {
  employee: {
    id: string;
    name: string;
    employeeId: string;
    department: string;
    position: string;
    hireDate: string;
    profilePicture?: string;
  };
  attendance: {
    todayStatus: 'present' | 'absent' | 'late' | 'half_day';
    clockInTime?: string;
    clockOutTime?: string;
    totalHours?: number;
    monthlyPresent: number;
    monthlyAbsent: number;
    monthlyLate: number;
  };
  leaveBalance: {
    vacation: number;
    sick: number;
    maternity: number;
    other: number;
  };
  recentActivity: Array<{
    id: string;
    type: 'clock_in' | 'clock_out' | 'request_submitted' | 'request_approved' | 'request_rejected';
    description: string;
    timestamp: string;
    status?: 'success' | 'warning' | 'error';
  }>;
  pendingRequests: number;
  upcomingEvents: Array<{
    id: string;
    title: string;
    date: string;
    type: 'holiday' | 'meeting' | 'deadline';
  }>;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  totalHours: number | null;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'holiday';
  overtimeHours?: number;
  notes?: string;
}

export interface AttendanceSummary {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  totalHours: number;
  averageHours: number;
  overtimeHours: number;
}

export interface LeaveBalance {
  vacation: { total: number; used: number; available: number };
  sick: { total: number; used: number; available: number };
  maternity: { total: number; used: number; available: number };
  other: { total: number; used: number; available: number };
}

export interface Request {
  id: string;
  type: 'time_correction' | 'overtime' | 'leave';
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  approverName?: string;
  approvedAt?: string;
  rejectionReason?: string;
  details: any;
}

export interface RequestStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export class EmployeeService {
  /**
   * Get employee dashboard data
   */
  static async getDashboard(): Promise<EmployeeDashboard> {
    const response = await apiMethods.get('/employee/dashboard');
    return (response as any).data;
  }

  /**
   * Get employee attendance history
   */
  static async getAttendanceHistory(params: {
    month?: string;
  } = {}): Promise<AttendanceRecord[]> {
    const response = await apiMethods.get('/employee/attendance/history', { params });
    return (response as any).data;
  }

  /**
   * Get employee attendance summary
   */
  static async getAttendanceSummary(params: {
    month?: string;
  } = {}): Promise<AttendanceSummary> {
    const response = await apiMethods.get('/employee/attendance/summary', { params });
    return (response as any).data;
  }

  // Removed getCurrentStatus - endpoint doesn't exist
  // Current attendance status is available through getDashboard()

  /**
   * Clock in
   */
  static async clockIn(data: {
    qrCodeHash?: string;
    selfieImagePath?: string;
    timestamp?: string;
  }): Promise<{ success: boolean; message: string }> {
    const response = await apiMethods.post('/attendance/clock-in', data);
    return (response as any).data;
  }

  /**
   * Clock out
   */
  static async clockOut(data: {
    qrCodeHash?: string;
    selfieImagePath?: string;
    timestamp?: string;
  }): Promise<{ success: boolean; message: string }> {
    const response = await apiMethods.post('/attendance/clock-out', data);
    return (response as any).data;
  }

  /**
   * Get leave balance
   */
  static async getLeaveBalance(year?: number): Promise<LeaveBalance> {
    const response = await apiMethods.get('/leaves/balance', { 
      params: year ? { year } : {} 
    });
    return (response as any).data;
  }

  /**
   * Get employee leave requests
   */
  static async getLeaveRequests(params: {
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    requests: Request[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const response = await apiMethods.get('/leaves/employee', { params });
    return (response as any).data;
  }

  /**
   * Get time correction requests
   */
  static async getTimeCorrectionRequests(params: {
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    requests: Request[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const response = await apiMethods.get('/time-corrections/employee', { params });
    return (response as any).data;
  }

  /**
   * Get overtime requests
   */
  static async getOvertimeRequests(params: {
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    requests: Request[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const response = await apiMethods.get('/overtime/employee', { params });
    return (response as any).data;
  }

  /**
   * Create leave request
   */
  static async createLeaveRequest(data: {
    leaveType: 'vacation' | 'sick' | 'maternity' | 'other';
    startDate: string;
    endDate: string;
    reason: string;
  }): Promise<{ success: boolean; message: string; requestId?: string }> {
    const response = await apiMethods.post('/leaves', data);
    return (response as any).data;
  }

  /**
   * Create time correction request
   */
  static async createTimeCorrectionRequest(data: {
    correctionDate: string;
    sessionType: 'morning' | 'afternoon' | 'full_day';
    requestedClockIn?: string;
    requestedClockOut?: string;
    reason: string;
  }): Promise<{ success: boolean; message: string; requestId?: string }> {
    const response = await apiMethods.post('/time-corrections', data);
    return (response as any).data;
  }

  /**
   * Create overtime request
   */
  static async createOvertimeRequest(data: {
    overtimeDate: string;
    startTime: string;
    endTime: string;
    reason: string;
  }): Promise<{ success: boolean; message: string; requestId?: string }> {
    const response = await apiMethods.post('/overtime', data);
    return (response as any).data;
  }

  /**
   * Get employee requests (all types)
   */
  static async getEmployeeRequests(params: {
    type?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<Request[]> {
    const response = await apiMethods.get('/employee/requests', { params });
    return (response as any).data;
  }

  /**
   * Get request statistics
   */
  static async getRequestStats(): Promise<RequestStats> {
    const response = await apiMethods.get('/employee/requests/stats');
    return (response as any).data;
  }

  /**
   * Get employee paystubs
   */
  static async getPaystubs(params: {
    year?: number;
    month?: number;
    page?: number;
    limit?: number;
  } = {}): Promise<any[]> {
    const response = await apiMethods.get('/employee/paystubs', { params });
    return (response as any).data;
  }

  /**
   * Get latest paystub
   */
  static async getLatestPaystub(): Promise<any> {
    const response = await apiMethods.get('/employee/paystubs/latest');
    return (response as any).data;
  }
}