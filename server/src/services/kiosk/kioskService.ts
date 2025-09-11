import { getPool } from '../../config/database';
import { attendanceService, TimeBasedAttendanceData } from '../attendance/attendanceService';
import { SessionType, getSessionDisplayInfo } from '../../utils/timeValidation';

interface KioskEmployee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  departmentId: string;
  departmentName: string;
  position: string;
  employmentType: 'regular' | 'contractual' | 'jo';
  hireDate: string;
  baseSalary: number;
  status: 'active' | 'inactive' | 'terminated' | 'on_leave';
  createdAt: string;
  updatedAt: string;
}

interface KioskAttendanceRecord {
  id: string;
  employeeId: string;
  type: 'clock_in' | 'clock_out';
  sessionType: SessionType;
  timestamp: string;
  location: string;
  selfieUrl?: string;
  qrCodeScanned: boolean;
  qrCodeData?: string;
}

interface RecordAttendanceData {
  employeeId: string;
  type: 'clock_in' | 'clock_out';
  location: string;
  qrCodeData: string;
  selfieUrl?: string;
}

interface TimeBasedRecordAttendanceData {
  employeeId: string;
  sessionType: SessionType;
  location: string;
  qrCodeData: string;
  selfieUrl?: string;
}

class KioskService {
  /**
   * Verify employee by QR code data
   */
  async verifyEmployeeByQR(qrCodeData: string): Promise<KioskEmployee> {
    try {
      // Parse QR code data (assuming it's JSON)
      let qrData;
      try {
        qrData = JSON.parse(qrCodeData);
      } catch (error) {
        throw new Error('Invalid QR code format');
      }

      // Extract employee ID from QR code
      const employeeId = qrData.employeeId;
      if (!employeeId) {
        throw new Error('Employee ID not found in QR code');
      }

      // Query employee by employee ID
      const query = `
        SELECT 
          e.id,
          e.employee_id as "employeeId",
          u.first_name as "firstName",
          u.last_name as "lastName",
          u.email,
          e.department_id as "departmentId",
          d.name as "departmentName",
          e.position,
          e.employment_type as "employmentType",
          e.hire_date as "hireDate",
          e.base_salary as "baseSalary",
          e.status,
          e.created_at as "createdAt",
          e.updated_at as "updatedAt"
        FROM employees e
        JOIN users u ON e.user_id = u.id
        LEFT JOIN departments d ON e.department_id = d.id
        WHERE e.employee_id = $1 AND e.status = 'active'
      `;

      const result = await getPool().query(query, [employeeId]);
      
      if (result.rows.length === 0) {
        throw new Error('Employee not found or inactive');
      }

      return result.rows[0];
    } catch (error) {
      console.error('Error verifying employee by QR:', error);
      throw error;
    }
  }

