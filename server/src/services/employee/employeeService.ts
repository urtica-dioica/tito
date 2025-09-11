import { getPool } from '../../config/database';
import logger from '../../utils/logger';

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
    personal: number;
    emergency: number;
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

export interface EmployeeProfile {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  department: string;
  position: string;
  employmentType: string;
  hireDate: string;
  baseSalary: number;
  status: string;
  profilePicture?: string;
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

export interface EmployeeRequest {
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
   * Get employee ID by user ID
   */
  async getEmployeeIdByUserId(userId: string): Promise<string | null> {
    logger.info('getEmployeeIdByUserId called with userId:', { userId });
    const query = `
      SELECT id
      FROM employees
      WHERE user_id = $1
    `;
    
    const result = await getPool().query(query, [userId]);
    logger.info('getEmployeeIdByUserId query result:', { result: result.rows });
    return result.rows.length > 0 ? result.rows[0].id : null;
  }

  /**
   * Get employee dashboard data
   */
  async getDashboard(employeeId: string): Promise<EmployeeDashboard> {
    try {
      // Get employee basic info
      const employeeInfo = await this.getEmployeeInfo(employeeId);
      
      // Get today's attendance status
      const todayStatus = await this.getTodayAttendanceStatus(employeeId);
      
      // Get monthly attendance stats
      const monthlyStats = await this.getMonthlyAttendanceStats(employeeId);
      
      // Get leave balance
      const leaveBalance = await this.getLeaveBalance(employeeId);
      
      // Get recent activity
      const recentActivity = await this.getRecentActivity(employeeId);
      
      // Get pending requests count
      const pendingRequests = await this.getPendingRequestsCount(employeeId);
      
      // Get upcoming events (placeholder for now)
      const upcomingEvents = await this.getUpcomingEvents(employeeId);

      return {
        employee: employeeInfo,
        attendance: {
          ...todayStatus,
          ...monthlyStats
        },
        leaveBalance,
        recentActivity,
        pendingRequests,
        upcomingEvents
      };
    } catch (error) {
      logger.error('Error getting employee dashboard:', { error, employeeId });
      throw error;
    }
  }

  /**
   * Get employee basic information
   */
  private async getEmployeeInfo(employeeId: string): Promise<EmployeeDashboard['employee']> {
    const query = `
      SELECT 
        e.id,
        e.employee_id as "employeeId",
        CONCAT(u.first_name, ' ', u.last_name) as name,
        d.name as department,
        e.position,
        e.hire_date as "hireDate"
      FROM employees e
      JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE e.id = $1
    `;

    const result = await getPool().query(query, [employeeId]);
    
    if (result.rows.length === 0) {
      throw new Error('Employee not found');
    }

    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      employeeId: row.employeeId,
      department: row.department || 'Unassigned',
      position: row.position,
      hireDate: row.hireDate
    };
  }

  /**
   * Get today's attendance status
   */
  private async getTodayAttendanceStatus(employeeId: string): Promise<{
    todayStatus: 'present' | 'absent' | 'late' | 'half_day';
    clockInTime?: string;
    clockOutTime?: string;
    totalHours?: number;
  }> {
    const today = new Date().toISOString().split('T')[0];
    
    const query = `
      SELECT 
        ar.overall_status as "overallStatus",
        s.clock_in as "clockIn",
        s.clock_out as "clockOut",
        s.calculated_hours as "calculatedHours"
      FROM attendance_records ar
      LEFT JOIN attendance_sessions s ON ar.id = s.attendance_record_id
      WHERE ar.employee_id = $1 AND ar.date = $2
      ORDER BY s.created_at DESC
      LIMIT 1
    `;

    const result = await getPool().query(query, [employeeId, today]);
    
    if (result.rows.length === 0) {
      return {
        todayStatus: 'absent',
        clockInTime: undefined,
        clockOutTime: undefined,
        totalHours: 0
      };
    }

    const row = result.rows[0];
    return {
      todayStatus: row.overallStatus || 'absent',
      clockInTime: row.clockIn,
      clockOutTime: row.clockOut,
      totalHours: row.calculatedHours || 0
    };
  }

  /**
   * Get monthly attendance statistics
   */
  private async getMonthlyAttendanceStats(employeeId: string): Promise<{
    monthlyPresent: number;
    monthlyAbsent: number;
    monthlyLate: number;
  }> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const query = `
      SELECT 
        COUNT(*) FILTER (WHERE overall_status = 'present') as present,
        COUNT(*) FILTER (WHERE overall_status = 'absent') as absent,
        COUNT(*) FILTER (WHERE overall_status = 'late') as late
      FROM attendance_records
      WHERE employee_id = $1 
        AND date >= $2 
        AND date <= $3
    `;

