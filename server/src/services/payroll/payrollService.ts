import { payrollPeriodModel, PayrollPeriod, CreatePayrollPeriodData } from '../../models/payroll/PayrollPeriod';
import { payrollRecordModel, PayrollRecord, PayrollRecordWithEmployee } from '../../models/payroll/PayrollRecord';
import { payrollDeductionModel } from '../../models/payroll/PayrollDeduction';
import { deductionTypeModel } from '../../models/payroll/DeductionType';
import { employeeDeductionBalanceModel } from '../../models/payroll/EmployeeDeductionBalance';
import { benefitTypeModel } from '../../models/payroll/BenefitType';
import { employeeBenefitModel } from '../../models/payroll/EmployeeBenefit';
import { employeeModel } from '../../models/hr/Employee';
import { getPool } from '../../config/database';
// import { attendanceRecordModel } from '../../models/attendance/AttendanceRecord';
// import { overtimeRequestModel } from '../../models/attendance/OvertimeRequest';
// import { systemSettingsModel } from '../../models/hr/SystemSettings'; // Temporarily disabled
import logger from '../../utils/logger';

export interface PayrollCalculationData {
  employeeId: string;
  payrollPeriodId: string;
  baseSalary: number;
  totalWorkedHours: number;
  totalRegularHours: number;
  totalOvertimeHours: number;
  totalLateHours: number;
  lateDeductions: number;
  employeeDeductions: Array<{
    type: string;
    amount: number;
    remainingBalance: number;
  }>;
  employeeBenefits: Array<{
    type: string;
    amount: number;
  }>;
}

export interface PayrollSummary {
  period: PayrollPeriod;
  totalEmployees: number;
  totalGrossPay: number;
  totalDeductions: number;
  totalNetPay: number;
  processedRecords: number;
  pendingRecords: number;
}

export interface EmployeePayrollData {
  employee: {
    id: string;
    employee_id: string;
    name: string;
    department: string;
  };
  baseSalary: number;
  totalWorkedHours: number;
  totalRegularHours: number;
  totalOvertimeHours: number;
  totalLateHours: number;
  lateDeductions: number;
  hourlyRate: number;
  grossPay: number;
  employeeDeductions: Array<{
    type: string;
    amount: number;
    remainingBalance: number;
  }>;
  employeeBenefits: Array<{
    type: string;
    amount: number;
  }>;
  totalDeductions: number;
  totalBenefits: number;
  netPay: number;
}

class PayrollService {
  async createPayrollPeriod(data: CreatePayrollPeriodData): Promise<PayrollPeriod> {
    try {
      // Validate date range
      if (data.start_date >= data.end_date) {
        throw new Error('Start date must be before end date');
      }

      // Check for overlapping periods
      const overlappingPeriods = await payrollPeriodModel.findByDateRange(data.start_date, data.end_date);
      if (overlappingPeriods.length > 0) {
        throw new Error('Payroll period overlaps with existing period');
      }

      const period = await payrollPeriodModel.create(data);
      logger.info('Payroll period created', { periodId: period.id, periodName: period.period_name });
      return period;
    } catch (error) {
      logger.error('Error creating payroll period', { error: (error as Error).message, data });
      throw error;
    }
  }

  async getPayrollPeriods(params: any = {}): Promise<{ periods: PayrollPeriod[]; total: number }> {
    try {
      return await payrollPeriodModel.findAll(params);
    } catch (error) {
      logger.error('Error getting payroll periods', { error: (error as Error).message, params });
      throw error;
    }
  }

  async getPayrollPeriod(id: string): Promise<PayrollPeriod | null> {
    try {
      return await payrollPeriodModel.findById(id);
    } catch (error) {
      logger.error('Error getting payroll period', { error: (error as Error).message, id });
      throw error;
    }
  }

  async updatePayrollPeriod(id: string, data: any): Promise<PayrollPeriod | null> {
    try {
      return await payrollPeriodModel.update(id, data);
    } catch (error) {
      logger.error('Error updating payroll period', { error: (error as Error).message, id, data });
      throw error;
    }
  }

