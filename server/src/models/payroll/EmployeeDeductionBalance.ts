import { getPool } from '../../config/database';
import logger from '../../utils/logger';

export interface EmployeeDeductionBalance {
  id: string;
  employee_id: string;
  deduction_type_id: string;
  original_amount: number;
  remaining_balance: number;
  monthly_deduction_amount: number;
  start_date: Date;
  end_date?: Date;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deduction_type_name?: string; // Added for joined queries
}

export interface CreateEmployeeDeductionBalanceData {
  employee_id: string;
  deduction_type_id: string;
  original_amount: number;
  remaining_balance: number;
  monthly_deduction_amount: number;
  start_date: Date;
  end_date?: Date;
  is_active?: boolean;
}

export interface UpdateEmployeeDeductionBalanceData {
  original_amount?: number;
  remaining_balance?: number;
  monthly_deduction_amount?: number;
  start_date?: Date;
  end_date?: Date;
  is_active?: boolean;
}

export interface EmployeeDeductionBalanceListParams {
  employee_id?: string;
  deduction_type_id?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
}

class EmployeeDeductionBalanceModel {
  private pool = getPool();

  async create(data: CreateEmployeeDeductionBalanceData): Promise<EmployeeDeductionBalance> {
    const client = await this.pool.connect();
    try {
      const query = `
        INSERT INTO employee_deduction_balances (
          employee_id, deduction_type_id, original_amount, remaining_balance,
          monthly_deduction_amount, start_date, end_date, is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      const values = [
        data.employee_id,
        data.deduction_type_id,
        data.original_amount,
        data.remaining_balance,
        data.monthly_deduction_amount,
        data.start_date,
        data.end_date || null,
        data.is_active ?? true
      ];
      
      const result = await client.query(query, values);
      const record = result.rows[0];
      
      logger.info('Employee deduction balance created', { 
        recordId: record.id, 
        employeeId: record.employee_id,
        deductionTypeId: record.deduction_type_id
      });
      return record;
    } catch (error) {
      logger.error('Error creating employee deduction balance', { error: (error as Error).message, data });
      throw error;
    } finally {
      client.release();
    }
  }

  async findById(id: string): Promise<EmployeeDeductionBalance | null> {
    const client = await this.pool.connect();
    try {
      const query = 'SELECT * FROM employee_deduction_balances WHERE id = $1';
      const result = await client.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding employee deduction balance by ID', { error: (error as Error).message, id });
      throw error;
    } finally {
      client.release();
    }
  }

  async findByEmployee(employeeId: string): Promise<EmployeeDeductionBalance[]> {
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT edb.*, dt.name as deduction_type_name
        FROM employee_deduction_balances edb
        JOIN deduction_types dt ON edb.deduction_type_id = dt.id
        WHERE edb.employee_id = $1
        ORDER BY edb.created_at DESC
      `;
      const result = await client.query(query, [employeeId]);
      return result.rows;
    } catch (error) {
      logger.error('Error finding employee deduction balances by employee', { 
        error: (error as Error).message, 
        employeeId 
      });
      throw error;
    } finally {
      client.release();
    }
  }

