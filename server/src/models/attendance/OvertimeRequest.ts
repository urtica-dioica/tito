import { getPool } from '../../config/database';

export interface OvertimeRequest {
  id: string;
  employeeId: string;
  requestDate: Date;
  startTime: Date;
  endTime: Date;
  requestedHours: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy: string | null;
  approvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OvertimeRequestWithDetails extends OvertimeRequest {
  employeeCode: string;
  employeeName: string;
  departmentName: string | null;
  approverName: string | null;
}

export interface CreateOvertimeRequestData {
  employeeId: string;
  requestDate: Date;
  startTime: Date | string;
  endTime: Date | string;
  requestedHours: number;
  reason: string;
}

export interface UpdateOvertimeRequestData {
  status?: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: Date;
}

export interface OvertimeRequestListParams {
  page?: number | undefined;
  limit?: number | undefined;
  employeeId?: string | undefined;
  departmentId?: string | undefined;
  status?: 'pending' | 'approved' | 'rejected' | undefined;
  startDate?: Date | undefined;
  endDate?: Date | undefined;
  search?: string | undefined;
  sortBy?: string | undefined;
  sortOrder?: 'asc' | 'desc' | undefined;
}

export class OvertimeRequestModel {
  /**
   * Create a new overtime request
   */
  async createOvertimeRequest(data: CreateOvertimeRequestData): Promise<OvertimeRequest> {
    const query = `
      INSERT INTO overtime_requests (employee_id, request_date, start_time, end_time, requested_hours, reason)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING 
        id,
        employee_id as "employeeId",
        request_date as "requestDate",
        start_time as "startTime",
        end_time as "endTime",
        requested_hours as "requestedHours",
        reason,
        status,
        approver_id as "approvedBy",
        approved_at as "approvedAt",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    // Extract time portion from Date objects or use string directly
    const startTimeStr = data.startTime instanceof Date 
      ? `${data.startTime.getUTCHours().toString().padStart(2, '0')}:${data.startTime.getUTCMinutes().toString().padStart(2, '0')}:${data.startTime.getUTCSeconds().toString().padStart(2, '0')}` 
      : data.startTime;
    const endTimeStr = data.endTime instanceof Date 
      ? `${data.endTime.getUTCHours().toString().padStart(2, '0')}:${data.endTime.getUTCMinutes().toString().padStart(2, '0')}:${data.endTime.getUTCSeconds().toString().padStart(2, '0')}` 
      : data.endTime;

    const result = await getPool().query(query, [
      data.employeeId,
      data.requestDate,
      startTimeStr,
      endTimeStr,
      data.requestedHours,
      data.reason
    ]);

    return result.rows[0];
  }

  /**
   * Get overtime request by ID
   */
  async findById(id: string): Promise<OvertimeRequest | null> {
    const query = `
      SELECT 
        id,
        employee_id as "employeeId",
        request_date as "requestDate",
        start_time as "startTime",
        end_time as "endTime",
        requested_hours as "requestedHours",
        reason,
        status,
        approver_id as "approvedBy",
        approved_at as "approvedAt",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM overtime_requests
      WHERE id = $1
    `;

    const result = await getPool().query(query, [id]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Get overtime request with details
   */
  async findByIdWithDetails(id: string): Promise<OvertimeRequestWithDetails | null> {
    const query = `
      SELECT 
        otr.id,
        otr.employee_id as "employeeId",
        otr.request_date as "requestDate",
        otr.start_time as "startTime",
        otr.end_time as "endTime",
        otr.requested_hours as "requestedHours",
        otr.reason,
        otr.status,
        otr.approver_id as "approvedBy",
        otr.approved_at as "approvedAt",
        otr.created_at as "createdAt",
        otr.updated_at as "updatedAt",
        e.employee_id as "employeeCode",
        CONCAT(u.first_name, ' ', u.last_name) as "employeeName",
        d.name as "departmentName",
        CONCAT(approver.first_name, ' ', approver.last_name) as "approverName"
      FROM overtime_requests otr
      JOIN employees e ON otr.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
              LEFT JOIN users approver ON otr.approver_id = approver.id
      WHERE otr.id = $1
    `;

    const result = await getPool().query(query, [id]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Update overtime request
   */
  async updateOvertimeRequest(id: string, data: UpdateOvertimeRequestData): Promise<OvertimeRequest | null> {
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

    if (data.approvedAt !== undefined) {
      updateFields.push(`approved_at = $${paramIndex}`);
      updateValues.push(data.approvedAt);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return this.findById(id);
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(id);

    const query = `
      UPDATE overtime_requests 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING 
        id,
        employee_id as "employeeId",
        request_date as "requestDate",
        start_time as "startTime",
        end_time as "endTime",
        requested_hours as "requestedHours",
        reason,
        status,
        approver_id as "approvedBy",
        approved_at as "approvedAt",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    const result = await getPool().query(query, updateValues);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * List overtime requests with filtering and pagination
   */
  async listOvertimeRequests(params: OvertimeRequestListParams = {}): Promise<{
    requests: OvertimeRequestWithDetails[];
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
      status,
      startDate,
      endDate,
      search,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = params;

    // Validate sortBy parameter to prevent SQL injection
    const allowedSortColumns = ['created_at', 'updated_at', 'request_date', 'status'];
    const validSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';
    
    // Validate sortOrder parameter
    const validSortOrder = ['asc', 'desc'].includes(sortOrder.toLowerCase()) ? sortOrder.toUpperCase() : 'DESC';

    const offset = (page - 1) * limit;
    const whereConditions: string[] = [];
    const queryParams: any[] = [];
    let paramIndex = 1;

    // Build WHERE conditions
    if (employeeId) {
      whereConditions.push(`otr.employee_id = $${paramIndex}`);
      queryParams.push(employeeId);
      paramIndex++;
    }

    if (departmentId) {
      whereConditions.push(`e.department_id = $${paramIndex}`);
      queryParams.push(departmentId);
      paramIndex++;
    }

    if (status) {
      whereConditions.push(`otr.status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    if (startDate) {
      whereConditions.push(`otr.request_date >= $${paramIndex}`);
      queryParams.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      whereConditions.push(`otr.request_date <= $${paramIndex}`);
      queryParams.push(endDate);
      paramIndex++;
    }

    if (search) {
      whereConditions.push(`(CONCAT(u.first_name, ' ', u.last_name) ILIKE $${paramIndex} OR e.employee_id ILIKE $${paramIndex} OR otr.reason ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Count query
    const countQuery = `
      SELECT COUNT(*) as total
      FROM overtime_requests otr
      JOIN employees e ON otr.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
      ${whereClause}
    `;

    const countResult = await getPool().query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Data query
    const dataQuery = `
      SELECT 
        otr.id,
        otr.employee_id as "employeeId",
        otr.request_date as "requestDate",
        otr.start_time as "startTime",
        otr.end_time as "endTime",
        otr.requested_hours as "requestedHours",
        otr.reason,
        otr.status,
        otr.approver_id as "approvedBy",
        otr.approved_at as "approvedAt",
        otr.created_at as "createdAt",
        otr.updated_at as "updatedAt",
        e.employee_id as "employeeCode",
        CONCAT(u.first_name, ' ', u.last_name) as "employeeName",
        d.name as "departmentName",
        CONCAT(approver.first_name, ' ', approver.last_name) as "approverName"
      FROM overtime_requests otr
      JOIN employees e ON otr.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
              LEFT JOIN users approver ON otr.approver_id = approver.id
      ${whereClause}
      ORDER BY otr.${validSortBy} ${validSortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);
    const result = await getPool().query(dataQuery, queryParams);

    return {
      requests: result.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get pending requests for a department head
   */
  async getPendingRequestsForDepartmentHead(departmentHeadUserId: string): Promise<OvertimeRequestWithDetails[]> {
    const query = `
      SELECT 
        otr.id,
        otr.employee_id as "employeeId",
        otr.request_date as "requestDate",
        otr.start_time as "startTime",
        otr.end_time as "endTime",
        otr.requested_hours as "requestedHours",
        otr.reason,
        otr.status,
        otr.approver_id as "approvedBy",
        otr.approved_at as "approvedAt",
        otr.created_at as "createdAt",
        otr.updated_at as "updatedAt",
        e.employee_id as "employeeCode",
        CONCAT(u.first_name, ' ', u.last_name) as "employeeName",
        d.name as "departmentName",
        CONCAT(approver.first_name, ' ', approver.last_name) as "approverName"
      FROM overtime_requests otr
      JOIN employees e ON otr.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      JOIN departments d ON e.department_id = d.id
              LEFT JOIN users approver ON otr.approver_id = approver.id
      WHERE d.department_head_user_id = $1
        AND otr.status = 'pending'
      ORDER BY otr.created_at ASC
    `;

    const result = await getPool().query(query, [departmentHeadUserId]);
    return result.rows;
  }

  /**
   * Get overtime request statistics
   */
  async getOvertimeRequestStats(employeeId?: string, departmentId?: string): Promise<{
    totalRequests: number;
    pendingRequests: number;
    approvedRequests: number;
    rejectedRequests: number;
    totalHours: number;
    approvedHours: number;
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
        COALESCE(SUM(requested_hours), 0) as total_hours,
        COALESCE(SUM(requested_hours) FILTER (WHERE status = 'approved'), 0) as approved_hours
      FROM overtime_requests
      ${whereClause}
    `;

    const result = await getPool().query(query, queryParams);
    const stats = result.rows[0];

    return {
      totalRequests: parseInt(stats.total_requests) || 0,
      pendingRequests: parseInt(stats.pending_requests) || 0,
      approvedRequests: parseInt(stats.approved_requests) || 0,
      rejectedRequests: parseInt(stats.rejected_requests) || 0,
      totalHours: parseFloat(stats.total_hours) || 0,
      approvedHours: parseFloat(stats.approved_hours) || 0
    };
  }

  /**
   * Delete overtime request
   */
  async deleteOvertimeRequest(id: string): Promise<boolean> {
    const query = 'DELETE FROM overtime_requests WHERE id = $1';
    const result = await getPool().query(query, [id]);
    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Get overtime request count
   */
  async getOvertimeRequestCount(): Promise<number> {
    const query = 'SELECT COUNT(*) as count FROM overtime_requests';
    const result = await getPool().query(query);
    return parseInt(result.rows[0].count);
  }
}

export const overtimeRequestModel = new OvertimeRequestModel();