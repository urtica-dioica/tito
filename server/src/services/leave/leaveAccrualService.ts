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
    employeeId: string,
    overtimeHours: number,
    attendanceRecordId?: string,
    accrualDate?: Date
  ): Promise<LeaveAccrual> {
    // Get the overtime to leave ratio from system settings
    const { getPool } = await import('../../config/database');
    const pool = getPool();
    
    const ratioQuery = `
      SELECT setting_value 
      FROM system_settings 
      WHERE setting_key = 'overtime_to_leave_ratio'
    `;
    
    const ratioResult = await pool.query(ratioQuery);
    const overtimeToLeaveRatio = ratioResult.rows.length > 0 
      ? parseFloat(ratioResult.rows[0].setting_value) 
      : 0.125; // Default: 1 day per 8 hours (0.125)

    const leaveDaysAccrued = overtimeHours * overtimeToLeaveRatio;

    // Create the leave accrual record
    const accrualData: CreateLeaveAccrualData = {
      employeeId,
      attendanceRecordId,
      overtimeHours,
      leaveDaysAccrued,
      accrualDate: accrualDate || new Date()
    };

    const accrual = await this.createLeaveAccrual(accrualData);

    // Update the employee's leave balance
    await this.updateEmployeeLeaveBalance(employeeId, 'vacation', leaveDaysAccrued);

    return accrual;
  }

  async processBulkOvertimeAccruals(
    startDate: Date,
    endDate: Date
  ): Promise<{
    processed: number;
    errors: Array<{ employeeId: string; error: string }>;
  }> {
    const { getPool } = await import('../../config/database');
    const pool = getPool();
    
    // Get all overtime sessions in the date range
    const overtimeQuery = `
      SELECT 
        ar.employee_id,
        ar.id as attendance_record_id,
        ar.date,
        SUM(as.calculated_hours) as total_overtime_hours
      FROM attendance_records ar
      JOIN attendance_sessions as ON ar.id = as.attendance_record_id
      WHERE as.session_type = 'overtime' 
        AND ar.date >= $1 
        AND ar.date <= $2
        AND as.calculated_hours > 0
      GROUP BY ar.employee_id, ar.id, ar.date
    `;
    
    const overtimeResult = await pool.query(overtimeQuery, [startDate, endDate]);
    
    let processed = 0;
    const errors: Array<{ employeeId: string; error: string }> = [];

    for (const row of overtimeResult.rows) {
      try {
        // Check if accrual already exists for this attendance record
        const existingQuery = `
          SELECT id FROM leave_accruals 
          WHERE attendance_record_id = $1
        `;
        const existingResult = await pool.query(existingQuery, [row.attendance_record_id]);
        
        if (existingResult.rows.length > 0) {
          continue; // Skip if already processed
        }

        await this.processOvertimeToLeaveAccrual(
          row.employee_id,
          parseFloat(row.total_overtime_hours),
          row.attendance_record_id,
          row.date
        );
        
        processed++;
      } catch (error) {
        errors.push({
          employeeId: row.employee_id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return { processed, errors };
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

  private async updateEmployeeLeaveBalance(
    employeeId: string,
    leaveType: 'vacation' | 'sick' | 'maternity' | 'other',
    daysToAdd: number
  ): Promise<void> {
    const { getPool } = await import('../../config/database');
    const pool = getPool();
    
    const currentYear = new Date().getFullYear();
    
    // Upsert leave balance
    const upsertQuery = `
      INSERT INTO leave_balances (employee_id, leave_type, balance, year, updated_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      ON CONFLICT (employee_id, leave_type, year)
      DO UPDATE SET 
        balance = leave_balances.balance + $3,
        updated_at = CURRENT_TIMESTAMP
    `;
    
    await pool.query(upsertQuery, [employeeId, leaveType, daysToAdd, currentYear]);
  }

  async recalculateEmployeeAccruals(employeeId: string, year: number): Promise<{
    recalculated: number;
    totalOvertimeHours: number;
    totalLeaveDaysAccrued: number;
  }> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    // Delete existing accruals for the year
    const deleteQuery = `
      DELETE FROM leave_accruals 
      WHERE employee_id = $1 
        AND accrual_date >= $2 
        AND accrual_date <= $3
    `;
    
    const { getPool } = await import('../../config/database');
    const pool = getPool();
    await pool.query(deleteQuery, [employeeId, startDate, endDate]);

    // Recalculate from overtime sessions
    const overtimeQuery = `
      SELECT 
        ar.id as attendance_record_id,
        ar.date,
        SUM(as.calculated_hours) as total_overtime_hours
      FROM attendance_records ar
      JOIN attendance_sessions as ON ar.id = as.attendance_record_id
      WHERE ar.employee_id = $1 
        AND as.session_type = 'overtime' 
        AND ar.date >= $2 
        AND ar.date <= $3
        AND as.calculated_hours > 0
      GROUP BY ar.id, ar.date
    `;
    
    const overtimeResult = await pool.query(overtimeQuery, [employeeId, startDate, endDate]);
    
    let recalculated = 0;
    let totalOvertimeHours = 0;
    let totalLeaveDaysAccrued = 0;

    for (const row of overtimeResult.rows) {
      const accrual = await this.processOvertimeToLeaveAccrual(
        employeeId,
        parseFloat(row.total_overtime_hours),
        row.attendance_record_id,
        row.date
      );
      
      recalculated++;
      totalOvertimeHours += accrual.overtimeHours;
      totalLeaveDaysAccrued += accrual.leaveDaysAccrued;
    }

    return {
      recalculated,
      totalOvertimeHours,
      totalLeaveDaysAccrued
    };
  }
}