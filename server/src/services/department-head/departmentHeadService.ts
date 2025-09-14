import { getPool } from '../../config/database';
import { EmployeeModel } from '../../models/hr/Employee';
import { PayrollApprovalModel } from '../../models/payroll/PayrollApproval';
import logger from '../../utils/logger';

const employeeModel = new EmployeeModel();
const payrollApprovalModel = new PayrollApprovalModel();

export interface DepartmentHeadDashboard {
  department: {
    id: string;
    name: string;
    description: string;
    employeeCount: number;
  };
  pendingRequests: {
    timeCorrections: number;
    overtime: number;
    leaves: number;
    total: number;
  };
  recentActivity: Array<{
    type: 'time_correction' | 'overtime' | 'leave';
    employeeName: string;
    date: string;
    status: string;
  }>;
  attendanceSummary: {
    presentToday: number;
    absentToday: number;
    lateToday: number;
  };
}

export interface DepartmentEmployee {
  id: string;
  employeeId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  position: string;
  employmentType: string;
  hireDate: string;
  status: string;
  lastAttendance?: string;
}

export interface PendingRequest {
  id: string;
  type: 'time_correction' | 'overtime' | 'leave';
  employee: {
    id: string;
    employeeId: string;
    name: string;
  };
  requestDate: string;
  details: any;
  status: string;
  createdAt: string;
}

export interface DepartmentStats {
  totalEmployees: number;
  activeEmployees: number;
  attendanceRate: number;
  averageHours: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
}

export class DepartmentHeadService {
  /**
   * Get department head dashboard data
   */
  async getDashboard(userId: string): Promise<DepartmentHeadDashboard> {
    try {
      // Get department information
      const department = await this.getDepartmentByHead(userId);
      if (!department) {
        throw new Error('Department not found or user is not a department head');
      }

      // Get pending requests count
      const pendingRequests = await this.getPendingRequestsCount(department.id);

      // Get recent activity
      const recentActivity = await this.getRecentActivity(department.id);

      // Get attendance summary for today
      const attendanceSummary = await this.getTodayAttendanceSummary(department.id);

      return {
        department: {
          id: department.id,
          name: department.name,
          description: department.description || '',
          employeeCount: department.employeeCount || 0
        },
        pendingRequests,
        recentActivity,
        attendanceSummary
      };
    } catch (error) {
      logger.error('Error getting department head dashboard:', { error, userId });
      throw error;
    }
  }

  /**
   * Get department employees
   */
  async getDepartmentEmployees(
    userId: string,
    options: {
      page: number;
      limit: number;
      status?: string;
      search?: string;
    }
  ): Promise<{ data: DepartmentEmployee[]; pagination: any }> {
    try {
      const department = await this.getDepartmentByHead(userId);
      if (!department) {
        throw new Error('Department not found or user is not a department head');
      }

      const offset = (options.page - 1) * options.limit;
      
      let query = `
        SELECT 
          e.id,
          e.employee_id,
          e.position,
          e.employment_type,
          e.hire_date,
          e.status,
          u.id as user_id,
          u.first_name,
          u.last_name,
          u.email,
          ar.date as last_attendance
        FROM employees e
        JOIN users u ON e.user_id = u.id
        LEFT JOIN LATERAL (
          SELECT date
          FROM attendance_records ar
          WHERE ar.employee_id = e.id
          ORDER BY ar.date DESC
          LIMIT 1
        ) ar ON true
        WHERE e.department_id = $1
      `;

      const queryParams: any[] = [department.id];
      let paramCount = 2;

      if (options.status) {
        query += ` AND e.status = $${paramCount++}`;
        queryParams.push(options.status);
      }

      if (options.search) {
        query += ` AND (u.first_name ILIKE $${paramCount} OR u.last_name ILIKE $${paramCount} OR e.employee_id ILIKE $${paramCount})`;
        queryParams.push(`%${options.search}%`);
      }

      query += ` ORDER BY u.first_name, u.last_name LIMIT $${paramCount++} OFFSET $${paramCount++}`;
      queryParams.push(parseInt(options.limit.toString()), parseInt(offset.toString()));

      const result = await getPool().query(query, queryParams);

      // Get total count
      let countQuery = `
        SELECT COUNT(*) as total
        FROM employees e
        JOIN users u ON e.user_id = u.id
        WHERE e.department_id = $1
      `;
      const countParams: any[] = [department.id];

      if (options.status) {
        countQuery += ` AND e.status = $2`;
        countParams.push(options.status);
      }

      if (options.search) {
        const searchParamIndex = countParams.length + 1;
        countQuery += ` AND (u.first_name ILIKE $${searchParamIndex} OR u.last_name ILIKE $${searchParamIndex} OR e.employee_id ILIKE $${searchParamIndex})`;
        countParams.push(`%${options.search}%`);
      }

      const countResult = await getPool().query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].total);

      const employees: DepartmentEmployee[] = result.rows.map((row: any) => ({
        id: row.id,
        employeeId: row.employee_id,
        user: {
          id: row.user_id,
          firstName: row.first_name,
          lastName: row.last_name,
          email: row.email
        },
        position: row.position,
        employmentType: row.employment_type,
        hireDate: row.hire_date,
        status: row.status,
        lastAttendance: row.last_attendance
      }));

