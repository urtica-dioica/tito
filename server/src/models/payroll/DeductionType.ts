import { getPool } from '../../config/database';
import logger from '../../utils/logger';

export interface DeductionType {
  id: string;
  name: string;
  description: string | null;
  percentage: number | null;
  fixed_amount: number | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateDeductionTypeData {
  name: string;
  description?: string | null;
  percentage?: number | null;
  fixed_amount?: number | null;
  is_active?: boolean;
}

export interface UpdateDeductionTypeData {
  name?: string;
  description?: string | null;
  percentage?: number | null;
  fixed_amount?: number | null;
  is_active?: boolean;
}

export interface DeductionTypeListParams {
  is_active?: boolean;
  page?: number;
  limit?: number;
}

class DeductionTypeModel {
  private pool = getPool();

  async create(data: CreateDeductionTypeData): Promise<DeductionType> {
    const client = await this.pool.connect();
    try {
      const query = `
        INSERT INTO deduction_types (name, description, percentage, fixed_amount, is_active)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      const values = [
        data.name,
        data.description || null,
        data.percentage || null,
        data.fixed_amount || null,
        data.is_active !== undefined ? data.is_active : true
      ];
      
      const result = await client.query(query, values);
      const deductionType = result.rows[0];
      
      logger.info('Deduction type created', { 
        deductionTypeId: deductionType.id, 
        name: deductionType.name 
      });
      return deductionType;
    } catch (error) {
      logger.error('Error creating deduction type', { error: (error as Error).message, data });
      throw error;
    } finally {
      client.release();
    }
  }

  async findById(id: string): Promise<DeductionType | null> {
    const client = await this.pool.connect();
    try {
      const query = 'SELECT * FROM deduction_types WHERE id = $1';
      const result = await client.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding deduction type by ID', { error: (error as Error).message, id });
      throw error;
    } finally {
      client.release();
    }
  }

  async findByName(name: string): Promise<DeductionType | null> {
    const client = await this.pool.connect();
    try {
      const query = 'SELECT * FROM deduction_types WHERE name = $1';
      const result = await client.query(query, [name]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding deduction type by name', { error: (error as Error).message, name });
      throw error;
    } finally {
      client.release();
    }
  }

  async findAll(params: DeductionTypeListParams = {}): Promise<{ records: DeductionType[]; total: number }> {
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
      const countQuery = `SELECT COUNT(*) FROM deduction_types ${whereClause}`;
      const countResult = await client.query(countQuery, values);
      const total = parseInt(countResult.rows[0].count);

      // Get deduction types
      const query = `
        SELECT * FROM deduction_types 
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
      logger.error('Error finding deduction types', { error: (error as Error).message, params });
      throw error;
    } finally {
      client.release();
    }
  }

  async findActive(): Promise<DeductionType[]> {
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT * FROM deduction_types 
        WHERE is_active = true
        ORDER BY name ASC
      `;
      const result = await client.query(query);
      return result.rows;
    } catch (error) {
      logger.error('Error finding active deduction types', { error: (error as Error).message });
      throw error;
    } finally {
      client.release();
    }
  }

  async update(id: string, data: UpdateDeductionTypeData): Promise<DeductionType | null> {
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

      if (data.percentage !== undefined) {
        fields.push(`percentage = $${paramIndex++}`);
        values.push(data.percentage);
      }

      if (data.fixed_amount !== undefined) {
        fields.push(`fixed_amount = $${paramIndex++}`);
        values.push(data.fixed_amount);
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
        UPDATE deduction_types 
        SET ${fields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await client.query(query, values);
      
      if (result.rows.length === 0) {
        return null;
      }

      logger.info('Deduction type updated', { deductionTypeId: id, updates: data });
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating deduction type', { error: (error as Error).message, id, data });
      throw error;
    } finally {
      client.release();
    }
  }

  async delete(id: string): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      const query = 'DELETE FROM deduction_types WHERE id = $1';
      const result = await client.query(query, [id]);
      
      const deleted = (result.rowCount || 0) > 0;
      if (deleted) {
        logger.info('Deduction type deleted', { deductionTypeId: id });
      }
      
      return deleted;
    } catch (error) {
      logger.error('Error deleting deduction type', { error: (error as Error).message, id });
      throw error;
    } finally {
      client.release();
    }
  }

  async deactivate(id: string): Promise<DeductionType | null> {
    const client = await this.pool.connect();
    try {
      const query = `
        UPDATE deduction_types 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;
      const result = await client.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }

      logger.info('Deduction type deactivated', { deductionTypeId: id });
      return result.rows[0];
    } catch (error) {
      logger.error('Error deactivating deduction type', { error: (error as Error).message, id });
      throw error;
    } finally {
      client.release();
    }
  }

  async activate(id: string): Promise<DeductionType | null> {
    const client = await this.pool.connect();
    try {
      const query = `
        UPDATE deduction_types 
        SET is_active = true, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;
      const result = await client.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }

      logger.info('Deduction type activated', { deductionTypeId: id });
      return result.rows[0];
    } catch (error) {
      logger.error('Error activating deduction type', { error: (error as Error).message, id });
      throw error;
    } finally {
      client.release();
    }
  }
}

export const deductionTypeModel = new DeductionTypeModel();