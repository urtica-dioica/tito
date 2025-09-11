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

    const response = await apiMethods.get(`/hr/id-cards?${queryParams.toString()}`);
    return (response as any).data;
  }

  /**
   * Get ID card by ID
   */
  static async getIdCard(id: string): Promise<IdCard> {
    const response = await apiMethods.get(`/hr/id-cards/${id}`);
    return (response as any).data;
  }

  /**
   * Create new ID card for employee
   */
  static async createIdCard(data: CreateIdCardRequest): Promise<IdCard> {
    const response = await apiMethods.post('/hr/id-cards', data);
    return (response as any).data;
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
    const response = await apiMethods.post(`/hr/id-cards/generate-department`, {
      departmentId
    });
    return (response as any).data;
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
    const response = await apiMethods.get('/hr/id-cards/stats');
    return (response as any).data;
  }

  /**
   * Get QR code data for ID card
   */
  static async getQrCodeData(idCardId: string): Promise<{
    qrCodeData: string;
    qrCodeImage: string;
  }> {
    const response = await apiMethods.get(`/hr/id-cards/${idCardId}/qr-code`);
    return (response as any).data;
  }
}

export default IdCardService;
