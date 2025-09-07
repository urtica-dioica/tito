import { getPool } from '../../config/database';
import logger from '../../utils/logger';

export interface PayrollRecord {
  id: string;
  payroll_period_id: string;
  employee_id: string;
  base_salary: number;
  regular_hours: number;
  hourly_rate: number;
  regular_pay: number;
  overtime_hours: number;
  overtime_pay: number;
  total_pay: number;
  net_pay: number;
  status: 'draft' | 'processed' | 'paid';
  created_at: Date;
  updated_at: Date;
}

export interface PayrollRecordWithEmployee extends PayrollRecord {
  employee: {
    employee_id: string;
    user: {
      first_name: string;
      last_name: string;
    };
    department: {
      name: string;
    };
  };
}

export interface CreatePayrollRecordData {
  payroll_period_id: string;
  employee_id: string;
  base_salary: number;
  regular_hours?: number;
  hourly_rate?: number;
  regular_pay?: number;
  overtime_hours?: number;
  overtime_pay?: number;
  total_pay?: number;
  net_pay?: number;
  status?: 'draft' | 'processed' | 'paid';
}

export interface UpdatePayrollRecordData {
  base_salary?: number;
  regular_hours?: number;
  hourly_rate?: number;
  regular_pay?: number;
  overtime_hours?: number;
  overtime_pay?: number;
  total_pay?: number;
  net_pay?: number;
  status?: 'draft' | 'processed' | 'paid';
}

export interface PayrollRecordListParams {
  payroll_period_id?: string;
  employee_id?: string;
  status?: string;
  page?: number;
  limit?: number;
}

class PayrollRecordModel {
  private pool = getPool();

  async create(data: CreatePayrollRecordData): Promise<PayrollRecord> {
    const client = await this.pool.connect();
    try {
      const query = `
        INSERT INTO payroll_records (
          payroll_period_id, employee_id, base_salary, regular_hours, 
          hourly_rate, regular_pay, overtime_hours, overtime_pay, 
          total_pay, net_pay, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;
      const values = [
        data.payroll_period_id,
        data.employee_id,
        data.base_salary,
        data.regular_hours || 176,
        data.hourly_rate || 0,
        data.regular_pay || 0,
        data.overtime_hours || 0,
        data.overtime_pay || 0,
        data.total_pay || 0,
        data.net_pay || 0,
        data.status || 'draft'
      ];
      
      const result = await client.query(query, values);
      const record = result.rows[0];
      
      logger.info('Payroll record created', { 
        recordId: record.id, 
        employeeId: record.employee_id,
        payrollPeriodId: record.payroll_period_id
      });
      return record;
    } catch (error) {
      logger.error('Error creating payroll record', { error: (error as Error).message, data });
      throw error;
    } finally {
      client.release();
    }
  }

  async findById(id: string): Promise<PayrollRecord | null> {
    const client = await this.pool.connect();
    try {
      const query = 'SELECT * FROM payroll_records WHERE id = $1';
      const result = await client.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding payroll record by ID', { error: (error as Error).message, id });
      throw error;
    } finally {
      client.release();
    }
  }

  async findByPeriodAndEmployee(payrollPeriodId: string, employeeId: string): Promise<PayrollRecord | null> {
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT * FROM payroll_records 
        WHERE payroll_period_id = $1 AND employee_id = $2
      `;
      const result = await client.query(query, [payrollPeriodId, employeeId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding payroll record by period and employee', { 
        error: (error as Error).message, 
        payrollPeriodId, 
        employeeId 
      });
      throw error;
    } finally {
      client.release();
    }
  }