    const result = await getPool().query(query, [employeeId, startOfMonth, endOfMonth]);
    const row = result.rows[0];

    return {
      monthlyPresent: parseInt(row.present) || 0,
      monthlyAbsent: parseInt(row.absent) || 0,
      monthlyLate: parseInt(row.late) || 0
    };
  }

  /**
   * Get leave balance
   */
  private async getLeaveBalance(employeeId: string): Promise<{
    vacation: number;
    sick: number;
    personal: number;
    emergency: number;
  }> {
    try {
      // Get leave balances from the actual database schema
      const query = `
        SELECT 
          leave_type,
          balance
        FROM leave_balances
        WHERE employee_id = $1
      `;
      
      const result = await getPool().query(query, [employeeId]);
      
      const balance = {
        vacation: 0,
        sick: 0,
        personal: 0,
        emergency: 0
      };
      
      result.rows.forEach(row => {
        switch (row.leave_type) {
          case 'vacation':
            balance.vacation = parseFloat(row.balance);
            break;
          case 'sick':
            balance.sick = parseFloat(row.balance);
            break;
          case 'other':
            balance.personal = parseFloat(row.balance);
            break;
          case 'maternity':
            balance.emergency = parseFloat(row.balance);
            break;
        }
      });
      
      return balance;
    } catch (error) {
      logger.warn('Error getting leave balance, returning defaults:', { error, employeeId });
      return {
        vacation: 0,
        sick: 0,
        personal: 0,
        emergency: 0
      };
    }
  }

  /**
   * Get recent activity
   */
  private async getRecentActivity(employeeId: string): Promise<Array<{
    id: string;
    type: 'clock_in' | 'clock_out' | 'request_submitted' | 'request_approved' | 'request_rejected';
    description: string;
    timestamp: string;
    status?: 'success' | 'warning' | 'error';
  }>> {
    // Get recent attendance sessions
    const attendanceQuery = `
      SELECT 
        s.id,
        s.session_type as "sessionType",
        s.clock_in as "clockIn",
        s.clock_out as "clockOut",
        s.created_at as "createdAt"
      FROM attendance_sessions s
      JOIN attendance_records ar ON s.attendance_record_id = ar.id
      WHERE ar.employee_id = $1
      ORDER BY s.created_at DESC
      LIMIT 5
    `;

    const attendanceResult = await getPool().query(attendanceQuery, [employeeId]);
    
    const activities = attendanceResult.rows.map(row => ({
      id: row.id,
      type: row.sessionType === 'clock_in' ? 'clock_in' : 'clock_out' as 'clock_in' | 'clock_out',
      description: row.sessionType === 'clock_in' 
        ? `Clocked in at ${new Date(row.clockIn).toLocaleTimeString()}`
        : `Clocked out at ${new Date(row.clockOut).toLocaleTimeString()}`,
      timestamp: row.createdAt,
      status: 'success' as const
    }));

    return activities;
  }

  /**
   * Get pending requests count
   */
  private async getPendingRequestsCount(employeeId: string): Promise<number> {
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM time_correction_requests WHERE employee_id = $1 AND status = 'pending') +
        (SELECT COUNT(*) FROM overtime_requests WHERE employee_id = $1 AND status = 'pending') +
        (SELECT COUNT(*) FROM leaves WHERE employee_id = $1 AND status = 'pending') as total
    `;

    const result = await getPool().query(query, [employeeId]);
    return parseInt(result.rows[0].total) || 0;
  }

  /**
   * Get upcoming events (placeholder)
   */
  private async getUpcomingEvents(_employeeId: string): Promise<Array<{
    id: string;
    title: string;
    date: string;
    type: 'holiday' | 'meeting' | 'deadline';
  }>> {
    // Placeholder implementation - can be extended with actual events
    return [
      {
        id: '1',
        title: 'Team Meeting',
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        type: 'meeting'
      }
    ];
  }

  /**
   * Get employee profile
   */
  async getEmployeeProfile(employeeId: string): Promise<EmployeeProfile> {
    const query = `
      SELECT 
        e.id,
        e.employee_id as "employeeId",
        u.first_name as "firstName",
        u.last_name as "lastName",
        u.email,
        u.phone,
        u.address,
        d.name as department,
        e.position,
        e.employment_type as "employmentType",
        e.hire_date as "hireDate",
        e.base_salary as "baseSalary",
        e.status
      FROM employees e
      JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE e.id = $1
    `;

    const result = await getPool().query(query, [employeeId]);
    
    if (result.rows.length === 0) {
      throw new Error('Employee not found');
    }

    const row = result.rows[0];
    return {
      id: row.id,
      employeeId: row.employeeId,
      firstName: row.firstName,
      lastName: row.lastName,
      email: row.email,
      phone: row.phone,
      address: row.address,
      department: row.department || 'Unassigned',
      position: row.position,
      employmentType: row.employmentType,
      hireDate: row.hireDate,
      baseSalary: parseFloat(row.baseSalary),
      status: row.status
    };
  }

  /**
   * Update employee profile
   */
  async updateEmployeeProfile(employeeId: string, data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    address?: string;
  }): Promise<EmployeeProfile> {
    const client = await getPool().connect();
    
    try {
      await client.query('BEGIN');

      // Update user table
      const userUpdateFields = [];
      const userUpdateValues = [];
      let paramIndex = 1;

      if (data.firstName) {
        userUpdateFields.push(`first_name = $${paramIndex++}`);
        userUpdateValues.push(data.firstName);
      }
      if (data.lastName) {
        userUpdateFields.push(`last_name = $${paramIndex++}`);
        userUpdateValues.push(data.lastName);
      }
      if (data.email) {
        userUpdateFields.push(`email = $${paramIndex++}`);
        userUpdateValues.push(data.email);
      }
      if (data.phone) {
        userUpdateFields.push(`phone = $${paramIndex++}`);
        userUpdateValues.push(data.phone);
      }
      if (data.address) {
        userUpdateFields.push(`address = $${paramIndex++}`);
        userUpdateValues.push(data.address);
      }

      if (userUpdateFields.length > 0) {
        userUpdateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        userUpdateValues.push(employeeId);

        const userUpdateQuery = `
          UPDATE users 
          SET ${userUpdateFields.join(', ')}
          FROM employees e
          WHERE e.user_id = users.id AND e.id = $${paramIndex}
        `;

        await client.query(userUpdateQuery, userUpdateValues);
      }

      await client.query('COMMIT');

      // Return updated profile
      return await this.getEmployeeProfile(employeeId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get attendance history for an employee
   */
  async getAttendanceHistory(employeeId: string, month?: string): Promise<AttendanceRecord[]> {
    const query = `
      SELECT 
        ar.id,
        ar.date,
        s.clock_in as "clockIn",
        s.clock_out as "clockOut",
        s.calculated_hours as "totalHours",
        ar.overall_status as status,
        0 as "overtimeHours",
        '' as notes
      FROM attendance_records ar
      LEFT JOIN attendance_sessions s ON ar.id = s.attendance_record_id
      WHERE ar.employee_id = $1
      ${month ? 'AND DATE_TRUNC(\'month\', ar.date) = DATE_TRUNC(\'month\', $2::date)' : ''}
      ORDER BY ar.date DESC
    `;
    
    const params = month ? [employeeId, month] : [employeeId];
    const result = await getPool().query(query, params);
    return result.rows;
  }

  /**
   * Get attendance summary for an employee
   */
  async getAttendanceSummary(employeeId: string, month?: string): Promise<AttendanceSummary> {
    const query = `
      SELECT 
        COUNT(*) as total_days,
        COUNT(CASE WHEN ar.overall_status = 'present' THEN 1 END) as present_days,
        COUNT(CASE WHEN ar.overall_status = 'absent' THEN 1 END) as absent_days,
        COUNT(CASE WHEN ar.overall_status = 'late' THEN 1 END) as late_days,
        COALESCE(SUM(s.calculated_hours), 0) as total_hours,
        COALESCE(AVG(s.calculated_hours), 0) as average_hours,
        0 as overtime_hours
      FROM attendance_records ar
      LEFT JOIN attendance_sessions s ON ar.id = s.attendance_record_id
      WHERE ar.employee_id = $1
      ${month ? 'AND DATE_TRUNC(\'month\', ar.date) = DATE_TRUNC(\'month\', $2::date)' : ''}
    `;
    
    const params = month ? [employeeId, month] : [employeeId];
    const result = await getPool().query(query, params);
    const row = result.rows[0];
    
    return {
      totalDays: parseInt(row.total_days),
      presentDays: parseInt(row.present_days),
      absentDays: parseInt(row.absent_days),
      lateDays: parseInt(row.late_days),
      totalHours: parseFloat(row.total_hours),
      averageHours: parseFloat(row.average_hours),
      overtimeHours: parseFloat(row.overtime_hours),
    };
  }

  /**
   * Get employee requests (all types)
   */
  async getEmployeeRequests(employeeId: string, params: {
    type?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<EmployeeRequest[]> {
    const { type, status, limit = 50, offset = 0 } = params;
    
    // Get leave requests
    const leaveQuery = `
      SELECT 
        l.id,
        'leave' as type,
        l.status,
        l.created_at as "submittedAt",
        CONCAT(u.first_name, ' ', u.last_name) as "approverName",
        l.updated_at as "approvedAt",
        '' as "rejectionReason",
        json_build_object(
          'leaveType', l.leave_type,
          'startDate', l.start_date,
          'endDate', l.end_date,
          'reason', 'Leave request',
          'days', EXTRACT(day FROM (l.end_date - l.start_date)) + 1
        ) as details
      FROM leaves l
      LEFT JOIN users u ON l.approver_id = u.id
      WHERE l.employee_id = $1
      ${type && type !== 'leave' ? 'AND FALSE' : ''}
      ${status ? 'AND l.status = $2' : ''}
      ORDER BY l.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    // Get time correction requests
    const timeCorrectionQuery = `
      SELECT 
        tcr.id,
        'time_correction' as type,
        tcr.status,
        tcr.created_at as "submittedAt",
        CONCAT(u.first_name, ' ', u.last_name) as "approverName",
        tcr.approved_at as "approvedAt",
        tcr.comments as "rejectionReason",
        json_build_object(
          'correctionDate', tcr.correction_date,
          'sessionType', tcr.session_type,
          'requestedClockIn', tcr.requested_clock_in,
          'requestedClockOut', tcr.requested_clock_out,
          'reason', tcr.reason
        ) as details
      FROM time_correction_requests tcr
      LEFT JOIN users u ON tcr.approver_id = u.id
      WHERE tcr.employee_id = $1
      ${type && type !== 'time_correction' ? 'AND FALSE' : ''}
      ${status ? 'AND tcr.status = $2' : ''}
      ORDER BY tcr.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    // Get overtime requests
    const overtimeQuery = `
      SELECT 
        or.id,
        'overtime' as type,
        or.status,
        or.created_at as "submittedAt",
        CONCAT(u.first_name, ' ', u.last_name) as "approverName",
        or.approved_at as "approvedAt",
        or.comments as "rejectionReason",
        json_build_object(
          'overtimeDate', or.overtime_date,
          'startTime', or.start_time,
          'endTime', or.end_time,
          'requestedHours', or.requested_hours,
          'reason', or.reason
        ) as details
      FROM overtime_requests or
      LEFT JOIN users u ON or.approver_id = u.id
      WHERE or.employee_id = $1
      ${type && type !== 'overtime' ? 'AND FALSE' : ''}
      ${status ? 'AND or.status = $2' : ''}
      ORDER BY or.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const params_array = status ? [employeeId, status] : [employeeId];
    
    const [leaveResult, timeCorrectionResult, overtimeResult] = await Promise.all([
      getPool().query(leaveQuery, params_array),
      getPool().query(timeCorrectionQuery, params_array),
      getPool().query(overtimeQuery, params_array)
    ]);

    // Combine and sort all requests
    const allRequests = [
      ...leaveResult.rows,
      ...timeCorrectionResult.rows,
      ...overtimeResult.rows
    ].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

    return allRequests.slice(0, limit);
  }

  /**
   * Get request statistics for an employee
   */
  async getRequestStats(employeeId: string): Promise<RequestStats> {
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM leaves WHERE employee_id = $1) +
        (SELECT COUNT(*) FROM time_correction_requests WHERE employee_id = $1) +
        (SELECT COUNT(*) FROM overtime_requests WHERE employee_id = $1) as total,
        (SELECT COUNT(*) FROM leaves WHERE employee_id = $1 AND status = 'pending') +
        (SELECT COUNT(*) FROM time_correction_requests WHERE employee_id = $1 AND status = 'pending') +
        (SELECT COUNT(*) FROM overtime_requests WHERE employee_id = $1 AND status = 'pending') as pending,
        (SELECT COUNT(*) FROM leaves WHERE employee_id = $1 AND status = 'approved') +
        (SELECT COUNT(*) FROM time_correction_requests WHERE employee_id = $1 AND status = 'approved') +
        (SELECT COUNT(*) FROM overtime_requests WHERE employee_id = $1 AND status = 'approved') as approved,
        (SELECT COUNT(*) FROM leaves WHERE employee_id = $1 AND status = 'rejected') +
        (SELECT COUNT(*) FROM time_correction_requests WHERE employee_id = $1 AND status = 'rejected') +
        (SELECT COUNT(*) FROM overtime_requests WHERE employee_id = $1 AND status = 'rejected') as rejected
    `;

    const result = await getPool().query(query, [employeeId]);
    const row = result.rows[0];
    
    return {
      total: parseInt(row.total),
      pending: parseInt(row.pending),
      approved: parseInt(row.approved),
      rejected: parseInt(row.rejected),
    };
  }
}

export const employeeService = new EmployeeService();
