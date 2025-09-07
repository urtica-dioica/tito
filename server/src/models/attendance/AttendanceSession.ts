import { getPool } from '../../config/database';

export interface AttendanceSession {
  id: string;
  attendanceRecordId: string;
  sessionType: 'clock_in' | 'clock_out';
  timestamp: Date;
  selfieImagePath: string | null;
  qrCodeHash: string | null;
  calculatedHours: number;
  createdAt: Date;
}

export interface AttendanceSessionWithDetails extends AttendanceSession {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  departmentName: string | null;
  date: Date;
  overallStatus: string;
}

export interface CreateAttendanceSessionData {
  attendanceRecordId: string;
  sessionType: 'clock_in' | 'clock_out';
  timestamp: Date;
  selfieImagePath?: string;
  qrCodeHash?: string;
}

export interface UpdateAttendanceSessionData {
  timestamp?: Date;
  selfieImagePath?: string;
  qrCodeHash?: string;
}

export interface AttendanceSessionListParams {
  page?: number | undefined;
  limit?: number | undefined;
  employeeId?: string | undefined;
  departmentId?: string | undefined;
  sessionType?: 'clock_in' | 'clock_out' | undefined;
  startDate?: Date | undefined;
  endDate?: Date | undefined;
  search?: string | undefined;
  sortBy?: string | undefined;
  sortOrder?: 'asc' | 'desc' | undefined;
}

export class AttendanceSessionModel {
  /**
   * Create a new attendance session
   */
  async createAttendanceSession(data: CreateAttendanceSessionData): Promise<AttendanceSession> {
    const query = `
      INSERT INTO attendance_sessions (attendance_record_id, session_type, timestamp, selfie_image_path, qr_code_hash)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING 
        id,
        attendance_record_id as "attendanceRecordId",
        session_type as "sessionType",
        timestamp,
        selfie_image_path as "selfieImagePath",
        qr_code_hash as "qrCodeHash",
        calculated_hours as "calculatedHours",
        created_at as "createdAt"
    `;

    const result = await getPool().query(query, [
      data.attendanceRecordId,
      data.sessionType,
      data.timestamp,
      data.selfieImagePath || null,
      data.qrCodeHash || null
    ]);

    return result.rows[0];
  }

