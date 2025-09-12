/**
 * Standardized Payroll Data Interface
 * 
 * This interface ensures consistency across all payroll API routes
 * (HR, Department Head, Employee modules)
 */

export interface StandardPayrollData {
  // Core identifiers
  id: string;
  payrollPeriodId: string;
  periodName?: string;
  
  // Employee information
  employeeId: string;
  employeeName: string;
  position: string;
  departmentId?: string;
  departmentName?: string;
  
  // Salary and hours
  baseSalary: number;
  hourlyRate: number;
  totalWorkedHours: number;
  totalRegularHours: number;
  totalOvertimeHours: number;
  totalLateHours: number;
  paidLeaveHours: number;
  
  // Payroll calculations
  grossPay: number;
  totalDeductions: number;
  totalBenefits: number;
  lateDeductions: number;
  netPay: number;
  
  // Status and metadata
  status: 'draft' | 'processed' | 'paid';
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

export interface PayrollSummaryData {
  totalEmployees: number;
  totalGrossPay: number;
  totalNetPay: number;
  totalDeductions: number;
  totalBenefits: number;
  averageHours: number;
  completionRate: number;
}

export interface PayrollListParams {
  page?: number;
  limit?: number;
  payrollPeriodId?: string;
  employeeId?: string;
  departmentId?: string;
  status?: string;
  year?: number;
  month?: number;
}

export interface PayrollListResponse {
  records: StandardPayrollData[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary?: PayrollSummaryData;
}
