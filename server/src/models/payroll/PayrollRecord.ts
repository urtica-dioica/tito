import { getPool } from '../../config/database';
import logger from '../../utils/logger';

export interface PayrollRecord {
  id: string;
  payroll_period_id: string;
  employee_id: string;
  base_salary: number;
  total_worked_hours: number;
  hourly_rate: number;
  total_regular_hours: number;
  total_overtime_hours: number;
  total_late_hours: number;
  late_deductions: number;
  gross_pay: number;
  net_pay: number;
  total_deductions: number;
  total_benefits: number;
  status: 'draft' | 'processed' | 'paid';
  created_at: Date;
  updated_at: Date;
}

export interface PayrollRecordWithEmployee extends PayrollRecord {
  period_name?: string;
  department_id?: string;
  department_name?: string;
  employee: {
    employee_id: string;
    user: {
      first_name: string;
      last_name: string;
    };
    department: {
      id?: string;
      name: string;
    };
  };
}

export interface CreatePayrollRecordData {
  payroll_period_id: string;
  employee_id: string;
  base_salary: number;
  total_worked_hours?: number;
  hourly_rate?: number;
  total_regular_hours?: number;
  total_overtime_hours?: number;
  total_late_hours?: number;
  late_deductions?: number;
  gross_pay?: number;
  net_pay?: number;
  total_deductions?: number;
  total_benefits?: number;
  status?: 'draft' | 'processed' | 'paid';
}

export interface UpdatePayrollRecordData {
  base_salary?: number;
  total_worked_hours?: number;
  hourly_rate?: number;
  total_regular_hours?: number;
  total_overtime_hours?: number;
  total_late_hours?: number;
  late_deductions?: number;
  gross_pay?: number;
  net_pay?: number;
  total_deductions?: number;
  total_benefits?: number;
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
          payroll_period_id, employee_id, base_salary, total_worked_hours, 
          hourly_rate, total_regular_hours, total_overtime_hours, total_late_hours,
          late_deductions, gross_pay, net_pay, total_deductions, total_benefits, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `;
      const values = [
        data.payroll_period_id,
        data.employee_id,
        data.base_salary,
        data.total_worked_hours || 176,
        data.hourly_rate || 0,
        data.total_regular_hours || 176,
        data.total_overtime_hours || 0,
        data.total_late_hours || 0,
        data.late_deductions || 0,
        data.gross_pay || 0,
        data.net_pay || 0,
        data.total_deductions || 0,
        data.total_benefits || 0,
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
          e.department_id,
          u.first_name,
          u.last_name,
          d.name as department_name,
          pp.period_name
        FROM payroll_records pr
        JOIN employees e ON pr.employee_id = e.id
        JOIN users u ON e.user_id = u.id
        LEFT JOIN departments d ON e.department_id = d.id
        LEFT JOIN payroll_periods pp ON pr.payroll_period_id = pp.id
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
        period_name: row.period_name,
        department_id: row.department_id,
        department_name: row.department_name,
        base_salary: row.base_salary,
        total_worked_hours: row.total_worked_hours,
        hourly_rate: row.hourly_rate,
        total_regular_hours: row.total_regular_hours,
        total_overtime_hours: row.total_overtime_hours,
        total_late_hours: row.total_late_hours,
        late_deductions: row.late_deductions,
        gross_pay: row.gross_pay,
        net_pay: row.net_pay,
        total_deductions: row.total_deductions,
        total_benefits: row.total_benefits,
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
            id: row.department_id,
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

      if (data.total_worked_hours !== undefined) {
        fields.push(`total_worked_hours = $${paramIndex++}`);
        values.push(data.total_worked_hours);
      }

      if (data.hourly_rate !== undefined) {
        fields.push(`hourly_rate = $${paramIndex++}`);
        values.push(data.hourly_rate);
      }

      if (data.total_regular_hours !== undefined) {
        fields.push(`total_regular_hours = $${paramIndex++}`);
        values.push(data.total_regular_hours);
      }

      if (data.total_overtime_hours !== undefined) {
        fields.push(`total_overtime_hours = $${paramIndex++}`);
        values.push(data.total_overtime_hours);
      }

      if (data.total_late_hours !== undefined) {
        fields.push(`total_late_hours = $${paramIndex++}`);
        values.push(data.total_late_hours);
      }

      if (data.late_deductions !== undefined) {
        fields.push(`late_deductions = $${paramIndex++}`);
        values.push(data.late_deductions);
      }

      if (data.gross_pay !== undefined) {
        fields.push(`gross_pay = $${paramIndex++}`);
        values.push(data.gross_pay);
      }

      if (data.net_pay !== undefined) {
        fields.push(`net_pay = $${paramIndex++}`);
        values.push(data.net_pay);
      }

      if (data.total_deductions !== undefined) {
        fields.push(`total_deductions = $${paramIndex++}`);
        values.push(data.total_deductions);
      }

      if (data.total_benefits !== undefined) {
        fields.push(`total_benefits = $${paramIndex++}`);
        values.push(data.total_benefits);
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

  async getTotalNetPay(): Promise<number> {
    const client = await this.pool.connect();
    try {
      const query = 'SELECT COALESCE(SUM(net_pay), 0) as total FROM payroll_records WHERE status = $1';
      const result = await client.query(query, ['paid']);
      return parseFloat(result.rows[0].total) || 0;
    } catch (error) {
      logger.error('Error getting total net pay', { error: (error as Error).message });
      throw error;
    } finally {
      client.release();
    }
  }

  async getTotalDeductions(): Promise<number> {
    const client = await this.pool.connect();
    try {
      const query = 'SELECT COALESCE(SUM(total_deductions), 0) as total FROM payroll_records WHERE status = $1';
      const result = await client.query(query, ['paid']);
      return parseFloat(result.rows[0].total) || 0;
    } catch (error) {
      logger.error('Error getting total deductions', { error: (error as Error).message });
      throw error;
    } finally {
      client.release();
    }
  }
}

export const payrollRecordModel = new PayrollRecordModel();