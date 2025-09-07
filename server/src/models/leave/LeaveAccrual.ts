import { Pool } from 'pg';
import { getPool } from '../../config/database';

export interface LeaveAccrual {
  id: string;
  employeeId: string;
  attendanceRecordId: string | null;
  overtimeHours: number;
  leaveDaysAccrued: number;
  accrualDate: Date;
  createdAt: Date;
}

export interface LeaveAccrualWithDetails extends LeaveAccrual {
  employee: {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  department?: {
    id: string;
    name: string;
  } | null;
  attendanceRecord?: {
    id: string;
    date: Date;
    overallStatus: string;
  } | null;
}

export interface CreateLeaveAccrualData {
  employeeId: string;
  attendanceRecordId?: string;
  overtimeHours: number;
  leaveDaysAccrued: number;
  accrualDate: Date;
}

export interface LeaveAccrualListParams {
  page?: number;
  limit?: number;
  employeeId?: string;
  departmentId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class LeaveAccrualModel {
  private pool: Pool;

  constructor() {
    this.pool = getPool();
  }

  async createLeaveAccrual(data: CreateLeaveAccrualData): Promise<LeaveAccrual> {
    const query = `
      INSERT INTO leave_accruals (
        employee_id, attendance_record_id, overtime_hours, leave_days_accrued, accrual_date
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [
      data.employeeId,
      data.attendanceRecordId || null,
      data.overtimeHours,
      data.leaveDaysAccrued,
      data.accrualDate
    ];

    const result = await this.pool.query(query, values);
    return this.mapRowToLeaveAccrual(result.rows[0]);
  }

  async findById(id: string): Promise<LeaveAccrual | null> {
    const query = 'SELECT * FROM leave_accruals WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapRowToLeaveAccrual(result.rows[0]);
  }

  async findByIdWithDetails(id: string): Promise<LeaveAccrualWithDetails | null> {
    const query = `
      SELECT 
        la.*,
        e.id as employee_id,
        e.employee_id as employee_code,
        u.first_name,
        u.last_name,
        u.email,
        d.id as department_id,
        d.name as department_name,
        ar.id as attendance_record_id,
        ar.date as attendance_date,
        ar.overall_status
      FROM leave_accruals la
      JOIN employees e ON la.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN attendance_records ar ON la.attendance_record_id = ar.id
      WHERE la.id = $1
    `;
    
    const result = await this.pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapRowToLeaveAccrualWithDetails(result.rows[0]);
  }

  async listLeaveAccruals(params: LeaveAccrualListParams = {}): Promise<{
    accruals: LeaveAccrualWithDetails[];
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
      startDate,
      endDate,
      search,
      sortBy = 'accrual_date',
      sortOrder = 'desc'
    } = params;

    const offset = (page - 1) * limit;
    let whereConditions: string[] = [];
    let values: any[] = [];
    let valueIndex = 1;

    // Build WHERE conditions
    if (employeeId) {
      whereConditions.push(`la.employee_id = $${valueIndex}`);
      values.push(employeeId);
      valueIndex++;
    }

    if (departmentId) {
      whereConditions.push(`e.department_id = $${valueIndex}`);
      values.push(departmentId);
      valueIndex++;
    }

    if (startDate) {
      whereConditions.push(`la.accrual_date >= $${valueIndex}`);
      values.push(startDate);
      valueIndex++;
    }

    if (endDate) {
      whereConditions.push(`la.accrual_date <= $${valueIndex}`);
      values.push(endDate);
      valueIndex++;
    }

    if (search) {
      whereConditions.push(`(
        e.employee_id ILIKE $${valueIndex} OR 
        u.first_name ILIKE $${valueIndex} OR
        u.last_name ILIKE $${valueIndex} OR
        u.email ILIKE $${valueIndex} OR
        d.name ILIKE $${valueIndex}
      )`);
      values.push(`%${search}%`);
      valueIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Count query
    const countQuery = `
      SELECT COUNT(*) 
      FROM leave_accruals la
      JOIN employees e ON la.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
      ${whereClause}
    `;
    const countResult = await this.pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count);

    // Main query
    const query = `
      SELECT 
        la.*,
        e.id as employee_id,
        e.employee_id as employee_code,
        u.first_name,
        u.last_name,
        u.email,
        d.id as department_id,
        d.name as department_name,
        ar.id as attendance_record_id,
        ar.date as attendance_date,
        ar.overall_status
      FROM leave_accruals la
      JOIN employees e ON la.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN attendance_records ar ON la.attendance_record_id = ar.id
      ${whereClause}
      ORDER BY la.${sortBy} ${sortOrder.toUpperCase()}
      LIMIT $${valueIndex} OFFSET $${valueIndex + 1}
    `;
    values.push(limit, offset);

    const result = await this.pool.query(query, values);
    const accruals = result.rows.map(row => this.mapRowToLeaveAccrualWithDetails(row));

    return {
      accruals,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getEmployeeLeaveAccruals(employeeId: string, startDate?: Date, endDate?: Date): Promise<LeaveAccrualWithDetails[]> {
    let whereConditions = ['la.employee_id = $1'];
    let values: any[] = [employeeId];
    let valueIndex = 2;

    if (startDate) {
      whereConditions.push(`la.accrual_date >= $${valueIndex}`);
      values.push(startDate);
      valueIndex++;
    }

    if (endDate) {
      whereConditions.push(`la.accrual_date <= $${valueIndex}`);
      values.push(endDate);
      valueIndex++;
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

    const query = `
      SELECT 
        la.*,
        e.id as employee_id,
        e.employee_id as employee_code,
        u.first_name,
        u.last_name,
        u.email,
        d.id as department_id,
        d.name as department_name,
        ar.id as attendance_record_id,
        ar.date as attendance_date,
        ar.overall_status
      FROM leave_accruals la
      JOIN employees e ON la.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN attendance_records ar ON la.attendance_record_id = ar.id
      ${whereClause}
      ORDER BY la.accrual_date DESC
    `;
    
    const result = await this.pool.query(query, values);
    return result.rows.map(row => this.mapRowToLeaveAccrualWithDetails(row));
  }

  async getLeaveAccrualStats(employeeId?: string, departmentId?: string, startDate?: Date, endDate?: Date): Promise<{
    totalAccruals: number;
    totalOvertimeHours: number;
    totalLeaveDaysAccrued: number;
    averageOvertimeToLeaveRatio: number;
    accrualsByEmployee: Array<{ employeeName: string; overtimeHours: number; leaveDaysAccrued: number }>;
    accrualsByDepartment: Array<{ departmentName: string; overtimeHours: number; leaveDaysAccrued: number }>;
    accrualsByMonth: Array<{ month: string; overtimeHours: number; leaveDaysAccrued: number }>;
  }> {
    let whereConditions: string[] = [];
    let values: any[] = [];
    let valueIndex = 1;

    if (employeeId) {
      whereConditions.push(`la.employee_id = $${valueIndex}`);
      values.push(employeeId);
      valueIndex++;
    }

    if (departmentId) {
      whereConditions.push(`e.department_id = $${valueIndex}`);
      values.push(departmentId);
      valueIndex++;
    }

    if (startDate) {
      whereConditions.push(`la.accrual_date >= $${valueIndex}`);
      values.push(startDate);
      valueIndex++;
    }

    if (endDate) {
      whereConditions.push(`la.accrual_date <= $${valueIndex}`);
      values.push(endDate);
      valueIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Total stats
    const totalQuery = `
      SELECT 
        COUNT(*) as total_accruals,
        SUM(la.overtime_hours) as total_overtime_hours,
        SUM(la.leave_days_accrued) as total_leave_days_accrued,
        AVG(la.leave_days_accrued / NULLIF(la.overtime_hours, 0)) as avg_ratio
      FROM leave_accruals la
      JOIN employees e ON la.employee_id = e.id
      ${whereClause}
    `;
    const totalResult = await this.pool.query(totalQuery, values);

    // By employee
    const employeeQuery = `
      SELECT 
        CONCAT(u.first_name, ' ', u.last_name) as employee_name,
        SUM(la.overtime_hours) as overtime_hours,
        SUM(la.leave_days_accrued) as leave_days_accrued
      FROM leave_accruals la
      JOIN employees e ON la.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      ${whereClause}
      GROUP BY e.id, u.first_name, u.last_name
      ORDER BY overtime_hours DESC
      LIMIT 10
    `;
    const employeeResult = await this.pool.query(employeeQuery, values);

    // By department
    const departmentQuery = `
      SELECT 
        COALESCE(d.name, 'No Department') as department_name,
        SUM(la.overtime_hours) as overtime_hours,
        SUM(la.leave_days_accrued) as leave_days_accrued
      FROM leave_accruals la
      JOIN employees e ON la.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      ${whereClause}
      GROUP BY d.id, d.name
      ORDER BY overtime_hours DESC
    `;
    const departmentResult = await this.pool.query(departmentQuery, values);

    // By month
    const monthQuery = `
      SELECT 
        TO_CHAR(la.accrual_date, 'YYYY-MM') as month,
        SUM(la.overtime_hours) as overtime_hours,
        SUM(la.leave_days_accrued) as leave_days_accrued
      FROM leave_accruals la
      JOIN employees e ON la.employee_id = e.id
      ${whereClause}
      GROUP BY TO_CHAR(la.accrual_date, 'YYYY-MM')
      ORDER BY month DESC
      LIMIT 12
    `;
    const monthResult = await this.pool.query(monthQuery, values);

    const totalRow = totalResult.rows[0];
    return {
      totalAccruals: parseInt(totalRow.total_accruals) || 0,
      totalOvertimeHours: parseFloat(totalRow.total_overtime_hours) || 0,
      totalLeaveDaysAccrued: parseFloat(totalRow.total_leave_days_accrued) || 0,
      averageOvertimeToLeaveRatio: parseFloat(totalRow.avg_ratio) || 0,
      accrualsByEmployee: employeeResult.rows,
      accrualsByDepartment: departmentResult.rows,
      accrualsByMonth: monthResult.rows
    };
  }

  async deleteLeaveAccrual(id: string): Promise<boolean> {
    const query = 'DELETE FROM leave_accruals WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getLeaveAccrualCount(): Promise<number> {
    const query = 'SELECT COUNT(*) FROM leave_accruals';
    const result = await this.pool.query(query);
    return parseInt(result.rows[0].count);
  }

  private mapRowToLeaveAccrual(row: any): LeaveAccrual {
    return {
      id: row.id,
      employeeId: row.employee_id,
      attendanceRecordId: row.attendance_record_id,
      overtimeHours: parseFloat(row.overtime_hours),
      leaveDaysAccrued: parseFloat(row.leave_days_accrued),
      accrualDate: row.accrual_date,
      createdAt: row.created_at
    };
  }

  private mapRowToLeaveAccrualWithDetails(row: any): LeaveAccrualWithDetails {
    return {
      id: row.id,
      employeeId: row.employee_id,
      attendanceRecordId: row.attendance_record_id,
      overtimeHours: parseFloat(row.overtime_hours),
      leaveDaysAccrued: parseFloat(row.leave_days_accrued),
      accrualDate: row.accrual_date,
      createdAt: row.created_at,
      employee: {
        id: row.employee_id,
        employeeId: row.employee_code,
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email
      },
      department: row.department_id ? {
        id: row.department_id,
        name: row.department_name
      } : null,
      attendanceRecord: row.attendance_record_id ? {
        id: row.attendance_record_id,
        date: row.attendance_date,
        overallStatus: row.overall_status
      } : null
    };
  }
}