import { overtimeRequestModel, OvertimeRequest, CreateOvertimeRequestData, UpdateOvertimeRequestData } from '../../models/attendance/OvertimeRequest';
import { attendanceRecordModel } from '../../models/attendance/AttendanceRecord';
import { attendanceSessionModel } from '../../models/attendance/AttendanceSession';
import { leaveBalanceModel } from '../../models/leave/LeaveBalance';
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

    // Validate time range - handle both Date objects and string times
    let startTimeObj: Date;
    let endTimeObj: Date;
    
    if (startTime instanceof Date) {
      startTimeObj = startTime;
    } else if (typeof startTime === 'string') {
      // Parse time string (HH:MM:SS format) - create Date with same date as requestDate
      const [hours, minutes, seconds] = startTime.split(':').map(Number);
      startTimeObj = new Date(requestDate);
      startTimeObj.setUTCHours(hours, minutes, seconds, 0);
    } else {
      throw new Error('Invalid start time format');
    }
    
    if (endTime instanceof Date) {
      endTimeObj = endTime;
    } else if (typeof endTime === 'string') {
      // Parse time string (HH:MM:SS format) - create Date with same date as requestDate
      const [hours, minutes, seconds] = endTime.split(':').map(Number);
      endTimeObj = new Date(requestDate);
      endTimeObj.setUTCHours(hours, minutes, seconds, 0);
    } else {
      throw new Error('Invalid end time format');
    }
    
    if (startTimeObj >= endTimeObj) {
      throw new Error('Start time must be before end time');
    }

    // Validate requested hours
    const calculatedHours = (endTimeObj.getTime() - startTimeObj.getTime()) / (1000 * 60 * 60);
    if (Math.abs(calculatedHours - requestedHours) > 0.1) {
      throw new Error('Requested hours do not match the time range');
    }

    if (requestedHours <= 0) {
      throw new Error('Requested hours must be greater than 0');
    }

    // Check for overlapping overtime requests
    const overlappingRequest = await this.getOverlappingRequest(employeeId, requestDate, startTimeObj, endTimeObj);
    if (overlappingRequest) {
      throw new Error('An overtime request already exists for this time period');
    }

    // Create the overtime request - pass original string times to model
    // Extract original string times from the input data
    const originalStartTime = typeof startTime === 'string' ? startTime : 
      (startTime instanceof Date ? 
        `${startTime.getUTCHours().toString().padStart(2, '0')}:${startTime.getUTCMinutes().toString().padStart(2, '0')}:${startTime.getUTCSeconds().toString().padStart(2, '0')}` : 
        '00:00:00');
    
    const originalEndTime = typeof endTime === 'string' ? endTime : 
      (endTime instanceof Date ? 
        `${endTime.getUTCHours().toString().padStart(2, '0')}:${endTime.getUTCMinutes().toString().padStart(2, '0')}:${endTime.getUTCSeconds().toString().padStart(2, '0')}` : 
        '00:00:00');

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

    // Create overtime session
    await attendanceSessionModel.createAttendanceSession({
      attendanceRecordId: attendanceRecord.id,
      sessionType: 'clock_in', // Using clock_in for overtime start
      timestamp: startTime
    });

    await attendanceSessionModel.createAttendanceSession({
      attendanceRecordId: attendanceRecord.id,
      sessionType: 'clock_out', // Using clock_out for overtime end
      timestamp: endTime
    });

    // Accrue leave days from overtime hours
    await this.accrueLeaveFromOvertime(employeeId, requestedHours, requestDate);

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
   * Accrue leave days from overtime hours
   */
  private async accrueLeaveFromOvertime(employeeId: string, overtimeHours: number, _date: Date): Promise<void> {
    // Get overtime to leave ratio from system settings
    const query = `
      SELECT setting_value 
      FROM system_settings 
      WHERE setting_key = 'overtime_to_leave_ratio'
    `;
    
    const result = await getPool().query(query);
    const overtimeToLeaveRatio = result.rows.length > 0 ? parseFloat(result.rows[0].setting_value) : 0.125; // Default: 1 day per 8 hours

    const leaveDaysAccrued = overtimeHours * overtimeToLeaveRatio;
    const currentYear = new Date().getFullYear();

    // Add leave days to vacation balance
    await leaveBalanceModel.addLeaveDays(employeeId, 'vacation', leaveDaysAccrued, currentYear);

    logger.info('Leave days accrued from overtime', {
      employeeId,
      overtimeHours,
      leaveDaysAccrued,
      overtimeToLeaveRatio,
      year: currentYear
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

    const result = await getPool().query(query, [employeeId, requestDate, startTime, endTime]);
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
    const employee = await employeeModel.findByUserId(data.employeeId);
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

    // Validate time range - handle both Date objects and string times
    let startTimeObj: Date;
    let endTimeObj: Date;
    
    if (data.startTime instanceof Date) {
      startTimeObj = data.startTime;
    } else if (typeof data.startTime === 'string') {
      // Parse time string (HH:MM:SS format)
      const [hours, minutes, seconds] = data.startTime.split(':').map(Number);
      startTimeObj = new Date();
      startTimeObj.setUTCHours(hours, minutes, seconds, 0);
    } else {
      errors.push('Invalid start time format');
      return { isValid: false, errors };
    }
    
    if (data.endTime instanceof Date) {
      endTimeObj = data.endTime;
    } else if (typeof data.endTime === 'string') {
      // Parse time string (HH:MM:SS format)
      const [hours, minutes, seconds] = data.endTime.split(':').map(Number);
      endTimeObj = new Date();
      endTimeObj.setUTCHours(hours, minutes, seconds, 0);
    } else {
      errors.push('Invalid end time format');
      return { isValid: false, errors };
    }
    
    if (startTimeObj >= endTimeObj) {
      errors.push('Start time must be before end time');
    }

    // Validate requested hours
    const calculatedHours = (endTimeObj.getTime() - startTimeObj.getTime()) / (1000 * 60 * 60);
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
      const overlappingRequest = await this.getOverlappingRequest(
        data.employeeId, 
        data.requestDate, 
        startTimeObj, 
        endTimeObj
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
    
    // Get overtime to leave ratio
    const query = `
      SELECT setting_value 
      FROM system_settings 
      WHERE setting_key = 'overtime_to_leave_ratio'
    `;
    
    const result = await getPool().query(query);
    const overtimeToLeaveRatio = result.rows.length > 0 ? parseFloat(result.rows[0].setting_value) : 0.125;
    
    const leaveDaysAccrued = stats.approvedHours * overtimeToLeaveRatio;

    return {
      totalRequests: stats.totalRequests,
      approvedRequests: stats.approvedRequests,
      totalHours: stats.totalHours,
      approvedHours: stats.approvedHours,
      leaveDaysAccrued: Math.round(leaveDaysAccrued * 100) / 100
    };
  }
}

export const overtimeService = new OvertimeService();