  async findActiveByEmployee(employeeId: string): Promise<EmployeeDeductionBalance[]> {
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT edb.*, dt.name as deduction_type_name
        FROM employee_deduction_balances edb
        JOIN deduction_types dt ON edb.deduction_type_id = dt.id
        WHERE edb.employee_id = $1 
        AND edb.is_active = true
        AND edb.remaining_balance > 0
        ORDER BY edb.created_at DESC
      `;
      const result = await client.query(query, [employeeId]);
      return result.rows.map(row => ({
        id: row.id,
        employee_id: row.employee_id,
        deduction_type_id: row.deduction_type_id,
        original_amount: parseFloat(row.original_amount) || 0,
        remaining_balance: parseFloat(row.remaining_balance) || 0,
        monthly_deduction_amount: parseFloat(row.monthly_deduction_amount) || 0,
        start_date: row.start_date,
        end_date: row.end_date,
        is_active: row.is_active,
        created_at: row.created_at,
        updated_at: row.updated_at,
        deduction_type_name: row.deduction_type_name
      }));
    } catch (error) {
      logger.error('Error finding active employee deduction balances', { 
        error: (error as Error).message, 
        employeeId 
      });
      throw error;
    } finally {
      client.release();
    }
  }

  async findByEmployeeAndDeductionTypeAndDate(employeeId: string, deductionTypeId: string, startDate: Date): Promise<EmployeeDeductionBalance | null> {
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT * FROM employee_deduction_balances 
        WHERE employee_id = $1 
        AND deduction_type_id = $2 
        AND start_date = $3
      `;
      const result = await client.query(query, [employeeId, deductionTypeId, startDate]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding employee deduction balance by employee, deduction type, and date', { 
        error: (error as Error).message, 
        employeeId, 
        deductionTypeId, 
        startDate 
      });
      throw error;
    } finally {
      client.release();
    }
  }

  async findAll(params: EmployeeDeductionBalanceListParams = {}): Promise<{ records: EmployeeDeductionBalance[]; total: number }> {
    const client = await this.pool.connect();
    try {
      const { page = 1, limit = 10, employee_id, deduction_type_id, is_active } = params;
      const offset = (page - 1) * limit;
      
      let whereClause = '';
      const conditions: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (employee_id) {
        conditions.push(`employee_id = $${paramIndex++}`);
        values.push(employee_id);
      }

      if (deduction_type_id) {
        conditions.push(`deduction_type_id = $${paramIndex++}`);
        values.push(deduction_type_id);
      }

      if (is_active !== undefined) {
        conditions.push(`is_active = $${paramIndex++}`);
        values.push(is_active);
      }

      if (conditions.length > 0) {
        whereClause = `WHERE ${conditions.join(' AND ')}`;
      }

      // Get total count
      const countQuery = `SELECT COUNT(*) FROM employee_deduction_balances ${whereClause}`;
      const countResult = await client.query(countQuery, values);
      const total = parseInt(countResult.rows[0].count);

      // Get records
      const query = `
        SELECT edb.*, dt.name as deduction_type_name, e.employee_id as employee_number, u.first_name, u.last_name
        FROM employee_deduction_balances edb
        JOIN deduction_types dt ON edb.deduction_type_id = dt.id
        JOIN employees e ON edb.employee_id = e.id
        JOIN users u ON e.user_id = u.id
        ${whereClause}
        ORDER BY edb.created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;
      values.push(limit, offset);
      
      const result = await client.query(query, values);
      
      return {
        records: result.rows,
        total
      };
    } catch (error) {
      logger.error('Error finding employee deduction balances', { error: (error as Error).message, params });
      throw error;
    } finally {
      client.release();
    }
  }

  async update(id: string, data: UpdateEmployeeDeductionBalanceData): Promise<EmployeeDeductionBalance | null> {
    const client = await this.pool.connect();
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (data.original_amount !== undefined) {
        fields.push(`original_amount = $${paramIndex++}`);
        values.push(data.original_amount);
      }

      if (data.remaining_balance !== undefined) {
        fields.push(`remaining_balance = $${paramIndex++}`);
        values.push(data.remaining_balance);
      }

      if (data.monthly_deduction_amount !== undefined) {
        fields.push(`monthly_deduction_amount = $${paramIndex++}`);
        values.push(data.monthly_deduction_amount);
      }

      if (data.start_date !== undefined) {
        fields.push(`start_date = $${paramIndex++}`);
        values.push(data.start_date);
      }

      if (data.end_date !== undefined) {
        fields.push(`end_date = $${paramIndex++}`);
        values.push(data.end_date);
      }

      if (data.is_active !== undefined) {
        fields.push(`is_active = $${paramIndex++}`);
        values.push(data.is_active);
      }

      if (fields.length === 0) {
        return await this.findById(id);
      }

      fields.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id);

      const query = `
        UPDATE employee_deduction_balances 
        SET ${fields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await client.query(query, values);
      
      if (result.rows.length === 0) {
        return null;
      }

      logger.info('Employee deduction balance updated', { recordId: id, updates: data });
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating employee deduction balance', { error: (error as Error).message, id, data });
      throw error;
    } finally {
      client.release();
    }
  }

  async delete(id: string): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      const query = 'DELETE FROM employee_deduction_balances WHERE id = $1';
      const result = await client.query(query, [id]);
      
      const deleted = (result.rowCount || 0) > 0;
      if (deleted) {
        logger.info('Employee deduction balance deleted', { recordId: id });
      }
      
      return deleted;
    } catch (error) {
      logger.error('Error deleting employee deduction balance', { error: (error as Error).message, id });
      throw error;
    } finally {
      client.release();
    }
  }

  async bulkCreate(data: CreateEmployeeDeductionBalanceData[]): Promise<EmployeeDeductionBalance[]> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      const records: EmployeeDeductionBalance[] = [];
      
      for (const item of data) {
        const query = `
          INSERT INTO employee_deduction_balances (
            employee_id, deduction_type_id, original_amount, remaining_balance,
            monthly_deduction_amount, start_date, end_date, is_active
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *
        `;
        const values = [
          item.employee_id,
          item.deduction_type_id,
          item.original_amount,
          item.remaining_balance,
          item.monthly_deduction_amount,
          item.start_date,
          item.end_date || null,
          item.is_active ?? true
        ];
        
        const result = await client.query(query, values);
        records.push(result.rows[0]);
      }
      
      await client.query('COMMIT');
      
      logger.info('Employee deduction balances bulk created', { count: records.length });
      return records;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error bulk creating employee deduction balances', { error: (error as Error).message });
      throw error;
    } finally {
      client.release();
    }
  }
}

export const employeeDeductionBalanceModel = new EmployeeDeductionBalanceModel();
