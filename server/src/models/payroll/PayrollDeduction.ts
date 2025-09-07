import { getPool } from '../../config/database';
import logger from '../../utils/logger';

export interface PayrollDeduction {
  id: string;
  payroll_record_id: string;
  deduction_type: string;
  amount: number;
  percentage: number | null;
  created_at: Date;
}

export interface CreatePayrollDeductionData {
  payroll_record_id: string;
  deduction_type: string;
  amount: number;
  percentage?: number | null;
}

export interface UpdatePayrollDeductionData {
  deduction_type?: string;
  amount?: number;
  percentage?: number | null;
}

export interface PayrollDeductionListParams {
  payroll_record_id?: string;
  deduction_type?: string;
  page?: number;
  limit?: number;
}

class PayrollDeductionModel {
  private pool = getPool();

  async create(data: CreatePayrollDeductionData): Promise<PayrollDeduction> {
    const client = await this.pool.connect();
    try {
      const query = `
        INSERT INTO payroll_deductions (payroll_record_id, deduction_type, amount, percentage)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      const values = [data.payroll_record_id, data.deduction_type, data.amount, data.percentage || null];
      
      const result = await client.query(query, values);
      const deduction = result.rows[0];
      
      logger.info('Payroll deduction created', { 
        deductionId: deduction.id, 
        payrollRecordId: deduction.payroll_record_id,
        deductionType: deduction.deduction_type,
        amount: deduction.amount
      });
      return deduction;
    } catch (error) {
      logger.error('Error creating payroll deduction', { error: (error as Error).message, data });
      throw error;
    } finally {
      client.release();
    }
  }

  async findById(id: string): Promise<PayrollDeduction | null> {
    const client = await this.pool.connect();
    try {
      const query = 'SELECT * FROM payroll_deductions WHERE id = $1';
      const result = await client.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding payroll deduction by ID', { error: (error as Error).message, id });
      throw error;
    } finally {
      client.release();
    }
  }

  async findAll(params: PayrollDeductionListParams = {}): Promise<{ deductions: PayrollDeduction[]; total: number }> {
    const client = await this.pool.connect();
    try {
      const { page = 1, limit = 10, payroll_record_id, deduction_type } = params;
      const offset = (page - 1) * limit;
      
      let whereClause = '';
      const conditions: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (payroll_record_id) {
        conditions.push(`payroll_record_id = $${paramIndex++}`);
        values.push(payroll_record_id);
      }

      if (deduction_type) {
        conditions.push(`deduction_type = $${paramIndex++}`);
        values.push(deduction_type);
      }

      if (conditions.length > 0) {
        whereClause = `WHERE ${conditions.join(' AND ')}`;
      }

      // Get total count
      const countQuery = `SELECT COUNT(*) FROM payroll_deductions ${whereClause}`;
      const countResult = await client.query(countQuery, values);
      const total = parseInt(countResult.rows[0].count);

      // Get deductions
      const query = `
        SELECT * FROM payroll_deductions 
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;
      values.push(limit, offset);
      
      const result = await client.query(query, values);
      
      return {
        deductions: result.rows,
        total
      };
    } catch (error) {
      logger.error('Error finding payroll deductions', { error: (error as Error).message, params });
      throw error;
    } finally {
      client.release();
    }
  }

  async findByPayrollRecord(payrollRecordId: string): Promise<PayrollDeduction[]> {
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT * FROM payroll_deductions 
        WHERE payroll_record_id = $1
        ORDER BY created_at ASC
      `;
      const result = await client.query(query, [payrollRecordId]);
      return result.rows;
    } catch (error) {
      logger.error('Error finding payroll deductions by record', { 
        error: (error as Error).message, 
        payrollRecordId 
      });
      throw error;
    } finally {
      client.release();
    }
  }

  async update(id: string, data: UpdatePayrollDeductionData): Promise<PayrollDeduction | null> {
    const client = await this.pool.connect();
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (data.deduction_type !== undefined) {
        fields.push(`deduction_type = $${paramIndex++}`);
        values.push(data.deduction_type);
      }

      if (data.amount !== undefined) {
        fields.push(`amount = $${paramIndex++}`);
        values.push(data.amount);
      }

      if (data.percentage !== undefined) {
        fields.push(`percentage = $${paramIndex++}`);
        values.push(data.percentage);
      }

      if (fields.length === 0) {
        return await this.findById(id);
      }

      values.push(id);

      const query = `
        UPDATE payroll_deductions 
        SET ${fields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await client.query(query, values);
      
      if (result.rows.length === 0) {
        return null;
      }

      logger.info('Payroll deduction updated', { deductionId: id, updates: data });
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating payroll deduction', { error: (error as Error).message, id, data });
      throw error;
    } finally {
      client.release();
    }
  }

  async delete(id: string): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      const query = 'DELETE FROM payroll_deductions WHERE id = $1';
      const result = await client.query(query, [id]);
      
      const deleted = (result.rowCount || 0) > 0;
      if (deleted) {
        logger.info('Payroll deduction deleted', { deductionId: id });
      }
      
      return deleted;
    } catch (error) {
      logger.error('Error deleting payroll deduction', { error: (error as Error).message, id });
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteByPayrollRecord(payrollRecordId: string): Promise<number> {
    const client = await this.pool.connect();
    try {
      const query = 'DELETE FROM payroll_deductions WHERE payroll_record_id = $1';
      const result = await client.query(query, [payrollRecordId]);
      
      const deletedCount = result.rowCount || 0;
      if (deletedCount > 0) {
        logger.info('Payroll deductions deleted by record', { 
          payrollRecordId, 
          deletedCount 
        });
      }
      
      return deletedCount;
    } catch (error) {
      logger.error('Error deleting payroll deductions by record', { 
        error: (error as Error).message, 
        payrollRecordId 
      });
      throw error;
    } finally {
      client.release();
    }
  }

  async getTotalDeductionsByRecord(payrollRecordId: string): Promise<number> {
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT COALESCE(SUM(amount), 0) as total_deductions
        FROM payroll_deductions 
        WHERE payroll_record_id = $1
      `;
      const result = await client.query(query, [payrollRecordId]);
      return parseFloat(result.rows[0].total_deductions);
    } catch (error) {
      logger.error('Error getting total deductions by record', { 
        error: (error as Error).message, 
        payrollRecordId 
      });
      throw error;
    } finally {
      client.release();
    }
  }
}

export const payrollDeductionModel = new PayrollDeductionModel();