  async deletePayrollPeriod(id: string): Promise<boolean> {
    try {
      // Check if period has payroll records
      const records = await payrollRecordModel.findByPayrollPeriod(id);
      if (records.length > 0) {
        throw new Error('Cannot delete payroll period with existing records');
      }

      return await payrollPeriodModel.delete(id);
    } catch (error) {
      logger.error('Error deleting payroll period', { error: (error as Error).message, id });
      throw error;
    }
  }

  async calculateEmployeePayroll(employeeId: string, payrollPeriodId: string): Promise<EmployeePayrollData> {
    try {
      // Get employee data
      const employee = await employeeModel.findByIdWithDetails(employeeId);
      if (!employee) {
        throw new Error('Employee not found');
      }

      // Get payroll period
      const period = await payrollPeriodModel.findById(payrollPeriodId);
      if (!period) {
        throw new Error('Payroll period not found');
      }

      // Calculate expected working days for the month
      const startDate = new Date(period.start_date);
      const endDate = new Date(period.end_date);
      const expectedWorkingDays = this.calculateWorkingDays(startDate, endDate);
      const expectedHours = expectedWorkingDays * 8; // 8 hours per working day

      // Get attendance data with proper hour calculations
      const attendanceQuery = `
        SELECT 
          SUM(COALESCE(calculated_hours, 0)) as total_worked_hours,
          SUM(COALESCE(regular_hours, 0)) as total_regular_hours,
          SUM(COALESCE(overtime_hours, 0)) as total_overtime_hours,
          SUM(COALESCE(late_hours, 0)) as total_late_hours,
          COUNT(*) as total_working_days
        FROM attendance_sessions s
        JOIN attendance_records ar ON s.attendance_record_id = ar.id
        WHERE ar.employee_id = $1 
          AND ar.date >= $2 
          AND ar.date <= $3
          AND s.clock_in IS NOT NULL 
          AND s.clock_out IS NOT NULL
      `;
      
      const attendanceResult = await getPool().query(attendanceQuery, [
        employeeId, 
        period.start_date, 
        period.end_date
      ]);
      
      const attendanceData = attendanceResult.rows[0];
      const totalWorkedHours = parseFloat(attendanceData.total_worked_hours) || 0;
      const totalRegularHours = parseFloat(attendanceData.total_regular_hours) || 0;
      const totalOvertimeHours = parseFloat(attendanceData.total_overtime_hours) || 0;
      const totalLateHours = parseFloat(attendanceData.total_late_hours) || 0;

      // Parse base salary
      const baseSalary = Number(employee.base_salary) || 0;

      // Calculate hourly rate
      const hourlyRate = baseSalary / expectedHours;

      // Calculate late deductions
      const lateDeductions = totalLateHours * hourlyRate;

      // Get employee-specific deduction balances
      const employeeDeductionBalances = await employeeDeductionBalanceModel.findActiveByEmployee(employeeId);
      
      // Apply employee deductions (until balance reaches zero)
      const employeeDeductions: Array<{ type: string; amount: number; remainingBalance: number }> = [];
      let totalEmployeeDeductions = 0;

      for (const balance of employeeDeductionBalances) {
        // Calculate actual deduction (minimum of monthly amount or remaining balance)
        const monthlyAmount = Number(balance.monthly_deduction_amount) || 0;
        const remainingBalance = Number(balance.remaining_balance) || 0;
        const actualDeduction = Math.min(monthlyAmount, remainingBalance);
        
        if (actualDeduction > 0) {
          employeeDeductions.push({
            type: balance.deduction_type_name || 'Unknown',
            amount: actualDeduction,
            remainingBalance: remainingBalance - actualDeduction
          });
          totalEmployeeDeductions += actualDeduction;
        }
      }

      // Get employee benefits
      const employeeBenefits = await employeeBenefitModel.findActiveByEmployee(employeeId);
      
      const benefits: Array<{ type: string; amount: number }> = [];
      let totalBenefits = 0;

      for (const benefit of employeeBenefits) {
        const benefitAmount = Number(benefit.amount) || 0;
        benefits.push({
          type: benefit.benefit_type?.name || 'Unknown',
          amount: benefitAmount
        });
        totalBenefits += benefitAmount;
      }

      // Calculate actual salary based on worked hours (no work, no pay)
      const actualSalary = (totalWorkedHours / expectedHours) * baseSalary;
      
      // Calculate gross pay (actual salary + benefits)
      const grossPay = actualSalary + totalBenefits;

      // Calculate net pay: Actual Salary - Deductions - Late Deductions + Benefits
      const netPay = actualSalary - totalEmployeeDeductions - lateDeductions + totalBenefits;

      const payrollData: EmployeePayrollData = {
        employee: {
          id: employee.id,
          employee_id: employee.employee_id,
          name: `${employee.user.first_name} ${employee.user.last_name}`,
          department: employee.department?.name || 'N/A'
        },
        baseSalary: actualSalary,
        totalWorkedHours,
        totalRegularHours,
        totalOvertimeHours,
        totalLateHours,
        lateDeductions,
        hourlyRate,
        grossPay,
        employeeDeductions,
        employeeBenefits: benefits,
        totalDeductions: totalEmployeeDeductions,
        totalBenefits,
        netPay
      };

      logger.info('Employee payroll calculated', { 
        employeeId, 
        payrollPeriodId, 
        baseSalary: employee.base_salary,
        totalDeductions: totalEmployeeDeductions,
        totalBenefits,
        netPay 
      });

      return payrollData;
    } catch (error) {
      logger.error('Error calculating employee payroll', { 
        error: (error as Error).message, 
        employeeId, 
        payrollPeriodId 
      });
      throw error;
    }
  }

