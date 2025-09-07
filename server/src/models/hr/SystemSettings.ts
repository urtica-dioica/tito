import { getPool } from '../../config/database';
import logger from '../../utils/logger';

export interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  description: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateSystemSettingData {
  setting_key: string;
  setting_value: string;
  description?: string | null;
  is_active?: boolean;
}

export interface UpdateSystemSettingData {
  setting_value?: string;
  description?: string | null;
  is_active?: boolean;
}

class SystemSettingsModel {
  private pool = getPool();

  async create(data: CreateSystemSettingData): Promise<SystemSetting> {
    const client = await this.pool.connect();
    try {
      const query = `
        INSERT INTO system_settings (setting_key, setting_value, description, is_active)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      const values = [
        data.setting_key,
        data.setting_value,
        data.description || null,
        data.is_active !== undefined ? data.is_active : true
      ];
      
      const result = await client.query(query, values);
      const setting = result.rows[0];
      
      logger.info('System setting created', { 
        settingId: setting.id, 
        settingKey: setting.setting_key 
      });
      return setting;
    } catch (error) {
      logger.error('Error creating system setting', { error: (error as Error).message, data });
      throw error;
    } finally {
      client.release();
    }
  }

  async findById(id: string): Promise<SystemSetting | null> {
    const client = await this.pool.connect();
    try {
      const query = 'SELECT * FROM system_settings WHERE id = $1';
      const result = await client.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding system setting by ID', { error: (error as Error).message, id });
      throw error;
    } finally {
      client.release();
    }
  }

  async findByKey(key: string): Promise<SystemSetting | null> {
    const client = await this.pool.connect();
    try {
      const query = 'SELECT * FROM system_settings WHERE setting_key = $1 AND is_active = true';
      const result = await client.query(query, [key]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding system setting by key', { error: (error as Error).message, key });
      throw error;
    } finally {
      client.release();
    }
  }

  async findAll(): Promise<SystemSetting[]> {
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT * FROM system_settings 
        WHERE is_active = true
        ORDER BY setting_key ASC
      `;
      const result = await client.query(query);
      return result.rows;
    } catch (error) {
      logger.error('Error finding system settings', { error: (error as Error).message });
      throw error;
    } finally {
      client.release();
    }
  }

  async update(id: string, data: UpdateSystemSettingData): Promise<SystemSetting | null> {
    const client = await this.pool.connect();
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (data.setting_value !== undefined) {
        fields.push(`setting_value = $${paramIndex++}`);
        values.push(data.setting_value);
      }

      if (data.description !== undefined) {
        fields.push(`description = $${paramIndex++}`);
        values.push(data.description);
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
        UPDATE system_settings 
        SET ${fields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await client.query(query, values);
      
      if (result.rows.length === 0) {
        return null;
      }

      logger.info('System setting updated', { settingId: id, updates: data });
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating system setting', { error: (error as Error).message, id, data });
      throw error;
    } finally {
      client.release();
    }
  }

  async updateByKey(key: string, value: string): Promise<SystemSetting | null> {
    const client = await this.pool.connect();
    try {
      const query = `
        UPDATE system_settings 
        SET setting_value = $1, updated_at = CURRENT_TIMESTAMP
        WHERE setting_key = $2
        RETURNING *
      `;
      const result = await client.query(query, [value, key]);
      
      if (result.rows.length === 0) {
        return null;
      }

      logger.info('System setting updated by key', { settingKey: key, newValue: value });
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating system setting by key', { error: (error as Error).message, key, value });
      throw error;
    } finally {
      client.release();
    }
  }

  async delete(id: string): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      const query = 'DELETE FROM system_settings WHERE id = $1';
      const result = await client.query(query, [id]);
      
      const deleted = (result.rowCount || 0) > 0;
      if (deleted) {
        logger.info('System setting deleted', { settingId: id });
      }
      
      return deleted;
    } catch (error) {
      logger.error('Error deleting system setting', { error: (error as Error).message, id });
      throw error;
    } finally {
      client.release();
    }
  }

  async deactivate(id: string): Promise<SystemSetting | null> {
    const client = await this.pool.connect();
    try {
      const query = `
        UPDATE system_settings 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;
      const result = await client.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }

      logger.info('System setting deactivated', { settingId: id });
      return result.rows[0];
    } catch (error) {
      logger.error('Error deactivating system setting', { error: (error as Error).message, id });
      throw error;
    } finally {
      client.release();
    }
  }
}

export const systemSettingsModel = new SystemSettingsModel();