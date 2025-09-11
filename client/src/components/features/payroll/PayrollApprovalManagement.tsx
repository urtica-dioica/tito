import React, { useState } from 'react';
import { CheckCircle, XCircle, Clock, Users, Calendar, Eye, Send, Printer, DollarSign, FileText } from 'lucide-react';
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

  // Fetch data
  const { data: approvalsData, isLoading: approvalsLoading, error: approvalsError } = usePayrollApprovals();
  const { data: periodsData } = usePayrollPeriods({ page: 1, limit: 100 });
  
  // Fetch all payroll records to show individual employee records
  const { data: allRecordsData, isLoading: allRecordsLoading } = usePayrollRecords({
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
  const periods = periodsData?.periods || [];
  // const records = recordsData?.records || [];
  const allRecords = allRecordsData?.records || [];

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

  // Group individual employee records by payroll period
  const recordsByPeriod = allRecords.reduce((acc, record) => {
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
      acc[periodName] = [];
    }
    acc[periodName].push(record);
    return acc;
  }, {} as Record<string, PayrollRecord[]>);

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

      {/* Employee Records by Period */}
      <div className="space-y-6">
        {Object.keys(recordsByPeriod).length === 0 ? (
          <Card className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No payroll records found</p>
            <p className="text-sm text-gray-400 mt-2">Records will appear here when payroll periods are generated</p>
          </Card>
        ) : (
          Object.entries(recordsByPeriod).map(([periodName, periodRecords]) => (
            <Card key={periodName} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{periodName}</h3>
                    <p className="text-sm text-gray-600">
                      {periodRecords.length} employee{periodRecords.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {periodRecords.every(r => r.status === 'paid') && (
                    <Badge variant="success">All Paid</Badge>
                  )}
                  {periodRecords.some(r => r.status === 'processed') && (
                    <Badge variant="warning">Processing</Badge>
                  )}
                  {periodRecords.some(r => r.status === 'draft') && (
                    <Badge variant="default">Draft</Badge>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {periodRecords.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <Users className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {record.employeeName || 'Unknown Employee'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {record.employeeId || 'N/A'} • {record.departmentName || 'N/A'}
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
                      </div>
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

                  {/* Paystub Details */}
                  <Card className="overflow-hidden">
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Earnings */}
                        <div className="space-y-4">
                          <h6 className="font-medium text-gray-900 flex items-center">
                            <DollarSign className="h-4 w-4 mr-2 text-green-600" />
                            Earnings
                          </h6>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Base Salary:</span>
                              <span className="font-medium">{formatCurrency(employeeRecord.baseSalary || 0)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Regular Hours:</span>
                              <span className="font-medium">{employeeRecord.totalRegularHours || 0} hrs</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Overtime Hours:</span>
                              <span className="font-medium">{employeeRecord.totalOvertimeHours || 0} hrs</span>
                            </div>
                            <div className="flex justify-between border-t pt-2">
                              <span className="font-medium">Gross Pay:</span>
                              <span className="font-bold text-green-600">{formatCurrency(employeeRecord.grossPay || 0)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Deductions & Benefits */}
                        <div className="space-y-4">
                          <h6 className="font-medium text-gray-900 flex items-center">
                            <XCircle className="h-4 w-4 mr-2 text-red-600" />
                            Deductions & Benefits
                          </h6>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Total Deductions:</span>
                              <span className="font-medium text-red-600">-{formatCurrency(employeeRecord.totalDeductions || 0)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Late Deductions:</span>
                              <span className="font-medium text-red-600">-{formatCurrency(employeeRecord.lateDeductions || 0)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Benefits:</span>
                              <span className="font-medium text-green-600">+{formatCurrency(employeeRecord.totalBenefits || 0)}</span>
                            </div>
                            <div className="flex justify-between border-t pt-2">
                              <span className="font-medium">Net Pay:</span>
                              <span className="font-bold text-green-600">{formatCurrency(employeeRecord.netPay || 0)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>

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
