import { apiMethods } from '../lib/api';
import type { DepartmentEmployee, Department } from '../types';

export interface DepartmentHeadStats {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  averageSalary: number;
  employeesByPosition: Array<{
    position: string;
    count: number;
  }>;
}

export interface DepartmentHeadEmployeeStats {
  employeeId: string;
  employeeName: string;
  position: string;
  totalDaysWorked: number;
  totalDaysLate: number;
  totalDaysAbsent: number;
  averageClockInTime: string;
  punctualityScore: number; // 0-100
  attendanceRate: number; // 0-100
}

export interface DepartmentHeadRequest {
  id: string;
  type: 'time_correction' | 'overtime' | 'leave';
  employeeId: string;
  employeeName: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  approverName?: string;
  approvedAt?: string;
  details: any;
}

export interface DepartmentHeadRequestStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface DepartmentHeadPayrollPeriod {
  id: string;
  name: string;
  periodName: string;
  startDate: string;
  endDate: string;
  status: 'completed' | 'processing' | 'draft' | 'sent_for_review';
  totalEmployees: number;
  totalAmount: number;
  departmentId: string;
  createdAt: string;
  updatedAt: string;
  approvalId?: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  approvalComments?: string;
  approvedAt?: string;
}

export interface DepartmentHeadPayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  position: string;
  baseSalary: number;
  hourlyRate: number;
  totalWorkedHours: number;
  totalRegularHours: number;
  totalOvertimeHours: number;
  totalLateHours: number;
  lateDeductions: number;
  paidLeaveHours: number;
  grossPay: number;
  netPay: number;
  totalDeductions: number;
  totalBenefits: number;
  status: string;
  periodId: string;
  createdAt: string;
  updatedAt: string;
}

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

export class DepartmentHeadService {
  // Get department head dashboard data
  static async getDashboard(): Promise<DepartmentHeadDashboard> {
    const response = await apiMethods.get<{ data: DepartmentHeadDashboard }>('/department-head/dashboard');
    return response.data;
  }

  // Get department head's department info
  static async getDepartmentInfo(): Promise<Department> {
    const response = await apiMethods.get<{ data: Department }>('/department-head/department');
    return response.data;
  }

  // Get department head's employee statistics
  static async getEmployeeStats(): Promise<DepartmentHeadStats> {
    const response = await apiMethods.get<{ data: any }>('/department-head/employees/stats');
    // Map backend snake_case to frontend camelCase
    return {
      totalEmployees: parseInt(response.data.total_employees) || 0,
      activeEmployees: parseInt(response.data.active_employees) || 0,
      inactiveEmployees: parseInt(response.data.inactive_employees) || 0,
      averageSalary: parseFloat(response.data.average_salary) || 0,
      employeesByPosition: response.data.employees_by_position || []
    };
  }

  // Get department head's employees
  static async getEmployees(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: 'active' | 'inactive' | 'terminated' | 'on_leave';
  }): Promise<{ employees: DepartmentEmployee[]; total: number }> {
    const response = await apiMethods.get<{ data: DepartmentEmployee[]; pagination: { total: number } }>('/department-head/employees', { params });
    return {
      employees: response.data,
      total: response.pagination.total
    };
  }

  // Get employee performance statistics
  static async getEmployeePerformanceStats(): Promise<DepartmentHeadEmployeeStats[]> {
    const response = await apiMethods.get<{ data: DepartmentHeadEmployeeStats[] }>('/department-head/employees/performance');
    return response.data;
  }

  // Get department head's requests
  static async getRequests(params?: {
    page?: number;
    limit?: number;
    type?: 'time_correction' | 'overtime' | 'leave';
    status?: 'pending' | 'approved' | 'rejected';
  }): Promise<{ requests: DepartmentHeadRequest[]; total: number }> {
    const response = await apiMethods.get<{ data: DepartmentHeadRequest[]; pagination: { total: number } }>('/department-head/requests', { params });
    return {
      requests: response.data,
      total: response.pagination.total
    };
  }

  // Get request statistics
  static async getRequestStats(): Promise<DepartmentHeadRequestStats> {
    const response = await apiMethods.get<{ data: DepartmentHeadRequestStats }>('/department-head/requests/stats');
    return response.data;
  }

  // Approve request
  static async approveRequest(requestId: string): Promise<void> {
    await apiMethods.post(`/department-head/requests/${requestId}/approve`);
  }

  // Reject request
  static async rejectRequest(requestId: string, reason?: string): Promise<void> {
    await apiMethods.post(`/department-head/requests/${requestId}/reject`, { reason });
  }

  // Get payroll periods for department
  static async getPayrollPeriods(): Promise<DepartmentHeadPayrollPeriod[]> {
    const response = await apiMethods.get<{ data: DepartmentHeadPayrollPeriod[] }>('/department-head/payrolls/periods');
    return response.data;
  }

  // Get payroll records for a specific period
  static async getPayrollRecords(periodId: string): Promise<DepartmentHeadPayrollRecord[]> {
    const response = await apiMethods.get<{ data: DepartmentHeadPayrollRecord[] }>(`/department-head/payrolls/periods/${periodId}/records`);
    return response.data;
  }

  // Get payroll statistics
  static async getPayrollStats(): Promise<{
    totalEmployees: number;
    totalGrossPay: number;
    completedPeriods: number;
    processingPeriods: number;
  }> {
    const response = await apiMethods.get<{ data: any }>('/department-head/payrolls/stats');
    return response.data;
  }

  // Get payroll approvals
  static async getPayrollApprovals(): Promise<any[]> {
    const response = await apiMethods.get<{ data: any[] }>('/department-head/payrolls/approvals');
    return response.data;
  }

  // Approve payroll approval
  static async approvePayrollApproval(approvalId: string, status: 'approved' | 'rejected', comments?: string): Promise<{ success: boolean; message: string }> {
    const response = await apiMethods.put<{ success: boolean; message: string }>(`/department-head/payrolls/approvals/${approvalId}/approve`, {
      status,
      comments
    });
    return response;
  }

}
