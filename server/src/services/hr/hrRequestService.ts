import { getPool } from '../../config/database';
import logger from '../../utils/logger';

export interface UnifiedRequest {
  id: string;
  type: 'time_correction' | 'overtime' | 'leave';
  employeeId: string;
  employeeName: string;
  departmentName: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  approverName?: string;
  approvedAt?: string;
  details: any;
  requestTable: string; // Track which table this came from
}

export interface RequestListParams {
  type?: string;
  status?: 'pending' | 'approved' | 'rejected';
  departmentId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface RequestStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  byType: Array<{
    type: string;
    count: number;
  }>;
}

export class HrRequestService {
  /**
   * Get all requests from all tables (time corrections, overtime, leaves)
   */
  async getAllRequests(params: RequestListParams = {}): Promise<{
    requests: UnifiedRequest[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const {
        type,
        status,
        departmentId,
        search,
        page = 1,
        limit = 50
      } = params;

      const offset = (page - 1) * limit;
      
      // Build WHERE conditions
      const whereConditions: string[] = [];
      const queryParams: any[] = [];
      let paramIndex = 1;

      if (type) {
        whereConditions.push(`ar.type = $${paramIndex}`);
        queryParams.push(type);
        paramIndex++;
      }

      if (status) {
        whereConditions.push(`ar.status = $${paramIndex}`);
        queryParams.push(status);
        paramIndex++;
      }

      if (departmentId) {
        whereConditions.push(`d.id = $${paramIndex}`);
        queryParams.push(departmentId);
        paramIndex++;
      }

      if (search) {
        whereConditions.push(`(u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex} OR e.employee_id ILIKE $${paramIndex})`);
        queryParams.push(`%${search}%`);
        paramIndex++;
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Union query to get all requests from all tables
      const unionQuery = `
        WITH all_requests AS (
          -- Time Correction Requests
          SELECT 
            tc.id,
            'time_correction' as type,
            tc.employee_id as employee_id,
            CONCAT(u.first_name, ' ', u.last_name) as employee_name,
            d.name as department_name,
            tc.status::text as status,
            tc.created_at as submitted_at,
            approver.first_name || ' ' || approver.last_name as approver_name,
            tc.approved_at,
            jsonb_build_object(
              'date', tc.correction_date,
              'requestedClockIn', tc.requested_clock_in,
              'requestedClockOut', tc.requested_clock_out,
              'reason', tc.reason,
              'comments', tc.comments
            ) as details,
            'time_correction_requests' as request_table
          FROM time_correction_requests tc
          JOIN employees e ON tc.employee_id = e.id
          JOIN users u ON e.user_id = u.id
          JOIN departments d ON e.department_id = d.id
          LEFT JOIN users approver ON tc.approver_id = approver.id
          
          UNION ALL
          
          -- Overtime Requests
          SELECT 
            ot.id,
            'overtime' as type,
            ot.employee_id as employee_id,
            CONCAT(u.first_name, ' ', u.last_name) as employee_name,
            d.name as department_name,
            ot.status::text as status,
            ot.created_at as submitted_at,
            approver.first_name || ' ' || approver.last_name as approver_name,
            ot.approved_at,
            jsonb_build_object(
              'date', ot.overtime_date,
              'startTime', ot.start_time,
              'endTime', ot.end_time,
              'hours', ot.requested_hours,
              'reason', ot.reason,
              'comments', ot.comments
            ) as details,
            'overtime_requests' as request_table
          FROM overtime_requests ot
          JOIN employees e ON ot.employee_id = e.id
          JOIN users u ON e.user_id = u.id
          JOIN departments d ON e.department_id = d.id
          LEFT JOIN users approver ON ot.approver_id = approver.id
          
          UNION ALL
          
          -- Leave Requests
          SELECT 
            lr.id,
            'leave' as type,
            lr.employee_id as employee_id,
            CONCAT(u.first_name, ' ', u.last_name) as employee_name,
            d.name as department_name,
            lr.status::text as status,
            lr.created_at as submitted_at,
            approver.first_name || ' ' || approver.last_name as approver_name,
            NULL as approved_at,
            jsonb_build_object(
              'leaveType', lr.leave_type,
              'startDate', lr.start_date,
              'endDate', lr.end_date,
              'totalDays', (lr.end_date - lr.start_date + 1)
            ) as details,
            'leaves' as request_table
          FROM leaves lr
          JOIN employees e ON lr.employee_id = e.id
          JOIN users u ON e.user_id = u.id
          JOIN departments d ON e.department_id = d.id
          LEFT JOIN users approver ON lr.approver_id = approver.id
        )
        SELECT 
          ar.*,
          e.employee_id as employee_display_id
        FROM all_requests ar
        JOIN employees e ON ar.employee_id = e.id
        JOIN users u ON e.user_id = u.id
        JOIN departments d ON e.department_id = d.id
        ${whereClause}
        ORDER BY ar.submitted_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      queryParams.push(limit, offset);

      // Count query
      const countQuery = `
        WITH all_requests AS (
          -- Time Correction Requests
          SELECT 
            tc.id,
            'time_correction' as type,
            tc.employee_id as employee_id,
            CONCAT(u.first_name, ' ', u.last_name) as employee_name,
            d.name as department_name,
            tc.status::text as status,
            tc.created_at as submitted_at,
            'time_correction_requests' as request_table
          FROM time_correction_requests tc
          JOIN employees e ON tc.employee_id = e.id
          JOIN users u ON e.user_id = u.id
          JOIN departments d ON e.department_id = d.id
          
          UNION ALL
          
          -- Overtime Requests
          SELECT 
            ot.id,
            'overtime' as type,
            ot.employee_id as employee_id,
            CONCAT(u.first_name, ' ', u.last_name) as employee_name,
            d.name as department_name,
            ot.status::text as status,
            ot.created_at as submitted_at,
            'overtime_requests' as request_table
          FROM overtime_requests ot
          JOIN employees e ON ot.employee_id = e.id
          JOIN users u ON e.user_id = u.id
          JOIN departments d ON e.department_id = d.id
          
          UNION ALL
          
          -- Leave Requests
          SELECT 
            lr.id,
            'leave' as type,
            lr.employee_id as employee_id,
            CONCAT(u.first_name, ' ', u.last_name) as employee_name,
            d.name as department_name,
            lr.status::text as status,
            lr.created_at as submitted_at,
            'leaves' as request_table
          FROM leaves lr
          JOIN employees e ON lr.employee_id = e.id
          JOIN users u ON e.user_id = u.id
          JOIN departments d ON e.department_id = d.id
        )
        SELECT COUNT(*) as total
        FROM all_requests ar
        JOIN employees e ON ar.employee_id = e.id
        JOIN users u ON e.user_id = u.id
        JOIN departments d ON e.department_id = d.id
        ${whereClause}
      `;

      const [requestsResult, countResult] = await Promise.all([
        getPool().query(unionQuery, queryParams),
        getPool().query(countQuery, queryParams.slice(0, -2)) // Remove limit and offset for count
      ]);

      const requests = requestsResult.rows.map(row => ({
        id: row.id,
        type: row.type,
        employeeId: row.employee_display_id,
        employeeName: row.employee_name,
        departmentName: row.department_name,
        status: row.status,
        submittedAt: row.submitted_at,
        approverName: row.approver_name,
        approvedAt: row.approved_at,
        details: row.details,
        requestTable: row.request_table
      }));

      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);

      logger.info('Retrieved HR requests', {
        total,
        returned: requests.length,
        page,
        limit,
        filters: { type, status, departmentId, search }
      });

      return {
        requests,
        total,
        page,
        limit,
        totalPages
      };
    } catch (error) {
      logger.error('Error getting all HR requests', { 
        error: (error as Error).message,
        params
      });
      throw error;
    }
  }

  /**
   * Get request statistics
   */
  async getRequestStats(): Promise<RequestStats> {
    try {
      const statsQuery = `
        WITH all_requests AS (
          SELECT 'time_correction' as type, status::text as status FROM time_correction_requests
          UNION ALL
          SELECT 'overtime' as type, status::text as status FROM overtime_requests
          UNION ALL
          SELECT 'leave' as type, status::text as status FROM leaves
        )
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
          COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected
        FROM all_requests
      `;

      const byTypeQuery = `
        WITH all_requests AS (
          SELECT 'time_correction' as type FROM time_correction_requests
          UNION ALL
          SELECT 'overtime' as type FROM overtime_requests
          UNION ALL
          SELECT 'leave' as type FROM leaves
        )
        SELECT 
          type,
          COUNT(*) as count
        FROM all_requests
        GROUP BY type
        ORDER BY count DESC
      `;

      const [statsResult, byTypeResult] = await Promise.all([
        getPool().query(statsQuery),
        getPool().query(byTypeQuery)
      ]);

      const stats = statsResult.rows[0];
      const byType = byTypeResult.rows.map(row => ({
        type: row.type,
        count: parseInt(row.count)
      }));

      return {
        total: parseInt(stats.total),
        pending: parseInt(stats.pending),
        approved: parseInt(stats.approved),
        rejected: parseInt(stats.rejected),
        byType
      };
    } catch (error) {
      logger.error('Error getting request stats', { 
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Get request by ID from any table
   */
  async getRequestById(id: string): Promise<UnifiedRequest | null> {
    try {
      // Try to find the request in any of the tables
      const queries = [
        // Time correction
        {
          table: 'time_correction_requests',
          type: 'time_correction',
          query: `
            SELECT 
              tc.id,
              'time_correction' as type,
              tc.employee_id as employee_id,
              CONCAT(u.first_name, ' ', u.last_name) as employee_name,
              d.name as department_name,
              tc.status::text as status,
              tc.created_at as submitted_at,
              approver.first_name || ' ' || approver.last_name as approver_name,
              tc.approved_at,
              jsonb_build_object(
                'date', tc.correction_date,
                'originalClockIn', tc.original_clock_in,
                'originalClockOut', tc.original_clock_out,
                'correctedClockIn', tc.corrected_clock_in,
                'correctedClockOut', tc.corrected_clock_out,
                'reason', tc.reason,
                'justification', tc.justification
              ) as details,
              'time_correction_requests' as request_table,
              e.employee_id as employee_display_id
            FROM time_correction_requests tc
            JOIN employees e ON tc.employee_id = e.id
            JOIN users u ON e.user_id = u.id
            JOIN departments d ON e.department_id = d.id
            LEFT JOIN users approver ON tc.approver_id = approver.id
            WHERE tc.id = $1
          `
        },
        // Overtime
        {
          table: 'overtime_requests',
          type: 'overtime',
          query: `
            SELECT 
              ot.id,
              'overtime' as type,
              ot.employee_id as employee_id,
              CONCAT(u.first_name, ' ', u.last_name) as employee_name,
              d.name as department_name,
              ot.status::text as status,
              ot.created_at as submitted_at,
              approver.first_name || ' ' || approver.last_name as approver_name,
              ot.approved_at,
              jsonb_build_object(
                'date', ot.overtime_date,
                'startTime', ot.start_time,
                'endTime', ot.end_time,
                'hours', ot.hours,
                'reason', ot.reason,
                'justification', ot.justification
              ) as details,
              'overtime_requests' as request_table,
              e.employee_id as employee_display_id
            FROM overtime_requests ot
            JOIN employees e ON ot.employee_id = e.id
            JOIN users u ON e.user_id = u.id
            JOIN departments d ON e.department_id = d.id
            LEFT JOIN users approver ON ot.approver_id = approver.id
            WHERE ot.id = $1
          `
        },
        // Leave
        {
          table: 'leaves',
          type: 'leave',
          query: `
            SELECT 
              lr.id,
              'leave' as type,
              lr.employee_id as employee_id,
              CONCAT(u.first_name, ' ', u.last_name) as employee_name,
              d.name as department_name,
              lr.status::text as status,
              lr.created_at as submitted_at,
              approver.first_name || ' ' || approver.last_name as approver_name,
              NULL as approved_at,
              jsonb_build_object(
                'leaveType', lr.leave_type,
                'startDate', lr.start_date,
                'endDate', lr.end_date,
                'days', lr.days,
                'reason', lr.reason,
                'justification', lr.justification
              ) as details,
              'leaves' as request_table,
              e.employee_id as employee_display_id
            FROM leaves lr
            JOIN employees e ON lr.employee_id = e.id
            JOIN users u ON e.user_id = u.id
            JOIN departments d ON e.department_id = d.id
            LEFT JOIN users approver ON lr.approver_id = approver.id
            WHERE lr.id = $1
          `
        }
      ];

      for (const { query } of queries) {
        const result = await getPool().query(query, [id]);
        if (result.rows.length > 0) {
          const row = result.rows[0];
          return {
            id: row.id,
            type: row.type,
            employeeId: row.employee_display_id,
            employeeName: row.employee_name,
            departmentName: row.department_name,
            status: row.status,
            submittedAt: row.submitted_at,
            approverName: row.approver_name,
            approvedAt: row.approved_at,
            details: row.details,
            requestTable: row.request_table
          };
        }
      }

      return null;
    } catch (error) {
      logger.error('Error getting request by ID', { 
        error: (error as Error).message,
        id
      });
      throw error;
    }
  }
}

export const hrRequestService = new HrRequestService();
