import { AuditLogModel, CreateAuditLogData, AuditLog, AuditLogListParams } from '../../models/audit/AuditLog';

export interface AuditLogWithUser extends AuditLog {
  changedByUser?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  } | null;
}

export interface AuditStats {
  totalLogs: number;
  logsByAction: Array<{ action: string; count: number }>;
  logsByTable: Array<{ tableName: string; count: number }>;
  recentActivity: number;
  topUsers: Array<{ userId: string; userName: string; count: number }>;
}

export class AuditService {
  private auditLogModel: AuditLogModel;

  constructor() {
    this.auditLogModel = new AuditLogModel();
  }

  async logAction(data: CreateAuditLogData): Promise<AuditLog> {
    return await this.auditLogModel.createAuditLog(data);
  }

  async getAuditLogs(params: AuditLogListParams = {}): Promise<{
    logs: AuditLogWithUser[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const result = await this.auditLogModel.listAuditLogs(params);
    
    // Enhance logs with user information
    const logsWithUsers = await Promise.all(
      result.logs.map(async (log) => {
        let changedByUser = null;
        if (log.changedByUserId) {
          try {
            // Import here to avoid circular dependency
            const { UserModel } = await import('../../models/auth/User');
            const userModel = new UserModel();
            const user = await userModel.findById(log.changedByUserId);
            if (user) {
              changedByUser = {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role
              };
            }
          } catch (error) {
            // User might not exist, continue without user info
          }
        }
        
        return {
          ...log,
          changedByUser
        };
      })
    );

    return {
      ...result,
      logs: logsWithUsers
    };
  }

  async getAuditLogById(id: string): Promise<AuditLogWithUser | null> {
    const log = await this.auditLogModel.findById(id);
    if (!log) {
      return null;
    }

    let changedByUser = null;
    if (log.changedByUserId) {
      try {
        const { UserModel } = await import('../../models/auth/User');
        const userModel = new UserModel();
        const user = await userModel.findById(log.changedByUserId);
        if (user) {
          changedByUser = {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            role: user.role
          };
        }
      } catch (error) {
        // User might not exist, continue without user info
      }
    }

    return {
      ...log,
      changedByUser
    };
  }

  async getAuditLogsByRecord(tableName: string, recordId: string): Promise<AuditLogWithUser[]> {
    const logs = await this.auditLogModel.getAuditLogsByRecord(tableName, recordId);
    
    const logsWithUsers = await Promise.all(
      logs.map(async (log) => {
        let changedByUser = null;
        if (log.changedByUserId) {
          try {
            const { UserModel } = await import('../../models/auth/User');
            const userModel = new UserModel();
            const user = await userModel.findById(log.changedByUserId);
            if (user) {
              changedByUser = {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role
              };
            }
          } catch (error) {
            // User might not exist, continue without user info
          }
        }
        
        return {
          ...log,
          changedByUser
        };
      })
    );

    return logsWithUsers;
  }

  async getAuditLogsByUser(userId: string, limit: number = 50): Promise<AuditLogWithUser[]> {
    const logs = await this.auditLogModel.getAuditLogsByUser(userId, limit);
    
    const logsWithUsers = await Promise.all(
      logs.map(async (log) => {
        let changedByUser = null;
        if (log.changedByUserId) {
          try {
            const { UserModel } = await import('../../models/auth/User');
            const userModel = new UserModel();
            const user = await userModel.findById(log.changedByUserId);
            if (user) {
              changedByUser = {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role
              };
            }
          } catch (error) {
            // User might not exist, continue without user info
          }
        }
        
        return {
          ...log,
          changedByUser
        };
      })
    );

    return logsWithUsers;
  }

  async getAuditStats(): Promise<AuditStats> {
    const basicStats = await this.auditLogModel.getAuditStats();
    
    // Get top users by activity
    const topUsersQuery = `
      SELECT 
        changed_by_user_id as user_id,
        u.email,
        u.first_name,
        u.last_name,
        COUNT(*) as count
      FROM audit_log al
      LEFT JOIN users u ON al.changed_by_user_id = u.id
      WHERE changed_by_user_id IS NOT NULL
      GROUP BY changed_by_user_id, u.email, u.first_name, u.last_name
      ORDER BY count DESC
      LIMIT 10
    `;
    
    const { getPool } = await import('../../config/database');
    const pool = getPool();
    const topUsersResult = await pool.query(topUsersQuery);
    
    const topUsers = topUsersResult.rows.map(row => ({
      userId: row.user_id,
      userName: `${row.first_name} ${row.last_name} (${row.email})`,
      count: parseInt(row.count)
    }));

    return {
      ...basicStats,
      topUsers
    };
  }

  async cleanupOldLogs(daysToKeep: number = 90): Promise<number> {
    return await this.auditLogModel.deleteOldAuditLogs(daysToKeep);
  }

  // Helper method to log user actions
  async logUserAction(
    userId: string,
    tableName: string,
    recordId: string,
    action: 'INSERT' | 'UPDATE' | 'DELETE',
    oldData?: any,
    newData?: any
  ): Promise<void> {
    await this.logAction({
      tableName,
      recordId,
      action,
      oldData,
      newData,
      changedByUserId: userId
    });
  }

  // Helper method to log system actions
  async logSystemAction(
    tableName: string,
    recordId: string,
    action: 'INSERT' | 'UPDATE' | 'DELETE',
    oldData?: any,
    newData?: any
  ): Promise<void> {
    await this.logAction({
      tableName,
      recordId,
      action,
      oldData,
      newData
      // No changedByUserId for system actions
    });
  }
}