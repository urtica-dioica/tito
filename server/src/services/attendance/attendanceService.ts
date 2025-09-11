import { attendanceRecordModel, AttendanceRecord } from '../../models/attendance/AttendanceRecord';
import { attendanceSessionModel, AttendanceSession, CreateAttendanceSessionData } from '../../models/attendance/AttendanceSession';
import { employeeModel } from '../../models/hr/Employee';
import { getPool } from '../../config/database';
import logger from '../../utils/logger';
import { 
  getNextSessionType, 
  canPerformAttendanceAction,
  SessionType,
  getSessionDisplayInfo 
} from '../../utils/timeValidation';

export interface ClockInData {
  employeeId: string;
  qrCodeHash: string;
  selfieImagePath?: string;
  timestamp?: Date | undefined;
}

export interface ClockOutData {
  employeeId: string;
  qrCodeHash: string;
  selfieImagePath?: string;
  timestamp?: Date | undefined;
}

export interface TimeBasedAttendanceData {
  employeeId: string;
  sessionType: SessionType;
  qrCodeHash: string;
  selfieImagePath?: string;
  timestamp?: Date;
}

export interface AttendanceValidationResult {
  canPerform: boolean;
  reason?: string;
  nextExpectedSession?: SessionType;
  sessionDisplayInfo?: ReturnType<typeof getSessionDisplayInfo>;
}

export interface AttendanceSummary {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  departmentName: string | null;
  date: Date;
  overallStatus: string;
  sessions: AttendanceSession[];
  totalHours: number;
  clockInTime: Date | null;
  clockOutTime: Date | null;
}

export interface AttendanceStats {
  totalDays: number;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  partialDays: number;
  totalHours: number;
  averageHoursPerDay: number;
}

