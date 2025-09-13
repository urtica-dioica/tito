import { apiMethods } from '../lib/api';

export interface HREmployee {
  id: string;
  userId: string;
  employeeId: string;
  email: string;
  firstName: string;
  lastName: string;
  departmentId: string;
  departmentName: string;
  position: string;
  employmentType: 'regular' | 'contractual' | 'jo';
  hireDate: string;
  baseSalary: number;
  status: 'active' | 'inactive' | 'terminated';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HREmployeeStats {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  terminatedEmployees: number;
  onLeaveEmployees: number;
  averageSalary: number;
  employeesByDepartment: Array<{
    departmentId: string;
    departmentName: string;
    count: number;
  }>;
}

export interface HREmployeeListParams {
  page?: number;
  limit?: number;
  search?: string;
  departmentId?: string;
  status?: string;
  employmentType?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateHREmployeeRequest {
  email: string;
  firstName: string;
  lastName: string;
  departmentId: string;
  position: string;
  employmentType: 'regular' | 'contractual' | 'jo';
  hireDate: string;
  baseSalary: number;
}

export interface UpdateHREmployeeRequest {
  departmentId?: string;
  position?: string;
  employmentType?: 'regular' | 'contractual' | 'jo';
  hireDate?: string;
  baseSalary?: number;
  status?: 'active' | 'inactive' | 'terminated' | 'on_leave';
}

export class HREmployeeService {
  /**
   * Get all employees with filtering and pagination
   */
  static async getEmployees(params?: HREmployeeListParams): Promise<{
    employees: HREmployee[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const response = await apiMethods.get<{
      data: HREmployee[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>('/hr/employees', { params: params as any });

    // Server returns employees directly in data, not data.data
    return {
      employees: response.data || [],
      total: response.pagination?.total || 0,
      page: response.pagination?.page || 1,
      limit: response.pagination?.limit || 10,
      totalPages: response.pagination?.totalPages || 0
    };
  }

  /**
   * Get employee by ID
   */
  static async getEmployee(id: string): Promise<HREmployee> {
    const response = await apiMethods.get<HREmployee>(`/hr/employees/${id}`);
    if (!response.data) {
      throw new Error('Failed to fetch employee');
    }
    return response.data;
  }

  /**
   * Get employee statistics
   */
  static async getEmployeeStats(): Promise<HREmployeeStats> {
    const response = await apiMethods.get<HREmployeeStats>('/hr/employees/stats');
    if (!response.data) {
      throw new Error('Failed to fetch employee stats');
    }
    return response.data;
  }

  /**
   * Get employees by department
   */
  static async getEmployeesByDepartment(departmentId: string): Promise<HREmployee[]> {
    const response = await apiMethods.get<HREmployee[]>(`/hr/employees/department/${departmentId}`);
    return response.data || [];
  }

  /**
   * Create new employee
   */
  static async createEmployee(data: CreateHREmployeeRequest): Promise<HREmployee> {
    const response = await apiMethods.post<HREmployee>('/hr/employees', data as any);
    if (!response.data) {
      throw new Error('Failed to create employee');
    }
    return response.data;
  }

  /**
   * Update employee
   */
  static async updateEmployee(id: string, data: UpdateHREmployeeRequest): Promise<HREmployee> {
    const response = await apiMethods.put<HREmployee>(`/hr/employees/${id}`, data as any);
    if (!response.data) {
      throw new Error('Failed to update employee');
    }
    return response.data;
  }

  /**
   * Soft delete employee (set status to inactive)
   */
  static async deleteEmployee(id: string): Promise<void> {
    await apiMethods.delete(`/hr/employees/${id}`);
  }

  /**
   * Hard delete employee (permanently remove from database)
   */
  static async hardDeleteEmployee(id: string): Promise<void> {
    await apiMethods.delete(`/hr/employees/${id}/hard-delete`);
  }

  /**
   * Create multiple employees from CSV file
   */
  static async createBulkEmployees(csvFile: File): Promise<{
    success: boolean;
    message: string;
    data: {
      totalProcessed: number;
      successCount: number;
      errorCount: number;
      successfulEmployees: HREmployee[];
      errors: Array<{ row: number; data: any; error: string }>;
    };
  }> {
    const formData = new FormData();
    formData.append('csvFile', csvFile);

    const response = await apiMethods.post('/hr/employees/bulk', formData as any, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 300000, // 5 minutes timeout for bulk operations
    });

    if (!response) {
      throw new Error('Failed to upload employees');
    }

    return response as {
      success: boolean;
      message: string;
      data: {
        totalProcessed: number;
        successCount: number;
        errorCount: number;
        successfulEmployees: HREmployee[];
        errors: Array<{ row: number; data: any; error: string }>;
      };
    };
  }
}