  async generatePayrollRecords(payrollPeriodId: string, departmentId?: string): Promise<PayrollRecord[]> {
    try {
      // Get active employees - either all or filtered by department
      const employees = departmentId 
        ? await employeeModel.findAll({ status: 'active', department_id: departmentId })
        : await employeeModel.findAll({ status: 'active' });
      const records: PayrollRecord[] = [];

      for (const employee of employees.employees) {
        // Calculate payroll for this employee using new logic
        const payrollData = await this.calculateEmployeePayroll(employee.id, payrollPeriodId);

        // Check if record already exists
        const existingRecord = await payrollRecordModel.findByPeriodAndEmployee(
          payrollPeriodId,
          employee.id
        );

        if (existingRecord) {
          // Update existing record
          const updatedRecord = await payrollRecordModel.update(existingRecord.id, {
            base_salary: payrollData.baseSalary,
            total_worked_hours: payrollData.totalWorkedHours,
            hourly_rate: payrollData.hourlyRate,
            total_regular_hours: payrollData.totalRegularHours,
            total_overtime_hours: payrollData.totalOvertimeHours,
            total_late_hours: payrollData.totalLateHours,
            late_deductions: payrollData.lateDeductions,
            gross_pay: payrollData.grossPay,
            net_pay: payrollData.netPay,
            total_deductions: payrollData.totalDeductions,
            total_benefits: payrollData.totalBenefits,
            status: 'draft'
          });

          if (updatedRecord) {
            records.push(updatedRecord);
          }
        } else {
          // Create new record
          const newRecord = await payrollRecordModel.create({
            payroll_period_id: payrollPeriodId,
            employee_id: employee.id,
            base_salary: payrollData.baseSalary,
            total_worked_hours: payrollData.totalWorkedHours,
            hourly_rate: payrollData.hourlyRate,
            total_regular_hours: payrollData.totalRegularHours,
            total_overtime_hours: payrollData.totalOvertimeHours,
            total_late_hours: payrollData.totalLateHours,
            late_deductions: payrollData.lateDeductions,
            gross_pay: payrollData.grossPay,
            net_pay: payrollData.netPay,
            total_deductions: payrollData.totalDeductions,
            total_benefits: payrollData.totalBenefits,
            status: 'draft'
          });

          records.push(newRecord);
        }

        // Create deduction records and update employee deduction balances
        const record = records[records.length - 1];
        if (record) {
          // Delete existing deductions
          await payrollDeductionModel.deleteByPayrollRecord(record.id);

          // Create new deduction records and update balances
          for (const deduction of payrollData.employeeDeductions) {
            // Find the deduction type ID by name
            const deductionType = await deductionTypeModel.findByName(deduction.type);
            if (deductionType) {
              await payrollDeductionModel.create({
                payroll_record_id: record.id,
                deduction_type_id: deductionType.id,
                name: deduction.type,
                amount: deduction.amount
              });

              // Update employee deduction balance
              const employeeDeductionBalances = await employeeDeductionBalanceModel.findByEmployee(employee.id);
              const balance = employeeDeductionBalances.find(b => b.deduction_type_id === deductionType.id);
              
              if (balance) {
                await employeeDeductionBalanceModel.update(balance.id, {
                  remaining_balance: deduction.remainingBalance,
                  is_active: deduction.remainingBalance > 0
                });
              }
            }
          }
        }
      }

      logger.info('Payroll records generated', { 
        payrollPeriodId, 
        recordCount: records.length 
      });

      return records;
    } catch (error) {
      logger.error('Error generating payroll records', { 
        error: (error as Error).message, 
        payrollPeriodId 
      });
      throw error;
    }
  }

