import { getPool } from '../../config/database';
import logger from '../../utils/logger';

export interface PayrollPeriod {
  id: string;
  period_name: string;
  start_date: Date;
  end_date: Date;
  status: 'draft' | 'processing' | 'sent_for_review' | 'completed';
  working_days?: number;
  expected_hours?: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreatePayrollPeriodData {
  period_name: string;
  start_date: Date;
  end_date: Date;
  status?: 'draft' | 'processing' | 'sent_for_review' | 'completed';
  working_days?: number;
  expected_hours?: number;
}

export interface UpdatePayrollPeriodData {
  period_name?: string;
  start_date?: Date;
  end_date?: Date;
  status?: 'draft' | 'processing' | 'sent_for_review' | 'completed';
  working_days?: number;
  expected_hours?: number;
}

export interface PayrollPeriodListParams {
  page?: number;
  limit?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
}

class PayrollPeriodModel {
  private pool = getPool();

  async create(data: CreatePayrollPeriodData): Promise<PayrollPeriod> {
    const client = await this.pool.connect();
    try {
      const query = `
        INSERT INTO payroll_periods (period_name, start_date, end_date, status, working_days, expected_hours)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      const values = [
        data.period_name, 
        data.start_date, 
        data.end_date, 
        data.status || 'draft',
        data.working_days || null,
        data.expected_hours || null
      ];
      
      const result = await client.query(query, values);
      const period = result.rows[0];
      
      logger.info('Payroll period created', { 
        periodId: period.id, 
        periodName: period.period_name,
        workingDays: period.working_days,
        expectedHours: period.expected_hours
      });
      return period;
    } catch (error) {
      logger.error('Error creating payroll period', { error: (error as Error).message, data });
      throw error;
    } finally {
      client.release();
    }
  }

  async findById(id: string): Promise<PayrollPeriod | null> {
    const client = await this.pool.connect();
    try {
      const query = 'SELECT * FROM payroll_periods WHERE id = $1';
      const result = await client.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding payroll period by ID', { error: (error as Error).message, id });
      throw error;
    } finally {
      client.release();
    }
  }

  async findAll(params: PayrollPeriodListParams = {}): Promise<{ periods: PayrollPeriod[]; total: number }> {
    const client = await this.pool.connect();
    try {
      const { page = 1, limit = 10, status, startDate, endDate } = params;
      const offset = (page - 1) * limit;
      
      let whereClause = '';
      const conditions: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (status) {
        conditions.push(`status = $${paramIndex++}`);
        values.push(status);
      }

      if (startDate) {
        conditions.push(`start_date >= $${paramIndex++}`);
        values.push(startDate);
      }

      if (endDate) {
        conditions.push(`end_date <= $${paramIndex++}`);
        values.push(endDate);
      }

      if (conditions.length > 0) {
        whereClause = `WHERE ${conditions.join(' AND ')}`;
      }

      // Get total count
      const countQuery = `SELECT COUNT(*) FROM payroll_periods ${whereClause}`;
      const countResult = await client.query(countQuery, values);
      const total = parseInt(countResult.rows[0].count);

      // Get periods
      const query = `
        SELECT * FROM payroll_periods 
        ${whereClause}
        ORDER BY start_date DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;
      values.push(limit, offset);
      
      const result = await client.query(query, values);
      
      return {
        periods: result.rows,
        total
      };
    } catch (error) {
      logger.error('Error finding payroll periods', { error: (error as Error).message, params });
      throw error;
    } finally {
      client.release();
    }
  }

  async update(id: string, data: UpdatePayrollPeriodData): Promise<PayrollPeriod | null> {
    const client = await this.pool.connect();
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (data.period_name !== undefined) {
        fields.push(`period_name = $${paramIndex++}`);
        values.push(data.period_name);
      }

      if (data.start_date !== undefined) {
        fields.push(`start_date = $${paramIndex++}`);
        values.push(data.start_date);
      }

      if (data.end_date !== undefined) {
        fields.push(`end_date = $${paramIndex++}`);
        values.push(data.end_date);
      }

      if (data.status !== undefined) {
        fields.push(`status = $${paramIndex++}`);
        values.push(data.status);
      }

      if (fields.length === 0) {
        return await this.findById(id);
      }

      fields.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id);

      const query = `
        UPDATE payroll_periods 
        SET ${fields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await client.query(query, values);
      
      if (result.rows.length === 0) {
        return null;
      }

      logger.info('Payroll period updated', { periodId: id, updates: data });
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating payroll period', { error: (error as Error).message, id, data });
      throw error;
    } finally {
      client.release();
    }
  }

  async delete(id: string): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      const query = 'DELETE FROM payroll_periods WHERE id = $1';
      const result = await client.query(query, [id]);
      
      const deleted = (result.rowCount || 0) > 0;
      if (deleted) {
        logger.info('Payroll period deleted', { periodId: id });
      }
      
      return deleted;
    } catch (error) {
      logger.error('Error deleting payroll period', { error: (error as Error).message, id });
      throw error;
    } finally {
      client.release();
    }
  }

  async findActivePeriod(): Promise<PayrollPeriod | null> {
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT * FROM payroll_periods 
        WHERE status IN ('draft', 'processing', 'sent_for_review')
        ORDER BY start_date DESC
        LIMIT 1
      `;
      const result = await client.query(query);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding active payroll period', { error: (error as Error).message });
      throw error;
    } finally {
      client.release();
    }
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<PayrollPeriod[]> {
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT * FROM payroll_periods 
        WHERE start_date <= $2 AND end_date >= $1
        ORDER BY start_date DESC
      `;
      const result = await client.query(query, [startDate, endDate]);
      return result.rows;
    } catch (error) {
      logger.error('Error finding payroll periods by date range', { 
        error: (error as Error).message, 
        startDate, 
        endDate 
      });
      throw error;
    } finally {
      client.release();
    }
  }

  async count(): Promise<number> {
    const client = await this.pool.connect();
    try {
      const query = 'SELECT COUNT(*) FROM payroll_periods';
      const result = await client.query(query);
      return parseInt(result.rows[0].count);
    } catch (error) {
      logger.error('Error counting payroll periods', { error: (error as Error).message });
      throw error;
    } finally {
      client.release();
    }
  }

  async countByStatus(statuses: string[]): Promise<number> {
    const client = await this.pool.connect();
    try {
      const placeholders = statuses.map((_, index) => `$${index + 1}`).join(',');
      const query = `SELECT COUNT(*) FROM payroll_periods WHERE status IN (${placeholders})`;
      const result = await client.query(query, statuses);
      return parseInt(result.rows[0].count);
    } catch (error) {
      logger.error('Error counting payroll periods by status', { error: (error as Error).message, statuses });
      throw error;
    } finally {
      client.release();
    }
  }
}

export const payrollPeriodModel = new PayrollPeriodModel();