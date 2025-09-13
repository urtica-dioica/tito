import { apiMethods } from '../lib/api';
import type { IdCard, CreateIdCardRequest, IdCardListParams } from '../types';

export class IdCardService {
  /**
   * Get list of ID cards with pagination and filtering
   */
  static async getIdCards(params?: IdCardListParams): Promise<{
    idCards: IdCard[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.departmentId) queryParams.append('departmentId', params.departmentId);
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    if (params?.isExpired !== undefined) queryParams.append('isExpired', params.isExpired.toString());
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const response = await apiMethods.get<{
      idCards: IdCard[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/hr/id-cards?${queryParams.toString()}`);
    if (!response.data) {
      throw new Error('Failed to fetch ID cards');
    }
    return response.data;
  }

  /**
   * Get ID card by ID
   */
  static async getIdCard(id: string): Promise<IdCard> {
    const response = await apiMethods.get<IdCard>(`/hr/id-cards/${id}`);
    if (!response.data) {
      throw new Error('Failed to fetch ID card');
    }
    return response.data;
  }

  /**
   * Create new ID card for employee
   */
  static async createIdCard(data: CreateIdCardRequest): Promise<IdCard> {
    const response = await apiMethods.post<IdCard>('/hr/id-cards', data as any);
    if (!response.data) {
      throw new Error('Failed to create ID card');
    }
    return response.data;
  }

  /**
   * Deactivate ID card
   */
  static async deactivateIdCard(id: string): Promise<void> {
    await apiMethods.patch(`/hr/id-cards/${id}/deactivate`);
  }

  /**
   * Generate ID cards for all employees in a department
   */
  static async generateDepartmentIdCards(departmentId: string): Promise<{
    success: number;
    failed: number;
    errors: Array<{ employeeId: string; error: string }>;
  }> {
    const response = await apiMethods.post<{
      success: number;
      failed: number;
      errors: Array<{ employeeId: string; error: string }>;
    }>(`/hr/id-cards/generate-department`, { departmentId });
    if (!response.data) {
      throw new Error('Failed to generate department ID cards');
    }
    return response.data;
  }

  /**
   * Get ID card statistics
   */
  static async getIdCardStats(): Promise<{
    totalIdCards: number;
    activeIdCards: number;
    expiredIdCards: number;
    expiringSoon: number;
  }> {
    const response = await apiMethods.get<{
      totalIdCards: number;
      activeIdCards: number;
      expiredIdCards: number;
      expiringSoon: number;
    }>('/hr/id-cards/stats');
    if (!response.data) {
      throw new Error('Failed to fetch ID card stats');
    }
    return response.data;
  }

  /**
   * Get QR code data for ID card
   */
  static async getQrCodeData(idCardId: string): Promise<{
    qrCodeData: string;
    qrCodeImage: string;
  }> {
    const response = await apiMethods.get<{
      qrCodeData: string;
      qrCodeImage: string;
    }>(`/hr/id-cards/${idCardId}/qr-code`);
    if (!response.data) {
      throw new Error('Failed to fetch QR code data');
    }
    return response.data;
  }
}

export default IdCardService;
