import { leaveModel, Leave, CreateLeaveData, UpdateLeaveData } from '../../models/leave/Leave';
import { leaveBalanceModel, LeaveBalance } from '../../models/leave/LeaveBalance';
import { employeeModel } from '../../models/hr/Employee';
import logger from '../../utils/logger';

export interface CreateLeaveRequestData {
  employeeId: string;
  leaveType: 'vacation' | 'sick' | 'maternity' | 'other';
  startDate: Date;
  endDate: Date;
  reason?: string;
}

export interface ApproveLeaveData {
  leaveId: string;
  approverId: string;
  approved: boolean;
  comments?: string;
}

export interface LeaveWithDetails extends Leave {
  employeeCode: string;
  employeeName: string;
  departmentName: string | null;
  approverName: string | null;
}

export interface LeaveBalanceSummary {
  vacation: { total: number; used: number; available: number };
  sick: { total: number; used: number; available: number };
  maternity: { total: number; used: number; available: number };
  other: { total: number; used: number; available: number };
}

export class LeaveService {
  /**
   * Create a leave request
   */
  async createLeaveRequest(data: CreateLeaveRequestData): Promise<Leave> {
    const { employeeId, leaveType, startDate, endDate, reason } = data;

    // Verify employee exists and is active
    const employee = await employeeModel.findById(employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    if (employee.status !== 'active') {
      throw new Error('Employee is not active');
    }

    // Validate dates
    if (startDate >= endDate) {
      throw new Error('Start date must be before end date');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (startDate < today) {
      throw new Error('Cannot request leave for past dates');
    }

    // Calculate total days (excluding weekends)
    const totalDays = this.calculateWorkingDays(startDate, endDate);
    if (totalDays <= 0) {
      throw new Error('Leave period must include at least one working day');
    }

    // Check leave balance
    const currentYear = new Date().getFullYear();
    const leaveBalance = await leaveBalanceModel.findByEmployeeLeaveTypeAndYear(employeeId, leaveType, currentYear);
    
    if (leaveBalance) {
      const availableDays = leaveBalance.balance;
      if (availableDays < totalDays) {
        throw new Error(`Insufficient leave balance. Available: ${availableDays} days, Requested: ${totalDays} days`);
      }
    } else {
      // No leave balance record exists, create one with 0 balance
      await leaveBalanceModel.createLeaveBalance({
        employeeId,
        leaveType,
        balance: 0
      });
      throw new Error(`No leave balance available for ${leaveType} leave`);
    }

    // Check for overlapping leave requests
    const overlappingLeaves = await leaveModel.checkOverlappingLeaves(employeeId, startDate, endDate);
    if (overlappingLeaves.length > 0) {
      throw new Error('Leave request overlaps with existing approved leave');
    }

    // Create the leave request
    const leaveData: CreateLeaveData = {
      employeeId,
      leaveType,
      startDate,
      endDate,
      totalDays,
      ...(reason && { reason })
    };

    const leave = await leaveModel.createLeave(leaveData);

    logger.info('Leave request created', {
      leaveId: leave.id,
      employeeId,
      employeeCode: employee.employee_id,
      leaveType,
      startDate,
      endDate,
      totalDays,
      reason
    });

    return leave;
  }

  /**
   * Get leave request by ID
   */
  async getLeaveRequest(id: string): Promise<LeaveWithDetails | null> {
    return await leaveModel.findByIdWithDetails(id);
  }

  /**
   * Update leave request
   */
  async updateLeaveRequest(id: string, data: UpdateLeaveData): Promise<Leave | null> {
    return await leaveModel.updateLeave(id, data);
  }

  /**
   * List leave requests with filtering
   */
  async listLeaveRequests(params: {
    page?: number;
    limit?: number;
    employeeId?: string;
    departmentId?: string;
    leaveType?: 'vacation' | 'sick' | 'maternity' | 'other';
    status?: 'pending' | 'approved' | 'rejected';
    startDate?: Date;
    endDate?: Date;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{
    leaves: LeaveWithDetails[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return await leaveModel.listLeaves(params);
  }

  /**
   * Get pending requests for a department head
   */
  async getPendingRequestsForDepartmentHead(departmentHeadUserId: string): Promise<LeaveWithDetails[]> {
    return await leaveModel.getPendingRequestsForDepartmentHead(departmentHeadUserId);
  }

  /**
   * Approve or reject a leave request
   */
  async approveLeaveRequest(data: ApproveLeaveData): Promise<Leave> {
    const { leaveId, approverId, approved, comments } = data;

    // Get the leave request
    const leave = await leaveModel.findById(leaveId);
    if (!leave) {
      throw new Error('Leave request not found');
    }

    if (leave.status !== 'pending') {
      throw new Error('Request has already been processed');
    }

    // Update the leave request status
    const updateData: UpdateLeaveData = {
      status: approved ? 'approved' : 'rejected',
      approvedBy: approverId
    };

    const updatedLeave = await leaveModel.updateLeave(leaveId, updateData);
    if (!updatedLeave) {
      throw new Error('Failed to update leave request');
    }

    // If approved, update leave balance
    if (approved) {
      await this.updateLeaveBalance(updatedLeave);
    }

    logger.info('Leave request processed', {
      leaveId,
      approverId,
      approved,
      comments,
      employeeId: leave.employeeId,
      leaveType: leave.leaveType,
      startDate: leave.startDate,
      endDate: leave.endDate,
      totalDays: leave.totalDays
    });

    return updatedLeave;
  }

  /**
   * Update leave balance when leave is approved
   */
  private async updateLeaveBalance(leave: Leave): Promise<void> {
    const currentYear = new Date().getFullYear();
    
    // Use leave days from balance
    const updatedBalance = await leaveBalanceModel.useLeaveDays(
      leave.employeeId, 
      leave.leaveType, 
      leave.totalDays, 
      currentYear
    );

    if (!updatedBalance) {
      throw new Error('Failed to update leave balance - insufficient balance');
    }

    logger.info('Leave balance updated', {
      leaveId: leave.id,
      employeeId: leave.employeeId,
      leaveType: leave.leaveType,
      daysUsed: leave.totalDays,
      remainingBalance: updatedBalance.balance
    });
  }

  /**
   * Calculate working days between two dates (excluding weekends)
   */
  private calculateWorkingDays(startDate: Date, endDate: Date): number {
    let count = 0;
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    
    return count;
  }

  /**
   * Get leave balance for an employee
   */
  async getEmployeeLeaveBalance(employeeId: string, year?: number): Promise<LeaveBalanceSummary> {
    const currentYear = year || new Date().getFullYear();
    
    let balances = await leaveBalanceModel.getEmployeeLeaveBalances(employeeId, currentYear);
    
    // If no leave balances exist, create default ones
    if (balances.length === 0) {
      logger.info('No leave balances found for employee, creating defaults', { employeeId, year: currentYear });
      await this.initializeEmployeeLeaveBalance(employeeId, currentYear, 15, 10, 0, 0);
      // Fetch the newly created balances
      balances = await leaveBalanceModel.getEmployeeLeaveBalances(employeeId, currentYear);
    }
    
    const summary: LeaveBalanceSummary = {
      vacation: { total: 0, used: 0, available: 0 },
      sick: { total: 0, used: 0, available: 0 },
      maternity: { total: 0, used: 0, available: 0 },
      other: { total: 0, used: 0, available: 0 }
    };

    balances.forEach(balance => {
      const leaveType = balance.leaveType as keyof LeaveBalanceSummary;
      if (summary[leaveType]) {
        summary[leaveType].total = balance.balance;
        summary[leaveType].used = 0; // We'll need to calculate this from leave records
        summary[leaveType].available = balance.balance;
      }
    });

    return summary;
  }

  /**
   * Initialize leave balance for an employee
   */
  async initializeEmployeeLeaveBalance(
    employeeId: string, 
    year: number,
    vacationDays: number = 15,
    sickDays: number = 10,
    maternityDays: number = 0,
    otherDays: number = 0
  ): Promise<LeaveBalance[]> {
    const balances: LeaveBalance[] = [];

    // Create leave balances for each type
    const leaveTypes = [
      { type: 'vacation' as const, days: vacationDays },
      { type: 'sick' as const, days: sickDays },
      { type: 'maternity' as const, days: maternityDays },
      { type: 'other' as const, days: otherDays }
    ];

    for (const { type, days } of leaveTypes) {
      if (days > 0) {
        const balance = await leaveBalanceModel.upsertLeaveBalance({
          employeeId,
          leaveType: type,
          balance: days
        });
        balances.push(balance);
      }
    }

    logger.info('Leave balance initialized for employee', {
      employeeId,
      year,
      vacationDays,
      sickDays,
      maternityDays,
      otherDays
    });

    return balances;
  }

  /**
   * Get leave request statistics
   */
  async getLeaveStats(employeeId?: string, departmentId?: string): Promise<{
    totalRequests: number;
    pendingRequests: number;
    approvedRequests: number;
    rejectedRequests: number;
    totalDays: number;
    approvedDays: number;
  }> {
    return await leaveModel.getLeaveStats(employeeId, departmentId);
  }

  /**
   * Delete leave request
   */
  async deleteLeaveRequest(id: string): Promise<boolean> {
    const leave = await leaveModel.findById(id);
    if (!leave) {
      throw new Error('Leave request not found');
    }

    if (leave.status !== 'pending') {
      throw new Error('Cannot delete processed requests');
    }

    return await leaveModel.deleteLeave(id);
  }

  /**
   * Get leave requests for an employee
   */
  async getEmployeeLeaveRequests(
    employeeId: string,
    startDate?: Date,
    endDate?: Date,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    leaves: LeaveWithDetails[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return await leaveModel.listLeaves({
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
   * Validate leave request
   */
  async validateLeaveRequest(data: CreateLeaveRequestData): Promise<{
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

    // Validate dates
    if (data.startDate >= data.endDate) {
      errors.push('Start date must be before end date');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (data.startDate < today) {
      errors.push('Cannot request leave for past dates');
    }

    // Calculate total days
    const totalDays = this.calculateWorkingDays(data.startDate, data.endDate);
    if (totalDays <= 0) {
      errors.push('Leave period must include at least one working day');
    }

    // Check leave balance
    if (employee) {
      const currentYear = new Date().getFullYear();
      const leaveBalance = await leaveBalanceModel.findByEmployeeLeaveTypeAndYear(
        data.employeeId, 
        data.leaveType, 
        currentYear
      );
      
      if (leaveBalance) {
        const availableDays = leaveBalance.balance;
        if (availableDays < totalDays) {
          errors.push(`Insufficient leave balance. Available: ${availableDays} days, Requested: ${totalDays} days`);
        }
      } else {
        errors.push(`No leave balance available for ${data.leaveType} leave`);
      }

      // Check for overlapping requests
      const overlappingLeaves = await leaveModel.checkOverlappingLeaves(data.employeeId, data.startDate, data.endDate);
      if (overlappingLeaves.length > 0) {
        errors.push('Leave request overlaps with existing approved leave');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get leave calendar for an employee
   */
  async getEmployeeLeaveCalendar(employeeId: string, year: number): Promise<{
    approvedLeaves: Array<{
      id: string;
      leaveType: string;
      startDate: Date;
      endDate: Date;
      totalDays: number;
      reason: string | null;
    }>;
    pendingLeaves: Array<{
      id: string;
      leaveType: string;
      startDate: Date;
      endDate: Date;
      totalDays: number;
      reason: string | null;
    }>;
  }> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    const result = await leaveModel.listLeaves({
      employeeId,
      startDate,
      endDate,
      limit: 1000 // Get all leaves for the year
    });

    const approvedLeaves = result.leaves
      .filter(leave => leave.status === 'approved')
      .map(leave => ({
        id: leave.id,
        leaveType: leave.leaveType,
        startDate: leave.startDate,
        endDate: leave.endDate,
        totalDays: leave.totalDays,
        reason: leave.reason
      }));

    const pendingLeaves = result.leaves
      .filter(leave => leave.status === 'pending')
      .map(leave => ({
        id: leave.id,
        leaveType: leave.leaveType,
        startDate: leave.startDate,
        endDate: leave.endDate,
        totalDays: leave.totalDays,
        reason: leave.reason
      }));

    return {
      approvedLeaves,
      pendingLeaves
    };
  }
}

export const leaveService = new LeaveService();