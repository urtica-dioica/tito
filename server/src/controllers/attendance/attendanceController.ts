import { Request, Response } from 'express';
import { attendanceService } from '../../services/attendance/attendanceService';
import { generateRequestId } from '../../utils/requestId';
import logger from '../../utils/logger';

export class AttendanceController {
  /**
   * Clock in an employee
   */
  async clockIn(req: Request, res: Response): Promise<void> {
    const requestId = generateRequestId();
    
    try {
      const { qrCodeHash, selfieImagePath, timestamp } = req.body;
      const employeeId = req.user?.userId;

      if (!employeeId) {
        res.status(401).json({
          success: false,
          message: 'Employee ID not found in token',
          requestId
        });
        return;
      }

      if (!qrCodeHash) {
        res.status(400).json({
          success: false,
          message: 'QR code hash is required',
          requestId
        });
        return;
      }

      // Verify QR code
      const qrVerification = await attendanceService.verifyQRCode(qrCodeHash);
      if (!qrVerification.isValid || qrVerification.employeeId !== employeeId) {
        res.status(400).json({
          success: false,
          message: 'Invalid QR code or employee mismatch',
          requestId
        });
        return;
      }

      const clockInData = {
        employeeId,
        qrCodeHash,
        selfieImagePath,
        ...(timestamp && { timestamp: new Date(timestamp) })
      };

      const result = await attendanceService.clockIn(clockInData);

      res.status(200).json({
        success: true,
        message: 'Successfully clocked in',
        data: result,
        requestId
      });

    } catch (error) {
      logger.error('Clock in error', {
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
   * Clock out an employee
   */
  async clockOut(req: Request, res: Response): Promise<void> {
    const requestId = generateRequestId();
    
    try {
      const { qrCodeHash, selfieImagePath, timestamp } = req.body;
      const employeeId = req.user?.userId;

      if (!employeeId) {
        res.status(401).json({
          success: false,
          message: 'Employee ID not found in token',
          requestId
        });
        return;
      }

      if (!qrCodeHash) {
        res.status(400).json({
          success: false,
          message: 'QR code hash is required',
          requestId
        });
        return;
      }

      // Verify QR code
      const qrVerification = await attendanceService.verifyQRCode(qrCodeHash);
      if (!qrVerification.isValid || qrVerification.employeeId !== employeeId) {
        res.status(400).json({
          success: false,
          message: 'Invalid QR code or employee mismatch',
          requestId
        });
        return;
      }

      const clockOutData = {
        employeeId,
        qrCodeHash,
        selfieImagePath,
        ...(timestamp && { timestamp: new Date(timestamp) })
      };

      const result = await attendanceService.clockOut(clockOutData);

      res.status(200).json({
        success: true,
        message: 'Successfully clocked out',
        data: result,
        requestId
      });

    } catch (error) {
      logger.error('Clock out error', {
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
   * Get current attendance status for an employee
   */
  async getCurrentStatus(req: Request, res: Response): Promise<void> {
    const requestId = generateRequestId();
    
    try {
      const employeeId = req.user?.userId;

      if (!employeeId) {
        res.status(401).json({
          success: false,
          message: 'Employee ID not found in token',
          requestId
        });
        return;
      }

      const status = await attendanceService.getCurrentAttendanceStatus(employeeId);

      res.status(200).json({
        success: true,
        message: 'Current attendance status retrieved',
        data: status,
        requestId
      });

    } catch (error) {
      logger.error('Get current status error', {
        error: (error as Error).message,
        requestId,
        employeeId: req.user?.userId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get current attendance status',
        requestId
      });
    }
  }

  /**
   * Get attendance summary for a specific date
   */
  async getAttendanceSummary(req: Request, res: Response): Promise<void> {
    const requestId = generateRequestId();
    
    try {
      const employeeId = req.user?.userId;
      const { date } = req.params;

      if (!employeeId) {
        res.status(401).json({
          success: false,
          message: 'Employee ID not found in token',
          requestId
        });
        return;
      }

      const targetDate = new Date(date as string);
      if (isNaN(targetDate.getTime())) {
        res.status(400).json({
          success: false,
          message: 'Invalid date format',
          requestId
        });
        return;
      }

      const summary = await attendanceService.getAttendanceSummary(employeeId, targetDate);

      res.status(200).json({
        success: true,
        message: 'Attendance summary retrieved',
        data: summary,
        requestId
      });

    } catch (error) {
      logger.error('Get attendance summary error', {
        error: (error as Error).message,
        requestId,
        employeeId: req.user?.userId,
        date: req.params['date']
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get attendance summary',
        requestId
      });
    }
  }

  /**
   * Get attendance history for an employee
   */
  async getAttendanceHistory(req: Request, res: Response): Promise<void> {
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

      const pageNum = parseInt(page as string) || 1;
      const limitNum = parseInt(limit as string) || 20;

      const history = await attendanceService.getEmployeeAttendanceHistory(
        employeeId,
        start,
        end,
        pageNum,
        limitNum
      );

      res.status(200).json({
        success: true,
        message: 'Attendance history retrieved',
        data: history,
        requestId
      });

    } catch (error) {
      logger.error('Get attendance history error', {
        error: (error as Error).message,
        requestId,
        employeeId: req.user?.userId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get attendance history',
        requestId
      });
    }
  }

  /**
   * Get attendance statistics for an employee
   */
  async getAttendanceStats(req: Request, res: Response): Promise<void> {
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

      const stats = await attendanceService.getEmployeeAttendanceStats(employeeId, start, end);

      res.status(200).json({
        success: true,
        message: 'Attendance statistics retrieved',
        data: stats,
        requestId
      });

    } catch (error) {
      logger.error('Get attendance stats error', {
        error: (error as Error).message,
        requestId,
        employeeId: req.user?.userId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get attendance statistics',
        requestId
      });
    }
  }

  /**
   * Verify QR code (for kiosk use)
   */
  async verifyQRCode(req: Request, res: Response): Promise<void> {
    const requestId = generateRequestId();
    
    try {
      const { qrCodeHash } = req.body;

      if (!qrCodeHash) {
        res.status(400).json({
          success: false,
          message: 'QR code hash is required',
          requestId
        });
        return;
      }

      const verification = await attendanceService.verifyQRCode(qrCodeHash);

      res.status(200).json({
        success: true,
        message: verification.isValid ? 'QR code is valid' : 'QR code is invalid',
        data: verification,
        requestId
      });

    } catch (error) {
      logger.error('Verify QR code error', {
        error: (error as Error).message,
        requestId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to verify QR code',
        requestId
      });
    }
  }
}

export const attendanceController = new AttendanceController();