  async getPayrollRecords(params: any = {}): Promise<{ records: PayrollRecordWithEmployee[]; total: number }> {
    try {
      return await payrollRecordModel.findAllWithEmployee(params);
    } catch (error) {
      logger.error('Error getting payroll records', { error: (error as Error).message, params });
      throw error;
    }
  }

  async getPayrollRecord(id: string): Promise<PayrollRecord | null> {
    try {
      return await payrollRecordModel.findById(id);
    } catch (error) {
      logger.error('Error getting payroll record', { error: (error as Error).message, id });
      throw error;
    }
  }

  async updatePayrollRecord(id: string, data: any): Promise<PayrollRecord | null> {
    try {
      return await payrollRecordModel.update(id, data);
    } catch (error) {
      logger.error('Error updating payroll record', { error: (error as Error).message, id, data });
      throw error;
    }
  }

  async getPayrollSummary(payrollPeriodId: string): Promise<PayrollSummary> {
    try {
      const period = await payrollPeriodModel.findById(payrollPeriodId);
      if (!period) {
        throw new Error('Payroll period not found');
      }

      const records = await payrollRecordModel.findByPayrollPeriod(payrollPeriodId);
      
      const totalEmployees = records.length;
      const totalGrossPay = records.reduce((sum, record) => sum + record.gross_pay, 0);
      
      let totalDeductions = 0;
      let processedRecords = 0;
      let pendingRecords = 0;

      for (const record of records) {
        const deductions = await payrollDeductionModel.findByPayrollRecord(record.id);
        const recordDeductions = deductions.reduce((sum, deduction) => sum + deduction.amount, 0);
        totalDeductions += recordDeductions;

        if (record.status === 'processed' || record.status === 'paid') {
          processedRecords++;
        } else {
          pendingRecords++;
        }
      }

      const totalNetPay = totalGrossPay - totalDeductions;

      const summary: PayrollSummary = {
        period,
        totalEmployees,
        totalGrossPay,
        totalDeductions,
        totalNetPay,
        processedRecords,
        pendingRecords
      };

      logger.info('Payroll summary generated', { 
        payrollPeriodId, 
        totalEmployees, 
        totalNetPay 
      });

      return summary;
    } catch (error) {
      logger.error('Error getting payroll summary', { 
        error: (error as Error).message, 
        payrollPeriodId 
      });
      throw error;
    }
  }

  async approvePayrollRecord(recordId: string, approverId: string): Promise<PayrollRecord | null> {
    try {
      const record = await payrollRecordModel.update(recordId, { status: 'processed' });
      
      if (record) {
        logger.info('Payroll record approved', { recordId, approverId });
      }

      return record;
    } catch (error) {
      logger.error('Error approving payroll record', { 
        error: (error as Error).message, 
        recordId, 
        approverId 
      });
      throw error;
    }
  }

  async markPayrollAsPaid(recordId: string): Promise<PayrollRecord | null> {
    try {
      const record = await payrollRecordModel.update(recordId, { status: 'paid' });
      
      if (record) {
        logger.info('Payroll record marked as paid', { recordId });
      }

      return record;
    } catch (error) {
      logger.error('Error marking payroll as paid', { 
        error: (error as Error).message, 
        recordId 
      });
      throw error;
    }
  }

