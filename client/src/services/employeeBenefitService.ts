import { apiMethods } from '../lib/api';
import type { 
  EmployeeBenefit, 
  CreateEmployeeBenefitRequest, 
  UpdateEmployeeBenefitRequest 
} from '../types';

export interface EmployeeBenefitsResponse {
  records: EmployeeBenefit[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class EmployeeBenefitService {
  /**
   * Get all employee benefits
   */
  static async getEmployeeBenefits(params?: {
    page?: number;
    limit?: number;
    employeeId?: string;
    benefitTypeId?: string;
    isActive?: boolean;
    search?: string;
  }): Promise<EmployeeBenefitsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.employeeId) queryParams.append('employee_id', params.employeeId);
    if (params?.benefitTypeId) queryParams.append('benefit_type_id', params.benefitTypeId);
    if (params?.isActive !== undefined) queryParams.append('is_active', params.isActive.toString());
    if (params?.search) queryParams.append('search', params.search);

    const response = await apiMethods.get<{
      records: any[];
      total: number;
      page?: number;
      limit?: number;
      totalPages?: number;
    }>(`/payroll/employee-benefits?${queryParams.toString()}`);

    // Transform snake_case to camelCase and extract employee info
    const transformedData = {
      records: (response.data?.records || []).map((record: any) => ({
        ...record,
        employeeId: record.employee_id,
        benefitTypeId: record.benefit_type_id,
        benefitTypeName: record.benefit_type?.name || record.benefit_type_name,
        employeeName: record.employee?.user ?
          `${record.employee.user.first_name} ${record.employee.user.last_name}` :
          'Unknown Employee',
        employeeCode: record.employee?.employee_id,
        isActive: record.is_active,
        createdAt: record.created_at,
        updatedAt: record.updated_at
      })),
      total: response.data?.total || 0,
      page: response.data?.page || parseInt(queryParams.get('page') || '1'),
      limit: response.data?.limit || parseInt(queryParams.get('limit') || '10'),
      totalPages: response.data?.totalPages || Math.ceil((response.data?.total || 0) / parseInt(queryParams.get('limit') || '10'))
    };

    return transformedData;
  }

  /**
   * Get employee benefit by ID
   */
  static async getEmployeeBenefit(id: string): Promise<EmployeeBenefit> {
    const response = await apiMethods.get<EmployeeBenefit>(`/payroll/employee-benefits/${id}`);
    if (!response.data) {
      throw new Error('Failed to fetch employee benefit');
    }
    return response.data;
  }

  /**
   * Get employee benefits by employee ID
   */
  static async getEmployeeBenefitsByEmployee(employeeId: string): Promise<EmployeeBenefit[]> {
    const response = await apiMethods.get<EmployeeBenefit[]>(`/payroll/employee-benefits/employee/${employeeId}`);
    return response.data || [];
  }

  /**
   * Create a new employee benefit
   */
  static async createEmployeeBenefit(data: CreateEmployeeBenefitRequest): Promise<EmployeeBenefit> {
    // Transform camelCase to snake_case for backend
    const transformedData = {
      employee_id: data.employeeId,
      benefit_type_id: data.benefitTypeId,
      amount: data.amount,
      start_date: data.startDate,
      end_date: data.endDate && data.endDate.trim() !== '' ? data.endDate : null,
      is_active: data.isActive
    };

    const response = await apiMethods.post<EmployeeBenefit>('/payroll/employee-benefits', transformedData);
    if (!response.data) {
      throw new Error('Failed to create employee benefit');
    }
    return response.data;
  }

  /**
   * Update an employee benefit
   */
  static async updateEmployeeBenefit(id: string, data: UpdateEmployeeBenefitRequest): Promise<EmployeeBenefit> {
    // Transform camelCase to snake_case for backend
    const transformedData: any = {};
    if (data.benefitTypeId !== undefined) transformedData.benefit_type_id = data.benefitTypeId;
    if (data.amount !== undefined) transformedData.amount = data.amount;
    if (data.startDate !== undefined) {
      transformedData.start_date = data.startDate && data.startDate.trim() !== '' ? data.startDate : null;
    }
    if (data.endDate !== undefined) {
      transformedData.end_date = data.endDate && data.endDate.trim() !== '' ? data.endDate : null;
    }
    if (data.isActive !== undefined) transformedData.is_active = data.isActive;

    const response = await apiMethods.put<EmployeeBenefit>(`/payroll/employee-benefits/${id}`, transformedData);
    if (!response.data) {
      throw new Error('Failed to update employee benefit');
    }
    return response.data;
  }

  /**
   * Delete an employee benefit
   */
  static async deleteEmployeeBenefit(id: string): Promise<void> {
    await apiMethods.delete(`/payroll/employee-benefits/${id}`);
  }

  /**
   * Get active employee benefits by employee ID
   */
  static async getActiveEmployeeBenefitsByEmployee(employeeId: string): Promise<EmployeeBenefit[]> {
    const response = await apiMethods.get<EmployeeBenefit[]>(`/payroll/employee-benefits/employee/${employeeId}/active`);
    return response.data || [];
  }

  /**
   * Upload employee benefits from CSV
   */
  static async uploadEmployeeBenefits(csvData: any[]): Promise<{ successCount: number; errorCount: number; errors: any[] }> {
    const response = await apiMethods.post<{ successCount: number; errorCount: number; errors: any[] }>('/payroll/employee-benefits/upload', { data: csvData });
    if (!response.data) {
      throw new Error('Failed to upload employee benefits');
    }
    return response.data;
  }
}
