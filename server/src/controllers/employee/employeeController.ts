import { Request, Response } from 'express';
import { employeeService } from '../../services/employee/employeeService';
import { generateRequestId } from '../../utils/requestId';
import logger from '../../utils/logger';

export class EmployeeController {
  /**
   * Get employee dashboard data
   */
  async getDashboard(req: Request, res: Response): Promise<void> {
    const requestId = generateRequestId();
    
    try {
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
      logger.info('Getting employee ID for user:', { userId });
      const employeeId = await employeeService.getEmployeeIdByUserId(userId);
      logger.info('Employee ID result:', { employeeId });
      if (!employeeId) {
        res.status(404).json({
          success: false,
          message: 'Employee not found for this user',
          requestId
        });
        return;
      }

      const dashboardData = await employeeService.getDashboard(employeeId);
      
      res.json({
        success: true,
        message: 'Dashboard data retrieved successfully',
        data: dashboardData,
        requestId
      });
    } catch (error) {
      logger.error('Error getting employee dashboard:', { error, requestId });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve dashboard data',
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId
      });
    }
  }

  /**
   * Get employee profile
   */
  async getProfile(req: Request, res: Response): Promise<void> {
    const requestId = generateRequestId();
    
    try {
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

      const profile = await employeeService.getEmployeeProfile(employeeId);
      
      res.json({
        success: true,
        message: 'Profile retrieved successfully',
        data: profile,
        requestId
      });
    } catch (error) {
      logger.error('Error getting employee profile:', { error, requestId });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve profile',
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId
      });
    }
  }

  /**
   * Update employee profile
   */
  async updateProfile(req: Request, res: Response): Promise<void> {
    const requestId = generateRequestId();
    
    try {
      const userId = req.user?.userId;
      const { firstName, lastName, email, phone, address } = req.body;
      
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

      const updatedProfile = await employeeService.updateEmployeeProfile(employeeId, {
        firstName,
        lastName,
        email,
        phone,
        address
      });
      
      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedProfile,
        requestId
      });
    } catch (error) {
      logger.error('Error updating employee profile:', { error, requestId });
      res.status(500).json({
        success: false,
        message: 'Failed to update profile',
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId
      });
    }
  }

  /**
   * Get attendance history
   */
  async getAttendanceHistory(req: Request, res: Response): Promise<void> {
    const requestId = generateRequestId();
    
    try {
      const userId = req.user?.userId;
      const { month } = req.query;
      
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

      const attendanceHistory = await employeeService.getAttendanceHistory(
        employeeId, 
        month as string
      );
      
      res.json({
        success: true,
        message: 'Attendance history retrieved successfully',
        data: attendanceHistory,
        requestId
      });
    } catch (error) {
      logger.error('Error getting attendance history:', { error, requestId });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve attendance history',
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId
      });
    }
  }

  /**
   * Get attendance summary
   */
  async getAttendanceSummary(req: Request, res: Response): Promise<void> {
    const requestId = generateRequestId();
    
    try {
      const userId = req.user?.userId;
      const { month } = req.query;
      
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

      const attendanceSummary = await employeeService.getAttendanceSummary(
        employeeId, 
        month as string
      );
      
      res.json({
        success: true,
        message: 'Attendance summary retrieved successfully',
        data: attendanceSummary,
        requestId
      });
    } catch (error) {
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
   * Get employee requests
   */
  async getRequests(req: Request, res: Response): Promise<void> {
    const requestId = generateRequestId();
    
    try {
      const userId = req.user?.userId;
      const { type, status, limit, offset } = req.query;
      
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

      const requests = await employeeService.getEmployeeRequests(employeeId, {
        type: type as string,
        status: status as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined
      });
      
      res.json({
        success: true,
        message: 'Requests retrieved successfully',
        data: requests,
        requestId
      });
    } catch (error) {
      logger.error('Error getting employee requests:', { error, requestId });
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
    const requestId = generateRequestId();
    
    try {
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

      const stats = await employeeService.getRequestStats(employeeId);
      
      res.json({
        success: true,
        message: 'Request statistics retrieved successfully',
        data: stats,
        requestId
      });
    } catch (error) {
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
   * Get employee paystubs
   */
  async getPaystubs(req: Request, res: Response): Promise<void> {
    try {
      const requestId = generateRequestId();
      const userId = req.user?.userId;
      const { year, month, page = 1, limit = 10 } = req.query;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
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

      const paystubs = await employeeService.getEmployeePaystubs(employeeId, {
        year: year ? parseInt(year as string) : undefined,
        month: month ? parseInt(month as string) : undefined,
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      });
      
      res.json({
        success: true,
        message: 'Paystubs retrieved successfully',
        data: paystubs,
        requestId
      });
    } catch (error) {
      const requestId = generateRequestId();
      logger.error('Error getting paystubs:', { error, requestId });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve paystubs',
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId
      });
    }
  }

  /**
   * Download paystub as PDF
   */
  async downloadPaystubPDF(req: Request, res: Response): Promise<void> {
    const requestId = generateRequestId();
    
    try {
      const userId = req.user?.userId;
      const { paystubId } = req.params;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User ID not found in token',
          requestId
        });
        return;
      }

      if (!paystubId) {
        res.status(400).json({
          success: false,
          message: 'Paystub ID is required',
          requestId
        });
        return;
      }

      const employeeId = await employeeService.getEmployeeIdByUserId(userId);
      if (!employeeId) {
        res.status(404).json({
          success: false,
          message: 'Employee not found',
          requestId
        });
        return;
      }

      const pdfBuffer = await employeeService.downloadPaystubPDF(employeeId, paystubId);
      
      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="paystub-${paystubId}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      res.send(pdfBuffer);
    } catch (error) {
      logger.error('Error downloading paystub PDF', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId,
        userId: req.user?.userId,
        paystubId: req.params.paystubId
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to download paystub PDF',
        requestId
      });
    }
  }

  /**
   * Download paystub as Excel
   */
  async downloadPaystubExcel(req: Request, res: Response): Promise<void> {
    const requestId = generateRequestId();
    
    try {
      const userId = req.user?.userId;
      const { paystubId } = req.params;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User ID not found in token',
          requestId
        });
        return;
      }

      if (!paystubId) {
        res.status(400).json({
          success: false,
          message: 'Paystub ID is required',
          requestId
        });
        return;
      }

      const employeeId = await employeeService.getEmployeeIdByUserId(userId);
      if (!employeeId) {
        res.status(404).json({
          success: false,
          message: 'Employee not found',
          requestId
        });
        return;
      }

      const excelBuffer = await employeeService.downloadPaystubExcel(employeeId, paystubId);
      
      // Set response headers for Excel download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="paystub-${paystubId}.xlsx"`);
      res.setHeader('Content-Length', excelBuffer.length);
      
      res.send(excelBuffer);
    } catch (error) {
      logger.error('Error downloading paystub Excel', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId,
        userId: req.user?.userId,
        paystubId: req.params.paystubId
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to download paystub Excel',
        requestId
      });
    }
  }

  /**
   * Get latest employee paystub
   */
  async getLatestPaystub(req: Request, res: Response): Promise<void> {
    try {
      const requestId = generateRequestId();
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
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

      const paystub = await employeeService.getLatestPaystub(employeeId);
      
      res.json({
        success: true,
        message: 'Latest paystub retrieved successfully',
        data: paystub,
        requestId
      });
    } catch (error) {
      const requestId = generateRequestId();
      logger.error('Error getting latest paystub:', { error, requestId });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve latest paystub',
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId
      });
    }
  }
}

export const employeeController = new EmployeeController();
