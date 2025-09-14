import { overtimeRequestModel, OvertimeRequest, CreateOvertimeRequestData, UpdateOvertimeRequestData } from '../../models/attendance/OvertimeRequest';
import { attendanceRecordModel } from '../../models/attendance/AttendanceRecord';
import { attendanceSessionModel } from '../../models/attendance/AttendanceSession';
import { employeeModel } from '../../models/hr/Employee';
import { getPool } from '../../config/database';
import logger from '../../utils/logger';

export interface CreateOvertimeData {
  employeeId: string;
  requestDate: Date;
  startTime: Date | string;
  endTime: Date | string;
  requestedHours: number;
  reason: string;
}

export interface ApproveOvertimeData {
  requestId: string;
  approverId: string;
  approved: boolean;
  comments?: string;
}

export interface OvertimeWithDetails extends OvertimeRequest {
  employeeCode: string;
  employeeName: string;
  departmentName: string | null;
  approverName: string | null;
}

export class OvertimeService {
  /**
   * Create an overtime request
   */
  async createOvertimeRequest(data: CreateOvertimeData): Promise<OvertimeRequest> {
    const { employeeId, requestDate, startTime, endTime, requestedHours, reason } = data;

    // Verify employee exists and is active
    const employee = await employeeModel.findById(employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    if (employee.status !== 'active') {
      throw new Error('Employee is not active');
    }

    // Validate overtime date (cannot be in the past)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overtimeDate = new Date(requestDate);
    overtimeDate.setHours(0, 0, 0, 0);
    
    if (overtimeDate < today) {
      throw new Error('Cannot request overtime for past dates');
    }

    // Validate time range - work with time strings directly
    let startTimeStr: string;
    let endTimeStr: string;
    
    if (typeof startTime === 'string') {
      // Validate time format and ensure HH:MM:SS format
      const timeParts = startTime.split(':').map(Number);
      const hours = timeParts[0] || 0;
      const minutes = timeParts[1] || 0;
      const seconds = timeParts[2] || 0; // Default to 0 if not provided
      
      // Validate time components
      if (isNaN(hours) || isNaN(minutes) || isNaN(seconds) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59) {
        throw new Error('Invalid start time format');
      }
      
      startTimeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else if (startTime instanceof Date) {
      // Convert Date object to time string
      startTimeStr = `${startTime.getUTCHours().toString().padStart(2, '0')}:${startTime.getUTCMinutes().toString().padStart(2, '0')}:${startTime.getUTCSeconds().toString().padStart(2, '0')}`;
    } else {
      throw new Error('Invalid start time format');
    }
    
    if (typeof endTime === 'string') {
      // Validate time format and ensure HH:MM:SS format
      const timeParts = endTime.split(':').map(Number);
      const hours = timeParts[0] || 0;
      const minutes = timeParts[1] || 0;
      const seconds = timeParts[2] || 0; // Default to 0 if not provided
      
      // Validate time components
      if (isNaN(hours) || isNaN(minutes) || isNaN(seconds) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59) {
        throw new Error('Invalid end time format');
      }
      
      endTimeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else if (endTime instanceof Date) {
      // Convert Date object to time string
      endTimeStr = `${endTime.getUTCHours().toString().padStart(2, '0')}:${endTime.getUTCMinutes().toString().padStart(2, '0')}:${endTime.getUTCSeconds().toString().padStart(2, '0')}`;
    } else {
      throw new Error('Invalid end time format');
    }
    
    // Validate time order by comparing time strings
    if (startTimeStr >= endTimeStr) {
      throw new Error('Start time must be before end time');
    }

    // Validate requested hours by creating temporary Date objects for calculation only
    const tempStart = new Date(`2000-01-01T${startTimeStr}`);
    const tempEnd = new Date(`2000-01-01T${endTimeStr}`);
    const calculatedHours = (tempEnd.getTime() - tempStart.getTime()) / (1000 * 60 * 60);
    if (Math.abs(calculatedHours - requestedHours) > 0.1) {
      throw new Error('Requested hours do not match the time range');
    }

    if (requestedHours <= 0) {
      throw new Error('Requested hours must be greater than 0');
    }

    // Check for overlapping overtime requests
    // Create temporary Date objects for the overlapping check
    const tempStartForCheck = new Date(`2000-01-01T${startTimeStr}`);
    const tempEndForCheck = new Date(`2000-01-01T${endTimeStr}`);
    const overlappingRequest = await this.getOverlappingRequest(employeeId, requestDate, tempStartForCheck, tempEndForCheck);
    if (overlappingRequest) {
      throw new Error('An overtime request already exists for this time period');
    }

    // Use the validated time strings directly
    const originalStartTime = startTimeStr;
    const originalEndTime = endTimeStr;

    // Debug: Log the data being passed to the model
    logger.info('Data being passed to overtime model:', {
      employeeId,
      requestDate,
      startTime: originalStartTime,
      endTime: originalEndTime,
      requestedHours,
      reason,
      originalStartTimeType: typeof originalStartTime,
      originalEndTimeType: typeof originalEndTime
    });

    const requestData: CreateOvertimeRequestData = {
      employeeId,
      requestDate,
      startTime: originalStartTime, // Always pass time string
      endTime: originalEndTime,     // Always pass time string
      requestedHours,
      reason
    };

    const request = await overtimeRequestModel.createOvertimeRequest(requestData);

    logger.info('Overtime request created', {
      requestId: request.id,
      employeeId,
      employeeCode: employee.employee_id,
      requestDate,
      startTime,
      endTime,
      requestedHours,
      reason
    });

    return request;
  }

  /**
   * Get overtime request by ID
   */
  async getOvertimeRequest(id: string): Promise<OvertimeWithDetails | null> {
    return await overtimeRequestModel.findByIdWithDetails(id);
  }

  /**
   * Update overtime request
   */
  async updateOvertimeRequest(id: string, data: UpdateOvertimeRequestData): Promise<OvertimeRequest | null> {
    return await overtimeRequestModel.updateOvertimeRequest(id, data);
  }

  /**
   * List overtime requests with filtering
   */
  async listOvertimeRequests(params: {
    page?: number;
    limit?: number;
    employeeId?: string;
    departmentId?: string;
    status?: 'pending' | 'approved' | 'rejected';
    startDate?: Date;
    endDate?: Date;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{
    requests: OvertimeWithDetails[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return await overtimeRequestModel.listOvertimeRequests(params);
  }

  /**
   * Get pending requests for a department head
   */
  async getPendingRequestsForDepartmentHead(departmentHeadUserId: string): Promise<OvertimeWithDetails[]> {
    return await overtimeRequestModel.getPendingRequestsForDepartmentHead(departmentHeadUserId);
  }

  /**
   * Approve or reject an overtime request
   */
  async approveOvertimeRequest(data: ApproveOvertimeData): Promise<OvertimeRequest> {
    const { requestId, approverId, approved, comments } = data;

    // Get the request
    const request = await overtimeRequestModel.findById(requestId);
    if (!request) {
      throw new Error('Overtime request not found');
    }

    if (request.status !== 'pending') {
      throw new Error('Request has already been processed');
    }

    // Update the request status
    const updateData: UpdateOvertimeRequestData = {
      status: approved ? 'approved' : 'rejected',
      approvedBy: approverId,
      approvedAt: new Date()
    };

    const updatedRequest = await overtimeRequestModel.updateOvertimeRequest(requestId, updateData);
    if (!updatedRequest) {
      throw new Error('Failed to update overtime request');
    }

    // If approved, create overtime session and accrue leave
    if (approved) {
      await this.applyOvertimeApproval(updatedRequest);
    }

    logger.info('Overtime request processed', {
      requestId,
      approverId,
      approved,
      comments,
      employeeId: request.employeeId,
      requestDate: request.requestDate,
      startTime: request.startTime,
      endTime: request.endTime,
      requestedHours: request.requestedHours
    });

    return updatedRequest;
  }

  /**
   * Apply approved overtime request
   */
  private async applyOvertimeApproval(request: OvertimeRequest): Promise<void> {
    const { employeeId, requestDate, startTime, endTime, requestedHours } = request;

    // Get or create attendance record for the overtime date
    let attendanceRecord = await attendanceRecordModel.findByEmployeeAndDate(employeeId, requestDate);
    
    if (!attendanceRecord) {
      attendanceRecord = await attendanceRecordModel.createAttendanceRecord({
        employeeId,
        date: requestDate,
        overallStatus: 'present'
      });
    }

    // Convert TIME values to TIMESTAMP by combining with the overtime date
    const startTimestamp = new Date(`${requestDate.toISOString().split('T')[0]}T${startTime}`);

    // Create overtime session
    await attendanceSessionModel.createAttendanceSession({
      attendanceRecordId: attendanceRecord.id,
      sessionType: 'overtime',
      timestamp: startTimestamp
    });

    // Business rule update (2025-09-14): Overtime hours are no longer convertible to leave days automatically.
    // HR can manually adjust leave balances where necessary.
    // Therefore, we skip automatic leave accrual here.

    logger.info('Overtime approval applied successfully', {
      requestId: request.id,
      employeeId,
      requestDate,
      startTime,
      endTime,
      requestedHours
    });
  }

  /**
   * Get overlapping overtime request
   */
  private async getOverlappingRequest(
    employeeId: string, 
    requestDate: Date, 
    startTime: Date, 
    endTime: Date
  ): Promise<OvertimeRequest | null> {
    const query = `
      SELECT 
        id,
        employee_id as "employeeId",
        request_date as "requestDate",
        start_time as "startTime",
        end_time as "endTime",
        requested_hours as "requestedHours",
        reason,
        status,
        approver_id as "approvedBy",
        approved_at as "approvedAt",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM overtime_requests
      WHERE employee_id = $1 
        AND request_date = $2 
        AND status = 'pending'
        AND (
          (start_time <= $3 AND end_time > $3) OR
          (start_time < $4 AND end_time >= $4) OR
          (start_time >= $3 AND end_time <= $4)
        )
    `;

    // Convert Date objects to time strings for database comparison
    const startTimeStr = `${startTime.getUTCHours().toString().padStart(2, '0')}:${startTime.getUTCMinutes().toString().padStart(2, '0')}:${startTime.getUTCSeconds().toString().padStart(2, '0')}`;
    const endTimeStr = `${endTime.getUTCHours().toString().padStart(2, '0')}:${endTime.getUTCMinutes().toString().padStart(2, '0')}:${endTime.getUTCSeconds().toString().padStart(2, '0')}`;
    
    const result = await getPool().query(query, [employeeId, requestDate, startTimeStr, endTimeStr]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Get overtime request statistics
   */
  async getOvertimeStats(employeeId?: string, departmentId?: string): Promise<{
    totalRequests: number;
    pendingRequests: number;
    approvedRequests: number;
    rejectedRequests: number;
    totalHours: number;
    approvedHours: number;
  }> {
    return await overtimeRequestModel.getOvertimeRequestStats(employeeId, departmentId);
  }

  /**
   * Delete overtime request
   */
  async deleteOvertimeRequest(id: string): Promise<boolean> {
    const request = await overtimeRequestModel.findById(id);
    if (!request) {
      throw new Error('Overtime request not found');
    }

    if (request.status !== 'pending') {
      throw new Error('Cannot delete processed requests');
    }

    return await overtimeRequestModel.deleteOvertimeRequest(id);
  }

  /**
   * Get overtime requests for an employee
   */
  async getEmployeeOvertimeRequests(
    employeeId: string,
    startDate?: Date,
    endDate?: Date,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    requests: OvertimeWithDetails[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return await overtimeRequestModel.listOvertimeRequests({
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
   * Validate overtime request
   */
  async validateOvertimeRequest(data: CreateOvertimeData): Promise<{
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

    // Validate overtime date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overtimeDate = new Date(data.requestDate);
    overtimeDate.setHours(0, 0, 0, 0);
    
    if (overtimeDate < today) {
      errors.push('Cannot request overtime for past dates');
    }

    // Validate time range - work with time strings directly
    let startTimeStr: string;
    let endTimeStr: string;
    
    if (typeof data.startTime === 'string') {
      // Validate time format and ensure HH:MM:SS format
      const timeParts = data.startTime.split(':').map(Number);
      const hours = timeParts[0] || 0;
      const minutes = timeParts[1] || 0;
      const seconds = timeParts[2] || 0; // Default to 0 if not provided
      
      // Validate time components
      if (isNaN(hours) || isNaN(minutes) || isNaN(seconds) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59) {
        errors.push('Invalid start time format');
        return { isValid: false, errors };
      }
      
      startTimeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else if (data.startTime instanceof Date) {
      // Convert Date object to time string
      startTimeStr = `${data.startTime.getUTCHours().toString().padStart(2, '0')}:${data.startTime.getUTCMinutes().toString().padStart(2, '0')}:${data.startTime.getUTCSeconds().toString().padStart(2, '0')}`;
    } else {
      errors.push('Invalid start time format');
      return { isValid: false, errors };
    }
    
    if (typeof data.endTime === 'string') {
      // Validate time format and ensure HH:MM:SS format
      const timeParts = data.endTime.split(':').map(Number);
      const hours = timeParts[0] || 0;
      const minutes = timeParts[1] || 0;
      const seconds = timeParts[2] || 0; // Default to 0 if not provided
      
      // Validate time components
      if (isNaN(hours) || isNaN(minutes) || isNaN(seconds) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59) {
        errors.push('Invalid end time format');
        return { isValid: false, errors };
      }
      
      endTimeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else if (data.endTime instanceof Date) {
      // Convert Date object to time string
      endTimeStr = `${data.endTime.getUTCHours().toString().padStart(2, '0')}:${data.endTime.getUTCMinutes().toString().padStart(2, '0')}:${data.endTime.getUTCSeconds().toString().padStart(2, '0')}`;
    } else {
      errors.push('Invalid end time format');
      return { isValid: false, errors };
    }
    
    // Validate time order by comparing time strings
    if (startTimeStr >= endTimeStr) {
      errors.push('Start time must be before end time');
    }

    // Validate requested hours by creating temporary Date objects for calculation only
    const tempStart = new Date(`2000-01-01T${startTimeStr}`);
    const tempEnd = new Date(`2000-01-01T${endTimeStr}`);
    const calculatedHours = (tempEnd.getTime() - tempStart.getTime()) / (1000 * 60 * 60);
    if (Math.abs(calculatedHours - data.requestedHours) > 0.1) {
      errors.push('Requested hours do not match the time range');
    }

    if (data.requestedHours <= 0) {
      errors.push('Requested hours must be greater than 0');
    }

    // Validate reason
    if (!data.reason || data.reason.trim().length < 10) {
      errors.push('Reason must be at least 10 characters long');
    }

    // Check for overlapping requests
    if (employee) {
      // Create temporary Date objects for the overlapping check
      const tempStartForCheck = new Date(`2000-01-01T${startTimeStr}`);
      const tempEndForCheck = new Date(`2000-01-01T${endTimeStr}`);
      const overlappingRequest = await this.getOverlappingRequest(
        data.employeeId, 
        data.requestDate, 
        tempStartForCheck, 
        tempEndForCheck
      );
      if (overlappingRequest) {
        errors.push('An overtime request already exists for this time period');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get overtime summary for an employee
   */
  async getEmployeeOvertimeSummary(
    employeeId: string, 
        _startDate: Date,
    _endDate: Date
  ): Promise<{
    totalRequests: number;
    approvedRequests: number;
    totalHours: number;
    approvedHours: number;
    leaveDaysAccrued: number;
  }> {
    const stats = await this.getOvertimeStats(employeeId);
    
    return {
      totalRequests: stats.totalRequests,
      approvedRequests: stats.approvedRequests,
      totalHours: stats.totalHours,
      approvedHours: stats.approvedHours,
      leaveDaysAccrued: 0 // Conversion disabled per business rule change
    };
  }
}

export const overtimeService = new OvertimeService();