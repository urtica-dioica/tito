import { Request, Response } from 'express';
import { deductionTypeModel } from '../../models/payroll/DeductionType';
import { getRequestId } from '../../utils/types/express';
import logger from '../../utils/logger';

export class DeductionTypeController {
  /**
   * @route POST /api/v1/payroll/deduction-types
   * @desc Create a new deduction type
   * @access HR Admin
   */
  async createDeductionType(req: Request, res: Response): Promise<void> {
    const requestId = getRequestId(req);
    
    try {
      const { name, description, percentage, fixed_amount, is_active } = req.body;

      if (!name) {
        res.status(400).json({
          success: false,
          message: 'Deduction type name is required',
          requestId
        });
        return;
      }

      if (!percentage && !fixed_amount) {
        res.status(400).json({
          success: false,
          message: 'Either percentage or fixed amount must be provided',
          requestId
        });
        return;
      }

      if (percentage && fixed_amount) {
        res.status(400).json({
          success: false,
          message: 'Cannot specify both percentage and fixed amount',
          requestId
        });
        return;
      }

      const deductionType = await deductionTypeModel.create({
        name,
        description,
        percentage,
        fixed_amount,
        is_active
      });

      res.status(201).json({
        success: true,
        message: 'Deduction type created successfully',
        data: deductionType,
        requestId
      });
    } catch (error) {
      logger.error('Error creating deduction type', { 
        error: (error as Error).message, 
        requestId,
        body: req.body
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to create deduction type',
        error: (error as Error).message,
        requestId
      });
    }
  }

  /**
   * @route GET /api/v1/payroll/deduction-types
   * @desc Get all deduction types
   * @access HR Admin
   */
  async getDeductionTypes(req: Request, res: Response): Promise<void> {
    const requestId = getRequestId(req);
    
    try {
      const { page, limit, is_active } = req.query;

      const params = {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        is_active: is_active ? is_active === 'true' : undefined
      };

      const result = await deductionTypeModel.findAll(params);

      res.json({
        success: true,
        message: 'Deduction types retrieved successfully',
        data: result.deductionTypes,
        pagination: {
          page: parseInt(page as string) || 1,
          limit: parseInt(limit as string) || 10,
          total: result.total,
          pages: Math.ceil(result.total / (parseInt(limit as string) || 10))
        },
        requestId
      });
    } catch (error) {
      logger.error('Error getting deduction types', { 
        error: (error as Error).message, 
        requestId,
        query: req.query
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to get deduction types',
        error: (error as Error).message,
        requestId
      });
    }
  }

  /**
   * @route GET /api/v1/payroll/deduction-types/active
   * @desc Get active deduction types
   * @access HR Admin
   */
  async getActiveDeductionTypes(_req: Request, res: Response): Promise<void> {
    const requestId = getRequestId(_req);
    
    try {
      const deductionTypes = await deductionTypeModel.findActive();

      res.json({
        success: true,
        message: 'Active deduction types retrieved successfully',
        data: deductionTypes,
        requestId
      });
    } catch (error) {
      logger.error('Error getting active deduction types', { 
        error: (error as Error).message, 
        requestId
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to get active deduction types',
        error: (error as Error).message,
        requestId
      });
    }
  }

  /**
   * @route GET /api/v1/payroll/deduction-types/:id
   * @desc Get deduction type by ID
   * @access HR Admin
   */
  async getDeductionType(req: Request, res: Response): Promise<void> {
    const requestId = getRequestId(req);
    
    try {
      const { id } = req.params;

      const deductionType = await deductionTypeModel.findById(id);

      if (!deductionType) {
        res.status(404).json({
          success: false,
          message: 'Deduction type not found',
          requestId
        });
        return;
      }

      res.json({
        success: true,
        message: 'Deduction type retrieved successfully',
        data: deductionType,
        requestId
      });
    } catch (error) {
      logger.error('Error getting deduction type', { 
        error: (error as Error).message, 
        requestId,
        params: req.params
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to get deduction type',
        error: (error as Error).message,
        requestId
      });
    }
  }

  /**
   * @route PUT /api/v1/payroll/deduction-types/:id
   * @desc Update deduction type
   * @access HR Admin
   */
  async updateDeductionType(req: Request, res: Response): Promise<void> {
    const requestId = getRequestId(req);
    
    try {
      const { id } = req.params;
      const updateData = req.body;

      const deductionType = await deductionTypeModel.update(id, updateData);

      if (!deductionType) {
        res.status(404).json({
          success: false,
          message: 'Deduction type not found',
          requestId
        });
        return;
      }

      res.json({
        success: true,
        message: 'Deduction type updated successfully',
        data: deductionType,
        requestId
      });
    } catch (error) {
      logger.error('Error updating deduction type', { 
        error: (error as Error).message, 
        requestId,
        params: req.params,
        body: req.body
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to update deduction type',
        error: (error as Error).message,
        requestId
      });
    }
  }

  /**
   * @route DELETE /api/v1/payroll/deduction-types/:id
   * @desc Delete deduction type
   * @access HR Admin
   */
  async deleteDeductionType(req: Request, res: Response): Promise<void> {
    const requestId = getRequestId(req);
    
    try {
      const { id } = req.params;

      const deleted = await deductionTypeModel.delete(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: 'Deduction type not found',
          requestId
        });
        return;
      }

      res.json({
        success: true,
        message: 'Deduction type deleted successfully',
        requestId
      });
    } catch (error) {
      logger.error('Error deleting deduction type', { 
        error: (error as Error).message, 
        requestId,
        params: req.params
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to delete deduction type',
        error: (error as Error).message,
        requestId
      });
    }
  }

  /**
   * @route POST /api/v1/payroll/deduction-types/:id/activate
   * @desc Activate deduction type
   * @access HR Admin
   */
  async activateDeductionType(req: Request, res: Response): Promise<void> {
    const requestId = getRequestId(req);
    
    try {
      const { id } = req.params;

      const deductionType = await deductionTypeModel.activate(id);

      if (!deductionType) {
        res.status(404).json({
          success: false,
          message: 'Deduction type not found',
          requestId
        });
        return;
      }

      res.json({
        success: true,
        message: 'Deduction type activated successfully',
        data: deductionType,
        requestId
      });
    } catch (error) {
      logger.error('Error activating deduction type', { 
        error: (error as Error).message, 
        requestId,
        params: req.params
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to activate deduction type',
        error: (error as Error).message,
        requestId
      });
    }
  }

  /**
   * @route POST /api/v1/payroll/deduction-types/:id/deactivate
   * @desc Deactivate deduction type
   * @access HR Admin
   */
  async deactivateDeductionType(req: Request, res: Response): Promise<void> {
    const requestId = getRequestId(req);
    
    try {
      const { id } = req.params;

      const deductionType = await deductionTypeModel.deactivate(id);

      if (!deductionType) {
        res.status(404).json({
          success: false,
          message: 'Deduction type not found',
          requestId
        });
        return;
      }

      res.json({
        success: true,
        message: 'Deduction type deactivated successfully',
        data: deductionType,
        requestId
      });
    } catch (error) {
      logger.error('Error deactivating deduction type', { 
        error: (error as Error).message, 
        requestId,
        params: req.params
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to deactivate deduction type',
        error: (error as Error).message,
        requestId
      });
    }
  }
}

export const deductionTypeController = new DeductionTypeController();