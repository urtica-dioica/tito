import { Pool } from 'pg';
import { getPool } from '../../config/database';

export interface AuditLog {
  id: string;
  tableName: string;
  recordId: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  oldData: any | null;
  newData: any | null;
  changedByUserId: string | null;
  changedAt: Date;
}

export interface CreateAuditLogData {
  tableName: string;
  recordId: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  oldData?: any;
  newData?: any;
  changedByUserId?: string;
}

export interface AuditLogListParams {
  page?: number;
  limit?: number;
  tableName?: string;
  recordId?: string;
  action?: 'INSERT' | 'UPDATE' | 'DELETE';
  changedByUserId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class AuditLogModel {
  private pool: Pool;

  constructor() {
    this.pool = getPool();
  }

  async createAuditLog(data: CreateAuditLogData): Promise<AuditLog> {
    const query = `
      INSERT INTO audit_log (
        table_name, record_id, action, old_data, new_data, changed_by_user_id
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [
      data.tableName,
      data.recordId,
      data.action,
      data.oldData ? JSON.stringify(data.oldData) : null,
      data.newData ? JSON.stringify(data.newData) : null,
      data.changedByUserId || null
    ];

    const result = await this.pool.query(query, values);
    return this.mapRowToAuditLog(result.rows[0]);
  }

  async findById(id: string): Promise<AuditLog | null> {
    const query = 'SELECT * FROM audit_log WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapRowToAuditLog(result.rows[0]);
  }

  async listAuditLogs(params: AuditLogListParams = {}): Promise<{
    logs: AuditLog[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 20,
      tableName,
      recordId,
      action,
      changedByUserId,
      startDate,
      endDate,
      search,
      sortBy = 'changed_at',
      sortOrder = 'desc'
    } = params;

    const offset = (page - 1) * limit;
    let whereConditions: string[] = [];
    let values: any[] = [];
    let valueIndex = 1;

    // Build WHERE conditions
    if (tableName) {
      whereConditions.push(`table_name = $${valueIndex}`);
      values.push(tableName);
      valueIndex++;
    }

    if (recordId) {
      whereConditions.push(`record_id = $${valueIndex}`);
      values.push(recordId);
      valueIndex++;
    }

    if (action) {
      whereConditions.push(`action = $${valueIndex}`);
      values.push(action);
      valueIndex++;
    }

    if (changedByUserId) {
      whereConditions.push(`changed_by_user_id = $${valueIndex}`);
      values.push(changedByUserId);
      valueIndex++;
    }

    if (startDate) {
      whereConditions.push(`changed_at >= $${valueIndex}`);
      values.push(startDate);
      valueIndex++;
    }

    if (endDate) {
      whereConditions.push(`changed_at <= $${valueIndex}`);
      values.push(endDate);
      valueIndex++;
    }

    if (search) {
      whereConditions.push(`(
        table_name ILIKE $${valueIndex} OR 
        action ILIKE $${valueIndex} OR
        old_data::text ILIKE $${valueIndex} OR
        new_data::text ILIKE $${valueIndex}
      )`);
      values.push(`%${search}%`);
      valueIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Count query
    const countQuery = `SELECT COUNT(*) FROM audit_log ${whereClause}`;
    const countResult = await this.pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count);

    // Main query
    const query = `
      SELECT * FROM audit_log 
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
      LIMIT $${valueIndex} OFFSET $${valueIndex + 1}
    `;
    values.push(limit, offset);

    const result = await this.pool.query(query, values);
    const logs = result.rows.map(row => this.mapRowToAuditLog(row));

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getAuditLogsByRecord(tableName: string, recordId: string): Promise<AuditLog[]> {
    const query = `
      SELECT * FROM audit_log 
      WHERE table_name = $1 AND record_id = $2 
      ORDER BY changed_at DESC
    `;
    
    const result = await this.pool.query(query, [tableName, recordId]);
    return result.rows.map(row => this.mapRowToAuditLog(row));
  }

  async getAuditLogsByUser(userId: string, limit: number = 50): Promise<AuditLog[]> {
    const query = `
      SELECT * FROM audit_log 
      WHERE changed_by_user_id = $1 
      ORDER BY changed_at DESC 
      LIMIT $2
    `;
    
    const result = await this.pool.query(query, [userId, limit]);
    return result.rows.map(row => this.mapRowToAuditLog(row));
  }

  async getAuditStats(): Promise<{
    totalLogs: number;
    logsByAction: Array<{ action: string; count: number }>;
    logsByTable: Array<{ tableName: string; count: number }>;
    recentActivity: number;
  }> {
    const totalQuery = 'SELECT COUNT(*) FROM audit_log';
    const totalResult = await this.pool.query(totalQuery);
    const totalLogs = parseInt(totalResult.rows[0].count);

    const actionQuery = `
      SELECT action, COUNT(*) as count 
      FROM audit_log 
      GROUP BY action 
      ORDER BY count DESC
    `;
    const actionResult = await this.pool.query(actionQuery);

    const tableQuery = `
      SELECT table_name, COUNT(*) as count 
      FROM audit_log 
      GROUP BY table_name 
      ORDER BY count DESC
    `;
    const tableResult = await this.pool.query(tableQuery);

    const recentQuery = `
      SELECT COUNT(*) FROM audit_log 
      WHERE changed_at >= NOW() - INTERVAL '24 hours'
    `;
    const recentResult = await this.pool.query(recentQuery);
    const recentActivity = parseInt(recentResult.rows[0].count);

    return {
      totalLogs,
      logsByAction: actionResult.rows,
      logsByTable: tableResult.rows,
      recentActivity
    };
  }

  async deleteOldAuditLogs(daysToKeep: number = 90): Promise<number> {
    const query = `
      DELETE FROM audit_log 
      WHERE changed_at < NOW() - INTERVAL '${daysToKeep} days'
    `;
    
    const result = await this.pool.query(query);
    return result.rowCount || 0;
  }

  private mapRowToAuditLog(row: any): AuditLog {
    return {
      id: row.id,
      tableName: row.table_name,
      recordId: row.record_id,
      action: row.action,
      oldData: row.old_data ? JSON.parse(row.old_data) : null,
      newData: row.new_data ? JSON.parse(row.new_data) : null,
      changedByUserId: row.changed_by_user_id,
      changedAt: row.changed_at
    };
  }
}