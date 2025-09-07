import { PayrollApprovalModel, CreatePayrollApprovalData, UpdatePayrollApprovalData, PayrollApproval, PayrollApprovalWithDetails, PayrollApprovalListParams } from '../../models/payroll/PayrollApproval';

export interface ApprovePayrollData {
  approvalId: string;
  approverId: string;
  approved: boolean;
  comments?: string;
}

export interface PayrollApprovalStats {
  totalApprovals: number;
  pendingApprovals: number;
  approvedApprovals: number;
  rejectedApprovals: number;
  approvalsByDepartment: Array<{ departmentName: string; count: number }>;
  approvalsByApprover: Array<{ approverName: string; count: number }>;
  averageApprovalTime: number; // in hours
}

export class PayrollApprovalService {
  private payrollApprovalModel: PayrollApprovalModel;

  constructor() {
    this.payrollApprovalModel = new PayrollApprovalModel();
  }

  async createPayrollApproval(data: CreatePayrollApprovalData): Promise<PayrollApproval> {
    // Validate that the payroll period exists and is in the correct status
    const { getPool } = await import('../../config/database');
    const pool = getPool();
    
    const periodQuery = 'SELECT id, status FROM payroll_periods WHERE id = $1';
    const periodResult = await pool.query(periodQuery, [data.payrollPeriodId]);
    
    if (periodResult.rows.length === 0) {
      throw new Error('Payroll period not found');
    }
    
    const period = periodResult.rows[0];
    if (period.status !== 'sent_for_review') {
      throw new Error('Payroll period must be in "sent_for_review" status to create approvals');
    }

    // Check if approval already exists for this period and approver
    const existingQuery = `
      SELECT id FROM payroll_approvals 
      WHERE payroll_period_id = $1 AND approver_id = $2
    `;
    const existingResult = await pool.query(existingQuery, [data.payrollPeriodId, data.approverId]);
    
    if (existingResult.rows.length > 0) {
      throw new Error('Approval already exists for this payroll period and approver');
    }

    return await this.payrollApprovalModel.createPayrollApproval(data);
  }

  async getPayrollApproval(id: string): Promise<PayrollApprovalWithDetails | null> {
    return await this.payrollApprovalModel.findByIdWithDetails(id);
  }

  async updatePayrollApproval(id: string, data: UpdatePayrollApprovalData): Promise<PayrollApproval | null> {
    return await this.payrollApprovalModel.updatePayrollApproval(id, data);
  }

