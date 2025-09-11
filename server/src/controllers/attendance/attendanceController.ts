import { Request, Response } from 'express';
import { getRequestId } from '../../utils/types/express';
import logger from '../../utils/logger';
import { getPool } from '../../config/database';

export class AttendanceController {
  /**
   * Get recent attendance records for dashboard
   */
  async getRecentAttendance(req: Request, res: Response): Promise<void> {
    const requestId = getRequestId(req);

    try {
      const { limit = 10 } = req.query;

      const query = `
        SELECT 
          s.id,
          s.session_type,
          s.clock_in,
          s.clock_out,
          s.created_at,
          s.selfie_image_url,
          ar.date,
          ar.employee_id,
          u.first_name,
          u.last_name,
          e.employee_id as employee_code,
          d.name as department_name
        FROM attendance_sessions s
        JOIN attendance_records ar ON s.attendance_record_id = ar.id
        JOIN employees e ON ar.employee_id = e.id
        JOIN users u ON e.user_id = u.id
        LEFT JOIN departments d ON e.department_id = d.id
        WHERE s.clock_in IS NOT NULL OR s.clock_out IS NOT NULL
        ORDER BY s.created_at DESC
        LIMIT $1
      `;

      const result = await getPool().query(query, [limit]);
      
      const attendanceRecords = result.rows.map(row => ({
        id: row.id,
        sessionType: row.session_type,
        clockIn: row.clock_in,
        clockOut: row.clock_out,
        createdAt: row.created_at,
        selfieImageUrl: row.selfie_image_url,
        date: row.date,
        employeeId: row.employee_id,
        employeeName: `${row.first_name} ${row.last_name}`,
        employeeCode: row.employee_code,
        departmentName: row.department_name,
        action: row.clock_in ? 'Clock In' : 'Clock Out',
        timestamp: row.clock_in || row.clock_out
      }));

      res.json({
        success: true,
        message: 'Recent attendance records retrieved successfully',
        data: attendanceRecords,
        requestId
      });
    } catch (error) {
      logger.error('Error getting recent attendance records', {
        error: (error as Error).message,
        requestId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get recent attendance records',
        error: (error as Error).message,
        requestId
      });
    }
  }