  async exportPayrollRecords(format: 'csv' | 'pdf', params: any = {}): Promise<string | Buffer> {
    try {
      const records = await payrollRecordModel.findAllWithEmployee(params);
      
      if (format === 'csv') {
        return this.generateCSV(records.records);
      } else {
        return this.generatePDF(records.records);
      }
    } catch (error) {
      logger.error('Error exporting payroll records', { 
        error: (error as Error).message, 
        format,
        params 
      });
      throw error;
    }
  }

  private generateCSV(records: any[]): string {
    const headers = [
      'Employee ID',
      'Employee Name',
      'Period',
      'Base Salary',
      'Hours Worked',
      'Gross Pay',
      'Deductions',
      'Benefits',
      'Net Pay',
      'Status',
      'Created At'
    ];

    const rows = records.map(record => [
      record.employeeId,
      record.employeeName || 'N/A',
      record.periodName || 'N/A',
      record.baseSalary || 0,
      record.hoursWorked || 0,
      record.grossPay || 0,
      record.totalDeductions || 0,
      record.totalBenefits || 0,
      record.netPay || 0,
      record.status || 'draft',
      record.createdAt ? new Date(record.createdAt).toLocaleDateString() : 'N/A'
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  }

  private generatePDF(records: any[]): Buffer {
    // For now, return a simple text representation
    // In a real implementation, you would use a PDF library like puppeteer or pdfkit
    const content = records.map(record => 
      `${record.employeeName || 'N/A'} - ${record.periodName || 'N/A'} - ₱${record.netPay || 0}`
    ).join('\n');
    
    return Buffer.from(content, 'utf-8');
  }

  async getPayrollStats(): Promise<{
    totalEmployees: number;
    totalPayroll: number;
    processedPeriods: number;
    pendingPeriods: number;
  }> {
    try {
      // Get total employees
      const totalEmployees = await employeeModel.getTotalEmployeeCount();
      
      // Get total payroll (sum of all net pay from completed records)
      const totalPayrollResult = await payrollRecordModel.getTotalNetPay();
      const totalPayroll = totalPayrollResult || 0;
      
      // Get processed periods (completed status)
      const processedPeriods = await payrollPeriodModel.countByStatus(['completed']);
      
      // Get pending periods (draft status)
      const pendingPeriods = await payrollPeriodModel.countByStatus(['draft']);

      return {
        totalEmployees,
        totalPayroll,
        processedPeriods,
        pendingPeriods
      };
    } catch (error) {
      logger.error('Error getting payroll statistics', { 
        error: (error as Error).message 
      });
      throw error;
    }
  }

  // New methods for deduction types management
  async createDeductionType(data: any): Promise<any> {
    try {
      return await deductionTypeModel.create(data);
    } catch (error) {
      logger.error('Error creating deduction type', { error: (error as Error).message, data });
      throw error;
    }
  }

  async getDeductionTypes(params: any = {}): Promise<{ records: any[]; total: number }> {
    try {
      return await deductionTypeModel.findAll(params);
    } catch (error) {
      logger.error('Error getting deduction types', { error: (error as Error).message, params });
      throw error;
    }
  }

  async updateDeductionType(id: string, data: any): Promise<any> {
    try {
      return await deductionTypeModel.update(id, data);
    } catch (error) {
      logger.error('Error updating deduction type', { error: (error as Error).message, id, data });
      throw error;
    }
  }

  async deleteDeductionType(id: string): Promise<boolean> {
    try {
      return await deductionTypeModel.delete(id);
    } catch (error) {
      logger.error('Error deleting deduction type', { error: (error as Error).message, id });
      throw error;
    }
  }

  // New methods for benefit types management
  async createBenefitType(data: any): Promise<any> {
    try {
      return await benefitTypeModel.create(data);
    } catch (error) {
      logger.error('Error creating benefit type', { error: (error as Error).message, data });
      throw error;
    }
  }

  async getBenefitTypes(params: any = {}): Promise<{ records: any[]; total: number }> {
    try {
      return await benefitTypeModel.findAll(params);
    } catch (error) {
      logger.error('Error getting benefit types', { error: (error as Error).message, params });
      throw error;
    }
  }

  async updateBenefitType(id: string, data: any): Promise<any> {
    try {
      return await benefitTypeModel.update(id, data);
    } catch (error) {
      logger.error('Error updating benefit type', { error: (error as Error).message, id, data });
      throw error;
    }
  }

  async deleteBenefitType(id: string): Promise<boolean> {
    try {
      return await benefitTypeModel.delete(id);
    } catch (error) {
      logger.error('Error deleting benefit type', { error: (error as Error).message, id });
      throw error;
    }
  }

  // New methods for employee deduction balances management
  async getEmployeeDeductionBalances(params: any = {}): Promise<{ records: any[]; total: number }> {
    try {
      return await employeeDeductionBalanceModel.findAll(params);
    } catch (error) {
      logger.error('Error getting employee deduction balances', { error: (error as Error).message, params });
      throw error;
    }
  }

  async createEmployeeDeductionBalance(data: any): Promise<any> {
    try {
      return await employeeDeductionBalanceModel.create(data);
    } catch (error) {
      logger.error('Error creating employee deduction balance', { error: (error as Error).message, data });
      throw error;
    }
  }

  async updateEmployeeDeductionBalance(id: string, data: any): Promise<any> {
    try {
      return await employeeDeductionBalanceModel.update(id, data);
    } catch (error) {
      logger.error('Error updating employee deduction balance', { error: (error as Error).message, id, data });
      throw error;
    }
  }

  async deleteEmployeeDeductionBalance(id: string): Promise<boolean> {
    try {
      return await employeeDeductionBalanceModel.delete(id);
    } catch (error) {
      logger.error('Error deleting employee deduction balance', { error: (error as Error).message, id });
      throw error;
    }
  }

  // New methods for employee benefits management
  async getEmployeeBenefits(params: any = {}): Promise<{ records: any[]; total: number }> {
    try {
      return await employeeBenefitModel.findAll(params);
    } catch (error) {
      logger.error('Error getting employee benefits', { error: (error as Error).message, params });
      throw error;
    }
  }

  async createEmployeeBenefit(data: any): Promise<any> {
    try {
      return await employeeBenefitModel.create(data);
    } catch (error) {
      logger.error('Error creating employee benefit', { error: (error as Error).message, data });
      throw error;
    }
  }

  async updateEmployeeBenefit(id: string, data: any): Promise<any> {
    try {
      return await employeeBenefitModel.update(id, data);
    } catch (error) {
      logger.error('Error updating employee benefit', { error: (error as Error).message, id, data });
      throw error;
    }
  }

  async deleteEmployeeBenefit(id: string): Promise<boolean> {
    try {
      return await employeeBenefitModel.delete(id);
    } catch (error) {
      logger.error('Error deleting employee benefit', { error: (error as Error).message, id });
      throw error;
    }
  }

  // CSV upload for employee benefits
  async uploadEmployeeBenefits(csvData: any[]): Promise<{ success: number; errors: any[] }> {
    try {
      const errors: any[] = [];
      const successData: any[] = [];

      for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];
        try {
          // Validate required fields
          if (!row.employee_name || !row.employee_id || !row.benefit_type_name || !row.benefit_type_id || !row.amount) {
            errors.push({
              row: i + 1,
              error: 'Missing required fields: employee_name, employee_id, benefit_type_name, benefit_type_id, amount'
            });
            continue;
          }

          // Find employee by employee_id
          const employee = await employeeModel.findByEmployeeId(row.employee_id);
          if (!employee) {
            errors.push({
              row: i + 1,
              error: `Employee not found: ${row.employee_id}`
            });
            continue;
          }

          // Find benefit type by UUID
          const benefitType = await benefitTypeModel.findById(row.benefit_type_id);
          if (!benefitType) {
            errors.push({
              row: i + 1,
              error: `Benefit type not found: ${row.benefit_type_id}`
            });
            continue;
          }

          // Check if record already exists (unique constraint: employee_id, benefit_type_id, start_date)
          const existingRecord = await employeeBenefitModel.findByEmployeeAndBenefitTypeAndDate(
            employee.id, 
            benefitType.id, 
            new Date(row.start_date || new Date())
          );
          
          if (existingRecord) {
            errors.push({
              row: i + 1,
              error: `Record already exists for employee ${row.employee_id} with benefit type ${row.benefit_type_name} on ${row.start_date}`
            });
            continue;
          }

          // Prepare data for creation
          const benefitData = {
            employee_id: employee.id,
            benefit_type_id: benefitType.id,
            amount: parseFloat(row.amount),
            start_date: new Date(row.start_date || new Date()),
            end_date: row.end_date ? new Date(row.end_date) : null,
            is_active: row.is_active !== 'false'
          };

          successData.push(benefitData);
        } catch (error) {
          errors.push({
            row: i + 1,
            error: (error as Error).message
          });
        }
      }

      // Bulk create successful records
      if (successData.length > 0) {
        await employeeBenefitModel.bulkCreate(successData);
      }

      logger.info('Employee benefits uploaded', { 
        success: successData.length, 
        errors: errors.length 
      });

      return {
        success: successData.length,
        errors
      };
    } catch (error) {
      logger.error('Error uploading employee benefits', { error: (error as Error).message });
      throw error;
    }
  }

