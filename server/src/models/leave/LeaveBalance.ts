import { getPool } from '../../config/database';

export interface LeaveBalance {
  id: string;
  employeeId: string;
  leaveType: 'vacation' | 'sick' | 'maternity' | 'other';
  balance: number;
  year?: number;
  updatedAt: Date;
}

export interface LeaveBalanceWithDetails extends LeaveBalance {
  employeeCode: string;
  employeeName: string;
  departmentName: string | null;
}

export interface CreateLeaveBalanceData {
  employeeId: string;
  leaveType: 'vacation' | 'sick' | 'maternity' | 'other';
  balance: number;
  year?: number;
}

export interface UpdateLeaveBalanceData {
  balance?: number;
}

export interface LeaveBalanceListParams {
  page?: number | undefined;
  limit?: number | undefined;
  employeeId?: string | undefined;
  departmentId?: string | undefined;
  leaveType?: 'vacation' | 'sick' | 'maternity' | 'other' | undefined;
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
      INSERT INTO leave_balances (employee_id, leave_type, balance)
      VALUES ($1, $2, $3)
      RETURNING 
        id,
        employee_id as "employeeId",
        leave_type as "leaveType",
        balance,
        updated_at as "updatedAt"
    `;
    
    const result = await getPool().query(query, [
      data.employeeId,
      data.leaveType,
      data.balance
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
        balance,
        updated_at as "updatedAt"
      FROM leave_balances
      WHERE id = $1
    `;
    
    const result = await getPool().query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Get leave balance by ID with employee details
   */
  async findByIdWithDetails(id: string): Promise<LeaveBalanceWithDetails | null> {
    const query = `
      SELECT 
        lb.id,
        lb.employee_id as "employeeId",
        e.employee_id as "employeeCode",
        CONCAT(u.first_name, ' ', u.last_name) as "employeeName",
        d.name as "departmentName",
        lb.leave_type as "leaveType",
        lb.balance,
        lb.updated_at as "updatedAt"
      FROM leave_balances lb
      JOIN employees e ON lb.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE lb.id = $1
    `;
    
    const result = await getPool().query(query, [id]);
    return result.rows[0] || null;
  }

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
    const {
      page = 1,
      limit = 20,
      employeeId,
      departmentId,
      leaveType,
      search,
      sortBy = 'updated_at',
      sortOrder = 'desc'
    } = params;

    const whereConditions: string[] = [];
    const queryParams: any[] = [];
    let paramIndex = 1;

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
      ${whereClause}
    `;

    const countResult = await getPool().query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Data query
    const offset = (page - 1) * limit;
    const dataQuery = `
      SELECT 
        lb.id,
        lb.employee_id as "employeeId",
        e.employee_id as "employeeCode",
        CONCAT(u.first_name, ' ', u.last_name) as "employeeName",
        d.name as "departmentName",
        lb.leave_type as "leaveType",
        lb.balance,
        lb.updated_at as "updatedAt"
      FROM leave_balances lb
      JOIN employees e ON lb.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
      ${whereClause}
      ORDER BY lb.${sortBy} ${sortOrder.toUpperCase()}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const dataParams = [...queryParams, limit, offset];
    const dataResult = await getPool().query(dataQuery, dataParams);

