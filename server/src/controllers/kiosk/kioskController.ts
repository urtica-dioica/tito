import { Request, Response } from 'express';
import kioskService from '../../services/kiosk/kioskService';
import { ApiResponse } from '../../utils/types/express';

/**
 * Helper function to create standardized API responses
 */
const createResponse = (
  success: boolean,
  message: string,
  data?: any,
  error?: string,
  req?: Request
): ApiResponse => ({
  success,
  message,
  ...(data && { data }),
  ...(error && { error }),
  timestamp: new Date().toISOString(),
  requestId: req?.requestId
});

class KioskController {
  /**
   * Verify employee by QR code data
   */
  async verifyEmployeeByQR(req: Request, res: Response<ApiResponse>) {
    try {
      const { qrCode } = req.query;
      
      if (!qrCode || typeof qrCode !== 'string') {
        return res.status(400).json(createResponse(false, 'QR code is required', undefined, 'MISSING_QR_CODE', req));
      }

      const employee = await kioskService.verifyEmployeeByQR(qrCode);

      res.json(createResponse(true, 'Employee verified successfully', employee, undefined, req));
    } catch (error) {
      console.error('Error verifying employee by QR:', error);
      res.status(500).json(createResponse(false, 'Failed to verify employee', undefined, 'VERIFICATION_FAILED', req));
    }
    return;
  }

  /**
   * Record attendance
   */
  async recordAttendance(req: Request, res: Response<ApiResponse>) {
    try {
      const { employeeId, type, location, qrCodeData, selfieUrl } = req.body;
      
      if (!employeeId || !type || !location || !qrCodeData) {
        return res.status(400).json(createResponse(false, 'Missing required fields', undefined, 'MISSING_FIELDS', req));
      }

      const attendanceRecord = await kioskService.recordAttendance({
        employeeId,
        type,
        location,
        qrCodeData,
        selfieUrl
      });

      res.json(createResponse(true, 'Attendance recorded successfully', attendanceRecord, undefined, req));
    } catch (error) {
      console.error('Error recording attendance:', error);
      res.status(500).json(createResponse(false, 'Failed to record attendance', undefined, (error as Error).message || 'RECORDING_FAILED', req));
    }
    return;
  }

  /**
   * Get last attendance record for employee
   */
  async getLastAttendance(req: Request, res: Response<ApiResponse>) {
    try {
      const { employeeId } = req.params;
      
      if (!employeeId) {
        return res.status(400).json(createResponse(false, 'Employee ID is required', undefined, 'MISSING_EMPLOYEE_ID', req));
      }

      const lastAttendance = await kioskService.getLastAttendance(employeeId);

      res.json(createResponse(true, 'Last attendance retrieved successfully', lastAttendance, undefined, req));
    } catch (error) {
      console.error('Error getting last attendance:', error);
      res.status(500).json(createResponse(false, 'Failed to retrieve last attendance', undefined, 'RETRIEVAL_FAILED', req));
    }
    return;
  }

  /**
   * Get attendance history for employee
   */
  async getAttendanceHistory(req: Request, res: Response<ApiResponse>) {
    try {
      const { employeeId } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;
      
      if (!employeeId) {
        return res.status(400).json(createResponse(false, 'Employee ID is required', undefined, 'MISSING_EMPLOYEE_ID', req));
      }

      const attendanceHistory = await kioskService.getAttendanceHistory(employeeId, limit);

      res.json(createResponse(true, 'Attendance history retrieved successfully', attendanceHistory, undefined, req));
    } catch (error) {
      console.error('Error getting attendance history:', error);
      res.status(500).json(createResponse(false, 'Failed to retrieve attendance history', undefined, 'RETRIEVAL_FAILED', req));
    }
    return;
  }

  /**
   * Get next expected session for employee
   */
  async getNextExpectedSession(req: Request, res: Response<ApiResponse>) {
    try {
      const { employeeId } = req.params;
      
      if (!employeeId) {
        return res.status(400).json(createResponse(false, 'Employee ID is required', undefined, 'MISSING_EMPLOYEE_ID', req));
      }

      const nextSession = await kioskService.getNextExpectedSession(employeeId);

      res.json(createResponse(true, 'Next expected session retrieved successfully', nextSession, undefined, req));
    } catch (error) {
      console.error('Error getting next expected session:', error);
      res.status(500).json(createResponse(false, 'Failed to retrieve next expected session', undefined, 'RETRIEVAL_FAILED', req));
    }
    return;
  }

  /**
   * Get today's attendance summary for employee
   */
  async getTodayAttendanceSummary(req: Request, res: Response<ApiResponse>) {
    try {
      const { employeeId } = req.params;
      
      if (!employeeId) {
        return res.status(400).json(createResponse(false, 'Employee ID is required', undefined, 'MISSING_EMPLOYEE_ID', req));
      }

      const todaySummary = await kioskService.getTodayAttendanceSummary(employeeId);

      res.json(createResponse(true, 'Today\'s attendance summary retrieved successfully', todaySummary, undefined, req));
    } catch (error) {
      console.error('Error getting today\'s attendance summary:', error);
      res.status(500).json(createResponse(false, 'Failed to retrieve today\'s attendance summary', undefined, 'RETRIEVAL_FAILED', req));
    }
    return;
  }

  /**
   * Record time-based attendance
   */
  async recordTimeBasedAttendance(req: Request, res: Response<ApiResponse>) {
    try {
      const { employeeId, sessionType, location, qrCodeData } = req.body;
      
      if (!employeeId || !sessionType || !location || !qrCodeData) {
        return res.status(400).json(createResponse(false, 'Missing required fields', undefined, 'MISSING_FIELDS', req));
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

      res.json(createResponse(true, 'Time-based attendance recorded successfully', attendanceRecord, undefined, req));
    } catch (error) {
      console.error('Error recording time-based attendance:', error);
      res.status(500).json(createResponse(false, 'Failed to record time-based attendance', undefined, (error as Error).message || 'RECORDING_FAILED', req));
    }
    return;
  }

  /**
   * Validate attendance action
   */
  async validateAttendanceAction(req: Request, res: Response<ApiResponse>) {
    try {
      const { employeeId, sessionType } = req.body;
      
      if (!employeeId || !sessionType) {
        return res.status(400).json(createResponse(false, 'Employee ID and session type are required', undefined, 'MISSING_FIELDS', req));
      }

      const validation = await kioskService.validateAttendanceAction(employeeId, sessionType);

      res.json(createResponse(true, 'Attendance action validated successfully', validation, undefined, req));
    } catch (error) {
      console.error('Error validating attendance action:', error);
      res.status(500).json(createResponse(false, 'Failed to validate attendance action', undefined, 'VALIDATION_FAILED', req));
    }
    return;
  }
}

export default new KioskController();
