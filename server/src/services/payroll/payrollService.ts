import { payrollPeriodModel, PayrollPeriod, CreatePayrollPeriodData } from '../../models/payroll/PayrollPeriod';
import { payrollRecordModel, PayrollRecord, PayrollRecordWithEmployee } from '../../models/payroll/PayrollRecord';
import { payrollDeductionModel } from '../../models/payroll/PayrollDeduction';
import { deductionTypeModel } from '../../models/payroll/DeductionType';
import { employeeDeductionBalanceModel } from '../../models/payroll/EmployeeDeductionBalance';
import { benefitTypeModel } from '../../models/payroll/BenefitType';
import { employeeBenefitModel } from '../../models/payroll/EmployeeBenefit';
import { employeeModel } from '../../models/hr/Employee';
import { getPool } from '../../config/database';
import { isLeaveTypePaid, getLeavePaymentPercentage, getMaxPaidDaysPerYear } from '../../config/leavePolicies';
// import { attendanceRecordModel } from '../../models/attendance/AttendanceRecord';
import { attendanceSessionModel } from '../../models/attendance/AttendanceSession';
// import { overtimeRequestModel } from '../../models/attendance/OvertimeRequest';
// import { systemSettingsModel } from '../../models/hr/SystemSettings'; // Temporarily disabled
import logger from '../../utils/logger';
import { defaultHoursCalculator } from '../../utils/attendanceHoursCalculator';

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
  paidLeaveHours: number; // Hours from approved leave days
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

      // Get attendance data using the mathematical formulation
      // This uses grace periods, session caps, and proper morning/afternoon calculations
      const attendanceData = await this.calculateAttendanceHours(
        employeeId, 
        period.start_date, 
        period.end_date
      );
      
      const totalWorkedHours = attendanceData.totalWorkedHours;
      const totalRegularHours = attendanceData.totalRegularHours;
      const totalOvertimeHours = attendanceData.totalOvertimeHours;
      const totalLateHours = attendanceData.totalLateHours;

      // Get approved leave days for the payroll period
      const paidLeaveHours = await this.getPaidLeaveHours(employeeId, startDate, endDate);

      // Debug logging for payroll calculation
      logger.info('Payroll calculation debug', {
        employeeId,
        payrollPeriodId,
        attendanceData: attendanceData,
        totalWorkedHours,
        totalRegularHours,
        totalOvertimeHours,
        totalLateHours,
        expectedHours,
        baseSalary: employee.base_salary
      });

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

      // Calculate gross pay based on worked hours + paid leave hours: (total paid hours / total working hours in month) * base salary
      // Include approved leave days as paid time
      const totalPaidHours = totalWorkedHours + paidLeaveHours;
      const grossPay = expectedHours > 0 ? (totalPaidHours / expectedHours) * baseSalary : 0;
      
      // Calculate net pay: gross pay + benefits - deductions
      const netPay = grossPay + totalBenefits - totalEmployeeDeductions - lateDeductions;

      // Debug logging for gross pay calculation
      logger.info('Gross pay calculation debug', {
        employeeId,
        totalWorkedHours,
        paidLeaveHours,
        totalPaidHours,
        expectedHours,
        baseSalary,
        grossPay,
        totalBenefits,
        totalEmployeeDeductions,
        lateDeductions,
        netPay
      });

      const payrollData: EmployeePayrollData = {
        employee: {
          id: employee.id,
          employee_id: employee.employee_id,
          name: `${employee.user.first_name} ${employee.user.last_name}`,
          department: employee.department?.name || 'N/A'
        },
        baseSalary: baseSalary, // Full monthly base salary
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
        netPay,
        paidLeaveHours // Add paid leave hours to the response
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

      if (employees.employees.length === 0) {
        return [];
      }

      const employeeIds = employees.employees.map(emp => emp.id);
      const records: PayrollRecord[] = [];

      // Bulk calculate payroll data for all employees
      const payrollCalculations = await Promise.all(
        employees.employees.map(employee =>
          this.calculateEmployeePayroll(employee.id, payrollPeriodId)
        )
      );

      // Check existing records in bulk
      const existingRecords = await getPool().query(`
        SELECT id, employee_id
        FROM payroll_records
        WHERE payroll_period_id = $1 AND employee_id = ANY($2)
      `, [payrollPeriodId, employeeIds]);

      const existingRecordMap = new Map(
        existingRecords.rows.map(record => [record.employee_id, record.id])
      );

      // Process each employee
      for (let i = 0; i < employees.employees.length; i++) {
        const employee = employees.employees[i];
        const payrollData = payrollCalculations[i];
        const existingRecordId = existingRecordMap.get(employee.id);

        if (existingRecordId) {
          // Update existing record
          const updatedRecord = await payrollRecordModel.update(existingRecordId, {
            base_salary: payrollData.baseSalary,
            total_worked_hours: payrollData.totalWorkedHours,
            hourly_rate: payrollData.hourlyRate,
            total_regular_hours: payrollData.totalRegularHours,
            total_overtime_hours: payrollData.totalOvertimeHours,
            total_late_hours: payrollData.totalLateHours,
            late_deductions: payrollData.lateDeductions,
            paid_leave_hours: payrollData.paidLeaveHours,
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
            paid_leave_hours: payrollData.paidLeaveHours,
            gross_pay: payrollData.grossPay,
            net_pay: payrollData.netPay,
            total_deductions: payrollData.totalDeductions,
            total_benefits: payrollData.totalBenefits,
            status: 'draft'
          });

          records.push(newRecord);
        }
      }

      // Bulk process deductions and balances
      await this.processPayrollDeductionsBulk(records, payrollCalculations, employees.employees);

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

  /**
   * Process payroll deductions in bulk to avoid N+1 queries
   */
  private async processPayrollDeductionsBulk(
    records: PayrollRecord[],
    payrollCalculations: any[],
    employees: any[]
  ): Promise<void> {
    // Collect all deduction operations
    const deductionOperations: Array<{
      recordId: string;
      employeeId: string;
      deductions: any[];
    }> = [];

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const payrollData = payrollCalculations[i];
      const employee = employees[i];

      if (payrollData.employeeDeductions.length > 0) {
        deductionOperations.push({
          recordId: record.id,
          employeeId: employee.id,
          deductions: payrollData.employeeDeductions
        });
      }
    }

    if (deductionOperations.length === 0) {
      return;
    }

    // Bulk delete existing deductions
    const recordIds = deductionOperations.map(op => op.recordId);
    await getPool().query(
      'DELETE FROM payroll_deductions WHERE payroll_record_id = ANY($1)',
      [recordIds]
    );

    // Bulk create new deductions
    const deductionInserts = [];
    for (const operation of deductionOperations) {
      for (const deduction of operation.deductions) {
        const deductionType = await deductionTypeModel.findByName(deduction.type);
        if (deductionType) {
          deductionInserts.push({
            payroll_record_id: operation.recordId,
            deduction_type_id: deductionType.id,
            name: deduction.type,
            amount: deduction.amount
          });
        }
      }
    }

    if (deductionInserts.length > 0) {
      const values = deductionInserts.map((_, index) =>
        `($${index * 4 + 1}, $${index * 4 + 2}, $${index * 4 + 3}, $${index * 4 + 4})`
      ).join(', ');

      const params = deductionInserts.flatMap(d => [
        d.payroll_record_id, d.deduction_type_id, d.name, d.amount
      ]);

      await getPool().query(`
        INSERT INTO payroll_deductions (payroll_record_id, deduction_type_id, name, amount)
        VALUES ${values}
      `, params);
    }

    // Bulk update employee deduction balances
    for (const operation of deductionOperations) {
      for (const deduction of operation.deductions) {
        const deductionType = await deductionTypeModel.findByName(deduction.type);
        if (deductionType) {
          const employeeDeductionBalances = await employeeDeductionBalanceModel.findByEmployee(operation.employeeId);
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

  async getPayrollRecords(params: any = {}): Promise<{ records: PayrollRecordWithEmployee[]; total: number }> {
    try {
      return await payrollRecordModel.findAllWithEmployee(params);
    } catch (error) {
      logger.error('Error getting payroll records', { error: (error as Error).message, params });
      throw error;
    }
  }

  /**
   * Update payroll record status
   */
  async updatePayrollRecordStatus(recordId: string, status: 'draft' | 'processed' | 'paid'): Promise<PayrollRecord> {
    try {
      const updatedRecord = await payrollRecordModel.update(recordId, { status });
      if (!updatedRecord) {
        throw new Error('Payroll record not found');
      }

      logger.info('Payroll record status updated', {
        recordId,
        status,
        employeeId: updatedRecord.employee_id
      });

      return updatedRecord;
    } catch (error) {
      logger.error('Error updating payroll record status', { 
        error: (error as Error).message, 
        recordId, 
        status 
      });
      throw error;
    }
  }

  /**
   * Mark payroll period as completed (when all departments have approved)
   */
  async completePayrollPeriod(periodId: string): Promise<PayrollPeriod> {
    try {
      const updatedPeriod = await payrollPeriodModel.update(periodId, { status: 'completed' });
      if (!updatedPeriod) {
        throw new Error('Payroll period not found');
      }

      logger.info('Payroll period marked as completed', {
        periodId,
        periodName: updatedPeriod.period_name
      });

      return updatedPeriod;
    } catch (error) {
      logger.error('Error completing payroll period', { 
        error: (error as Error).message, 
        periodId 
      });
      throw error;
    }
  }

  /**
   * Bulk update payroll records to paid status
   */
  async bulkUpdatePayrollRecordsToPaid(options: {
    periodId?: string;
    departmentId?: string;
    recordIds?: string[];
  }): Promise<{ updatedCount: number }> {
    try {
      const { getPool } = await import('../../config/database');
      const pool = getPool();

      let whereClause = '';
      const params: any[] = [];
      let paramIndex = 1;

      if (options.periodId) {
        whereClause += ` WHERE payroll_period_id = $${paramIndex}`;
        params.push(options.periodId);
        paramIndex++;
      }

      if (options.departmentId) {
        whereClause += options.periodId ? ' AND' : ' WHERE';
        whereClause += ` employee_id IN (SELECT id FROM employees WHERE department_id = $${paramIndex})`;
        params.push(options.departmentId);
        paramIndex++;
      }

      if (options.recordIds && options.recordIds.length > 0) {
        whereClause += options.periodId || options.departmentId ? ' AND' : ' WHERE';
        whereClause += ` id = ANY($${paramIndex})`;
        params.push(options.recordIds);
        paramIndex++;
      }

      const updateQuery = `
        UPDATE payroll_records 
        SET status = 'paid', updated_at = CURRENT_TIMESTAMP
        ${whereClause}
      `;

      const result = await pool.query(updateQuery, params);

      logger.info('Bulk updated payroll records to paid', {
        updatedCount: result.rowCount,
        options
      });

      // If updating by periodId, check if all records in the period are now paid
      if (options.periodId) {
        await this.checkAndCompletePayrollPeriod(options.periodId);
      }

      return { updatedCount: result.rowCount || 0 };
    } catch (error) {
      logger.error('Error bulk updating payroll records to paid', { 
        error: (error as Error).message, 
        options 
      });
      throw error;
    }
  }

  /**
   * Check if all payroll records in a period are paid and auto-complete the period
   */
  async checkAndCompletePayrollPeriod(periodId: string): Promise<void> {
    try {
      const { getPool } = await import('../../config/database');
      const pool = getPool();

      // Check if all records in the period are paid
      const checkQuery = `
        SELECT 
          COUNT(*) as total_records,
          COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_records
        FROM payroll_records 
        WHERE payroll_period_id = $1
      `;
      
      const result = await pool.query(checkQuery, [periodId]);
      const { total_records, paid_records } = result.rows[0];
      
      // If all records are paid, complete the period
      if (total_records > 0 && parseInt(total_records) === parseInt(paid_records)) {
        await this.completePayrollPeriod(periodId);
        logger.info(`Auto-completed payroll period ${periodId} - all records are paid`);
      }
    } catch (error) {
      logger.error('Error checking and completing payroll period', { 
        error: (error as Error).message, 
        periodId 
      });
    }
  }




  /**
   * Bulk update payroll records status for a period
   */
  async bulkUpdatePayrollRecordsStatus(
    payrollPeriodId: string, 
    status: 'draft' | 'processed' | 'paid',
    departmentId?: string
  ): Promise<PayrollRecord[]> {
    try {
      // Get all records for the period
      const { records } = await payrollRecordModel.findAllWithEmployee({
        payroll_period_id: payrollPeriodId,
        department_id: departmentId
      });

      // Update each record
      const updatedRecords: PayrollRecord[] = [];
      for (const record of records) {
        const updatedRecord = await payrollRecordModel.update(record.id, { status });
        if (updatedRecord) {
          updatedRecords.push(updatedRecord);
        }
      }

      logger.info('Bulk payroll records status updated', {
        payrollPeriodId,
        status,
        departmentId,
        updatedCount: updatedRecords.length
      });

      return updatedRecords;
    } catch (error) {
      logger.error('Error bulk updating payroll records status', { 
        error: (error as Error).message, 
        payrollPeriodId, 
        status,
        departmentId
      });
      throw error;
    }
  }

  /**
   * Reprocess payroll records for a period (clears existing records and regenerates)
   */
  async reprocessPayrollRecords(payrollPeriodId: string, departmentId?: string): Promise<PayrollRecord[]> {
    try {
      logger.info('Starting payroll reprocessing', {
        payrollPeriodId,
        departmentId
      });

      // First, delete existing payroll records for this period
      const existingRecords = await payrollRecordModel.findAllWithEmployee({
        payroll_period_id: payrollPeriodId,
        department_id: departmentId
      });

      for (const record of existingRecords.records) {
        // Delete associated payroll deductions first
        await payrollDeductionModel.deleteByPayrollRecord(record.id);
        // Delete the payroll record
        await payrollRecordModel.delete(record.id);
      }

      logger.info('Cleared existing payroll records', {
        payrollPeriodId,
        departmentId,
        deletedCount: existingRecords.records.length
      });

      // Reset approval status for this period (if reprocessing all departments)
      if (!departmentId) {
        const { PayrollApprovalService } = await import('./payrollApprovalService');
        const payrollApprovalService = new PayrollApprovalService();
        await payrollApprovalService.resetApprovalStatusForPeriod(payrollPeriodId);
        logger.info('Reset approval status for payroll period', { payrollPeriodId });
      }

      // Now regenerate the payroll records
      const newRecords = await this.generatePayrollRecords(payrollPeriodId, departmentId);

      logger.info('Payroll reprocessing completed', {
        payrollPeriodId,
        departmentId,
        newRecordCount: newRecords.length
      });

      return newRecords;
    } catch (error) {
      logger.error('Error reprocessing payroll records', { 
        error: (error as Error).message, 
        payrollPeriodId, 
        departmentId
      });
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

      // Optimized query to get records with deductions in a single query
      const recordsWithDeductions = await getPool().query(`
        SELECT
          pr.*,
          COALESCE(SUM(pd.amount), 0) as total_deductions_calculated
        FROM payroll_records pr
        LEFT JOIN payroll_deductions pd ON pr.id = pd.payroll_record_id
        WHERE pr.payroll_period_id = $1
        GROUP BY pr.id
      `, [payrollPeriodId]);

      const records = recordsWithDeductions.rows;

      const totalEmployees = records.length;
      const totalGrossPay = records.reduce((sum, record) => sum + Number(record.gross_pay), 0);

      let totalDeductions = 0;
      let processedRecords = 0;
      let pendingRecords = 0;

      for (const record of records) {
        totalDeductions += Number(record.total_deductions_calculated);

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
   * Calculate attendance hours using the mathematical formulation
   */
  private async calculateAttendanceHours(employeeId: string, startDate: Date, endDate: Date): Promise<{
    totalWorkedHours: number;
    totalRegularHours: number;
    totalOvertimeHours: number;
    totalLateHours: number;
    totalWorkingDays: number;
  }> {
    const pool = getPool();
    
    // Get all attendance records for the period
    const attendanceQuery = `
      SELECT ar.id, ar.date, ar.overall_status
      FROM attendance_records ar
      WHERE ar.employee_id = $1 
        AND ar.date >= $2 
        AND ar.date <= $3
        AND ar.overall_status IN ('present', 'late', 'partial')
      ORDER BY ar.date
    `;

    const result = await pool.query(attendanceQuery, [employeeId, startDate, endDate]);
    const attendanceRecords = result.rows;

    let totalWorkedHours = 0;
    let totalRegularHours = 0;
    let totalOvertimeHours = 0;
    let totalLateHours = 0;
    let totalWorkingDays = attendanceRecords.length;

    // Calculate hours for each attendance record using the new formula
    for (const record of attendanceRecords) {
      const sessions = await attendanceSessionModel.getSessionsByAttendanceRecord(record.id);
      const hoursResult = defaultHoursCalculator.calculateFromSessions(sessions);

      totalWorkedHours += hoursResult.totalHours;

      // Calculate regular and overtime hours (8 hours per day is regular)
      if (hoursResult.totalHours <= 8) {
        totalRegularHours += hoursResult.totalHours;
      } else {
        totalRegularHours += 8;
        totalOvertimeHours += (hoursResult.totalHours - 8);
      }

      // Log the calculation for debugging
      logger.info('Payroll hours calculation', {
        employeeId,
        date: record.date,
        morningHours: hoursResult.morningHours,
        afternoonHours: hoursResult.afternoonHours,
        totalHours: hoursResult.totalHours,
        regularHours: Math.min(hoursResult.totalHours, 8),
        overtimeHours: Math.max(0, hoursResult.totalHours - 8),
        effectiveMorningStart: hoursResult.effectiveMorningStart,
        effectiveAfternoonStart: hoursResult.effectiveAfternoonStart
      });
    }

    return {
      totalWorkedHours: Math.round(totalWorkedHours * 100) / 100,
      totalRegularHours: Math.round(totalRegularHours * 100) / 100,
      totalOvertimeHours: Math.round(totalOvertimeHours * 100) / 100, // Fixed: was hardcoded to 0
      totalLateHours: Math.round(totalLateHours * 100) / 100,
      totalWorkingDays
    };
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

  /**
   * Get paid leave hours for an employee within a payroll period
   * This method uses the leave payment policies to determine which leave types are paid
   * and calculates the total hours with proper payment percentages
   */
  private async getPaidLeaveHours(employeeId: string, startDate: Date, endDate: Date): Promise<number> {
    try {
      const { getPool } = await import('../../config/database');
      const pool = getPool();

      // Get all approved leave days within the payroll period
      const leaveQuery = `
        SELECT 
          leave_type,
          start_date,
          end_date,
          (end_date - start_date + 1) as total_days
        FROM leaves
        WHERE employee_id = $1 
          AND status = 'approved'
          AND (
            (start_date <= $2 AND end_date >= $3) OR  -- Leave spans the period
            (start_date >= $3 AND start_date <= $2) OR  -- Leave starts within period
            (end_date >= $3 AND end_date <= $2)  -- Leave ends within period
          )
      `;

      const result = await pool.query(leaveQuery, [
        employeeId,
        endDate,
        startDate
      ]);

      let totalPaidHours = 0;
      
      for (const leave of result.rows) {
        const leaveType = leave.leave_type;
        const leaveDays = parseFloat(leave.total_days) || 0;
        
        // Check if this leave type is paid
        if (!isLeaveTypePaid(leaveType)) {
          logger.info('Unpaid leave skipped', {
            employeeId,
            leaveType,
            days: leaveDays
          });
          continue;
        }

        // Get payment percentage for this leave type
        const paymentPercentage = getLeavePaymentPercentage(leaveType);
        const maxPaidDaysPerYear = getMaxPaidDaysPerYear(leaveType);
        
        // Calculate paid days (considering yearly limits if applicable)
        let paidDays = leaveDays;
        if (maxPaidDaysPerYear) {
          // LIMITATION: Yearly limit checking not implemented
          // This would require tracking used days per year across payroll periods
          // Current behavior: Uses full leave days without yearly limit enforcement
          logger.info('Yearly limit check not implemented - using full leave days', {
            leaveType,
            maxPaidDaysPerYear,
            requestedDays: leaveDays,
            limitation: 'yearly_limit_check_not_implemented'
          });
        }
        
        // Calculate paid hours with payment percentage
        const paidHours = (paidDays * 8 * paymentPercentage) / 100; // 8 hours per working day
        totalPaidHours += paidHours;
        
        logger.info('Paid leave calculated', {
          employeeId,
          leaveType,
          startDate: leave.start_date,
          endDate: leave.end_date,
          totalDays: leaveDays,
          paidDays,
          paymentPercentage,
          paidHours,
          maxPaidDaysPerYear
        });
      }

      logger.info('Total paid leave hours calculated', {
        employeeId,
        startDate,
        endDate,
        totalPaidHours,
        leaveCount: result.rows.length
      });

      return totalPaidHours;
    } catch (error) {
      logger.error('Error calculating paid leave hours', {
        error: (error as Error).message,
        employeeId,
        startDate,
        endDate
      });
      throw error;
    }
  }

  /**
   * Export all employee paystubs for a period as PDF
   */
  async exportPeriodPaystubsPDF(periodId: string): Promise<Buffer> {
    try {
      const PDFDocument = require('pdfkit');
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));

      // Get payroll period information
      const period = await payrollPeriodModel.findById(periodId);
      if (!period) {
        throw new Error('Payroll period not found');
      }

      // Get all payroll records for the period
      const result = await payrollRecordModel.findAllWithEmployee({ payroll_period_id: periodId, limit: 1000 });
      const records = result.records;

      // Add title page
      doc.fontSize(20).text('PAYROLL PAYSTUBS', { align: 'center' });
      doc.fontSize(16).text(`Period: ${period.period_name}`, { align: 'center' });
      doc.fontSize(12).text(`From: ${this.formatDate(period.start_date)} To: ${this.formatDate(period.end_date)}`, { align: 'center' });
      doc.moveDown(2);

      // Generate paystub for each employee
      for (const record of records) {
        try {
          this.addPaystubPage(doc, record, period);
        } catch (error) {
          logger.error('Error adding paystub page', { 
            error: (error as Error).message, 
            recordId: record.id,
            employeeId: record.employee_id
          });
          // Continue with next record instead of failing completely
        }
      }

      doc.end();

      return new Promise((resolve, reject) => {
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });
        doc.on('error', reject);
      });
    } catch (error) {
      logger.error('Error exporting period paystubs PDF', { 
        error: (error as Error).message, 
        periodId 
      });
      throw error;
    }
  }

  /**
   * Export department employee paystubs for a period as PDF
   */
  async exportDepartmentPaystubsPDF(periodId: string, userId: string): Promise<Buffer> {
    try {
      const PDFDocument = require('pdfkit');
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));

      // Get department head's department
      const { DepartmentHeadService } = await import('../department-head/departmentHeadService');
      const departmentHeadService = new DepartmentHeadService();
      const department = await departmentHeadService.getDepartmentInfo(userId);
      
      if (!department) {
        throw new Error('Department not found for user');
      }

      // Get payroll period information
      const period = await payrollPeriodModel.findById(periodId);
      if (!period) {
        throw new Error('Payroll period not found');
      }

      // Get payroll records for the department
      const result = await payrollRecordModel.findAllWithEmployee({ 
        payroll_period_id: periodId,
        department_id: department.id,
        limit: 1000
      });
      const records = result.records;

      // Add title page
      doc.fontSize(20).text('DEPARTMENT PAYROLL PAYSTUBS', { align: 'center' });
      doc.fontSize(16).text(`Department: ${department.name}`, { align: 'center' });
      doc.fontSize(16).text(`Period: ${period.period_name}`, { align: 'center' });
      doc.fontSize(12).text(`From: ${this.formatDate(period.start_date)} To: ${this.formatDate(period.end_date)}`, { align: 'center' });
      doc.moveDown(2);

      // Generate paystub for each employee
      for (const record of records) {
        try {
          this.addPaystubPage(doc, record, period);
        } catch (error) {
          logger.error('Error adding paystub page', { 
            error: (error as Error).message, 
            recordId: record.id,
            employeeId: record.employee_id
          });
          // Continue with next record instead of failing completely
        }
      }

      doc.end();

      return new Promise((resolve, reject) => {
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });
        doc.on('error', reject);
      });
    } catch (error) {
      logger.error('Error exporting department paystubs PDF', { 
        error: (error as Error).message, 
        periodId,
        userId 
      });
      throw error;
    }
  }

  /**
   * Helper function to safely format numbers for PDF
   */
  private formatCurrency(amount: any): string {
    try {
      if (amount === null || amount === undefined) return '₱0.00';
      const num = Number(amount);
      if (isNaN(num) || !isFinite(num)) return '₱0.00';
      return `₱${num.toFixed(2)}`;
    } catch (error) {
      return '₱0.00';
    }
  }

  /**
   * Helper function to safely format dates for PDF
   */
  private formatDate(date: any): string {
    try {
      if (!date) return 'N/A';
      return new Date(date).toLocaleDateString();
    } catch (error) {
      return 'N/A';
    }
  }

  /**
   * Add a paystub page to the PDF document
   */
  private addPaystubPage(doc: any, record: PayrollRecordWithEmployee, period: any): void {
    // Add new page for each employee
    doc.addPage();

    // Employee Information
    doc.fontSize(18).text('PAYSTUB', { align: 'center' });
    doc.moveDown(1);

    doc.fontSize(12);
    doc.text(`Employee ID: ${record.employee.employee_id}`, 50, 100);
    doc.text(`Name: ${record.employee.user.first_name} ${record.employee.user.last_name}`, 50, 120);
    doc.text(`Department: ${record.employee.department.name}`, 50, 140);
    doc.text(`Pay Period: ${period.period_name}`, 50, 180);
    doc.text(`Period: ${this.formatDate(period.start_date)} - ${this.formatDate(period.end_date)}`, 50, 200);

    // Hours Worked Section
    doc.moveDown(2);
    doc.fontSize(14).text('HOURS WORKED', { underline: true });
    doc.moveDown(0.5);
    
    doc.fontSize(12);
    const regularHours = Number(record.total_regular_hours) || 0;
    const overtimeHours = Number(record.total_overtime_hours) || 0;
    const lateHours = Number(record.total_late_hours) || 0;
    const paidLeaveHours = Number(record.paid_leave_hours) || 0;
    const totalHours = regularHours + overtimeHours + paidLeaveHours;
    
    doc.text(`Regular Hours: ${regularHours}`, 50);
    doc.text(`Overtime Hours: ${overtimeHours}`, 50);
    doc.text(`Late Hours: ${lateHours}`, 50);
    doc.text(`Paid Leave Hours: ${paidLeaveHours}`, 50);
    doc.text(`Total Hours: ${totalHours}`, 50);

    // Earnings Section
    doc.moveDown(1);
    doc.fontSize(14).text('EARNINGS', { underline: true });
    doc.moveDown(0.5);
    
    doc.fontSize(12);
    doc.text(`Base Salary: ${this.formatCurrency(record.base_salary)}`, 50);
    
    // Calculate Leave Pay
    const hourlyRate = Number(record.hourly_rate) || 0;
    const leavePay = paidLeaveHours * hourlyRate;
    if (leavePay > 0) {
      doc.text(`Leave Pay: ${this.formatCurrency(leavePay)}`, 50);
    }
    
    doc.text(`Benefits: ${this.formatCurrency(record.total_benefits)}`, 50);
    doc.text(`Gross Pay: ${this.formatCurrency(record.gross_pay)}`, 50);

    // Deductions Section
    doc.moveDown(1);
    doc.fontSize(14).text('DEDUCTIONS', { underline: true });
    doc.moveDown(0.5);
    
    doc.fontSize(12);
    doc.text(`Late Deductions: ${this.formatCurrency(record.late_deductions)}`, 50);
    doc.text(`Total Deductions: ${this.formatCurrency(record.total_deductions)}`, 50);

    // Net Pay Section
    doc.moveDown(1);
    doc.fontSize(16).text(`NET PAY: ${this.formatCurrency(record.net_pay)}`, 50, { underline: true });

    // Footer
    doc.fontSize(10);
    doc.text(`Generated on: ${this.formatDate(new Date())}`, 50, doc.page.height - 100);
    doc.text(`Status: ${record.status?.toUpperCase()}`, 50, doc.page.height - 80);
  }
}

export const payrollService = new PayrollService();