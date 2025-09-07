import { Request, Response, NextFunction } from 'express';
import { AuditService } from '../../services/audit/auditService';

export interface AuditableRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
    tokenVersion: number;
  };
}

export class AuditMiddleware {
  private auditService: AuditService;

  constructor() {
    this.auditService = new AuditService();
  }

  // Middleware to log user actions
  logUserAction = (tableName: string, recordIdExtractor?: (req: Request) => string) => {
    return async (req: AuditableRequest, res: Response, next: NextFunction) => {
      const originalSend = res.send;

      // Capture response body
      res.send = function(body: any) {
        return originalSend.call(this, body);
      };

      res.on('finish', async () => {
        try {
          // Only log successful operations
          if (res.statusCode >= 200 && res.statusCode < 300) {
            const userId = req.user?.userId;
            if (!userId) return;

            let recordId: string;
            if (recordIdExtractor) {
              recordId = recordIdExtractor(req);
            } else {
              // Default: try to get ID from params
              recordId = req.params.id || req.params.recordId || 'unknown';
            }

            let action: 'INSERT' | 'UPDATE' | 'DELETE' = 'UPDATE';
            if (req.method === 'POST') {
              action = 'INSERT';
            } else if (req.method === 'DELETE') {
              action = 'DELETE';
            }

            // Extract old and new data from request/response
            let oldData: any = null;
            let newData: any = null;

            if (action === 'UPDATE' && req.body) {
              newData = req.body;
              // For updates, we might want to fetch old data
              // This would require additional database queries
            } else if (action === 'INSERT' && req.body) {
              newData = req.body;
            } else if (action === 'DELETE') {
              // For deletes, we might want to fetch the record being deleted
              // This would require additional database queries
            }

            await this.auditService.logUserAction(
              userId,
              tableName,
              recordId,
              action,
              oldData,
              newData
            );
          }
        } catch (error) {
          // Don't let audit logging errors break the main flow
          console.error('Audit logging error:', error);
        }
      });

      next();
    };
  };

  // Middleware to log specific actions with custom data
  logCustomAction = (
    tableName: string,
    action: 'INSERT' | 'UPDATE' | 'DELETE',
    dataExtractor: (req: Request, res: Response) => { recordId: string; oldData?: any; newData?: any }
  ) => {
    return async (req: AuditableRequest, res: Response, next: NextFunction) => {
      const originalSend = res.send;

      res.send = function(body: any) {
        return originalSend.call(this, body);
      };

      res.on('finish', async () => {
        try {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            const userId = req.user?.userId;
            if (!userId) return;

            const { recordId, oldData, newData } = dataExtractor(req, res);

            await this.auditService.logUserAction(
              userId,
              tableName,
              recordId,
              action,
              oldData,
              newData
            );
          }
        } catch (error) {
          console.error('Audit logging error:', error);
        }
      });

      next();
    };
  };

  // Middleware to log system actions (no user context)
  logSystemAction = (
    tableName: string,
    action: 'INSERT' | 'UPDATE' | 'DELETE',
    dataExtractor: (req: Request, res: Response) => { recordId: string; oldData?: any; newData?: any }
  ) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      const originalSend = res.send;

      res.send = function(body: any) {
        return originalSend.call(this, body);
      };

      res.on('finish', async () => {
        try {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            const { recordId, oldData, newData } = dataExtractor(req, res);

            await this.auditService.logSystemAction(
              tableName,
              recordId,
              action,
              oldData,
              newData
            );
          }
        } catch (error) {
          console.error('Audit logging error:', error);
        }
      });

      next();
    };
  };
}

// Create singleton instance
export const auditMiddleware = new AuditMiddleware();

// Helper function to create audit middleware for common patterns
export const createAuditMiddleware = (tableName: string) => {
  return {
    logCreate: auditMiddleware.logUserAction(tableName, (req) => req.body.id || 'new'),
    logUpdate: auditMiddleware.logUserAction(tableName, (req) => req.params.id),
    logDelete: auditMiddleware.logUserAction(tableName, (req) => req.params.id),
    logCustom: (action: 'INSERT' | 'UPDATE' | 'DELETE', dataExtractor: (req: Request, res: Response) => { recordId: string; oldData?: any; newData?: any }) =>
      auditMiddleware.logCustomAction(tableName, action, dataExtractor)
  };
};