  /**
   * Get attendance session by ID
   */
  async findById(id: string): Promise<AttendanceSession | null> {
    const query = `
      SELECT 
        id,
        attendance_record_id as "attendanceRecordId",
        session_type as "sessionType",
        timestamp,
        selfie_image_path as "selfieImagePath",
        qr_code_hash as "qrCodeHash",
        calculated_hours as "calculatedHours",
        created_at as "createdAt"
      FROM attendance_sessions
      WHERE id = $1
    `;

    const result = await getPool().query(query, [id]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Get attendance session with details
   */
  async findByIdWithDetails(id: string): Promise<AttendanceSessionWithDetails | null> {
    const query = `
      SELECT 
        s.id,
        s.attendance_record_id as "attendanceRecordId",
        s.session_type as "sessionType",
        s.timestamp,
        s.selfie_image_path as "selfieImagePath",
        s.qr_code_hash as "qrCodeHash",
        s.calculated_hours as "calculatedHours",
        s.created_at as "createdAt",
        ar.employee_id as "employeeId",
        ar.date,
        ar.overall_status as "overallStatus",
        e.employee_id as "employeeCode",
        CONCAT(u.first_name, ' ', u.last_name) as "employeeName",
        d.name as "departmentName"
      FROM attendance_sessions s
      JOIN attendance_records ar ON s.attendance_record_id = ar.id
      JOIN employees e ON ar.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE s.id = $1
    `;

    const result = await getPool().query(query, [id]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Get sessions for an attendance record
   */
  async getSessionsByAttendanceRecord(attendanceRecordId: string): Promise<AttendanceSession[]> {
    const query = `
      SELECT 
        id,
        attendance_record_id as "attendanceRecordId",
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

    const result = await getPool().query(query, [attendanceRecordId]);
    return result.rows;
  }

  /**
   * Get latest session for an employee on a specific date
   */
  async getLatestSessionByEmployeeAndDate(employeeId: string, date: Date): Promise<AttendanceSession | null> {
    const query = `
      SELECT 
        s.id,
        s.attendance_record_id as "attendanceRecordId",
        s.session_type as "sessionType",
        s.timestamp,
        s.selfie_image_path as "selfieImagePath",
        s.qr_code_hash as "qrCodeHash",
        s.calculated_hours as "calculatedHours",
        s.created_at as "createdAt"
      FROM attendance_sessions s
      JOIN attendance_records ar ON s.attendance_record_id = ar.id
      WHERE ar.employee_id = $1 AND ar.date = $2
      ORDER BY s.timestamp DESC
      LIMIT 1
    `;

    const result = await getPool().query(query, [employeeId, date]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Update attendance session
   */
  async updateAttendanceSession(id: string, data: UpdateAttendanceSessionData): Promise<AttendanceSession | null> {
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (data.timestamp !== undefined) {
      updateFields.push(`timestamp = $${paramIndex}`);
      updateValues.push(data.timestamp);
      paramIndex++;
    }

    if (data.selfieImagePath !== undefined) {
      updateFields.push(`selfie_image_path = $${paramIndex}`);
      updateValues.push(data.selfieImagePath);
      paramIndex++;
    }

    if (data.qrCodeHash !== undefined) {
      updateFields.push(`qr_code_hash = $${paramIndex}`);
      updateValues.push(data.qrCodeHash);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return this.findById(id);
    }

    updateValues.push(id);

    const query = `
      UPDATE attendance_sessions 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING 
        id,
        attendance_record_id as "attendanceRecordId",
        session_type as "sessionType",
        timestamp,
        selfie_image_path as "selfieImagePath",
        qr_code_hash as "qrCodeHash",
        calculated_hours as "calculatedHours",
        created_at as "createdAt"
    `;

    const result = await getPool().query(query, updateValues);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * List attendance sessions with filtering and pagination
   */
  async listAttendanceSessions(params: AttendanceSessionListParams = {}): Promise<{
    sessions: AttendanceSessionWithDetails[];
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
      sessionType,
      startDate,
      endDate,
      search,
      sortBy = 'timestamp',
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

    if (sessionType) {
      whereConditions.push(`s.session_type = $${paramIndex}`);
      queryParams.push(sessionType);
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

    if (search) {
      whereConditions.push(`(CONCAT(u.first_name, ' ', u.last_name) ILIKE $${paramIndex} OR e.employee_id ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Count query
    const countQuery = `
      SELECT COUNT(*) as total
      FROM attendance_sessions s
      JOIN attendance_records ar ON s.attendance_record_id = ar.id
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
        s.id,
        s.attendance_record_id as "attendanceRecordId",
        s.session_type as "sessionType",
        s.timestamp,
        s.selfie_image_path as "selfieImagePath",
        s.qr_code_hash as "qrCodeHash",
        s.calculated_hours as "calculatedHours",
        s.created_at as "createdAt",
        ar.employee_id as "employeeId",
        ar.date,
        ar.overall_status as "overallStatus",
        e.employee_id as "employeeCode",
        CONCAT(u.first_name, ' ', u.last_name) as "employeeName",
        d.name as "departmentName"
      FROM attendance_sessions s
      JOIN attendance_records ar ON s.attendance_record_id = ar.id
      JOIN employees e ON ar.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
      ${whereClause}
      ORDER BY s.${sortBy} ${sortOrder.toUpperCase()}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);
    const result = await getPool().query(dataQuery, queryParams);

    return {
      sessions: result.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Calculate hours between clock in and clock out sessions
   */
  async calculateSessionHours(attendanceRecordId: string): Promise<number> {
    const query = `
      SELECT 
        clock_in.timestamp as clock_in_time,
        clock_out.timestamp as clock_out_time
      FROM attendance_sessions clock_in
      JOIN attendance_sessions clock_out ON clock_in.attendance_record_id = clock_out.attendance_record_id
      WHERE clock_in.attendance_record_id = $1
        AND clock_in.session_type = 'clock_in'
        AND clock_out.session_type = 'clock_out'
        AND clock_in.timestamp < clock_out.timestamp
      ORDER BY clock_in.timestamp DESC, clock_out.timestamp ASC
      LIMIT 1
    `;

    const result = await getPool().query(query, [attendanceRecordId]);
    
    if (result.rows.length === 0) {
      return 0;
    }

    const { clock_in_time, clock_out_time } = result.rows[0];
    const hours = (new Date(clock_out_time).getTime() - new Date(clock_in_time).getTime()) / (1000 * 60 * 60);
    
    return Math.max(0, hours);
  }

  /**
   * Get session statistics for an employee
   */
  async getEmployeeSessionStats(employeeId: string, startDate: Date, endDate: Date): Promise<{
    totalSessions: number;
    clockInSessions: number;
    clockOutSessions: number;
    totalHours: number;
    averageHoursPerDay: number;
  }> {
    const query = `
      SELECT 
        COUNT(*) as total_sessions,
        COUNT(*) FILTER (WHERE session_type = 'clock_in') as clock_in_sessions,
        COUNT(*) FILTER (WHERE session_type = 'clock_out') as clock_out_sessions,
        COALESCE(SUM(calculated_hours), 0) as total_hours
      FROM attendance_sessions s
      JOIN attendance_records ar ON s.attendance_record_id = ar.id
      WHERE ar.employee_id = $1 
        AND ar.date >= $2 
        AND ar.date <= $3
    `;

    const result = await getPool().query(query, [employeeId, startDate, endDate]);
    const stats = result.rows[0];

    const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const averageHoursPerDay = parseFloat(stats.total_hours) / totalDays;

    return {
      totalSessions: parseInt(stats.total_sessions) || 0,
      clockInSessions: parseInt(stats.clock_in_sessions) || 0,
      clockOutSessions: parseInt(stats.clock_out_sessions) || 0,
      totalHours: parseFloat(stats.total_hours) || 0,
      averageHoursPerDay: Math.round(averageHoursPerDay * 100) / 100
    };
  }

  /**
   * Delete attendance session
   */
  async deleteAttendanceSession(id: string): Promise<boolean> {
    const query = 'DELETE FROM attendance_sessions WHERE id = $1';
    const result = await getPool().query(query, [id]);
    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Get attendance session count
   */
  async getAttendanceSessionCount(): Promise<number> {
    const query = 'SELECT COUNT(*) as count FROM attendance_sessions';
    const result = await getPool().query(query);
    return parseInt(result.rows[0].count);
  }
}

export const attendanceSessionModel = new AttendanceSessionModel();