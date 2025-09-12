import { Request, Response } from 'express';
import { payrollService } from '../../services/payroll/payrollService';
import { autoPayrollService } from '../../services/payroll/autoPayrollService';
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
    const { id } = req.params;
    
    try {
      const { departmentId } = req.query;

      // Update payroll period status to 'processing'
      await payrollService.updatePayrollPeriod(id, { status: 'processing' });

      let records;
      if (departmentId) {
        // Generate records for specific department
        records = await payrollService.generatePayrollRecords(id, departmentId as string);
      } else {
        // Generate records for all departments
        const departmentResults = await payrollService.generatePayrollRecordsForAllDepartments(id);
        records = departmentResults.flatMap(result => result.records);
        
        // Create department-specific approvals after generating records
        const { payrollApprovalService } = await import('../../services/payroll/payrollApprovalService');
        await payrollApprovalService.createApprovalsForPayrollPeriod(id);
        
        // Update payroll period status to 'sent_for_review' after successful processing
        await payrollService.updatePayrollPeriod(id, { status: 'sent_for_review' });
      }

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
      
      // Revert status to 'draft' if processing failed
      try {
        await payrollService.updatePayrollPeriod(id, { status: 'draft' });
      } catch (revertError) {
        logger.error('Error reverting payroll period status', { 
          error: (revertError as Error).message, 
          requestId,
          periodId: id
        });
      }
      
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
   * @route PUT /api/v1/payroll/records/:id/status
   * @desc Update payroll record status
   * @access HR Admin
   */
  async updatePayrollRecordStatus(req: Request, res: Response): Promise<void> {
    const requestId = getRequestId(req);
    
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !['draft', 'processed', 'paid'].includes(status)) {
        res.status(400).json({
          success: false,
          message: 'Valid status (draft, processed, paid) is required',
          requestId
        });
        return;
      }

      const updatedRecord = await payrollService.updatePayrollRecordStatus(id, status);

      res.json({
        success: true,
        message: `Payroll record status updated to ${status} successfully`,
        data: updatedRecord,
        requestId
      });
    } catch (error) {
      logger.error('Error updating payroll record status', { 
        error: (error as Error).message, 
        requestId,
        params: req.params,
        body: req.body
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to update payroll record status',
        error: (error as Error).message,
        requestId
      });
    }
  }

  /**
   * Complete payroll period (mark as completed when all departments approve)
   */
  async completePayrollPeriod(req: Request, res: Response): Promise<void> {
    const requestId = getRequestId(req);
    
    try {
      const { id } = req.params;

      const completedPeriod = await payrollService.completePayrollPeriod(id);

      res.json({
        success: true,
        message: 'Payroll period completed successfully',
        data: completedPeriod,
        requestId
      });
    } catch (error) {
      logger.error('Error completing payroll period', { 
        error: (error as Error).message, 
        requestId,
        params: req.params
      });
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        requestId
      });
    }
  }

  /**
   * Bulk update payroll records to paid status
   */
  async bulkUpdatePayrollRecordsToPaid(req: Request, res: Response): Promise<void> {
    const requestId = getRequestId(req);
    
    try {
      const { periodId, departmentId, recordIds } = req.body;

      const result = await payrollService.bulkUpdatePayrollRecordsToPaid({
        periodId,
        departmentId,
        recordIds
      });

      res.json({
        success: true,
        message: `Successfully updated ${result.updatedCount} payroll records to paid status`,
        data: result,
        requestId
      });
    } catch (error) {
      logger.error('Error bulk updating payroll records to paid', { 
        error: (error as Error).message, 
        requestId,
        body: req.body
      });
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        requestId
      });
    }
  }

  /**
   * @route PUT /api/v1/payroll/periods/:id/records/status
   * @desc Bulk update payroll records status for a period
   * @access HR Admin
   */
  async bulkUpdatePayrollRecordsStatus(req: Request, res: Response): Promise<void> {
    const requestId = getRequestId(req);
    
    try {
      const { id } = req.params;
      const { status, departmentId } = req.body;

      if (!status || !['draft', 'processed', 'paid'].includes(status)) {
        res.status(400).json({
          success: false,
          message: 'Valid status (draft, processed, paid) is required',
          requestId
        });
        return;
      }

      const updatedRecords = await payrollService.bulkUpdatePayrollRecordsStatus(id, status, departmentId);

      res.json({
        success: true,
        message: `Bulk updated ${updatedRecords.length} payroll records to ${status} successfully`,
        data: {
          updatedCount: updatedRecords.length,
          records: updatedRecords
        },
        requestId
      });
    } catch (error) {
      logger.error('Error bulk updating payroll records status', { 
        error: (error as Error).message, 
        requestId,
        params: req.params,
        body: req.body
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to bulk update payroll records status',
        error: (error as Error).message,
        requestId
      });
    }
  }

  /**
   * @route POST /api/v1/payroll/periods/:id/reprocess
   * @desc Reprocess payroll records for a period (clears existing and regenerates)
   * @access HR Admin
   */
  async reprocessPayrollRecords(req: Request, res: Response): Promise<void> {
    const requestId = getRequestId(req);
    
    try {
      const { id } = req.params;
      const { departmentId } = req.query;

      // Update payroll period status to 'processing'
      await payrollService.updatePayrollPeriod(id, { status: 'processing' });

      // Reprocess payroll records (clears existing and regenerates)
      const records = await payrollService.reprocessPayrollRecords(id, departmentId as string);

      // Create department-specific approvals after reprocessing
      const { payrollApprovalService } = await import('../../services/payroll/payrollApprovalService');
      await payrollApprovalService.createApprovalsForPayrollPeriod(id);
      
      // Update payroll period status to 'sent_for_review' after successful reprocessing
      await payrollService.updatePayrollPeriod(id, { status: 'sent_for_review' });

      res.status(201).json({
        success: true,
        message: 'Payroll records reprocessed successfully',
        data: {
          periodId: id,
          recordCount: records.length,
          records: records
        },
        requestId
      });
    } catch (error) {
      logger.error('Error reprocessing payroll records', { 
        error: (error as Error).message, 
        requestId,
        params: req.params,
        query: req.query
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to reprocess payroll records',
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

  /**
   * @route GET /api/v1/payroll/records/export
   * @desc Export payroll records
   * @access HR Admin
   */
  async exportPayrollRecords(req: Request, res: Response): Promise<void> {
    const requestId = getRequestId(req);
    
    try {
      const { format = 'csv', payroll_period_id, status } = req.query;
      
      const params = {
        payroll_period_id: payroll_period_id as string,
        status: status as string
      };

      const result = await payrollService.exportPayrollRecords(format as 'csv' | 'pdf', params);

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="payroll-records-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(result);
      } else {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="payroll-records-${new Date().toISOString().split('T')[0]}.pdf"`);
        res.send(result);
      }
    } catch (error) {
      logger.error('Error exporting payroll records', { 
        error: (error as Error).message,
        requestId 
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to export payroll records',
        error: (error as Error).message,
        requestId
      });
    }
  }

  /**
   * @route GET /api/v1/payroll/stats
   * @desc Get payroll statistics
   * @access HR Admin
   */
  async getPayrollStats(req: Request, res: Response): Promise<void> {
    const requestId = getRequestId(req);
    
    try {
      const stats = await payrollService.getPayrollStats();

      res.json({
        success: true,
        message: 'Payroll statistics retrieved successfully',
        data: stats,
        requestId
      });
    } catch (error) {
      logger.error('Error getting payroll statistics', { 
        error: (error as Error).message, 
        requestId
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to get payroll statistics',
        error: (error as Error).message,
        requestId
      });
    }
  }

  // New endpoints for deduction types management
  async createDeductionType(req: Request, res: Response): Promise<void> {
    const requestId = getRequestId(req);
    
    try {
      const deductionType = await payrollService.createDeductionType(req.body);

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

  async getDeductionTypes(req: Request, res: Response): Promise<void> {
    const requestId = getRequestId(req);
    
    try {
      const result = await payrollService.getDeductionTypes(req.query);

      res.status(200).json({
        success: true,
        message: 'Deduction types retrieved successfully',
        data: result,
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

  async updateDeductionType(req: Request, res: Response): Promise<void> {
    const requestId = getRequestId(req);
    
    try {
      const { id } = req.params;
      const deductionType = await payrollService.updateDeductionType(id, req.body);

      if (!deductionType) {
        res.status(404).json({
          success: false,
          message: 'Deduction type not found',
          requestId
        });
        return;
      }

      res.status(200).json({
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

  async deleteDeductionType(req: Request, res: Response): Promise<void> {
    const requestId = getRequestId(req);
    
    try {
      const { id } = req.params;
      const deleted = await payrollService.deleteDeductionType(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: 'Deduction type not found',
          requestId
        });
        return;
      }

      res.status(200).json({
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

  // New endpoints for benefit types management
  async createBenefitType(req: Request, res: Response): Promise<void> {
    const requestId = getRequestId(req);
    
    try {
      const benefitType = await payrollService.createBenefitType(req.body);

      res.status(201).json({
        success: true,
        message: 'Benefit type created successfully',
        data: benefitType,
        requestId
      });
    } catch (error) {
      logger.error('Error creating benefit type', { 
        error: (error as Error).message, 
        requestId,
        body: req.body
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to create benefit type',
        error: (error as Error).message,
        requestId
      });
    }
  }

  async getBenefitTypes(req: Request, res: Response): Promise<void> {
    const requestId = getRequestId(req);
    
    try {
      const result = await payrollService.getBenefitTypes(req.query);

      res.status(200).json({
        success: true,
        message: 'Benefit types retrieved successfully',
        data: result,
        requestId
      });
    } catch (error) {
      logger.error('Error getting benefit types', { 
        error: (error as Error).message, 
        requestId,
        query: req.query
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to get benefit types',
        error: (error as Error).message,
        requestId
      });
    }
  }

  async updateBenefitType(req: Request, res: Response): Promise<void> {
    const requestId = getRequestId(req);
    
    try {
      const { id } = req.params;
      const updateData = req.body;

      const benefitType = await payrollService.updateBenefitType(id, updateData);

      if (!benefitType) {
        res.status(404).json({
          success: false,
          message: 'Benefit type not found',
          requestId
        });
        return;
      }

      res.json({
        success: true,
        message: 'Benefit type updated successfully',
        data: benefitType,
        requestId
      });
    } catch (error) {
      logger.error('Error updating benefit type', { 
        error: (error as Error).message, 
        requestId,
        params: req.params,
        body: req.body
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to update benefit type',
        error: (error as Error).message,
        requestId
      });
    }
  }

  async deleteBenefitType(req: Request, res: Response): Promise<void> {
    const requestId = getRequestId(req);
    
    try {
      const { id } = req.params;

      const deleted = await payrollService.deleteBenefitType(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: 'Benefit type not found',
          requestId
        });
        return;
      }

      res.json({
        success: true,
        message: 'Benefit type deleted successfully',
        requestId
      });
    } catch (error) {
      logger.error('Error deleting benefit type', { 
        error: (error as Error).message, 
        requestId,
        params: req.params
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to delete benefit type',
        error: (error as Error).message,
        requestId
      });
    }
  }

  // New endpoints for employee deduction balances management
  async getEmployeeDeductionBalances(req: Request, res: Response): Promise<void> {
    const requestId = getRequestId(req);
    
    try {
      const result = await payrollService.getEmployeeDeductionBalances(req.query);

      res.status(200).json({
        success: true,
        message: 'Employee deduction balances retrieved successfully',
        data: result,
        requestId
      });
    } catch (error) {
      logger.error('Error getting employee deduction balances', { 
        error: (error as Error).message, 
        requestId,
        query: req.query
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to get employee deduction balances',
        error: (error as Error).message,
        requestId
      });
    }
  }

  async createEmployeeDeductionBalance(req: Request, res: Response): Promise<void> {
    const requestId = getRequestId(req);
    
    try {
      const balance = await payrollService.createEmployeeDeductionBalance(req.body);

      res.status(201).json({
        success: true,
        message: 'Employee deduction balance created successfully',
        data: balance,
        requestId
      });
    } catch (error) {
      logger.error('Error creating employee deduction balance', { 
        error: (error as Error).message, 
        requestId,
        body: req.body
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to create employee deduction balance',
        error: (error as Error).message,
        requestId
      });
    }
  }

  // CSV upload endpoint for employee deduction balances
  async uploadEmployeeDeductionBalances(req: Request, res: Response): Promise<void> {
    const requestId = getRequestId(req);
    
    try {
      // Assuming CSV data is parsed and passed in req.body as an array
      const csvData = req.body;
      
      if (!Array.isArray(csvData)) {
        res.status(400).json({
          success: false,
          message: 'Invalid CSV data format',
          requestId
        });
        return;
      }

      const result = await payrollService.uploadEmployeeDeductionBalances(csvData);

      res.status(200).json({
        success: true,
        message: 'Employee deduction balances uploaded successfully',
        data: {
          successCount: result.success,
          errorCount: result.errors.length,
          errors: result.errors
        },
        requestId
      });
    } catch (error) {
      logger.error('Error uploading employee deduction balances', { 
        error: (error as Error).message, 
        requestId
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to upload employee deduction balances',
        error: (error as Error).message,
        requestId
      });
    }
  }

  // Delete employee deduction balance
  async deleteEmployeeDeductionBalance(req: Request, res: Response): Promise<void> {
    const requestId = getRequestId(req);
    
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Employee deduction balance ID is required',
          requestId
        });
        return;
      }

      const deleted = await payrollService.deleteEmployeeDeductionBalance(id);
      
      if (!deleted) {
        res.status(404).json({
          success: false,
          message: 'Employee deduction balance not found',
          requestId
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Employee deduction balance deleted successfully',
        requestId
      });
    } catch (error) {
      logger.error('Error deleting employee deduction balance', { 
        error: (error as Error).message, 
        requestId,
        id: req.params.id
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to delete employee deduction balance',
        error: (error as Error).message,
        requestId
      });
    }
  }

  // CSV upload endpoint for employee benefits
  async uploadEmployeeBenefits(req: Request, res: Response): Promise<void> {
    const requestId = getRequestId(req);
    
    try {
      // Assuming CSV data is parsed and passed in req.body as an array
      const csvData = req.body;
      
      if (!Array.isArray(csvData)) {
        res.status(400).json({
          success: false,
          message: 'Invalid CSV data format',
          requestId
        });
        return;
      }

      const result = await payrollService.uploadEmployeeBenefits(csvData);

      res.status(200).json({
        success: true,
        message: 'Employee benefits uploaded successfully',
        data: {
          successCount: result.success,
          errorCount: result.errors.length,
          errors: result.errors
        },
        requestId
      });
    } catch (error) {
      logger.error('Error uploading employee benefits', { 
        error: (error as Error).message, 
        requestId
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to upload employee benefits',
        error: (error as Error).message,
        requestId
      });
    }
  }

  // New endpoints for employee benefits management
  async getEmployeeBenefits(req: Request, res: Response): Promise<void> {
    const requestId = getRequestId(req);
    
    try {
      const result = await payrollService.getEmployeeBenefits(req.query);

      res.status(200).json({
        success: true,
        message: 'Employee benefits retrieved successfully',
        data: result,
        requestId
      });
    } catch (error) {
      logger.error('Error getting employee benefits', { 
        error: (error as Error).message, 
        requestId,
        query: req.query
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to get employee benefits',
        error: (error as Error).message,
        requestId
      });
    }
  }

  async createEmployeeBenefit(req: Request, res: Response): Promise<void> {
    const requestId = getRequestId(req);
    
    try {
      const benefit = await payrollService.createEmployeeBenefit(req.body);

      res.status(201).json({
        success: true,
        message: 'Employee benefit created successfully',
        data: benefit,
        requestId
      });
    } catch (error) {
      logger.error('Error creating employee benefit', { 
        error: (error as Error).message, 
        requestId,
        body: req.body
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to create employee benefit',
        error: (error as Error).message,
        requestId
      });
    }
  }

  async updateEmployeeBenefit(req: Request, res: Response): Promise<void> {
    const requestId = getRequestId(req);
    const { id } = req.params;
    
    try {
      const benefit = await payrollService.updateEmployeeBenefit(id, req.body);

      res.status(200).json({
        success: true,
        message: 'Employee benefit updated successfully',
        data: benefit,
        requestId
      });
    } catch (error) {
      logger.error('Error updating employee benefit', { 
        error: (error as Error).message, 
        requestId,
        id,
        body: req.body
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to update employee benefit',
        error: (error as Error).message,
        requestId
      });
    }
  }

  async deleteEmployeeBenefit(req: Request, res: Response): Promise<void> {
    const requestId = getRequestId(req);
    const { id } = req.params;
    
    try {
      const deleted = await payrollService.deleteEmployeeBenefit(id);

      if (deleted) {
        res.status(200).json({
          success: true,
          message: 'Employee benefit deleted successfully',
          requestId
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Employee benefit not found',
          requestId
        });
      }
    } catch (error) {
      logger.error('Error deleting employee benefit', { 
        error: (error as Error).message, 
        requestId,
        id
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to delete employee benefit',
        error: (error as Error).message,
        requestId
      });
    }
  }

  /**
   * @route POST /api/v1/payroll/initialize-periods
   * @desc Initialize payroll periods for the current year
   * @access HR Admin
   */
  async initializePayrollPeriods(req: Request, res: Response): Promise<void> {
    const requestId = getRequestId(req);
    
    try {
      await autoPayrollService.initializePayrollPeriods();
      
      res.json({
        success: true,
        message: 'Payroll periods initialized successfully for the current year',
        requestId
      });
    } catch (error) {
      logger.error('Error initializing payroll periods', { 
        error: (error as Error).message, 
        requestId
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to initialize payroll periods',
        error: (error as Error).message,
        requestId
      });
    }
  }

  /**
   * @route POST /api/v1/payroll/generate-current-month
   * @desc Generate payroll period for the current month only
   * @access HR Admin
   */
  async generateCurrentMonthPeriod(req: Request, res: Response): Promise<void> {
    const requestId = getRequestId(req);
    
    try {
      await autoPayrollService.generateCurrentMonthPeriod();
      
      res.json({
        success: true,
        message: 'Current month payroll period generated successfully',
        requestId
      });
    } catch (error) {
      logger.error('Error generating current month payroll period', { 
        error: (error as Error).message, 
        requestId
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to generate current month payroll period',
        error: (error as Error).message,
        requestId
      });
    }
  }

  /**
   * @route GET /api/v1/payroll/expected-hours
   * @desc Get expected monthly hours from system settings
   * @access HR Admin
   */
  async getExpectedMonthlyHours(req: Request, res: Response): Promise<void> {
    const requestId = getRequestId(req);
    
    try {
      const expectedHours = await autoPayrollService.getExpectedMonthlyHours();
      
      res.json({
        success: true,
        message: 'Expected monthly hours retrieved successfully',
        data: { expectedHours },
        requestId
      });
    } catch (error) {
      logger.error('Error getting expected monthly hours', { 
        error: (error as Error).message, 
        requestId
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to get expected monthly hours',
        error: (error as Error).message,
        requestId
      });
    }
  }

  /**
   * @route GET /api/v1/payroll/paystubs/department/:departmentId/period/:periodId
   * @desc Generate PDF paystubs for a department's employees for a specific period
   * @access HR Admin
   */
  async generateDepartmentPaystubs(req: Request, res: Response): Promise<void> {
    const requestId = getRequestId(req);
    
    try {
      const { departmentId, periodId } = req.params;

      // Get payroll records for the department and period
      const records = await payrollService.getPayrollRecordsByDepartmentAndPeriod(departmentId, periodId);
      
      if (!records || records.length === 0) {
        res.status(404).json({
          success: false,
          message: 'No payroll records found for this department and period',
          requestId
        });
        return;
      }

      // Generate PDF paystubs using the existing method
      const pdfBuffer = await payrollService.exportPeriodPaystubsPDF(periodId);

      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="paystubs-${departmentId}-${periodId}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      res.send(pdfBuffer);
    } catch (error) {
      logger.error('Error generating department paystubs', { 
        error: (error as Error).message, 
        requestId,
        params: req.params
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to generate paystubs',
        error: (error as Error).message,
        requestId
      });
    }
  }

  /**
   * Export all employee paystubs for a period as PDF
   */
  async exportPeriodPaystubsPDF(req: Request, res: Response): Promise<void> {
    const requestId = getRequestId(req);
    
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Period ID is required',
          requestId
        });
        return;
      }

      const pdfBuffer = await payrollService.exportPeriodPaystubsPDF(id);

      // Set headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="paystubs-period-${id}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      res.send(pdfBuffer);
    } catch (error) {
      logger.error('Error exporting period paystubs PDF', { 
        error: (error as Error).message, 
        requestId,
        params: req.params
      });

      res.status(500).json({
        success: false,
        message: 'Failed to export period paystubs PDF',
        error: (error as Error).message,
        requestId
      });
    }
  }

  /**
   * @route GET /api/v1/payroll/periods/:id/export/paystubs/department/pdf
   * @desc Export department employee paystubs for a period as PDF
   * @access Department Head
   */
  async exportDepartmentPaystubsPDF(req: Request, res: Response): Promise<void> {
    const requestId = getRequestId(req);
    
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Period ID is required',
          requestId
        });
        return;
      }

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User authentication required',
          requestId
        });
        return;
      }

      const pdfBuffer = await payrollService.exportDepartmentPaystubsPDF(id, userId);

      // Set headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="department-paystubs-period-${id}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      res.send(pdfBuffer);
    } catch (error) {
      logger.error('Error exporting department paystubs PDF', { 
        error: (error as Error).message, 
        requestId,
        params: req.params
      });

      res.status(500).json({
        success: false,
        message: 'Failed to export department paystubs PDF',
        error: (error as Error).message,
        requestId
      });
    }
  }
}

export const payrollController = new PayrollController();