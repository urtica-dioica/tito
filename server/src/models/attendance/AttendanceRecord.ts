import { getPool } from '../../config/database';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: Date;
  overallStatus: 'present' | 'late' | 'absent' | 'partial';
  createdAt: Date;
  updatedAt: Date;
}

export interface AttendanceRecordWithEmployee extends AttendanceRecord {
  employeeCode: string;
  employeeName: string;
  departmentName: string | null;
}

export interface CreateAttendanceRecordData {
  employeeId: string;
  date: Date;
  overallStatus?: 'present' | 'late' | 'absent' | 'partial';
}

export interface UpdateAttendanceRecordData {
  overallStatus?: 'present' | 'late' | 'absent' | 'partial';
}

export interface AttendanceRecordListParams {
  page?: number | undefined;
  limit?: number | undefined;
  employeeId?: string | undefined;
  departmentId?: string | undefined;
  startDate?: Date | undefined;
  endDate?: Date | undefined;
  status?: 'present' | 'late' | 'absent' | 'partial' | undefined;
  search?: string | undefined;
  sortBy?: string | undefined;
  sortOrder?: 'asc' | 'desc' | undefined;
}

export class AttendanceRecordModel {
  /**
   * Create a new attendance record
   */
  async createAttendanceRecord(data: CreateAttendanceRecordData): Promise<AttendanceRecord> {
    const query = `
      INSERT INTO attendance_records (employee_id, date, overall_status)
      VALUES ($1, $2, $3)
      RETURNING 
        id,
        employee_id as "employeeId",
        date,
        overall_status as "overallStatus",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    const result = await getPool().query(query, [
      data.employeeId,
      data.date,
      data.overallStatus || 'absent'
    ]);

    return result.rows[0];
  }

  /**
   * Get attendance record by ID
   */
  async findById(id: string): Promise<AttendanceRecord | null> {
    const query = `
      SELECT 
        id,
        employee_id as "employeeId",
        date,
        overall_status as "overallStatus",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM attendance_records
      WHERE id = $1
    `;

    const result = await getPool().query(query, [id]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Get attendance record by employee ID and date
   */
  async findByEmployeeAndDate(employeeId: string, date: Date): Promise<AttendanceRecord | null> {
    const query = `
      SELECT 
        id,
        employee_id as "employeeId",
        date,
        overall_status as "overallStatus",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM attendance_records
      WHERE employee_id = $1 AND date = $2
    `;

    const result = await getPool().query(query, [employeeId, date]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Update attendance record
   */
  async updateAttendanceRecord(id: string, data: UpdateAttendanceRecordData): Promise<AttendanceRecord | null> {
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (data.overallStatus !== undefined) {
      updateFields.push(`overall_status = $${paramIndex}`);
      updateValues.push(data.overallStatus);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return this.findById(id);
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(id);

    const query = `
      UPDATE attendance_records 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING 
        id,
        employee_id as "employeeId",
        date,
        overall_status as "overallStatus",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    const result = await getPool().query(query, updateValues);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * List attendance records with filtering and pagination
   */
  async listAttendanceRecords(params: AttendanceRecordListParams = {}): Promise<{
    records: AttendanceRecordWithEmployee[];
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
      status,
      search,
      sortBy = 'date',
      sortOrder = 'desc'
    } = params;

    const offset = (page - 1) * limit;
    const whereConditions: string[] = [];
    const queryParams: any[] = [];
    let paramIndex = 1;

    // Build WHERE conditions
    if (employeeId) {
      whereConditions.push(`ar.employee_id = $${paramIndex}`);
      queryParams.push(employeeId);
      paramIndex++;
    }

    if (departmentId) {
      whereConditions.push(`e.department_id = $${paramIndex}`);
      queryParams.push(departmentId);
      paramIndex++;
    }

    if (startDate) {
      whereConditions.push(`ar.date >= $${paramIndex}`);
      queryParams.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      whereConditions.push(`ar.date <= $${paramIndex}`);
      queryParams.push(endDate);
      paramIndex++;
    }

    if (status) {
      whereConditions.push(`ar.overall_status = $${paramIndex}`);
      queryParams.push(status);
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
      FROM attendance_records ar
      JOIN employees e ON ar.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
      ${whereClause}
    `;

    const countResult = await getPool().query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Data query
    const dataQuery = `
      SELECT 
        ar.id,
        ar.employee_id as "employeeId",
        ar.date,
        ar.overall_status as "overallStatus",
        ar.created_at as "createdAt",
        ar.updated_at as "updatedAt",
        e.employee_id as "employeeCode",
        CONCAT(u.first_name, ' ', u.last_name) as "employeeName",
        d.name as "departmentName"
      FROM attendance_records ar
      JOIN employees e ON ar.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
      ${whereClause}
      ORDER BY ar.${sortBy} ${sortOrder.toUpperCase()}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);
    const result = await getPool().query(dataQuery, queryParams);

    return {
      records: result.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get attendance record with sessions
   */
  async getAttendanceRecordWithSessions(id: string): Promise<AttendanceRecordWithEmployee & { sessions: any[] } | null> {
    const query = `
      SELECT 
        ar.id,
        ar.employee_id as "employeeId",
        ar.date,
        ar.overall_status as "overallStatus",
        ar.created_at as "createdAt",
        ar.updated_at as "updatedAt",
        e.employee_id as "employeeCode",
        CONCAT(u.first_name, ' ', u.last_name) as "employeeName",
        d.name as "departmentName"
      FROM attendance_records ar
      JOIN employees e ON ar.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE ar.id = $1
    `;

    const result = await getPool().query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const record = result.rows[0];

    // Get sessions for this record
    const sessionsQuery = `
      SELECT 
        id,
        session_type as "sessionType",
        timestamp,
        selfie_image_path as "selfieImagePath",
        qr_code_hash as "qrCodeHash",
        calculated_hours as "calculatedHours",
        created_at as "createdAt"
      FROM attendance_sessions
      WHERE attendance_record_id = $1
      ORDER BY timestamp
    `;

    const sessionsResult = await getPool().query(sessionsQuery, [id]);
    record.sessions = sessionsResult.rows;

    return record;
  }

  /**
   * Get attendance statistics for an employee
   */
  async getEmployeeAttendanceStats(employeeId: string, startDate: Date, endDate: Date): Promise<{
    totalDays: number;
    presentDays: number;
    lateDays: number;
    absentDays: number;
    partialDays: number;
    totalHours: number;
  }> {
    const query = `
      SELECT 
        COUNT(*) as total_days,
        COUNT(*) FILTER (WHERE overall_status = 'present') as present_days,
        COUNT(*) FILTER (WHERE overall_status = 'late') as late_days,
        COUNT(*) FILTER (WHERE overall_status = 'absent') as absent_days,
        COUNT(*) FILTER (WHERE overall_status = 'partial') as partial_days,
        COALESCE(SUM(
          (SELECT SUM(calculated_hours) 
           FROM attendance_sessions 
           WHERE attendance_record_id = ar.id)
        ), 0) as total_hours
      FROM attendance_records ar
      WHERE employee_id = $1 
        AND date >= $2 
        AND date <= $3
    `;

    const result = await getPool().query(query, [employeeId, startDate, endDate]);
    const stats = result.rows[0];

    return {
      totalDays: parseInt(stats.total_days) || 0,
      presentDays: parseInt(stats.present_days) || 0,
      lateDays: parseInt(stats.late_days) || 0,
      absentDays: parseInt(stats.absent_days) || 0,
      partialDays: parseInt(stats.partial_days) || 0,
      totalHours: parseFloat(stats.total_hours) || 0
    };
  }

  /**
   * Delete attendance record
   */
  async deleteAttendanceRecord(id: string): Promise<boolean> {
    const query = 'DELETE FROM attendance_records WHERE id = $1';
    const result = await getPool().query(query, [id]);
    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Get attendance record count
   */
  async getAttendanceRecordCount(): Promise<number> {
    const query = 'SELECT COUNT(*) as count FROM attendance_records';
    const result = await getPool().query(query);
    return parseInt(result.rows[0].count);
  }
}

export const attendanceRecordModel = new AttendanceRecordModel();