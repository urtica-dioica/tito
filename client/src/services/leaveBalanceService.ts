import { apiMethods } from '../lib/api';

export interface LeaveBalance {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  departmentName: string | null;
  leaveType: 'vacation' | 'sick' | 'maternity' | 'other';
  balance: number;
  updatedAt: string;
}

export interface CreateLeaveBalanceData {
  employeeId: string;
  leaveType: 'vacation' | 'sick' | 'maternity' | 'other';
  balance: number;
}

export interface UpdateLeaveBalanceData {
  balance?: number;
}

export interface BulkLeaveBalanceData {
  employeeId: string;
  leaveType: 'vacation' | 'sick' | 'maternity' | 'other';
  balance: number;
}

export interface LeaveBalanceListParams {
  page?: number;
  limit?: number;
  employeeId?: string;
  departmentId?: string;
  leaveType?: 'vacation' | 'sick' | 'maternity' | 'other';
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface LeaveBalanceListResponse {
  balances: LeaveBalance[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LeaveBalanceStats {
  totalEmployees: number;
  totalLeaveDays: number;
  usedLeaveDays: number;
  availableLeaveDays: number;
  byLeaveType: {
    vacation: { total: number; used: number; available: number };
    sick: { total: number; used: number; available: number };
    maternity: { total: number; used: number; available: number };
    other: { total: number; used: number; available: number };
  };
}

export interface InitializationData {
  vacationDays?: number;
  sickDays?: number;
  maternityDays?: number;
  otherDays?: number;
}

export interface YearInitializationResult {
  employeesProcessed: number;
  balancesCreated: number;
  errors: string[];
}

export interface EmployeeWithoutBalance {
  id: string;
  employeeId: string;
  name: string;
  departmentName: string | null;
  position: string;
}

export interface LeaveBalanceTemplate {
  position: string;
  vacationDays: number;
  sickDays: number;
  maternityDays: number;
  otherDays: number;
  employeeCount: number;
}

export class LeaveBalanceService {
  /**
   * List leave balances with filtering and pagination
   */
  static async listLeaveBalances(params: LeaveBalanceListParams = {}): Promise<LeaveBalanceListResponse> {
    const response = await apiMethods.get<{
      success: boolean;
      data: LeaveBalanceListResponse;
    }>('/hr/leave-balances', { params });
    return response.data;
  }

  /**
   * Get leave balance by ID
   */
  static async getLeaveBalance(id: string): Promise<LeaveBalance> {
    const response = await apiMethods.get<{
      success: boolean;
      data: LeaveBalance;
    }>(`/hr/leave-balances/${id}`);
    return response.data;
  }

  /**
   * Create or update leave balance
   */
  static async createLeaveBalance(data: CreateLeaveBalanceData): Promise<LeaveBalance> {
    const response = await apiMethods.post<{
      success: boolean;
      data: LeaveBalance;
    }>('/hr/leave-balances', data);
    return response.data;
  }

  /**
   * Update leave balance
   */
  static async updateLeaveBalance(id: string, data: UpdateLeaveBalanceData): Promise<LeaveBalance> {
    const response = await apiMethods.put<{
      success: boolean;
      data: LeaveBalance;
    }>(`/hr/leave-balances/${id}`, data);
    return response.data;
  }

  /**
   * Delete leave balance
   */
  static async deleteLeaveBalance(id: string): Promise<void> {
    await apiMethods.delete(`/hr/leave-balances/${id}`);
  }

  /**
   * Bulk create/update leave balances
   */
  static async bulkUpdateLeaveBalances(balances: BulkLeaveBalanceData[]): Promise<LeaveBalance[]> {
    const response = await apiMethods.post<{
      success: boolean;
      data: LeaveBalance[];
    }>('/hr/leave-balances/bulk', { balances });
    return response.data;
  }

  /**
   * Initialize leave balances for all employees
   */
  static async initializeLeaveBalances(data: InitializationData): Promise<YearInitializationResult> {
    const response = await apiMethods.post<{
      success: boolean;
      data: YearInitializationResult;
    }>('/hr/leave-balances/initialize', data);
    return response.data;
  }

  /**
   * Get leave balance statistics
   */
  static async getLeaveBalanceStats(departmentId?: string): Promise<LeaveBalanceStats> {
    const params: any = {};
    if (departmentId) params.departmentId = departmentId;

    const response = await apiMethods.get<{
      success: boolean;
      data: LeaveBalanceStats;
    }>('/hr/leave-balances/stats', { params });
    return response.data;
  }

  /**
   * Get employee leave balances
   */
  static async getEmployeeLeaveBalances(employeeId: string): Promise<LeaveBalance[]> {
    const response = await apiMethods.get<{
      success: boolean;
      data: LeaveBalance[];
    }>(`/hr/leave-balances/employee/${employeeId}`);
    return response.data;
  }

  /**
   * Get employees without leave balances
   */
  static async getEmployeesWithoutLeaveBalances(departmentId?: string): Promise<EmployeeWithoutBalance[]> {
    const params: any = {};
    if (departmentId) params.departmentId = departmentId;

    const response = await apiMethods.get<{
      success: boolean;
      data: EmployeeWithoutBalance[];
    }>('/hr/leave-balances/employees-without-balances', { params });
    return response.data;
  }

  /**
   * Get leave balance templates by position
   */
  static async getLeaveBalanceTemplates(): Promise<LeaveBalanceTemplate[]> {
    const response = await apiMethods.get<{
      success: boolean;
      data: LeaveBalanceTemplate[];
    }>('/hr/leave-balances/templates');
    return response.data;
  }
}
