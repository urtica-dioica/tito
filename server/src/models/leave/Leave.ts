import { getPool } from '../../config/database';

export interface Leave {
  id: string;
  employeeId: string;
  leaveType: 'vacation' | 'sick' | 'maternity' | 'other';
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeaveWithDetails extends Leave {
  employeeCode: string;
  employeeName: string;
  departmentName: string | null;
  approverName: string | null;
}

export interface CreateLeaveData {
  employeeId: string;
  leaveType: 'vacation' | 'sick' | 'maternity' | 'other';
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason?: string;
}

export interface UpdateLeaveData {
  status?: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
}

export interface LeaveListParams {
  page?: number | undefined;
  limit?: number | undefined;
  employeeId?: string | undefined;
  departmentId?: string | undefined;
  leaveType?: 'vacation' | 'sick' | 'maternity' | 'other' | undefined;
  status?: 'pending' | 'approved' | 'rejected' | undefined;
  startDate?: Date | undefined;
  endDate?: Date | undefined;
  search?: string | undefined;
  sortBy?: string | undefined;
  sortOrder?: 'asc' | 'desc' | undefined;
}

export class LeaveModel {
  /**
   * Create a new leave request
   */
  async createLeave(data: CreateLeaveData): Promise<Leave> {
    const query = `
      INSERT INTO leaves (employee_id, leave_type, start_date, end_date)
      VALUES ($1, $2, $3, $4)
      RETURNING 
        id,
        employee_id as "employeeId",
        leave_type as "leaveType",
        start_date as "startDate",
        end_date as "endDate",
        (end_date - start_date + 1) as "totalDays",
        status,
        approver_id as "approvedBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    const result = await getPool().query(query, [
      data.employeeId,
      data.leaveType,
      data.startDate,
      data.endDate,
    ]);

    return result.rows[0];
  }

  /**
   * Get leave request by ID
   */
  async findById(id: string): Promise<Leave | null> {
    const query = `
      SELECT 
        id,
        employee_id as "employeeId",
        leave_type as "leaveType",
        start_date as "startDate",
        end_date as "endDate",
        (end_date - start_date + 1) as "totalDays",
        status,
        approver_id as "approvedBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM leaves
      WHERE id = $1
    `;

    const result = await getPool().query(query, [id]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Get leave request with details
   */
  async findByIdWithDetails(id: string): Promise<LeaveWithDetails | null> {
    const query = `
      SELECT 
        l.id,
        l.employee_id as "employeeId",
        l.leave_type as "leaveType",
        l.start_date as "startDate",
        l.end_date as "endDate",
        (l.end_date - l.start_date + 1) as "totalDays",
        l.status,
        l.approver_id as "approvedBy",
        l.created_at as "createdAt",
        l.updated_at as "updatedAt",
        e.employee_id as "employeeCode",
        CONCAT(u.first_name, ' ', u.last_name) as "employeeName",
        d.name as "departmentName",
        CONCAT(approver.first_name, ' ', approver.last_name) as "approverName"
      FROM leaves l
      JOIN employees e ON l.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
              LEFT JOIN users approver ON l.approver_id = approver.id
      WHERE l.id = $1
    `;

    const result = await getPool().query(query, [id]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Update leave request
   */
  async updateLeave(id: string, data: UpdateLeaveData): Promise<Leave | null> {
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (data.status !== undefined) {
      updateFields.push(`status = $${paramIndex}`);
      updateValues.push(data.status);
      paramIndex++;
    }

    if (data.approvedBy !== undefined) {
              updateFields.push(`approver_id = $${paramIndex}`);
      updateValues.push(data.approvedBy);
      paramIndex++;
    }

    // Note: leaves table doesn't have approved_at column, only approver_id

    if (updateFields.length === 0) {
      return this.findById(id);
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(id);

    const query = `
      UPDATE leaves 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING 
        id,
        employee_id as "employeeId",
        leave_type as "leaveType",
        start_date as "startDate",
        end_date as "endDate",
        (end_date - start_date + 1) as "totalDays",
        status,
        approver_id as "approvedBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    const result = await getPool().query(query, updateValues);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * List leave requests with filtering and pagination
   */
  async listLeaves(params: LeaveListParams = {}): Promise<{
    leaves: LeaveWithDetails[];
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
      status,
      startDate,
      endDate,
      search,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = params;

    // Validate sortBy parameter to prevent SQL injection
    const allowedSortColumns = ['created_at', 'updated_at', 'start_date', 'status'];
    const validSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';
    
    // Validate sortOrder parameter
    const validSortOrder = ['asc', 'desc'].includes(sortOrder.toLowerCase()) ? sortOrder.toUpperCase() : 'DESC';

    const offset = (page - 1) * limit;
    const whereConditions: string[] = [];
    const queryParams: any[] = [];
    let paramIndex = 1;

    // Build WHERE conditions
    if (employeeId) {
      whereConditions.push(`l.employee_id = $${paramIndex}`);
      queryParams.push(employeeId);
      paramIndex++;
    }

    if (departmentId) {
      whereConditions.push(`e.department_id = $${paramIndex}`);
      queryParams.push(departmentId);
      paramIndex++;
    }

    if (leaveType) {
      whereConditions.push(`l.leave_type = $${paramIndex}`);
      queryParams.push(leaveType);
      paramIndex++;
    }

    if (status) {
      whereConditions.push(`l.status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    if (startDate) {
      whereConditions.push(`l.start_date >= $${paramIndex}`);
      queryParams.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      whereConditions.push(`l.end_date <= $${paramIndex}`);
      queryParams.push(endDate);
      paramIndex++;
    }

    if (search) {
      whereConditions.push(`(CONCAT(u.first_name, ' ', u.last_name) ILIKE $${paramIndex} OR e.employee_id ILIKE $${paramIndex} )`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Count query
    const countQuery = `
      SELECT COUNT(*) as total
      FROM leaves l
      JOIN employees e ON l.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
      ${whereClause}
    `;

    const countResult = await getPool().query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Data query
    const dataQuery = `
      SELECT 
        l.id,
        l.employee_id as "employeeId",
        l.leave_type as "leaveType",
        l.start_date as "startDate",
        l.end_date as "endDate",
        (l.end_date - l.start_date + 1) as "totalDays",
        l.status,
        l.approver_id as "approvedBy",
        l.created_at as "createdAt",
        l.updated_at as "updatedAt",
        e.employee_id as "employeeCode",
        CONCAT(u.first_name, ' ', u.last_name) as "employeeName",
        d.name as "departmentName",
        CONCAT(approver.first_name, ' ', approver.last_name) as "approverName"
      FROM leaves l
      JOIN employees e ON l.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
              LEFT JOIN users approver ON l.approver_id = approver.id
      ${whereClause}
      ORDER BY l.${validSortBy} ${validSortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);
    const result = await getPool().query(dataQuery, queryParams);

    return {
      leaves: result.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get pending requests for a department head
   */
  async getPendingRequestsForDepartmentHead(departmentHeadUserId: string): Promise<LeaveWithDetails[]> {
    const query = `
      SELECT 
        l.id,
        l.employee_id as "employeeId",
        l.leave_type as "leaveType",
        l.start_date as "startDate",
        l.end_date as "endDate",
        (l.end_date - l.start_date + 1) as "totalDays",
        l.status,
        l.approver_id as "approvedBy",
        l.created_at as "createdAt",
        l.updated_at as "updatedAt",
        e.employee_id as "employeeCode",
        CONCAT(u.first_name, ' ', u.last_name) as "employeeName",
        d.name as "departmentName",
        CONCAT(approver.first_name, ' ', approver.last_name) as "approverName"
      FROM leaves l
      JOIN employees e ON l.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      JOIN departments d ON e.department_id = d.id
              LEFT JOIN users approver ON l.approver_id = approver.id
      WHERE d.department_head_user_id = $1
        AND l.status = 'pending'
      ORDER BY l.created_at ASC
    `;

    const result = await getPool().query(query, [departmentHeadUserId]);
    return result.rows;
  }

  /**
   * Get leave request statistics
   */
  async getLeaveStats(employeeId?: string, departmentId?: string): Promise<{
    totalRequests: number;
    pendingRequests: number;
    approvedRequests: number;
    rejectedRequests: number;
    totalDays: number;
    approvedDays: number;
  }> {
    const whereConditions: string[] = [];
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (employeeId) {
      whereConditions.push(`employee_id = $${paramIndex}`);
      queryParams.push(employeeId);
      paramIndex++;
    }

    if (departmentId) {
      whereConditions.push(`employee_id IN (SELECT id FROM employees WHERE department_id = $${paramIndex})`);
      queryParams.push(departmentId);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        COUNT(*) as total_requests,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_requests,
        COUNT(*) FILTER (WHERE status = 'approved') as approved_requests,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected_requests,
        COALESCE(SUM(end_date - start_date + 1), 0) as total_days,
        COALESCE(SUM(end_date - start_date + 1) FILTER (WHERE status = 'approved'), 0) as approved_days
      FROM leaves
      ${whereClause}
    `;

    const result = await getPool().query(query, queryParams);
    const stats = result.rows[0];

    return {
      totalRequests: parseInt(stats.total_requests) || 0,
      pendingRequests: parseInt(stats.pending_requests) || 0,
      approvedRequests: parseInt(stats.approved_requests) || 0,
      rejectedRequests: parseInt(stats.rejected_requests) || 0,
      totalDays: parseFloat(stats.total_days) || 0,
      approvedDays: parseFloat(stats.approved_days) || 0
    };
  }

  /**
   * Check for overlapping leave requests
   */
  async checkOverlappingLeaves(employeeId: string, startDate: Date, endDate: Date, excludeId?: string): Promise<Leave[]> {
    const whereConditions = [
      'employee_id = $1',
      'status = \'approved\'',
      '((start_date <= $2 AND end_date >= $2) OR (start_date <= $3 AND end_date >= $3) OR (start_date >= $2 AND end_date <= $3))'
    ];
    
    const queryParams: any[] = [employeeId, startDate, endDate];
    let paramIndex = 4;

    if (excludeId) {
      whereConditions.push(`id != $${paramIndex}`);
      queryParams.push(excludeId);
      paramIndex++;
    }

    const query = `
      SELECT 
        id,
        employee_id as "employeeId",
        leave_type as "leaveType",
        start_date as "startDate",
        end_date as "endDate",
        (end_date - start_date + 1) as "totalDays",
        status,
        approver_id as "approvedBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM leaves
      WHERE ${whereConditions.join(' AND ')}
    `;

    const result = await getPool().query(query, queryParams);
    return result.rows;
  }

  /**
   * Delete leave request
   */
  async deleteLeave(id: string): Promise<boolean> {
    const query = 'DELETE FROM leaves WHERE id = $1';
    const result = await getPool().query(query, [id]);
    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Get leave request count
   */
  async getLeaveCount(): Promise<number> {
    const query = 'SELECT COUNT(*) as count FROM leaves';
    const result = await getPool().query(query);
    return parseInt(result.rows[0].count);
  }
}

export const leaveModel = new LeaveModel();