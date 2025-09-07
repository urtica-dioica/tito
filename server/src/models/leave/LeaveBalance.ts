import { getPool } from '../../config/database';

export interface LeaveBalance {
  id: string;
  employeeId: string;
  leaveType: 'vacation' | 'sick' | 'maternity' | 'other';
  totalDays: number;
  usedDays: number;
  year: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeaveBalanceWithDetails extends LeaveBalance {
  employeeCode: string;
  employeeName: string;
  departmentName: string | null;
  availableDays: number;
}

export interface CreateLeaveBalanceData {
  employeeId: string;
  leaveType: 'vacation' | 'sick' | 'maternity' | 'other';
  totalDays: number;
  usedDays?: number;
  year: number;
}

export interface UpdateLeaveBalanceData {
  totalDays?: number;
  usedDays?: number;
}

export interface LeaveBalanceListParams {
  page?: number | undefined;
  limit?: number | undefined;
  employeeId?: string | undefined;
  departmentId?: string | undefined;
  leaveType?: 'vacation' | 'sick' | 'maternity' | 'other' | undefined;
  year?: number | undefined;
  search?: string | undefined;
  sortBy?: string | undefined;
  sortOrder?: 'asc' | 'desc' | undefined;
}

export class LeaveBalanceModel {
  /**
   * Create a new leave balance
   */
  async createLeaveBalance(data: CreateLeaveBalanceData): Promise<LeaveBalance> {
    const query = `
      INSERT INTO leave_balances (employee_id, leave_type, total_days, used_days, year)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING 
        id,
        employee_id as "employeeId",
        leave_type as "leaveType",
        total_days as "totalDays",
        used_days as "usedDays",
        year,
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    const result = await getPool().query(query, [
      data.employeeId,
      data.leaveType,
      data.totalDays,
      data.usedDays || 0,
      data.year
    ]);

    return result.rows[0];
  }

  /**
   * Get leave balance by ID
   */
  async findById(id: string): Promise<LeaveBalance | null> {
    const query = `
      SELECT 
        id,
        employee_id as "employeeId",
        leave_type as "leaveType",
        total_days as "totalDays",
        used_days as "usedDays",
        year,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM leave_balances
      WHERE id = $1
    `;

    const result = await getPool().query(query, [id]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Get leave balance with details
   */
  async findByIdWithDetails(id: string): Promise<LeaveBalanceWithDetails | null> {
    const query = `
      SELECT 
        lb.id,
        lb.employee_id as "employeeId",
        lb.leave_type as "leaveType",
        lb.total_days as "totalDays",
        lb.used_days as "usedDays",
        lb.year,
        lb.created_at as "createdAt",
        lb.updated_at as "updatedAt",
        e.employee_id as "employeeCode",
        CONCAT(u.first_name, ' ', u.last_name) as "employeeName",
        d.name as "departmentName",
        (lb.total_days - lb.used_days) as "availableDays"
      FROM leave_balances lb
      JOIN employees e ON lb.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE lb.id = $1
    `;

    const result = await getPool().query(query, [id]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Get leave balance by employee, leave type, and year
   */
  async findByEmployeeLeaveTypeAndYear(
    employeeId: string, 
    leaveType: 'vacation' | 'sick' | 'maternity' | 'other', 
    year: number
  ): Promise<LeaveBalance | null> {
    const query = `
      SELECT 
        id,
        employee_id as "employeeId",
        leave_type as "leaveType",
        total_days as "totalDays",
        used_days as "usedDays",
        year,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM leave_balances
      WHERE employee_id = $1 AND leave_type = $2 AND year = $3
    `;

    const result = await getPool().query(query, [employeeId, leaveType, year]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Update leave balance
   */
  async updateLeaveBalance(id: string, data: UpdateLeaveBalanceData): Promise<LeaveBalance | null> {
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (data.totalDays !== undefined) {
      updateFields.push(`total_days = $${paramIndex}`);
      updateValues.push(data.totalDays);
      paramIndex++;
    }

    if (data.usedDays !== undefined) {
      updateFields.push(`used_days = $${paramIndex}`);
      updateValues.push(data.usedDays);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return this.findById(id);
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(id);

    const query = `
      UPDATE leave_balances 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING 
        id,
        employee_id as "employeeId",
        leave_type as "leaveType",
        total_days as "totalDays",
        used_days as "usedDays",
        year,
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    const result = await getPool().query(query, updateValues);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Upsert leave balance (create or update)
   */
  async upsertLeaveBalance(data: CreateLeaveBalanceData): Promise<LeaveBalance> {
    const query = `
      INSERT INTO leave_balances (employee_id, leave_type, total_days, used_days, year)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (employee_id, leave_type, year)
      DO UPDATE SET
        total_days = EXCLUDED.total_days,
        used_days = EXCLUDED.used_days,
        updated_at = CURRENT_TIMESTAMP
      RETURNING 
        id,
        employee_id as "employeeId",
        leave_type as "leaveType",
        total_days as "totalDays",
        used_days as "usedDays",
        year,
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    const result = await getPool().query(query, [
      data.employeeId,
      data.leaveType,
      data.totalDays,
      data.usedDays || 0,
      data.year
    ]);

    return result.rows[0];
  }

  /**
   * List leave balances with filtering and pagination
   */
  async listLeaveBalances(params: LeaveBalanceListParams = {}): Promise<{
    balances: LeaveBalanceWithDetails[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 20,
      employeeId,
      departmentId,
      leaveType,
      year,
      search,
      sortBy = 'updated_at',
      sortOrder = 'desc'
    } = params;

    const offset = (page - 1) * limit;
    const whereConditions: string[] = [];
    const queryParams: any[] = [];
    let paramIndex = 1;

    // Build WHERE conditions
    if (employeeId) {
      whereConditions.push(`lb.employee_id = $${paramIndex}`);
      queryParams.push(employeeId);
      paramIndex++;
    }

    if (departmentId) {
      whereConditions.push(`e.department_id = $${paramIndex}`);
      queryParams.push(departmentId);
      paramIndex++;
    }

    if (leaveType) {
      whereConditions.push(`lb.leave_type = $${paramIndex}`);
      queryParams.push(leaveType);
      paramIndex++;
    }

    if (year) {
      whereConditions.push(`lb.year = $${paramIndex}`);
      queryParams.push(year);
      paramIndex++;
    }

    if (search) {
      whereConditions.push(`(CONCAT(u.first_name, ' ', u.last_name) ILIKE $${paramIndex} OR e.employee_id ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Count query
    const countQuery = `
      SELECT COUNT(*) as total
      FROM leave_balances lb
      JOIN employees e ON lb.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
      ${whereClause}
    `;

    const countResult = await getPool().query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Data query
    const dataQuery = `
      SELECT 
        lb.id,
        lb.employee_id as "employeeId",
        lb.leave_type as "leaveType",
        lb.total_days as "totalDays",
        lb.used_days as "usedDays",
        lb.year,
        lb.created_at as "createdAt",
        lb.updated_at as "updatedAt",
        e.employee_id as "employeeCode",
        CONCAT(u.first_name, ' ', u.last_name) as "employeeName",
        d.name as "departmentName",
        (lb.total_days - lb.used_days) as "availableDays"
      FROM leave_balances lb
      JOIN employees e ON lb.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
      ${whereClause}
      ORDER BY lb.${sortBy} ${sortOrder.toUpperCase()}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);
    const result = await getPool().query(dataQuery, queryParams);

    return {
      balances: result.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get leave balances for an employee
   */
  async getEmployeeLeaveBalances(employeeId: string, year?: number): Promise<LeaveBalanceWithDetails[]> {
    const whereConditions = ['lb.employee_id = $1'];
    const queryParams: any[] = [employeeId];
    let paramIndex = 2;

    if (year) {
      whereConditions.push(`lb.year = $${paramIndex}`);
      queryParams.push(year);
      paramIndex++;
    }

    const query = `
      SELECT 
        lb.id,
        lb.employee_id as "employeeId",
        lb.leave_type as "leaveType",
        lb.total_days as "totalDays",
        lb.used_days as "usedDays",
        lb.year,
        lb.created_at as "createdAt",
        lb.updated_at as "updatedAt",
        e.employee_id as "employeeCode",
        CONCAT(u.first_name, ' ', u.last_name) as "employeeName",
        d.name as "departmentName",
        (lb.total_days - lb.used_days) as "availableDays"
      FROM leave_balances lb
      JOIN employees e ON lb.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY lb.leave_type, lb.year DESC
    `;

    const result = await getPool().query(query, queryParams);
    return result.rows;
  }

  /**
   * Get leave balance summary for an employee
   */
  async getEmployeeLeaveBalanceSummary(employeeId: string, year: number): Promise<{
    vacation: { total: number; used: number; available: number };
    sick: { total: number; used: number; available: number };
    maternity: { total: number; used: number; available: number };
    other: { total: number; used: number; available: number };
  }> {
    const query = `
      SELECT 
        leave_type,
        COALESCE(SUM(total_days), 0) as total,
        COALESCE(SUM(used_days), 0) as used
      FROM leave_balances
      WHERE employee_id = $1 AND year = $2
      GROUP BY leave_type
    `;

    const result = await getPool().query(query, [employeeId, year]);
    
    const summary = {
      vacation: { total: 0, used: 0, available: 0 },
      sick: { total: 0, used: 0, available: 0 },
      maternity: { total: 0, used: 0, available: 0 },
      other: { total: 0, used: 0, available: 0 }
    };

    result.rows.forEach((row: any) => {
      const leaveType = row.leave_type as keyof typeof summary;
      if (summary[leaveType]) {
        summary[leaveType].total = parseFloat(row.total);
        summary[leaveType].used = parseFloat(row.used);
        summary[leaveType].available = summary[leaveType].total - summary[leaveType].used;
      }
    });

    return summary;
  }

  /**
   * Add leave days to balance
   */
  async addLeaveDays(employeeId: string, leaveType: 'vacation' | 'sick' | 'maternity' | 'other', days: number, year: number): Promise<LeaveBalance> {
    const query = `
      INSERT INTO leave_balances (employee_id, leave_type, total_days, used_days, year)
      VALUES ($1, $2, $3, 0, $4)
      ON CONFLICT (employee_id, leave_type, year)
      DO UPDATE SET
        total_days = leave_balances.total_days + $3,
        updated_at = CURRENT_TIMESTAMP
      RETURNING 
        id,
        employee_id as "employeeId",
        leave_type as "leaveType",
        total_days as "totalDays",
        used_days as "usedDays",
        year,
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    const result = await getPool().query(query, [employeeId, leaveType, days, year]);
    return result.rows[0];
  }

  /**
   * Use leave days from balance
   */
  async useLeaveDays(employeeId: string, leaveType: 'vacation' | 'sick' | 'maternity' | 'other', days: number, year: number): Promise<LeaveBalance | null> {
    const query = `
      UPDATE leave_balances 
      SET 
        used_days = used_days + $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE employee_id = $1 AND leave_type = $2 AND year = $4
        AND (total_days - used_days) >= $3
      RETURNING 
        id,
        employee_id as "employeeId",
        leave_type as "leaveType",
        total_days as "totalDays",
        used_days as "usedDays",
        year,
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    const result = await getPool().query(query, [employeeId, leaveType, days, year]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Get leave balance statistics
   */
  async getLeaveBalanceStats(departmentId?: string, year?: number): Promise<{
    totalEmployees: number;
    totalLeaveDays: number;
    usedLeaveDays: number;
    availableLeaveDays: number;
  }> {
    const whereConditions: string[] = [];
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (departmentId) {
      whereConditions.push(`e.department_id = $${paramIndex}`);
      queryParams.push(departmentId);
      paramIndex++;
    }

    if (year) {
      whereConditions.push(`lb.year = $${paramIndex}`);
      queryParams.push(year);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        COUNT(DISTINCT lb.employee_id) as total_employees,
        COALESCE(SUM(lb.total_days), 0) as total_leave_days,
        COALESCE(SUM(lb.used_days), 0) as used_leave_days,
        COALESCE(SUM(lb.total_days - lb.used_days), 0) as available_leave_days
      FROM leave_balances lb
      JOIN employees e ON lb.employee_id = e.id
      ${whereClause}
    `;

    const result = await getPool().query(query, queryParams);
    const stats = result.rows[0];

    return {
      totalEmployees: parseInt(stats.total_employees) || 0,
      totalLeaveDays: parseFloat(stats.total_leave_days) || 0,
      usedLeaveDays: parseFloat(stats.used_leave_days) || 0,
      availableLeaveDays: parseFloat(stats.available_leave_days) || 0
    };
  }

  /**
   * Delete leave balance
   */
  async deleteLeaveBalance(id: string): Promise<boolean> {
    const query = 'DELETE FROM leave_balances WHERE id = $1';
    const result = await getPool().query(query, [id]);
    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Get leave balance count
   */
  async getLeaveBalanceCount(): Promise<number> {
    const query = 'SELECT COUNT(*) as count FROM leave_balances';
    const result = await getPool().query(query);
    return parseInt(result.rows[0].count);
  }
}

export const leaveBalanceModel = new LeaveBalanceModel();