export class AttendanceService {
  /**
   * Clock in an employee
   */
  async clockIn(data: ClockInData): Promise<AttendanceSummary> {
    const { employeeId, qrCodeHash, selfieImagePath, timestamp = new Date() } = data;

    // Verify employee exists and is active
    const employee = await employeeModel.findById(employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    if (employee.status !== 'active') {
      throw new Error('Employee is not active');
    }

    // Get today's date
    const today = new Date(timestamp);
    today.setHours(0, 0, 0, 0);

    // Check if employee already clocked in today
    const existingRecord = await attendanceRecordModel.findByEmployeeAndDate(employeeId, today);
    if (existingRecord) {
      const existingSessions = await attendanceSessionModel.getSessionsByAttendanceRecord(existingRecord.id);
      const hasClockIn = existingSessions.some(session => session.sessionType === 'clock_in');
      
      if (hasClockIn) {
        throw new Error('Employee has already clocked in today');
      }
    }

    // Create or get attendance record for today
    let attendanceRecord: AttendanceRecord;
    if (existingRecord) {
      attendanceRecord = existingRecord;
    } else {
      attendanceRecord = await attendanceRecordModel.createAttendanceRecord({
        employeeId,
        date: today,
        overallStatus: 'present'
      });
    }

    // Create clock in session
    const sessionData: CreateAttendanceSessionData = {
      attendanceRecordId: attendanceRecord.id,
      sessionType: 'clock_in',
      timestamp,
      qrCodeHash,
      ...(selfieImagePath && { selfieImagePath })
    };

    const session = await attendanceSessionModel.createAttendanceSession(sessionData);

    // Update overall status to present
    await attendanceRecordModel.updateAttendanceRecord(attendanceRecord.id, {
      overallStatus: 'present'
    });

    // Get updated attendance summary
    const summary = await this.getAttendanceSummary(employeeId, today);

    logger.info('Employee clocked in successfully', {
      employeeId,
      employeeCode: employee.employee_id,
      timestamp,
      attendanceRecordId: attendanceRecord.id,
      sessionId: session.id
    });

    return summary;
  }

  /**
   * Clock out an employee
   */
  async clockOut(data: ClockOutData): Promise<AttendanceSummary> {
    const { employeeId, qrCodeHash, selfieImagePath, timestamp = new Date() } = data;

    // Verify employee exists and is active
    const employee = await employeeModel.findById(employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    if (employee.status !== 'active') {
      throw new Error('Employee is not active');
    }

    // Get today's date
    const today = new Date(timestamp);
    today.setHours(0, 0, 0, 0);

    // Get today's attendance record
    const attendanceRecord = await attendanceRecordModel.findByEmployeeAndDate(employeeId, today);
    if (!attendanceRecord) {
      throw new Error('No attendance record found for today. Please clock in first.');
    }

    // Check if employee already clocked out today
    const existingSessions = await attendanceSessionModel.getSessionsByAttendanceRecord(attendanceRecord.id);
    const hasClockOut = existingSessions.some(session => session.sessionType === 'clock_out');
    
    if (hasClockOut) {
      throw new Error('Employee has already clocked out today');
    }

    // Check if employee has clocked in today
    const hasClockIn = existingSessions.some(session => session.sessionType === 'clock_in');
    if (!hasClockIn) {
      throw new Error('Employee must clock in before clocking out');
    }

    // Create clock out session
    const sessionData: CreateAttendanceSessionData = {
      attendanceRecordId: attendanceRecord.id,
      sessionType: 'clock_out',
      timestamp,
      qrCodeHash,
      ...(selfieImagePath && { selfieImagePath })
    };

    const session = await attendanceSessionModel.createAttendanceSession(sessionData);

    // Calculate total hours for the day
    const totalHours = await this.calculateDailyHours(attendanceRecord.id);

    // Update overall status based on hours worked
    let overallStatus: 'present' | 'late' | 'absent' | 'partial' = 'present';
    if (totalHours < 4) {
      overallStatus = 'partial';
    } else if (totalHours < 8) {
      overallStatus = 'late';
    }

    await attendanceRecordModel.updateAttendanceRecord(attendanceRecord.id, {
      overallStatus
    });

    // Get updated attendance summary
    const summary = await this.getAttendanceSummary(employeeId, today);

    logger.info('Employee clocked out successfully', {
      employeeId,
      employeeCode: employee.employee_id,
      timestamp,
      totalHours,
      overallStatus,
      attendanceRecordId: attendanceRecord.id,
      sessionId: session.id
    });

    return summary;
  }

  /**
   * Get attendance summary for an employee on a specific date
   */
  async getAttendanceSummary(employeeId: string, date: Date): Promise<AttendanceSummary> {
    const employee = await employeeModel.findByIdWithDetails(employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    const attendanceRecord = await attendanceRecordModel.findByEmployeeAndDate(employeeId, normalizedDate);
    if (!attendanceRecord) {
      return {
        employeeId,
        employeeCode: employee.employee_id,
        employeeName: `${employee.user?.first_name || ''} ${employee.user?.last_name || ''}`.trim(),
        departmentName: employee.department?.name || null,
        date: normalizedDate,
        overallStatus: 'absent',
        sessions: [],
        totalHours: 0,
        clockInTime: null,
        clockOutTime: null
      };
    }

    const sessions = await attendanceSessionModel.getSessionsByAttendanceRecord(attendanceRecord.id);
    const totalHours = await this.calculateDailyHours(attendanceRecord.id);

    const clockInSession = sessions.find(s => s.sessionType === 'clock_in');
    const clockOutSession = sessions.find(s => s.sessionType === 'clock_out');

    return {
      employeeId,
      employeeCode: employee.employee_id,
      employeeName: `${employee.user?.first_name || ''} ${employee.user?.last_name || ''}`.trim(),
      departmentName: employee.department?.name || null,
      date: normalizedDate,
      overallStatus: attendanceRecord.overallStatus,
      sessions,
      totalHours,
      clockInTime: clockInSession?.timestamp || null,
      clockOutTime: clockOutSession?.timestamp || null
    };
  }

  /**
   * Get attendance history for an employee
   */
  async getEmployeeAttendanceHistory(
    employeeId: string, 
    startDate: Date, 
    endDate: Date,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    records: AttendanceSummary[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const result = await attendanceRecordModel.listAttendanceRecords({
      employeeId,
      startDate,
      endDate,
      page,
      limit,
      sortBy: 'date',
      sortOrder: 'desc'
    });

    const records: AttendanceSummary[] = [];
    for (const record of result.records) {
      const summary = await this.getAttendanceSummary(record.employeeId, record.date);
      records.push(summary);
    }

    return {
      records,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages
    };
  }

  /**
   * Get attendance statistics for an employee
   */
  async getEmployeeAttendanceStats(employeeId: string, startDate: Date, endDate: Date): Promise<AttendanceStats> {
    const stats = await attendanceRecordModel.getEmployeeAttendanceStats(employeeId, startDate, endDate);
    const sessionStats = await attendanceSessionModel.getEmployeeSessionStats(employeeId, startDate, endDate);

    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const averageHoursPerDay = totalDays > 0 ? sessionStats.totalHours / totalDays : 0;

    return {
      totalDays: stats.totalDays,
      presentDays: stats.presentDays,
      lateDays: stats.lateDays,
      absentDays: stats.absentDays,
      partialDays: stats.partialDays,
      totalHours: sessionStats.totalHours,
      averageHoursPerDay: Math.round(averageHoursPerDay * 100) / 100
    };
  }

  /**
   * Get department attendance summary
   */
  async getDepartmentAttendanceSummary(departmentId: string, date: Date): Promise<{
    departmentName: string;
    totalEmployees: number;
    presentEmployees: number;
    lateEmployees: number;
    absentEmployees: number;
    partialEmployees: number;
    attendanceRate: number;
  }> {
    const query = `
      SELECT 
        d.name as department_name,
        COUNT(DISTINCT e.id) as total_employees,
        COUNT(DISTINCT ar.id) FILTER (WHERE ar.overall_status = 'present') as present_employees,
        COUNT(DISTINCT ar.id) FILTER (WHERE ar.overall_status = 'late') as late_employees,
        COUNT(DISTINCT ar.id) FILTER (WHERE ar.overall_status = 'absent') as absent_employees,
        COUNT(DISTINCT ar.id) FILTER (WHERE ar.overall_status = 'partial') as partial_employees
      FROM departments d
      JOIN employees e ON d.id = e.department_id
      LEFT JOIN attendance_records ar ON e.id = ar.employee_id AND ar.date = $2
      WHERE d.id = $1 AND e.status = 'active'
      GROUP BY d.id, d.name
    `;

    const result = await getPool().query(query, [departmentId, date]);
    
    if (result.rows.length === 0) {
      throw new Error('Department not found');
    }

    const row = result.rows[0];
    const totalEmployees = parseInt(row.total_employees) || 0;
    const presentEmployees = parseInt(row.present_employees) || 0;
    const lateEmployees = parseInt(row.late_employees) || 0;
    const absentEmployees = parseInt(row.absent_employees) || 0;
    const partialEmployees = parseInt(row.partial_employees) || 0;
    
    const attendanceRate = totalEmployees > 0 ? ((presentEmployees + lateEmployees + partialEmployees) / totalEmployees) * 100 : 0;

    return {
      departmentName: row.department_name,
      totalEmployees,
      presentEmployees,
      lateEmployees,
      absentEmployees,
      partialEmployees,
      attendanceRate: Math.round(attendanceRate * 100) / 100
    };
  }

  /**
   * Calculate daily hours for an attendance record
   */
  private async calculateDailyHours(attendanceRecordId: string): Promise<number> {
    const sessions = await attendanceSessionModel.getSessionsByAttendanceRecord(attendanceRecordId);
    
    const clockInSessions = sessions.filter(s => s.sessionType === 'clock_in');
    const clockOutSessions = sessions.filter(s => s.sessionType === 'clock_out');

    let totalHours = 0;

    // Calculate hours for each clock in/out pair
    for (const clockIn of clockInSessions) {
      const correspondingClockOut = clockOutSessions.find(
        clockOut => clockOut.timestamp > clockIn.timestamp
      );

      if (correspondingClockOut) {
        const hours = (correspondingClockOut.timestamp.getTime() - clockIn.timestamp.getTime()) / (1000 * 60 * 60);
        totalHours += Math.max(0, hours);
      }
    }

    return Math.round(totalHours * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Get current attendance status for an employee
   */
  async getCurrentAttendanceStatus(employeeId: string): Promise<{
    isClockedIn: boolean;
    lastClockIn: Date | null;
    lastClockOut: Date | null;
    todayHours: number;
    todayStatus: string;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendanceRecord = await attendanceRecordModel.findByEmployeeAndDate(employeeId, today);
    
    if (!attendanceRecord) {
      return {
        isClockedIn: false,
        lastClockIn: null,
        lastClockOut: null,
        todayHours: 0,
        todayStatus: 'absent'
      };
    }

    const sessions = await attendanceSessionModel.getSessionsByAttendanceRecord(attendanceRecord.id);
    const todayHours = await this.calculateDailyHours(attendanceRecord.id);

    const clockInSessions = sessions.filter(s => s.sessionType === 'clock_in');
    const clockOutSessions = sessions.filter(s => s.sessionType === 'clock_out');

    const lastClockIn = clockInSessions.length > 0 ? (clockInSessions[clockInSessions.length - 1]?.timestamp || null) : null;
    const lastClockOut = clockOutSessions.length > 0 ? (clockOutSessions[clockOutSessions.length - 1]?.timestamp || null) : null;

    const isClockedIn = clockInSessions.length > clockOutSessions.length;

    return {
      isClockedIn,
      lastClockIn,
      lastClockOut,
      todayHours,
      todayStatus: attendanceRecord.overallStatus
    };
  }

  /**
   * Verify QR code for attendance
   */
  async verifyQRCode(qrCodeHash: string): Promise<{
    isValid: boolean;
    employeeId?: string;
    employeeCode?: string;
    employeeName?: string;
    departmentName?: string | null;
  }> {
    const query = `
      SELECT 
        e.id as employee_id,
        e.employee_id as employee_code,
        CONCAT(u.first_name, ' ', u.last_name) as employee_name,
        d.name as department_name
      FROM employees e
      JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
      JOIN id_cards ic ON e.id = ic.employee_id
      WHERE ic.qr_code_hash = $1 
        AND ic.is_active = true 
        AND ic.expiry_date > CURRENT_DATE
        AND e.status = 'active'
    `;

    const result = await getPool().query(query, [qrCodeHash]);
    
    if (result.rows.length === 0) {
      return { isValid: false };
    }

    const row = result.rows[0];
    return {
      isValid: true,
      employeeId: row.employee_id,
      employeeCode: row.employee_code,
      employeeName: row.employee_name,
      departmentName: row.department_name
    };
  }

  /**
   * Get attendance records for a date range
   */
  async getAttendanceRecords(
    startDate: Date,
    endDate: Date,
    departmentId?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    records: AttendanceSummary[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const result = await attendanceRecordModel.listAttendanceRecords({
      startDate,
      endDate,
      departmentId,
      page,
      limit,
      sortBy: 'date',
      sortOrder: 'desc'
    });

    const records: AttendanceSummary[] = [];
    for (const record of result.records) {
      const summary = await this.getAttendanceSummary(record.employeeId, record.date);
      records.push(summary);
    }

    return {
      records,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages
    };
  }

  /**
   * Validate if employee can perform attendance action
   */
  async validateAttendanceAction(
    employeeId: string, 
    sessionType: SessionType, 
    timestamp: Date = new Date()
  ): Promise<AttendanceValidationResult> {
    try {
      // Get today's attendance record and sessions
      const today = new Date(timestamp);
      today.setHours(0, 0, 0, 0);
      
      const attendanceRecord = await attendanceRecordModel.findByEmployeeAndDate(employeeId, today);
      const existingSessions = attendanceRecord 
        ? await attendanceSessionModel.getSessionsByAttendanceRecord(attendanceRecord.id)
        : [];

      // Convert sessions to the format expected by validation functions
      const sessionData = existingSessions.map(session => ({
        sessionType: session.sessionType as SessionType,
        timestamp: session.timestamp
      }));

      // Use utility function to validate
      const validation = canPerformAttendanceAction(sessionType, sessionData, timestamp);
      
      return {
        canPerform: validation.canPerform,
        reason: validation.reason,
        nextExpectedSession: validation.nextExpectedSession,
        sessionDisplayInfo: getSessionDisplayInfo(sessionType)
      };
    } catch (error) {
      logger.error('Error validating attendance action', {
        error: (error as Error).message,
        employeeId,
        sessionType,
        timestamp
      });
      
      return {
        canPerform: false,
        reason: 'Error validating attendance action'
      };
    }
  }

  /**
   * Record time-based attendance (morning_in, morning_out, afternoon_in, afternoon_out)
   */
  async recordTimeBasedAttendance(data: TimeBasedAttendanceData): Promise<AttendanceSummary> {
    const { employeeId, sessionType, qrCodeHash, selfieImagePath, timestamp = new Date() } = data;

    // Verify employee exists and is active
    const employee = await employeeModel.findById(employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    if (employee.status !== 'active') {
      throw new Error('Employee is not active');
    }

    // Validate attendance action
    const validation = await this.validateAttendanceAction(employeeId, sessionType, timestamp);
    if (!validation.canPerform) {
      throw new Error(validation.reason || 'Invalid attendance action');
    }

    // Get today's date
    const today = new Date(timestamp);
    today.setHours(0, 0, 0, 0);

    // Create or get attendance record for today
    let attendanceRecord: AttendanceRecord;
    const existingRecord = await attendanceRecordModel.findByEmployeeAndDate(employeeId, today);
    
    if (existingRecord) {
      attendanceRecord = existingRecord;
    } else {
      attendanceRecord = await attendanceRecordModel.createAttendanceRecord({
        employeeId,
        date: today,
        overallStatus: 'present'
      });
    }

    // Check if session already exists
    // Note: sessionType from timeValidation is different from database sessionType
    // For now, we'll create new sessions instead of updating existing ones
    const existingSession = null;

    let session: AttendanceSession;

    if (existingSession) {
      // Update existing session - this branch is currently disabled due to type mismatch
      // TODO: Implement proper session update logic when database schema supports time-based sessions
      throw new Error('Session update not implemented for time-based attendance');
    } else {
      // Create new session
      const sessionData: CreateAttendanceSessionData = {
        attendanceRecordId: attendanceRecord.id,
        sessionType: sessionType,
        timestamp,
        qrCodeHash,
        ...(selfieImagePath && { selfieImagePath })
      };

      session = await attendanceSessionModel.createAttendanceSession(sessionData);
    }

    // Update overall status based on completed sessions
    const totalHours = await this.calculateDailyHours(attendanceRecord.id);
    let overallStatus: 'present' | 'late' | 'absent' | 'partial' = 'present';
    
    if (totalHours < 4) {
      overallStatus = 'partial';
    } else if (totalHours < 8) {
      overallStatus = 'late';
    }

    await attendanceRecordModel.updateAttendanceRecord(attendanceRecord.id, {
      overallStatus
    });

    // Get updated attendance summary
    const summary = await this.getAttendanceSummary(employeeId, today);

    logger.info('Time-based attendance recorded successfully', {
      employeeId,
      sessionType,
      timestamp,
      sessionId: session.id
    });

    return summary;
  }

  /**
   * Get next expected session for employee
   */
  async getNextExpectedSession(employeeId: string, date: Date = new Date()): Promise<{
    sessionType: SessionType | null;
    displayInfo: ReturnType<typeof getSessionDisplayInfo> | null;
    canPerform: boolean;
    reason?: string;
  }> {
    try {
      const today = new Date(date);
      today.setHours(0, 0, 0, 0);
      
      const attendanceRecord = await attendanceRecordModel.findByEmployeeAndDate(employeeId, today);
      const existingSessions = attendanceRecord 
        ? await attendanceSessionModel.getSessionsByAttendanceRecord(attendanceRecord.id)
        : [];

      const sessionData = existingSessions.map(session => ({
        sessionType: session.sessionType as SessionType,
        timestamp: session.timestamp
      }));

      const nextSession = getNextSessionType(sessionData, date);
      
      if (nextSession) {
        const validation = await this.validateAttendanceAction(employeeId, nextSession, date);
        return {
          sessionType: nextSession,
          displayInfo: getSessionDisplayInfo(nextSession),
          canPerform: validation.canPerform,
          reason: validation.reason
        };
      }

      return {
        sessionType: null,
        displayInfo: null,
        canPerform: false,
        reason: 'No valid session available at this time'
      };
    } catch (error) {
      logger.error('Error getting next expected session', {
        error: (error as Error).message,
        employeeId,
        date
      });
      
      return {
        sessionType: null,
        displayInfo: null,
        canPerform: false,
        reason: 'Error determining next session'
      };
    }
  }
}

export const attendanceService = new AttendanceService();