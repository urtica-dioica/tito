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
    const response = await apiMethods.get('/hr/employees', { params });
    console.log('HR Employee Service Response:', response);
    console.log('Response data:', (response as any).data);
    console.log('Response pagination:', (response as any).data?.pagination);
    
    return {
      employees: (response as any).data || [],
      total: (response as any).data?.pagination?.total || 0,
      page: (response as any).data?.pagination?.page || 1,
      limit: (response as any).data?.pagination?.limit || 10,
      totalPages: (response as any).data?.pagination?.totalPages || 0
    };
  }

  /**
   * Get employee by ID
   */
  static async getEmployee(id: string): Promise<HREmployee> {
    const response = await apiMethods.get(`/hr/employees/${id}`);
    return (response as any).data.data;
  }

  /**
   * Get employee statistics
   */
  static async getEmployeeStats(): Promise<HREmployeeStats> {
    try {
      const response = await apiMethods.get<any>('/hr/employees/stats');
      console.log('HR Employee Stats Response:', response);
      
      // apiMethods.get returns the entire server response
      // The actual stats object is in response.data directly
      if (!response || !response.data) {
        console.error('Employee stats data is undefined:', response);
        throw new Error('Employee stats data is undefined');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error in getEmployeeStats:', error);
      throw error;
    }
  }

  /**
   * Get employees by department
   */
  static async getEmployeesByDepartment(departmentId: string): Promise<HREmployee[]> {
    const response = await apiMethods.get(`/hr/employees/department/${departmentId}`);
    return (response as any).data.data;
  }

  /**
   * Create new employee
   */
  static async createEmployee(data: CreateHREmployeeRequest): Promise<HREmployee> {
    const response = await apiMethods.post('/hr/employees', data);
    return (response as any).data.data;
  }

  /**
   * Update employee
   */
  static async updateEmployee(id: string, data: UpdateHREmployeeRequest): Promise<HREmployee> {
    const response = await apiMethods.put(`/hr/employees/${id}`, data);
    return (response as any).data.data;
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

    const response = await apiMethods.post('/hr/employees/bulk', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 300000, // 5 minutes timeout for bulk operations
    });
    
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
