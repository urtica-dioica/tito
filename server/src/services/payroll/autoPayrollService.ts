import { getPool } from '../../config/database';
import { payrollPeriodModel } from '../../models/payroll/PayrollPeriod';
import logger from '../../utils/logger';

export class AutoPayrollService {
  private pool = getPool();

  /**
   * Generate payroll periods for the current year
   * Creates 12 monthly periods automatically
   */
  async generateYearlyPayrollPeriods(year: number = new Date().getFullYear()): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      // Check if periods already exist for this year
      const existingPeriods = await payrollPeriodModel.findAll({
        page: 1,
        limit: 100
      });

      const existingYearPeriods = existingPeriods.periods.filter((period: any) => {
        const periodYear = new Date(period.start_date).getFullYear();
        return periodYear === year;
      });

      if (existingYearPeriods.length > 0) {
        logger.info(`Payroll periods for year ${year} already exist`, {
          existingCount: existingYearPeriods.length
        });
        return;
      }

      // Generate 12 monthly periods
      const periods = [];
      for (let month = 0; month < 12; month++) {
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0); // Last day of the month
        
        // Calculate actual working days in this month
        const workingDays = this.calculateWorkingDaysInMonth(year, month);
        
        // Calculate expected hours for this specific month
        const expectedHours = workingDays * 8; // 8 hours per working day

        const periodName = startDate.toLocaleDateString('en-US', { 
          month: 'long', 
          year: 'numeric' 
        });

        periods.push({
          period_name: periodName,
          start_date: startDate,
          end_date: endDate,
          status: 'draft' as const,
          // Store month-specific working days and expected hours
          working_days: workingDays,
          expected_hours: expectedHours
        });
      }

      // Create all periods
      for (const periodData of periods) {
        try {
          await payrollPeriodModel.create(periodData);
          logger.info(`Created payroll period: ${periodData.period_name}`, {
            startDate: periodData.start_date,
            endDate: periodData.end_date,
            workingDays: periodData.working_days,
            expectedHours: periodData.expected_hours
          });
        } catch (error) {
          logger.error(`Failed to create payroll period: ${periodData.period_name}`, {
            error: (error as Error).message,
            periodData
          });
        }
      }

      logger.info(`Successfully generated ${periods.length} payroll periods for year ${year}`);

    } catch (error) {
      logger.error('Error generating yearly payroll periods', {
        error: (error as Error).message,
        year
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Generate payroll period for the current month
   */
  async generateCurrentMonthPeriod(): Promise<void> {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-based month (0 = January, 11 = December)
    
    try {
      await this.generateMonthlyPayrollPeriod(currentYear, currentMonth);
      logger.info('Current month payroll period generated successfully');
    } catch (error) {
      logger.error('Failed to generate current month payroll period', {
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Get expected monthly hours from system settings
   */
  async getExpectedMonthlyHours(): Promise<number> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(
        'SELECT setting_value FROM system_settings WHERE setting_key = $1',
        ['expected_monthly_hours']
      );

      if (result.rows.length === 0) {
        return 176; // Default value
      }

      return parseInt(result.rows[0].setting_value);
    } catch (error) {
      logger.error('Error getting expected monthly hours', {
        error: (error as Error).message
      });
      return 176; // Default value
    } finally {
      client.release();
    }
  }

  /**
   * Calculate working days in a month (excluding weekends)
   */
  calculateWorkingDaysInMonth(year: number, month: number): number {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    
    let workingDays = 0;
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      // Count Monday (1) through Friday (5) as working days
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        workingDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return workingDays;
  }

  /**
   * Initialize payroll periods for the current year if they don't exist
   * This should be called on system startup or when needed
   */
  async initializePayrollPeriods(): Promise<void> {
    const currentYear = new Date().getFullYear();
    
    try {
      await this.generateYearlyPayrollPeriods(currentYear);
      logger.info('Payroll periods initialization completed');
    } catch (error) {
      logger.error('Failed to initialize payroll periods', {
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Generate payroll period for a specific month
   */
  async generateMonthlyPayrollPeriod(year: number, month: number): Promise<void> {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0); // Last day of the month
    
    // Calculate actual working days in this month
    const workingDays = this.calculateWorkingDaysInMonth(year, month);
    
    // Calculate expected hours for this specific month
    const expectedHours = workingDays * 8; // 8 hours per working day

    const periodName = startDate.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });

    try {
      // Check if period already exists
      const existingPeriods = await payrollPeriodModel.findByDateRange(startDate, endDate);
      if (existingPeriods.length > 0) {
        logger.info(`Payroll period for ${periodName} already exists`);
        return;
      }

      // Create the payroll period
      const periodData = {
        period_name: periodName,
        start_date: startDate,
        end_date: endDate,
        working_days: workingDays,
        expected_hours: expectedHours,
        status: 'draft' as const
      };

      await payrollPeriodModel.create(periodData);
      logger.info(`Created payroll period for ${periodName}`);
    } catch (error) {
      logger.error(`Failed to create payroll period for ${periodName}`, {
        error: (error as Error).message
      });
      throw error;
    }
  }
}

export const autoPayrollService = new AutoPayrollService();
