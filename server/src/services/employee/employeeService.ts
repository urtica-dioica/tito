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

export interface PaystubData {
  id: string;
  periodName: string;
  periodStartDate: string;
  periodEndDate: string;
  employeeId: string;
  employeeName: string;
  position: string;
  department: string;
  baseSalary: number;
  totalRegularHours: number;
  totalOvertimeHours: number;
  paidLeaveHours: number;
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
   * Calculate working days between two dates (excluding weekends)
   */
  private calculateWorkingDays(startDate: Date, endDate: Date): number {
    let workingDays = 0;
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      // Count Monday (1) through Friday (5) as working days
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        workingDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return workingDays;
  }

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
   * Get today's attendance status with session details
   */
  private async getTodayAttendanceStatus(employeeId: string): Promise<{
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
  }> {
    const today = new Date().toISOString().split('T')[0];
    
    // Get overall attendance record
    const recordQuery = `
      SELECT 
        ar.overall_status as "overallStatus",
        ar.date
      FROM attendance_records ar
      WHERE ar.employee_id = $1 AND ar.date = $2
    `;

    const recordResult = await getPool().query(recordQuery, [employeeId, today]);
    
    if (recordResult.rows.length === 0) {
      return {
        todayStatus: 'absent',
        clockInTime: undefined,
        clockOutTime: undefined,
        totalHours: 0,
        morningClockIn: undefined,
        morningClockOut: undefined,
        afternoonClockIn: undefined,
        afternoonClockOut: undefined,
        breakStart: undefined,
        breakEnd: undefined
      };
    }

    const record = recordResult.rows[0];

    // Get all sessions for today
    const sessionsQuery = `
      SELECT 
        s.session_type as "sessionType",
        s.clock_in as "clockIn",
        s.clock_out as "clockOut",
        s.calculated_hours as "calculatedHours",
        s.created_at as "createdAt"
      FROM attendance_sessions s
      JOIN attendance_records ar ON s.attendance_record_id = ar.id
      WHERE ar.employee_id = $1 AND ar.date = $2
      ORDER BY s.created_at ASC
    `;

    const sessionsResult = await getPool().query(sessionsQuery, [employeeId, today]);
    
    let morningClockIn: string | undefined, morningClockOut: string | undefined, afternoonClockIn: string | undefined, afternoonClockOut: string | undefined, breakStart: string | undefined, breakEnd: string | undefined;
    let totalHours = 0;
    let firstClockIn: string | undefined, lastClockOut: string | undefined;

    sessionsResult.rows.forEach(session => {
      totalHours += parseFloat(session.calculatedHours) || 0;
      
      if (session.sessionType === 'morning_in') {
        morningClockIn = session.clockIn;
      } else if (session.sessionType === 'morning_out') {
        morningClockOut = session.clockOut;
      } else if (session.sessionType === 'afternoon_in') {
        afternoonClockIn = session.clockIn;
      } else if (session.sessionType === 'afternoon_out') {
        afternoonClockOut = session.clockOut;
      }

      // Track first clock in and last clock out for overall times
      if (session.clockIn && (!firstClockIn || new Date(session.clockIn) < new Date(firstClockIn))) {
        firstClockIn = session.clockIn;
      }
      if (session.clockOut && (!lastClockOut || new Date(session.clockOut) > new Date(lastClockOut))) {
        lastClockOut = session.clockOut;
      }
    });

    return {
      todayStatus: record.overallStatus || 'absent',
      clockInTime: firstClockIn,
      clockOutTime: lastClockOut,
      totalHours: totalHours,
      morningClockIn,
      morningClockOut,
      afternoonClockIn,
      afternoonClockOut,
      breakStart,
      breakEnd
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
    maternity: number;
    other: number;
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
        maternity: 0,
        other: 0
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
            balance.other = parseFloat(row.balance);
            break;
          case 'maternity':
            balance.maternity = parseFloat(row.balance);
            break;
        }
      });
      
      return balance;
    } catch (error) {
      logger.warn('Error getting leave balance, returning defaults:', { error, employeeId });
      return {
        vacation: 0,
        sick: 0,
        maternity: 0,
        other: 0
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
      ${month ? 'AND DATE_TRUNC(\'month\', ar.date) = DATE_TRUNC(\'month\', $2::timestamp)' : ''}
      ORDER BY ar.date DESC
    `;
    
    // Convert month string (e.g., "2025-09") to a proper date (e.g., "2025-09-01")
    const params = month ? [employeeId, `${month}-01`] : [employeeId];
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
      ${month ? 'AND DATE_TRUNC(\'month\', ar.date) = DATE_TRUNC(\'month\', $2::timestamp)' : ''}
    `;
    
    // Convert month string (e.g., "2025-09") to a proper date (e.g., "2025-09-01")
    const params = month ? [employeeId, `${month}-01`] : [employeeId];
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
   * Download paystub as PDF
   */
  async downloadPaystubPDF(employeeId: string, paystubId: string): Promise<Buffer> {
    try {
      logger.info('Downloading paystub PDF', { employeeId, paystubId });
      
      // Get the specific paystub data
      const paystub = await this.getEmployeePaystubs(employeeId, { limit: 1000 });
      logger.info('Retrieved paystubs', { count: paystub.length, paystubIds: paystub.map(p => p.id) });
      
      const targetPaystub = paystub.find(p => p.id === paystubId);
      
      if (!targetPaystub) {
        logger.error('Paystub not found', { employeeId, paystubId, availableIds: paystub.map(p => p.id) });
        throw new Error('Paystub not found');
      }

      // Generate PDF using the existing payroll service method
      logger.info('Starting PDF generation', { paystubId: targetPaystub.id });
      
      const PDFDocument = require('pdfkit');
      const doc = new PDFDocument();
      const buffers: Buffer[] = [];
      
      doc.on('data', buffers.push.bind(buffers));
      
      return new Promise((resolve, reject) => {
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          logger.info('PDF generation completed', { bufferSize: pdfBuffer.length });
          resolve(pdfBuffer);
        });
        
        doc.on('error', (error: any) => {
          logger.error('PDF generation error', { error: error.message, stack: error.stack });
          reject(error);
        });
        
        try {
          // H1 - Company header
          doc.fontSize(20).font('Helvetica-Bold')
             .text('TITO HR MANAGEMENT SYSTEM', 50, 50);

          // H2 - Payslip title
          doc.fontSize(16).font('Helvetica-Bold')
             .text('PAYSLIP', 50, 85);

          // H3 - Pay period
          doc.fontSize(12).font('Helvetica-Bold')
             .text(`Pay period: ${targetPaystub.periodName}`, 50, 115);

          // H3 - Employee Information
          doc.fontSize(12).font('Helvetica-Bold')
             .text('Employee Information', 50, 145);
          
          doc.fontSize(10).font('Helvetica')
             .text(`Employee ID: ${targetPaystub.employeeId}`, 50, 170)
             .text(`Name: ${targetPaystub.employeeName}`, 50, 185)
             .text(`Department: ${targetPaystub.department}`, 50, 200)
             .text(`Base salary: ₱${(Number(targetPaystub.baseSalary) || 0).toFixed(2)}`, 50, 215);

          // Earnings section
          doc.fontSize(12).font('Helvetica-Bold')
             .text('Earnings:', 50, 245);
          
          doc.fontSize(10).font('Helvetica')
             .text('Base salary:', 50, 270)
             .text(`₱${(Number(targetPaystub.baseSalary) || 0).toFixed(2)}`, 400, 270, { align: 'right' });
          
          // Add Leave Pay if applicable - using same calculation as payroll system
          const paidLeaveHours = Number(targetPaystub.paidLeaveHours) || 0;
          let leavePay = 0;
          if (paidLeaveHours > 0) {
            const startDate = new Date(targetPaystub.periodStartDate);
            const endDate = new Date(targetPaystub.periodEndDate);
            const expectedWorkingDays = this.calculateWorkingDays(startDate, endDate);
            const expectedHours = expectedWorkingDays * 8; // 8 hours per working day
            const baseSalary = Number(targetPaystub.baseSalary) || 0;
            
            // Use same proportional calculation as payroll system
            leavePay = expectedHours > 0 ? (paidLeaveHours / expectedHours) * baseSalary : 0;
            
            if (leavePay > 0) {
              doc.text('Leave pay:', 50, 290)
                 .text(`₱${leavePay.toFixed(2)}`, 400, 290, { align: 'right' });
            }
          }
          
          doc.text('Gross pay:', 50, 310)
             .text(`₱${(Number(targetPaystub.grossPay) || 0).toFixed(2)}`, 400, 310, { align: 'right' })
             .text('Net pay:', 50, 330)
             .text(`₱${(Number(targetPaystub.netPay) || 0).toFixed(2)}`, 400, 330, { align: 'right' });
          
          // Benefits section
          let currentY = 360;
          doc.fontSize(12).font('Helvetica-Bold')
             .text('Benefits:', 50, currentY);
          
          currentY += 25;
          
          if (targetPaystub.benefits && targetPaystub.benefits.length > 0) {
            // Individual benefits
            targetPaystub.benefits.forEach((benefit: any) => {
              doc.fontSize(10).font('Helvetica')
                 .text(`${benefit.name}:`, 50, currentY)
                 .text(`₱${Number(benefit.amount).toFixed(2)}`, 400, currentY, { align: 'right' });
              currentY += 15;
            });
            
            // Total Benefits
            doc.fontSize(10).font('Helvetica')
               .text('Total benefits:', 50, currentY)
               .text(`₱${Number(targetPaystub.totalBenefits).toFixed(2)}`, 400, currentY, { align: 'right' });
          } else if (targetPaystub.totalBenefits && Number(targetPaystub.totalBenefits) > 0) {
            doc.fontSize(10).font('Helvetica')
               .text('Total benefits:', 50, currentY)
               .text(`₱${Number(targetPaystub.totalBenefits).toFixed(2)}`, 400, currentY, { align: 'right' });
          } else {
            doc.fontSize(10).font('Helvetica')
               .text('Total benefits:', 50, currentY)
               .text(`₱0.00`, 400, currentY, { align: 'right' });
          }
          
          // Deductions section
          currentY += 30;
          doc.fontSize(12).font('Helvetica-Bold')
             .text('Deductions:', 50, currentY);
          
          currentY += 25;
          
          if (targetPaystub.deductions && targetPaystub.deductions.length > 0) {
            // Individual deductions
            targetPaystub.deductions.forEach((deduction: any) => {
              doc.fontSize(10).font('Helvetica')
                 .text(`${deduction.name}:`, 50, currentY)
                 .text(`₱${Number(deduction.amount).toFixed(2)}`, 400, currentY, { align: 'right' });
              currentY += 15;
            });
            
            // Total Deductions
            doc.fontSize(10).font('Helvetica')
               .text('Total deductions:', 50, currentY)
               .text(`₱${(Number(targetPaystub.totalDeductions) || 0).toFixed(2)}`, 400, currentY, { align: 'right' });
          } else {
            doc.fontSize(10).font('Helvetica')
               .text('Total deductions:', 50, currentY)
               .text(`₱0.00`, 400, currentY, { align: 'right' });
          }

          // Footer
          currentY += 40;
          doc.fontSize(10).font('Helvetica')
             .text(`Approved by hr & generated on: ${new Date().toLocaleDateString()}`, 50, currentY);
          
          doc.end();
        } catch (error) {
          logger.error('Error creating PDF content', { error: error instanceof Error ? error.message : 'Unknown error', stack: error instanceof Error ? error.stack : undefined });
          reject(error);
        }
      });
    } catch (error) {
      logger.error('Error generating paystub PDF:', error);
      throw error;
    }
  }

  /**
   * Download paystub as Excel
   */
  async downloadPaystubExcel(employeeId: string, paystubId: string): Promise<Buffer> {
    try {
      logger.info('Downloading paystub Excel', { employeeId, paystubId });
      
      // Get the specific paystub data
      const paystub = await this.getEmployeePaystubs(employeeId, { limit: 1000 });
      logger.info('Retrieved paystubs', { count: paystub.length, paystubIds: paystub.map(p => p.id) });
      
      const targetPaystub = paystub.find(p => p.id === paystubId);
      
      if (!targetPaystub) {
        logger.error('Paystub not found', { employeeId, paystubId, availableIds: paystub.map(p => p.id) });
        throw new Error('Paystub not found');
      }

      // Create Excel file using xlsx library
      logger.info('Starting Excel generation', { paystubId: targetPaystub.id });
      
      const XLSX = require('xlsx');
      
      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      
      // Calculate Leave Pay using same logic as payroll system
      const paidLeaveHours = Number(targetPaystub.paidLeaveHours) || 0;
      let leavePay = 0;
      if (paidLeaveHours > 0) {
        const startDate = new Date(targetPaystub.periodStartDate);
        const endDate = new Date(targetPaystub.periodEndDate);
        const expectedWorkingDays = this.calculateWorkingDays(startDate, endDate);
        const expectedHours = expectedWorkingDays * 8; // 8 hours per working day
        const baseSalary = Number(targetPaystub.baseSalary) || 0;
        
        // Use same proportional calculation as payroll system
        leavePay = expectedHours > 0 ? (paidLeaveHours / expectedHours) * baseSalary : 0;
      }

      // Employee Information
      const employeeData = [
        ['Employee Information', ''],
        ['Name', targetPaystub.employeeName],
        ['Employee ID', targetPaystub.employeeId],
        ['Position', targetPaystub.position],
        ['Department', targetPaystub.department],
        ['Period', targetPaystub.periodName],
        ['', ''],
        ['Payroll Details', ''],
        ['Base Salary', targetPaystub.baseSalary],
        ['Paid Leave Hours', targetPaystub.paidLeaveHours],
        ['Leave Pay', leavePay],
        ['Total Benefits', targetPaystub.totalBenefits],
        ['Total Deductions', targetPaystub.totalDeductions],
        ['Net Pay', targetPaystub.netPay],
        ['', ''],
        ['Benefits Breakdown', ''],
        ['Benefit Name', 'Amount']
      ];
      
      // Add benefits
      if (targetPaystub.benefits && targetPaystub.benefits.length > 0) {
        targetPaystub.benefits.forEach((benefit: any) => {
          employeeData.push([benefit.name, `+${benefit.amount}`]);
        });
        employeeData.push(['', '']); // Add empty row
      }
      
      // Add deductions section
      employeeData.push(['Deductions Breakdown', '']);
      employeeData.push(['Deduction Name', 'Amount']);
      
      // Add deductions
      if (targetPaystub.deductions && targetPaystub.deductions.length > 0) {
        targetPaystub.deductions.forEach((deduction: any) => {
          employeeData.push([deduction.name, `-${deduction.amount}`]);
        });
      }
      
      const worksheet = XLSX.utils.aoa_to_sheet(employeeData);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Paystub');
      
      // Generate Excel buffer
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      logger.info('Excel generation completed', { bufferSize: excelBuffer.length });
      return excelBuffer;
    } catch (error) {
      logger.error('Error generating paystub Excel:', error);
      throw error;
    }
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
    let leaveQuery = `
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
          'days', (l.end_date - l.start_date + 1)
        ) as details
      FROM leaves l
      LEFT JOIN users u ON l.approver_id = u.id
      WHERE l.employee_id = $1
    `;
    
    if (type && type !== 'leave') {
      leaveQuery += ' AND FALSE';
    }
    
    if (status) {
      leaveQuery += ' AND l.status = $2';
    }
    
    leaveQuery += ` ORDER BY l.created_at DESC`;

    // Get time correction requests
    let timeCorrectionQuery = `
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
    `;
    
    if (type && type !== 'time_correction') {
      timeCorrectionQuery += ' AND FALSE';
    }
    
    if (status) {
      timeCorrectionQuery += ' AND tcr.status = $2';
    }
    
    timeCorrectionQuery += ` ORDER BY tcr.created_at DESC`;

    // Get overtime requests
    let overtimeQuery = `
      SELECT 
        ot.id,
        'overtime' as type,
        ot.status,
        ot.created_at as "submittedAt",
        CONCAT(u.first_name, ' ', u.last_name) as "approverName",
        ot.approved_at as "approvedAt",
        ot.comments as "rejectionReason",
        json_build_object(
          'overtimeDate', ot.overtime_date,
          'startTime', ot.start_time,
          'endTime', ot.end_time,
          'requestedHours', ot.requested_hours,
          'reason', ot.reason
        ) as details
      FROM overtime_requests ot
      LEFT JOIN users u ON ot.approver_id = u.id
      WHERE ot.employee_id = $1
    `;
    
    if (type && type !== 'overtime') {
      overtimeQuery += ' AND FALSE';
    }
    
    if (status) {
      overtimeQuery += ' AND ot.status = $2';
    }
    
    overtimeQuery += ` ORDER BY ot.created_at DESC`;

    // Build parameter array based on what filters are applied
    const params_array = [employeeId];
    if (status) {
      params_array.push(status);
    }
    
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

    // Apply pagination to the combined results
    const startIndex = offset;
    const endIndex = offset + limit;
    const result = allRequests.slice(startIndex, endIndex);
    
    // Debug: Log the results
    console.log('Total requests found:', allRequests.length);
    console.log('Request IDs:', allRequests.map(r => r.id));
    console.log('Returning requests:', result.length);
    console.log('Returned IDs:', result.map(r => r.id));
    
    return result;
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

  /**
   * Get employee paystubs
   */
  async getEmployeePaystubs(employeeId: string, params: {
    year?: number;
    month?: number;
    page?: number;
    limit?: number;
  } = {}): Promise<PaystubData[]> {
    const { year, month, page = 1, limit = 10 } = params;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE pr.employee_id = $1';
    const queryParams: any[] = [employeeId];
    let paramIndex = 2;

    if (year) {
      whereClause += ` AND EXTRACT(YEAR FROM pp.start_date) = $${paramIndex++}`;
      queryParams.push(year);
    }

    if (month) {
      whereClause += ` AND EXTRACT(MONTH FROM pp.start_date) = $${paramIndex++}`;
      queryParams.push(month);
    }

    const query = `
      SELECT 
        pr.id,
        pr.payroll_period_id,
        pp.period_name,
        pp.start_date as period_start_date,
        pp.end_date as period_end_date,
        e.employee_id,
        CONCAT(u.first_name, ' ', u.last_name) as employee_name,
        e.position,
        e.department_id,
        d.name as department_name,
        e.base_salary,
        pr.total_regular_hours,
        pr.total_overtime_hours,
        pr.total_late_hours,
        pr.paid_leave_hours,
        pr.gross_pay,
        pr.total_deductions,
        pr.total_benefits,
        pr.net_pay,
        pr.late_deductions,
        pr.status,
        pr.created_at,
        pr.updated_at
      FROM payroll_records pr
      JOIN payroll_periods pp ON pr.payroll_period_id = pp.id
      JOIN employees e ON pr.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
      ${whereClause}
      ORDER BY pp.start_date DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    queryParams.push(limit, offset);
    const result = await getPool().query(query, queryParams);

    // Get deductions for each paystub
    const paystubs: PaystubData[] = [];
    for (const row of result.rows) {
      const deductionsQuery = `
        SELECT 
          pd.name,
          pd.amount
        FROM payroll_deductions pd
        WHERE pd.payroll_record_id = $1
        ORDER BY pd.name
      `;

      const deductionsResult = await getPool().query(deductionsQuery, [row.id]);
      
      // Get benefits for this paystub
      const benefitsQuery = `
        SELECT 
          bt.name,
          eb.amount
        FROM employee_benefits eb
        JOIN benefit_types bt ON eb.benefit_type_id = bt.id
        JOIN payroll_periods pp ON pp.id = $2
        WHERE eb.employee_id = $1 
          AND eb.is_active = true
          AND (eb.end_date IS NULL OR eb.end_date >= pp.start_date)
          AND eb.start_date <= pp.end_date
        ORDER BY bt.name
      `;
      
      const benefitsResult = await getPool().query(benefitsQuery, [employeeId, row.payroll_period_id]);
      
      paystubs.push({
        id: row.id,
        periodName: row.period_name,
        periodStartDate: row.period_start_date,
        periodEndDate: row.period_end_date,
        employeeId: row.employee_id,
        employeeName: row.employee_name,
        position: row.position,
        department: row.department_name || 'Unassigned',
        baseSalary: parseFloat(row.base_salary),
        totalRegularHours: parseFloat(row.total_regular_hours),
        totalOvertimeHours: parseFloat(row.total_overtime_hours),
        paidLeaveHours: parseFloat(row.paid_leave_hours) || 0,
        grossPay: parseFloat(row.gross_pay),
        totalDeductions: parseFloat(row.total_deductions),
        totalBenefits: parseFloat(row.total_benefits),
        netPay: parseFloat(row.net_pay),
        lateDeductions: parseFloat(row.late_deductions),
        deductions: deductionsResult.rows.map(d => ({
          name: d.name,
          amount: parseFloat(d.amount)
        })),
        benefits: benefitsResult.rows.map(b => ({
          name: b.name,
          amount: parseFloat(b.amount)
        })),
        createdAt: row.createdAt
      });
    }

    return paystubs;
  }

  /**
   * Get latest employee paystub
   */
  async getLatestPaystub(employeeId: string): Promise<PaystubData | null> {
    // First try to get the latest payroll record
    const query = `
      SELECT 
        pr.id,
        pr.payroll_period_id,
        pp.period_name,
        e.employee_id,
        CONCAT(u.first_name, ' ', u.last_name) as employee_name,
        e.position,
        e.department_id,
        d.name as department_name,
        e.base_salary,
        pr.total_regular_hours,
        pr.total_overtime_hours,
        pr.total_late_hours,
        pr.paid_leave_hours,
        pr.gross_pay,
        pr.total_deductions,
        pr.total_benefits,
        pr.net_pay,
        pr.late_deductions,
        pr.status,
        pr.created_at,
        pr.updated_at
      FROM payroll_records pr
      JOIN payroll_periods pp ON pr.payroll_period_id = pp.id
      JOIN employees e ON pr.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE pr.employee_id = $1
      ORDER BY pp.start_date DESC
      LIMIT 1
    `;

    const result = await getPool().query(query, [employeeId]);
    
    if (result.rows.length === 0) {
      // If no payroll records exist, return employee info with zero values
      const employeeQuery = `
        SELECT 
          e.employee_id as "employeeId",
          CONCAT(u.first_name, ' ', u.last_name) as "employeeName",
          e.position,
          d.name as department,
          e.base_salary as "baseSalary"
        FROM employees e
        JOIN users u ON e.user_id = u.id
        LEFT JOIN departments d ON e.department_id = d.id
        WHERE e.id = $1
      `;

      const employeeResult = await getPool().query(employeeQuery, [employeeId]);
      
      if (employeeResult.rows.length === 0) {
        return null;
      }

      const employee = employeeResult.rows[0];
      
      return {
        id: 'no-payroll',
        periodName: 'No Payroll Period',
        periodStartDate: new Date().toISOString(),
        periodEndDate: new Date().toISOString(),
        employeeId: employee.employeeId,
        employeeName: employee.employeeName,
        position: employee.position,
        department: employee.department || 'Unassigned',
        baseSalary: parseFloat(employee.baseSalary),
        totalRegularHours: 0,
        totalOvertimeHours: 0,
        paidLeaveHours: 0,
        grossPay: 0,
        totalDeductions: 0,
        totalBenefits: 0,
        netPay: 0,
        lateDeductions: 0,
        deductions: [],
        benefits: [],
        createdAt: new Date().toISOString()
      };
    }

    const row = result.rows[0];

    // Get deductions for the paystub
    const deductionsQuery = `
      SELECT 
        pd.name,
        pd.amount
      FROM payroll_deductions pd
      WHERE pd.payroll_record_id = $1
      ORDER BY pd.name
    `;

    const deductionsResult = await getPool().query(deductionsQuery, [row.id]);

    // Get benefits for this paystub
    const benefitsQuery = `
      SELECT 
        bt.name,
        eb.amount
      FROM employee_benefits eb
      JOIN benefit_types bt ON eb.benefit_type_id = bt.id
      JOIN payroll_periods pp ON pp.id = $2
      WHERE eb.employee_id = $1 
        AND eb.is_active = true
        AND (eb.end_date IS NULL OR eb.end_date >= pp.start_date)
        AND eb.start_date <= pp.end_date
      ORDER BY bt.name
    `;
    
    const benefitsResult = await getPool().query(benefitsQuery, [employeeId, row.payroll_period_id]);

    return {
      id: row.id,
      periodName: row.period_name,
      periodStartDate: row.periodStartDate,
      periodEndDate: row.periodEndDate,
      employeeId: row.employee_id,
      employeeName: row.employee_name,
      position: row.position,
      department: row.department_name || 'Unassigned',
      baseSalary: parseFloat(row.base_salary),
      totalRegularHours: parseFloat(row.total_regular_hours),
      totalOvertimeHours: parseFloat(row.total_overtime_hours),
      paidLeaveHours: parseFloat(row.paid_leave_hours) || 0,
      grossPay: parseFloat(row.gross_pay),
      totalDeductions: parseFloat(row.total_deductions),
      totalBenefits: parseFloat(row.total_benefits),
      netPay: parseFloat(row.net_pay),
      lateDeductions: parseFloat(row.late_deductions),
      deductions: deductionsResult.rows.map(d => ({
        name: d.name,
        amount: parseFloat(d.amount)
      })),
      benefits: benefitsResult.rows.map(b => ({
        name: b.name,
        amount: parseFloat(b.amount)
      })),
      createdAt: row.created_at
    };
  }
}

export const employeeService = new EmployeeService();