  async listPayrollApprovals(params: PayrollApprovalListParams = {}): Promise<{
    approvals: PayrollApprovalWithDetails[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return await this.payrollApprovalModel.listPayrollApprovals(params);
  }

  async getPendingApprovalsForApprover(approverId: string): Promise<PayrollApprovalWithDetails[]> {
    return await this.payrollApprovalModel.getPendingApprovalsForApprover(approverId);
  }

  async approvePayrollApproval(data: ApprovePayrollData): Promise<PayrollApproval> {
    const approval = await this.payrollApprovalModel.findById(data.approvalId);
    if (!approval) {
      throw new Error('Payroll approval not found');
    }

    if (approval.status !== 'pending') {
      throw new Error('Payroll approval is not in pending status');
    }

    if (approval.approverId !== data.approverId) {
      throw new Error('User is not authorized to approve this payroll');
    }

    const updateData: UpdatePayrollApprovalData = {
      status: data.approved ? 'approved' : 'rejected',
      comments: data.comments,
      approvedAt: new Date()
    };

    const updatedApproval = await this.payrollApprovalModel.updatePayrollApproval(data.approvalId, updateData);
    if (!updatedApproval) {
      throw new Error('Failed to update payroll approval');
    }

    // Check if all approvals for this payroll period are now complete
    await this.checkAndUpdatePayrollPeriodStatus(approval.payrollPeriodId);

    return updatedApproval;
  }

  async createApprovalsForPayrollPeriod(payrollPeriodId: string): Promise<PayrollApproval[]> {
    // Get all department heads and HR users who should approve payroll
    const { getPool } = await import('../../config/database');
    const pool = getPool();
    
    const approversQuery = `
      SELECT DISTINCT u.id as user_id, u.role, d.id as department_id
      FROM users u
      LEFT JOIN departments d ON u.id = d.department_head_user_id
      WHERE u.role IN ('hr', 'department_head') AND u.is_active = true
    `;
    
    const approversResult = await pool.query(approversQuery);
    const approvals: PayrollApproval[] = [];

    for (const approver of approversResult.rows) {
      try {
        const approvalData: CreatePayrollApprovalData = {
          payrollPeriodId,
          approverId: approver.user_id,
          departmentId: approver.department_id,
          status: 'pending'
        };

        const approval = await this.payrollApprovalModel.createPayrollApproval(approvalData);
        approvals.push(approval);
      } catch (error) {
        // Skip if approval already exists
        if (error instanceof Error && error.message.includes('already exists')) {
          continue;
        }
        throw error;
      }
    }

    return approvals;
  }

  async getPayrollApprovalStats(): Promise<PayrollApprovalStats> {
    const basicStats = await this.payrollApprovalModel.getApprovalStats();
    
    // Calculate average approval time
    const { getPool } = await import('../../config/database');
    const pool = getPool();
    
    const avgTimeQuery = `
      SELECT AVG(EXTRACT(EPOCH FROM (approved_at - created_at))/3600) as avg_hours
      FROM payroll_approvals 
      WHERE approved_at IS NOT NULL
    `;
    
    const avgTimeResult = await pool.query(avgTimeQuery);
    const averageApprovalTime = parseFloat(avgTimeResult.rows[0].avg_hours) || 0;

    return {
      ...basicStats,
      averageApprovalTime
    };
  }

  async deletePayrollApproval(id: string): Promise<boolean> {
    return await this.payrollApprovalModel.deletePayrollApproval(id);
  }

  private async checkAndUpdatePayrollPeriodStatus(payrollPeriodId: string): Promise<void> {
    const { getPool } = await import('../../config/database');
    const pool = getPool();
    
    // Get all approvals for this payroll period
    const approvalsQuery = `
      SELECT status, COUNT(*) as count
      FROM payroll_approvals 
      WHERE payroll_period_id = $1
      GROUP BY status
    `;
    
    const approvalsResult = await pool.query(approvalsQuery, [payrollPeriodId]);
    
    const totalApprovals = approvalsResult.rows.reduce((sum, row) => sum + parseInt(row.count), 0);
    const approvedCount = approvalsResult.rows.find(r => r.status === 'approved')?.count || 0;
    const rejectedCount = approvalsResult.rows.find(r => r.status === 'rejected')?.count || 0;

    let newStatus: string;
    
    if (rejectedCount > 0) {
      // If any approval is rejected, mark as draft
      newStatus = 'draft';
    } else if (approvedCount === totalApprovals) {
      // If all approvals are approved, mark as completed
      newStatus = 'completed';
    } else {
      // Still pending
      return;
    }

    // Update payroll period status
    const updateQuery = `
      UPDATE payroll_periods 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `;
    
    await pool.query(updateQuery, [newStatus, payrollPeriodId]);
  }

  async getApprovalWorkflowStatus(payrollPeriodId: string): Promise<{
    periodId: string;
    periodName: string;
    periodStatus: string;
    totalApprovals: number;
    pendingApprovals: number;
    approvedApprovals: number;
    rejectedApprovals: number;
    approvals: Array<{
      id: string;
      approverName: string;
      departmentName: string | null;
      status: string;
      approvedAt: Date | null;
      comments: string | null;
    }>;
  }> {
    const { getPool } = await import('../../config/database');
    const pool = getPool();
    
    // Get payroll period info
    const periodQuery = `
      SELECT id, period_name, status
      FROM payroll_periods 
      WHERE id = $1
    `;
    const periodResult = await pool.query(periodQuery, [payrollPeriodId]);
    
    if (periodResult.rows.length === 0) {
      throw new Error('Payroll period not found');
    }
    
    const period = periodResult.rows[0];
    
    // Get all approvals with details
    const approvalsQuery = `
      SELECT 
        pa.id,
        pa.status,
        pa.approved_at,
        pa.comments,
        CONCAT(u.first_name, ' ', u.last_name) as approver_name,
        d.name as department_name
      FROM payroll_approvals pa
      JOIN users u ON pa.approver_id = u.id
      LEFT JOIN departments d ON pa.department_id = d.id
      WHERE pa.payroll_period_id = $1
      ORDER BY pa.created_at ASC
    `;
    
    const approvalsResult = await pool.query(approvalsQuery, [payrollPeriodId]);
    
    const approvals = approvalsResult.rows.map(row => ({
      id: row.id,
      approverName: row.approver_name,
      departmentName: row.department_name,
      status: row.status,
      approvedAt: row.approved_at,
      comments: row.comments
    }));
    
    const totalApprovals = approvals.length;
    const pendingApprovals = approvals.filter(a => a.status === 'pending').length;
    const approvedApprovals = approvals.filter(a => a.status === 'approved').length;
    const rejectedApprovals = approvals.filter(a => a.status === 'rejected').length;

    return {
      periodId: period.id,
      periodName: period.period_name,
      periodStatus: period.status,
      totalApprovals,
      pendingApprovals,
      approvedApprovals,
      rejectedApprovals,
      approvals
    };
  }
}