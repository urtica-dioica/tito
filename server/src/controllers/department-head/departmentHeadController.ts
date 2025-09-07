import { Request, Response } from 'express';
import { DepartmentHeadService } from '../../services/department-head/departmentHeadService';
import { getRequestId } from '../../utils/types/express';
import logger from '../../utils/logger';

const departmentHeadService = new DepartmentHeadService();

export class DepartmentHeadController {
  /**
   * Get department head dashboard data
   */
  async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      const requestId = getRequestId(req);
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
          requestId
        });
        return;
      }

      const dashboard = await departmentHeadService.getDashboard(userId);
      
      res.json({
        success: true,
        message: 'Dashboard data retrieved successfully',
        data: dashboard,
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error('Error getting department head dashboard:', { error, requestId });
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve dashboard data',
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId
      });
    }
  }

  /**
   * Get department employees
   */
  async getDepartmentEmployees(req: Request, res: Response): Promise<void> {
    try {
      const requestId = getRequestId(req);
      const userId = req.user?.userId;
      const { page = '1', limit = '10', status, search } = req.query;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
          requestId
        });
        return;
      }

      const employees = await departmentHeadService.getDepartmentEmployees(
        userId,
        {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          status: status as string,
          search: search as string
        }
      );
      
      res.json({
        success: true,
        message: 'Department employees retrieved successfully',
        data: employees.data,
        pagination: employees.pagination,
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error('Error getting department employees:', { error, requestId });
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve department employees',
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId
      });
    }
  }

  /**
   * Get employee details
   */
  async getEmployeeDetails(req: Request, res: Response): Promise<void> {
    try {
      const requestId = getRequestId(req);
      const userId = req.user?.userId;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
          requestId
        });
        return;
      }

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Employee ID is required',
          requestId
        });
        return;
      }

      const employee = await departmentHeadService.getEmployeeDetails(userId, id);
      
      res.json({
        success: true,
        message: 'Employee details retrieved successfully',
        data: employee,
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error('Error getting employee details:', { error, requestId });
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve employee details',
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId
      });
    }
  }

  /**
   * Get pending requests for approval
   */
  async getPendingRequests(req: Request, res: Response): Promise<void> {
    try {
      const requestId = getRequestId(req);
      const userId = req.user?.userId;
      const { type, page = '1', limit = '10' } = req.query;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
          requestId
        });
        return;
      }

      const requests = await departmentHeadService.getPendingRequests(
        userId,
        {
          type: type as string,
          page: parseInt(page as string),
          limit: parseInt(limit as string)
        }
      );
      
      res.json({
        success: true,
        message: 'Pending requests retrieved successfully',
        data: requests.data,
        pagination: requests.pagination,
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error('Error getting pending requests:', { error, requestId });
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve pending requests',
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId
      });
    }
  }

  /**
   * Get request history
   */
  async getRequestHistory(req: Request, res: Response): Promise<void> {
    try {
      const requestId = getRequestId(req);
      const userId = req.user?.userId;
      const { type, page = '1', limit = '10', status, startDate, endDate } = req.query;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
          requestId
        });
        return;
      }

      const history = await departmentHeadService.getRequestHistory(
        userId,
        {
          type: type as string,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          status: status as string,
          startDate: startDate as string,
          endDate: endDate as string
        }
      );
      
      res.json({
        success: true,
        message: 'Request history retrieved successfully',
        data: history.data,
        pagination: history.pagination,
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error('Error getting request history:', { error, requestId });
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve request history',
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId
      });
    }
  }

  /**
   * Get department statistics
   */
  async getDepartmentStats(req: Request, res: Response): Promise<void> {
    try {
      const requestId = getRequestId(req);
      const userId = req.user?.userId;
      const { period = 'month' } = req.query;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
          requestId
        });
        return;
      }

      const stats = await departmentHeadService.getDepartmentStats(userId, period as string);
      
      res.json({
        success: true,
        message: 'Department statistics retrieved successfully',
        data: stats,
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error('Error getting department statistics:', { error, requestId });
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve department statistics',
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId
      });
    }
  }

  /**
   * Get attendance summary for department
   */
  async getAttendanceSummary(req: Request, res: Response): Promise<void> {
    try {
      const requestId = getRequestId(req);
      const userId = req.user?.userId;
      const { startDate, endDate, employeeId } = req.query;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
          requestId
        });
        return;
      }

      const summary = await departmentHeadService.getAttendanceSummary(
        userId,
        {
          startDate: startDate as string,
          endDate: endDate as string,
          employeeId: employeeId as string
        }
      );
      
      res.json({
        success: true,
        message: 'Attendance summary retrieved successfully',
        data: summary,
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error('Error getting attendance summary:', { error, requestId });
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve attendance summary',
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId
      });
    }
  }

  /**
   * Get payroll summary for department
   */
  async getPayrollSummary(req: Request, res: Response): Promise<void> {
    try {
      const requestId = getRequestId(req);
      const userId = req.user?.userId;
      const { periodId, page = '1', limit = '10' } = req.query;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
          requestId
        });
        return;
      }

      const summary = await departmentHeadService.getPayrollSummary(
        userId,
        {
          periodId: periodId as string,
          page: parseInt(page as string),
          limit: parseInt(limit as string)
        }
      );
      
      res.json({
        success: true,
        message: 'Payroll summary retrieved successfully',
        data: summary.data,
        pagination: summary.pagination,
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error('Error getting payroll summary:', { error, requestId });
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve payroll summary',
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId
      });
    }
  }
}

export const departmentHeadController = new DepartmentHeadController();