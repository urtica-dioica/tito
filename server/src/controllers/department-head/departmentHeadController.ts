import { Request, Response } from 'express';
import { DepartmentHeadService } from '../../services/department-head/departmentHeadService';
import { getRequestId } from '../../utils/types/express';
import logger from '../../utils/logger';

const departmentHeadService = new DepartmentHeadService();

export class DepartmentHeadController {
  /**
   * Get department head's department info
   */
  async getDepartmentInfo(req: Request, res: Response): Promise<void> {
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

      const departmentInfo = await departmentHeadService.getDepartmentInfo(userId);
      
      res.json({
        success: true,
        message: 'Department info retrieved successfully',
        data: departmentInfo,
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error('Error getting department info:', { error, requestId });
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve department info',
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId
      });
    }
  }

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
   * Get employee statistics for department
   */
  async getEmployeeStats(req: Request, res: Response): Promise<void> {
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

      const stats = await departmentHeadService.getEmployeeStats(userId);
      
      res.json({
        success: true,
        message: 'Employee statistics retrieved successfully',
        data: stats,
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error('Error getting employee statistics:', { error, requestId });
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve employee statistics',
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId
      });
    }
  }

  /**
   * Get employee performance statistics
   */
  async getEmployeePerformance(req: Request, res: Response): Promise<void> {
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

      const performance = await departmentHeadService.getEmployeePerformance(userId);
      
      res.json({
        success: true,
        message: 'Employee performance retrieved successfully',
        data: performance,
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error('Error getting employee performance:', { error, requestId });
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve employee performance',
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
   * Get all requests for department head
   */
  async getRequests(req: Request, res: Response): Promise<void> {
    try {
      const requestId = getRequestId(req);
      const userId = req.user?.userId;
      const { type, status, page = '1', limit = '10' } = req.query;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
          requestId
        });
        return;
      }

      const requests = await departmentHeadService.getRequests(
        userId,
        {
          type: type as string,
          status: status as string,
          page: parseInt(page as string),
          limit: parseInt(limit as string)
        }
      );
      
      res.json({
        success: true,
        message: 'Requests retrieved successfully',
        data: requests.data,
        pagination: requests.pagination,
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error('Error getting requests:', { error, requestId });
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve requests',
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId
      });
    }
  }

  /**
   * Get request statistics
   */
  async getRequestStats(req: Request, res: Response): Promise<void> {
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

      const stats = await departmentHeadService.getRequestStats(userId);
      
      res.json({
        success: true,
        message: 'Request statistics retrieved successfully',
        data: stats,
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error('Error getting request statistics:', { error, requestId });
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve request statistics',
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
   * Approve a request
   */
  async approveRequest(req: Request, res: Response): Promise<void> {
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
          message: 'Request ID is required',
          requestId
        });
        return;
      }

      await departmentHeadService.approveRequest(userId, id);
      
      res.json({
        success: true,
        message: 'Request approved successfully',
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error('Error approving request:', { error, requestId });
      
      res.status(500).json({
        success: false,
        message: 'Failed to approve request',
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId
      });
    }
  }

  /**
   * Reject a request
   */
  async rejectRequest(req: Request, res: Response): Promise<void> {
    try {
      const requestId = getRequestId(req);
      const userId = req.user?.userId;
      const { id } = req.params;
      const { reason } = req.body;

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
          message: 'Request ID is required',
          requestId
        });
        return;
      }

      await departmentHeadService.rejectRequest(userId, id, reason);
      
      res.json({
        success: true,
        message: 'Request rejected successfully',
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error('Error rejecting request:', { error, requestId });
      
      res.status(500).json({
        success: false,
        message: 'Failed to reject request',
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

  /**
   * Get payroll periods for department
   */
  async getPayrollPeriods(req: Request, res: Response): Promise<void> {
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

      const periods = await departmentHeadService.getPayrollPeriods(userId);
      
      res.json({
        success: true,
        message: 'Payroll periods retrieved successfully',
        data: periods,
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error('Error getting payroll periods:', { error, requestId });
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve payroll periods',
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId
      });
    }
  }

  /**
   * Get payroll records for a specific period
   */
  async getPayrollRecords(req: Request, res: Response): Promise<void> {
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
          message: 'Period ID is required',
          requestId
        });
        return;
      }

      const records = await departmentHeadService.getPayrollRecords(userId, id);
      
      res.json({
        success: true,
        message: 'Payroll records retrieved successfully',
        data: records,
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error('Error getting payroll records:', { error, requestId });
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve payroll records',
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId
      });
    }
  }

  /**
   * Get payroll statistics for department
   */
  async getPayrollStats(req: Request, res: Response): Promise<void> {
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

      const stats = await departmentHeadService.getPayrollStats(userId);
      
      res.json({
        success: true,
        message: 'Payroll statistics retrieved successfully',
        data: stats,
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error('Error getting payroll statistics:', { error, requestId });
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve payroll statistics',
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId
      });
    }
  }

  /**
   * Get payroll approvals for department
   */
  async getPayrollApprovals(req: Request, res: Response): Promise<void> {
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

      const approvals = await departmentHeadService.getPayrollApprovals(userId);
      
      res.json({
        success: true,
        message: 'Payroll approvals retrieved successfully',
        data: approvals,
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error('Error getting payroll approvals:', { error, requestId });
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve payroll approvals',
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId
      });
    }
  }

  /**
   * Approve or reject payroll approval
   */
  async approvePayrollApproval(req: Request, res: Response): Promise<void> {
    try {
      const requestId = getRequestId(req);
      const userId = req.user?.userId;
      const { approvalId } = req.params;
      const { status, comments } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
          requestId
        });
        return;
      }

      if (!approvalId || !status || !['approved', 'rejected'].includes(status)) {
        res.status(400).json({
          success: false,
          message: 'Invalid approval ID or status',
          requestId
        });
        return;
      }

      const success = await departmentHeadService.approvePayrollApproval(userId, approvalId, status, comments);
      
      if (success) {
        res.json({
          success: true,
          message: `Payroll ${status} successfully`,
          requestId
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Failed to update payroll approval',
          requestId
        });
      }
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error('Error approving payroll:', { error, requestId });
      
      res.status(500).json({
        success: false,
        message: 'Failed to approve payroll',
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId
      });
    }
  }

}

export const departmentHeadController = new DepartmentHeadController();