import { getPool } from '../../config/database';
import logger from '../../utils/logger';

export interface HRDashboardData {
  overview: {
    totalEmployees: number;
    activeEmployees: number;
    totalDepartments: number;
    totalIdCards: number;
    activeIdCards: number;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    status: string;
  }>;
  pendingRequests: {
    leaves: number;
    timeCorrections: number;
    overtime: number;
    total: number;
  };
  attendanceStats: {
    presentToday: number;
    absentToday: number;
    lateToday: number;
    totalToday: number;
  };
  departmentStats: Array<{
    departmentName: string;
    employeeCount: number;
    presentCount: number;
    absentCount: number;
  }>;
}

export class HRDashboardService {
  /**
   * Get HR dashboard data
   */
  async getDashboardData(): Promise<HRDashboardData> {
    try {
      // Get overview statistics
      const overview = await this.getOverviewStats();
      
      // Get recent activity
      const recentActivity = await this.getRecentActivity();
      
      // Get pending requests
      const pendingRequests = await this.getPendingRequests();
      
      // Get attendance stats
      const attendanceStats = await this.getAttendanceStats();
      
      // Get department stats
      const departmentStats = await this.getDepartmentStats();

      return {
        overview,
        recentActivity,
        pendingRequests,
        attendanceStats,
        departmentStats
      };
    } catch (error) {
      logger.error('Error getting HR dashboard data:', { error });
      throw error;
    }
  }

  /**
   * Get overview statistics
   */
  private async getOverviewStats(): Promise<HRDashboardData['overview']> {
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM employees) as total_employees,
        (SELECT COUNT(*) FROM employees WHERE status = 'active') as active_employees,
        (SELECT COUNT(*) FROM departments) as total_departments,
        (SELECT COUNT(*) FROM id_cards) as total_id_cards,
        (SELECT COUNT(*) FROM id_cards WHERE is_active = true) as active_id_cards
    `;
    
    const result = await getPool().query(query);
    const row = result.rows[0];
    
    return {
      totalEmployees: parseInt(row.total_employees) || 0,
      activeEmployees: parseInt(row.active_employees) || 0,
      totalDepartments: parseInt(row.total_departments) || 0,
      totalIdCards: parseInt(row.total_id_cards) || 0,
      activeIdCards: parseInt(row.active_id_cards) || 0
    };
  }

  /**
   * Get recent activity
   */
  private async getRecentActivity(): Promise<HRDashboardData['recentActivity']> {
    // Get recent leave requests
    const leaveQuery = `
      SELECT 
        l.id,
        'leave_request' as type,
        CONCAT(u.first_name, ' ', u.last_name, ' submitted a leave request') as description,
        l.created_at as timestamp,
        l.status
      FROM leaves l
      JOIN employees e ON l.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      ORDER BY l.created_at DESC
      LIMIT 5
    `;
    
    const leaveResult = await getPool().query(leaveQuery);
    
    // Get recent time correction requests
    const timeCorrectionQuery = `
      SELECT 
        tcr.id,
        'time_correction' as type,
        CONCAT(u.first_name, ' ', u.last_name, ' submitted a time correction request') as description,
        tcr.created_at as timestamp,
        tcr.status
      FROM time_correction_requests tcr
      JOIN employees e ON tcr.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      ORDER BY tcr.created_at DESC
      LIMIT 5
    `;
    
    const timeCorrectionResult = await getPool().query(timeCorrectionQuery);
    
    // Get recent overtime requests
    const overtimeQuery = `
      SELECT 
        ot.id,
        'overtime_request' as type,
        CONCAT(u.first_name, ' ', u.last_name, ' submitted an overtime request') as description,
        ot.created_at as timestamp,
        ot.status
      FROM overtime_requests ot
      JOIN employees e ON ot.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      ORDER BY ot.created_at DESC
      LIMIT 5
    `;
    
    const overtimeResult = await getPool().query(overtimeQuery);
    
    // Combine and sort all activities
    const allActivities = [
      ...leaveResult.rows,
      ...timeCorrectionResult.rows,
      ...overtimeResult.rows
    ];
    
    return allActivities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)
      .map(activity => ({
        id: activity.id,
        type: activity.type,
        description: activity.description,
        timestamp: activity.timestamp,
        status: activity.status
      }));
  }

  /**
   * Get pending requests
   */
  private async getPendingRequests(): Promise<HRDashboardData['pendingRequests']> {
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM leaves WHERE status = 'pending') as pending_leaves,
        (SELECT COUNT(*) FROM time_correction_requests WHERE status = 'pending') as pending_time_corrections,
        (SELECT COUNT(*) FROM overtime_requests WHERE status = 'pending') as pending_overtime
    `;
    
    const result = await getPool().query(query);
    const row = result.rows[0];
    
    const leaves = parseInt(row.pending_leaves) || 0;
    const timeCorrections = parseInt(row.pending_time_corrections) || 0;
    const overtime = parseInt(row.pending_overtime) || 0;
    
    return {
      leaves,
      timeCorrections,
      overtime,
      total: leaves + timeCorrections + overtime
    };
  }

  /**
   * Get attendance stats for today
   */
  private async getAttendanceStats(): Promise<HRDashboardData['attendanceStats']> {
    const today = new Date().toISOString().split('T')[0];
    
    const query = `
      SELECT 
        COUNT(DISTINCT ar.employee_id) as total_today,
        COUNT(DISTINCT CASE WHEN ar.overall_status = 'present' THEN ar.employee_id END) as present_today,
        COUNT(DISTINCT CASE WHEN ar.overall_status = 'absent' THEN ar.employee_id END) as absent_today,
        COUNT(DISTINCT CASE WHEN ar.overall_status = 'late' THEN ar.employee_id END) as late_today
      FROM attendance_records ar
      WHERE DATE(ar.date) = $1
    `;
    
    const result = await getPool().query(query, [today]);
    const row = result.rows[0];
    
    return {
      totalToday: parseInt(row.total_today) || 0,
      presentToday: parseInt(row.present_today) || 0,
      absentToday: parseInt(row.absent_today) || 0,
      lateToday: parseInt(row.late_today) || 0
    };
  }

  /**
   * Get department statistics
   */
  private async getDepartmentStats(): Promise<HRDashboardData['departmentStats']> {
    const today = new Date().toISOString().split('T')[0];
    
    const query = `
      SELECT 
        d.name as department_name,
        COUNT(DISTINCT e.id) as employee_count,
        COUNT(DISTINCT CASE WHEN ar.overall_status = 'present' THEN ar.employee_id END) as present_count,
        COUNT(DISTINCT CASE WHEN ar.overall_status = 'absent' THEN ar.employee_id END) as absent_count
      FROM departments d
      LEFT JOIN employees e ON d.id = e.department_id AND e.status = 'active'
      LEFT JOIN attendance_records ar ON e.id = ar.employee_id AND DATE(ar.date) = $1
      GROUP BY d.id, d.name
      ORDER BY d.name
    `;
    
    const result = await getPool().query(query, [today]);
    
    return result.rows.map(row => ({
      departmentName: row.department_name,
      employeeCount: parseInt(row.employee_count) || 0,
      presentCount: parseInt(row.present_count) || 0,
      absentCount: parseInt(row.absent_count) || 0
    }));
  }
}

export const hrDashboardService = new HRDashboardService();
