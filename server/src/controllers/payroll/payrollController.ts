import { Request, Response } from 'express';
import { payrollService } from '../../services/payroll/payrollService';
import { getRequestId } from '../../utils/types/express';
import logger from '../../utils/logger';

export class PayrollController {
  /**
   * @route POST /api/v1/payroll/periods
   * @desc Create a new payroll period
   * @access HR Admin
   */
  async createPayrollPeriod(req: Request, res: Response): Promise<void> {
    const requestId = getRequestId(req);
    
    try {
      const { period_name, start_date, end_date, status } = req.body;

      if (!period_name || !start_date || !end_date) {
        res.status(400).json({
          success: false,
          message: 'Period name, start date, and end date are required',
          requestId
        });
        return;
      }

      const payrollPeriod = await payrollService.createPayrollPeriod({
        period_name,
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        status
      });

      res.status(201).json({
        success: true,
        message: 'Payroll period created successfully',
        data: payrollPeriod,
        requestId
      });
    } catch (error) {
      logger.error('Error creating payroll period', { 
        error: (error as Error).message, 
        requestId,
        body: req.body
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to create payroll period',
        error: (error as Error).message,
        requestId
      });
    }
  }

  /**
   * @route GET /api/v1/payroll/periods
   * @desc Get all payroll periods
   * @access HR Admin
   */
  async getPayrollPeriods(req: Request, res: Response): Promise<void> {
    const requestId = getRequestId(req);
    
    try {
      const { page, limit, status, startDate, endDate } = req.query;

      const params = {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        status: status as string,
        startDate: startDate as string,
        endDate: endDate as string
      };

      const result = await payrollService.getPayrollPeriods(params);

      res.json({
        success: true,
        message: 'Payroll periods retrieved successfully',
        data: result.periods,
        pagination: {
          page: parseInt(page as string) || 1,
          limit: parseInt(limit as string) || 10,
          total: result.total,
          pages: Math.ceil(result.total / (parseInt(limit as string) || 10))
        },
        requestId
      });
    } catch (error) {
      logger.error('Error getting payroll periods', { 
        error: (error as Error).message, 
        requestId,
        query: req.query
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to get payroll periods',
        error: (error as Error).message,
        requestId
      });
    }
  }

  /**
   * @route GET /api/v1/payroll/periods/:id
   * @desc Get payroll period by ID
   * @access HR Admin
   */
  async getPayrollPeriod(req: Request, res: Response): Promise<void> {
    const requestId = getRequestId(req);
    
    try {
      const { id } = req.params;

      const payrollPeriod = await payrollService.getPayrollPeriod(id);

      if (!payrollPeriod) {
        res.status(404).json({
          success: false,
          message: 'Payroll period not found',
          requestId
        });
        return;
      }

      res.json({
        success: true,
        message: 'Payroll period retrieved successfully',
        data: payrollPeriod,
        requestId
      });
    } catch (error) {
      logger.error('Error getting payroll period', { 
        error: (error as Error).message, 
        requestId,
        params: req.params
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to get payroll period',
        error: (error as Error).message,
        requestId
      });
    }
  }

  /**
   * @route PUT /api/v1/payroll/periods/:id
   * @desc Update payroll period
   * @access HR Admin
   */
  async updatePayrollPeriod(req: Request, res: Response): Promise<void> {
    const requestId = getRequestId(req);
    
    try {
      const { id } = req.params;
      const updateData = req.body;

      const payrollPeriod = await payrollService.updatePayrollPeriod(id, updateData);

      if (!payrollPeriod) {
        res.status(404).json({
          success: false,
          message: 'Payroll period not found',
          requestId
        });
        return;
      }

      res.json({
        success: true,
        message: 'Payroll period updated successfully',
        data: payrollPeriod,
        requestId
      });
    } catch (error) {
      logger.error('Error updating payroll period', { 
        error: (error as Error).message, 
        requestId,
        params: req.params,
        body: req.body
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to update payroll period',
        error: (error as Error).message,
        requestId
      });
    }
  }

  /**
   * @route DELETE /api/v1/payroll/periods/:id
   * @desc Delete payroll period
   * @access HR Admin
   */
  async deletePayrollPeriod(req: Request, res: Response): Promise<void> {
    const requestId = getRequestId(req);
    
    try {
      const { id } = req.params;

      const deleted = await payrollService.deletePayrollPeriod(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: 'Payroll period not found',
          requestId
        });
        return;
      }

