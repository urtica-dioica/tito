import { Request, Response } from 'express';
import { hrRequestService } from '../../services/hr/hrRequestService';
import { getRequestId } from '../../utils/types/express';
import logger from '../../utils/logger';

export class HrRequestController {
  /**
   * List all employee requests with filtering and pagination
   */
  async listRequests(req: Request, res: Response): Promise<void> {
    const requestId = getRequestId(req);
    
    try {
      const {
        type,
        status,
        departmentId,
        search,
        page = 1,
        limit = 50
      } = req.query;

      const requests = await hrRequestService.getAllRequests({
        type: type as string,
        status: status as 'pending' | 'approved' | 'rejected',
        departmentId: departmentId as string,
        search: search as string,
        page: Number(page),
        limit: Number(limit)
      });

      res.json({
        success: true,
        data: requests,
        requestId
      });
    } catch (error) {
      logger.error('Error listing HR requests', { 
        error: (error as Error).message, 
        requestId,
        query: req.query
      });

      res.status(500).json({
        success: false,
        message: 'Failed to fetch requests',
        error: (error as Error).message,
        requestId
      });
    }
  }

  /**
   * Get request statistics
   */
  async getRequestStats(req: Request, res: Response): Promise<void> {
    const requestId = getRequestId(req);
    
    try {
      const stats = await hrRequestService.getRequestStats();

      res.json({
        success: true,
        data: stats,
        requestId
      });
    } catch (error) {
      logger.error('Error getting request stats', { 
        error: (error as Error).message, 
        requestId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to fetch request statistics',
        error: (error as Error).message,
        requestId
      });
    }
  }

  /**
   * Get request details by ID
   */
  async getRequestById(req: Request, res: Response): Promise<void> {
    const requestId = getRequestId(req);
    
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Request ID is required',
          requestId
        });
        return;
      }

      const request = await hrRequestService.getRequestById(id);

      if (!request) {
        res.status(404).json({
          success: false,
          message: 'Request not found',
          requestId
        });
        return;
      }

      res.json({
        success: true,
        data: request,
        requestId
      });
    } catch (error) {
      logger.error('Error getting request by ID', { 
        error: (error as Error).message, 
        requestId,
        params: req.params
      });

      res.status(500).json({
        success: false,
        message: 'Failed to fetch request details',
        error: (error as Error).message,
        requestId
      });
    }
  }
}

export const hrRequestController = new HrRequestController();
