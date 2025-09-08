// Department Service for TITO HR Management System

import { apiMethods } from '../lib/api';
import type { Department } from '../types';

export interface CreateDepartmentRequest {
  name: string;
  description?: string;
  departmentHeadId?: string;
}

export interface UpdateDepartmentRequest {
  name?: string;
  description?: string;
  departmentHeadId?: string;
}

export class DepartmentService {
  // Get all departments
  static async getDepartments(): Promise<Department[]> {
    const response = await apiMethods.get<{ data: Department[] }>('/hr/departments');
    return response.data;
  }

  // Get department by ID
  static async getDepartment(id: string): Promise<Department> {
    const response = await apiMethods.get<{ data: Department }>(`/hr/departments/${id}`);
    return response.data;
  }

  // Create new department
  static async createDepartment(data: CreateDepartmentRequest): Promise<Department> {
    const requestData = {
      name: data.name,
      description: data.description,
      departmentHeadUserId: data.departmentHeadId
    };
    const response = await apiMethods.post<{ data: Department }>('/hr/departments', requestData);
    return response.data;
  }

  // Update department
  static async updateDepartment(id: string, data: UpdateDepartmentRequest): Promise<Department> {
    const requestData = {
      name: data.name,
      description: data.description,
      departmentHeadUserId: data.departmentHeadId
    };
    const response = await apiMethods.put<{ data: Department }>(`/hr/departments/${id}`, requestData);
    return response.data;
  }

  // Delete department (hard delete)
  static async deleteDepartment(id: string): Promise<void> {
    await apiMethods.delete(`/hr/departments/${id}/hard-delete`);
  }

  // Get department statistics
  static async getDepartmentStats(): Promise<{
    totalDepartments: number;
    totalEmployees: number;
    averageEmployeesPerDepartment: number;
  }> {
    const response = await apiMethods.get<{ data: any }>('/hr/departments/stats');
    return response.data;
  }

  // Get departments with employee count
  static async getDepartmentsWithEmployeeCount(): Promise<Department[]> {
    const response = await apiMethods.get<{ data: Department[] }>('/hr/departments/with-employee-count');
    return response.data;
  }
}

export default DepartmentService;
