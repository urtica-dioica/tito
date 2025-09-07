import { Request, Response } from 'express';
import { overtimeService } from '../../services/attendance/overtimeService';
import { generateRequestId } from '../../utils/requestId';
import logger from '../../utils/logger';

export class OvertimeController {
  /**
   * Create an overtime request
   */
  async createOvertimeRequest(req: Request, res: Response): Promise<void> {
    const requestId = generateRequestId();
    
    try {
      const { requestDate, startTime, endTime, requestedHours, reason } = req.body;
      const employeeId = req.user?.userId;

      if (!employeeId) {
        res.status(401).json({
          success: false,
          message: 'Employee ID not found in token',
          requestId
        });
        return;
      }

      if (!requestDate || !startTime || !endTime || !requestedHours || !reason) {
        res.status(400).json({
          success: false,
          message: 'Request date, start time, end time, requested hours, and reason are required',
          requestId
        });
        return;
      }

      // Parse times properly - handle both full datetime and time-only strings
      let parsedStartTime: Date | string;
      let parsedEndTime: Date | string;
      
      if (startTime.includes('T')) {
        // Full datetime string
        parsedStartTime = new Date(startTime);
      } else {
        // Time-only string, pass as string to avoid timezone conversion issues
        parsedStartTime = startTime;
      }
      
      if (endTime.includes('T')) {
        // Full datetime string
        parsedEndTime = new Date(endTime);
      } else {
        // Time-only string, pass as string to avoid timezone conversion issues
        parsedEndTime = endTime;
      }

      const requestData = {
        employeeId,
        requestDate: new Date(requestDate),
        startTime: parsedStartTime,
        endTime: parsedEndTime,
        requestedHours: parseFloat(requestedHours),
        reason: reason.trim()
      };

      // Validate the request
      const validation = await overtimeService.validateOvertimeRequest(requestData);
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.errors,
          requestId
        });
        return;
      }

      const request = await overtimeService.createOvertimeRequest(requestData);

      res.status(201).json({
        success: true,
        message: 'Overtime request created successfully',
        data: request,
        requestId
      });

    } catch (error) {
      logger.error('Create overtime request error', {
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
   * Get overtime request by ID
   */
  async getOvertimeRequest(req: Request, res: Response): Promise<void> {
    const requestId = generateRequestId();
    
    try {
      const id = req.params['id'];
      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Request ID is required',
          requestId
        });
        return;
      }

      const request = await overtimeService.getOvertimeRequest(id);

      if (!request) {
        res.status(404).json({
          success: false,
          message: 'Overtime request not found',
          requestId
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Overtime request retrieved',
        data: request,
        requestId
      });

    } catch (error) {
      logger.error('Get overtime request error', {
        error: (error as Error).message,
        requestId,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get overtime request',
        requestId
      });
    }
  }

  /**
   * List overtime requests
   */
  async listOvertimeRequests(req: Request, res: Response): Promise<void> {
    const requestId = generateRequestId();
    
    try {
      const {
        page = '1',
        limit = '20',
        employeeId,
        departmentId,
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
      if (status) params.status = status as 'pending' | 'approved' | 'rejected';
      if (startDate) params.startDate = new Date(startDate as string);
      if (endDate) params.endDate = new Date(endDate as string);
      if (search) params.search = search as string;

      const result = await overtimeService.listOvertimeRequests(params);

      res.status(200).json({
        success: true,
        message: 'Overtime requests retrieved',
        data: result,
        requestId
      });

    } catch (error) {
      logger.error('List overtime requests error', {
        error: (error as Error).message,
        requestId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to list overtime requests',
        requestId
      });
    }
  }

  /**
   * Get employee's overtime requests
   */
  async getEmployeeOvertimeRequests(req: Request, res: Response): Promise<void> {
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

      const result = await overtimeService.getEmployeeOvertimeRequests(
        employeeId,
        params.startDate,
        params.endDate,
        params.page,
        params.limit
      );

      res.status(200).json({
        success: true,
        message: 'Employee overtime requests retrieved',
        data: result,
        requestId
      });

    } catch (error) {
      logger.error('Get employee overtime requests error', {
        error: (error as Error).message,
        requestId,
        employeeId: req.user?.userId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get employee overtime requests',
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

      const requests = await overtimeService.getPendingRequestsForDepartmentHead(departmentHeadUserId);

      res.status(200).json({
        success: true,
        message: 'Pending overtime requests retrieved',
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
        message: 'Failed to get pending overtime requests',
        requestId
      });
    }
  }

  /**
   * Approve or reject an overtime request
   */
  async approveOvertimeRequest(req: Request, res: Response): Promise<void> {
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
        requestId: id,
        approverId,
        approved,
        comments: comments?.trim()
      };

      const updatedRequest = await overtimeService.approveOvertimeRequest(approvalData);

      res.status(200).json({
        success: true,
        message: `Overtime request ${approved ? 'approved' : 'rejected'} successfully`,
        data: updatedRequest,
        requestId
      });

    } catch (error) {
      logger.error('Approve overtime request error', {
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
   * Delete an overtime request
   */
  async deleteOvertimeRequest(req: Request, res: Response): Promise<void> {
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
      const request = await overtimeService.getOvertimeRequest(id);
      if (!request) {
        res.status(404).json({
          success: false,
          message: 'Overtime request not found',
          requestId
        });
        return;
      }

      if (request.employeeId !== employeeId) {
        res.status(403).json({
          success: false,
          message: 'You can only delete your own overtime requests',
          requestId
        });
        return;
      }

      const deleted = await overtimeService.deleteOvertimeRequest(id);

      if (!deleted) {
        res.status(400).json({
          success: false,
          message: 'Failed to delete overtime request',
          requestId
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Overtime request deleted successfully',
        requestId
      });

    } catch (error) {
      logger.error('Delete overtime request error', {
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
   * Get overtime request statistics
   */
  async getOvertimeStats(req: Request, res: Response): Promise<void> {
    const requestId = generateRequestId();
    
    try {
      const { employeeId, departmentId } = req.query;

      const stats = await overtimeService.getOvertimeStats(
        employeeId as string,
        departmentId as string
      );

      res.status(200).json({
        success: true,
        message: 'Overtime statistics retrieved',
        data: stats,
        requestId
      });

    } catch (error) {
      logger.error('Get overtime stats error', {
        error: (error as Error).message,
        requestId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get overtime statistics',
        requestId
      });
    }
  }

  /**
   * Get employee overtime summary
   */
  async getEmployeeOvertimeSummary(req: Request, res: Response): Promise<void> {
    const requestId = generateRequestId();
    
    try {
      const employeeId = req.user?.userId;
      const { startDate, endDate } = req.query;

      if (!employeeId) {
        res.status(401).json({
          success: false,
          message: 'Employee ID not found in token',
          requestId
        });
        return;
      }

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          message: 'Start date and end date are required',
          requestId
        });
        return;
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        res.status(400).json({
          success: false,
          message: 'Invalid date format',
          requestId
        });
        return;
      }

      const summary = await overtimeService.getEmployeeOvertimeSummary(employeeId, start, end);

      res.status(200).json({
        success: true,
        message: 'Employee overtime summary retrieved',
        data: summary,
        requestId
      });

    } catch (error) {
      logger.error('Get employee overtime summary error', {
        error: (error as Error).message,
        requestId,
        employeeId: req.user?.userId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get employee overtime summary',
        requestId
      });
    }
  }
}

export const overtimeController = new OvertimeController();