      return {
        data: employees,
        pagination: {
          page: options.page,
          limit: options.limit,
          total,
          pages: Math.ceil(total / options.limit)
        }
      };
    } catch (error) {
      logger.error('Error getting department employees:', { error, userId });
      throw error;
    }
  }

  /**
   * Get employee details
   */
  async getEmployeeDetails(userId: string, employeeId: string): Promise<any> {
    try {
      const department = await this.getDepartmentByHead(userId);
      if (!department) {
        throw new Error('Department not found or user is not a department head');
      }

      const employee = await employeeModel.findByIdWithDetails(employeeId);
      if (!employee) {
        throw new Error('Employee not found');
      }

      // Verify employee belongs to department head's department
      if (employee.department_id !== department.id) {
        throw new Error('Employee does not belong to your department');
      }

      return employee;
    } catch (error) {
      logger.error('Error getting employee details:', { error, userId, employeeId });
      throw error;
    }
  }

  /**
   * Get pending requests for approval
   */
  async getPendingRequests(
    userId: string,
    options: {
      type?: string;
      page: number;
      limit: number;
    }
  ): Promise<{ data: PendingRequest[]; pagination: any }> {
    try {
      const department = await this.getDepartmentByHead(userId);
      if (!department) {
        throw new Error('Department not found or user is not a department head');
      }

      const offset = (options.page - 1) * options.limit;
      const requests: PendingRequest[] = [];

      // For now, return empty array as the models need to be extended with department-specific methods
      // This would be implemented by adding findPendingByDepartment methods to the respective models

      // Sort by creation date (newest first)
      requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return {
        data: requests.slice(offset, offset + options.limit),
        pagination: {
          page: options.page,
          limit: options.limit,
          total: requests.length,
          pages: Math.ceil(requests.length / options.limit)
        }
      };
    } catch (error) {
      logger.error('Error getting pending requests:', { error, userId });
      throw error;
    }
  }

  /**
   * Get request history
   */
  async getRequestHistory(
    userId: string,
    options: {
      type?: string;
      page: number;
      limit: number;
      status?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<{ data: PendingRequest[]; pagination: any }> {
    try {
      const department = await this.getDepartmentByHead(userId);
      if (!department) {
        throw new Error('Department not found or user is not a department head');
      }

      // This would be similar to getPendingRequests but with different filters
      // For now, return empty data as the models need to be extended
      return {
        data: [],
        pagination: {
          page: options.page,
          limit: options.limit,
          total: 0,
          pages: 0
        }
      };
    } catch (error) {
      logger.error('Error getting request history:', { error, userId });
      throw error;
    }
  }

  /**
   * Get department statistics
   */
  async getDepartmentStats(userId: string, period: string): Promise<DepartmentStats> {
    try {
      const department = await this.getDepartmentByHead(userId);
      if (!department) {
        throw new Error('Department not found or user is not a department head');
      }

      // Get basic employee counts
      const employeeCountQuery = `
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'active') as active
        FROM employees 
        WHERE department_id = $1
      `;
      const employeeResult = await getPool().query(employeeCountQuery, [department.id]);

      // Get attendance rate for the period
      const attendanceQuery = `
        SELECT 
          COUNT(DISTINCT ar.employee_id) as present_employees,
          COUNT(DISTINCT e.id) as total_employees
        FROM employees e
        LEFT JOIN attendance_records ar ON e.id = ar.employee_id 
          AND ar.created_at >= $2
          AND ar.status = 'present'
        WHERE e.department_id = $1 AND e.status = 'active'
      `;
      
      const periodStart = this.getPeriodStart(period);
      const attendanceResult = await getPool().query(attendanceQuery, [department.id, periodStart]);

      // Get pending requests count
      const pendingCount = await this.getPendingRequestsCount(department.id);

      return {
        totalEmployees: parseInt(employeeResult.rows[0].total),
        activeEmployees: parseInt(employeeResult.rows[0].active),
        attendanceRate: attendanceResult.rows[0].total_employees > 0 
          ? (parseInt(attendanceResult.rows[0].present_employees) / parseInt(attendanceResult.rows[0].total_employees)) * 100
          : 0,
        averageHours: 0, // Would need more complex calculation
        pendingRequests: pendingCount.total,
        approvedRequests: 0, // Would need to query approval history
        rejectedRequests: 0 // Would need to query approval history
      };
    } catch (error) {
      logger.error('Error getting department statistics:', { error, userId });
      throw error;
    }
  }

  /**
   * Get attendance summary for department
   */
  async getAttendanceSummary(
    userId: string,
    options: {
      startDate?: string;
      endDate?: string;
      employeeId?: string;
    }
  ): Promise<any> {
    try {
      const department = await this.getDepartmentByHead(userId);
      if (!department) {
        throw new Error('Department not found or user is not a department head');
      }

      // Implementation would depend on specific requirements
      return {
        summary: 'Attendance summary data',
        period: {
          startDate: options.startDate,
          endDate: options.endDate
        }
      };
    } catch (error) {
      logger.error('Error getting attendance summary:', { error, userId });
      throw error;
    }
  }

  /**
   * Get payroll summary for department
   */
  async getPayrollSummary(
    userId: string,
    options: {
      periodId?: string;
      page: number;
      limit: number;
    }
  ): Promise<{ data: any[]; pagination: any }> {
    try {
      const department = await this.getDepartmentByHead(userId);
      if (!department) {
        throw new Error('Department not found or user is not a department head');
      }

      // Implementation would depend on specific requirements
      return {
        data: [],
        pagination: {
          page: options.page,
          limit: options.limit,
          total: 0,
          pages: 0
        }
      };
    } catch (error) {
      logger.error('Error getting payroll summary:', { error, userId });
      throw error;
    }
  }

  /**
   * Helper method to get department by department head user ID
   */
  private async getDepartmentByHead(userId: string): Promise<any> {
    const query = `
      SELECT 
        d.id,
        d.name,
        d.description,
        COUNT(e.id) as employee_count
      FROM departments d
      LEFT JOIN employees e ON d.id = e.department_id AND e.status = 'active'
      WHERE d.department_head_user_id = $1 AND d.is_active = true
      GROUP BY d.id, d.name, d.description
    `;
    
    const result = await getPool().query(query, [userId]);
    return result.rows[0] || null;
  }

  /**
   * Helper method to get pending requests count
   */
  private async getPendingRequestsCount(departmentId: string): Promise<{
    timeCorrections: number;
    overtime: number;
    leaves: number;
    total: number;
  }> {
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM time_correction_requests tcr
         JOIN employees e ON tcr.employee_id = e.id
         WHERE e.department_id = $1 AND tcr.status = 'pending') as time_corrections,
        (SELECT COUNT(*) FROM overtime_requests otr
         JOIN employees e ON otr.employee_id = e.id
         WHERE e.department_id = $1 AND otr.status = 'pending') as overtime,
        (SELECT COUNT(*) FROM leaves l
         JOIN employees e ON l.employee_id = e.id
         WHERE e.department_id = $1 AND l.status = 'pending') as leaves
    `;
    
    const result = await getPool().query(query, [departmentId]);
    const row = result.rows[0];
    
    return {
      timeCorrections: parseInt(row.time_corrections),
      overtime: parseInt(row.overtime),
      leaves: parseInt(row.leaves),
      total: parseInt(row.time_corrections) + parseInt(row.overtime) + parseInt(row.leaves)
    };
  }

  /**
   * Helper method to get recent activity
   */
  private async getRecentActivity(departmentId: string): Promise<Array<{
    type: 'time_correction' | 'overtime' | 'leave';
    employeeName: string;
    date: string;
    status: string;
  }>> {
    try {
      // Get recent time correction requests
      const timeCorrectionsQuery = `
        SELECT 
          'time_correction' as type,
          CONCAT(u.first_name, ' ', u.last_name) as employee_name,
          tcr.created_at as date,
          tcr.status
        FROM time_correction_requests tcr
        JOIN employees e ON tcr.employee_id = e.id
        JOIN users u ON e.user_id = u.id
        WHERE e.department_id = $1
        ORDER BY tcr.created_at DESC
        LIMIT 5
      `;

      // Get recent overtime requests
      const overtimeQuery = `
        SELECT 
          'overtime' as type,
          CONCAT(u.first_name, ' ', u.last_name) as employee_name,
          otr.created_at as date,
          otr.status
        FROM overtime_requests otr
        JOIN employees e ON otr.employee_id = e.id
        JOIN users u ON e.user_id = u.id
        WHERE e.department_id = $1
        ORDER BY otr.created_at DESC
        LIMIT 5
      `;

      // Get recent leave requests
      const leaveQuery = `
        SELECT 
          'leave' as type,
          CONCAT(u.first_name, ' ', u.last_name) as employee_name,
          l.created_at as date,
          l.status
        FROM leaves l
        JOIN employees e ON l.employee_id = e.id
        JOIN users u ON e.user_id = u.id
        WHERE e.department_id = $1
        ORDER BY l.created_at DESC
        LIMIT 5
      `;

      const [timeCorrectionsResult, overtimeResult, leaveResult] = await Promise.all([
        getPool().query(timeCorrectionsQuery, [departmentId]),
        getPool().query(overtimeQuery, [departmentId]),
        getPool().query(leaveQuery, [departmentId])
      ]);

      // Combine all results and sort by date
      const allActivities = [
        ...timeCorrectionsResult.rows,
        ...overtimeResult.rows,
        ...leaveResult.rows
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
       .slice(0, 10); // Get top 10 most recent activities

      return allActivities.map(activity => ({
        type: activity.type as 'time_correction' | 'overtime' | 'leave',
        employeeName: activity.employee_name,
        date: activity.date,
        status: activity.status
      }));
    } catch (error) {
      logger.error('Error getting recent activity:', { error, departmentId });
      return [];
    }
  }

  /**
   * Helper method to get today's attendance summary
   */
  private async getTodayAttendanceSummary(departmentId: string): Promise<{
    presentToday: number;
    absentToday: number;
    lateToday: number;
  }> {
    const today = new Date().toISOString().split('T')[0];
    
    const query = `
      SELECT 
        COUNT(*) FILTER (WHERE ar.overall_status = 'present') as present,
        COUNT(*) FILTER (WHERE ar.overall_status = 'absent') as absent,
        COUNT(*) FILTER (WHERE ar.overall_status = 'late') as late
      FROM employees e
      LEFT JOIN attendance_records ar ON e.id = ar.employee_id 
        AND DATE(ar.date) = $2
      WHERE e.department_id = $1 AND e.status = 'active'
    `;
    
    const result = await getPool().query(query, [departmentId, today]);
    const row = result.rows[0];
    
    return {
      presentToday: parseInt(row.present) || 0,
      absentToday: parseInt(row.absent) || 0,
      lateToday: parseInt(row.late) || 0
    };
  }

  /**
   * Get department info for department head
   */
  async getDepartmentInfo(userId: string): Promise<any> {
    return await this.getDepartmentByHead(userId);
  }

  /**
   * Get employee statistics for department
   */
  async getEmployeeStats(userId: string): Promise<any> {
    const department = await this.getDepartmentByHead(userId);
    if (!department) {
      throw new Error('Department not found');
    }

    const query = `
      SELECT 
        COUNT(*) as total_employees,
        COUNT(*) FILTER (WHERE status = 'active') as active_employees,
        COUNT(*) FILTER (WHERE status = 'inactive') as inactive_employees,
        AVG(base_salary) as average_salary
      FROM employees 
      WHERE department_id = $1
    `;
    
    const result = await getPool().query(query, [department.id]);
    return result.rows[0];
  }

  /**
   * Get employee performance statistics
   */
  async getEmployeePerformance(userId: string): Promise<any[]> {
    try {
      const department = await this.getDepartmentByHead(userId);
      if (!department) {
        throw new Error('Department not found');
      }

      // Get employee performance data with attendance statistics
      const performanceQuery = `
        SELECT 
          e.id as employee_id,
          CONCAT(u.first_name, ' ', u.last_name) as employee_name,
          e.position,
          e.employee_id as employee_code,
          -- Calculate attendance rate (last 30 days)
          COALESCE(
            ROUND(
              (COUNT(CASE WHEN ar.overall_status = 'present' THEN 1 END) * 100.0 / 
               NULLIF(COUNT(ar.id), 0)), 2
            ), 0
          ) as attendance_rate,
          -- Calculate punctuality score (on-time arrivals)
          COALESCE(
            ROUND(
              (COUNT(CASE WHEN ar.overall_status = 'present' AND ats.clock_in::time <= '09:00:00' THEN 1 END) * 100.0 / 
               NULLIF(COUNT(CASE WHEN ar.overall_status = 'present' THEN 1 END), 0)), 2
            ), 0
          ) as punctuality_score,
          -- Count late days
          COUNT(CASE WHEN ar.overall_status = 'present' AND ats.clock_in::time > '09:00:00' THEN 1 END) as total_days_late,
          -- Count absent days
          COUNT(CASE WHEN ar.overall_status = 'absent' THEN 1 END) as total_days_absent,
          -- Average clock-in time
          COALESCE(
            TO_CHAR(AVG(CASE WHEN ar.overall_status = 'present' THEN ats.clock_in::time END), 'HH24:MI'), 
            'N/A'
          ) as average_clock_in_time
        FROM employees e
        JOIN users u ON e.user_id = u.id
        LEFT JOIN attendance_records ar ON e.id = ar.employee_id 
          AND ar.created_at >= CURRENT_DATE - INTERVAL '30 days'
        LEFT JOIN attendance_sessions ats ON ar.id = ats.attendance_record_id
          AND ats.session_type = 'morning'
        WHERE e.department_id = $1
        GROUP BY e.id, u.first_name, u.last_name, e.position, e.employee_id
        ORDER BY attendance_rate DESC, punctuality_score DESC
      `;

      const result = await getPool().query(performanceQuery, [department.id]);
      
      return result.rows.map(row => ({
        employeeId: row.employee_id,
        employeeName: row.employee_name,
        position: row.position,
        employeeCode: row.employee_code,
        attendanceRate: parseFloat(row.attendance_rate) || 0,
        punctualityScore: parseFloat(row.punctuality_score) || 0,
        totalDaysLate: parseInt(row.total_days_late) || 0,
        totalDaysAbsent: parseInt(row.total_days_absent) || 0,
        averageClockInTime: row.average_clock_in_time
      }));
    } catch (error) {
      logger.error('Error getting employee performance:', { error, userId });
      return [];
    }
  }

  /**
   * Get all requests for department head
   */
  async getRequests(userId: string, params: {
    type?: string;
    status?: string;
    page: number;
    limit: number;
  }): Promise<{ data: any[]; pagination: any }> {
    const department = await this.getDepartmentByHead(userId);
    if (!department) {
      throw new Error('Department not found');
    }

    const pool = getPool();
    const offset = (params.page - 1) * params.limit;

    try {
      // Build the base query for all request types
      let whereConditions = ['e.department_id = $1'];
      let queryParams: any[] = [department.id];
      let paramIndex = 2;

      // Add type filter if specified
      if (params.type) {
        whereConditions.push(`request_type = $${paramIndex}`);
        queryParams.push(params.type);
        paramIndex++;
      }

      // Add status filter if specified
      if (params.status) {
        whereConditions.push(`status = $${paramIndex}`);
        queryParams.push(params.status);
        paramIndex++;
      }


      // Query to get all requests (overtime, leave, time correction) for the department
      const requestsQuery = `
        WITH all_requests AS (
          -- Overtime requests
          SELECT 
            ot.id,
            'overtime' as request_type,
            ot.employee_id,
            ot.request_date as start_date,
            ot.overtime_date as end_date,
            ot.requested_hours as hours,
            ot.reason,
            ot.status::text as status,
            ot.created_at,
            ot.updated_at,
            ot.approver_id as approved_by,
            ot.approved_at,
            ot.comments,
            e.employee_id as employee_code,
            u.first_name,
            u.last_name,
            u.email
          FROM overtime_requests ot
          JOIN employees e ON ot.employee_id = e.id
          JOIN users u ON e.user_id = u.id
          WHERE e.department_id = $1
          
          UNION ALL
          
          -- Leave requests
          SELECT 
            l.id,
            'leave' as request_type,
            l.employee_id,
            l.start_date,
            l.end_date,
            (l.end_date - l.start_date + 1) as hours,
            l.leave_type::text as reason,
            l.status::text as status,
            l.created_at,
            l.updated_at,
            l.approver_id as approved_by,
            NULL as approved_at,
            NULL as comments,
            e.employee_id as employee_code,
            u.first_name,
            u.last_name,
            u.email
          FROM leaves l
          JOIN employees e ON l.employee_id = e.id
          JOIN users u ON e.user_id = u.id
          WHERE e.department_id = $1
          
          UNION ALL
          
          -- Time correction requests
          SELECT 
            tcr.id,
            'time_correction' as request_type,
            tcr.employee_id,
            tcr.correction_date as start_date,
            tcr.correction_date as end_date,
            NULL as hours,
            tcr.reason,
            tcr.status::text as status,
            tcr.created_at,
            tcr.updated_at,
            tcr.approver_id as approved_by,
            tcr.approved_at,
            tcr.comments,
            e.employee_id as employee_code,
            u.first_name,
            u.last_name,
            u.email
          FROM time_correction_requests tcr
          JOIN employees e ON tcr.employee_id = e.id
          JOIN users u ON e.user_id = u.id
          WHERE e.department_id = $1
        )
        SELECT 
          ar.*,
          CONCAT(ar.first_name, ' ', ar.last_name) as employee_name
        FROM all_requests ar
        ${whereConditions.length > 1 ? `WHERE ${whereConditions.slice(1).join(' AND ')}` : ''}
        ORDER BY ar.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      // Count query for pagination
      const countQuery = `
        WITH all_requests AS (
          SELECT 'overtime' as request_type, ot.status::text as status, e.department_id
          FROM overtime_requests ot
          JOIN employees e ON ot.employee_id = e.id
          WHERE e.department_id = $1
          
          UNION ALL
          
          SELECT 'leave' as request_type, l.status::text as status, e.department_id
          FROM leaves l
          JOIN employees e ON l.employee_id = e.id
          WHERE e.department_id = $1
          
          UNION ALL
          
          SELECT 'time_correction' as request_type, tcr.status::text as status, e.department_id
          FROM time_correction_requests tcr
          JOIN employees e ON tcr.employee_id = e.id
          WHERE e.department_id = $1
        )
        SELECT COUNT(*) as total
        FROM all_requests ar
        ${whereConditions.length > 1 ? `WHERE ${whereConditions.slice(1).join(' AND ')}` : ''}
      `;

      // Add pagination parameters
      queryParams.push(params.limit, offset);

      const [requestsResult, countResult] = await Promise.all([
        pool.query(requestsQuery, queryParams),
        pool.query(countQuery, queryParams.slice(0, -2)) // Remove limit and offset for count
      ]);

      const total = parseInt(countResult.rows[0]?.total || '0');
      const totalPages = Math.ceil(total / params.limit);

      // Transform the data to match the expected format
      const requests = requestsResult.rows.map(row => ({
        id: row.id,
        type: row.request_type,
        employeeId: row.employee_id,
        employeeName: row.employee_name,
        employeeCode: row.employee_code,
        departmentName: department.name,
        status: row.status,
        submittedAt: row.created_at,
        approverName: row.approved_by ? 'Department Head' : null,
        approvedAt: row.approved_at,
        details: {
          startDate: row.start_date,
          endDate: row.end_date,
          hours: row.hours,
          reason: row.reason,
          comments: row.comments,
          requestType: row.request_type
        }
      }));

      return {
        data: requests,
        pagination: {
          page: params.page,
          limit: params.limit,
          total,
          totalPages
        }
      };
    } catch (error) {
      logger.error('Error fetching requests:', { error, userId, params });
      throw error;
    }
  }

  /**
   * Get request statistics
   */
  async getRequestStats(userId: string): Promise<any> {
    const department = await this.getDepartmentByHead(userId);
    if (!department) {
      throw new Error('Department not found');
    }

    const pool = getPool();

    try {
      // Get comprehensive request statistics
      const statsQuery = `
        WITH all_requests AS (
          SELECT 'overtime' as request_type, ot.status::text as status
          FROM overtime_requests ot
          JOIN employees e ON ot.employee_id = e.id
          WHERE e.department_id = $1
          
          UNION ALL
          
          SELECT 'leave' as request_type, l.status::text as status
          FROM leaves l
          JOIN employees e ON l.employee_id = e.id
          WHERE e.department_id = $1
          
          UNION ALL
          
          SELECT 'time_correction' as request_type, tcr.status::text as status
          FROM time_correction_requests tcr
          JOIN employees e ON tcr.employee_id = e.id
          WHERE e.department_id = $1
        )
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'pending') as pending,
          COUNT(*) FILTER (WHERE status = 'approved') as approved,
          COUNT(*) FILTER (WHERE status = 'rejected') as rejected
        FROM all_requests
      `;

      const result = await pool.query(statsQuery, [department.id]);
      const stats = result.rows[0];

      return {
        total: parseInt(stats.total) || 0,
        pending: parseInt(stats.pending) || 0,
        approved: parseInt(stats.approved) || 0,
        rejected: parseInt(stats.rejected) || 0
      };
    } catch (error) {
      logger.error('Error getting request stats:', { error, userId });
      return {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0
      };
    }
  }

  /**
   * Approve a request
   */
  async approveRequest(userId: string, requestId: string): Promise<void> {
    const pool = getPool();
    
    try {
      // First, determine the request type by checking which table contains the request
      const overtimeQuery = 'SELECT id FROM overtime_requests WHERE id = $1';
      const leaveQuery = 'SELECT id FROM leaves WHERE id = $1';
      const timeCorrectionQuery = 'SELECT id FROM time_correction_requests WHERE id = $1';
      
      const [overtimeResult, leaveResult, timeCorrectionResult] = await Promise.all([
        pool.query(overtimeQuery, [requestId]),
        pool.query(leaveQuery, [requestId]),
        pool.query(timeCorrectionQuery, [requestId])
      ]);
      
      let requestType: string | null = null;
      if (overtimeResult.rows.length > 0) {
        requestType = 'overtime';
      } else if (leaveResult.rows.length > 0) {
        requestType = 'leave';
      } else if (timeCorrectionResult.rows.length > 0) {
        requestType = 'time_correction';
      }
      
      if (!requestType) {
        throw new Error('Request not found');
      }
      
      // Import the appropriate service and approve the request
      if (requestType === 'overtime') {
        const { OvertimeService } = await import('../attendance/overtimeService');
        const overtimeService = new OvertimeService();
        await overtimeService.approveOvertimeRequest({
          requestId,
          approverId: userId,
          approved: true,
          comments: 'Approved by department head'
        });
      } else if (requestType === 'leave') {
        const { LeaveService } = await import('../leave/leaveService');
        const leaveService = new LeaveService();
        await leaveService.approveLeaveRequest({
          leaveId: requestId,
          approverId: userId,
          approved: true,
          comments: 'Approved by department head'
        });
      } else if (requestType === 'time_correction') {
        const { TimeCorrectionService } = await import('../attendance/timeCorrectionService');
        const timeCorrectionService = new TimeCorrectionService();
        await timeCorrectionService.approveTimeCorrectionRequest({
          requestId,
          approverId: userId,
          approved: true,
          comments: 'Approved by department head'
        });
      }
      
      logger.info(`Department head ${userId} approved ${requestType} request ${requestId}`);
    } catch (error) {
      logger.error('Error approving request:', { error, userId, requestId });
      throw error;
    }
  }

  /**
   * Reject a request
   */
  async rejectRequest(userId: string, requestId: string, reason?: string): Promise<void> {
    const pool = getPool();
    
    try {
      // First, determine the request type by checking which table contains the request
      const overtimeQuery = 'SELECT id FROM overtime_requests WHERE id = $1';
      const leaveQuery = 'SELECT id FROM leaves WHERE id = $1';
      const timeCorrectionQuery = 'SELECT id FROM time_correction_requests WHERE id = $1';
      
      const [overtimeResult, leaveResult, timeCorrectionResult] = await Promise.all([
        pool.query(overtimeQuery, [requestId]),
        pool.query(leaveQuery, [requestId]),
        pool.query(timeCorrectionQuery, [requestId])
      ]);
      
      let requestType: string | null = null;
      if (overtimeResult.rows.length > 0) {
        requestType = 'overtime';
      } else if (leaveResult.rows.length > 0) {
        requestType = 'leave';
      } else if (timeCorrectionResult.rows.length > 0) {
        requestType = 'time_correction';
      }
      
      if (!requestType) {
        throw new Error('Request not found');
      }
      
      // Import the appropriate service and reject the request
      if (requestType === 'overtime') {
        const { OvertimeService } = await import('../attendance/overtimeService');
        const overtimeService = new OvertimeService();
        await overtimeService.approveOvertimeRequest({
          requestId,
          approverId: userId,
          approved: false,
          comments: reason || 'Rejected by department head'
        });
      } else if (requestType === 'leave') {
        const { LeaveService } = await import('../leave/leaveService');
        const leaveService = new LeaveService();
        await leaveService.approveLeaveRequest({
          leaveId: requestId,
          approverId: userId,
          approved: false,
          comments: reason || 'Rejected by department head'
        });
      } else if (requestType === 'time_correction') {
        const { TimeCorrectionService } = await import('../attendance/timeCorrectionService');
        const timeCorrectionService = new TimeCorrectionService();
        await timeCorrectionService.approveTimeCorrectionRequest({
          requestId,
          approverId: userId,
          approved: false,
          comments: reason || 'Rejected by department head'
        });
      }
      
      logger.info(`Department head ${userId} rejected ${requestType} request ${requestId} with reason: ${reason || 'No reason provided'}`);
    } catch (error) {
      logger.error('Error rejecting request:', { error, userId, requestId, reason });
      throw error;
    }
  }

  /**
   * Get payroll periods for department
   */
  async getPayrollPeriods(userId: string): Promise<any[]> {
    const department = await this.getDepartmentByHead(userId);
    if (!department) {
      throw new Error('Department not found');
    }

    try {
      // Get payroll periods that have been sent for approval to this department head
      const query = `
        SELECT DISTINCT pp.*,
          COUNT(DISTINCT CASE WHEN e.department_id = $1 THEN pr.employee_id END) as total_employees,
          COALESCE(SUM(CASE WHEN e.department_id = $1 THEN pr.net_pay ELSE 0 END), 0) as total_amount,
          pa.id as approval_id,
          pa.status as approval_status,
          pa.comments as approval_comments,
          pa.approved_at
        FROM payroll_periods pp
        INNER JOIN payroll_approvals pa ON pp.id = pa.payroll_period_id
        LEFT JOIN payroll_records pr ON pp.id = pr.payroll_period_id
        LEFT JOIN employees e ON pr.employee_id = e.id
        WHERE pa.approver_id = $2
        GROUP BY pp.id, pp.period_name, pp.start_date, pp.end_date, pp.status, 
                 pp.working_days, pp.expected_hours, pp.created_at, pp.updated_at,
                 pa.id, pa.status, pa.comments, pa.approved_at
        ORDER BY pp.created_at DESC
      `;
      
      const result = await getPool().query(query, [department.id, userId]);
      
      return result.rows.map(period => ({
        id: period.id,
        periodName: period.period_name,
        startDate: period.start_date,
        endDate: period.end_date,
        status: period.approval_status || period.status, // Use approval status if available, fallback to period status
        workingDays: period.working_days,
        expectedHours: period.expected_hours,
        totalEmployees: parseInt(period.total_employees) || 0,
        totalAmount: parseFloat(period.total_amount) || 0,
        approvalId: period.approval_id,
        approvalStatus: period.approval_status,
        approvalComments: period.approval_comments,
        approvedAt: period.approved_at,
        createdAt: period.created_at,
        updatedAt: period.updated_at
      }));
    } catch (error) {
      logger.error('Error getting payroll periods:', error);
      return [];
    }
  }

  /**
   * Get payroll records for a specific period
   */
  async getPayrollRecords(userId: string, periodId: string): Promise<any[]> {
    const department = await this.getDepartmentByHead(userId);
    if (!department) {
      throw new Error('Department not found');
    }

    try {
      // Get payroll records for the period, filtered by department employees
      // Include all required fields for consistency with HR and Employee modules
      const query = `
        SELECT 
          pr.*,
          u.first_name,
          u.last_name,
          e.employee_id,
          e.position,
          e.department_id,
          d.name as department_name,
          pp.period_name
        FROM payroll_records pr
        INNER JOIN employees e ON pr.employee_id = e.id
        INNER JOIN users u ON e.user_id = u.id
        LEFT JOIN departments d ON e.department_id = d.id
        LEFT JOIN payroll_periods pp ON pr.payroll_period_id = pp.id
        WHERE pr.payroll_period_id = $1 AND e.department_id = $2
        ORDER BY u.first_name, u.last_name
      `;
      
      const result = await getPool().query(query, [periodId, department.id]);
      
      // Transform to standardized format
      return result.rows.map(record => ({
        id: record.id,
        payrollPeriodId: record.payroll_period_id,
        periodName: record.period_name,
        employeeId: record.employee_id,
        employeeName: `${record.first_name} ${record.last_name}`,
        position: record.position,
        departmentId: record.department_id,
        departmentName: record.department_name,
        baseSalary: record.base_salary,
        hourlyRate: record.hourly_rate,
        totalWorkedHours: record.total_worked_hours,
        totalRegularHours: record.total_regular_hours,
        totalOvertimeHours: record.total_overtime_hours,
        totalLateHours: record.total_late_hours,
        lateDeductions: record.late_deductions,
        paidLeaveHours: record.paid_leave_hours || 0,
        grossPay: record.gross_pay,
        netPay: record.net_pay,
        totalDeductions: record.total_deductions,
        totalBenefits: record.total_benefits,
        status: record.status,
        createdAt: record.created_at,
        updatedAt: record.updated_at
      }));
    } catch (error) {
      logger.error('Error getting payroll records:', error);
      return [];
    }
  }

  /**
   * Get payroll statistics for department
   */
  async getPayrollStats(userId: string): Promise<any> {
    const department = await this.getDepartmentByHead(userId);
    if (!department) {
      throw new Error('Department not found');
    }

    try {
      // Get total employees in department
      const employeeCountQuery = `
        SELECT COUNT(*) as count
        FROM employees
        WHERE department_id = $1 AND status = 'active'
      `;
      const employeeResult = await getPool().query(employeeCountQuery, [department.id]);
      const totalEmployees = parseInt(employeeResult.rows[0].count);

      // Get total gross pay for current month
      const currentMonth = new Date();
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      const grossPayQuery = `
        SELECT COALESCE(SUM(pr.gross_pay), 0) as total_gross_pay
        FROM payroll_records pr
        INNER JOIN payroll_periods pp ON pr.payroll_period_id = pp.id
        INNER JOIN employees e ON pr.employee_id = e.id
        WHERE e.department_id = $1 
        AND pp.start_date >= $2 
        AND pp.end_date <= $3
      `;
      const grossPayResult = await getPool().query(grossPayQuery, [department.id, startOfMonth, endOfMonth]);
      const totalGrossPay = parseFloat(grossPayResult.rows[0].total_gross_pay);

      // Get completed and processing periods count
      const periodsQuery = `
        SELECT 
          COUNT(CASE WHEN pa.status = 'approved' OR pp.status = 'completed' THEN 1 END) as completed_periods,
          COUNT(CASE WHEN pp.status = 'processing' OR pp.status = 'sent_for_review' THEN 1 END) as processing_periods
        FROM payroll_periods pp
        INNER JOIN payroll_approvals pa ON pp.id = pa.payroll_period_id
        WHERE pa.approver_id = $1
      `;
      const periodsResult = await getPool().query(periodsQuery, [userId]);
      const completedPeriods = parseInt(periodsResult.rows[0].completed_periods);
      const processingPeriods = parseInt(periodsResult.rows[0].processing_periods);

      return {
        totalEmployees,
        totalGrossPay,
        completedPeriods,
        processingPeriods
      };
    } catch (error) {
      logger.error('Error getting payroll statistics:', error);
      return {
        totalEmployees: 0,
        totalGrossPay: 0,
        completedPeriods: 0,
        processingPeriods: 0
      };
    }
  }

  /**
   * Get payroll approvals for department
   */
  async getPayrollApprovals(userId: string): Promise<any[]> {
    const department = await this.getDepartmentByHead(userId);
    if (!department) {
      throw new Error('Department not found');
    }

    try {
      // Get pending approvals for this department head
      const approvals = await payrollApprovalModel.getPendingApprovalsForApprover(userId);
      
      // For each approval, get the detailed payroll records
      const approvalsWithDetails = await Promise.all(
        approvals.map(async (approval) => {
          // Get payroll records for this period and department
          const recordsQuery = `
            SELECT 
              pr.*,
              u.first_name,
              u.last_name,
              e.employee_id,
              e.position,
              e.department_id
            FROM payroll_records pr
            INNER JOIN employees e ON pr.employee_id = e.id
            INNER JOIN users u ON e.user_id = u.id
            WHERE pr.payroll_period_id = $1 AND e.department_id = $2
            ORDER BY u.first_name, u.last_name
          `;
          
          const recordsResult = await getPool().query(recordsQuery, [approval.payrollPeriodId, department.id]);
          
          const payrollRecords = recordsResult.rows.map(record => ({
            id: record.id,
            employeeName: `${record.first_name} ${record.last_name}`,
            employeeId: record.employee_id,
            position: record.position,
            baseSalary: record.base_salary,
            totalRegularHours: record.total_regular_hours,
            totalOvertimeHours: record.total_overtime_hours,
            totalLateHours: record.total_late_hours,
            hourlyRate: record.hourly_rate,
            grossPay: record.gross_pay,
            netPay: record.net_pay,
            totalDeductions: record.total_deductions,
            totalBenefits: record.total_benefits,
            lateDeductions: record.late_deductions,
            status: record.status,
            createdAt: record.created_at,
            updatedAt: record.updated_at
          }));

          // Calculate totals
          const totalEmployees = payrollRecords.length;
          const totalAmount = payrollRecords.reduce((sum, record) => sum + (record.netPay || 0), 0);
          const totalGrossPay = payrollRecords.reduce((sum, record) => sum + (record.grossPay || 0), 0);
          const totalDeductions = payrollRecords.reduce((sum, record) => sum + (record.totalDeductions || 0), 0);
          const totalBenefits = payrollRecords.reduce((sum, record) => sum + (record.totalBenefits || 0), 0);

          return {
            id: approval.id,
            periodName: approval.payrollPeriod.periodName,
            periodId: approval.payrollPeriodId,
            startDate: approval.payrollPeriod.startDate,
            endDate: approval.payrollPeriod.endDate,
            createdAt: approval.createdAt,
            totalEmployees,
            totalAmount,
            totalGrossPay,
            totalDeductions,
            totalBenefits,
            status: approval.status,
            departmentName: approval.department?.name || 'Unknown Department',
            approverName: `${approval.approver.firstName} ${approval.approver.lastName}`,
            comments: approval.comments,
            payrollRecords
          };
        })
      );
      
      return approvalsWithDetails;
    } catch (error) {
      logger.error('Error getting payroll approvals:', error);
      return [];
    }
  }

  /**
   * Approve or reject payroll approval
   */
  async approvePayrollApproval(userId: string, approvalId: string, status: 'approved' | 'rejected', comments?: string): Promise<boolean> {
    try {
      // Verify the approval belongs to this department head
      const approval = await payrollApprovalModel.findById(approvalId);
      if (!approval || approval.approverId !== userId) {
        throw new Error('Approval not found or not authorized');
      }

      // Update the approval
      const updateData = {
        status,
        comments,
        approvedAt: new Date()
      };

      const updatedApproval = await payrollApprovalModel.updatePayrollApproval(approvalId, updateData);
      
      if (updatedApproval) {
        // If approved, update payroll records status to 'processed' for this department
        if (status === 'approved') {
          logger.info(`Updating payroll records to processed for department ${approval.departmentId} in period ${approval.payrollPeriodId}`);
          
          // Update all payroll records for this department and period to 'processed'
          const { getPool } = await import('../../config/database');
          const pool = getPool();
          
          const updateRecordsQuery = `
            UPDATE payroll_records 
            SET status = 'processed', updated_at = CURRENT_TIMESTAMP
            WHERE payroll_period_id = $1 
            AND employee_id IN (
              SELECT e.id FROM employees e 
              WHERE e.department_id = $2
            )
          `;
          
          await pool.query(updateRecordsQuery, [approval.payrollPeriodId, approval.departmentId]);
          
          logger.info(`Updated payroll records to processed for department ${approval.departmentId}`);
        }
        
        // Check if all approvals for this payroll period are now complete
        logger.info(`Department head ${userId} ${status} payroll approval ${approvalId}, checking period status...`);
        const { PayrollApprovalService } = await import('../payroll/payrollApprovalService');
        const payrollApprovalService = new PayrollApprovalService();
        await payrollApprovalService.checkAndUpdatePayrollPeriodStatus(approval.payrollPeriodId);
        
        logger.info(`Department head ${userId} ${status} payroll approval ${approvalId}`);
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('Error approving payroll:', error);
      throw error;
    }
  }


  /**
   * Helper method to get period start date
   */
  private getPeriodStart(period: string): string {
    const now = new Date();
    switch (period) {
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      case 'year':
        return new Date(now.getFullYear(), 0, 1).toISOString();
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    }
  }
}