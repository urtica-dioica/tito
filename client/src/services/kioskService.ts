import { apiMethods } from '../lib/api';

export interface KioskEmployee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  departmentId: string;
  departmentName: string;
  position: string;
  employmentType: 'regular' | 'contractual' | 'jo';
  hireDate: string;
  baseSalary: number;
  status: 'active' | 'inactive' | 'terminated' | 'on_leave';
  createdAt: string;
  updatedAt: string;
}

export type SessionType = 'morning_in' | 'morning_out' | 'afternoon_in' | 'afternoon_out' | 'overtime';

export interface KioskAttendanceRecord {
  id: string;
  employeeId: string;
  type: 'clock_in' | 'clock_out';
  sessionType: SessionType;
  timestamp: string;
  location: string;
  selfieUrl?: string;
  qrCodeScanned: boolean;
  qrCodeData?: string;
}

export interface SessionDisplayInfo {
  label: string;
  description: string;
  timeWindow: string;
}

export interface NextSessionInfo {
  sessionType: SessionType | null;
  displayInfo: SessionDisplayInfo | null;
  canPerform: boolean;
  reason?: string;
}

export interface TodayAttendanceSummary {
  sessions: KioskAttendanceRecord[];
  nextExpectedSession: SessionType | null;
  canPerformNext: boolean;
  reason?: string;
}

export class KioskService {
  /**
   * Verify employee by QR code data
   */
  static async verifyEmployeeByQR(qrCodeData: string): Promise<KioskEmployee> {
    const response = await apiMethods.get<KioskEmployee>(`/kiosk/verify-qr?qrCode=${encodeURIComponent(qrCodeData)}`);
    if (!response.data) {
      throw new Error('Failed to verify employee');
    }
    return response.data;
  }

  /**
   * Record attendance
   */
  static async recordAttendance(data: {
    employeeId: string;
    type: 'clock_in' | 'clock_out';
    location: string;
    qrCodeData: string;
    selfieUrl?: string;
  }): Promise<KioskAttendanceRecord> {
    const response = await apiMethods.post<KioskAttendanceRecord>('/kiosk/attendance', data);
    if (!response.data) {
      throw new Error('Failed to record attendance');
    }
    return response.data;
  }

  /**
   * Get employee's last attendance record
   */
  static async getLastAttendance(employeeId: string): Promise<KioskAttendanceRecord | null> {
    const response = await apiMethods.get<KioskAttendanceRecord | null>(`/kiosk/attendance/last/${employeeId}`);
    return response.data || null;
  }

  /**
   * Get employee's attendance history
   */
  static async getAttendanceHistory(employeeId: string, limit: number = 10): Promise<KioskAttendanceRecord[]> {
    const response = await apiMethods.get<KioskAttendanceRecord[]>(`/kiosk/attendance/history/${employeeId}?limit=${limit}`);
    return response.data || [];
  }

  /**
   * Record time-based attendance
   */
  static async recordTimeBasedAttendance(data: {
    employeeId: string;
    sessionType: SessionType;
    location: string;
    qrCodeData: string;
    selfieUrl?: string;
  }): Promise<KioskAttendanceRecord> {
    // If we have a selfie image (base64), convert it to a file and send as FormData
    if (data.selfieUrl && data.selfieUrl.startsWith('data:image/')) {
      const formData = new FormData();

      // Add text fields
      formData.append('employeeId', data.employeeId);
      formData.append('sessionType', data.sessionType);
      formData.append('location', data.location);
      formData.append('qrCodeData', data.qrCodeData);

      // Convert base64 to blob and add as file
      const base64Data = data.selfieUrl.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });

      // Create a file from the blob
      const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
      formData.append('selfie', file);

      const response = await apiMethods.post<KioskAttendanceRecord>('/kiosk/attendance/time-based', formData as any, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (!response.data) {
        throw new Error('Failed to record time-based attendance');
      }
      return response.data;
    } else {
      // No image, send as regular JSON
      const response = await apiMethods.post<KioskAttendanceRecord>('/kiosk/attendance/time-based', data);
      if (!response.data) {
        throw new Error('Failed to record time-based attendance');
      }
      return response.data;
    }
  }

  /**
   * Get next expected session for employee
   */
  static async getNextExpectedSession(employeeId: string): Promise<NextSessionInfo> {
    const response = await apiMethods.get<NextSessionInfo>(`/kiosk/attendance/next-session/${employeeId}`);
    if (!response.data) {
      throw new Error('Failed to get next expected session');
    }
    return response.data;
  }

  /**
   * Validate attendance action for employee
   */
  static async validateAttendanceAction(employeeId: string, sessionType: SessionType): Promise<{
    canPerform: boolean;
    reason?: string;
    nextExpectedSession?: SessionType;
    sessionDisplayInfo?: SessionDisplayInfo;
  }> {
    const response = await apiMethods.post<{
      canPerform: boolean;
      reason?: string;
      nextExpectedSession?: SessionType;
      sessionDisplayInfo?: SessionDisplayInfo;
    }>('/kiosk/attendance/validate', { employeeId, sessionType });
    if (!response.data) {
      throw new Error('Failed to validate attendance action');
    }
    return response.data;
  }

  /**
   * Get today's attendance summary for employee
   */
  static async getTodayAttendanceSummary(employeeId: string): Promise<TodayAttendanceSummary> {
    const response = await apiMethods.get<TodayAttendanceSummary>(`/kiosk/attendance/today-summary/${employeeId}`);
    if (!response.data) {
      throw new Error('Failed to get today attendance summary');
    }
    return response.data;
  }
}

