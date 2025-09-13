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

    const response = await apiMethods.get<{
      records: any[];
      pagination: { total: number; page: number; limit: number; pages: number };
    }>(`/payroll/deduction-types?${queryParams.toString()}`);

    // Transform snake_case to camelCase
    const transformedData = {
      records: (response.data?.records || []).map((record: any) => ({
        ...record,
        fixedAmount: record.fixed_amount,
        isActive: record.is_active,
        createdAt: record.created_at,
        updatedAt: record.updated_at
      })),
      total: response.data?.pagination?.total || 0,
      page: response.data?.pagination?.page || 1,
      limit: response.data?.pagination?.limit || 10,
      totalPages: response.data?.pagination?.pages || 1
    };

    return transformedData;
  }

  /**
   * Get deduction type by ID
   */
  static async getDeductionType(id: string): Promise<DeductionType> {
    const response = await apiMethods.get<any>(`/payroll/deduction-types/${id}`);

    if (!response.data) {
      throw new Error('Failed to fetch deduction type');
    }

    // Transform snake_case to camelCase
    const transformedRecord = {
      ...response.data,
      fixedAmount: response.data.fixed_amount,
      isActive: response.data.is_active,
      createdAt: response.data.created_at,
      updatedAt: response.data.updated_at
    };

    return transformedRecord as DeductionType;
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

    const response = await apiMethods.post<any>('/payroll/deduction-types', apiData);

    if (!response.data) {
      throw new Error('Failed to create deduction type');
    }

    // Transform snake_case to camelCase
    const transformedRecord = {
      ...response.data,
      fixedAmount: response.data.fixed_amount,
      isActive: response.data.is_active,
      createdAt: response.data.created_at,
      updatedAt: response.data.updated_at
    };

    return transformedRecord as DeductionType;
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

    const response = await apiMethods.put<any>(`/payroll/deduction-types/${id}`, apiData);

    if (!response.data) {
      throw new Error('Failed to update deduction type');
    }

    // Transform snake_case to camelCase
    const transformedRecord = {
      ...response.data,
      fixedAmount: response.data.fixed_amount,
      isActive: response.data.is_active,
      createdAt: response.data.created_at,
      updatedAt: response.data.updated_at
    };

    return transformedRecord as DeductionType;
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
    const response = await apiMethods.get<any[]>('/payroll/deduction-types/active');

    // Transform snake_case to camelCase
    const transformedRecords = (response.data || []).map((record: any) => ({
      ...record,
      fixedAmount: record.fixed_amount,
      isActive: record.is_active,
      createdAt: record.created_at,
      updatedAt: record.updated_at
    }));

    return transformedRecords as DeductionType[];
  }
}
