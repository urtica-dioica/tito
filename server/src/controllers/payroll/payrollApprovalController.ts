import { Request, Response } from 'express';
import { PayrollApprovalService } from '../../services/payroll/payrollApprovalService';
import { ApiResponse } from '../../utils/types/express';

export class PayrollApprovalController {
  private payrollApprovalService: PayrollApprovalService;

  constructor() {
    this.payrollApprovalService = new PayrollApprovalService();
  }

  async createPayrollApproval(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { payrollPeriodId, approverId, departmentId, comments } = req.body;

      const approval = await this.payrollApprovalService.createPayrollApproval({
        payrollPeriodId,
        approverId,
        departmentId,
        comments
      });

      res.status(201).json({
        success: true,
        message: 'Payroll approval created successfully',
        data: approval,
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Failed to create payroll approval',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }
  }

  async getPayrollApproval(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { id } = req.params;

      const approval = await this.payrollApprovalService.getPayrollApproval(id);

      if (!approval) {
        res.status(404).json({
          success: false,
          message: 'Payroll approval not found',
          timestamp: new Date().toISOString(),
          requestId: req.requestId
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Payroll approval retrieved successfully',
        data: approval,
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve payroll approval',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }
  }

  async listPayrollApprovals(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const {
        page = 1,
        limit = 20,
        payrollPeriodId,
        approverId,
        departmentId,
        status,
        startDate,
        endDate,
        search,
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = req.query;

      const params = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        payrollPeriodId: payrollPeriodId as string,
        approverId: approverId as string,
        departmentId: departmentId as string,
        status: status as 'pending' | 'approved' | 'rejected',
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        search: search as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc'
      };

      const result = await this.payrollApprovalService.listPayrollApprovals(params);

      res.status(200).json({
        success: true,
        message: 'Payroll approvals retrieved successfully',
        data: result,
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve payroll approvals',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }
  }

  async getPendingApprovalsForApprover(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { approverId } = req.params;

      const approvals = await this.payrollApprovalService.getPendingApprovalsForApprover(approverId);

      res.status(200).json({
        success: true,
        message: 'Pending payroll approvals retrieved successfully',
        data: approvals,
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve pending payroll approvals',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }
  }

  async approvePayrollApproval(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { id } = req.params;
      const { approved, comments } = req.body;
      const approverId = req.user?.userId;

      if (!approverId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
          timestamp: new Date().toISOString(),
          requestId: req.requestId
        });
        return;
      }

      const approval = await this.payrollApprovalService.approvePayrollApproval({
        approvalId: id,
        approverId,
        approved,
        comments
      });

      res.status(200).json({
        success: true,
        message: `Payroll approval ${approved ? 'approved' : 'rejected'} successfully`,
        data: approval,
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Failed to approve payroll approval',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }
  }

  async createApprovalsForPayrollPeriod(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { payrollPeriodId } = req.params;

      const approvals = await this.payrollApprovalService.createApprovalsForPayrollPeriod(payrollPeriodId);

      res.status(201).json({
        success: true,
        message: 'Payroll approvals created successfully',
        data: {
          approvals,
          count: approvals.length
        },
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Failed to create payroll approvals',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }
  }

  async getPayrollApprovalStats(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const stats = await this.payrollApprovalService.getPayrollApprovalStats();

      res.status(200).json({
        success: true,
        message: 'Payroll approval statistics retrieved successfully',
        data: stats,
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve payroll approval statistics',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }
  }

  async getApprovalWorkflowStatus(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { payrollPeriodId } = req.params;

      const workflowStatus = await this.payrollApprovalService.getApprovalWorkflowStatus(payrollPeriodId);

      res.status(200).json({
        success: true,
        message: 'Payroll approval workflow status retrieved successfully',
        data: workflowStatus,
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve payroll approval workflow status',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }
  }

  async deletePayrollApproval(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { id } = req.params;

      const deleted = await this.payrollApprovalService.deletePayrollApproval(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: 'Payroll approval not found',
          timestamp: new Date().toISOString(),
          requestId: req.requestId
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Payroll approval deleted successfully',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete payroll approval',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }
  }
}