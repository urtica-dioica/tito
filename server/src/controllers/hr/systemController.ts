import { Request, Response } from 'express';
import { SystemService, CreateSystemSettingData, UpdateSystemSettingData } from '../../services/hr/systemService';
import logger from '../../utils/logger';
import { getRequestId } from '../../utils/types/express';

export class SystemController {
  private systemService: SystemService;

  constructor() {
    this.systemService = new SystemService();
  }

  /**
   * Get all system settings
   */
  getSystemSettings = async (req: Request, res: Response): Promise<void> => {
    try {
      const requestId = getRequestId(req);

      const settings = await this.systemService.getSystemSettings();

      res.status(200).json({
        success: true,
        message: 'System settings retrieved successfully',
        data: settings,
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error('Failed to get system settings', { error: (error as Error).message, requestId });
      
      res.status(400).json({
        success: false,
        message: (error as Error).message || 'Failed to get system settings',
        requestId
      });
    }
  };

  /**
   * Get system setting by key
   */
  getSystemSetting = async (req: Request, res: Response): Promise<void> => {
    try {
      const requestId = getRequestId(req);
      const { key } = req.params;

      if (!key) {
        res.status(400).json({
          success: false,
          message: 'Setting key is required',
          requestId
        });
        return;
      }

      const setting = await this.systemService.getSystemSetting(key);

      if (!setting) {
        res.status(404).json({
          success: false,
          message: 'System setting not found',
          requestId
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'System setting retrieved successfully',
        data: setting,
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error('Failed to get system setting', { error: (error as Error).message, requestId });
      
      res.status(400).json({
        success: false,
        message: (error as Error).message || 'Failed to get system setting',
        requestId
      });
    }
  };

  /**
   * Create new system setting
   */
  createSystemSetting = async (req: Request, res: Response): Promise<void> => {
    try {
      const requestId = getRequestId(req);
      const data: CreateSystemSettingData = req.body;

      // Validate required fields
      if (!data.settingKey || !data.settingValue) {
        res.status(400).json({
          success: false,
          message: 'Setting key and value are required',
          requestId
        });
        return;
      }

      const setting = await this.systemService.createSystemSetting(data);

      res.status(201).json({
        success: true,
        message: 'System setting created successfully',
        data: setting,
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error('Failed to create system setting', { error: (error as Error).message, requestId });
      
      res.status(400).json({
        success: false,
        message: (error as Error).message || 'Failed to create system setting',
        requestId
      });
    }
  };

  /**
   * Update system setting
   */
  updateSystemSetting = async (req: Request, res: Response): Promise<void> => {
    try {
      const requestId = getRequestId(req);
      const { key } = req.params;
      const data: UpdateSystemSettingData = req.body;

      if (!key) {
        res.status(400).json({
          success: false,
          message: 'Setting key is required',
          requestId
        });
        return;
      }

      const setting = await this.systemService.updateSystemSetting(key, data);

      res.status(200).json({
        success: true,
        message: 'System setting updated successfully',
        data: setting,
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error('Failed to update system setting', { error: (error as Error).message, requestId });
      
      const statusCode = (error as Error).message === 'System setting not found' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: (error as Error).message || 'Failed to update system setting',
        requestId
      });
    }
  };

  /**
   * Delete system setting
   */
  deleteSystemSetting = async (req: Request, res: Response): Promise<void> => {
    try {
      const requestId = getRequestId(req);
      const { key } = req.params;

      if (!key) {
        res.status(400).json({
          success: false,
          message: 'Setting key is required',
          requestId
        });
        return;
      }

      await this.systemService.deleteSystemSetting(key);

      res.status(200).json({
        success: true,
        message: 'System setting deleted successfully',
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error('Failed to delete system setting', { error: (error as Error).message, requestId });
      
      const statusCode = (error as Error).message === 'System setting not found' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: (error as Error).message || 'Failed to delete system setting',
        requestId
      });
    }
  };

  /**
   * Get system statistics
   */
  getSystemStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const requestId = getRequestId(req);

      const stats = await this.systemService.getSystemStats();

      res.status(200).json({
        success: true,
        message: 'System statistics retrieved successfully',
        data: stats,
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error('Failed to get system statistics', { error: (error as Error).message, requestId });
      
      res.status(400).json({
        success: false,
        message: (error as Error).message || 'Failed to get system statistics',
        requestId
      });
    }
  };

  /**
   * Get system health status
   */
  getSystemHealth = async (req: Request, res: Response): Promise<void> => {
    try {
      const requestId = getRequestId(req);

      const health = await this.systemService.getSystemHealth();

      res.status(200).json({
        success: true,
        message: 'System health retrieved successfully',
        data: health,
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error('Failed to get system health', { error: (error as Error).message, requestId });
      
      res.status(400).json({
        success: false,
        message: (error as Error).message || 'Failed to get system health',
        requestId
      });
    }
  };
}