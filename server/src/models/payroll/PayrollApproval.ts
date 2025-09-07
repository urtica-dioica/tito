import { Pool } from 'pg';
import { getPool } from '../../config/database';

export interface PayrollApproval {
  id: string;
  payrollPeriodId: string;
  approverId: string;
  departmentId: string | null;
  status: 'pending' | 'approved' | 'rejected';
  comments: string | null;
  approvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PayrollApprovalWithDetails extends PayrollApproval {
  approver: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  department?: {
    id: string;
    name: string;
    description: string | null;
  } | null;
  payrollPeriod: {
    id: string;
    periodName: string;
    startDate: Date;
    endDate: Date;
    status: string;
  };
}

export interface CreatePayrollApprovalData {
  payrollPeriodId: string;
  approverId: string;
  departmentId?: string;
  status?: 'pending' | 'approved' | 'rejected';
  comments?: string;
}

export interface UpdatePayrollApprovalData {
  status?: 'pending' | 'approved' | 'rejected';
  comments?: string;
  approvedAt?: Date;
}

export interface PayrollApprovalListParams {
  page?: number;
  limit?: number;
  payrollPeriodId?: string;
  approverId?: string;
  departmentId?: string;
  status?: 'pending' | 'approved' | 'rejected';
  startDate?: Date;
  endDate?: Date;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class PayrollApprovalModel {
  private pool: Pool;

  constructor() {
    this.pool = getPool();
  }

  async createPayrollApproval(data: CreatePayrollApprovalData): Promise<PayrollApproval> {
    const query = `
      INSERT INTO payroll_approvals (
        payroll_period_id, approver_id, department_id, status, comments
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [
      data.payrollPeriodId,
      data.approverId,
      data.departmentId || null,
      data.status || 'pending',
      data.comments || null
    ];

    const result = await this.pool.query(query, values);
    return this.mapRowToPayrollApproval(result.rows[0]);
  }

  async findById(id: string): Promise<PayrollApproval | null> {
    const query = 'SELECT * FROM payroll_approvals WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapRowToPayrollApproval(result.rows[0]);
  }

  async findByIdWithDetails(id: string): Promise<PayrollApprovalWithDetails | null> {
    const query = `
      SELECT 
        pa.*,
        u.id as approver_id,
        u.email as approver_email,
        u.first_name as approver_first_name,
        u.last_name as approver_last_name,
        u.role as approver_role,
        d.id as department_id,
        d.name as department_name,
        d.description as department_description,
        pp.id as period_id,
        pp.period_name,
        pp.start_date,
        pp.end_date,
        pp.status as period_status
      FROM payroll_approvals pa
      LEFT JOIN users u ON pa.approver_id = u.id
      LEFT JOIN departments d ON pa.department_id = d.id
      LEFT JOIN payroll_periods pp ON pa.payroll_period_id = pp.id
      WHERE pa.id = $1
    `;
    
    const result = await this.pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapRowToPayrollApprovalWithDetails(result.rows[0]);
  }

  async updatePayrollApproval(id: string, data: UpdatePayrollApprovalData): Promise<PayrollApproval | null> {
    const setClause: string[] = [];
    const values: any[] = [];
    let valueIndex = 1;

    if (data.status !== undefined) {
      setClause.push(`status = $${valueIndex}`);
      values.push(data.status);
      valueIndex++;
    }

    if (data.comments !== undefined) {
      setClause.push(`comments = $${valueIndex}`);
      values.push(data.comments);
      valueIndex++;
    }

    if (data.approvedAt !== undefined) {
      setClause.push(`approved_at = $${valueIndex}`);
      values.push(data.approvedAt);
      valueIndex++;
    }

    if (setClause.length === 0) {
      return this.findById(id);
    }

    setClause.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE payroll_approvals 
      SET ${setClause.join(', ')}
      WHERE id = $${valueIndex}
      RETURNING *
    `;

    const result = await this.pool.query(query, values);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapRowToPayrollApproval(result.rows[0]);
  }

  async listPayrollApprovals(params: PayrollApprovalListParams = {}): Promise<{
    approvals: PayrollApprovalWithDetails[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 20,
      payrollPeriodId,
      approverId,
      departmentId,
      status,
      startDate,
      endDate,
      search,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = params;

    const offset = (page - 1) * limit;
    let whereConditions: string[] = [];
    let values: any[] = [];
    let valueIndex = 1;

    // Build WHERE conditions
    if (payrollPeriodId) {
      whereConditions.push(`pa.payroll_period_id = $${valueIndex}`);
      values.push(payrollPeriodId);
      valueIndex++;
    }

    if (approverId) {
      whereConditions.push(`pa.approver_id = $${valueIndex}`);
      values.push(approverId);
      valueIndex++;
    }

    if (departmentId) {
      whereConditions.push(`pa.department_id = $${valueIndex}`);
      values.push(departmentId);
      valueIndex++;
    }

    if (status) {
      whereConditions.push(`pa.status = $${valueIndex}`);
      values.push(status);
      valueIndex++;
    }

    if (startDate) {
      whereConditions.push(`pa.created_at >= $${valueIndex}`);
      values.push(startDate);
      valueIndex++;
    }

    if (endDate) {
      whereConditions.push(`pa.created_at <= $${valueIndex}`);
      values.push(endDate);
      valueIndex++;
    }

    if (search) {
      whereConditions.push(`(
        pp.period_name ILIKE $${valueIndex} OR 
        u.first_name ILIKE $${valueIndex} OR
        u.last_name ILIKE $${valueIndex} OR
        u.email ILIKE $${valueIndex} OR
        d.name ILIKE $${valueIndex} OR
        pa.comments ILIKE $${valueIndex}
      )`);
      values.push(`%${search}%`);
      valueIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Count query
    const countQuery = `
      SELECT COUNT(*) 
      FROM payroll_approvals pa
      LEFT JOIN users u ON pa.approver_id = u.id
      LEFT JOIN departments d ON pa.department_id = d.id
      LEFT JOIN payroll_periods pp ON pa.payroll_period_id = pp.id
      ${whereClause}
    `;
    const countResult = await this.pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count);

    // Main query
    const query = `
      SELECT 
        pa.*,
        u.id as approver_id,
        u.email as approver_email,
        u.first_name as approver_first_name,
        u.last_name as approver_last_name,
        u.role as approver_role,
        d.id as department_id,
        d.name as department_name,
        d.description as department_description,
        pp.id as period_id,
        pp.period_name,
        pp.start_date,
        pp.end_date,
        pp.status as period_status
      FROM payroll_approvals pa
      LEFT JOIN users u ON pa.approver_id = u.id
      LEFT JOIN departments d ON pa.department_id = d.id
      LEFT JOIN payroll_periods pp ON pa.payroll_period_id = pp.id
      ${whereClause}
      ORDER BY pa.${sortBy} ${sortOrder.toUpperCase()}
      LIMIT $${valueIndex} OFFSET $${valueIndex + 1}
    `;
    values.push(limit, offset);

    const result = await this.pool.query(query, values);
    const approvals = result.rows.map(row => this.mapRowToPayrollApprovalWithDetails(row));

    return {
      approvals,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getPendingApprovalsForApprover(approverId: string): Promise<PayrollApprovalWithDetails[]> {
    const query = `
      SELECT 
        pa.*,
        u.id as approver_id,
        u.email as approver_email,
        u.first_name as approver_first_name,
        u.last_name as approver_last_name,
        u.role as approver_role,
        d.id as department_id,
        d.name as department_name,
        d.description as department_description,
        pp.id as period_id,
        pp.period_name,
        pp.start_date,
        pp.end_date,
        pp.status as period_status
      FROM payroll_approvals pa
      LEFT JOIN users u ON pa.approver_id = u.id
      LEFT JOIN departments d ON pa.department_id = d.id
      LEFT JOIN payroll_periods pp ON pa.payroll_period_id = pp.id
      WHERE pa.approver_id = $1 AND pa.status = 'pending'
      ORDER BY pa.created_at ASC
    `;
    
    const result = await this.pool.query(query, [approverId]);
    return result.rows.map(row => this.mapRowToPayrollApprovalWithDetails(row));
  }

  async getApprovalStats(): Promise<{
    totalApprovals: number;
    pendingApprovals: number;
    approvedApprovals: number;
    rejectedApprovals: number;
    approvalsByDepartment: Array<{ departmentName: string; count: number }>;
    approvalsByApprover: Array<{ approverName: string; count: number }>;
  }> {
    const totalQuery = 'SELECT COUNT(*) FROM payroll_approvals';
    const totalResult = await this.pool.query(totalQuery);
    const totalApprovals = parseInt(totalResult.rows[0].count);

    const statusQuery = `
      SELECT status, COUNT(*) as count 
      FROM payroll_approvals 
      GROUP BY status
    `;
    const statusResult = await this.pool.query(statusQuery);

    const pendingApprovals = statusResult.rows.find(r => r.status === 'pending')?.count || 0;
    const approvedApprovals = statusResult.rows.find(r => r.status === 'approved')?.count || 0;
    const rejectedApprovals = statusResult.rows.find(r => r.status === 'rejected')?.count || 0;

    const departmentQuery = `
      SELECT 
        COALESCE(d.name, 'No Department') as department_name,
        COUNT(*) as count
      FROM payroll_approvals pa
      LEFT JOIN departments d ON pa.department_id = d.id
      GROUP BY d.name
      ORDER BY count DESC
    `;
    const departmentResult = await this.pool.query(departmentQuery);

    const approverQuery = `
      SELECT 
        CONCAT(u.first_name, ' ', u.last_name) as approver_name,
        COUNT(*) as count
      FROM payroll_approvals pa
      JOIN users u ON pa.approver_id = u.id
      GROUP BY u.id, u.first_name, u.last_name
      ORDER BY count DESC
      LIMIT 10
    `;
    const approverResult = await this.pool.query(approverQuery);

    return {
      totalApprovals,
      pendingApprovals: parseInt(pendingApprovals),
      approvedApprovals: parseInt(approvedApprovals),
      rejectedApprovals: parseInt(rejectedApprovals),
      approvalsByDepartment: departmentResult.rows,
      approvalsByApprover: approverResult.rows
    };
  }

  async deletePayrollApproval(id: string): Promise<boolean> {
    const query = 'DELETE FROM payroll_approvals WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  private mapRowToPayrollApproval(row: any): PayrollApproval {
    return {
      id: row.id,
      payrollPeriodId: row.payroll_period_id,
      approverId: row.approver_id,
      departmentId: row.department_id,
      status: row.status,
      comments: row.comments,
      approvedAt: row.approved_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapRowToPayrollApprovalWithDetails(row: any): PayrollApprovalWithDetails {
    return {
      id: row.id,
      payrollPeriodId: row.payroll_period_id,
      approverId: row.approver_id,
      departmentId: row.department_id,
      status: row.status,
      comments: row.comments,
      approvedAt: row.approved_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      approver: {
        id: row.approver_id,
        email: row.approver_email,
        firstName: row.approver_first_name,
        lastName: row.approver_last_name,
        role: row.approver_role
      },
      department: row.department_id ? {
        id: row.department_id,
        name: row.department_name,
        description: row.department_description
      } : null,
      payrollPeriod: {
        id: row.period_id,
        periodName: row.period_name,
        startDate: row.start_date,
        endDate: row.end_date,
        status: row.period_status
      }
    };
  }
}