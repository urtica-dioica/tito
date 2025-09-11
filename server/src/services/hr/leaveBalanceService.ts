import { leaveBalanceModel, type LeaveBalance, type LeaveBalanceWithDetails, type CreateLeaveBalanceData, type UpdateLeaveBalanceData, type LeaveBalanceListParams } from '../../models/leave/LeaveBalance';
import { getPool } from '../../config/database';
import logger from '../../utils/logger';

export interface BulkLeaveBalanceData {
  employeeId: string;
  leaveType: 'vacation' | 'sick' | 'maternity' | 'other';
  balance: number;
}

export interface YearInitializationResult {
  employeesProcessed: number;
  balancesCreated: number;
  errors: string[];
}

export class LeaveBalanceService {
  /**
   * List leave balances with filtering and pagination
   */
  async listLeaveBalances(params: LeaveBalanceListParams): Promise<{
    balances: LeaveBalanceWithDetails[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return await leaveBalanceModel.listLeaveBalances(params);
  }

  /**
   * Get leave balance by ID
   */
  async getLeaveBalanceById(id: string): Promise<LeaveBalanceWithDetails | null> {
    return await leaveBalanceModel.findByIdWithDetails(id);
  }

  /**
   * Create or update leave balance
   */
  async upsertLeaveBalance(data: CreateLeaveBalanceData): Promise<LeaveBalance> {
    return await leaveBalanceModel.upsertLeaveBalance(data);
  }

  /**
   * Update leave balance
   */
  async updateLeaveBalance(id: string, data: UpdateLeaveBalanceData): Promise<LeaveBalance | null> {
    return await leaveBalanceModel.updateLeaveBalance(id, data);
  }

  /**
   * Delete leave balance
   */
  async deleteLeaveBalance(id: string): Promise<boolean> {
    return await leaveBalanceModel.deleteLeaveBalance(id);
  }

  /**
   * Bulk upsert leave balances
   */
  async bulkUpsertLeaveBalances(balances: BulkLeaveBalanceData[]): Promise<LeaveBalance[]> {
    const results: LeaveBalance[] = [];
    
    for (const balance of balances) {
      try {
        const result =         await leaveBalanceModel.upsertLeaveBalance({
          employeeId: balance.employeeId,
          leaveType: balance.leaveType,
          balance: balance.balance
        });
        results.push(result);
      } catch (error) {
        logger.error('Error upserting leave balance', {
          error: (error as Error).message,
          balance
        });
        throw error;
      }
    }

    return results;
  }

  /**
   * Initialize leave balances for all employees
   */
  async initializeLeaveBalances(
    vacationDays: number = 15,
    sickDays: number = 10,
    maternityDays: number = 0,
    otherDays: number = 0
  ): Promise<YearInitializationResult> {
    const result: YearInitializationResult = {
      employeesProcessed: 0,
      balancesCreated: 0,
      errors: []
    };

    try {
      // Get all active employees
      const employeesQuery = `
        SELECT e.id as employee_id
        FROM employees e
        JOIN users u ON e.user_id = u.id
        WHERE e.status = 'active' AND u.is_active = true
      `;

      const employeesResult = await getPool().query(employeesQuery);
      const employees = employeesResult.rows;

      result.employeesProcessed = employees.length;

      // Define leave types and their default days
      const leaveTypes = [
        { type: 'vacation' as const, days: vacationDays },
        { type: 'sick' as const, days: sickDays },
        { type: 'maternity' as const, days: maternityDays },
        { type: 'other' as const, days: otherDays }
      ];

      // Create leave balances for each employee
      for (const employee of employees) {
        for (const leaveType of leaveTypes) {
          if (leaveType.days > 0) {
            try {
              await leaveBalanceModel.upsertLeaveBalance({
                employeeId: employee.employee_id,
                leaveType: leaveType.type,
                balance: leaveType.days
              });
              result.balancesCreated++;
            } catch (error) {
              const errorMsg = `Failed to create ${leaveType.type} balance for employee ${employee.employee_id}: ${(error as Error).message}`;
              result.errors.push(errorMsg);
              logger.error('Error creating leave balance', {
                error: (error as Error).message,
                employeeId: employee.employee_id,
                leaveType: leaveType.type
              });
            }
          }
        }
      }

      logger.info('Leave balance initialization completed', {
        employeesProcessed: result.employeesProcessed,
        balancesCreated: result.balancesCreated,
        errors: result.errors.length
      });

    } catch (error) {
      logger.error('Error initializing leave balances', {
        error: (error as Error).message
      });
      throw error;
    }

    return result;
  }

  /**
   * Get leave balance statistics
   */
  async getLeaveBalanceStats(departmentId?: string): Promise<{
    totalEmployees: number;
    totalLeaveDays: number;
    usedLeaveDays: number;
    availableLeaveDays: number;
    byLeaveType: {
      vacation: { total: number; used: number; available: number };
      sick: { total: number; used: number; available: number };
      maternity: { total: number; used: number; available: number };
      other: { total: number; used: number; available: number };
    };
  }> {
    const stats = await leaveBalanceModel.getLeaveBalanceStats(departmentId);

    // Get breakdown by leave type
    const leaveTypeQuery = `
      SELECT 
        lb.leave_type,
        COALESCE(SUM(lb.balance), 0) as total
      FROM leave_balances lb
      JOIN employees e ON lb.employee_id = e.id
      WHERE 1=1
      ${departmentId ? 'AND e.department_id = $1' : ''}
      GROUP BY lb.leave_type
    `;

    const queryParams: any[] = [];
    if (departmentId) queryParams.push(departmentId);

    const leaveTypeResult = await getPool().query(leaveTypeQuery, queryParams);

    const byLeaveType = {
      vacation: { total: 0, used: 0, available: 0 },
      sick: { total: 0, used: 0, available: 0 },
      maternity: { total: 0, used: 0, available: 0 },
      other: { total: 0, used: 0, available: 0 }
    };

    leaveTypeResult.rows.forEach((row: any) => {
      const leaveType = row.leave_type as keyof typeof byLeaveType;
      if (byLeaveType[leaveType]) {
        byLeaveType[leaveType].total = parseFloat(row.total);
        byLeaveType[leaveType].used = 0; // No used days tracking in current schema
        byLeaveType[leaveType].available = parseFloat(row.total);
      }
    });

    return {
      ...stats,
      byLeaveType
    };
  }

  /**
   * Get employee leave balances
   */
  async getEmployeeLeaveBalances(employeeId: string): Promise<LeaveBalanceWithDetails[]> {
    return await leaveBalanceModel.getEmployeeLeaveBalances(employeeId);
  }

  /**
   * Get employee leave balance summary
   */
  async getEmployeeLeaveBalanceSummary(employeeId: string): Promise<{
    vacation: { total: number; used: number; available: number };
    sick: { total: number; used: number; available: number };
    maternity: { total: number; used: number; available: number };
    other: { total: number; used: number; available: number };
  }> {
    return await leaveBalanceModel.getEmployeeLeaveBalanceSummary(employeeId);
  }

  /**
   * Add leave days to balance
   */
  async addLeaveDays(employeeId: string, leaveType: 'vacation' | 'sick' | 'maternity' | 'other', days: number): Promise<LeaveBalance> {
    return await leaveBalanceModel.addLeaveDays(employeeId, leaveType, days);
  }

  /**
   * Use leave days from balance
   */
  async useLeaveDays(employeeId: string, leaveType: 'vacation' | 'sick' | 'maternity' | 'other', days: number): Promise<LeaveBalance | null> {
    return await leaveBalanceModel.useLeaveDays(employeeId, leaveType, days);
  }

  /**
   * Get employees without leave balances
   */
  async getEmployeesWithoutLeaveBalances(departmentId?: string): Promise<Array<{
    id: string;
    employeeId: string;
    name: string;
    departmentName: string | null;
    position: string;
  }>> {
    return await leaveBalanceModel.getEmployeesWithoutLeaveBalances(departmentId);
  }

  /**
   * Get leave balance templates by position
   */
  async getLeaveBalanceTemplates(): Promise<Array<{
    position: string;
    vacationDays: number;
    sickDays: number;
    maternityDays: number;
    otherDays: number;
    employeeCount: number;
  }>> {
    const query = `
      SELECT 
        e.position,
        AVG(CASE WHEN lb.leave_type = 'vacation' THEN lb.total_days ELSE 0 END) as vacation_days,
        AVG(CASE WHEN lb.leave_type = 'sick' THEN lb.total_days ELSE 0 END) as sick_days,
        AVG(CASE WHEN lb.leave_type = 'maternity' THEN lb.total_days ELSE 0 END) as maternity_days,
        AVG(CASE WHEN lb.leave_type = 'other' THEN lb.total_days ELSE 0 END) as other_days,
        COUNT(DISTINCT e.id) as employee_count
      FROM employees e
      LEFT JOIN leave_balances lb ON e.id = lb.employee_id AND lb.year = EXTRACT(YEAR FROM CURRENT_DATE)
      WHERE e.status = 'active'
      GROUP BY e.position
      ORDER BY e.position
    `;

    const result = await getPool().query(query);

    return result.rows.map(row => ({
      position: row.position,
      vacationDays: Math.round(parseFloat(row.vacation_days) || 0),
      sickDays: Math.round(parseFloat(row.sick_days) || 0),
      maternityDays: Math.round(parseFloat(row.maternity_days) || 0),
      otherDays: Math.round(parseFloat(row.other_days) || 0),
      employeeCount: parseInt(row.employee_count)
    }));
  }
}

export const leaveBalanceService = new LeaveBalanceService();
