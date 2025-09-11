import { getPool } from '../../config/database';
import logger from '../../utils/logger';

export interface EmployeeBenefit {
  id: string;
  employee_id: string;
  benefit_type_id: string;
  amount: number;
  start_date: Date;
  end_date?: Date;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  benefit_type?: { // Added for joined queries
    name: string;
    description?: string;
  };
}

export interface EmployeeBenefitWithDetails extends EmployeeBenefit {
  benefit_type: {
    name: string;
    description?: string;
  };
  employee: {
    employee_id: string;
    user: {
      first_name: string;
      last_name: string;
    };
  };
}

export interface CreateEmployeeBenefitData {
  employee_id: string;
  benefit_type_id: string;
  amount: number;
  start_date: Date;
  end_date?: Date;
  is_active?: boolean;
}

export interface UpdateEmployeeBenefitData {
  benefit_type_id?: string;
  amount?: number;
  start_date?: Date;
  end_date?: Date;
  is_active?: boolean;
}

export interface EmployeeBenefitListParams {
  employee_id?: string;
  benefit_type_id?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
}

class EmployeeBenefitModel {
  private pool = getPool();

  async create(data: CreateEmployeeBenefitData): Promise<EmployeeBenefit> {
    const client = await this.pool.connect();
    try {
      const query = `
        INSERT INTO employee_benefits (
          employee_id, benefit_type_id, amount, start_date, end_date, is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      const values = [
        data.employee_id,
        data.benefit_type_id,
        data.amount,
        data.start_date,
        data.end_date || null,
        data.is_active ?? true
      ];
      
      const result = await client.query(query, values);
      const record = result.rows[0];
      
      logger.info('Employee benefit created', { 
        recordId: record.id, 
        employeeId: record.employee_id,
        benefitTypeId: record.benefit_type_id
      });
      return record;
    } catch (error) {
      logger.error('Error creating employee benefit', { error: (error as Error).message, data });
      throw error;
    } finally {
      client.release();
    }
  }

  async findById(id: string): Promise<EmployeeBenefit | null> {
    const client = await this.pool.connect();
    try {
      const query = 'SELECT * FROM employee_benefits WHERE id = $1';
      const result = await client.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding employee benefit by ID', { error: (error as Error).message, id });
      throw error;
    } finally {
      client.release();
    }
  }

  async findByEmployee(employeeId: string): Promise<EmployeeBenefitWithDetails[]> {
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT 
          eb.*,
          bt.name as benefit_type_name,
          bt.description as benefit_type_description,
          e.employee_id,
          u.first_name,
          u.last_name
        FROM employee_benefits eb
        JOIN benefit_types bt ON eb.benefit_type_id = bt.id
        JOIN employees e ON eb.employee_id = e.id
        JOIN users u ON e.user_id = u.id
        WHERE eb.employee_id = $1
        ORDER BY eb.created_at DESC
      `;
      const result = await client.query(query, [employeeId]);
      
      return result.rows.map(row => ({
        id: row.id,
        employee_id: row.employee_id,
        benefit_type_id: row.benefit_type_id,
        amount: parseFloat(row.amount) || 0,
        start_date: row.start_date,
        end_date: row.end_date,
        is_active: row.is_active,
        created_at: row.created_at,
        updated_at: row.updated_at,
        benefit_type: {
          name: row.benefit_type_name,
          description: row.benefit_type_description
        },
        employee: {
          employee_id: row.employee_id,
          user: {
            first_name: row.first_name,
            last_name: row.last_name
          }
        }
      }));
    } catch (error) {
      logger.error('Error finding employee benefits by employee', { 
        error: (error as Error).message, 
        employeeId 
      });
      throw error;
    } finally {
      client.release();
    }
  }

