// Employee Service for TITO HR Management System

import { apiMethods } from '../lib/api';
import type { Employee } from '../types';

export interface CreateEmployeeRequest {
  email: string;
  firstName: string;
  lastName: string;
  departmentId: string;
  position: string;
  employmentType: 'regular' | 'contractual' | 'jo';
  hireDate: string; // YYYY-MM-DD format
  baseSalary: number;
}

export interface UpdateEmployeeRequest {
  departmentId?: string;
  position?: string;
  employmentType?: 'regular' | 'contractual' | 'jo';
  hireDate?: string; // YYYY-MM-DD format
  baseSalary?: number;
  status?: 'active' | 'inactive' | 'terminated' | 'on_leave';
}

export interface EmployeeListParams {
  page?: number;
  limit?: number;
  status?: 'active' | 'inactive' | 'terminated' | 'on_leave';
  departmentId?: string;
  search?: string;
}

export class EmployeeService {
  // Get all employees with pagination and filters
  static async getEmployees(params?: EmployeeListParams): Promise<{
    employees: Employee[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.departmentId) queryParams.append('departmentId', params.departmentId);
    if (params?.search) queryParams.append('search', params.search);

    const response = await apiMethods.get<{
      data: Employee[];
      pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>(`/hr/employees?${queryParams.toString()}`);
    
    return {
      employees: response.data,
      total: response.pagination.total,
      page: response.pagination.page,
      limit: response.pagination.limit,
      totalPages: response.pagination.totalPages,
    };
  }

  // Get employee by ID
  static async getEmployee(id: string): Promise<Employee> {
    const response = await apiMethods.get<{ data: Employee }>(`/hr/employees/${id}`);
    return response.data;
  }

  // Create new employee
  static async createEmployee(data: CreateEmployeeRequest): Promise<Employee> {
    const response = await apiMethods.post<{ data: Employee }>('/hr/employees', data);
    return response.data;
  }

  // Update employee
  static async updateEmployee(id: string, data: UpdateEmployeeRequest): Promise<Employee> {
    const response = await apiMethods.put<{ data: Employee }>(`/hr/employees/${id}`, data);
    return response.data;
  }

  // Delete employee (soft delete)
  static async deleteEmployee(id: string): Promise<void> {
    await apiMethods.delete(`/hr/employees/${id}`);
  }

  // Hard delete employee (permanently remove from database)
  static async hardDeleteEmployee(id: string): Promise<void> {
    await apiMethods.delete(`/hr/employees/${id}/hard-delete`);
  }

  // Get employee statistics
  static async getEmployeeStats(): Promise<{
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
  }> {
    const response = await apiMethods.get<{
      data: {
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
      };
    }>('/hr/employees/stats');
    return response.data;
  }

  // Get employees by department
  static async getEmployeesByDepartment(departmentId: string): Promise<Employee[]> {
    const response = await apiMethods.get<{ data: Employee[] }>(`/hr/employees/department/${departmentId}`);
    return response.data;
  }

  // Note: Employee creation creates a new user account automatically
  // No need for available users endpoint since we create new users
}

export default EmployeeService;