  async findAll(params: PayrollRecordListParams = {}): Promise<{ records: PayrollRecord[]; total: number }> {
    const client = await this.pool.connect();
    try {
      const { page = 1, limit = 10, payroll_period_id, employee_id, status } = params;
      const offset = (page - 1) * limit;
      
      let whereClause = '';
      const conditions: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (payroll_period_id) {
        conditions.push(`payroll_period_id = $${paramIndex++}`);
        values.push(payroll_period_id);
      }

      if (employee_id) {
        conditions.push(`employee_id = $${paramIndex++}`);
        values.push(employee_id);
      }

      if (status) {
        conditions.push(`status = $${paramIndex++}`);
        values.push(status);
      }

      if (conditions.length > 0) {
        whereClause = `WHERE ${conditions.join(' AND ')}`;
      }

      // Get total count
      const countQuery = `SELECT COUNT(*) FROM payroll_records ${whereClause}`;
      const countResult = await client.query(countQuery, values);
      const total = parseInt(countResult.rows[0].count);

      // Get records
      const query = `
        SELECT * FROM payroll_records 
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;
      values.push(limit, offset);
      
      const result = await client.query(query, values);
      
      return {
        records: result.rows,
        total
      };
    } catch (error) {
      logger.error('Error finding payroll records', { error: (error as Error).message, params });
      throw error;
    } finally {
      client.release();
    }
  }

  async findAllWithEmployee(params: PayrollRecordListParams = {}): Promise<{ records: PayrollRecordWithEmployee[]; total: number }> {
    const client = await this.pool.connect();
    try {
      const { page = 1, limit = 10, payroll_period_id, employee_id, status } = params;
      const offset = (page - 1) * limit;
      
      let whereClause = '';
      const conditions: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (payroll_period_id) {
        conditions.push(`pr.payroll_period_id = $${paramIndex++}`);
        values.push(payroll_period_id);
      }

      if (employee_id) {
        conditions.push(`pr.employee_id = $${paramIndex++}`);
        values.push(employee_id);
      }

      if (status) {
        conditions.push(`pr.status = $${paramIndex++}`);
        values.push(status);
      }

      if (conditions.length > 0) {
        whereClause = `WHERE ${conditions.join(' AND ')}`;
      }

      // Get total count
      const countQuery = `
        SELECT COUNT(*) FROM payroll_records pr
        ${whereClause}
      `;
      const countResult = await client.query(countQuery, values);
      const total = parseInt(countResult.rows[0].count);

      // Get records with employee info
      const query = `
        SELECT 
          pr.*,
          e.employee_id,
          u.first_name,
          u.last_name,
          d.name as department_name
        FROM payroll_records pr
        JOIN employees e ON pr.employee_id = e.id
        JOIN users u ON e.user_id = u.id
        LEFT JOIN departments d ON e.department_id = d.id
        ${whereClause}
        ORDER BY pr.created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;
      values.push(limit, offset);
      
      const result = await client.query(query, values);
      
      const records: PayrollRecordWithEmployee[] = result.rows.map(row => ({
        id: row.id,
        payroll_period_id: row.payroll_period_id,
        employee_id: row.employee_id,
        base_salary: row.base_salary,
        regular_hours: row.regular_hours,
        hourly_rate: row.hourly_rate,
        regular_pay: row.regular_pay,
        overtime_hours: row.overtime_hours,
        overtime_pay: row.overtime_pay,
        total_pay: row.total_pay,
        net_pay: row.net_pay,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at,
        employee: {
          employee_id: row.employee_id,
          user: {
            first_name: row.first_name,
            last_name: row.last_name
          },
          department: {
            name: row.department_name
          }
        }
      }));
      
      return {
        records,
        total
      };
    } catch (error) {
      logger.error('Error finding payroll records with employee', { error: (error as Error).message, params });
      throw error;
    } finally {
      client.release();
    }
  }

  async update(id: string, data: UpdatePayrollRecordData): Promise<PayrollRecord | null> {
    const client = await this.pool.connect();
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (data.base_salary !== undefined) {
        fields.push(`base_salary = $${paramIndex++}`);
        values.push(data.base_salary);
      }

      if (data.regular_hours !== undefined) {
        fields.push(`regular_hours = $${paramIndex++}`);
        values.push(data.regular_hours);
      }

      if (data.hourly_rate !== undefined) {
        fields.push(`hourly_rate = $${paramIndex++}`);
        values.push(data.hourly_rate);
      }

      if (data.regular_pay !== undefined) {
        fields.push(`regular_pay = $${paramIndex++}`);
        values.push(data.regular_pay);
      }

      if (data.overtime_hours !== undefined) {
        fields.push(`overtime_hours = $${paramIndex++}`);
        values.push(data.overtime_hours);
      }

      if (data.overtime_pay !== undefined) {
        fields.push(`overtime_pay = $${paramIndex++}`);
        values.push(data.overtime_pay);
      }

      if (data.total_pay !== undefined) {
        fields.push(`total_pay = $${paramIndex++}`);
        values.push(data.total_pay);
      }

      if (data.net_pay !== undefined) {
        fields.push(`net_pay = $${paramIndex++}`);
        values.push(data.net_pay);
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
        UPDATE payroll_records 
        SET ${fields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await client.query(query, values);
      
      if (result.rows.length === 0) {
        return null;
      }

      logger.info('Payroll record updated', { recordId: id, updates: data });
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating payroll record', { error: (error as Error).message, id, data });
      throw error;
    } finally {
      client.release();
    }
  }

  async delete(id: string): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      const query = 'DELETE FROM payroll_records WHERE id = $1';
      const result = await client.query(query, [id]);
      
      const deleted = (result.rowCount || 0) > 0;
      if (deleted) {
        logger.info('Payroll record deleted', { recordId: id });
      }
      
      return deleted;
    } catch (error) {
      logger.error('Error deleting payroll record', { error: (error as Error).message, id });
      throw error;
    } finally {
      client.release();
    }
  }

  async findByPayrollPeriod(payrollPeriodId: string): Promise<PayrollRecord[]> {
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT * FROM payroll_records 
        WHERE payroll_period_id = $1
        ORDER BY created_at ASC
      `;
      const result = await client.query(query, [payrollPeriodId]);
      return result.rows;
    } catch (error) {
      logger.error('Error finding payroll records by period', { 
        error: (error as Error).message, 
        payrollPeriodId 
      });
      throw error;
    } finally {
      client.release();
    }
  }
}

export const payrollRecordModel = new PayrollRecordModel();