  async findActiveByEmployee(employeeId: string): Promise<EmployeeBenefit[]> {
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT 
          eb.*,
          bt.name as benefit_type_name,
          bt.description as benefit_type_description
        FROM employee_benefits eb
        JOIN benefit_types bt ON eb.benefit_type_id = bt.id
        WHERE eb.employee_id = $1 
        AND eb.is_active = true
        AND (eb.end_date IS NULL OR eb.end_date >= CURRENT_DATE)
        ORDER BY eb.created_at DESC
      `;
      const result = await client.query(query, [employeeId]);
      
      return result.rows.map(row => ({
        id: row.id,
        employee_id: row.employee_id,
        benefit_type_id: row.benefit_type_id,
        amount: parseFloat(row.amount) || 0,
        start_date: row.start_date,
        end_date: row.end_date,
        is_active: row.is_active,
        created_at: row.created_at,
        updated_at: row.updated_at,
        benefit_type: {
          name: row.benefit_type_name,
          description: row.benefit_type_description
        }
      }));
    } catch (error) {
      logger.error('Error finding active employee benefits', { 
        error: (error as Error).message, 
        employeeId 
      });
      throw error;
    } finally {
      client.release();
    }
  }

  async findAll(params: EmployeeBenefitListParams = {}): Promise<{ records: EmployeeBenefitWithDetails[]; total: number }> {
    const client = await this.pool.connect();
    try {
      const { page = 1, limit = 10, employee_id, benefit_type_id, is_active } = params;
      const offset = (page - 1) * limit;
      
      let whereClause = '';
      const conditions: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (employee_id) {
        conditions.push(`eb.employee_id = $${paramIndex++}`);
        values.push(employee_id);
      }

      if (benefit_type_id) {
        conditions.push(`eb.benefit_type_id = $${paramIndex++}`);
        values.push(benefit_type_id);
      }

      if (is_active !== undefined) {
        conditions.push(`eb.is_active = $${paramIndex++}`);
        values.push(is_active);
      }

      if (conditions.length > 0) {
        whereClause = `WHERE ${conditions.join(' AND ')}`;
      }

      // Get total count
      const countQuery = `
        SELECT COUNT(*) FROM employee_benefits eb
        ${whereClause}
      `;
      const countResult = await client.query(countQuery, values);
      const total = parseInt(countResult.rows[0].count);

      // Get records
      const query = `
        SELECT 
          eb.*,
          bt.name as benefit_type_name,
          bt.description as benefit_type_description,
          e.employee_id,
          u.first_name,
          u.last_name
        FROM employee_benefits eb
        JOIN benefit_types bt ON eb.benefit_type_id = bt.id
        JOIN employees e ON eb.employee_id = e.id
        JOIN users u ON e.user_id = u.id
        ${whereClause}
        ORDER BY eb.created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;
      values.push(limit, offset);
      
      const result = await client.query(query, values);
      
      const records: EmployeeBenefitWithDetails[] = result.rows.map(row => ({
        id: row.id,
        employee_id: row.employee_id,
        benefit_type_id: row.benefit_type_id,
        amount: parseFloat(row.amount) || 0,
        start_date: row.start_date,
        end_date: row.end_date,
        is_active: row.is_active,
        created_at: row.created_at,
        updated_at: row.updated_at,
        benefit_type: {
          name: row.benefit_type_name,
          description: row.benefit_type_description
        },
        employee: {
          employee_id: row.employee_id,
          user: {
            first_name: row.first_name,
            last_name: row.last_name
          }
        }
      }));
      
      return {
        records,
        total
      };
    } catch (error) {
      logger.error('Error finding employee benefits', { error: (error as Error).message, params });
      throw error;
    } finally {
      client.release();
    }
  }

  async update(id: string, data: UpdateEmployeeBenefitData): Promise<EmployeeBenefit | null> {
    const client = await this.pool.connect();
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (data.benefit_type_id !== undefined) {
        fields.push(`benefit_type_id = $${paramIndex++}`);
        values.push(data.benefit_type_id);
      }

      if (data.amount !== undefined) {
        fields.push(`amount = $${paramIndex++}`);
        values.push(data.amount);
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
        UPDATE employee_benefits 
        SET ${fields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await client.query(query, values);
      
      if (result.rows.length === 0) {
        return null;
      }

      logger.info('Employee benefit updated', { recordId: id, updates: data });
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating employee benefit', { error: (error as Error).message, id, data });
      throw error;
    } finally {
      client.release();
    }
  }

  async delete(id: string): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      const query = 'DELETE FROM employee_benefits WHERE id = $1';
      const result = await client.query(query, [id]);
      
      const deleted = (result.rowCount || 0) > 0;
      if (deleted) {
        logger.info('Employee benefit deleted', { recordId: id });
      }
      
      return deleted;
    } catch (error) {
      logger.error('Error deleting employee benefit', { error: (error as Error).message, id });
      throw error;
    } finally {
      client.release();
    }
  }

  async findByEmployeeAndBenefitTypeAndDate(employeeId: string, benefitTypeId: string, startDate: Date): Promise<EmployeeBenefit | null> {
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT * FROM employee_benefits 
        WHERE employee_id = $1 
        AND benefit_type_id = $2 
        AND start_date = $3
      `;
      const result = await client.query(query, [employeeId, benefitTypeId, startDate]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding employee benefit by employee, benefit type, and date', { 
        error: (error as Error).message, 
        employeeId, 
        benefitTypeId, 
        startDate 
      });
      throw error;
    } finally {
      client.release();
    }
  }

  async bulkCreate(data: CreateEmployeeBenefitData[]): Promise<EmployeeBenefit[]> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      const records: EmployeeBenefit[] = [];
      
      for (const item of data) {
        const query = `
          INSERT INTO employee_benefits (
            employee_id, benefit_type_id, amount, start_date, end_date, is_active
          )
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `;
        const values = [
          item.employee_id,
          item.benefit_type_id,
          item.amount,
          item.start_date,
          item.end_date || null,
          item.is_active ?? true
        ];
        
        const result = await client.query(query, values);
        records.push(result.rows[0]);
      }
      
      await client.query('COMMIT');
      
      logger.info('Employee benefits bulk created', { count: records.length });
      return records;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error bulk creating employee benefits', { error: (error as Error).message });
      throw error;
    } finally {
      client.release();
    }
  }
}

export const employeeBenefitModel = new EmployeeBenefitModel();
