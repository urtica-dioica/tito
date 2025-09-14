import { LeaveAccrualModel, CreateLeaveAccrualData, LeaveAccrual, LeaveAccrualWithDetails, LeaveAccrualListParams } from '../../models/leave/LeaveAccrual';

export interface LeaveAccrualStats {
  totalAccruals: number;
  totalOvertimeHours: number;
  totalLeaveDaysAccrued: number;
  averageOvertimeToLeaveRatio: number;
  accrualsByEmployee: Array<{ employeeName: string; overtimeHours: number; leaveDaysAccrued: number }>;
  accrualsByDepartment: Array<{ departmentName: string; overtimeHours: number; leaveDaysAccrued: number }>;
  accrualsByMonth: Array<{ month: string; overtimeHours: number; leaveDaysAccrued: number }>;
}

export class LeaveAccrualService {
  private leaveAccrualModel: LeaveAccrualModel;

  constructor() {
    this.leaveAccrualModel = new LeaveAccrualModel();
  }

  async createLeaveAccrual(data: CreateLeaveAccrualData): Promise<LeaveAccrual> {
    return await this.leaveAccrualModel.createLeaveAccrual(data);
  }

  async getLeaveAccrual(id: string): Promise<LeaveAccrualWithDetails | null> {
    return await this.leaveAccrualModel.findByIdWithDetails(id);
  }

  async listLeaveAccruals(params: LeaveAccrualListParams = {}): Promise<{
    accruals: LeaveAccrualWithDetails[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return await this.leaveAccrualModel.listLeaveAccruals(params);
  }

  async getEmployeeLeaveAccruals(employeeId: string, startDate?: Date, endDate?: Date): Promise<LeaveAccrualWithDetails[]> {
    return await this.leaveAccrualModel.getEmployeeLeaveAccruals(employeeId, startDate, endDate);
  }

  async getLeaveAccrualStats(employeeId?: string, departmentId?: string, startDate?: Date, endDate?: Date): Promise<LeaveAccrualStats> {
    return await this.leaveAccrualModel.getLeaveAccrualStats(employeeId, departmentId, startDate, endDate);
  }

  async deleteLeaveAccrual(id: string): Promise<boolean> {
    return await this.leaveAccrualModel.deleteLeaveAccrual(id);
  }

  // Business logic methods

  async processOvertimeToLeaveAccrual(
    _employeeId: string,
    _overtimeHours: number,
    _attendanceRecordId?: string,
    _accrualDate?: Date
  ): Promise<LeaveAccrual> {
    // FEATURE DISABLED: Business rule change (2025-09-14)
    // Overtime hours are no longer convertible to leave days automatically.
    // HR can still manually create accrual records via the UI if needed.
    throw new Error('FEATURE_DISABLED: Automatic overtime-to-leave conversion has been removed.');
  }

  async processBulkOvertimeAccruals(
    _startDate: Date,
    _endDate: Date
  ): Promise<{
    processed: number;
    errors: Array<{ employeeId: string; error: string }>;
  }> {
    throw new Error('FEATURE_DISABLED: Bulk overtime accrual processing has been removed.');
  }

  async getEmployeeAccrualSummary(
    employeeId: string,
    year: number
  ): Promise<{
    totalOvertimeHours: number;
    totalLeaveDaysAccrued: number;
    accrualsByMonth: Array<{ month: string; overtimeHours: number; leaveDaysAccrued: number }>;
    recentAccruals: LeaveAccrualWithDetails[];
  }> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    const accruals = await this.getEmployeeLeaveAccruals(employeeId, startDate, endDate);
    
    const totalOvertimeHours = accruals.reduce((sum, accrual) => sum + accrual.overtimeHours, 0);
    const totalLeaveDaysAccrued = accruals.reduce((sum, accrual) => sum + accrual.leaveDaysAccrued, 0);

    // Group by month
    const accrualsByMonth = accruals.reduce((acc, accrual) => {
      const month = accrual.accrualDate.toISOString().substring(0, 7); // YYYY-MM
      const existing = acc.find(item => item.month === month);
      
      if (existing) {
        existing.overtimeHours += accrual.overtimeHours;
        existing.leaveDaysAccrued += accrual.leaveDaysAccrued;
      } else {
        acc.push({
          month,
          overtimeHours: accrual.overtimeHours,
          leaveDaysAccrued: accrual.leaveDaysAccrued
        });
      }
      
      return acc;
    }, [] as Array<{ month: string; overtimeHours: number; leaveDaysAccrued: number }>);

    // Sort by month
    accrualsByMonth.sort((a, b) => a.month.localeCompare(b.month));

    // Get recent accruals (last 10)
    const recentAccruals = accruals
      .sort((a, b) => b.accrualDate.getTime() - a.accrualDate.getTime())
      .slice(0, 10);

    return {
      totalOvertimeHours,
      totalLeaveDaysAccrued,
      accrualsByMonth,
      recentAccruals
    };
  }

  async validateAccrualData(data: CreateLeaveAccrualData): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Validate employee exists
    const { getPool } = await import('../../config/database');
    const pool = getPool();
    
    const employeeQuery = 'SELECT id FROM employees WHERE id = $1';
    const employeeResult = await pool.query(employeeQuery, [data.employeeId]);
    
    if (employeeResult.rows.length === 0) {
      errors.push('Employee not found');
    }

    // Validate overtime hours
    if (data.overtimeHours <= 0) {
      errors.push('Overtime hours must be greater than 0');
    }

    // Validate leave days accrued
    if (data.leaveDaysAccrued <= 0) {
      errors.push('Leave days accrued must be greater than 0');
    }

    // Validate accrual date
    if (data.accrualDate > new Date()) {
      errors.push('Accrual date cannot be in the future');
    }

    // Validate attendance record if provided
    if (data.attendanceRecordId) {
      const attendanceQuery = 'SELECT id FROM attendance_records WHERE id = $1';
      const attendanceResult = await pool.query(attendanceQuery, [data.attendanceRecordId]);
      
      if (attendanceResult.rows.length === 0) {
        errors.push('Attendance record not found');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Removed updateEmployeeLeaveBalance – obsolete with disabled overtime conversion

  async recalculateEmployeeAccruals(employeeId: string, year: number): Promise<{
    recalculated: number;
    totalOvertimeHours: number;
    totalLeaveDaysAccrued: number;
  }> {
    // FEATURE DISABLED: Overtime-to-leave conversion removed (2025-09-14)
    // This method is kept for API compatibility but no longer processes overtime accruals
    
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    // Still delete existing accruals for cleanup if needed
    const deleteQuery = `
      DELETE FROM leave_accruals 
      WHERE employee_id = $1 
        AND accrual_date >= $2 
        AND accrual_date <= $3
    `;
    
    const { getPool } = await import('../../config/database');
    const pool = getPool();
    await pool.query(deleteQuery, [employeeId, startDate, endDate]);

    // Skip overtime processing since automatic conversion is disabled
    // HR can manually create leave accruals via the UI if needed
    
    return {
      recalculated: 0,
      totalOvertimeHours: 0,
      totalLeaveDaysAccrued: 0
    };
  }
}