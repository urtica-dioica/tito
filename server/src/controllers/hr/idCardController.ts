import { Request, Response } from 'express';
import { IdCardService, CreateIdCardData, IdCardListParams } from '../../services/hr/idCardService';
import logger from '../../utils/logger';
import { getRequestId } from '../../utils/types/express';

export class IdCardController {
  private idCardService: IdCardService;

  constructor() {
    this.idCardService = new IdCardService();
  }

  /**
   * Create ID card for employee
   */
  createIdCard = async (req: Request, res: Response): Promise<void> => {
    try {
      const requestId = getRequestId(req);
      const data: CreateIdCardData = req.body;

      // Validate required fields
      if (!data.employeeId) {
        res.status(400).json({
          success: false,
          message: 'Employee ID is required',
          requestId
        });
        return;
      }

      const idCard = await this.idCardService.createIdCard(data);

      res.status(201).json({
        success: true,
        message: 'ID card created successfully',
        data: idCard,
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error('Failed to create ID card', { error: (error as Error).message, requestId });
      
      res.status(400).json({
        success: false,
        message: (error as Error).message || 'Failed to create ID card',
        requestId
      });
    }
  };

  /**
   * Get ID card by ID
   */
  getIdCard = async (req: Request, res: Response): Promise<void> => {
    try {
      const requestId = getRequestId(req);
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'ID card ID is required',
          requestId
        });
        return;
      }

      const idCard = await this.idCardService.getIdCardWithDetails(id);

      res.status(200).json({
        success: true,
        message: 'ID card retrieved successfully',
        data: idCard,
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error('Failed to get ID card', { error: (error as Error).message, requestId });
      
      const statusCode = (error as Error).message === 'ID card not found' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: (error as Error).message || 'Failed to get ID card',
        requestId
      });
    }
  };

  /**
   * List ID cards with filtering and pagination
   */
  listIdCards = async (req: Request, res: Response): Promise<void> => {
    try {
      const requestId = getRequestId(req);
      const params: IdCardListParams = {
        page: req.query["page"] ? parseInt(req.query["page"] as string) : undefined,
        limit: req.query["limit"] ? parseInt(req.query["limit"] as string) : undefined,
        search: req.query["search"] as string,
        departmentId: req.query["departmentId"] as string,
        isActive: req.query["isActive"] ? req.query["isActive"] === 'true' : undefined,
        isExpired: req.query["isExpired"] ? req.query["isExpired"] === 'true' : undefined,
        sortBy: req.query["sortBy"] as string,
        sortOrder: req.query["sortOrder"] as 'asc' | 'desc'
      };

      const result = await this.idCardService.listIdCards(params);

      res.status(200).json({
        success: true,
        message: 'ID cards retrieved successfully',
        data: result.idCards,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages
        },
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error('Failed to list ID cards', { error: (error as Error).message, requestId });
      
      res.status(400).json({
        success: false,
        message: (error as Error).message || 'Failed to list ID cards',
        requestId
      });
    }
  };

  /**
   * Deactivate ID card
   */
  deactivateIdCard = async (req: Request, res: Response): Promise<void> => {
    try {
      const requestId = getRequestId(req);
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'ID card ID is required',
          requestId
        });
        return;
      }

      await this.idCardService.deactivateIdCard(id);

      res.status(200).json({
        success: true,
        message: 'ID card deactivated successfully',
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error('Failed to deactivate ID card', { error: (error as Error).message, requestId });
      
      const statusCode = (error as Error).message === 'ID card not found' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: (error as Error).message || 'Failed to deactivate ID card',
        requestId
      });
    }
  };

  /**
   * Generate ID cards for all employees in a department
   */
  generateDepartmentIdCards = async (req: Request, res: Response): Promise<void> => {
    try {
      const requestId = getRequestId(req);
      const { departmentId } = req.params;

      if (!departmentId) {
        res.status(400).json({
          success: false,
          message: 'Department ID is required',
          requestId
        });
        return;
      }


      const result = await this.idCardService.generateDepartmentIdCards(departmentId);

      res.status(200).json({
        success: true,
        message: 'Department ID cards generation completed',
        data: result,
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error('Failed to generate department ID cards', { error: (error as Error).message, requestId });
      
      res.status(400).json({
        success: false,
        message: (error as Error).message || 'Failed to generate department ID cards',
        requestId
      });
    }
  };

  /**
   * Get ID card statistics
   */
  getIdCardStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const requestId = getRequestId(req);

      const stats = await this.idCardService.getIdCardStats();

      res.status(200).json({
        success: true,
        message: 'ID card statistics retrieved successfully',
        data: stats,
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error('Failed to get ID card statistics', { error: (error as Error).message, requestId });
      
      res.status(400).json({
        success: false,
        message: (error as Error).message || 'Failed to get ID card statistics',
        requestId
      });
    }
  };
}