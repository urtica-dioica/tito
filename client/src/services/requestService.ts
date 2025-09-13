// Request Service for TITO HR Management System
// @ts-nocheck

import { apiMethods } from '../lib/api';

export interface Request {
  id: string;
  type: 'time_correction' | 'overtime' | 'leave';
  employeeId: string;
  employeeName: string;
  departmentName: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  approverName?: string;
  approvedAt?: string;
  details: any;
}

export interface RequestListParams {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  departmentId?: string;
  search?: string;
}

export interface RequestStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  byType: Array<{
    type: string;
    count: number;
  }>;
}

export class RequestService {
  // Get all requests with filtering and pagination
  static async getRequests(params: RequestListParams = {}): Promise<{
    requests: Request[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const response = await apiMethods.get<{
        success: boolean;
        data?: {
          requests: Request[];
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
      }>('/hr/requests', {
        params: {
          type: params.type,
          status: params.status,
          departmentId: params.departmentId,
          search: params.search,
          page: params.page,
          limit: params.limit
        }
      });

      if (!response.data) {
        throw new Error('Failed to fetch requests');
      }

      // Return the data
      return response.data;
    } catch (error) {
      console.error('Error fetching requests:', error);
      throw error;
    }
  }

  // Get request statistics
  static async getRequestStats(): Promise<RequestStats> {
    try {
      const response = await apiMethods.get<{
        success: boolean;
        data?: RequestStats;
      }>('/hr/requests/stats');

      if (!response.data) {
        throw new Error('Failed to fetch request statistics');
      }

      // Return the data
      return response.data;
    } catch (error) {
      console.error('Error fetching request stats:', error);
      throw error;
    }
  }

  // Get request by ID
  static async getRequest(id: string): Promise<Request> {
    try {
      const response = await apiMethods.get<{
        success: boolean;
        data?: Request;
      }>(`/hr/requests/${id}`);

      if (!response.data) {
        throw new Error('Failed to fetch request');
      }

      // Return the data
      return response.data;
    } catch (error) {
      console.error('Error fetching request:', error);
      throw error;
    }
  }

  // Approve request
  static async approveRequest(id: string): Promise<void> {
    try {
      await apiMethods.post(`/hr/requests/${id}/approve`);
    } catch (error) {
      console.error('Error approving request:', error);
      throw error;
    }
  }

  // Reject request
  static async rejectRequest(id: string, reason?: string): Promise<void> {
    try {
      await apiMethods.post(`/hr/requests/${id}/reject`, { reason });
    } catch (error) {
      console.error('Error rejecting request:', error);
      throw error;
    }
  }
}