  /**
   * Record attendance
   */
  async recordAttendance(data: RecordAttendanceData): Promise<KioskAttendanceRecord> {
    try {
      const { employeeId, type, location, qrCodeData, selfieUrl } = data;
      console.log('KioskService.recordAttendance called with:', { employeeId, type, location, qrCodeData, selfieUrl });

      // First, ensure attendance record exists for today
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      
      const attendanceRecordQuery = `
        INSERT INTO attendance_records (employee_id, date, overall_status)
        VALUES ($1, $2, 'present')
        ON CONFLICT (employee_id, date) DO NOTHING
        RETURNING id
      `;

      const attendanceRecordResult = await getPool().query(attendanceRecordQuery, [employeeId, today]);
      
      // Get the attendance record ID (either newly created or existing)
      let attendanceRecordId;
      if (attendanceRecordResult.rows.length > 0) {
        attendanceRecordId = attendanceRecordResult.rows[0].id;
      } else {
        // Get existing record
        const existingRecordQuery = `
          SELECT id FROM attendance_records 
          WHERE employee_id = $1 AND date = $2
        `;
        const existingResult = await getPool().query(existingRecordQuery, [employeeId, today]);
        attendanceRecordId = existingResult.rows[0].id;
      }

      const now = new Date();

      // Check if there's an existing incomplete session for today
      const existingSessionQuery = `
        SELECT s.id, s.session_type, s.clock_in, s.clock_out
        FROM attendance_sessions s
        JOIN attendance_records ar ON s.attendance_record_id = ar.id
        WHERE ar.employee_id = $1 
          AND ar.date = $2
          AND (s.clock_in IS NULL OR s.clock_out IS NULL)
        ORDER BY s.created_at DESC
        LIMIT 1
      `;
      
      const existingSession = await getPool().query(existingSessionQuery, [employeeId, today]);
      
      let result;
      
      if (existingSession.rows.length > 0) {
        // Update existing session
        const session = existingSession.rows[0];
        
        if (type === 'clock_out' && session.clock_in && !session.clock_out) {
          // Complete the session with clock_out
          const updateQuery = `
            UPDATE attendance_sessions 
            SET clock_out = $1, selfie_image_url = $5, updated_at = NOW()
            WHERE id = $2
            RETURNING 
              id,
              $3 as "employeeId",
              'clock_out' as "type",
              $1 as "timestamp",
              $4 as "location",
              $5 as "selfieUrl",
              $6 as "qrCodeData",
              true as "qrCodeScanned"
          `;
          
          result = await getPool().query(updateQuery, [
            now.toISOString(),
            session.id,
            employeeId,
            location,
            selfieUrl || null,
            qrCodeData
          ]);
        } else if (type === 'clock_in' && !session.clock_in) {
          // Update existing session with clock_in
          const updateQuery = `
            UPDATE attendance_sessions 
            SET clock_in = $1, selfie_image_url = $5, updated_at = NOW()
            WHERE id = $2
            RETURNING 
              id,
              $3 as "employeeId",
              'clock_in' as "type",
              $1 as "timestamp",
              $4 as "location",
              $5 as "selfieUrl",
              $6 as "qrCodeData",
              true as "qrCodeScanned"
          `;
          
          result = await getPool().query(updateQuery, [
            now.toISOString(),
            session.id,
            employeeId,
            location,
            selfieUrl || null,
            qrCodeData
          ]);
        } else {
          // Create new session if existing one can't be updated
          result = await this.createNewSession(attendanceRecordId, type, now, location, selfieUrl, employeeId, qrCodeData);
        }
      } else {
        // Create new session
        result = await this.createNewSession(attendanceRecordId, type, now, location, selfieUrl, employeeId, qrCodeData);
      }

      console.log('KioskService.recordAttendance result:', result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error('Error recording attendance:', error);
      throw error;
    }
  }

  /**
   * Create a new attendance session
   */
  private async createNewSession(
    attendanceRecordId: string, 
    type: string, 
    timestamp: Date, 
    location: string, 
    selfieUrl: string | undefined, 
    employeeId: string, 
    qrCodeData: string
  ) {
    const clockIn = type === 'clock_in' ? timestamp.toISOString() : null;
    const clockOut = type === 'clock_out' ? timestamp.toISOString() : null;

    const insertQuery = `
      INSERT INTO attendance_sessions (
        attendance_record_id,
        session_type,
        clock_in,
        clock_out,
        status,
        selfie_image_path,
        selfie_image_url,
        created_at
      ) VALUES ($1, $2, $3, $4, 'present', $5, $5, NOW())
      RETURNING 
        id,
        $6 as "employeeId",
        $2 as "type",
        COALESCE($3, $4) as "timestamp",
        $7 as "location",
        $5 as "selfieUrl",
        $8 as "qrCodeData",
        true as "qrCodeScanned"
    `;

    return await getPool().query(insertQuery, [
      attendanceRecordId,
      type,
      clockIn,
      clockOut,
      selfieUrl || null,
      employeeId,
      location,
      qrCodeData
    ]);
  }

  /**
   * Get last attendance record for employee
   */
  async getLastAttendance(employeeId: string): Promise<KioskAttendanceRecord | null> {
    try {
      const query = `
        SELECT 
          s.id,
          ar.employee_id as "employeeId",
          s.session_type as "type",
          COALESCE(s.clock_in, s.clock_out) as "timestamp",
          'Office' as "location",
          s.selfie_image_path as "selfieUrl",
          'QR_CODE_DATA' as "qrCodeData",
          true as "qrCodeScanned"
        FROM attendance_sessions s
        JOIN attendance_records ar ON s.attendance_record_id = ar.id
        WHERE ar.employee_id = $1
        ORDER BY s.created_at DESC
        LIMIT 1
      `;

      const result = await getPool().query(query, [employeeId]);
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('Error getting last attendance:', error);
      throw error;
    }
  }

  /**
   * Get attendance history for employee
   */
  async getAttendanceHistory(employeeId: string, limit: number = 10): Promise<KioskAttendanceRecord[]> {
    try {
      const query = `
        SELECT 
          s.id,
          ar.employee_id as "employeeId",
          s.session_type as "type",
          COALESCE(s.clock_in, s.clock_out) as "timestamp",
          'Office' as "location",
          s.selfie_image_path as "selfieUrl",
          'QR_CODE_DATA' as "qrCodeData",
          true as "qrCodeScanned"
        FROM attendance_sessions s
        JOIN attendance_records ar ON s.attendance_record_id = ar.id
        WHERE ar.employee_id = $1
        ORDER BY s.created_at DESC
        LIMIT $2
      `;

      const result = await getPool().query(query, [employeeId, limit]);
      
      return result.rows;
    } catch (error) {
      console.error('Error getting attendance history:', error);
      throw error;
    }
  }

  /**
   * Record time-based attendance using the new session system
   */
  async recordTimeBasedAttendance(data: TimeBasedRecordAttendanceData): Promise<KioskAttendanceRecord> {
    try {
      const { employeeId, sessionType, location, qrCodeData, selfieUrl } = data;
      console.log('KioskService.recordTimeBasedAttendance called with:', { employeeId, sessionType, location, qrCodeData, selfieUrl });

      // Use the attendance service to record time-based attendance
      const attendanceData: TimeBasedAttendanceData = {
        employeeId,
        sessionType,
        qrCodeHash: qrCodeData,
        selfieImagePath: selfieUrl, // This is now the file path from Multer
        timestamp: new Date() // This will be converted to UTC in the attendance service
      };

      await attendanceService.recordTimeBasedAttendance(attendanceData);
      
      // Find the session that was just created/updated
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const query = `
        SELECT 
          s.id,
          ar.employee_id as "employeeId",
          s.session_type as "sessionType",
          COALESCE(s.clock_in, s.clock_out) as "timestamp",
          $1 as "location",
          s.selfie_image_path as "selfieUrl",
          $2 as "qrCodeData",
          true as "qrCodeScanned",
          CASE 
            WHEN s.session_type IN ('morning_in', 'afternoon_in') THEN 'clock_in'
            WHEN s.session_type IN ('morning_out', 'afternoon_out') THEN 'clock_out'
            ELSE 'clock_in'
          END as "type"
        FROM attendance_sessions s
        JOIN attendance_records ar ON s.attendance_record_id = ar.id
        WHERE ar.employee_id = $3
          AND ar.date = $4
          AND s.session_type = $5
        ORDER BY s.created_at DESC
        LIMIT 1
      `;

      const result = await getPool().query(query, [location, qrCodeData, employeeId, today, sessionType]);
      
      if (result.rows.length === 0) {
        throw new Error('Failed to retrieve recorded attendance session');
      }

      console.log('KioskService.recordTimeBasedAttendance result:', result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error('Error recording time-based attendance:', error);
      throw error;
    }
  }

  /**
   * Get next expected session for employee
   */
  async getNextExpectedSession(employeeId: string): Promise<{
    sessionType: SessionType | null;
    displayInfo: ReturnType<typeof getSessionDisplayInfo> | null;
    canPerform: boolean;
    reason?: string;
  }> {
    try {
      return await attendanceService.getNextExpectedSession(employeeId);
    } catch (error) {
      console.error('Error getting next expected session:', error);
      throw error;
    }
  }

  /**
   * Validate attendance action for employee
   */
  async validateAttendanceAction(employeeId: string, sessionType: SessionType): Promise<{
    canPerform: boolean;
    reason?: string;
    nextExpectedSession?: SessionType;
    sessionDisplayInfo?: ReturnType<typeof getSessionDisplayInfo>;
  }> {
    try {
      return await attendanceService.validateAttendanceAction(employeeId, sessionType);
    } catch (error) {
      console.error('Error validating attendance action:', error);
      throw error;
    }
  }

  /**
   * Get today's attendance summary for employee
   */
  async getTodayAttendanceSummary(employeeId: string): Promise<{
    sessions: KioskAttendanceRecord[];
    nextExpectedSession: SessionType | null;
    canPerformNext: boolean;
    reason?: string;
  }> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get today's sessions
      const sessions = await this.getAttendanceHistory(employeeId, 10);
      const todaySessions = sessions.filter(session => {
        const sessionDate = new Date(session.timestamp);
        sessionDate.setHours(0, 0, 0, 0);
        return sessionDate.getTime() === today.getTime();
      });

      // Get next expected session
      const nextSession = await this.getNextExpectedSession(employeeId);

      return {
        sessions: todaySessions,
        nextExpectedSession: nextSession.sessionType,
        canPerformNext: nextSession.canPerform,
        reason: nextSession.reason
      };
    } catch (error) {
      console.error('Error getting today attendance summary:', error);
      throw error;
    }
  }
}

export default new KioskService();
