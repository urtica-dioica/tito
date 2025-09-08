import React, { useState } from 'react';
import { DollarSign, Calendar, Users, Eye, Download, FileText } from 'lucide-react';
import Button from '../../components/shared/Button';
import Badge from '../../components/shared/Badge';
import Modal from '../../components/shared/Modal';
import PageLayout from '../../components/layout/PageLayout';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { 
  useDepartmentHeadPayrollPeriods, 
  useDepartmentHeadPayrollRecords, 
  useDepartmentHeadPayrollStats 
} from '../../hooks/useDepartmentHead';
import type { PayrollPeriod } from '../../types';

const DepartmentPayrolls: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<PayrollPeriod | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Fetch real data from API
  const { data: payrollPeriods, isLoading: periodsLoading, error: periodsError } = useDepartmentHeadPayrollPeriods();
  const { data: payrollRecords, isLoading: recordsLoading } = useDepartmentHeadPayrollRecords(selectedPeriod?.id || '');
  const { data: stats, isLoading: statsLoading, error: statsError } = useDepartmentHeadPayrollStats();

  const handleViewPeriod = (period: any) => {
    setSelectedPeriod(period);
    setIsViewModalOpen(true);
  };

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
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Payroll Period Details"
      >
        {selectedPeriod && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-button-primary rounded-full flex items-center justify-center">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-text-primary">{selectedPeriod.periodName}</h3>
                <p className="text-text-secondary">
                  {new Date(selectedPeriod.startDate).toLocaleDateString()} - {new Date(selectedPeriod.endDate).toLocaleDateString()}
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  {getStatusBadge(selectedPeriod.status)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Total Employees
                </label>
                <p className="text-text-primary">{selectedPeriod.totalEmployees}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Total Amount
                </label>
                <p className="text-text-primary">${selectedPeriod.totalAmount.toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Created At
                </label>
                <p className="text-text-primary">
                  {new Date(selectedPeriod.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Updated At
                </label>
                <p className="text-text-primary">
                  {new Date(selectedPeriod.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>

            {selectedPeriod.status === 'completed' && (
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Employee Payroll Records
                </label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {recordsLoading ? (
                    <div className="flex justify-center py-4">
                      <LoadingSpinner size="sm" />
                    </div>
                  ) : payrollRecords && payrollRecords.length > 0 ? payrollRecords.map((record) => (
                    <div key={record.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-text-primary">{record.employeeName}</p>
                          <p className="text-sm text-text-secondary">{record.position}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-text-primary">${record.netPay.toLocaleString()}</p>
                          <p className="text-xs text-text-secondary">Net Pay</p>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-4">
                      <p className="text-text-secondary">No payroll records found</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </PageLayout>
  );
};

export default DepartmentPayrolls;