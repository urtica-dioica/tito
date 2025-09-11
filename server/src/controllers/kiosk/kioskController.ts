import { Request, Response } from 'express';
import kioskService from '../../services/kiosk/kioskService';

class KioskController {
  /**
   * Verify employee by QR code data
   */
  async verifyEmployeeByQR(req: Request, res: Response) {
    try {
      const { qrCode } = req.query;
      
      if (!qrCode || typeof qrCode !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'QR code is required',
          error: 'MISSING_QR_CODE'
        });
      }

      const employee = await kioskService.verifyEmployeeByQR(qrCode);
      
      res.json({
        success: true,
        message: 'Employee verified successfully',
        data: employee
      });
    } catch (error) {
      console.error('Error verifying employee by QR:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify employee',
        error: 'VERIFICATION_FAILED'
      });
    }
    return;
  }

  /**
   * Record attendance
   */
  async recordAttendance(req: Request, res: Response) {
    try {
      const { employeeId, type, location, qrCodeData, selfieUrl } = req.body;
      
      if (!employeeId || !type || !location || !qrCodeData) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields',
          error: 'MISSING_FIELDS'
        });
      }

      const attendanceRecord = await kioskService.recordAttendance({
        employeeId,
        type,
        location,
        qrCodeData,
        selfieUrl
      });
      
      res.json({
        success: true,
        message: 'Attendance recorded successfully',
        data: attendanceRecord
      });
    } catch (error) {
      console.error('Error recording attendance:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to record attendance',
        error: (error as Error).message || 'RECORDING_FAILED'
      });
    }
    return;
  }

  /**
   * Get last attendance record for employee
   */
  async getLastAttendance(req: Request, res: Response) {
    try {
      const { employeeId } = req.params;
      
      if (!employeeId) {
        return res.status(400).json({
          success: false,
          message: 'Employee ID is required',
          error: 'MISSING_EMPLOYEE_ID'
        });
      }

      const lastAttendance = await kioskService.getLastAttendance(employeeId);
      
      res.json({
        success: true,
        message: 'Last attendance retrieved successfully',
        data: lastAttendance
      });
    } catch (error) {
      console.error('Error getting last attendance:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve last attendance',
        error: 'RETRIEVAL_FAILED'
      });
    }
    return;
  }

  /**
   * Get attendance history for employee
   */
  async getAttendanceHistory(req: Request, res: Response) {
    try {
      const { employeeId } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;
      
      if (!employeeId) {
        return res.status(400).json({
          success: false,
          message: 'Employee ID is required',
          error: 'MISSING_EMPLOYEE_ID'
        });
      }

      const attendanceHistory = await kioskService.getAttendanceHistory(employeeId, limit);
      
      res.json({
        success: true,
        message: 'Attendance history retrieved successfully',
        data: attendanceHistory
      });
    } catch (error) {
      console.error('Error getting attendance history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve attendance history',
        error: 'RETRIEVAL_FAILED'
      });
    }
    return;
  }

  /**
   * Get next expected session for employee
   */
  async getNextExpectedSession(req: Request, res: Response) {
    try {
      const { employeeId } = req.params;
      
      if (!employeeId) {
        return res.status(400).json({
          success: false,
          message: 'Employee ID is required',
          error: 'MISSING_EMPLOYEE_ID'
        });
      }

      const nextSession = await kioskService.getNextExpectedSession(employeeId);
      
      res.json({
        success: true,
        message: 'Next expected session retrieved successfully',
        data: nextSession
      });
    } catch (error) {
      console.error('Error getting next expected session:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve next expected session',
        error: 'RETRIEVAL_FAILED'
      });
    }
    return;
  }

  /**
   * Get today's attendance summary for employee
   */
  async getTodayAttendanceSummary(req: Request, res: Response) {
    try {
      const { employeeId } = req.params;
      
      if (!employeeId) {
        return res.status(400).json({
          success: false,
          message: 'Employee ID is required',
          error: 'MISSING_EMPLOYEE_ID'
        });
      }

      const todaySummary = await kioskService.getTodayAttendanceSummary(employeeId);
      
      res.json({
        success: true,
        message: 'Today\'s attendance summary retrieved successfully',
        data: todaySummary
      });
    } catch (error) {
      console.error('Error getting today\'s attendance summary:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve today\'s attendance summary',
        error: 'RETRIEVAL_FAILED'
      });
    }
    return;
  }

  /**
   * Record time-based attendance
   */
  async recordTimeBasedAttendance(req: Request, res: Response) {
    try {
      const { employeeId, sessionType, location, qrCodeData } = req.body;
      
      if (!employeeId || !sessionType || !location || !qrCodeData) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields',
          error: 'MISSING_FIELDS'
        });
      }

      // Get the uploaded file from Multer
      const selfieFile = req.file;
      let selfieUrl = null;

      if (selfieFile) {
        // Generate the URL for the uploaded file
        selfieUrl = `/uploads/${selfieFile.filename}`;
      }

      const attendanceRecord = await kioskService.recordTimeBasedAttendance({
        employeeId,
        sessionType,
        location,
        qrCodeData,
        selfieUrl: selfieUrl || undefined
      });
      
      res.json({
        success: true,
        message: 'Time-based attendance recorded successfully',
        data: attendanceRecord
      });
    } catch (error) {
      console.error('Error recording time-based attendance:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to record time-based attendance',
        error: (error as Error).message || 'RECORDING_FAILED'
      });
    }
    return;
  }

  /**
   * Validate attendance action
   */
  async validateAttendanceAction(req: Request, res: Response) {
    try {
      const { employeeId, sessionType } = req.body;
      
      if (!employeeId || !sessionType) {
        return res.status(400).json({
          success: false,
          message: 'Employee ID and session type are required',
          error: 'MISSING_FIELDS'
        });
      }

      const validation = await kioskService.validateAttendanceAction(employeeId, sessionType);
      
      res.json({
        success: true,
        message: 'Attendance action validated successfully',
        data: validation
      });
    } catch (error) {
      console.error('Error validating attendance action:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to validate attendance action',
        error: 'VALIDATION_FAILED'
      });
    }
    return;
  }
}

export default new KioskController();
