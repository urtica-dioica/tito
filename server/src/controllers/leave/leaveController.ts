import { Request, Response } from 'express';
import { leaveService } from '../../services/leave/leaveService';
import { employeeService } from '../../services/employee/employeeService';
import { generateRequestId } from '../../utils/requestId';
import logger from '../../utils/logger';

export class LeaveController {
  /**
   * Create a leave request
   */
  async createLeaveRequest(req: Request, res: Response): Promise<void> {
    const requestId = generateRequestId();
    
    try {
      const { leaveType, startDate, endDate, reason } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User ID not found in token',
          requestId
        });
        return;
      }

      // Get employee ID from user ID
      const employeeId = await employeeService.getEmployeeIdByUserId(userId);
      if (!employeeId) {
        res.status(404).json({
          success: false,
          message: 'Employee not found for this user',
          requestId
        });
        return;
      }

      if (!leaveType || !startDate || !endDate) {
        res.status(400).json({
          success: false,
          message: 'Leave type, start date, and end date are required',
          requestId
        });
        return;
      }

      if (!['vacation', 'sick', 'maternity', 'other'].includes(leaveType)) {
        res.status(400).json({
          success: false,
          message: 'Invalid leave type. Must be one of: vacation, sick, maternity, other',
          requestId
        });
        return;
      }

      const requestData = {
        employeeId,
        leaveType: leaveType as 'vacation' | 'sick' | 'maternity' | 'other',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason: reason?.trim()
      };

      // Validate the request
      const validation = await leaveService.validateLeaveRequest(requestData);
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.errors,
          requestId
        });
        return;
      }

      const request = await leaveService.createLeaveRequest(requestData);

      res.status(201).json({
        success: true,
        message: 'Leave request created successfully',
        data: request,
        requestId
      });

    } catch (error) {
      logger.error('Create leave request error', {
        error: (error as Error).message,
        requestId,
        employeeId: req.user?.userId
      });

      res.status(400).json({
        success: false,
        message: (error as Error).message,
        requestId
      });
    }
  }

  /**
   * Get leave request by ID
   */
  async getLeaveRequest(req: Request, res: Response): Promise<void> {
    const requestId = generateRequestId();
    
    try {
      const { id } = req.params;

      const request = await leaveService.getLeaveRequest(id);

      if (!request) {
        res.status(404).json({
          success: false,
          message: 'Leave request not found',
          requestId
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Leave request retrieved',
        data: request,
        requestId
      });

    } catch (error) {
      logger.error('Get leave request error', {
        error: (error as Error).message,
        requestId,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get leave request',
        requestId
      });
    }
  }

  /**
   * List leave requests
   */
  async listLeaveRequests(req: Request, res: Response): Promise<void> {
    const requestId = generateRequestId();
    
    try {
      const {
        page = '1',
        limit = '20',
        employeeId,
        departmentId,
        leaveType,
        status,
        startDate,
        endDate,
        search,
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = req.query;

      const params: any = {
        page: parseInt(page as string) || 1,
        limit: parseInt(limit as string) || 20,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc'
      };

      if (employeeId) params.employeeId = employeeId as string;
      if (departmentId) params.departmentId = departmentId as string;
      if (leaveType) params.leaveType = leaveType as 'vacation' | 'sick' | 'maternity' | 'other';
      if (status) params.status = status as 'pending' | 'approved' | 'rejected';
      if (startDate) params.startDate = new Date(startDate as string);
      if (endDate) params.endDate = new Date(endDate as string);
      if (search) params.search = search as string;

      const result = await leaveService.listLeaveRequests(params);

      res.status(200).json({
        success: true,
        message: 'Leave requests retrieved',
        data: result,
        requestId
      });

    } catch (error) {
      logger.error('List leave requests error', {
        error: (error as Error).message,
        requestId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to list leave requests',
        requestId
      });
    }
  }

  /**
   * Get employee's leave requests
   */
  async getEmployeeLeaveRequests(req: Request, res: Response): Promise<void> {
    const requestId = generateRequestId();
    
    try {
      const employeeId = req.user?.userId;
      const { startDate, endDate, page = '1', limit = '20' } = req.query;

      if (!employeeId) {
        res.status(401).json({
          success: false,
          message: 'Employee ID not found in token',
          requestId
        });
        return;
      }

      const params: any = {
        page: parseInt(page as string) || 1,
        limit: parseInt(limit as string) || 20
      };

      if (startDate) params.startDate = new Date(startDate as string);
      if (endDate) params.endDate = new Date(endDate as string);

      const result = await leaveService.getEmployeeLeaveRequests(
        employeeId,
        params.startDate,
        params.endDate,
        params.page,
        params.limit
      );

      res.status(200).json({
        success: true,
        message: 'Employee leave requests retrieved',
        data: result,
        requestId
      });

    } catch (error) {
      logger.error('Get employee leave requests error', {
        error: (error as Error).message,
        requestId,
        employeeId: req.user?.userId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get employee leave requests',
        requestId
      });
    }
  }

  /**
   * Get pending requests for department head
   */
  async getPendingRequestsForDepartmentHead(req: Request, res: Response): Promise<void> {
    const requestId = generateRequestId();
    
    try {
      const departmentHeadUserId = req.user?.userId;

      if (!departmentHeadUserId) {
        res.status(401).json({
          success: false,
          message: 'Department head ID not found in token',
          requestId
        });
        return;
      }

      const requests = await leaveService.getPendingRequestsForDepartmentHead(departmentHeadUserId);

      res.status(200).json({
        success: true,
        message: 'Pending leave requests retrieved',
        data: requests,
        requestId
      });

    } catch (error) {
      logger.error('Get pending requests for department head error', {
        error: (error as Error).message,
        requestId,
        departmentHeadUserId: req.user?.userId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get pending leave requests',
        requestId
      });
    }
  }

  /**
   * Approve or reject a leave request
   */
  async approveLeaveRequest(req: Request, res: Response): Promise<void> {
    const requestId = generateRequestId();
    
    try {
      const { id } = req.params;
      const { approved, comments } = req.body;
      const approverId = req.user?.userId;

      if (!approverId) {
        res.status(401).json({
          success: false,
          message: 'Approver ID not found in token',
          requestId
        });
        return;
      }

      if (typeof approved !== 'boolean') {
        res.status(400).json({
          success: false,
          message: 'Approved status is required and must be boolean',
          requestId
        });
        return;
      }

      const approvalData = {
        leaveId: id,
        approverId,
        approved,
        comments: comments?.trim()
      };

      const updatedRequest = await leaveService.approveLeaveRequest(approvalData);

      res.status(200).json({
        success: true,
        message: `Leave request ${approved ? 'approved' : 'rejected'} successfully`,
        data: updatedRequest,
        requestId
      });

    } catch (error) {
      logger.error('Approve leave request error', {
        error: (error as Error).message,
        requestId,
        approverId: req.user?.userId
      });

      res.status(400).json({
        success: false,
        message: (error as Error).message,
        requestId
      });
    }
  }

  /**
   * Delete a leave request
   */
  async deleteLeaveRequest(req: Request, res: Response): Promise<void> {
    const requestId = generateRequestId();
    
    try {
      const { id } = req.params;
      const employeeId = req.user?.userId;

      if (!employeeId) {
        res.status(401).json({
          success: false,
          message: 'Employee ID not found in token',
          requestId
        });
        return;
      }

      // Verify the request belongs to the employee
      const request = await leaveService.getLeaveRequest(id);
      if (!request) {
        res.status(404).json({
          success: false,
          message: 'Leave request not found',
          requestId
        });
        return;
      }

      if (request.employeeId !== employeeId) {
        res.status(403).json({
          success: false,
          message: 'You can only delete your own leave requests',
          requestId
        });
        return;
      }

      const deleted = await leaveService.deleteLeaveRequest(id);

      if (!deleted) {
        res.status(400).json({
          success: false,
          message: 'Failed to delete leave request',
          requestId
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Leave request deleted successfully',
        requestId
      });

    } catch (error) {
      logger.error('Delete leave request error', {
        error: (error as Error).message,
        requestId,
        employeeId: req.user?.userId
      });

      res.status(400).json({
        success: false,
        message: (error as Error).message,
        requestId
      });
    }
  }

  /**
   * Get leave balance for an employee
   */
  async getEmployeeLeaveBalance(req: Request, res: Response): Promise<void> {
    const requestId = generateRequestId();
    
    try {
      const userId = req.user?.userId;
      const { year } = req.query;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User ID not found in token',
          requestId
        });
        return;
      }

      // Get employee ID from user ID
      const employeeId = await employeeService.getEmployeeIdByUserId(userId);
      if (!employeeId) {
        res.status(404).json({
          success: false,
          message: 'Employee not found for this user',
          requestId
        });
        return;
      }

      const targetYear = year ? parseInt(year as string) : new Date().getFullYear();
      const balance = await leaveService.getEmployeeLeaveBalance(employeeId, targetYear);

      res.status(200).json({
        success: true,
        message: 'Employee leave balance retrieved',
        data: balance,
        requestId
      });

    } catch (error) {
      logger.error('Get employee leave balance error', {
        error: (error as Error).message,
        requestId,
        userId: req.user?.userId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get employee leave balance',
        requestId
      });
    }
  }

  /**
   * Get leave calendar for an employee
   */
  async getEmployeeLeaveCalendar(req: Request, res: Response): Promise<void> {
    const requestId = generateRequestId();
    
    try {
      const employeeId = req.user?.userId;
      const { year } = req.params;

      if (!employeeId) {
        res.status(401).json({
          success: false,
          message: 'Employee ID not found in token',
          requestId
        });
        return;
      }

      const targetYear = parseInt(year);
      if (isNaN(targetYear)) {
        res.status(400).json({
          success: false,
          message: 'Invalid year format',
          requestId
        });
        return;
      }

      const calendar = await leaveService.getEmployeeLeaveCalendar(employeeId, targetYear);

      res.status(200).json({
        success: true,
        message: 'Employee leave calendar retrieved',
        data: calendar,
        requestId
      });

    } catch (error) {
      logger.error('Get employee leave calendar error', {
        error: (error as Error).message,
        requestId,
        employeeId: req.user?.userId,
        year: req.params['year']
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get employee leave calendar',
        requestId
      });
    }
  }

  /**
   * Get leave request statistics
   */
  async getLeaveStats(req: Request, res: Response): Promise<void> {
    const requestId = generateRequestId();
    
    try {
      const { employeeId, departmentId } = req.query;

      const stats = await leaveService.getLeaveStats(
        employeeId as string,
        departmentId as string
      );

      res.status(200).json({
        success: true,
        message: 'Leave statistics retrieved',
        data: stats,
        requestId
      });

    } catch (error) {
      logger.error('Get leave stats error', {
        error: (error as Error).message,
        requestId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get leave statistics',
        requestId
      });
    }
  }

  /**
   * Initialize leave balance for an employee (HR only)
   */
  async initializeEmployeeLeaveBalance(req: Request, res: Response): Promise<void> {
    const requestId = generateRequestId();
    
    try {
      const { employeeId, year, vacationDays, sickDays, maternityDays, otherDays } = req.body;

      if (!employeeId || !year) {
        res.status(400).json({
          success: false,
          message: 'Employee ID and year are required',
          requestId
        });
        return;
      }

      const targetYear = parseInt(year);
      if (isNaN(targetYear)) {
        res.status(400).json({
          success: false,
          message: 'Invalid year format',
          requestId
        });
        return;
      }

      const balances = await leaveService.initializeEmployeeLeaveBalance(
        employeeId,
        targetYear,
        vacationDays || 15,
        sickDays || 10,
        maternityDays || 0,
        otherDays || 0
      );

      res.status(201).json({
        success: true,
        message: 'Employee leave balance initialized successfully',
        data: balances,
        requestId
      });

    } catch (error) {
      logger.error('Initialize employee leave balance error', {
        error: (error as Error).message,
        requestId
      });

      res.status(400).json({
        success: false,
        message: (error as Error).message,
        requestId
      });
    }
  }
}

export const leaveController = new LeaveController();