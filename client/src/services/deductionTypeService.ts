import { apiMethods } from '../lib/api';
import type { 
  DeductionType, 
  CreateDeductionTypeRequest, 
  UpdateDeductionTypeRequest 
} from '../types';

export interface DeductionTypesResponse {
  records: DeductionType[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class DeductionTypeService {
  /**
   * Get all deduction types
   */
  static async getDeductionTypes(params?: {
    page?: number;
    limit?: number;
    isActive?: boolean;
    search?: string;
  }): Promise<DeductionTypesResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.isActive !== undefined) queryParams.append('is_active', params.isActive.toString());
    if (params?.search) queryParams.append('search', params.search);

    const response = await apiMethods.get<{ data: any[]; pagination: any }>(
      `/payroll/deduction-types?${queryParams.toString()}`
    );

    // Transform snake_case to camelCase
    const transformedData = {
      records: (response.data || []).map((record: any) => ({
        ...record,
        fixedAmount: record.fixed_amount,
        isActive: record.is_active,
        createdAt: record.created_at,
        updatedAt: record.updated_at
      })),
      total: response.pagination?.total || 0,
      page: response.pagination?.page || 1,
      limit: response.pagination?.limit || 10,
      totalPages: response.pagination?.pages || 1
    };

    return transformedData;
  }

  /**
   * Get deduction type by ID
   */
  static async getDeductionType(id: string): Promise<DeductionType> {
    const response = await apiMethods.get<{ data: any }>(`/payroll/deduction-types/${id}`);
    
    // Transform snake_case to camelCase
    const transformedRecord = {
      ...response.data,
      fixedAmount: response.data.fixed_amount,
      isActive: response.data.is_active,
      createdAt: response.data.created_at,
      updatedAt: response.data.updated_at
    };
    
    return transformedRecord;
  }

  /**
   * Create a new deduction type
   */
  static async createDeductionType(data: CreateDeductionTypeRequest): Promise<DeductionType> {
    // Transform camelCase to snake_case for API
    const apiData = {
      name: data.name,
      description: data.description,
      percentage: data.percentage,
      fixed_amount: data.fixedAmount,
      is_active: data.isActive
    };
    
    const response = await apiMethods.post<{ data: any }>('/payroll/deduction-types', apiData);
    
    // Transform snake_case to camelCase
    const transformedRecord = {
      ...response.data,
      fixedAmount: response.data.fixed_amount,
      isActive: response.data.is_active,
      createdAt: response.data.created_at,
      updatedAt: response.data.updated_at
    };
    
    return transformedRecord;
  }

  /**
   * Update a deduction type
   */
  static async updateDeductionType(id: string, data: UpdateDeductionTypeRequest): Promise<DeductionType> {
    // Transform camelCase to snake_case for API
    const apiData = {
      name: data.name,
      description: data.description,
      percentage: data.percentage,
      fixed_amount: data.fixedAmount,
      is_active: data.isActive
    };
    
    const response = await apiMethods.put<{ data: any }>(`/payroll/deduction-types/${id}`, apiData);
    
    // Transform snake_case to camelCase
    const transformedRecord = {
      ...response.data,
      fixedAmount: response.data.fixed_amount,
      isActive: response.data.is_active,
      createdAt: response.data.created_at,
      updatedAt: response.data.updated_at
    };
    
    return transformedRecord;
  }

  /**
   * Delete a deduction type
   */
  static async deleteDeductionType(id: string): Promise<void> {
    await apiMethods.delete(`/payroll/deduction-types/${id}`);
  }

  /**
   * Get active deduction types
   */
  static async getActiveDeductionTypes(): Promise<DeductionType[]> {
    const response = await apiMethods.get<{ data: any[] }>('/payroll/deduction-types/active');
    
    // Transform snake_case to camelCase
    const transformedRecords = response.data.map((record: any) => ({
      ...record,
      fixedAmount: record.fixed_amount,
      isActive: record.is_active,
      createdAt: record.created_at,
      updatedAt: record.updated_at
    }));
    
    return transformedRecords;
  }
}
