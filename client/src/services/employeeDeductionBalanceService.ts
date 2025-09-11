import { apiMethods } from '../lib/api';
import type { 
  EmployeeDeductionBalance, 
  CreateEmployeeDeductionBalanceRequest, 
  UpdateEmployeeDeductionBalanceRequest,
  EmployeeDeductionBalanceCSVRow,
  CSVUploadResponse
} from '../types';

export interface EmployeeDeductionBalancesResponse {
  records: EmployeeDeductionBalance[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class EmployeeDeductionBalanceService {
  /**
   * Get all employee deduction balances
   */
  static async getEmployeeDeductionBalances(params?: {
    page?: number;
    limit?: number;
    employeeId?: string;
    deductionTypeId?: string;
    isActive?: boolean;
    search?: string;
  }): Promise<EmployeeDeductionBalancesResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.employeeId) queryParams.append('employee_id', params.employeeId);
    if (params?.deductionTypeId) queryParams.append('deduction_type_id', params.deductionTypeId);
    if (params?.isActive !== undefined) queryParams.append('is_active', params.isActive.toString());
    if (params?.search) queryParams.append('search', params.search);

    const response = await apiMethods.get<{ data: { records: any[]; total: number } }>(
      `/payroll/employee-deduction-balances?${queryParams.toString()}`
    );

    // Transform snake_case to camelCase
    const transformedData = {
      records: (response.data?.records || []).map((record: any) => {
        console.log('Raw record from backend:', record);
        return {
          ...record,
          employeeId: record.employee_id, // This should be the internal UUID
          employeeNumber: record.employee_number, // This is the employee number like EMP-2025-0000002
          firstName: record.first_name, // Employee first name from backend
          lastName: record.last_name, // Employee last name from backend
          deductionTypeId: record.deduction_type_id,
          remainingBalance: record.remaining_balance,
          isActive: record.is_active,
          createdAt: record.created_at,
          updatedAt: record.updated_at
        };
      }),
      total: response.data?.total || 0,
      page: parseInt(queryParams.get('page') || '1'),
      limit: parseInt(queryParams.get('limit') || '10'),
      totalPages: Math.ceil((response.data?.total || 0) / parseInt(queryParams.get('limit') || '10'))
    };

    return transformedData;
  }

  /**
   * Get employee deduction balance by ID
   */
  static async getEmployeeDeductionBalance(id: string): Promise<EmployeeDeductionBalance> {
    const response = await apiMethods.get<{ data: EmployeeDeductionBalance }>(`/payroll/employee-deduction-balances/${id}`);
    return response.data;
  }

  /**
   * Get employee deduction balances by employee ID
   */
  static async getEmployeeDeductionBalancesByEmployee(employeeId: string): Promise<EmployeeDeductionBalance[]> {
    const response = await apiMethods.get<{ data: EmployeeDeductionBalance[] }>(`/payroll/employee-deduction-balances/employee/${employeeId}`);
    return response.data;
  }

  /**
   * Create a new employee deduction balance
   */
  static async createEmployeeDeductionBalance(data: CreateEmployeeDeductionBalanceRequest): Promise<EmployeeDeductionBalance> {
    // Transform camelCase to snake_case for backend
    const transformedData = {
      employee_id: data.employeeId,
      deduction_type_id: data.deductionTypeId,
      original_amount: data.originalAmount,
      remaining_balance: data.remainingBalance,
      monthly_deduction_amount: data.monthlyDeductionAmount,
      start_date: data.startDate,
      end_date: data.endDate && data.endDate.trim() !== '' ? data.endDate : null,
      is_active: data.isActive
    };
    
    const response = await apiMethods.post<{ data: EmployeeDeductionBalance }>('/payroll/employee-deduction-balances', transformedData);
    return response.data;
  }

  /**
   * Update an employee deduction balance
   */
  static async updateEmployeeDeductionBalance(id: string, data: UpdateEmployeeDeductionBalanceRequest): Promise<EmployeeDeductionBalance> {
    // Transform camelCase to snake_case for backend
    const transformedData: any = {};
    if (data.originalAmount !== undefined) transformedData.original_amount = data.originalAmount;
    if (data.remainingBalance !== undefined) transformedData.remaining_balance = data.remainingBalance;
    if (data.monthlyDeductionAmount !== undefined) transformedData.monthly_deduction_amount = data.monthlyDeductionAmount;
    if (data.startDate !== undefined) {
      transformedData.start_date = data.startDate && data.startDate.trim() !== '' ? data.startDate : null;
    }
    if (data.endDate !== undefined) {
      transformedData.end_date = data.endDate && data.endDate.trim() !== '' ? data.endDate : null;
    }
    if (data.isActive !== undefined) transformedData.is_active = data.isActive;
    
    const response = await apiMethods.put<{ data: EmployeeDeductionBalance }>(`/payroll/employee-deduction-balances/${id}`, transformedData);
    return response.data;
  }

  /**
   * Delete an employee deduction balance
   */
  static async deleteEmployeeDeductionBalance(id: string): Promise<void> {
    await apiMethods.delete(`/payroll/employee-deduction-balances/${id}`);
  }

  /**
   * Upload employee deduction balances from CSV
   */
  static async uploadEmployeeDeductionBalances(csvData: EmployeeDeductionBalanceCSVRow[]): Promise<CSVUploadResponse> {
    const response = await apiMethods.post<{ data: CSVUploadResponse }>('/payroll/employee-deduction-balances/upload', csvData);
    return response.data;
  }

  /**
   * Get active employee deduction balances by employee ID
   */
  static async getActiveEmployeeDeductionBalancesByEmployee(employeeId: string): Promise<EmployeeDeductionBalance[]> {
    const response = await apiMethods.get<{ data: EmployeeDeductionBalance[] }>(`/payroll/employee-deduction-balances/employee/${employeeId}/active`);
    return response.data;
  }
}
