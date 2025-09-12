import { Request, Response } from 'express';
import { schedulerService } from '../../services/scheduler/schedulerService';
import { ApiResponse } from '../../utils/types/express';

export class SchedulerController {
  /**
   * Get scheduler status
   */
  async getStatus(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const status = schedulerService.getStatus();

      res.status(200).json({
        success: true,
        message: 'Scheduler status retrieved successfully',
        data: status,
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get scheduler status',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }
  }

  /**
   * Start scheduler service
   */
  async start(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      schedulerService.start();

      res.status(200).json({
        success: true,
        message: 'Scheduler service started successfully',
        data: { status: 'started' },
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to start scheduler service',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }
  }

  /**
   * Stop scheduler service
   */
  async stop(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      schedulerService.stop();

      res.status(200).json({
        success: true,
        message: 'Scheduler service stopped successfully',
        data: { status: 'stopped' },
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to stop scheduler service',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }
  }

  /**
   * Manually trigger selfie cleanup
   */
  async triggerSelfieCleanup(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const deletedCount = await schedulerService.triggerSelfieCleanup();

      res.status(200).json({
        success: true,
        message: 'Selfie cleanup triggered successfully',
        data: { deletedCount },
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to trigger selfie cleanup',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }
  }

  /**
   * Manually trigger audit log cleanup
   */
  async triggerAuditLogCleanup(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { daysToKeep = 90 } = req.body;
      const deletedCount = await schedulerService.triggerAuditLogCleanup(parseInt(daysToKeep));

      res.status(200).json({
        success: true,
        message: 'Audit log cleanup triggered successfully',
        data: { deletedCount },
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to trigger audit log cleanup',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }
  }
}

export const schedulerController = new SchedulerController();
