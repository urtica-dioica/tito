import { getPool } from '../../config/database';
import logger from '../../utils/logger';

export interface BenefitType {
  id: string;
  name: string;
  description?: string;
  amount: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateBenefitTypeData {
  name: string;
  description?: string;
  amount: number;
  is_active?: boolean;
}

export interface UpdateBenefitTypeData {
  name?: string;
  description?: string;
  amount?: number;
  is_active?: boolean;
}

export interface BenefitTypeListParams {
  is_active?: boolean;
  page?: number;
  limit?: number;
}

class BenefitTypeModel {
  private pool = getPool();

  async create(data: CreateBenefitTypeData): Promise<BenefitType> {
    const client = await this.pool.connect();
    try {
      const query = `
        INSERT INTO benefit_types (name, description, amount, is_active)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      const values = [
        data.name,
        data.description || null,
        data.amount,
        data.is_active ?? true
      ];
      
      const result = await client.query(query, values);
      const record = result.rows[0];
      
      logger.info('Benefit type created', { 
        recordId: record.id, 
        name: record.name
      });
      return record;
    } catch (error) {
      logger.error('Error creating benefit type', { error: (error as Error).message, data });
      throw error;
    } finally {
      client.release();
    }
  }

  async findById(id: string): Promise<BenefitType | null> {
    const client = await this.pool.connect();
    try {
      const query = 'SELECT * FROM benefit_types WHERE id = $1';
      const result = await client.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding benefit type by ID', { error: (error as Error).message, id });
      throw error;
    } finally {
      client.release();
    }
  }

  async findByName(name: string): Promise<BenefitType | null> {
    const client = await this.pool.connect();
    try {
      const query = 'SELECT * FROM benefit_types WHERE name = $1';
      const result = await client.query(query, [name]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding benefit type by name', { error: (error as Error).message, name });
      throw error;
    } finally {
      client.release();
    }
  }

  async findActive(): Promise<BenefitType[]> {
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT * FROM benefit_types 
        WHERE is_active = true 
        ORDER BY name ASC
      `;
      const result = await client.query(query);
      return result.rows;
    } catch (error) {
      logger.error('Error finding active benefit types', { error: (error as Error).message });
      throw error;
    } finally {
      client.release();
    }
  }

  async findAll(params: BenefitTypeListParams = {}): Promise<{ records: BenefitType[]; total: number }> {
    const client = await this.pool.connect();
    try {
      const { page = 1, limit = 10, is_active } = params;
      const offset = (page - 1) * limit;
      
      let whereClause = '';
      const conditions: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (is_active !== undefined) {
        conditions.push(`is_active = $${paramIndex++}`);
        values.push(is_active);
      }

      if (conditions.length > 0) {
        whereClause = `WHERE ${conditions.join(' AND ')}`;
      }

      // Get total count
      const countQuery = `SELECT COUNT(*) FROM benefit_types ${whereClause}`;
      const countResult = await client.query(countQuery, values);
      const total = parseInt(countResult.rows[0].count);

      // Get records
      const query = `
        SELECT * FROM benefit_types 
        ${whereClause}
        ORDER BY name ASC
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;
      values.push(limit, offset);
      
      const result = await client.query(query, values);
      
      return {
        records: result.rows,
        total
      };
    } catch (error) {
      logger.error('Error finding benefit types', { error: (error as Error).message, params });
      throw error;
    } finally {
      client.release();
    }
  }

  async update(id: string, data: UpdateBenefitTypeData): Promise<BenefitType | null> {
    const client = await this.pool.connect();
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (data.name !== undefined) {
        fields.push(`name = $${paramIndex++}`);
        values.push(data.name);
      }

      if (data.description !== undefined) {
        fields.push(`description = $${paramIndex++}`);
        values.push(data.description);
      }

      if (data.amount !== undefined) {
        fields.push(`amount = $${paramIndex++}`);
        values.push(data.amount);
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
        UPDATE benefit_types 
        SET ${fields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await client.query(query, values);
      
      if (result.rows.length === 0) {
        return null;
      }

      logger.info('Benefit type updated', { recordId: id, updates: data });
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating benefit type', { error: (error as Error).message, id, data });
      throw error;
    } finally {
      client.release();
    }
  }

  async delete(id: string): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      // Check if benefit type is being used by any employee benefits
      const checkQuery = 'SELECT COUNT(*) FROM employee_benefits WHERE benefit_type_id = $1';
      const checkResult = await client.query(checkQuery, [id]);
      const usageCount = parseInt(checkResult.rows[0].count);

      if (usageCount > 0) {
        throw new Error('Cannot delete benefit type that is being used by employee benefits');
      }

      const query = 'DELETE FROM benefit_types WHERE id = $1';
      const result = await client.query(query, [id]);
      
      const deleted = (result.rowCount || 0) > 0;
      if (deleted) {
        logger.info('Benefit type deleted', { recordId: id });
      }
      
      return deleted;
    } catch (error) {
      logger.error('Error deleting benefit type', { error: (error as Error).message, id });
      throw error;
    } finally {
      client.release();
    }
  }

  async count(): Promise<number> {
    const client = await this.pool.connect();
    try {
      const query = 'SELECT COUNT(*) FROM benefit_types';
      const result = await client.query(query);
      return parseInt(result.rows[0].count);
    } catch (error) {
      logger.error('Error counting benefit types', { error: (error as Error).message });
      throw error;
    } finally {
      client.release();
    }
  }
}

export const benefitTypeModel = new BenefitTypeModel();
