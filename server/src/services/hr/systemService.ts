import { getPool } from '../../config/database';
import logger from '../../utils/logger';

export interface SystemSetting {
  id: string;
  settingKey: string;
  settingValue: string;
  dataType: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSystemSettingData {
  settingKey: string;
  settingValue: string;
  dataType: string;
  description?: string;
}

export interface UpdateSystemSettingData {
  settingValue?: string;
  dataType?: string;
  description?: string;
}

export interface SystemStats {
  totalUsers: number;
  totalEmployees: number;
  totalDepartments: number;
  activePayrollPeriods: number;
  pendingRequests: number;
  systemUptime: string;
  lastBackup: string | null;
}

export class SystemService {
  /**
   * Get all system settings
   */
  async getSystemSettings(): Promise<SystemSetting[]> {
    const query = `
      SELECT 
        id,
        setting_key as "settingKey",
        setting_value as "settingValue",
        data_type as "dataType",
        description,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM system_settings
      ORDER BY setting_key
    `;

    const result = await getPool().query(query);
    return result.rows;
  }

  /**
   * Get system setting by key
   */
  async getSystemSetting(key: string): Promise<SystemSetting | null> {
    const query = `
      SELECT 
        id,
        setting_key as "settingKey",
        setting_value as "settingValue",
        data_type as "dataType",
        description,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM system_settings
      WHERE setting_key = $1
    `;

    const result = await getPool().query(query, [key]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Create new system setting
   */
  async createSystemSetting(data: CreateSystemSettingData): Promise<SystemSetting> {
    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check if setting key already exists
      const existingSetting = await this.getSystemSetting(data.settingKey);
      if (existingSetting) {
        throw new Error('System setting key already exists');
      }

      const query = `
        INSERT INTO system_settings (setting_key, setting_value, data_type, description)
        VALUES ($1, $2, $3, $4)
        RETURNING 
          id,
          setting_key as "settingKey",
          setting_value as "settingValue",
          data_type as "dataType",
          description,
          created_at as "createdAt",
          updated_at as "updatedAt"
      `;

      const result = await client.query(query, [
        data.settingKey,
        data.settingValue,
        data.dataType,
        data.description || null
      ]);

      await client.query('COMMIT');

      const setting = result.rows[0];

      logger.info(`System setting created successfully: ${data.settingKey}`, {
        settingId: setting.id,
        settingKey: data.settingKey,
        settingValue: data.settingValue
      });

      return setting;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to create system setting', { error: (error as Error).message, data });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update system setting
   */
  async updateSystemSetting(key: string, data: UpdateSystemSettingData): Promise<SystemSetting> {
    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get current setting
      const currentSetting = await this.getSystemSetting(key);
      if (!currentSetting) {
        throw new Error('System setting not found');
      }

      // Validate setting value if provided
      if (data.settingValue && data.settingValue.trim() === '') {
        throw new Error('Setting value cannot be empty');
      }

      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramIndex = 1;

      if (data.settingValue !== undefined) {
        updateFields.push(`setting_value = $${paramIndex}`);
        updateValues.push(data.settingValue);
        paramIndex++;
      }

      if (data.description !== undefined) {
        updateFields.push(`description = $${paramIndex}`);
        updateValues.push(data.description);
        paramIndex++;
      }

      if (data.dataType !== undefined) {
        updateFields.push(`data_type = $${paramIndex}`);
        updateValues.push(data.dataType);
        paramIndex++;
      }

      if (updateFields.length === 0) {
        throw new Error('No fields to update');
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      updateValues.push(key);

      const query = `
        UPDATE system_settings 
        SET ${updateFields.join(', ')}
        WHERE setting_key = $${paramIndex}
        RETURNING 
          id,
          setting_key as "settingKey",
          setting_value as "settingValue",
          data_type as "dataType",
          description,
          created_at as "createdAt",
          updated_at as "updatedAt"
      `;

      const result = await client.query(query, updateValues);

      await client.query('COMMIT');

      const setting = result.rows[0];

      logger.info(`System setting updated successfully: ${key}`, {
        settingId: setting.id,
        updates: { ...data }
      });

      return setting;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to update system setting', { error: (error as Error).message, key, data });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Delete system setting (hard delete)
   */
  async deleteSystemSetting(key: string): Promise<void> {
    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check if setting exists
      const currentSetting = await this.getSystemSetting(key);
      if (!currentSetting) {
        throw new Error('System setting not found');
      }

      // Hard delete the setting
      const query = `
        DELETE FROM system_settings 
        WHERE setting_key = $1
      `;

      await client.query(query, [key]);

      await client.query('COMMIT');

      logger.info(`System setting deleted successfully: ${key}`, {
        settingId: currentSetting.id
      });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to delete system setting', { error: (error as Error).message, key });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get system statistics
   */
  async getSystemStats(): Promise<SystemStats> {
    const queries = {
      totalUsers: 'SELECT COUNT(*) as count FROM users WHERE is_active = true',
      totalEmployees: `
        SELECT COUNT(*) as count 
        FROM employees e 
        JOIN users u ON e.user_id = u.id 
        WHERE u.is_active = true AND e.status = 'active'
      `,
      totalDepartments: 'SELECT COUNT(*) as count FROM departments WHERE is_active = true',
      activePayrollPeriods: `
        SELECT COUNT(*) as count 
        FROM payroll_periods 
        WHERE status IN ('draft', 'processing', 'sent_for_review')
      `,
      pendingRequests: `
        SELECT (
          (SELECT COUNT(*) FROM time_correction_requests WHERE status = 'pending') +
          (SELECT COUNT(*) FROM overtime_requests WHERE status = 'pending') +
          (SELECT COUNT(*) FROM leaves WHERE status = 'pending')
        ) as count
      `
    };

    const results = await Promise.all([
      getPool().query(queries.totalUsers),
      getPool().query(queries.totalEmployees),
      getPool().query(queries.totalDepartments),
      getPool().query(queries.activePayrollPeriods),
      getPool().query(queries.pendingRequests)
    ]);

    const [
      totalUsers,
      totalEmployees,
      totalDepartments,
      activePayrollPeriods,
      pendingRequests
    ] = results.map(result => parseInt(result.rows[0].count) || 0);

    // Calculate system uptime (simplified - in real implementation, you'd track this)
    const systemUptime = this.calculateSystemUptime();
    const lastBackup = await this.getLastBackupDate();

    return {
      totalUsers: totalUsers || 0,
      totalEmployees: totalEmployees || 0,
      totalDepartments: totalDepartments || 0,
      activePayrollPeriods: activePayrollPeriods || 0,
      pendingRequests: pendingRequests || 0,
      systemUptime,
      lastBackup
    };
  }

  /**
   * Get system health status
   */
  async getSystemHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    database: 'connected' | 'disconnected';
    redis: 'connected' | 'disconnected';
    diskSpace: 'ok' | 'warning' | 'critical';
    memoryUsage: 'ok' | 'warning' | 'critical';
    lastCheck: Date;
  }> {
    const health: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      database: 'connected' | 'disconnected';
      redis: 'connected' | 'disconnected';
      diskSpace: 'ok' | 'warning' | 'critical';
      memoryUsage: 'ok' | 'warning' | 'critical';
      lastCheck: Date;
    } = {
      status: 'healthy',
      database: 'connected',
      redis: 'connected',
      diskSpace: 'ok',
      memoryUsage: 'ok',
      lastCheck: new Date()
    };

    try {
      // Test database connection
      await getPool().query('SELECT 1');
    } catch (error) {
      health.database = 'disconnected';
      health.status = 'unhealthy';
    }

    // In a real implementation, you would:
    // - Test Redis connection
    // - Check disk space
    // - Check memory usage
    // - Set appropriate status based on results

    return health;
  }


  /**
   * Calculate system uptime (simplified implementation)
   */
  private calculateSystemUptime(): string {
    // In a real implementation, you would track when the system started
    // For now, return a placeholder
    return '99.9%';
  }

  /**
   * Get last backup date (simplified implementation)
   */
  private async getLastBackupDate(): Promise<string | null> {
    // In a real implementation, you would query backup logs
    // For now, return null
    return null;
  }
}