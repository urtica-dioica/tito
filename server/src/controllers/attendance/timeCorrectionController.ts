import { Request, Response } from 'express';
import { timeCorrectionService } from '../../services/attendance/timeCorrectionService';
import { generateRequestId } from '../../utils/requestId';
import logger from '../../utils/logger';

export class TimeCorrectionController {
  /**
   * Create a time correction request
   */
  async createTimeCorrectionRequest(req: Request, res: Response): Promise<void> {
    const requestId = generateRequestId();
    
    try {
      const { requestDate, sessionType, requestedTime, reason } = req.body;
      const employeeId = req.user?.userId;

      if (!employeeId) {
        res.status(401).json({
          success: false,
          message: 'Employee ID not found in token',
          requestId
        });
        return;
      }

      if (!requestDate || !sessionType || !requestedTime || !reason) {
        res.status(400).json({
          success: false,
          message: 'Request date, session type, requested time, and reason are required',
          requestId
        });
        return;
      }

      if (!['clock_in', 'clock_out'].includes(sessionType)) {
        res.status(400).json({
          success: false,
          message: 'Session type must be either clock_in or clock_out',
          requestId
        });
        return;
      }

      const requestData = {
        employeeId,
        requestDate: new Date(requestDate),
        sessionType: sessionType as 'clock_in' | 'clock_out',
        requestedTime: new Date(requestedTime),
        reason: reason.trim()
      };

      // Validate the request
      const validation = await timeCorrectionService.validateTimeCorrectionRequest(requestData);
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.errors,
          requestId
        });
        return;
      }

      const request = await timeCorrectionService.createTimeCorrectionRequest(requestData);

      res.status(201).json({
        success: true,
        message: 'Time correction request created successfully',
        data: request,
        requestId
      });

    } catch (error) {
      logger.error('Create time correction request error', {
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
   * Get time correction request by ID
   */
  async getTimeCorrectionRequest(req: Request, res: Response): Promise<void> {
    const requestId = generateRequestId();
    
    try {
      const { id } = req.params;

      const request = await timeCorrectionService.getTimeCorrectionRequest(id);

      if (!request) {
        res.status(404).json({
          success: false,
          message: 'Time correction request not found',
          requestId
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Time correction request retrieved',
        data: request,
        requestId
      });

    } catch (error) {
      logger.error('Get time correction request error', {
        error: (error as Error).message,
        requestId,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get time correction request',
        requestId
      });
    }
  }

  /**
   * List time correction requests
   */
  async listTimeCorrectionRequests(req: Request, res: Response): Promise<void> {
    const requestId = generateRequestId();
    
    try {
      const {
        page = '1',
        limit = '20',
        employeeId,
        departmentId,
        status,
        sessionType,
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
      if (sessionType) params.sessionType = sessionType as 'clock_in' | 'clock_out';
      if (startDate) params.startDate = new Date(startDate as string);
      if (endDate) params.endDate = new Date(endDate as string);
      if (search) params.search = search as string;

      const result = await timeCorrectionService.listTimeCorrectionRequests(params);

      res.status(200).json({
        success: true,
        message: 'Time correction requests retrieved',
        data: result,
        requestId
      });

    } catch (error) {
      logger.error('List time correction requests error', {
        error: (error as Error).message,
        requestId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to list time correction requests',
        requestId
      });
    }
  }

  /**
   * Get employee's time correction requests
   */
  async getEmployeeTimeCorrectionRequests(req: Request, res: Response): Promise<void> {
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

      const result = await timeCorrectionService.getEmployeeTimeCorrectionRequests(
        employeeId,
        params.startDate,
        params.endDate,
        params.page,
        params.limit
      );

      res.status(200).json({
        success: true,
        message: 'Employee time correction requests retrieved',
        data: result,
        requestId
      });

    } catch (error) {
      logger.error('Get employee time correction requests error', {
        error: (error as Error).message,
        requestId,
        employeeId: req.user?.userId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get employee time correction requests',
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

      const requests = await timeCorrectionService.getPendingRequestsForDepartmentHead(departmentHeadUserId);

      res.status(200).json({
        success: true,
        message: 'Pending time correction requests retrieved',
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
        message: 'Failed to get pending time correction requests',
        requestId
      });
    }
  }

  /**
   * Approve or reject a time correction request
   */
  async approveTimeCorrectionRequest(req: Request, res: Response): Promise<void> {
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

      const updatedRequest = await timeCorrectionService.approveTimeCorrectionRequest(approvalData);

      res.status(200).json({
        success: true,
        message: `Time correction request ${approved ? 'approved' : 'rejected'} successfully`,
        data: updatedRequest,
        requestId
      });

    } catch (error) {
      logger.error('Approve time correction request error', {
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
   * Delete a time correction request
   */
  async deleteTimeCorrectionRequest(req: Request, res: Response): Promise<void> {
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
      const request = await timeCorrectionService.getTimeCorrectionRequest(id);
      if (!request) {
        res.status(404).json({
          success: false,
          message: 'Time correction request not found',
          requestId
        });
        return;
      }

      if (request.employeeId !== employeeId) {
        res.status(403).json({
          success: false,
          message: 'You can only delete your own time correction requests',
          requestId
        });
        return;
      }

      const deleted = await timeCorrectionService.deleteTimeCorrectionRequest(id);

      if (!deleted) {
        res.status(400).json({
          success: false,
          message: 'Failed to delete time correction request',
          requestId
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Time correction request deleted successfully',
        requestId
      });

    } catch (error) {
      logger.error('Delete time correction request error', {
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
   * Get time correction request statistics
   */
  async getTimeCorrectionStats(req: Request, res: Response): Promise<void> {
    const requestId = generateRequestId();
    
    try {
      const { employeeId, departmentId } = req.query;

      const stats = await timeCorrectionService.getTimeCorrectionStats(
        employeeId as string,
        departmentId as string
      );

      res.status(200).json({
        success: true,
        message: 'Time correction statistics retrieved',
        data: stats,
        requestId
      });

    } catch (error) {
      logger.error('Get time correction stats error', {
        error: (error as Error).message,
        requestId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get time correction statistics',
        requestId
      });
    }
  }
}

export const timeCorrectionController = new TimeCorrectionController();