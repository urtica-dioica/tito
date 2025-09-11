import React, { useState } from 'react';
import { DollarSign, Calendar, Users, Eye, Download, FileText, CheckCircle, XCircle, Search } from 'lucide-react';
import Button from '../../components/shared/Button';
import Badge from '../../components/shared/Badge';
import Card from '../../components/shared/Card';
import Modal from '../../components/shared/Modal';
import PageLayout from '../../components/layout/PageLayout';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import PayrollPeriodDetailsModal from '../../components/features/PayrollPeriodDetailsModal';
import { 
  useDepartmentHeadPayrollPeriods, 
  useDepartmentHeadPayrollRecords, 
  useDepartmentHeadPayrollStats,
  useDepartmentHeadPayrollApprovals
} from '../../hooks/useDepartmentHead';
import type { PayrollPeriod, PayrollRecord } from '../../types';

const DepartmentPayrolls: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<PayrollPeriod | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch real data from API
  const { data: payrollPeriods, isLoading: periodsLoading, error: periodsError } = useDepartmentHeadPayrollPeriods();
  const { data: payrollRecords, isLoading: recordsLoading } = useDepartmentHeadPayrollRecords(selectedPeriod?.id || '');
  const { data: stats, isLoading: statsLoading, error: statsError } = useDepartmentHeadPayrollStats();
  const { data: approvals, refetch: refetchApprovals } = useDepartmentHeadPayrollApprovals();

  const handleViewPeriod = (period: any) => {
    setSelectedPeriod(period);
    setIsViewModalOpen(true);
  };

  const handleReviewPayroll = (approval: any) => {
    setSelectedApproval(approval);
    setIsApprovalModalOpen(true);
  };

  const confirmApproval = async (approvalId: string, status: 'approved' | 'rejected', comments?: string) => {
    try {
      // Call API to approve/reject payroll
      const { DepartmentHeadService } = await import('../../services/departmentHeadService');
      await DepartmentHeadService.approvePayrollApproval(approvalId, status, comments);
      
      await refetchApprovals();
      setIsApprovalModalOpen(false);
      setSelectedApproval(null);
      alert(`Payroll ${status} successfully!`);
    } catch (error) {
      console.error('Error approving payroll:', error);
      alert(`Failed to ${status} payroll. Please try again.`);
    }
  };

  const handleApprovePayroll = async (periodId: string, comments?: string) => {
    try {
      // Find the approval ID for this period
      const approval = approvals?.find((a: any) => a.payrollPeriodId === periodId);
      if (!approval) {
        alert('Approval record not found');
        return;
      }
      
      await confirmApproval(approval.id, 'approved', comments);
    } catch (error) {
      console.error('Error approving payroll:', error);
      alert('Failed to approve payroll. Please try again.');
    }
  };

  const handleRejectPayroll = async (periodId: string, reason?: string) => {
    try {
      // Find the approval ID for this period
      const approval = approvals?.find((a: any) => a.payrollPeriodId === periodId);
      if (!approval) {
        alert('Approval record not found');
        return;
      }
      
      await confirmApproval(approval.id, 'rejected', reason);
    } catch (error) {
      console.error('Error rejecting payroll:', error);
      alert('Failed to reject payroll. Please try again.');
    }
  };

  const formatCurrency = (amount: number | string | null | undefined) => {
    // Convert to number and handle various input types
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
    
    // Check if the conversion resulted in a valid number
    if (isNaN(numericAmount) || numericAmount === null || numericAmount === undefined) {
      return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP'
      }).format(0);
    }
    
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(numericAmount);
  };

  // Convert DepartmentHeadPayrollRecord to PayrollRecord
  const convertToPayrollRecords = (records: any[] | undefined): PayrollRecord[] | null => {
    if (!records) return null;
    return records.map(record => ({
      id: record.id,
      payrollPeriodId: record.periodId,
      employeeId: record.employeeId,
      employeeName: record.employeeName,
      baseSalary: record.baseSalary,
      totalWorkedHours: 0, // Default values for missing fields
      hourlyRate: 0,
      totalRegularHours: 0,
      totalOvertimeHours: 0,
      totalLateHours: 0,
      lateDeductions: 0,
      grossPay: record.baseSalary + (record.overtimePay || 0) + (record.bonuses || 0),
      netPay: record.netPay,
      totalDeductions: record.deductions || 0,
      totalBenefits: record.bonuses || 0,
      status: 'processed' as const,
      deductions: [], // Add missing deductions property
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    }));
  };

  // Filter payroll records based on search term
  const filteredRecords = selectedApproval?.payrollRecords?.filter((record: any) => 
    record.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'processing':
        return <Badge variant="warning">Processing</Badge>;
      case 'draft':
        return <Badge variant="default">Draft</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  // Helper function to get unique pending approvals
  const getUniquePendingApprovals = () => {
    if (!approvals) return [];
    return approvals
      .filter((a: any) => a.status === 'pending')
      .filter((approval: any, index: number, self: any[]) => 
        // Remove duplicates based on approval ID or payroll period ID
        index === self.findIndex((a: any) => a.id === approval.id || a.payrollPeriodId === approval.payrollPeriodId)
      );
  };

  // Loading state
  if (periodsLoading || statsLoading) {
    return (
      <PageLayout title="Department Payrolls" subtitle="Loading payroll information...">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </PageLayout>
    );
  }

  // Error state
  if (periodsError || statsError) {
    return (
      <PageLayout title="Department Payrolls" subtitle="Error loading payroll data">
        <div className="text-center py-12">
          <p className="text-red-600">
            Error loading payroll data: {periodsError?.message || statsError?.message}
          </p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Department Payrolls"
      subtitle="View payroll information for your department employees"
    >
      {/* Pending Approvals Section */}
      {approvals && approvals.length > 0 && (
        <div className="mb-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary">Pending Payroll Approvals</h3>
              <Badge variant="warning">{getUniquePendingApprovals().length} Pending</Badge>
            </div>
            <div className="space-y-3">
              {getUniquePendingApprovals().map((approval: any) => (
                <div key={approval.id || approval.payrollPeriodId} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-text-primary">{approval.periodName}</h4>
                      <p className="text-sm text-text-secondary">
                        {new Date(approval.createdAt).toLocaleDateString()} • {approval.totalEmployees} employees • ${approval.totalAmount.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReviewPayroll(approval)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Review
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Payroll Overview */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-full flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-text-primary">Payroll Overview</h3>
            <p className="text-sm text-text-secondary">
              Current payroll statistics and financial summary
            </p>
          </div>
          <div className="flex-1 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">Total Employees</p>
                  <p className="text-xs text-text-secondary">Active employees</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-text-primary">{Math.round(stats?.totalEmployees || 0)}</p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">Total Gross Pay</p>
                  <p className="text-xs text-text-secondary">Before deductions</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-text-primary">
                ${(stats?.totalGrossPay || 0).toLocaleString()}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FileText className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">Completed Periods</p>
                  <p className="text-xs text-text-secondary">Successfully processed</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-text-primary">{stats?.completedPeriods || 0}</p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">Processing</p>
                  <p className="text-xs text-text-secondary">Currently processing</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-text-primary">{stats?.processingPeriods || 0}</p>
            </div>
          </div>
        </div>

        {/* Right Column - Payroll Periods */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-full flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-text-primary">Payroll Periods</h3>
            <p className="text-sm text-text-secondary">
              View and download payroll reports for each period
            </p>
          </div>
          <div className="flex-1 p-6">
            <div className="space-y-4 h-full overflow-y-auto">
              {payrollPeriods && payrollPeriods.length > 0 ? payrollPeriods.map((period) => (
                <div key={period.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-button-primary rounded-full flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-text-primary">{period.periodName}</h4>
                        <p className="text-sm text-text-secondary">
                          {new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {period.totalEmployees} employees • ${period.totalAmount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {getStatusBadge(period.status)}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleViewPeriod(period)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      {period.status === 'completed' && (
                        <Button
                          variant="secondary"
                          size="sm"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-text-secondary">No payroll periods found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payroll Period Details Modal */}
      <PayrollPeriodDetailsModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        period={selectedPeriod}
        payrollRecords={convertToPayrollRecords(payrollRecords)}
        isLoading={recordsLoading}
        onApprovePayroll={handleApprovePayroll}
        onRejectPayroll={handleRejectPayroll}
      />

      {/* Payroll Approval Modal */}
      <Modal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        title="Review Payroll for Approval"
        size="xl"
      >
        {selectedApproval && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-text-primary">{selectedApproval.periodName}</h3>
                <p className="text-text-secondary">
                  {new Date(selectedApproval.startDate).toLocaleDateString()} - {new Date(selectedApproval.endDate).toLocaleDateString()}
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge variant="warning">Pending Approval</Badge>
                </div>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{selectedApproval.totalEmployees}</p>
                <p className="text-sm text-gray-600">Employees</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{formatCurrency(selectedApproval.totalGrossPay)}</p>
                <p className="text-sm text-gray-600">Gross Pay</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{formatCurrency(selectedApproval.totalDeductions)}</p>
                <p className="text-sm text-gray-600">Deductions</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{formatCurrency(selectedApproval.totalAmount)}</p>
                <p className="text-sm text-gray-600">Net Pay</p>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Employee Records Table */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hours
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Base Salary
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gross Pay
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Deductions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Benefits
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Net Pay
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRecords.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Employee Records</h3>
                          <p className="text-gray-600">
                            No employee records found for this payroll period.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredRecords.map((record: any) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {record.employeeName || 'Unknown Employee'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {record.employeeId || 'N/A'} • {record.position || 'N/A'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div>
                              <div>Regular: {record.totalRegularHours || 0}h</div>
                              <div>Overtime: {record.totalOvertimeHours || 0}h</div>
                              <div>Late: {record.totalLateHours || 0}h</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(record.baseSalary)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(record.grossPay)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                            -{formatCurrency(record.totalDeductions)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                            +{formatCurrency(record.totalBenefits)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                            {formatCurrency(record.netPay)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Comments */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Comments (Optional)
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Add any comments about this payroll approval..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setIsApprovalModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => confirmApproval(selectedApproval.id, 'rejected')}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
              <Button
                variant="primary"
                onClick={() => confirmApproval(selectedApproval.id, 'approved')}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Approve
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </PageLayout>
  );
};

export default DepartmentPayrolls;