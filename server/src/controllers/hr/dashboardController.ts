import { Request, Response } from 'express';
import { hrDashboardService } from '../../services/hr/dashboardService';
import { generateRequestId } from '../../utils/requestId';
import logger from '../../utils/logger';

export class HRDashboardController {
  /**
   * Get HR dashboard data
   */
  async getDashboard(_req: Request, res: Response): Promise<void> {
    const requestId = generateRequestId();
    
    try {
      const dashboardData = await hrDashboardService.getDashboardData();
      
      res.json({
        success: true,
        message: 'HR dashboard data retrieved successfully',
        data: dashboardData,
        requestId
      });
    } catch (error) {
      logger.error('Error getting HR dashboard:', { error, requestId });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve HR dashboard data',
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId
      });
    }
  }
}

export const hrDashboardController = new HRDashboardController();