  /**
   * Get attendance statistics for dashboard
   */
  async getAttendanceStats(req: Request, res: Response): Promise<void> {
    const requestId = getRequestId(req);

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const query = `
        SELECT 
          COUNT(DISTINCT ar.employee_id) as total_employees_today,
          COUNT(CASE WHEN s.clock_in IS NOT NULL THEN 1 END) as clock_ins_today,
          COUNT(CASE WHEN s.clock_out IS NOT NULL THEN 1 END) as clock_outs_today,
          COUNT(CASE WHEN s.clock_in IS NOT NULL AND s.clock_out IS NOT NULL THEN 1 END) as completed_sessions_today
        FROM attendance_records ar
        LEFT JOIN attendance_sessions s ON ar.id = s.attendance_record_id
        WHERE ar.date = $1
      `;

      const result = await getPool().query(query, [today]);
      const stats = result.rows[0];

      res.json({
        success: true,
        message: 'Attendance statistics retrieved successfully',
        data: {
          totalEmployeesToday: parseInt(stats.total_employees_today) || 0,
          clockInsToday: parseInt(stats.clock_ins_today) || 0,
          clockOutsToday: parseInt(stats.clock_outs_today) || 0,
          completedSessionsToday: parseInt(stats.completed_sessions_today) || 0
        },
        requestId
      });
    } catch (error) {
      logger.error('Error getting attendance statistics', {
        error: (error as Error).message,
        requestId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get attendance statistics',
        error: (error as Error).message,
        requestId
      });
    }
  }

  /**
   * Get daily attendance records for dashboard
   */
  async getDailyAttendance(req: Request, res: Response): Promise<void> {
    const requestId = getRequestId(req);

    try {
      const { limit = 10, date } = req.query;
      const targetDate = date ? new Date(date as string) : new Date();
      targetDate.setHours(0, 0, 0, 0);

      const query = `
        SELECT 
          ar.id as attendance_record_id,
          ar.employee_id,
          ar.date,
          ar.overall_status,
          u.first_name,
          u.last_name,
          e.employee_id as employee_code,
          d.name as department_name,
          e.position,
          -- Morning session
          morning_in.clock_in as morning_in,
          morning_out.clock_out as morning_out,
          -- Afternoon session
          afternoon_in.clock_in as afternoon_in,
          afternoon_out.clock_out as afternoon_out,
          -- Total hours calculation
          COALESCE(
            EXTRACT(EPOCH FROM (morning_out.clock_out - morning_in.clock_in)) / 3600 +
            EXTRACT(EPOCH FROM (afternoon_out.clock_out - afternoon_in.clock_in)) / 3600,
            0
          ) as total_hours
        FROM attendance_records ar
        JOIN employees e ON ar.employee_id = e.id
        JOIN users u ON e.user_id = u.id
        LEFT JOIN departments d ON e.department_id = d.id
        -- Morning sessions
        LEFT JOIN attendance_sessions morning_in ON ar.id = morning_in.attendance_record_id 
          AND morning_in.session_type = 'morning_in'
        LEFT JOIN attendance_sessions morning_out ON ar.id = morning_out.attendance_record_id 
          AND morning_out.session_type = 'morning_out'
        -- Afternoon sessions
        LEFT JOIN attendance_sessions afternoon_in ON ar.id = afternoon_in.attendance_record_id 
          AND afternoon_in.session_type = 'afternoon_in'
        LEFT JOIN attendance_sessions afternoon_out ON ar.id = afternoon_out.attendance_record_id 
          AND afternoon_out.session_type = 'afternoon_out'
        WHERE ar.date = $1
        ORDER BY u.first_name, u.last_name
        LIMIT $2
      `;

      const result = await getPool().query(query, [targetDate, limit]);
      
      const dailyAttendance = result.rows.map(row => ({
        attendanceRecordId: row.attendance_record_id,
        employeeId: row.employee_id,
        employeeName: `${row.first_name} ${row.last_name}`,
        employeeCode: row.employee_code,
        departmentName: row.department_name,
        position: row.position,
        date: row.date,
        overallStatus: row.overall_status,
        morningIn: row.morning_in,
        morningOut: row.morning_out,
        afternoonIn: row.afternoon_in,
        afternoonOut: row.afternoon_out,
        totalHours: parseFloat(row.total_hours) || 0
      }));

      res.json({
        success: true,
        message: 'Daily attendance records retrieved successfully',
        data: dailyAttendance,
        requestId
      });
    } catch (error) {
      logger.error('Error getting daily attendance records', {
        error: (error as Error).message,
        requestId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get daily attendance records',
        error: (error as Error).message,
        requestId
      });
    }
  }

  /**
   * Get all sessions for an attendance record
   */
  async getAttendanceRecordSessions(req: Request, res: Response): Promise<void> {
    const requestId = getRequestId(req);

    try {
      const { id } = req.params;

      // First get the attendance record info
      const recordQuery = `
        SELECT 
          ar.id as attendance_record_id,
          ar.employee_id,
          ar.date,
          ar.overall_status,
          u.first_name,
          u.last_name,
          e.employee_id as employee_code,
          e.position,
          d.name as department_name
        FROM attendance_records ar
        JOIN employees e ON ar.employee_id = e.id
        JOIN users u ON e.user_id = u.id
        LEFT JOIN departments d ON e.department_id = d.id
        WHERE ar.id = $1
      `;

      const recordResult = await getPool().query(recordQuery, [id]);
      
      if (recordResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Attendance record not found',
          requestId
        });
        return;
      }

      const record = recordResult.rows[0];

      // Then get all sessions for this attendance record
      const sessionsQuery = `
        SELECT 
          s.id,
          s.session_type,
          s.clock_in,
          s.clock_out,
          s.created_at,
          s.selfie_image_url,
          s.calculated_hours,
          s.late_hours,
          s.status
        FROM attendance_sessions s
        WHERE s.attendance_record_id = $1
        ORDER BY s.created_at ASC
      `;

      const sessionsResult = await getPool().query(sessionsQuery, [id]);
      
      const attendanceDetail = {
        attendanceRecordId: record.attendance_record_id,
        employeeId: record.employee_id,
        employeeName: `${record.first_name} ${record.last_name}`,
        employeeCode: record.employee_code,
        position: record.position,
        departmentName: record.department_name,
        date: record.date,
        overallStatus: record.overall_status,
        sessions: sessionsResult.rows.map(session => ({
          id: session.id,
          sessionType: session.session_type,
          clockIn: session.clock_in,
          clockOut: session.clock_out,
          createdAt: session.created_at,
          selfieImagePath: session.selfie_image_url,
          calculatedHours: parseFloat(session.calculated_hours) || 0,
          lateHours: parseFloat(session.late_hours) || 0,
          status: session.status
        }))
      };

      res.json({
        success: true,
        message: 'Attendance record sessions retrieved successfully',
        data: attendanceDetail,
        requestId
      });
    } catch (error) {
      logger.error('Error getting attendance record sessions', {
        error: (error as Error).message,
        requestId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get attendance record sessions',
        error: (error as Error).message,
        requestId
      });
    }
  }

  /**
   * Get detailed attendance record by ID
   */
  async getAttendanceDetail(req: Request, res: Response): Promise<void> {
    const requestId = getRequestId(req);

    try {
      const { id } = req.params;

      const query = `
        SELECT 
          s.id,
          s.session_type,
          s.clock_in,
          s.clock_out,
          s.created_at,
          s.selfie_image_url,
          s.regular_hours,
          s.overtime_hours,
          s.late_minutes,
          s.late_hours,
          ar.date,
          ar.employee_id,
          u.first_name,
          u.last_name,
          e.employee_id as employee_code,
          e.position,
          d.name as department_name
        FROM attendance_sessions s
        JOIN attendance_records ar ON s.attendance_record_id = ar.id
        JOIN employees e ON ar.employee_id = e.id
        JOIN users u ON e.user_id = u.id
        LEFT JOIN departments d ON e.department_id = d.id
        WHERE s.id = $1
      `;

      const result = await getPool().query(query, [id]);
      
      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Attendance record not found',
          requestId
        });
        return;
      }

      const row = result.rows[0];
      const attendanceDetail = {
        id: row.id,
        sessionType: row.session_type,
        clockIn: row.clock_in,
        clockOut: row.clock_out,
        createdAt: row.created_at,
        selfieImageUrl: row.selfie_image_url,
        regularHours: row.regular_hours,
        overtimeHours: row.overtime_hours,
        lateMinutes: row.late_minutes,
        lateHours: row.late_hours,
        date: row.date,
        employeeId: row.employee_id,
        employeeName: `${row.first_name} ${row.last_name}`,
        employeeCode: row.employee_code,
        position: row.position,
        departmentName: row.department_name,
        action: row.clock_in ? 'Clock In' : 'Clock Out',
        timestamp: row.clock_in || row.clock_out
      };

      res.json({
        success: true,
        message: 'Attendance detail retrieved successfully',
        data: attendanceDetail,
        requestId
      });
    } catch (error) {
      logger.error('Error getting attendance detail', {
        error: (error as Error).message,
        requestId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get attendance detail',
        error: (error as Error).message,
        requestId
      });
    }
  }
}

export const attendanceController = new AttendanceController();