    return {
      balances: dataResult.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Update leave balance
   */
  async updateLeaveBalance(id: string, data: UpdateLeaveBalanceData): Promise<LeaveBalance | null> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.balance !== undefined) {
      updateFields.push(`balance = $${paramIndex}`);
      values.push(data.balance);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return this.findById(id);
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    const query = `
      UPDATE leave_balances
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING 
        id,
        employee_id as "employeeId",
        leave_type as "leaveType",
        balance,
        updated_at as "updatedAt"
    `;

    values.push(id);
    const result = await getPool().query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Delete leave balance
   */
  async deleteLeaveBalance(id: string): Promise<boolean> {
    const query = 'DELETE FROM leave_balances WHERE id = $1';
    const result = await getPool().query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Upsert leave balance (create or update)
   */
  async upsertLeaveBalance(data: CreateLeaveBalanceData): Promise<LeaveBalance> {
    const query = `
      INSERT INTO leave_balances (employee_id, leave_type, balance)
      VALUES ($1, $2, $3)
      ON CONFLICT (employee_id, leave_type)
      DO UPDATE SET 
        balance = EXCLUDED.balance,
        updated_at = CURRENT_TIMESTAMP
      RETURNING 
        id,
        employee_id as "employeeId",
        leave_type as "leaveType",
        balance,
        updated_at as "updatedAt"
    `;
    
    const result = await getPool().query(query, [
      data.employeeId,
      data.leaveType,
      data.balance
    ]);
    
    return result.rows[0];
  }

  /**
   * Get leave balance statistics
   */
  async getLeaveBalanceStats(departmentId?: string): Promise<{
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

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        COUNT(DISTINCT lb.employee_id) as total_employees,
        COALESCE(SUM(lb.balance), 0) as total_leave_days,
        0 as used_leave_days,
        COALESCE(SUM(lb.balance), 0) as available_leave_days
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
   * Get employee leave balances
   */
  async getEmployeeLeaveBalances(employeeId: string, _year?: number): Promise<LeaveBalanceWithDetails[]> {
    const query = `
      SELECT 
        lb.id,
        lb.employee_id as "employeeId",
        e.employee_id as "employeeCode",
        CONCAT(u.first_name, ' ', u.last_name) as "employeeName",
        d.name as "departmentName",
        lb.leave_type as "leaveType",
        lb.balance,
        lb.updated_at as "updatedAt"
      FROM leave_balances lb
      JOIN employees e ON lb.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE lb.employee_id = $1
      ORDER BY lb.leave_type
    `;
    
    const result = await getPool().query(query, [employeeId]);
    return result.rows;
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
    const query = `
      SELECT 
        leave_type,
        COALESCE(balance, 0) as balance
      FROM leave_balances
      WHERE employee_id = $1
    `;
    
    const result = await getPool().query(query, [employeeId]);
    
    const summary = {
      vacation: { total: 0, used: 0, available: 0 },
      sick: { total: 0, used: 0, available: 0 },
      maternity: { total: 0, used: 0, available: 0 },
      other: { total: 0, used: 0, available: 0 }
    };

    result.rows.forEach((row: any) => {
      const leaveType = row.leave_type as keyof typeof summary;
      if (summary[leaveType]) {
        summary[leaveType].total = parseFloat(row.balance);
        summary[leaveType].available = parseFloat(row.balance);
      }
    });

    return summary;
  }

  /**
   * Add leave days to balance
   */
  async addLeaveDays(employeeId: string, leaveType: 'vacation' | 'sick' | 'maternity' | 'other', days: number): Promise<LeaveBalance> {
    const query = `
      INSERT INTO leave_balances (employee_id, leave_type, balance)
      VALUES ($1, $2, $3)
      ON CONFLICT (employee_id, leave_type)
      DO UPDATE SET 
        balance = leave_balances.balance + EXCLUDED.balance,
        updated_at = CURRENT_TIMESTAMP
      RETURNING 
        id,
        employee_id as "employeeId",
        leave_type as "leaveType",
        balance,
        updated_at as "updatedAt"
    `;
    
    const result = await getPool().query(query, [employeeId, leaveType, days]);
    return result.rows[0];
  }

  /**
   * Use leave days from balance
   */
  async useLeaveDays(employeeId: string, leaveType: 'vacation' | 'sick' | 'maternity' | 'other', days: number, _year?: number): Promise<LeaveBalance | null> {
    const query = `
      UPDATE leave_balances
      SET 
        balance = GREATEST(0, balance - $3),
        updated_at = CURRENT_TIMESTAMP
      WHERE employee_id = $1 AND leave_type = $2 AND balance >= $3
      RETURNING 
        id,
        employee_id as "employeeId",
        leave_type as "leaveType",
        balance,
        updated_at as "updatedAt"
    `;
    
    const result = await getPool().query(query, [employeeId, leaveType, days]);
    return result.rows[0] || null;
  }

  /**
   * Find leave balance by employee, leave type, and year
   */
  async findByEmployeeLeaveTypeAndYear(employeeId: string, leaveType: 'vacation' | 'sick' | 'maternity' | 'other', _year: number): Promise<LeaveBalance | null> {
    const query = `
      SELECT 
        id,
        employee_id as "employeeId",
        leave_type as "leaveType",
        balance,
        updated_at as "updatedAt"
      FROM leave_balances
      WHERE employee_id = $1 AND leave_type = $2
    `;
    
    const result = await getPool().query(query, [employeeId, leaveType]);
    return result.rows[0] || null;
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
    const whereConditions: string[] = ['e.status = \'active\'', 'u.is_active = true'];
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (departmentId) {
      whereConditions.push(`e.department_id = $${paramIndex}`);
      queryParams.push(departmentId);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    const query = `
      SELECT 
        e.id,
        e.employee_id as "employeeId",
        CONCAT(u.first_name, ' ', u.last_name) as name,
        d.name as "departmentName",
        e.position
      FROM employees e
      JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE ${whereClause}
        AND e.id NOT IN (
          SELECT DISTINCT employee_id 
          FROM leave_balances
        )
      ORDER BY u.last_name, u.first_name
    `;

    const result = await getPool().query(query, queryParams);

    return result.rows.map(row => ({
      id: row.id,
      employeeId: row.employeeId,
      name: row.name,
      departmentName: row.departmentName,
      position: row.position
    }));
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
        AVG(CASE WHEN lb.leave_type = 'vacation' THEN lb.balance ELSE 0 END) as vacation_days,
        AVG(CASE WHEN lb.leave_type = 'sick' THEN lb.balance ELSE 0 END) as sick_days,
        AVG(CASE WHEN lb.leave_type = 'maternity' THEN lb.balance ELSE 0 END) as maternity_days,
        AVG(CASE WHEN lb.leave_type = 'other' THEN lb.balance ELSE 0 END) as other_days,
        COUNT(DISTINCT e.id) as employee_count
      FROM employees e
      LEFT JOIN leave_balances lb ON e.id = lb.employee_id
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

export const leaveBalanceModel = new LeaveBalanceModel();