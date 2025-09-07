import { getPool } from '../../config/database';

export interface TimeCorrectionRequest {
  id: string;
  employeeId: string;
  requestDate: Date;
  sessionType: 'clock_in' | 'clock_out';
  requestedTime: Date;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy: string | null;
  approvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeCorrectionRequestWithDetails extends TimeCorrectionRequest {
  employeeCode: string;
  employeeName: string;
  departmentName: string | null;
  approverName: string | null;
}

export interface CreateTimeCorrectionRequestData {
  employeeId: string;
  requestDate: Date;
  sessionType: 'clock_in' | 'clock_out';
  requestedTime: Date;
  reason: string;
}

export interface UpdateTimeCorrectionRequestData {
  status?: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: Date;
}

export interface TimeCorrectionRequestListParams {
  page?: number | undefined;
  limit?: number | undefined;
  employeeId?: string | undefined;
  departmentId?: string | undefined;
  status?: 'pending' | 'approved' | 'rejected' | undefined;
  sessionType?: 'clock_in' | 'clock_out' | undefined;
  startDate?: Date | undefined;
  endDate?: Date | undefined;
  search?: string | undefined;
  sortBy?: string | undefined;
  sortOrder?: 'asc' | 'desc' | undefined;
}

export class TimeCorrectionRequestModel {
  /**
   * Create a new time correction request
   */
  async createTimeCorrectionRequest(data: CreateTimeCorrectionRequestData): Promise<TimeCorrectionRequest> {
    const query = `
      INSERT INTO time_correction_requests (employee_id, correction_date, session_type, requested_clock_in, requested_clock_out, reason)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING 
        id,
        employee_id as "employeeId",
        correction_date as "requestDate",
        session_type as "sessionType",
        requested_time as "requestedTime",
        reason,
        status,
        approver_id as "approvedBy",
        approved_at as "approvedAt",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    const result = await getPool().query(query, [
      data.employeeId,
      data.requestDate,
      data.sessionType,
      data.sessionType === 'clock_in' ? data.requestedTime : null,
      data.sessionType === 'clock_out' ? data.requestedTime : null,
      data.reason
    ]);

    return result.rows[0];
  }

  /**
   * Get time correction request by ID
   */
  async findById(id: string): Promise<TimeCorrectionRequest | null> {
    const query = `
      SELECT 
        id,
        employee_id as "employeeId",
        correction_date as "requestDate",
        session_type as "sessionType",
        requested_time as "requestedTime",
        reason,
        status,
        approver_id as "approvedBy",
        approved_at as "approvedAt",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM time_correction_requests
      WHERE id = $1
    `;

    const result = await getPool().query(query, [id]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Get time correction request with details
   */
  async findByIdWithDetails(id: string): Promise<TimeCorrectionRequestWithDetails | null> {
    const query = `
      SELECT 
        tcr.id,
        tcr.employee_id as "employeeId",
        tcr.correction_date as "requestDate",
        tcr.session_type as "sessionType",
        CASE 
          WHEN tcr.session_type = 'clock_in' THEN tcr.requested_clock_in
          WHEN tcr.session_type = 'clock_out' THEN tcr.requested_clock_out
        END as "requestedTime",
        tcr.reason,
        tcr.status,
        tcr.approver_id as "approvedBy",
        tcr.approved_at as "approvedAt",
        tcr.created_at as "createdAt",
        tcr.updated_at as "updatedAt",
        e.employee_id as "employeeCode",
        CONCAT(u.first_name, ' ', u.last_name) as "employeeName",
        d.name as "departmentName",
        CONCAT(approver.first_name, ' ', approver.last_name) as "approverName"
      FROM time_correction_requests tcr
      JOIN employees e ON tcr.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
              LEFT JOIN users approver ON tcr.approver_id = approver.id
      WHERE tcr.id = $1
    `;

    const result = await getPool().query(query, [id]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Update time correction request
   */
  async updateTimeCorrectionRequest(id: string, data: UpdateTimeCorrectionRequestData): Promise<TimeCorrectionRequest | null> {
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
      UPDATE time_correction_requests 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING 
        id,
        employee_id as "employeeId",
        correction_date as "requestDate",
        session_type as "sessionType",
        requested_time as "requestedTime",
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
   * List time correction requests with filtering and pagination
   */
  async listTimeCorrectionRequests(params: TimeCorrectionRequestListParams = {}): Promise<{
    requests: TimeCorrectionRequestWithDetails[];
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
      sessionType,
      startDate,
      endDate,
      search,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = params;

    // Validate sortBy parameter to prevent SQL injection
    const allowedSortColumns = ['created_at', 'updated_at', 'correction_date', 'status'];
    const validSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';
    
    // Validate sortOrder parameter
    const validSortOrder = ['asc', 'desc'].includes(sortOrder.toLowerCase()) ? sortOrder.toUpperCase() : 'DESC';

    const offset = (page - 1) * limit;
    const whereConditions: string[] = [];
    const queryParams: any[] = [];
    let paramIndex = 1;

    // Build WHERE conditions
    if (employeeId) {
      whereConditions.push(`tcr.employee_id = $${paramIndex}`);
      queryParams.push(employeeId);
      paramIndex++;
    }

    if (departmentId) {
      whereConditions.push(`e.department_id = $${paramIndex}`);
      queryParams.push(departmentId);
      paramIndex++;
    }

    if (status) {
      whereConditions.push(`tcr.status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    if (sessionType) {
      whereConditions.push(`tcr.session_type = $${paramIndex}`);
      queryParams.push(sessionType);
      paramIndex++;
    }

    if (startDate) {
      whereConditions.push(`tcr.correction_date >= $${paramIndex}`);
      queryParams.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      whereConditions.push(`tcr.correction_date <= $${paramIndex}`);
      queryParams.push(endDate);
      paramIndex++;
    }

    if (search) {
      whereConditions.push(`(CONCAT(u.first_name, ' ', u.last_name) ILIKE $${paramIndex} OR e.employee_id ILIKE $${paramIndex} OR tcr.reason ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Count query
    const countQuery = `
      SELECT COUNT(*) as total
      FROM time_correction_requests tcr
      JOIN employees e ON tcr.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
      ${whereClause}
    `;

    const countResult = await getPool().query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Data query
    const dataQuery = `
      SELECT 
        tcr.id,
        tcr.employee_id as "employeeId",
        tcr.correction_date as "requestDate",
        tcr.session_type as "sessionType",
        CASE 
          WHEN tcr.session_type = 'clock_in' THEN tcr.requested_clock_in
          WHEN tcr.session_type = 'clock_out' THEN tcr.requested_clock_out
        END as "requestedTime",
        tcr.reason,
        tcr.status,
        tcr.approver_id as "approvedBy",
        tcr.approved_at as "approvedAt",
        tcr.created_at as "createdAt",
        tcr.updated_at as "updatedAt",
        e.employee_id as "employeeCode",
        CONCAT(u.first_name, ' ', u.last_name) as "employeeName",
        d.name as "departmentName",
        CONCAT(approver.first_name, ' ', approver.last_name) as "approverName"
      FROM time_correction_requests tcr
      JOIN employees e ON tcr.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
              LEFT JOIN users approver ON tcr.approver_id = approver.id
      ${whereClause}
      ORDER BY tcr.${validSortBy} ${validSortOrder}
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
  async getPendingRequestsForDepartmentHead(departmentHeadUserId: string): Promise<TimeCorrectionRequestWithDetails[]> {
    const query = `
      SELECT 
        tcr.id,
        tcr.employee_id as "employeeId",
        tcr.correction_date as "requestDate",
        tcr.session_type as "sessionType",
        CASE 
          WHEN tcr.session_type = 'clock_in' THEN tcr.requested_clock_in
          WHEN tcr.session_type = 'clock_out' THEN tcr.requested_clock_out
        END as "requestedTime",
        tcr.reason,
        tcr.status,
        tcr.approver_id as "approvedBy",
        tcr.approved_at as "approvedAt",
        tcr.created_at as "createdAt",
        tcr.updated_at as "updatedAt",
        e.employee_id as "employeeCode",
        CONCAT(u.first_name, ' ', u.last_name) as "employeeName",
        d.name as "departmentName",
        CONCAT(approver.first_name, ' ', approver.last_name) as "approverName"
      FROM time_correction_requests tcr
      JOIN employees e ON tcr.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      JOIN departments d ON e.department_id = d.id
              LEFT JOIN users approver ON tcr.approver_id = approver.id
      WHERE d.department_head_user_id = $1
        AND tcr.status = 'pending'
      ORDER BY tcr.created_at ASC
    `;

    const result = await getPool().query(query, [departmentHeadUserId]);
    return result.rows;
  }

  /**
   * Get time correction request statistics
   */
  async getTimeCorrectionRequestStats(employeeId?: string, departmentId?: string): Promise<{
    totalRequests: number;
    pendingRequests: number;
    approvedRequests: number;
    rejectedRequests: number;
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
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected_requests
      FROM time_correction_requests
      ${whereClause}
    `;

    const result = await getPool().query(query, queryParams);
    const stats = result.rows[0];

    return {
      totalRequests: parseInt(stats.total_requests) || 0,
      pendingRequests: parseInt(stats.pending_requests) || 0,
      approvedRequests: parseInt(stats.approved_requests) || 0,
      rejectedRequests: parseInt(stats.rejected_requests) || 0
    };
  }

  /**
   * Delete time correction request
   */
  async deleteTimeCorrectionRequest(id: string): Promise<boolean> {
    const query = 'DELETE FROM time_correction_requests WHERE id = $1';
    const result = await getPool().query(query, [id]);
    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Get time correction request count
   */
  async getTimeCorrectionRequestCount(): Promise<number> {
    const query = 'SELECT COUNT(*) as count FROM time_correction_requests';
    const result = await getPool().query(query);
    return parseInt(result.rows[0].count);
  }
}

export const timeCorrectionRequestModel = new TimeCorrectionRequestModel();