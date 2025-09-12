import { apiMethods } from '../lib/api';

// Updated interface with session details
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
    morningClockIn?: string;
    morningClockOut?: string;
    afternoonClockIn?: string;
    afternoonClockOut?: string;
    breakStart?: string;
    breakEnd?: string;
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
  vacation: number | { total: number; used: number; available: number };
  sick: number | { total: number; used: number; available: number };
  maternity: number | { total: number; used: number; available: number };
  other: number | { total: number; used: number; available: number };
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

export interface PaystubData {
  id: string;
  periodName: string;
  employeeId: string;
  employeeName: string;
  position: string;
  department: string;
  baseSalary: number;
  totalRegularHours: number;
  totalOvertimeHours: number;
  grossPay: number;
  totalDeductions: number;
  totalBenefits: number;
  netPay: number;
  lateDeductions: number;
  deductions: Array<{
    name: string;
    amount: number;
  }>;
  benefits: Array<{
    name: string;
    amount: number;
  }>;
  createdAt: string;
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
    sessionType: 'morning_in' | 'morning_out' | 'afternoon_in' | 'afternoon_out';
    requestedTime: string;
    reason: string;
  }): Promise<{ success: boolean; message: string; requestId?: string }> {
    // Transform data to match backend expectations
    const backendData = {
      requestDate: data.correctionDate,
      sessionType: data.sessionType,
      requestedTime: data.requestedTime,
      reason: data.reason
    };
    
    const response = await apiMethods.post('/time-corrections', backendData);
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
    // Validate time inputs
    if (!data.startTime || !data.endTime) {
      throw new Error('Start time and end time are required');
    }
    
    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(data.startTime) || !timeRegex.test(data.endTime)) {
      throw new Error('Invalid time format. Please use HH:MM format (e.g., 09:30)');
    }
    
    // Calculate requested hours from start and end times
    const start = new Date(`2000-01-01T${data.startTime}:00`);
    const end = new Date(`2000-01-01T${data.endTime}:00`);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Invalid time format provided');
    }
    
    const requestedHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    
    if (requestedHours <= 0) {
      throw new Error('End time must be after start time');
    }
    
    // Transform data to match backend expectations
    const backendData = {
      requestDate: data.overtimeDate,
      startTime: data.startTime,
      endTime: data.endTime,
      requestedHours: requestedHours,
      reason: data.reason
    };
    
    const response = await apiMethods.post('/overtime', backendData);
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
  } = {}): Promise<PaystubData[]> {
    const response = await apiMethods.get('/employee/paystubs', { params });
    return (response as any).data;
  }

  /**
   * Get latest paystub
   */
  static async getLatestPaystub(): Promise<PaystubData | null> {
    const response = await apiMethods.get('/employee/paystubs/latest');
    return (response as any).data;
  }

  /**
   * Download paystub as PDF
   */
  static async downloadPaystubPDF(paystubId: string): Promise<Blob> {
    try {
      console.log('Making PDF download request for paystub:', paystubId);
      const response = await apiMethods.get(`/employee/paystubs/${paystubId}/download/pdf`, {
        responseType: 'blob'
      });
      
      console.log('PDF download response:', response);
      
      // The response itself is the Blob when using responseType: 'blob'
      const data = response as Blob;
      console.log('PDF response data:', data, 'Type:', typeof data, 'Is Blob:', data instanceof Blob);
      
      // Check if the response is an error (JSON error response)
      if (data instanceof Blob && data.type === 'application/json') {
        const text = await data.text();
        const errorData = JSON.parse(text);
        throw new Error(errorData.message || 'Download failed');
      }
      
      return data;
    } catch (error) {
      console.error('Error downloading PDF:', error);
      throw error;
    }
  }

  /**
   * Download paystub as Excel
   */
  static async downloadPaystubExcel(paystubId: string): Promise<Blob> {
    try {
      console.log('Making Excel download request for paystub:', paystubId);
      const response = await apiMethods.get(`/employee/paystubs/${paystubId}/download/excel`, {
        responseType: 'blob'
      });
      
      console.log('Excel download response:', response);
      
      // The response itself is the Blob when using responseType: 'blob'
      const data = response as Blob;
      console.log('Excel response data:', data, 'Type:', typeof data, 'Is Blob:', data instanceof Blob);
      
      // Check if the response is an error (JSON error response)
      if (data instanceof Blob && data.type === 'application/json') {
        const text = await data.text();
        const errorData = JSON.parse(text);
        throw new Error(errorData.message || 'Download failed');
      }
      
      return data;
    } catch (error) {
      console.error('Error downloading Excel:', error);
      throw error;
    }
  }
}