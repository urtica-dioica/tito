import React, { useState } from 'react';
import { Download, CheckCircle, Clock, XCircle, Calendar, Users, Zap } from 'lucide-react';
import Button from '../../shared/Button';
import Card from '../../shared/Card';
import Badge from '../../shared/Badge';
import Modal from '../../shared/Modal';
import LoadingSpinner from '../../shared/LoadingSpinner';
import { usePayrollPeriods, usePayrollApprovals, useInitializePayrollPeriods, useGenerateCurrentMonthPeriod, payrollKeys } from '../../../hooks/usePayroll';
import { useQueryClient } from '@tanstack/react-query';
import type { PayrollPeriod } from '../../../types';

interface PayrollPeriodManagementProps {
  className?: string;
}

const PayrollPeriodManagement: React.FC<PayrollPeriodManagementProps> = ({ className }) => {
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPeriod] = useState<PayrollPeriod | null>(null);

  // Fetch data
  const { data: periodsData, isLoading, error, refetch, isFetching } = usePayrollPeriods({
    page: 1,
    limit: 50
  });
  
  const queryClient = useQueryClient();
  
  const initializePeriodsMutation = useInitializePayrollPeriods();
  const generateCurrentMonthMutation = useGenerateCurrentMonthPeriod();
  const { data: approvalsData } = usePayrollApprovals();

  const payrollPeriods = periodsData?.periods || [];
  const approvals = approvalsData?.records || [];


  // Auto-initialize periods on component mount if none exist
  // useEffect(() => {
  //   if (!isLoading && payrollPeriods.length === 0) {
  //     handleInitializePeriods();
  //   }
  // }, [isLoading, payrollPeriods.length]);

  const handleInitializePeriods = async () => {
    try {
      await initializePeriodsMutation.mutateAsync();
      
      // Force refresh the data with cache invalidation
      await queryClient.invalidateQueries({ queryKey: ['payroll', 'periods'] });
      await refetch();
      
      alert('Payroll periods generated successfully!');
    } catch (error) {
      console.error('Error initializing payroll periods:', error);
      alert(`Failed to generate payroll periods: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleGenerateCurrentMonth = async () => {
    try {
      await generateCurrentMonthMutation.mutateAsync();
      
      // Force refresh the data with cache invalidation - same as initialize periods
      await queryClient.invalidateQueries({ queryKey: ['payroll', 'periods'] });
      await queryClient.invalidateQueries({ queryKey: payrollKeys.periods() });
      await refetch();
      
      alert('Current month payroll period is ready! (Period already existed or was created successfully)');
    } catch (error) {
      console.error('Error generating current month period:', error);
      alert(`Failed to generate current month period: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };




  const handleExport = (period: PayrollPeriod, format: 'csv' | 'pdf') => {
    // Implementation for exporting payroll data
    console.log(`Exporting ${period.periodName} as ${format}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'default';
      case 'processing': return 'warning';
      case 'sent_for_review': return 'info';
      case 'completed': return 'success';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Draft';
      case 'processing': return 'Processing';
      case 'sent_for_review': return 'Under Review';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  const getApprovalStatus = (periodId: string) => {
    const periodApprovals = approvals.filter(approval => approval.payrollPeriodId === periodId);
    if (periodApprovals.length === 0) return { status: 'not_sent', count: 0, total: 0 };
    
    const approved = periodApprovals.filter(a => a.status === 'approved').length;
    const rejected = periodApprovals.filter(a => a.status === 'rejected').length;
    const pending = periodApprovals.filter(a => a.status === 'pending').length;
    
    if (rejected > 0) return { status: 'rejected', count: rejected, total: periodApprovals.length };
    if (pending > 0) return { status: 'pending', count: pending, total: periodApprovals.length };
    if (approved === periodApprovals.length) return { status: 'approved', count: approved, total: periodApprovals.length };
    
    return { status: 'partial', count: approved, total: periodApprovals.length };
  };

  const getApprovalBadge = (periodId: string) => {
    const approval = getApprovalStatus(periodId);
    
    switch (approval.status) {
      case 'not_sent':
        return <Badge variant="default">Not Sent</Badge>;
      case 'pending':
        return <Badge variant="warning">{approval.count}/{approval.total} Pending</Badge>;
      case 'approved':
        return <Badge variant="success">{approval.count}/{approval.total} Approved</Badge>;
      case 'rejected':
        return <Badge variant="error">{approval.count} Rejected</Badge>;
      case 'partial':
        return <Badge variant="info">{approval.count}/{approval.total} Approved</Badge>;
      default:
        return <Badge variant="default">Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <p className="text-red-600">Error loading payroll periods: {error.message}</p>
      </Card>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payroll Periods</h2>
          <p className="text-gray-600">
            Payroll periods are automatically generated for each month with actual working days calculated (excluding weekends)
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            icon={<Zap className="h-4 w-4" />} 
            onClick={handleGenerateCurrentMonth}
            disabled={generateCurrentMonthMutation.isPending}
          >
            {generateCurrentMonthMutation.isPending ? 'Generating...' : 'Generate Current Month'}
          </Button>
          <Button 
            variant="outline" 
            onClick={async () => {
              // Invalidate all payroll periods queries and refetch
              await queryClient.invalidateQueries({ queryKey: ['payroll', 'periods'] });
              await refetch();
            }}
            disabled={isFetching}
            className="bg-blue-100 text-blue-800 hover:bg-blue-200"
          >
            {isFetching ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Debug Section */}

      {/* Payroll Periods List */}
      <div className="space-y-4">
        {payrollPeriods.length === 0 ? (
          <Card className="p-8 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No payroll periods found</p>
            <p className="text-sm text-gray-400 mt-2">
              Payroll periods are automatically generated for each month with actual working days calculated (excluding weekends)
            </p>
            <div className="mt-4">
              <Button 
                variant="primary" 
                icon={<Zap className="h-4 w-4" />} 
                onClick={() => {
                  console.log('Generate Current Year Periods button clicked');
                  handleInitializePeriods();
                }}
                disabled={initializePeriodsMutation.isPending}
              >
                {initializePeriodsMutation.isPending ? 'Generating...' : 'Generate Current Year Periods'}
              </Button>
            </div>
          </Card>
        ) : (
          payrollPeriods.map((period) => {
            // const approvalStatus = getApprovalStatus(period.id);
            
            return (
              <Card key={period.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{period.periodName}</h3>
                        <p className="text-sm text-gray-600">
                          {period.startDate ? new Date(period.startDate).toLocaleDateString() : 'Invalid Date'} - {period.endDate ? new Date(period.endDate).toLocaleDateString() : 'Invalid Date'}
                        </p>
                        {period.workingDays && period.expectedHours && (
                          <p className="text-xs text-gray-500 mt-1">
                            {period.workingDays} working days • {period.expectedHours} expected hours
                          </p>
                        )}
                        <div className="flex items-center space-x-4 mt-2">
                          <Badge variant={getStatusColor(period.status)}>
                            {getStatusLabel(period.status)}
                          </Badge>
                          {getApprovalBadge(period.id)}
                        </div>
                      </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {period.status === 'completed' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<Download className="h-4 w-4" />}
                          onClick={() => handleExport(period, 'csv')}
                        >
                          CSV
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<Download className="h-4 w-4" />}
                          onClick={() => handleExport(period, 'pdf')}
                        >
                          PDF
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>


      {/* View Period Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Payroll Period Details"
        size="xl"
      >
        {selectedPeriod && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{selectedPeriod.periodName}</h3>
                <p className="text-gray-600">
                  {selectedPeriod.startDate ? new Date(selectedPeriod.startDate).toLocaleDateString() : 'Invalid Date'} - {selectedPeriod.endDate ? new Date(selectedPeriod.endDate).toLocaleDateString() : 'Invalid Date'}
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge variant={getStatusColor(selectedPeriod.status)}>
                    {getStatusLabel(selectedPeriod.status)}
                  </Badge>
                  {getApprovalBadge(selectedPeriod.id)}
                </div>
              </div>
            </div>

            {/* Department Approval Status */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Department Approval Status</h4>
              <div className="space-y-2">
                {approvals
                  .filter(approval => approval.payrollPeriodId === selectedPeriod.id)
                  .map((approval) => (
                    <div key={approval.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <Users className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{approval.departmentName || 'No Department'}</p>
                          <p className="text-sm text-gray-600">Approver: {approval.approverName}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {approval.status === 'approved' && <CheckCircle className="h-5 w-5 text-green-500" />}
                        {approval.status === 'rejected' && <XCircle className="h-5 w-5 text-red-500" />}
                        {approval.status === 'pending' && <Clock className="h-5 w-5 text-yellow-500" />}
                        <Badge variant={
                          approval.status === 'approved' ? 'success' :
                          approval.status === 'rejected' ? 'error' : 'warning'
                        }>
                          {approval.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Export Options */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Export Options</h4>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  icon={<Download className="h-4 w-4" />}
                  onClick={() => handleExport(selectedPeriod, 'csv')}
                >
                  Export as CSV
                </Button>
                <Button
                  variant="outline"
                  icon={<Download className="h-4 w-4" />}
                  onClick={() => handleExport(selectedPeriod, 'pdf')}
                >
                  Export as PDF
                </Button>
                <Button
                  variant="outline"
                  icon={<Download className="h-4 w-4" />}
                  onClick={() => window.print()}
                >
                  Print
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PayrollPeriodManagement;