  // CSV upload for employee deduction balances
  async uploadEmployeeDeductionBalances(csvData: any[]): Promise<{ success: number; errors: any[] }> {
    try {
      const errors: any[] = [];
      const successData: any[] = [];

      for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];
        try {
          // Validate required fields
          if (!row.employee_name || !row.employee_id || !row.deduction_type_name || !row.remaining_balance) {
            errors.push({
              row: i + 1,
              error: 'Missing required fields: employee_name, employee_id, deduction_type_name, remaining_balance'
            });
            continue;
          }

          // Find employee by employee_id
          const employee = await employeeModel.findByEmployeeId(row.employee_id);
          if (!employee) {
            errors.push({
              row: i + 1,
              error: `Employee not found: ${row.employee_id}`
            });
            continue;
          }

          // Find deduction type by UUID
          const deductionType = await deductionTypeModel.findById(row.deduction_type_id);
          if (!deductionType) {
            errors.push({
              row: i + 1,
              error: `Deduction type not found: ${row.deduction_type_id}`
            });
            continue;
          }

          // Check if record already exists (unique constraint: employee_id, deduction_type_id, start_date)
          const existingRecord = await employeeDeductionBalanceModel.findByEmployeeAndDeductionTypeAndDate(
            employee.id, 
            deductionType.id, 
            new Date(row.start_date || new Date())
          );
          
          if (existingRecord) {
            errors.push({
              row: i + 1,
              error: `Record already exists for employee ${row.employee_id} with deduction type ${row.deduction_type_name} on ${row.start_date}`
            });
            continue;
          }

          // Prepare data for creation
          const balanceData = {
            employee_id: employee.id,
            deduction_type_id: deductionType.id,
            original_amount: parseFloat(row.remaining_balance),
            remaining_balance: parseFloat(row.remaining_balance),
            monthly_deduction_amount: parseFloat(row.monthly_deduction_amount || '0'),
            start_date: new Date(row.start_date || new Date()),
            end_date: row.end_date ? new Date(row.end_date) : null,
            is_active: row.is_active !== 'false'
          };

          successData.push(balanceData);
        } catch (error) {
          errors.push({
            row: i + 1,
            error: (error as Error).message
          });
        }
      }

