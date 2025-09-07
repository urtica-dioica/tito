import { payrollPeriodModel, PayrollPeriod, CreatePayrollPeriodData } from '../../models/payroll/PayrollPeriod';
import { payrollRecordModel, PayrollRecord, PayrollRecordWithEmployee } from '../../models/payroll/PayrollRecord';
import { payrollDeductionModel } from '../../models/payroll/PayrollDeduction';
import { deductionTypeModel } from '../../models/payroll/DeductionType';
import { employeeModel } from '../../models/hr/Employee';
// import { attendanceRecordModel } from '../../models/attendance/AttendanceRecord';
// import { overtimeRequestModel } from '../../models/attendance/OvertimeRequest';
import { systemSettingsModel } from '../../models/hr/SystemSettings';
import logger from '../../utils/logger';

export interface PayrollCalculationData {
  employeeId: string;
  payrollPeriodId: string;
  baseSalary: number;
  regularHours: number;
  overtimeHours: number;
  deductions: Array<{
    type: string;
    amount: number;
    percentage?: number;
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
  regularHours: number;
  overtimeHours: number;
  regularPay: number;
  overtimePay: number;
  grossPay: number;
  deductions: Array<{
    type: string;
    amount: number;
  }>;
  totalDeductions: number;
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

      // Get system settings
      const expectedHoursSetting = await systemSettingsModel.findByKey('expected_monthly_hours');
      const expectedHours = expectedHoursSetting ? parseInt(expectedHoursSetting.setting_value) : 176;

      // Calculate regular hours from attendance
      // Note: We'll need to implement findByEmployeeAndDateRange or use a different approach
      const attendanceRecords: any[] = []; // Placeholder for now

      let totalRegularHours = 0;
      let totalOvertimeHours = 0;

      for (const record of attendanceRecords) {
        if (record.overallStatus === 'present' || record.overallStatus === 'late') {
          // Calculate hours for this day (assuming 8 hours per day)
          totalRegularHours += 8;
        }
      }

      // Get approved overtime hours for the period
      // Note: We'll need to implement findByEmployeeAndDateRange or use a different approach
      const overtimeRequests: any[] = []; // Placeholder for now

      for (const request of overtimeRequests) {
        if (request.status === 'approved') {
          totalOvertimeHours += request.requested_hours;
        }
      }

      // Calculate hourly rate
      const hourlyRate = employee.base_salary / expectedHours;

      // Calculate regular pay
      const regularPay = Math.min(totalRegularHours, expectedHours) * hourlyRate;

      // Calculate overtime pay (1.5x rate)
      const overtimePay = totalOvertimeHours * hourlyRate * 1.5;

      // Calculate gross pay
      const grossPay = regularPay + overtimePay;

      // Get deduction types and calculate deductions
      const deductionTypes = await deductionTypeModel.findActive();
      const deductions: Array<{ type: string; amount: number }> = [];
      let totalDeductions = 0;

      for (const deductionType of deductionTypes) {
        let deductionAmount = 0;

        if (deductionType.percentage) {
          deductionAmount = grossPay * (deductionType.percentage / 100);
        } else if (deductionType.fixed_amount) {
          deductionAmount = deductionType.fixed_amount;
        }

        if (deductionAmount > 0) {
          deductions.push({
            type: deductionType.name,
            amount: deductionAmount
          });
          totalDeductions += deductionAmount;
        }
      }

      // Calculate net pay
      const netPay = grossPay - totalDeductions;

      const payrollData: EmployeePayrollData = {
        employee: {
          id: employee.id,
          employee_id: employee.employee_id,
          name: `${employee.user.first_name} ${employee.user.last_name}`,
          department: employee.department?.name || 'N/A'
        },
        baseSalary: employee.base_salary,
        regularHours: totalRegularHours,
        overtimeHours: totalOvertimeHours,
        regularPay,
        overtimePay,
        grossPay,
        deductions,
        totalDeductions,
        netPay
      };

      logger.info('Employee payroll calculated', { 
        employeeId, 
        payrollPeriodId, 
        grossPay, 
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

  async generatePayrollRecords(payrollPeriodId: string): Promise<PayrollRecord[]> {
    try {
      // Get all active employees
      const employees = await employeeModel.findAll({ status: 'active' });
      const records: PayrollRecord[] = [];

      for (const employee of employees.employees) {
        // Calculate payroll for this employee
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
            regular_hours: payrollData.regularHours,
            hourly_rate: payrollData.baseSalary / 176, // Assuming 176 hours per month
            regular_pay: payrollData.regularPay,
            overtime_hours: payrollData.overtimeHours,
            overtime_pay: payrollData.overtimePay,
            total_pay: payrollData.grossPay,
            net_pay: payrollData.netPay,
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
            regular_hours: payrollData.regularHours,
            hourly_rate: payrollData.baseSalary / 176,
            regular_pay: payrollData.regularPay,
            overtime_hours: payrollData.overtimeHours,
            overtime_pay: payrollData.overtimePay,
            total_pay: payrollData.grossPay,
            net_pay: payrollData.netPay,
            status: 'draft'
          });

          records.push(newRecord);
        }

        // Create deduction records
        const record = records[records.length - 1];
        if (record) {
          // Delete existing deductions
          await payrollDeductionModel.deleteByPayrollRecord(record.id);

          // Create new deductions
          for (const deduction of payrollData.deductions) {
            await payrollDeductionModel.create({
              payroll_record_id: record.id,
              deduction_type: deduction.type,
              amount: deduction.amount
            });
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
      const totalGrossPay = records.reduce((sum, record) => sum + record.total_pay, 0);
      
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
}

export const payrollService = new PayrollService();