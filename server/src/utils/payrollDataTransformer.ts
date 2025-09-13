/**
 * Payroll Data Transformer
 * 
 * Utility functions to standardize payroll data across all modules
 */

import { StandardPayrollData } from '../types/payroll';

export class PayrollDataTransformer {
  /**
   * Transform database payroll record to standardized format
   */
  static transformPayrollRecord(record: any): StandardPayrollData {
    return {
      // Core identifiers
      id: record.id,
      payrollPeriodId: record.payroll_period_id || record.payrollPeriodId,
      periodName: record.period_name || record.periodName,
      
      // Employee information
      employeeId: record.employee_id || record.employeeId || record.employee_display_id,
      employeeName: record.employeeName || record.employee_name || 
        (record.first_name && record.last_name ? `${record.first_name} ${record.last_name}` : '') ||
        (record.first_name || record.last_name ? `${record.first_name || ''}${record.last_name || ''}`.trim() : ''),
      position: record.position || '',
      departmentId: record.department_id || record.departmentId,
      departmentName: record.department_name || record.departmentName || record.department?.name,
      
      // Salary and hours
      baseSalary: Number(record.base_salary || record.baseSalary || 0),
      hourlyRate: Number(record.hourly_rate || record.hourlyRate || 0),
      totalWorkedHours: Number(record.total_worked_hours || record.totalWorkedHours || 0),
      totalRegularHours: Number(record.total_regular_hours || record.totalRegularHours || 0),
      totalOvertimeHours: Number(record.total_overtime_hours || record.totalOvertimeHours || 0),
      totalLateHours: Number(record.total_late_hours || record.totalLateHours || 0),
      paidLeaveHours: Number(record.paid_leave_hours || record.paidLeaveHours || 0),
      
      // Payroll calculations
      grossPay: Number(record.gross_pay || record.grossPay || 0),
      totalDeductions: Number(record.total_deductions || record.totalDeductions || 0),
      totalBenefits: Number(record.total_benefits || record.totalBenefits || 0),
      lateDeductions: Number(record.late_deductions || record.lateDeductions || 0),
      netPay: Number(record.net_pay || record.netPay || 0),
      
      // Status and metadata
      status: record.status || 'draft',
      approvalStatus: record.approval_status || record.approvalStatus,
      createdAt: record.created_at || record.createdAt,
      updatedAt: record.updated_at || record.updatedAt
    };
  }

  /**
   * Transform array of payroll records to standardized format
   */
  static transformPayrollRecords(records: any[]): StandardPayrollData[] {
    return records.map(record => this.transformPayrollRecord(record));
  }

  /**
   * Calculate payroll summary statistics
   */
  static calculateSummary(records: StandardPayrollData[]): {
    totalEmployees: number;
    totalGrossPay: number;
    totalNetPay: number;
    totalDeductions: number;
    totalBenefits: number;
    averageHours: number;
    completionRate: number;
  } {
    if (records.length === 0) {
      return {
        totalEmployees: 0,
        totalGrossPay: 0,
        totalNetPay: 0,
        totalDeductions: 0,
        totalBenefits: 0,
        averageHours: 0,
        completionRate: 0
      };
    }

    const totalEmployees = records.length;
    const totalGrossPay = records.reduce((sum, record) => sum + record.grossPay, 0);
    const totalNetPay = records.reduce((sum, record) => sum + record.netPay, 0);
    const totalDeductions = records.reduce((sum, record) => sum + record.totalDeductions, 0);
    const totalBenefits = records.reduce((sum, record) => sum + record.totalBenefits, 0);
    const totalHours = records.reduce((sum, record) => sum + record.totalWorkedHours, 0);
    const averageHours = totalHours / totalEmployees;
    const completedRecords = records.filter(record => record.status === 'paid').length;
    const completionRate = (completedRecords / totalEmployees) * 100;

    return {
      totalEmployees,
      totalGrossPay: Math.round(totalGrossPay * 100) / 100,
      totalNetPay: Math.round(totalNetPay * 100) / 100,
      totalDeductions: Math.round(totalDeductions * 100) / 100,
      totalBenefits: Math.round(totalBenefits * 100) / 100,
      averageHours: Math.round(averageHours * 100) / 100,
      completionRate: Math.round(completionRate * 100) / 100
    };
  }

  /**
   * Validate payroll data completeness
   */
  static validatePayrollData(data: StandardPayrollData): {
    isValid: boolean;
    missingFields: string[];
    warnings: string[];
  } {
    const missingFields: string[] = [];
    const warnings: string[] = [];

    // Required fields
    const requiredFields = [
      'id', 'payrollPeriodId', 'employeeId', 'employeeName', 'position',
      'baseSalary', 'grossPay', 'netPay', 'status'
    ];

    for (const field of requiredFields) {
      if (data[field as keyof StandardPayrollData] === undefined || 
          data[field as keyof StandardPayrollData] === null ||
          data[field as keyof StandardPayrollData] === '') {
        missingFields.push(field);
      }
    }

    // Validation warnings
    if (data.baseSalary <= 0) {
      warnings.push('Base salary should be greater than 0');
    }
    if (data.grossPay < 0) {
      warnings.push('Gross pay should not be negative');
    }
    if (data.netPay < 0) {
      warnings.push('Net pay should not be negative');
    }
    if (data.totalWorkedHours < 0) {
      warnings.push('Total worked hours should not be negative');
    }
    if (data.totalDeductions < 0) {
      warnings.push('Total deductions should not be negative');
    }

    return {
      isValid: missingFields.length === 0,
      missingFields,
      warnings
    };
  }
}
