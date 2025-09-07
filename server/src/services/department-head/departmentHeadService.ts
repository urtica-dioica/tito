import { pool } from '../../config/database';
import { EmployeeModel } from '../../models/hr/Employee';
import logger from '../../utils/logger';

const employeeModel = new EmployeeModel();

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
      queryParams.push(options.limit, offset);

      const result = await pool.query(query, queryParams);

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
        countQuery += ` AND (u.first_name ILIKE $${countParams.length + 1} OR u.last_name ILIKE $${countParams.length + 1} OR e.employee_id ILIKE $${countParams.length + 1})`;
        countParams.push(`%${options.search}%`);
      }

      const countResult = await pool.query(countQuery, countParams);
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
      const employeeResult = await pool.query(employeeCountQuery, [department.id]);

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
      const attendanceResult = await pool.query(attendanceQuery, [department.id, periodStart]);

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
    
    const result = await pool.query(query, [userId]);
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
    
    const result = await pool.query(query, [departmentId]);
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
  private async getRecentActivity(_departmentId: string): Promise<Array<{
    type: 'time_correction' | 'overtime' | 'leave';
    employeeName: string;
    date: string;
    status: string;
  }>> {
    // Implementation would query recent requests and format them
    return [];
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
    
    const result = await pool.query(query, [departmentId, today]);
    const row = result.rows[0];
    
    return {
      presentToday: parseInt(row.present) || 0,
      absentToday: parseInt(row.absent) || 0,
      lateToday: parseInt(row.late) || 0
    };
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