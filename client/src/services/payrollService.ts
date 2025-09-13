// @ts-nocheck
import { apiMethods } from '../lib/api';
import type { PayrollPeriod, PayrollRecord, NewPayrollRecord, PayrollApproval } from '../types';

export interface CreatePayrollPeriodRequest {
  periodName: string;
  startDate: string;
  endDate: string;
  status?: 'draft' | 'processing' | 'completed' | 'cancelled';
  [key: string]: unknown;
}

export interface PayrollPeriodsResponse {
  periods: PayrollPeriod[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PayrollRecordsResponse {
  records: PayrollRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface NewPayrollRecordsResponse {
  records: NewPayrollRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PayrollSummary {
  period: PayrollPeriod;
  totalEmployees: number;
  totalGrossPay: number;
  totalNetPay: number;
  processedRecords: number;
}

export interface PayrollStats {
  totalEmployees: number;
  totalPayroll: number;
  processedPeriods: number;
  pendingPeriods: number;
}

export interface PayrollApprovalsResponse {
  approvals: PayrollApproval[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class PayrollService {
  /**
   * Get all payroll periods
   */
  static async getPayrollPeriods(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<PayrollPeriodsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);

    const url = `/payroll/periods?${queryParams.toString()}`;

    const response = await apiMethods.get<{
      data: PayrollPeriod[];
      pagination: any
    }>(url);

    // Transform snake_case to camelCase
    const transformedPeriods = (response.data || []).map((period: any) => ({
      ...period,
      periodName: period.period_name,
      startDate: period.start_date,
      endDate: period.end_date,
      workingDays: period.working_days,
      expectedHours: period.expected_hours,
      createdBy: period.created_by,
      createdAt: period.created_at,
      updatedAt: period.updated_at
    }));

    return {
      periods: transformedPeriods,
      total: response.pagination?.total || 0,
      page: response.pagination?.page || 1,
      limit: response.pagination?.limit || 10,
      totalPages: response.pagination?.pages || 1
    };
  }

  /**
   * Create a new payroll period
   */
  static async createPayrollPeriod(data: CreatePayrollPeriodRequest): Promise<PayrollPeriod> {
    const response = await apiMethods.post<{
      success: boolean;
      data: PayrollPeriod;
    }>('/payroll/periods', {
      period_name: data.periodName,
      start_date: data.startDate,
      end_date: data.endDate,
      status: data.status || 'draft'
    });
    if (!response.data) {
      throw new Error('Failed to create payroll period');
    }
    return response.data;
  }

  /**
   * Update a payroll period
   */
  static async updatePayrollPeriod(id: string, data: Partial<CreatePayrollPeriodRequest>): Promise<PayrollPeriod> {
    const response = await apiMethods.put<{ data?: PayrollPeriod }>(`/payroll/periods/${id}`, {
      period_name: data.periodName,
      start_date: data.startDate,
      end_date: data.endDate,
      status: data.status
    });
    if (!response.data) {
      throw new Error('Failed to update payroll period');
    }
    return response.data;
  }

  /**
   * Delete a payroll period
   */
  static async deletePayrollPeriod(id: string): Promise<void> {
    await apiMethods.delete(`/payroll/periods/${id}`);
  }

  /**
   * Generate payroll records for a period
   */
  static async generatePayrollRecords(periodId: string): Promise<{ success: boolean; message: string }> {
    const response = await apiMethods.post<{ success: boolean; message: string }>(`/payroll/periods/${periodId}/generate`);
    return response;
  }

  /**
   * Get payroll period summary
   */
  static async getPayrollSummary(periodId: string): Promise<PayrollSummary> {
    const response = await apiMethods.get<{ data?: PayrollSummary }>(`/payroll/periods/${periodId}/summary`);
    if (!response.data) {
      throw new Error('Failed to fetch payroll summary');
    }
    return response.data;
  }

  /**
   * Get payroll records
   */
  static async getPayrollRecords(params?: {
    page?: number;
    limit?: number;
    payroll_period_id?: string;
    employee_id?: string;
    status?: string;
  }): Promise<{ records: PayrollRecord[]; total: number; page: number; limit: number; totalPages: number }> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.payroll_period_id) queryParams.append('payroll_period_id', params.payroll_period_id);
    if (params?.employee_id) queryParams.append('employee_id', params.employee_id);
    if (params?.status) queryParams.append('status', params.status);

    const url = `/payroll/records?${queryParams.toString()}`;
    const response = await apiMethods.get<{ data?: PayrollRecord[]; pagination?: any }>(url);

    // Transform snake_case to camelCase and extract employee info
    const transformedRecords = (response.data || []).map((record: any) => ({
      ...record,
      payrollPeriodId: record.payroll_period_id || record.payrollPeriodId, // Ensure payrollPeriodId is mapped
      employeeName: record.employee?.user ? 
        `${record.employee.user.first_name} ${record.employee.user.last_name}` : 
        record.employee_name || 'Unknown Employee',
      employeeId: record.employee?.employee_id || record.employee_id || 'N/A',
      periodName: record.period_name || record.periodName || 'N/A',
      departmentId: record.employee?.department?.id || record.department_id || null,
      departmentName: record.employee?.department?.name || record.department_name || 'Unknown Department',
      baseSalary: record.base_salary,
      totalWorkedHours: record.total_worked_hours,
      hourlyRate: record.hourly_rate,
      totalRegularHours: record.total_regular_hours,
      totalOvertimeHours: record.total_overtime_hours,
      totalLateHours: record.total_late_hours,
      lateDeductions: record.late_deductions,
      paidLeaveHours: record.paid_leave_hours || 0,
      grossPay: record.gross_pay,
      netPay: record.net_pay,
      totalDeductions: record.total_deductions,
      totalBenefits: record.total_benefits,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      approvalStatus: record.approval_status,
      approvalApprovedAt: record.approval_approved_at,
      approvalComments: record.approval_comments
    }));

    return {
      records: transformedRecords,
      total: response.pagination?.total || 0,
      page: response.pagination?.page || 1,
      limit: response.pagination?.limit || 10,
      totalPages: response.pagination?.pages || 1
    };
  }

  /**
   * Get payroll record by ID
   */
  static async getPayrollRecord(id: string): Promise<PayrollRecord> {
    const response = await apiMethods.get<{ data?: PayrollRecord }>(`/payroll/records/${id}`);
    if (!response.data) {
      throw new Error('Failed to fetch payroll record');
    }
    return response.data;
  }

  /**
   * Update payroll record
   */
  static async updatePayrollRecord(id: string, data: Partial<PayrollRecord>): Promise<PayrollRecord> {
    const response = await apiMethods.put<{ data?: PayrollRecord }>(`/payroll/records/${id}`, data);
    if (!response.data) {
      throw new Error('Failed to update payroll record');
    }
    return response.data;
  }


  // ===== NEW PAYROLL SYSTEM METHODS =====

  /**
   * Get payroll records with new fields (including total_benefits)
   */
  static async getNewPayrollRecords(params?: {
    page?: number;
    limit?: number;
    payrollPeriodId?: string;
    employeeId?: string;
    status?: string;
  }): Promise<NewPayrollRecordsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.payrollPeriodId) queryParams.append('payroll_period_id', params.payrollPeriodId);
    if (params?.employeeId) queryParams.append('employee_id', params.employeeId);
    if (params?.status) queryParams.append('status', params.status);

    const response = await apiMethods.get<{ data?: NewPayrollRecord[]; pagination?: any }>(
      `/payroll/records?${queryParams.toString()}`
    );

    return {
      records: response.data || [],
      total: response.pagination?.total || 0,
      page: response.pagination?.page || 1,
      limit: response.pagination?.limit || 10,
      totalPages: response.pagination?.pages || 1
    };
  }

  /**
   * Get new payroll record by ID (with total_benefits)
   */
  static async getNewPayrollRecord(id: string): Promise<NewPayrollRecord> {
    const response = await apiMethods.get<{ data?: NewPayrollRecord }>(`/payroll/records/${id}`);
    if (!response.data) {
      throw new Error('Failed to fetch new payroll record');
    }
    return response.data;
  }

  /**
   * Update new payroll record (with total_benefits)
   */
  static async updateNewPayrollRecord(id: string, data: Partial<NewPayrollRecord>): Promise<NewPayrollRecord> {
    const response = await apiMethods.put<{ data?: NewPayrollRecord }>(`/payroll/records/${id}`, data);
    if (!response.data) {
      throw new Error('Failed to update new payroll record');
    }
    return response.data;
  }

  /**
   * Get payroll approvals
   */
  static async getPayrollApprovals(params?: {
    page?: number;
    limit?: number;
    payrollPeriodId?: string;
    approverId?: string;
    status?: string;
  }): Promise<{ records: PayrollApproval[]; total: number; page: number; limit: number; totalPages: number }> {
    const response = await apiMethods.get<{ data?: PayrollApprovalsResponse }>('/payroll/approvals', { params });

    if (!response.data) {
      throw new Error('Failed to fetch payroll approvals');
    }

    // Transform the data to match frontend expectations
    const transformedData = {
      records: response.data.approvals.map(approval => ({
        ...approval,
        approverName: approval.approver ? `${approval.approver.firstName} ${approval.approver.lastName}` : undefined,
        departmentName: approval.department?.name
      })),
      total: response.data.total,
      page: response.data.page,
      limit: response.data.limit,
      totalPages: response.data.totalPages
    };

    return transformedData;
  }

  /**
   * Get payroll approval by ID
   */
  static async getPayrollApproval(id: string): Promise<PayrollApproval> {
    const response = await apiMethods.get<{ data?: PayrollApproval }>(`/payroll/approvals/${id}`);
    if (!response.data) {
      throw new Error('Failed to fetch payroll approval');
    }
    return response.data;
  }

  /**
   * Generate department paystubs PDF
   */
  static async generateDepartmentPaystubs(payrollPeriodId: string, departmentId: string): Promise<Blob> {
    const response = await apiMethods.get(`/payroll/paystubs/department/${departmentId}/period/${payrollPeriodId}`, {
      responseType: 'blob'
    });
    // The response should already be a Blob when responseType is 'blob'
    return response as unknown as Blob;
  }

  /**
   * Approve or reject payroll approval
   */
  static async approvePayrollApproval(id: string, data: { status: 'approved' | 'rejected'; comments?: string }): Promise<PayrollApproval> {
    const response = await apiMethods.put<{ data?: PayrollApproval }>(`/payroll/approvals/${id}/approve`, data);
    if (!response.data) {
      throw new Error('Failed to approve payroll approval');
    }
    return response.data;
  }

  /**
   * Create payroll approvals for a period (send for review)
   */
  static async createPayrollApprovals(payrollPeriodId: string): Promise<PayrollApproval[]> {
    const response = await apiMethods.post<{ data?: PayrollApproval[] }>(`/payroll/periods/${payrollPeriodId}/send-for-review`);
    if (!response.data) {
      throw new Error('Failed to create payroll approvals');
    }
    return response.data;
  }

  /**
   * Send payroll to departments for approval
   */
  static async sendPayrollToDepartments(payrollPeriodId: string): Promise<{ success: boolean; message: string }> {
    const response = await apiMethods.post<{ success: boolean; message: string }>(`/payroll/periods/${payrollPeriodId}/approvals`);
    return response;
  }

  /**
   * Initialize payroll periods for the current year
   */
  static async initializePayrollPeriods(): Promise<{ success: boolean; message: string }> {
    const response = await apiMethods.post<{ success: boolean; message: string }>('/payroll/initialize-periods');
    return response;
  }

  /**
   * Generate payroll period for the current month only
   */
  static async generateCurrentMonthPeriod(): Promise<{ success: boolean; message: string }> {
    const response = await apiMethods.post<{ success: boolean; message: string }>('/payroll/generate-current-month');
    return response;
  }

  /**
   * Get expected monthly hours from system settings
   */
  static async getExpectedMonthlyHours(): Promise<{ expectedHours: number }> {
    const response = await apiMethods.get<{ data?: { expectedHours: number } }>('/payroll/expected-hours');
    if (!response.data) {
      throw new Error('Failed to fetch expected monthly hours');
    }
    return response.data;
  }

  /**
   * Get payroll statistics
   */
  static async getPayrollStats(): Promise<{
    totalEmployees: number;
    totalPayroll: number;
    processedPeriods: number;
    pendingPeriods: number;
  }> {
    const response = await apiMethods.get<{
      success: boolean;
      data?: {
        totalEmployees: number;
        totalPayroll: number;
        processedPeriods: number;
        pendingPeriods: number;
      };
    }>('/payroll/stats');
    if (!response.data) {
      throw new Error('Failed to fetch payroll statistics');
    }
    return response.data;
  }

  /**
   * Approve payroll record
   */
  static async approvePayrollRecord(recordId: string): Promise<{ success: boolean; message: string }> {
    const response = await apiMethods.post<{ success: boolean; message: string }>(
      `/payroll/records/${recordId}/approve`
    );
    return response;
  }

  /**
   * Mark payroll as paid
   */
  static async markPayrollAsPaid(recordId: string): Promise<{ success: boolean; message: string }> {
    const response = await apiMethods.post<{ success: boolean; message: string }>(
      `/payroll/records/${recordId}/mark-paid`
    );
    return response;
  }

  /**
   * Export payroll records
   */
  static async exportPayrollRecords(format: 'csv' | 'pdf', params?: string): Promise<Blob> {
    const url = `/payroll/records/export?format=${format}${params ? `&${params}` : ''}`;
    const response = await fetch(`${import.meta.env.VITE_API_URL}${url}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Export failed');
    }
    
    return response.blob();
  }

  /**
   * Update payroll record status
   */
  static async updatePayrollRecordStatus(recordId: string, status: 'draft' | 'processed' | 'paid'): Promise<PayrollRecord> {
    const response = await apiMethods.put<{ data?: PayrollRecord }>(`/payroll/records/${recordId}/status`, { status });
    if (!response.data) {
      throw new Error('Failed to update payroll record status');
    }
    return response.data;
  }

  /**
   * Bulk update payroll records status for a period
   */
  static async bulkUpdatePayrollRecordsStatus(
    periodId: string,
    status: 'draft' | 'processed' | 'paid',
    departmentId?: string
  ): Promise<{ updatedCount: number; records: PayrollRecord[] }> {
    const response = await apiMethods.put<{ data?: { updatedCount: number; records: PayrollRecord[] } }>(
      `/payroll/periods/${periodId}/records/status`,
      { status, departmentId }
    );
    if (!response.data) {
      throw new Error('Failed to bulk update payroll records status');
    }
    return response.data;
  }

  /**
   * Reprocess payroll records for a period (clears existing and regenerates)
   */
  static async reprocessPayrollRecords(periodId: string, departmentId?: string): Promise<{ recordCount: number; records: PayrollRecord[] }> {
    const params = departmentId ? `?departmentId=${departmentId}` : '';
    const response = await apiMethods.post<{ data?: { recordCount: number; records: PayrollRecord[] } }>(
      `/payroll/periods/${periodId}/reprocess${params}`
    );
    if (!response.data) {
      throw new Error('Failed to reprocess payroll records');
    }
    return response.data;
  }

  /**
   * Complete payroll period (mark as completed when all departments approve)
   */
  static async completePayrollPeriod(periodId: string): Promise<PayrollPeriod> {
    const response = await apiMethods.put<{ data?: PayrollPeriod }>(`/payroll/periods/${periodId}/complete`);
    if (!response.data) {
      throw new Error('Failed to complete payroll period');
    }
    return response.data;
  }

  /**
   * Bulk update payroll records to paid status
   */
  static async bulkUpdatePayrollRecordsToPaid(options: {
    periodId?: string;
    departmentId?: string;
    recordIds?: string[];
  }): Promise<{ updatedCount: number }> {
    const response = await apiMethods.put<{ data?: { updatedCount: number } }>('/payroll/records/bulk-paid', options);
    if (!response.data) {
      throw new Error('Failed to bulk update payroll records to paid');
    }
    return response.data;
  }

  /**
   * Export all employee paystubs for a period as PDF
   */
  static async exportPeriodPaystubsPDF(periodId: string): Promise<Blob> {
    try {
      console.log('Making PDF export request for period:', periodId);
      const response = await apiMethods.get(`/payroll/periods/${periodId}/export/paystubs/pdf`, {
        responseType: 'blob'
      });
      
      console.log('PDF export response:', response);

      // The response itself is the Blob when using responseType: 'blob'
      const data = response as unknown as Blob;
      console.log('PDF export data:', data, 'Type:', typeof data, 'Is Blob:', data instanceof Blob);
      
      // Check if the response is an error (JSON error response)
      if (data instanceof Blob && data.type === 'application/json') {
        const text = await data.text();
        const errorData = JSON.parse(text);
        throw new Error(errorData.message || 'Export failed');
      }
      
      return data;
    } catch (error) {
      console.error('Error exporting period paystubs PDF:', error);
      throw error;
    }
  }

  /**
   * Export department employee paystubs for a period as PDF
   */
  static async exportDepartmentPaystubsPDF(periodId: string): Promise<Blob> {
    try {
      console.log('Making department PDF export request for period:', periodId);
      const response = await apiMethods.get(`/payroll/periods/${periodId}/export/paystubs/department/pdf`, {
        responseType: 'blob'
      });
      
      console.log('Department PDF export response:', response);

      // The response itself is the Blob when using responseType: 'blob'
      const data = response as unknown as Blob;
      console.log('Department PDF export data:', data, 'Type:', typeof data, 'Is Blob:', data instanceof Blob);
      
      // Check if the response is an error (JSON error response)
      if (data instanceof Blob && data.type === 'application/json') {
        const text = await data.text();
        const errorData = JSON.parse(text);
        throw new Error(errorData.message || 'Department export failed');
      }
      
      return data;
    } catch (error) {
      console.error('Error exporting department paystubs PDF:', error);
      throw error;
    }
  }

}