      res.json({
        success: true,
        message: 'Payroll period deleted successfully',
        requestId
      });
    } catch (error) {
      logger.error('Error deleting payroll period', { 
        error: (error as Error).message, 
        requestId,
        params: req.params
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to delete payroll period',
        error: (error as Error).message,
        requestId
      });
    }
  }

  /**
   * @route POST /api/v1/payroll/periods/:id/generate
   * @desc Generate payroll records for a period
   * @access HR Admin
   */
  async generatePayrollRecords(req: Request, res: Response): Promise<void> {
    const requestId = getRequestId(req);
    
    try {
      const { id } = req.params;

      const records = await payrollService.generatePayrollRecords(id);

      res.status(201).json({
        success: true,
        message: 'Payroll records generated successfully',
        data: {
          periodId: id,
          recordCount: records.length,
          records
        },
        requestId
      });
    } catch (error) {
      logger.error('Error generating payroll records', { 
        error: (error as Error).message, 
        requestId,
        params: req.params
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to generate payroll records',
        error: (error as Error).message,
        requestId
      });
    }
  }

  /**
   * @route GET /api/v1/payroll/periods/:id/summary
   * @desc Get payroll period summary
   * @access HR Admin
   */
  async getPayrollSummary(req: Request, res: Response): Promise<void> {
    const requestId = getRequestId(req);
    
    try {
      const { id } = req.params;

      const summary = await payrollService.getPayrollSummary(id);

      res.json({
        success: true,
        message: 'Payroll summary retrieved successfully',
        data: summary,
        requestId
      });
    } catch (error) {
      logger.error('Error getting payroll summary', { 
        error: (error as Error).message, 
        requestId,
        params: req.params
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to get payroll summary',
        error: (error as Error).message,
        requestId
      });
    }
  }

  /**
   * @route GET /api/v1/payroll/records
   * @desc Get payroll records
   * @access HR Admin
   */
  async getPayrollRecords(req: Request, res: Response): Promise<void> {
    const requestId = getRequestId(req);
    
    try {
      const { page, limit, payroll_period_id, employee_id, status } = req.query;

      const params = {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        payroll_period_id: payroll_period_id as string,
        employee_id: employee_id as string,
        status: status as string
      };

      const result = await payrollService.getPayrollRecords(params);

      res.json({
        success: true,
        message: 'Payroll records retrieved successfully',
        data: result.records,
        pagination: {
          page: parseInt(page as string) || 1,
          limit: parseInt(limit as string) || 10,
          total: result.total,
          pages: Math.ceil(result.total / (parseInt(limit as string) || 10))
        },
        requestId
      });
    } catch (error) {
      logger.error('Error getting payroll records', { 
        error: (error as Error).message, 
        requestId,
        query: req.query
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to get payroll records',
        error: (error as Error).message,
        requestId
      });
    }
  }

  /**
   * @route GET /api/v1/payroll/records/:id
   * @desc Get payroll record by ID
   * @access HR Admin
   */
  async getPayrollRecord(req: Request, res: Response): Promise<void> {
    const requestId = getRequestId(req);
    
    try {
      const { id } = req.params;

      const record = await payrollService.getPayrollRecord(id);

      if (!record) {
        res.status(404).json({
          success: false,
          message: 'Payroll record not found',
          requestId
        });
        return;
      }

      res.json({
        success: true,
        message: 'Payroll record retrieved successfully',
        data: record,
        requestId
      });
    } catch (error) {
      logger.error('Error getting payroll record', { 
        error: (error as Error).message, 
        requestId,
        params: req.params
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to get payroll record',
        error: (error as Error).message,
        requestId
      });
    }
  }

  /**
   * @route PUT /api/v1/payroll/records/:id
   * @desc Update payroll record
   * @access HR Admin
   */
  async updatePayrollRecord(req: Request, res: Response): Promise<void> {
    const requestId = getRequestId(req);
    
    try {
      const { id } = req.params;
      const updateData = req.body;

      const record = await payrollService.updatePayrollRecord(id, updateData);

      if (!record) {
        res.status(404).json({
          success: false,
          message: 'Payroll record not found',
          requestId
        });
        return;
      }

      res.json({
        success: true,
        message: 'Payroll record updated successfully',
        data: record,
        requestId
      });
    } catch (error) {
      logger.error('Error updating payroll record', { 
        error: (error as Error).message, 
        requestId,
        params: req.params,
        body: req.body
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to update payroll record',
        error: (error as Error).message,
        requestId
      });
    }
  }

  /**
   * @route POST /api/v1/payroll/records/:id/approve
   * @desc Approve payroll record
   * @access HR Admin
   */
  async approvePayrollRecord(req: Request, res: Response): Promise<void> {
    const requestId = getRequestId(req);
    
    try {
      const { id } = req.params;
      const approverId = req.user?.userId;

      if (!approverId) {
        res.status(401).json({
          success: false,
          message: 'Approver ID is required',
          requestId
        });
        return;
      }

      const record = await payrollService.approvePayrollRecord(id, approverId);

      if (!record) {
        res.status(404).json({
          success: false,
          message: 'Payroll record not found',
          requestId
        });
        return;
      }

      res.json({
        success: true,
        message: 'Payroll record approved successfully',
        data: record,
        requestId
      });
    } catch (error) {
      logger.error('Error approving payroll record', { 
        error: (error as Error).message, 
        requestId,
        params: req.params
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to approve payroll record',
        error: (error as Error).message,
        requestId
      });
    }
  }

  /**
   * @route POST /api/v1/payroll/records/:id/mark-paid
   * @desc Mark payroll record as paid
   * @access HR Admin
   */
  async markPayrollAsPaid(req: Request, res: Response): Promise<void> {
    const requestId = getRequestId(req);
    
    try {
      const { id } = req.params;

      const record = await payrollService.markPayrollAsPaid(id);

      if (!record) {
        res.status(404).json({
          success: false,
          message: 'Payroll record not found',
          requestId
        });
        return;
      }

      res.json({
        success: true,
        message: 'Payroll record marked as paid successfully',
        data: record,
        requestId
      });
    } catch (error) {
      logger.error('Error marking payroll as paid', { 
        error: (error as Error).message, 
        requestId,
        params: req.params
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to mark payroll as paid',
        error: (error as Error).message,
        requestId
      });
    }
  }
}

export const payrollController = new PayrollController();