      // Bulk create successful records
      if (successData.length > 0) {
        await employeeDeductionBalanceModel.bulkCreate(successData);
      }

      logger.info('Employee deduction balances uploaded', { 
        success: successData.length, 
        errors: errors.length 
      });

      return {
        success: successData.length,
        errors
      };
    } catch (error) {
      logger.error('Error uploading employee deduction balances', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Calculate working days between two dates (excluding weekends)
   * @param startDate Start date
   * @param endDate End date
   * @returns Number of working days
   */
  private calculateWorkingDays(startDate: Date, endDate: Date): number {
    let workingDays = 0;
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      // Check if it's not a weekend (Saturday = 6, Sunday = 0)
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
        workingDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return workingDays;
  }

  /**
   * Generate payroll records for all departments
   * This creates separate payroll records for each department
   */
  async generatePayrollRecordsForAllDepartments(payrollPeriodId: string): Promise<{ departmentId: string; records: PayrollRecord[] }[]> {
    try {
      // Get all departments with active employees
      const { getPool } = await import('../../config/database');
      const pool = getPool();
      
      const departmentsQuery = `
        SELECT DISTINCT d.id, d.name
        FROM departments d
        INNER JOIN employees e ON d.id = e.department_id
        WHERE e.status = 'active' AND d.is_active = true
        ORDER BY d.name
      `;
      
      const departmentsResult = await pool.query(departmentsQuery);
      const departmentResults: { departmentId: string; records: PayrollRecord[] }[] = [];

      // Generate payroll records for each department
      for (const department of departmentsResult.rows) {
        const records = await this.generatePayrollRecords(payrollPeriodId, department.id);
        departmentResults.push({
          departmentId: department.id,
          records
        });
        
        logger.info(`Generated ${records.length} payroll records for department: ${department.name}`);
      }

      return departmentResults;
    } catch (error) {
      logger.error('Error generating payroll records for all departments:', error);
      throw error;
    }
  }

  async getPayrollRecordsByDepartmentAndPeriod(departmentId: string, periodId: string): Promise<PayrollRecord[]> {
    try {
      const { getPool } = await import('../../config/database');
      const pool = getPool();
      
      const query = `
        SELECT 
          pr.*,
          u.first_name,
          u.last_name,
          e.employee_id,
          e.position,
          e.department_id,
          d.name as department_name,
          pp.period_name
        FROM payroll_records pr
        INNER JOIN employees e ON pr.employee_id = e.id
        INNER JOIN users u ON e.user_id = u.id
        INNER JOIN departments d ON e.department_id = d.id
        INNER JOIN payroll_periods pp ON pr.payroll_period_id = pp.id
        WHERE pr.payroll_period_id = $1 AND e.department_id = $2
        ORDER BY u.first_name, u.last_name
      `;
      
      const result = await pool.query(query, [periodId, departmentId]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting payroll records by department and period:', error);
      throw error;
    }
  }

  async generatePaystubsPDF(records: any[]): Promise<Buffer> {
    try {
      // For now, we'll create a simple PDF using a basic approach
      // In a real implementation, you'd use a library like puppeteer, jsPDF, or PDFKit
      
      const PDFDocument = require('pdfkit');
      const doc = new PDFDocument();
      const buffers: Buffer[] = [];
      
      doc.on('data', buffers.push.bind(buffers));
      
      // Add each employee's paystub as a separate page
      records.forEach((record, index) => {
        if (index > 0) {
          doc.addPage();
        }
        
        // Company header
        doc.fontSize(20).text('PAYSTUB', 50, 50);
        doc.fontSize(12).text(`Period: ${record.period_name}`, 50, 80);
        doc.text(`Department: ${record.department_name}`, 50, 100);
        
        // Employee information
        doc.fontSize(16).text('Employee Information', 50, 140);
        doc.fontSize(12)
          .text(`Name: ${record.first_name} ${record.last_name}`, 50, 170)
          .text(`Employee ID: ${record.employee_id}`, 50, 190)
          .text(`Position: ${record.position}`, 50, 210);
        
        // Payroll details
        doc.fontSize(16).text('Payroll Details', 50, 250);
        doc.fontSize(12)
          .text(`Base Salary: ₱${record.base_salary?.toFixed(2) || '0.00'}`, 50, 280)
          .text(`Regular Hours: ${record.total_regular_hours || 0}`, 50, 300)
          .text(`Overtime Hours: ${record.total_overtime_hours || 0}`, 50, 320)
          .text(`Gross Pay: ₱${record.gross_pay?.toFixed(2) || '0.00'}`, 50, 340)
          .text(`Total Deductions: ₱${record.total_deductions?.toFixed(2) || '0.00'}`, 50, 360)
          .text(`Late Deductions: ₱${record.late_deductions?.toFixed(2) || '0.00'}`, 50, 380)
          .text(`Benefits: ₱${record.total_benefits?.toFixed(2) || '0.00'}`, 50, 400);
        
        // Net pay
        doc.fontSize(14).text(`Net Pay: ₱${record.net_pay?.toFixed(2) || '0.00'}`, 50, 440, { bold: true });
        
        // Footer
        doc.fontSize(10).text('Generated on: ' + new Date().toLocaleDateString(), 50, 500);
      });
      
      doc.end();
      
      return new Promise((resolve, reject) => {
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });
        doc.on('error', reject);
      });
    } catch (error) {
      logger.error('Error generating paystubs PDF:', error);
      throw error;
    }
  }
}

export const payrollService = new PayrollService();