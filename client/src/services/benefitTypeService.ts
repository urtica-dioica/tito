import { apiMethods } from '../lib/api';
import type { 
  BenefitType, 
  CreateBenefitTypeRequest, 
  UpdateBenefitTypeRequest 
} from '../types';

export interface BenefitTypesResponse {
  records: BenefitType[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class BenefitTypeService {
  /**
   * Get all benefit types
   */
  static async getBenefitTypes(params?: {
    page?: number;
    limit?: number;
    isActive?: boolean;
    search?: string;
  }): Promise<BenefitTypesResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.isActive !== undefined) queryParams.append('is_active', params.isActive.toString());
    if (params?.search) queryParams.append('search', params.search);

    const response = await apiMethods.get<{ data: { records: any[]; total: number } }>(
      `/payroll/benefit-types?${queryParams.toString()}`
    );

    // Transform snake_case to camelCase
    const transformedData = {
      records: (response.data?.records || []).map((record: any) => ({
        ...record,
        amount: record.amount,
        isActive: record.is_active,
        createdAt: record.created_at,
        updatedAt: record.updated_at
      })),
      total: response.data?.total || 0,
      page: parseInt(queryParams.get('page') || '1'),
      limit: parseInt(queryParams.get('limit') || '10'),
      totalPages: Math.ceil((response.data?.total || 0) / parseInt(queryParams.get('limit') || '10'))
    };

    return transformedData;
  }

  /**
   * Get benefit type by ID
   */
  static async getBenefitType(id: string): Promise<BenefitType> {
    const response = await apiMethods.get<{ data: any }>(`/payroll/benefit-types/${id}`);
    
    // Transform snake_case to camelCase
    const transformedRecord = {
      ...response.data,
      amount: response.data.amount,
      isActive: response.data.is_active,
      createdAt: response.data.created_at,
      updatedAt: response.data.updated_at
    };
    
    return transformedRecord;
  }

  /**
   * Create a new benefit type
   */
  static async createBenefitType(data: CreateBenefitTypeRequest): Promise<BenefitType> {
    // Transform camelCase to snake_case for API
    const apiData = {
      name: data.name,
      description: data.description,
      amount: data.amount,
      is_active: data.isActive
    };
    
    const response = await apiMethods.post<{ data: any }>('/payroll/benefit-types', apiData);
    
    // Transform snake_case to camelCase
    const transformedRecord = {
      ...response.data,
      amount: response.data.amount,
      isActive: response.data.is_active,
      createdAt: response.data.created_at,
      updatedAt: response.data.updated_at
    };
    
    return transformedRecord;
  }

  /**
   * Update a benefit type
   */
  static async updateBenefitType(id: string, data: UpdateBenefitTypeRequest): Promise<BenefitType> {
    // Transform camelCase to snake_case for API
    const apiData = {
      name: data.name,
      description: data.description,
      amount: data.amount,
      is_active: data.isActive
    };
    
    const response = await apiMethods.put<{ data: any }>(`/payroll/benefit-types/${id}`, apiData);
    
    // Transform snake_case to camelCase
    const transformedRecord = {
      ...response.data,
      amount: response.data.amount,
      isActive: response.data.is_active,
      createdAt: response.data.created_at,
      updatedAt: response.data.updated_at
    };
    
    return transformedRecord;
  }

  /**
   * Delete a benefit type
   */
  static async deleteBenefitType(id: string): Promise<void> {
    await apiMethods.delete(`/payroll/benefit-types/${id}`);
  }

  /**
   * Get active benefit types
   */
  static async getActiveBenefitTypes(): Promise<BenefitType[]> {
    const response = await apiMethods.get<{ data: any[] }>('/payroll/benefit-types/active');
    
    // Transform snake_case to camelCase
    const transformedRecords = response.data.map((record: any) => ({
      ...record,
      amount: record.amount,
      isActive: record.is_active,
      createdAt: record.created_at,
      updatedAt: record.updated_at
    }));
    
    return transformedRecords;
  }
}
