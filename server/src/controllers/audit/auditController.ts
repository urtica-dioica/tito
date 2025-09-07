import { Request, Response } from 'express';
import { AuditService } from '../../services/audit/auditService';
import { ApiResponse } from '../../utils/types/express';

export class AuditController {
  private auditService: AuditService;

  constructor() {
    this.auditService = new AuditService();
  }

  async getAuditLogs(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
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
      } = req.query;

      const params = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        tableName: tableName as string,
        recordId: recordId as string,
        action: action as 'INSERT' | 'UPDATE' | 'DELETE',
        changedByUserId: changedByUserId as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        search: search as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc'
      };

      const result = await this.auditService.getAuditLogs(params);

      res.status(200).json({
        success: true,
        message: 'Audit logs retrieved successfully',
        data: result,
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve audit logs',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }
  }

  async getAuditLogById(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { id } = req.params;

      const auditLog = await this.auditService.getAuditLogById(id);

      if (!auditLog) {
        res.status(404).json({
          success: false,
          message: 'Audit log not found',
          timestamp: new Date().toISOString(),
          requestId: req.requestId
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Audit log retrieved successfully',
        data: auditLog,
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve audit log',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }
  }

  async getAuditLogsByRecord(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { tableName, recordId } = req.params;

      const auditLogs = await this.auditService.getAuditLogsByRecord(tableName, recordId);

      res.status(200).json({
        success: true,
        message: 'Audit logs for record retrieved successfully',
        data: auditLogs,
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve audit logs for record',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }
  }

  async getAuditLogsByUser(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { userId } = req.params;
      const { limit = 50 } = req.query;

      const auditLogs = await this.auditService.getAuditLogsByUser(
        userId, 
        parseInt(limit as string)
      );

      res.status(200).json({
        success: true,
        message: 'Audit logs for user retrieved successfully',
        data: auditLogs,
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve audit logs for user',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }
  }

  async getAuditStats(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const stats = await this.auditService.getAuditStats();

      res.status(200).json({
        success: true,
        message: 'Audit statistics retrieved successfully',
        data: stats,
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve audit statistics',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }
  }

  async cleanupOldLogs(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { daysToKeep = 90 } = req.body;

      const deletedCount = await this.auditService.cleanupOldLogs(parseInt(daysToKeep));

      res.status(200).json({
        success: true,
        message: 'Old audit logs cleaned up successfully',
        data: { deletedCount },
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to cleanup old audit logs',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }
  }
}