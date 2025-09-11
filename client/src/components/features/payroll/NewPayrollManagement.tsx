import React, { useState } from 'react';
import { DollarSign, Calendar, Users, Download, Plus, Eye, CheckCircle, AlertCircle, Play, Calculator } from 'lucide-react';
import Button from '../../shared/Button';
import Card from '../../shared/Card';
import Badge from '../../shared/Badge';
import Modal from '../../shared/Modal';
import PageLayout from '../../layout/PageLayout';
import LoadingSpinner from '../../shared/LoadingSpinner';
import { useNewPayrollRecords, useUpdateNewPayrollRecord } from '../../../hooks/usePayroll';
import { usePayrollPeriods } from '../../../hooks/usePayroll';
import type { PayrollPeriod } from '../../../types';

interface NewPayrollManagementProps {
  className?: string;
}

const NewPayrollManagement: React.FC<NewPayrollManagementProps> = ({ className }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<PayrollPeriod | null>(null);
  const [isViewRecordsModalOpen, setIsViewRecordsModalOpen] = useState(false);
  // const [isProcessingModalOpen, setIsProcessingModalOpen] = useState(false);
  // const [activeTab, setActiveTab] = useState<'overview' | 'records' | 'calculations'>('overview');
  
  // Fetch data
  const { data: periodsData, isLoading: periodsLoading, error: periodsError } = usePayrollPeriods({
    page: 1,
    limit: 50
  });
  
  const { data: payrollRecordsData, isLoading: recordsLoading } = useNewPayrollRecords({
    payrollPeriodId: selectedPeriod?.id,
    page: 1,
    limit: 100
  });

  const updateRecordMutation = useUpdateNewPayrollRecord();

  const payrollPeriods = periodsData?.periods || [];
  const payrollRecords = payrollRecordsData?.records || [];

  const handleViewPeriod = (period: PayrollPeriod) => {
    setSelectedPeriod(period);
    setIsViewRecordsModalOpen(true);
  };

  const handleProcessPayroll = (periodId: string) => {
    // This would trigger the payroll processing
    console.log('Processing payroll for period:', periodId);
  };

  const handleApproveRecord = async (recordId: string) => {
    try {
      await updateRecordMutation.mutateAsync({
        id: recordId,
        data: { status: 'processed' }
      });
    } catch (error) {
      console.error('Error approving record:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success">Approved</Badge>;
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'draft':
        return <Badge variant="default">Draft</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'processing':
        return 'Processing';
      case 'draft':
        return 'Draft';
      default:
        return status;
    }
  };

  // const getStatusColor = (status: string) => {
  //   switch (status) {
  //     case 'completed':
  //       return 'text-green-600';
  //     case 'processing':
  //       return 'text-yellow-600';
  //     case 'draft':
  //       return 'text-gray-600';
  //     default:
  //       return 'text-gray-600';
  //   }
  // };

  // Show loading state
  if (periodsLoading) {
    return (
      <PageLayout
        title="New Payroll Management"
        subtitle="Process payroll with new deduction and benefit system"
      >
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </PageLayout>
    );
  }

  // Show error state
  if (periodsError) {
    return (
      <PageLayout
        title="New Payroll Management"
        subtitle="Process payroll with new deduction and benefit system"
      >
        <div className="text-center py-12">
          <p className="text-red-600">
            Error loading payroll data: {periodsError.message}
          </p>
        </div>
      </PageLayout>
    );
  }

  const totalEmployees = payrollRecords.length;
  const totalGrossPay = payrollRecords.reduce((sum, record) => sum + (record.baseSalary || 0), 0);
  const totalDeductions = payrollRecords.reduce((sum, record) => sum + (record.totalDeductions || 0), 0);
  const totalBenefits = payrollRecords.reduce((sum, record) => sum + (record.totalBenefits || 0), 0);
  const totalNetPay = payrollRecords.reduce((sum, record) => sum + (record.netPay || 0), 0);

  return (
    <div className={className}>
      <PageLayout
        title="New Payroll Management"
        subtitle="Process payroll with new deduction and benefit system"
        actions={
          <div className="flex items-center gap-3">
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Generate Payroll
            </Button>
          </div>
        }
      >
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Total Employees</h3>
                <p className="text-2xl font-bold text-blue-600">{totalEmployees}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Total Gross Pay</h3>
                <p className="text-2xl font-bold text-green-600">₱{totalGrossPay.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Total Deductions</h3>
                <p className="text-2xl font-bold text-red-600">₱{totalDeductions.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Total Benefits</h3>
                <p className="text-2xl font-bold text-purple-600">₱{totalBenefits.toLocaleString()}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Net Pay Summary */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Total Net Pay</h3>
              <p className="text-3xl font-bold text-gray-900">₱{totalNetPay.toLocaleString()}</p>
            </div>
            <Calculator className="h-12 w-12 text-gray-400" />
          </div>
        </Card>

        {/* Payroll Periods */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Payroll Periods</h3>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {payrollPeriods.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No payroll periods found</p>
              </div>
            ) : (
              payrollPeriods.map((period) => (
                <div key={period.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium text-gray-900">{period.periodName}</h4>
                        <Badge variant={period.status === 'completed' ? 'success' : period.status === 'processing' ? 'warning' : 'default'}>
                          {getStatusLabel(period.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewPeriod(period)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        View Records
                      </Button>
                      {period.status === 'draft' && (
                        <Button
                          size="sm"
                          onClick={() => handleProcessPayroll(period.id)}
                          className="flex items-center gap-1"
                        >
                          <Play className="h-4 w-4" />
                          Process
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* View Records Modal */}
        <Modal
          isOpen={isViewRecordsModalOpen}
          onClose={() => setIsViewRecordsModalOpen(false)}
          title={`Payroll Records - ${selectedPeriod?.periodName}`}
          size="xl"
        >
          <div className="space-y-4">
            {recordsLoading ? (
              <div className="flex justify-center items-center h-32">
                <LoadingSpinner size="lg" />
              </div>
            ) : payrollRecords.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No payroll records found for this period</p>
              </div>
            ) : (
              <div className="space-y-3">
                {payrollRecords.map((record) => (
                  <div key={record.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-medium text-gray-900">
                            {record.employee?.user.firstName} {record.employee?.user.lastName}
                          </h4>
                          {getStatusBadge(record.status)}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm">
                          <div>
                            <span className="text-gray-500">Base Salary:</span>
                            <p className="font-medium">₱{record.baseSalary?.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Deductions:</span>
                            <p className="font-medium text-red-600">₱{record.totalDeductions?.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Benefits:</span>
                            <p className="font-medium text-green-600">₱{record.totalBenefits?.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Net Pay:</span>
                            <p className="font-medium text-blue-600">₱{record.netPay?.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {record.status === 'draft' && (
                          <Button
                            size="sm"
                            onClick={() => handleApproveRecord(record.id)}
                            className="flex items-center gap-1"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Approve
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      </PageLayout>
    </div>
  );
};

export default NewPayrollManagement;
