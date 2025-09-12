import { timeCorrectionRequestModel, TimeCorrectionRequest, CreateTimeCorrectionRequestData, UpdateTimeCorrectionRequestData } from '../../models/attendance/TimeCorrectionRequest';
import { attendanceRecordModel } from '../../models/attendance/AttendanceRecord';
import { attendanceSessionModel } from '../../models/attendance/AttendanceSession';
import { employeeModel } from '../../models/hr/Employee';
import { getPool } from '../../config/database';
import logger from '../../utils/logger';
import { defaultHoursCalculator } from '../../utils/attendanceHoursCalculator';

export interface CreateTimeCorrectionData {
  employeeId: string;
  requestDate: Date;
  sessionType: 'morning_in' | 'morning_out' | 'afternoon_in' | 'afternoon_out';
  requestedTime: Date;
  reason: string;
}

export interface ApproveTimeCorrectionData {
  requestId: string;
  approverId: string;
  approved: boolean;
  comments?: string;
}

export interface TimeCorrectionWithDetails extends TimeCorrectionRequest {
  employeeCode: string;
  employeeName: string;
  departmentName: string | null;
  approverName: string | null;
}

export class TimeCorrectionService {
  /**
   * Create a time correction request
   */
  async createTimeCorrectionRequest(data: CreateTimeCorrectionData): Promise<TimeCorrectionRequest> {
    const { employeeId, requestDate, sessionType, requestedTime, reason } = data;

    // Verify employee exists and is active
    const employee = await employeeModel.findById(employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    if (employee.status !== 'active') {
      throw new Error('Employee is not active');
    }

    // Validate request date (cannot be in the future)
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (requestDate > today) {
      throw new Error('Cannot request correction for future dates');
    }

    // Check if there's already a pending request for the same date and session type
    const existingRequest = await this.getExistingRequest(employeeId, requestDate, sessionType);
    if (existingRequest) {
      throw new Error('A pending time correction request already exists for this date and session type');
    }

    // Create the time correction request
    const requestData: CreateTimeCorrectionRequestData = {
      employeeId,
      requestDate,
      sessionType,
      requestedTime,
      reason
    };

    const request = await timeCorrectionRequestModel.createTimeCorrectionRequest(requestData);

    logger.info('Time correction request created', {
      requestId: request.id,
      employeeId,
      employeeCode: employee.employee_id,
      requestDate,
      sessionType,
      requestedTime,
      reason
    });

    return request;
  }

  /**
   * Get time correction request by ID
   */
  async getTimeCorrectionRequest(id: string): Promise<TimeCorrectionWithDetails | null> {
    return await timeCorrectionRequestModel.findByIdWithDetails(id);
  }

  /**
   * Update time correction request
   */
  async updateTimeCorrectionRequest(id: string, data: UpdateTimeCorrectionRequestData): Promise<TimeCorrectionRequest | null> {
    return await timeCorrectionRequestModel.updateTimeCorrectionRequest(id, data);
  }

  /**
   * List time correction requests with filtering
   */
  async listTimeCorrectionRequests(params: {
    page?: number;
    limit?: number;
    employeeId?: string;
    departmentId?: string;
    status?: 'pending' | 'approved' | 'rejected';
    sessionType?: 'morning_in' | 'morning_out' | 'afternoon_in' | 'afternoon_out';
    startDate?: Date;
    endDate?: Date;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{
    requests: TimeCorrectionWithDetails[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return await timeCorrectionRequestModel.listTimeCorrectionRequests(params);
  }

  /**
   * Get pending requests for a department head
   */
  async getPendingRequestsForDepartmentHead(departmentHeadUserId: string): Promise<TimeCorrectionWithDetails[]> {
    return await timeCorrectionRequestModel.getPendingRequestsForDepartmentHead(departmentHeadUserId);
  }

  /**
   * Approve or reject a time correction request
   */
  async approveTimeCorrectionRequest(data: ApproveTimeCorrectionData): Promise<TimeCorrectionRequest> {
    const { requestId, approverId, approved, comments } = data;

    // Get the request
    const request = await timeCorrectionRequestModel.findById(requestId);
    if (!request) {
      throw new Error('Time correction request not found');
    }

    if (request.status !== 'pending') {
      throw new Error('Request has already been processed');
    }

    // Update the request status
    const updateData: UpdateTimeCorrectionRequestData = {
      status: approved ? 'approved' : 'rejected',
      approvedBy: approverId,
      approvedAt: new Date()
    };

    const updatedRequest = await timeCorrectionRequestModel.updateTimeCorrectionRequest(requestId, updateData);
    if (!updatedRequest) {
      throw new Error('Failed to update time correction request');
    }

    // If approved, apply the time correction
    if (approved) {
      await this.applyTimeCorrection(updatedRequest);
    }

    logger.info('Time correction request processed', {
      requestId,
      approverId,
      approved,
      comments,
      employeeId: request.employeeId,
      requestDate: request.requestDate,
      sessionType: request.sessionType,
      requestedTime: request.requestedTime
    });

    return updatedRequest;
  }

  /**
   * Apply approved time correction to attendance records
   */
  private async applyTimeCorrection(request: TimeCorrectionRequest): Promise<void> {
    const { employeeId, requestDate, sessionType, requestedTime } = request;

    // Get or create attendance record for the date
    let attendanceRecord = await attendanceRecordModel.findByEmployeeAndDate(employeeId, requestDate);
    
    if (!attendanceRecord) {
      attendanceRecord = await attendanceRecordModel.createAttendanceRecord({
        employeeId,
        date: requestDate,
        overallStatus: 'present'
      });
    }

    // Check if session already exists
    const existingSessions = await attendanceSessionModel.getSessionsByAttendanceRecord(attendanceRecord.id);
    const existingSession = existingSessions.find(s => s.sessionType === sessionType);

    if (existingSession) {
      // Update existing session
      await attendanceSessionModel.updateAttendanceSession(existingSession.id, {
        timestamp: requestedTime
      });
    } else {
      // Create new session
      await attendanceSessionModel.createAttendanceSession({
        attendanceRecordId: attendanceRecord.id,
        sessionType,
        timestamp: requestedTime
      });
    }

    // Recalculate overall status
    const totalHours = await this.calculateDailyHours(attendanceRecord.id);
    let overallStatus: 'present' | 'late' | 'absent' | 'partial' = 'present';
    
    if (totalHours < 4) {
      overallStatus = 'partial';
    } else if (totalHours < 8) {
      overallStatus = 'late';
    }

    await attendanceRecordModel.updateAttendanceRecord(attendanceRecord.id, {
      overallStatus
    });

    logger.info('Time correction applied successfully', {
      requestId: request.id,
      employeeId,
      requestDate,
      sessionType,
      requestedTime,
      totalHours,
      overallStatus
    });
  }

  /**
   * Get existing time correction request
   */
  private async getExistingRequest(
    employeeId: string, 
    requestDate: Date, 
    sessionType: 'morning_in' | 'morning_out' | 'afternoon_in' | 'afternoon_out'
  ): Promise<TimeCorrectionRequest | null> {
    const query = `
      SELECT 
        id,
        employee_id as "employeeId",
        correction_date as "requestDate",
        session_type as "sessionType",
        requested_clock_in as "requestedClockIn",
        requested_clock_out as "requestedClockOut",
        reason,
        status,
        approver_id as "approvedBy",
        approved_at as "approvedAt",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM time_correction_requests
      WHERE employee_id = $1 
        AND correction_date = $2 
        AND session_type = $3 
        AND status = 'pending'
    `;

    const result = await getPool().query(query, [employeeId, requestDate, sessionType]);
    if (result.rows.length === 0) {
      return null;
    }

    // Transform the result to match the interface
    const row = result.rows[0];
    return {
      ...row,
      requestedTime: row.sessionType === 'clock_in' ? row.requestedClockIn : row.requestedClockOut
    };
  }

  /**
   * Calculate daily hours for an attendance record using the new mathematical formulation
   */
  private async calculateDailyHours(attendanceRecordId: string): Promise<number> {
    const sessions = await attendanceSessionModel.getSessionsByAttendanceRecord(attendanceRecordId);
    
    // Use the new hours calculator
    const result = defaultHoursCalculator.calculateFromSessions(sessions);
    
    return result.totalHours;
  }

  /**
   * Get time correction request statistics
   */
  async getTimeCorrectionStats(employeeId?: string, departmentId?: string): Promise<{
    totalRequests: number;
    pendingRequests: number;
    approvedRequests: number;
    rejectedRequests: number;
  }> {
    return await timeCorrectionRequestModel.getTimeCorrectionRequestStats(employeeId, departmentId);
  }

  /**
   * Delete time correction request
   */
  async deleteTimeCorrectionRequest(id: string): Promise<boolean> {
    const request = await timeCorrectionRequestModel.findById(id);
    if (!request) {
      throw new Error('Time correction request not found');
    }

    if (request.status !== 'pending') {
      throw new Error('Cannot delete processed requests');
    }

    return await timeCorrectionRequestModel.deleteTimeCorrectionRequest(id);
  }

  /**
   * Get time correction requests for an employee
   */
  async getEmployeeTimeCorrectionRequests(
    employeeId: string,
    startDate?: Date,
    endDate?: Date,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    requests: TimeCorrectionWithDetails[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return await timeCorrectionRequestModel.listTimeCorrectionRequests({
      employeeId,
      startDate,
      endDate,
      page,
      limit,
      sortBy: 'created_at',
      sortOrder: 'desc'
    });
  }

  /**
   * Validate time correction request
   */
  async validateTimeCorrectionRequest(data: CreateTimeCorrectionData): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Check if employee exists
    const employee = await employeeModel.findById(data.employeeId);
    if (!employee) {
      errors.push('Employee not found');
    } else if (employee.status !== 'active') {
      errors.push('Employee is not active');
    }

    // Validate request date
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (data.requestDate > today) {
      errors.push('Cannot request correction for future dates');
    }

    // Validate requested time
    if (data.requestedTime > new Date()) {
      errors.push('Requested time cannot be in the future');
    }

    // Validate reason
    if (!data.reason || data.reason.trim().length < 10) {
      errors.push('Reason must be at least 10 characters long');
    }

    // Check for existing pending request
    if (employee) {
      const existingRequest = await this.getExistingRequest(
        data.employeeId, 
        data.requestDate, 
        data.sessionType
      );
      if (existingRequest) {
        errors.push('A pending time correction request already exists for this date and session type');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export const timeCorrectionService = new TimeCorrectionService();