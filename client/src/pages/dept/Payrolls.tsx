import React, { useState, useMemo, useCallback } from 'react';
import { DollarSign, Calendar, Users, Eye, Download, FileText, CheckCircle, XCircle } from 'lucide-react';
import Button from '../../components/shared/Button';
import Badge from '../../components/shared/Badge';
import PageLayout from '../../components/layout/PageLayout';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import PayrollPeriodDetailsModal from '../../components/features/PayrollPeriodDetailsModal';
import { 
  useDepartmentHeadPayrollPeriods, 
  useDepartmentHeadPayrollRecords, 
  useDepartmentHeadPayrollStats
} from '../../hooks/useDepartmentHead';
import { PayrollService } from '../../services/payrollService';
import type { PayrollPeriod } from '../../types';

const DepartmentPayrolls: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<PayrollPeriod | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch real data from API
  const { data: payrollPeriods, isLoading: periodsLoading, error: periodsError, refetch: refetchPeriods } = useDepartmentHeadPayrollPeriods();
  
  // Memoized function to get unique payroll periods
  const uniquePayrollPeriods = useMemo(() => {
    if (!payrollPeriods) return [];
    
    // Only log duplicates in development
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      const duplicateIds = payrollPeriods
        .map((p: any) => p.id)
        .filter((id: string, index: number, self: string[]) => self.indexOf(id) !== index);
      
      if (duplicateIds.length > 0) {
        console.warn('Duplicate payroll period IDs found:', duplicateIds);
      }
    }
    
    return payrollPeriods
      .filter((period: any, index: number, self: any[]) => 
        // Remove duplicates based on period ID
        index === self.findIndex((p: any) => p.id === period.id)
      )
      .map((period: any, index: number) => ({
        ...period,
        uniqueKey: `period-${period.id || index}`
      }));
  }, [payrollPeriods]);
  // Only fetch payroll records when a period is selected
  const { data: payrollRecords, isLoading: recordsLoading, refetch: refetchRecords } = useDepartmentHeadPayrollRecords(selectedPeriod?.id || '');
  const { data: stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useDepartmentHeadPayrollStats();

  const handleViewPeriod = useCallback((period: any) => {
    setSelectedPeriod(period);
    setIsViewModalOpen(true);
  }, []);


  const handleApprovePayroll = async (periodId: string, comments?: string) => {
    setIsApproving(true);
    setFeedbackMessage(null);
    
    try {
      // Find the approval ID for this period
      const period = payrollPeriods?.find((p: any) => p.id === periodId);
      if (!period || !period.approvalId) {
        throw new Error('Approval ID not found for this period');
      }
      
      // Call API to approve payroll using approval ID
      const { DepartmentHeadService } = await import('../../services/departmentHeadService');
      await DepartmentHeadService.approvePayrollApproval(period.approvalId, 'approved', comments);
      
      // Refresh all data
      await Promise.all([
        refetchPeriods(),
        refetchStats(),
        refetchRecords()
      ]);
      
      setFeedbackMessage({ type: 'success', message: 'Payroll approved successfully!' });
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setFeedbackMessage(null), 3000);
    } catch (error) {
      console.error('Error approving payroll:', error);
      setFeedbackMessage({ type: 'error', message: 'Failed to approve payroll. Please try again.' });
      
      // Auto-hide error message after 5 seconds
      setTimeout(() => setFeedbackMessage(null), 5000);
    } finally {
      setIsApproving(false);
    }
  };

  const handleRejectPayroll = async (periodId: string, reason?: string) => {
    setIsRejecting(true);
    setFeedbackMessage(null);
    
    try {
      // Find the approval ID for this period
      const period = payrollPeriods?.find((p: any) => p.id === periodId);
      if (!period || !period.approvalId) {
        throw new Error('Approval ID not found for this period');
      }
      
      // Call API to reject payroll using approval ID
      const { DepartmentHeadService } = await import('../../services/departmentHeadService');
      await DepartmentHeadService.approvePayrollApproval(period.approvalId, 'rejected', reason);
      
      // Refresh all data
      await Promise.all([
        refetchPeriods(),
        refetchStats(),
        refetchRecords()
      ]);
      
      setFeedbackMessage({ type: 'success', message: 'Payroll rejected successfully!' });
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setFeedbackMessage(null), 3000);
    } catch (error) {
      console.error('Error rejecting payroll:', error);
      setFeedbackMessage({ type: 'error', message: 'Failed to reject payroll. Please try again.' });
      
      // Auto-hide error message after 5 seconds
      setTimeout(() => setFeedbackMessage(null), 5000);
    } finally {
      setIsRejecting(false);
    }
  };

  const handleDownloadPaystubs = useCallback(async (period: any) => {
    try {
      console.log(`Downloading department paystubs for period: ${period.periodName}`);
      
      const response = await PayrollService.exportDepartmentPaystubsPDF(period.id);
      
      // Check if response is a valid Blob
      if (!(response instanceof Blob)) {
        console.error('Invalid response type:', typeof response, response);
        alert('Invalid response from server. Please try again.');
        return;
      }
      
      // Create download link
      const url = window.URL.createObjectURL(response);
      const link = document.createElement('a');
      link.href = url;
      link.download = `department-paystubs-${period.periodName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('Department paystubs download completed successfully');
    } catch (error) {
      console.error('Error downloading department paystubs:', error);
      alert('Failed to download paystubs. Please try again.');
    }
  }, []);

  // Memoized conversion function
  const convertedPayrollRecords = useMemo(() => {
    if (!payrollRecords) return null;
    return payrollRecords.map(record => ({
      id: record.id,
      payrollPeriodId: record.periodId,
      employeeId: record.employeeId,
      employeeName: record.employeeName,
      position: record.position,
      baseSalary: record.baseSalary,
      totalWorkedHours: record.totalWorkedHours,
      hourlyRate: record.hourlyRate,
      totalRegularHours: record.totalRegularHours,
      totalOvertimeHours: record.totalOvertimeHours,
      totalLateHours: record.totalLateHours,
      lateDeductions: record.lateDeductions,
      paidLeaveHours: record.paidLeaveHours || 0,
      grossPay: record.grossPay,
      netPay: record.netPay,
      totalDeductions: record.totalDeductions,
      totalBenefits: record.totalBenefits,
      status: record.status as 'draft' | 'processed' | 'paid',
      deductions: [], // Empty array for deductions
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    }));
  }, [payrollRecords]);


  const getApprovalStatusBadge = useCallback((approvalStatus: string) => {
    switch (approvalStatus) {
      case 'approved':
        return <Badge variant="success">Approved</Badge>;
      case 'rejected':
        return <Badge variant="error">Rejected</Badge>;
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      default:
        return <Badge variant="default">Unknown</Badge>;
    }
  }, []);


  // Loading state - only show loading if both critical data are loading
  if (periodsLoading && statsLoading) {
    return (
      <PageLayout title="Department Payrolls" subtitle="Loading payroll information...">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </PageLayout>
    );
  }

  // Error state - only show error if both critical data failed
  if (periodsError && statsError) {
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
      {/* Feedback Message */}
      {feedbackMessage && (
        <div className={`mb-4 p-4 rounded-lg border ${
          feedbackMessage.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {feedbackMessage.type === 'success' ? (
                <CheckCircle className="h-5 w-5 mr-2" />
              ) : (
                <XCircle className="h-5 w-5 mr-2" />
              )}
              <span className="font-medium">{feedbackMessage.message}</span>
            </div>
            <button
              onClick={() => setFeedbackMessage(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
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
                ₱{(stats?.totalGrossPay || 0).toLocaleString()}
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
              {uniquePayrollPeriods.length > 0 ? uniquePayrollPeriods.map((period) => (
                <div key={period.uniqueKey} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
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
                          {period.totalEmployees} employees • ₱{period.totalAmount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {getApprovalStatusBadge(period.approvalStatus)}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleViewPeriod(period)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      {period.approvalStatus === 'approved' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleDownloadPaystubs(period)}
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
        payrollRecords={convertedPayrollRecords}
        isLoading={recordsLoading}
        onApprovePayroll={handleApprovePayroll}
        onRejectPayroll={handleRejectPayroll}
        isApproving={isApproving}
        isRejecting={isRejecting}
      />

    </PageLayout>
  );
};

export default React.memo(DepartmentPayrolls);