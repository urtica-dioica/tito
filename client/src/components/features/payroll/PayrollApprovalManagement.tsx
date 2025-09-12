import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, Users, Calendar, Eye, Send, Printer, DollarSign, FileText, Zap, CreditCard, Building2 } from 'lucide-react';
import Button from '../../shared/Button';
import Card from '../../shared/Card';
import Badge from '../../shared/Badge';
import Modal from '../../shared/Modal';
import LoadingSpinner from '../../shared/LoadingSpinner';
import { usePayrollApprovals, usePayrollPeriods, usePayrollRecords } from '../../../hooks/usePayroll';
import { PayrollService } from '../../../services/payrollService';
import type { PayrollApproval, PayrollRecord } from '../../../types';

interface PayrollApprovalManagementProps {
  className?: string;
}

const PayrollApprovalManagement: React.FC<PayrollApprovalManagementProps> = ({ className }) => {
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<PayrollApproval | null>(null);

  // Fetch data with refetch capabilities
  const { data: approvalsData, isLoading: approvalsLoading, error: approvalsError, refetch: refetchApprovals } = usePayrollApprovals();
  const { data: periodsData, refetch: refetchPeriods } = usePayrollPeriods({ page: 1, limit: 100 });
  
  // Fetch all payroll records to show individual employee records
  const { data: allRecordsData, isLoading: allRecordsLoading, refetch: refetchRecords } = usePayrollRecords({
    page: 1,
    limit: 1000
  });
  
  // Fetch payroll records for the selected approval
  // const { data: recordsData } = usePayrollRecords({
  //   page: 1,
  //   limit: 1000,
  //   payrollPeriodId: selectedApproval?.payrollPeriodId,
  //   departmentId: selectedApproval?.departmentId
  // });

  const rawApprovals = approvalsData?.records || [];
  const allPeriods = periodsData?.periods || [];
  // Filter out completed periods - they should not be displayed in approvals
  const periods = allPeriods.filter(p => p.status !== 'completed');
  // const records = recordsData?.records || [];
  const rawRecords = allRecordsData?.records || [];
  
  // Deduplicate payroll records based on record ID
  const uniqueRecords = new Map<string, PayrollRecord>();
  rawRecords.forEach(record => {
    if (!uniqueRecords.has(record.id)) {
      uniqueRecords.set(record.id, record);
    }
  });
  
  // Filter out records from completed periods
  const allRecords = Array.from(uniqueRecords.values()).filter(record => {
    const period = allPeriods.find(p => p.id === record.payrollPeriodId);
    return period && period.status !== 'completed';
  });

  // Deduplicate approvals based on department + period combination
  // This prevents the same department from appearing multiple times for the same period
  const uniqueApprovals = new Map<string, PayrollApproval>();
  rawApprovals.forEach(approval => {
    // Create a unique key based on department and period
    const departmentId = approval.departmentId || approval.department?.id || 'no-dept';
    const uniqueKey = `${departmentId}-${approval.payrollPeriodId}`;
    
    // Only keep the first occurrence of each department-period combination
    if (!uniqueApprovals.has(uniqueKey)) {
      uniqueApprovals.set(uniqueKey, approval);
    }
  });

  // Convert back to array
  const deduplicatedApprovals = Array.from(uniqueApprovals.values());

  // const handleViewApproval = (approval: PayrollApproval) => {
  //   setSelectedApproval(approval);
  //   setIsViewModalOpen(true);
  // };

  const handleViewRecord = (record: PayrollRecord) => {
    // Create a mock approval object for the modal
    const mockApproval: PayrollApproval = {
      id: record.id,
      payrollPeriodId: record.payrollPeriodId,
      approverId: '',
      departmentId: record.departmentId || undefined,
      status: 'pending',
      comments: undefined,
      approvedAt: undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      approver: undefined,
      department: {
        id: record.departmentId || '',
        name: record.departmentName || 'Unknown Department',
        description: undefined
      },
      payrollPeriod: {
        id: record.payrollPeriodId,
        periodName: record.periodName || 'Unknown Period',
        startDate: '',
        endDate: '',
        status: 'active'
      }
    };
    setSelectedApproval(mockApproval);
    setIsViewModalOpen(true);
  };

  const handleSendReminder = async (approval: PayrollApproval) => {
    try {
      // Implementation for sending reminder to department head
      console.log('Sending reminder for approval:', approval.id);
      // This would call an API to send email/SMS reminder
    } catch (error) {
      console.error('Error sending reminder:', error);
    }
  };

  const handleBulkSendReminders = async () => {
    try {
      const pendingApprovals = deduplicatedApprovals.filter(approval => approval.status === 'pending');
      for (const approval of pendingApprovals) {
        await handleSendReminder(approval);
      }
    } catch (error) {
      console.error('Error sending bulk reminders:', error);
    }
  };

  const handleCreateApprovals = async (periodId: string) => {
    try {
      // Implementation for creating approvals for a payroll period
      console.log('Creating approvals for period:', periodId);
      // This would call an API to create approval records
    } catch (error) {
      console.error('Error creating approvals:', error);
    }
  };

  const handlePrintPaystubs = async (approval: PayrollApproval) => {
    try {
      if (!approval.department?.id || !approval.payrollPeriodId) {
        alert('Missing department or payroll period information');
        return;
      }

      // Call API to generate PDF paystubs for the department
      const response = await PayrollService.generateDepartmentPaystubs(
        approval.payrollPeriodId,
        approval.department.id
      );
      
      // Create download link
      const blob = new Blob([response], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `paystubs-${approval.department.name}-${approval.payrollPeriod?.periodName || 'payroll'}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating paystubs:', error);
      alert('Failed to generate paystubs. Please try again.');
    }
  };

  const handleUpdateRecordStatus = async (recordId: string, status: 'draft' | 'processed' | 'paid') => {
    try {
      await PayrollService.updatePayrollRecordStatus(recordId, status);
      alert(`Record status updated to ${status} successfully!`);
      // Refresh the data using proper state management
      await Promise.all([
        refetchRecords(),
        refetchApprovals(),
        refetchPeriods()
      ]);
    } catch (error) {
      console.error('Error updating record status:', error);
      alert('Failed to update record status. Please try again.');
    }
  };

  const handleBulkUpdatePeriodStatus = async (periodId: string, status: 'draft' | 'processed' | 'paid') => {
    try {
      const result = await PayrollService.bulkUpdatePayrollRecordsStatus(periodId, status);
      alert(`Bulk updated ${result.updatedCount} records to ${status} successfully!`);
      // Refresh the data using proper state management
      await Promise.all([
        refetchRecords(),
        refetchApprovals(),
        refetchPeriods()
      ]);
    } catch (error) {
      console.error('Error bulk updating period status:', error);
      alert('Failed to bulk update period status. Please try again.');
    }
  };

  const handleCompletePayrollPeriod = async (periodId: string) => {
    try {
      await PayrollService.completePayrollPeriod(periodId);
      alert('Payroll period completed successfully!');
      // Refresh the data using proper state management
      await Promise.all([
        refetchRecords(),
        refetchApprovals(),
        refetchPeriods()
      ]);
    } catch (error) {
      console.error('Error completing payroll period:', error);
      alert('Failed to complete payroll period. Please try again.');
    }
  };

  const handleBulkMarkAsPaid = async (periodId: string, departmentId?: string) => {
    try {
      console.log('Bulk mark as paid called with:', { periodId, departmentId });
      
      const result = await PayrollService.bulkUpdatePayrollRecordsToPaid({
        periodId,
        departmentId
      });
      
      console.log('Bulk mark as paid result:', result);
      alert(`Successfully marked ${result.updatedCount} records as paid!`);
      
      // Refresh the data using proper state management
      await Promise.all([
        refetchRecords(),
        refetchApprovals(),
        refetchPeriods()
      ]);
    } catch (error) {
      console.error('Error marking records as paid:', error);
      alert(`Failed to mark records as paid: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // const getStatusColor = (status: string) => {
  //   switch (status) {
  //     case 'approved': return 'success';
  //     case 'rejected': return 'error';
  //     case 'pending': return 'warning';
  //     default: return 'default';
  //   }
  // };

  // const getStatusIcon = (status: string) => {
  //   switch (status) {
  //     case 'approved': return <CheckCircle className="h-4 w-4" />;
  //     case 'rejected': return <XCircle className="h-4 w-4" />;
  //     case 'pending': return <Clock className="h-4 w-4" />;
  //     default: return <Clock className="h-4 w-4" />;
  //   }
  // };

  const getPeriodName = (periodId: string) => {
    const period = periods.find(p => p.id === periodId);
    return period?.periodName || 'Unknown Period';
  };

  // Debug function to check data
  console.log('Periods data:', periods);
  console.log('All records data:', allRecords);
  console.log('Sample record:', allRecords[0]);
  console.log('Sample record approval status:', allRecords[0]?.approvalStatus);
  console.log('Sample record status:', allRecords[0]?.status);
  
  // Auto-refresh data every 30 seconds to get updates from department head approvals
  useEffect(() => {
    const interval = setInterval(() => {
      refetchRecords();
      refetchApprovals();
      refetchPeriods();
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, [refetchRecords, refetchApprovals, refetchPeriods]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const getRecordStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'success';
      case 'processed': return 'warning';
      case 'draft': return 'default';
      default: return 'default';
    }
  };

  const getRecordStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'Paid';
      case 'processed': return 'Processed';
      case 'draft': return 'Draft';
      default: return status;
    }
  };

  // Group individual employee records by payroll period, then by department
  const recordsByPeriodAndDepartment = allRecords.reduce((acc, record) => {
    // Try to use the period name from the record first, then fall back to getPeriodName
    let periodName = record.periodName || getPeriodName(record.payrollPeriodId);
    
    // If still unknown, try to create a fallback name
    if (periodName === 'Unknown Period' || !periodName) {
      // Try to find the period in the periods data
      const period = periods.find(p => p.id === record.payrollPeriodId);
      if (period) {
        periodName = period.periodName;
      } else {
        // Create a fallback name using the period ID
        periodName = `Period ${record.payrollPeriodId.slice(-8)}`;
      }
    }
    
    if (!acc[periodName]) {
      acc[periodName] = {};
    }
    
    // Group by department within each period
    const departmentName = record.departmentName || 'Unknown Department';
    if (!acc[periodName][departmentName]) {
      acc[periodName][departmentName] = [];
    }
    
    acc[periodName][departmentName].push(record);
    return acc;
  }, {} as Record<string, Record<string, PayrollRecord[]>>);

  // Debug records by period and department
  console.log('Records by period and department:', recordsByPeriodAndDepartment);
  
  // Debug each department's records
  Object.entries(recordsByPeriodAndDepartment).forEach(([periodName, departments]) => {
    Object.entries(departments).forEach(([departmentName, records]) => {
      console.log(`${periodName} - ${departmentName}:`, records.map(r => ({ id: r.id, status: r.status, approvalStatus: r.approvalStatus })));
    });
  });

  if (approvalsLoading || allRecordsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (approvalsError) {
    return (
      <Card className="p-8 text-center">
        <p className="text-red-600">Error loading data: {approvalsError.message}</p>
      </Card>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Employee Payroll Records</h2>
            <p className="text-gray-600">View and manage individual employee payroll records and paystubs</p>
          </div>
          <div className="flex items-center space-x-2">
            {deduplicatedApprovals.filter(a => a.status === 'pending').length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkSendReminders}
                icon={<Send className="h-4 w-4" />}
              >
                Send Reminders
              </Button>
            )}
            {periods.filter(p => p.status === 'completed').length > 0 && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  const completedPeriod = periods.find(p => p.status === 'completed');
                  if (completedPeriod) handleCreateApprovals(completedPeriod.id);
                }}
                icon={<CheckCircle className="h-4 w-4" />}
              >
                Create Approvals
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Approval Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Records</p>
              <p className="text-lg font-semibold text-gray-900">{allRecords.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Draft</p>
              <p className="text-lg font-semibold text-gray-900">
                {allRecords.filter(r => r.status === 'draft').length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Processed</p>
              <p className="text-lg font-semibold text-gray-900">
                {allRecords.filter(r => r.status === 'processed').length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Paid</p>
              <p className="text-lg font-semibold text-gray-900">
                {allRecords.filter(r => r.status === 'paid').length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Employee Records by Period and Department */}
      <div className="space-y-6">
        {Object.keys(recordsByPeriodAndDepartment).length === 0 ? (
          <Card className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No payroll records found</p>
            <p className="text-sm text-gray-400 mt-2">Records will appear here when payroll periods are generated</p>
          </Card>
        ) : (
          Object.entries(recordsByPeriodAndDepartment).map(([periodName, departments]) => (
            <Card key={periodName} className="overflow-hidden">
              {/* Period Header */}
              <div className="bg-blue-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-900">{periodName}</h3>
                      <p className="text-sm text-blue-700">
                        {Object.values(departments).flat().length} employee{Object.values(departments).flat().length !== 1 ? 's' : ''} across {Object.keys(departments).length} department{Object.keys(departments).length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* Complete Payroll Period Button - Show when all departments have approved */}
                    {Object.values(departments).flat().every(r => r.approvalStatus === 'approved') && 
                     Object.values(departments).flat().some(r => r.status === 'processed') && (
                      <Button
                        variant="success"
                        size="sm"
                        icon={<CheckCircle className="h-4 w-4" />}
                        onClick={() => {
                          const periodId = Object.values(departments).flat()[0]?.payrollPeriodId;
                          if (periodId) {
                            handleCompletePayrollPeriod(periodId);
                          }
                        }}
                      >
                        Complete Period
                      </Button>
                    )}
                    
                    {Object.values(departments).flat().every(r => r.status === 'paid') && (
                      <Badge variant="success">All Paid</Badge>
                    )}
                    {Object.values(departments).flat().some(r => r.status === 'processed') && (
                      <Badge variant="warning">Processing</Badge>
                    )}
                    {Object.values(departments).flat().some(r => r.status === 'draft') && (
                      <Badge variant="default">Draft</Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Departments */}
              <div className="space-y-0">
                {Object.entries(departments).map(([departmentName, departmentRecords]) => (
                  <div key={departmentName} className="border-b border-gray-200 last:border-b-0">
                    {/* Department Header */}
                    <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Building2 className="h-5 w-5 text-gray-600" />
                          <h4 className="font-medium text-gray-900">{departmentName}</h4>
                          <Badge variant="default">{departmentRecords.length} employee{departmentRecords.length !== 1 ? 's' : ''}</Badge>
                        </div>
                        
                        {/* Department-level Bulk Actions */}
                        <div className="flex items-center space-x-2">
                          {departmentRecords.some(r => r.status === 'draft' && r.approvalStatus === 'approved') && (
                            <Button
                              variant="primary"
                              size="sm"
                              icon={<Zap className="h-4 w-4" />}
                              onClick={() => {
                                const periodId = departmentRecords[0]?.payrollPeriodId;
                                const departmentId = departmentRecords[0]?.departmentId;
                                if (periodId && departmentId) {
                                  handleBulkUpdatePeriodStatus(periodId, 'processed');
                                }
                              }}
                            >
                              Process All
                            </Button>
                          )}
                          {departmentRecords.some(r => r.status === 'draft' && r.approvalStatus === 'pending') && (
                            <div className="text-xs text-gray-500 italic">
                              Awaiting department approval
                            </div>
                          )}
                          {departmentRecords.some(r => r.status === 'processed') && (
                            <Button
                              variant="success"
                              size="sm"
                              icon={<CreditCard className="h-4 w-4" />}
                              onClick={() => {
                                const periodId = departmentRecords[0]?.payrollPeriodId;
                                const departmentId = departmentRecords[0]?.departmentId;
                                console.log('Mark All Paid button clicked:', { 
                                  periodId, 
                                  departmentId, 
                                  departmentRecords: departmentRecords.map(r => ({ 
                                    id: r.id, 
                                    status: r.status, 
                                    payrollPeriodId: r.payrollPeriodId, 
                                    departmentId: r.departmentId,
                                    fullRecord: r // Show the full record to see all available fields
                                  }))
                                });
                                if (periodId) {
                                  handleBulkMarkAsPaid(periodId, departmentId);
                                } else {
                                  alert('Period ID not found');
                                }
                              }}
                            >
                              Mark All Paid
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Employee Records */}
                    <div className="space-y-0">
                      {departmentRecords.map((record) => (
                        <div key={record.id} className="flex items-center justify-between p-4 hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                              <Users className="h-4 w-4 text-gray-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {record.employeeName || 'Unknown Employee'}
                              </p>
                              <p className="text-sm text-gray-600">
                                {record.employeeId || 'N/A'}
                              </p>
                              <p className="text-sm text-gray-600">
                                Net Pay: {formatCurrency(record.netPay || 0)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                              <Badge variant={getRecordStatusColor(record.status)}>
                                {getRecordStatusLabel(record.status)}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                icon={<Eye className="h-4 w-4" />}
                                onClick={() => handleViewRecord(record)}
                              >
                                View
                              </Button>
                              
                              {/* Individual Record Action Buttons */}
                              {record.status === 'draft' && record.approvalStatus === 'approved' && (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  icon={<Zap className="h-4 w-4" />}
                                  onClick={() => handleUpdateRecordStatus(record.id, 'processed')}
                                >
                                  Process
                                </Button>
                              )}
                              {record.status === 'draft' && record.approvalStatus === 'pending' && (
                                <div className="text-xs text-gray-500 italic">
                                  Awaiting department approval
                                </div>
                              )}
                              {record.status === 'processed' && (
                                <Button
                                  variant="success"
                                  size="sm"
                                  icon={<CreditCard className="h-4 w-4" />}
                                  onClick={() => handleUpdateRecordStatus(record.id, 'paid')}
                                >
                                  Mark Paid
                                </Button>
                              )}
                              {record.status === 'paid' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  icon={<Printer className="h-4 w-4" />}
                                  onClick={() => {
                                    const mockApproval: PayrollApproval = {
                                      id: record.id,
                                      payrollPeriodId: record.payrollPeriodId,
                                      approverId: '',
                                      departmentId: record.departmentId || undefined,
                                      status: 'approved',
                                      comments: undefined,
                                      approvedAt: undefined,
                                      createdAt: record.createdAt,
                                      updatedAt: record.updatedAt,
                                      approver: undefined,
                                      department: {
                                        id: record.departmentId || '',
                                        name: record.departmentName || 'Unknown Department',
                                        description: undefined
                                      },
                                      payrollPeriod: {
                                        id: record.payrollPeriodId,
                                        periodName: record.periodName || 'Unknown Period',
                                        startDate: '',
                                        endDate: '',
                                        status: 'active'
                                      }
                                    };
                                    handlePrintPaystubs(mockApproval);
                                  }}
                                >
                                  Print
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* View Employee Record Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Employee Paystub Details"
        size="xl"
      >
        {selectedApproval && (
          <div className="space-y-6">
            {/* Find the specific employee record */}
            {(() => {
              const employeeRecord = allRecords.find(r => r.id === selectedApproval.id);
              if (!employeeRecord) {
                return (
                  <Card className="p-6 text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Record Not Found</h3>
                    <p className="text-gray-600">
                      The selected employee record could not be found.
                    </p>
                  </Card>
                );
              }

              return (
                <>
                  {/* Employee and Period Info */}
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-blue-900">
                          {employeeRecord.employeeName || 'Unknown Employee'}
                        </h3>
                        <p className="text-sm text-blue-700">
                          {employeeRecord.employeeId || 'N/A'} • {employeeRecord.departmentName || 'N/A'}
                        </p>
                        <p className="text-sm text-blue-700">
                          Payroll Period: {employeeRecord.periodName || getPeriodName(employeeRecord.payrollPeriodId)}
                        </p>
                        <div className="flex items-center space-x-4 mt-2">
                          <Badge variant={getRecordStatusColor(employeeRecord.status)}>
                            {getRecordStatusLabel(employeeRecord.status)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Paystub Details - Matching Employee Dashboard Format */}
                  <div className="space-y-4">
                    {/* Period and Net Pay Summary */}
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-green-900">{employeeRecord.periodName || 'Payroll Period'}</h4>
                          <p className="text-sm text-green-700">
                            {employeeRecord.createdAt ? new Date(employeeRecord.createdAt).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">
                            {formatCurrency(employeeRecord.netPay || 0)}
                          </p>
                          <p className="text-sm text-green-700">Net Pay (Total Monthly Income)</p>
                        </div>
                      </div>
                    </div>

                    {/* Benefits Section */}
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h5 className="font-medium text-green-900 mb-2">Benefits</h5>
                      <div className="space-y-1">
                        {employeeRecord.totalBenefits && employeeRecord.totalBenefits > 0 ? (
                          <div className="flex justify-between">
                            <span className="text-sm text-green-700">Benefits:</span>
                            <span className="text-sm font-medium text-green-900">+{formatCurrency(employeeRecord.totalBenefits)}</span>
                          </div>
                        ) : (
                          <p className="text-sm text-green-700">No benefits for this period</p>
                        )}
                        <div className="border-t border-green-200 pt-1 mt-2">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium text-green-900">Total Benefits:</span>
                            <span className="text-sm font-bold text-green-900">+{formatCurrency(employeeRecord.totalBenefits || 0)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Deductions Section */}
                    <div className="p-4 bg-red-50 rounded-lg">
                      <h5 className="font-medium text-red-900 mb-2">Deductions</h5>
                      <div className="space-y-1">
                        {employeeRecord.totalDeductions && employeeRecord.totalDeductions > 0 && (
                          <div className="flex justify-between">
                            <span className="text-sm text-red-700">Employee Deductions:</span>
                            <span className="text-sm font-medium text-red-900">-{formatCurrency(employeeRecord.totalDeductions)}</span>
                          </div>
                        )}
                        {employeeRecord.lateDeductions && employeeRecord.lateDeductions > 0 && (
                          <div className="flex justify-between">
                            <span className="text-sm text-red-700">Late Deductions:</span>
                            <span className="text-sm font-medium text-red-900">-{formatCurrency(employeeRecord.lateDeductions)}</span>
                          </div>
                        )}
                        <div className="border-t border-red-200 pt-1 mt-2">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium text-red-900">Total Deductions:</span>
                            <span className="text-sm font-bold text-red-900">-{formatCurrency(Number(employeeRecord.totalDeductions || 0) + Number(employeeRecord.lateDeductions || 0))}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Earnings Summary */}
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h5 className="font-medium text-blue-900 mb-2">Earnings Summary</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-blue-700">Base Salary:</span>
                          <span className="text-sm font-medium text-blue-900">{formatCurrency(employeeRecord.baseSalary || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-blue-700">Total Hours Worked:</span>
                          <span className="text-sm font-medium text-blue-900">{employeeRecord.totalWorkedHours || 0} hrs</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-blue-700">Regular Hours:</span>
                          <span className="text-sm font-medium text-blue-900">{employeeRecord.totalRegularHours || 0} hrs</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-blue-700">Overtime Hours:</span>
                          <span className="text-sm font-medium text-blue-900">{employeeRecord.totalOvertimeHours || 0} hrs</span>
                        </div>
                        {(employeeRecord.paidLeaveHours || 0) > 0 && (
                          <div className="flex justify-between">
                            <span className="text-sm text-blue-700">Paid Leave Hours:</span>
                            <span className="text-sm font-medium text-blue-900">{employeeRecord.paidLeaveHours || 0} hrs</span>
                          </div>
                        )}
                        {(employeeRecord.paidLeaveHours || 0) > 0 && (
                          <div className="flex justify-between">
                            <span className="text-sm text-blue-700">Leave Pay:</span>
                            <span className="text-sm font-medium text-blue-900">
                              {formatCurrency(((employeeRecord.paidLeaveHours || 0) * (employeeRecord.hourlyRate || 0)))}
                            </span>
                          </div>
                        )}
                        <div className="border-t border-blue-200 pt-2 mt-2">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium text-blue-900">Gross Pay:</span>
                            <span className="text-sm font-bold text-blue-900">{formatCurrency(employeeRecord.grossPay || 0)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <Button
                      variant="outline"
                      onClick={() => setIsViewModalOpen(false)}
                    >
                      Close
                    </Button>
                    <Button
                      variant="primary"
                      icon={<Printer className="h-4 w-4" />}
                      onClick={() => handlePrintPaystubs(selectedApproval)}
                    >
                      Print Paystub
                    </Button>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PayrollApprovalManagement;
