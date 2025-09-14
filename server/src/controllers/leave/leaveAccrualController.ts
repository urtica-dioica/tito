import { Request, Response } from 'express';
import { LeaveAccrualService } from '../../services/leave/leaveAccrualService';
import { ApiResponse } from '../../utils/types/express';

export class LeaveAccrualController {
  private leaveAccrualService: LeaveAccrualService;

  constructor() {
    this.leaveAccrualService = new LeaveAccrualService();
  }

  async createLeaveAccrual(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { employeeId, attendanceRecordId, overtimeHours, leaveDaysAccrued, accrualDate } = req.body;

      const accrual = await this.leaveAccrualService.createLeaveAccrual({
        employeeId,
        attendanceRecordId,
        overtimeHours,
        leaveDaysAccrued,
        accrualDate: new Date(accrualDate)
      });

      res.status(201).json({
        success: true,
        message: 'Leave accrual created successfully',
        data: accrual,
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Failed to create leave accrual',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }
  }

  async getLeaveAccrual(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { id } = req.params;

      const accrual = await this.leaveAccrualService.getLeaveAccrual(id);

      if (!accrual) {
        res.status(404).json({
          success: false,
          message: 'Leave accrual not found',
          timestamp: new Date().toISOString(),
          requestId: req.requestId
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Leave accrual retrieved successfully',
        data: accrual,
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve leave accrual',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }
  }

  async listLeaveAccruals(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const {
        page = 1,
        limit = 20,
        employeeId,
        departmentId,
        startDate,
        endDate,
        search,
        sortBy = 'accrual_date',
        sortOrder = 'desc'
      } = req.query;

      const params = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        employeeId: employeeId as string,
        departmentId: departmentId as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        search: search as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc'
      };

      const result = await this.leaveAccrualService.listLeaveAccruals(params);

      res.status(200).json({
        success: true,
        message: 'Leave accruals retrieved successfully',
        data: result,
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve leave accruals',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }
  }

  async getEmployeeLeaveAccruals(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { employeeId } = req.params;
      const { startDate, endDate } = req.query;

      const accruals = await this.leaveAccrualService.getEmployeeLeaveAccruals(
        employeeId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.status(200).json({
        success: true,
        message: 'Employee leave accruals retrieved successfully',
        data: accruals,
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve employee leave accruals',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }
  }

  async getEmployeeAccrualSummary(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { employeeId } = req.params;
      const { year = new Date().getFullYear() } = req.query;

      const summary = await this.leaveAccrualService.getEmployeeAccrualSummary(
        employeeId,
        parseInt(year as string)
      );

      res.status(200).json({
        success: true,
        message: 'Employee accrual summary retrieved successfully',
        data: summary,
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve employee accrual summary',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }
  }

  async getLeaveAccrualStats(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { employeeId, departmentId, startDate, endDate } = req.query;

      const stats = await this.leaveAccrualService.getLeaveAccrualStats(
        employeeId as string,
        departmentId as string,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.status(200).json({
        success: true,
        message: 'Leave accrual statistics retrieved successfully',
        data: stats,
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve leave accrual statistics',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }
  }

  async processOvertimeToLeaveAccrual(req: Request, res: Response<ApiResponse>): Promise<void> {
    // FEATURE DISABLED: Overtime-to-leave conversion removed (2025-09-14)
    // This endpoint is kept for API compatibility but returns an error
    
    res.status(410).json({
      success: false,
      message: 'Feature disabled: Automatic overtime-to-leave conversion has been removed',
      error: 'FEATURE_DISABLED: This feature was deprecated on 2025-09-14. HR can manually create leave accruals if needed.',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  async processBulkOvertimeAccruals(req: Request, res: Response<ApiResponse>): Promise<void> {
    // FEATURE DISABLED: Bulk overtime-to-leave conversion removed (2025-09-14)
    // This endpoint is kept for API compatibility but returns an error
    
    res.status(410).json({
      success: false,
      message: 'Feature disabled: Bulk overtime-to-leave conversion has been removed',
      error: 'FEATURE_DISABLED: This feature was deprecated on 2025-09-14. HR can manually create leave accruals if needed.',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  async recalculateEmployeeAccruals(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { employeeId } = req.params;
      const { year = new Date().getFullYear() } = req.body;

      const result = await this.leaveAccrualService.recalculateEmployeeAccruals(
        employeeId,
        parseInt(year)
      );

      res.status(200).json({
        success: true,
        message: 'Employee accruals recalculated successfully',
        data: result,
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Failed to recalculate employee accruals',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }
  }

  async deleteLeaveAccrual(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { id } = req.params;

      const deleted = await this.leaveAccrualService.deleteLeaveAccrual(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: 'Leave accrual not found',
          timestamp: new Date().toISOString(),
          requestId: req.requestId
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Leave accrual deleted successfully',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete leave accrual',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }
  }
}