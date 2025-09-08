import React, { useState } from 'react';
import { DollarSign, Calendar, Users, FileText, Download, Plus, Eye } from 'lucide-react';
import Button from '../../components/shared/Button';
import Card from '../../components/shared/Card';
import Badge from '../../components/shared/Badge';
import Modal from '../../components/shared/Modal';
import PageLayout from '../../components/layout/PageLayout';
import type { PayrollPeriod } from '../../types';

const PayrollManagement: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<PayrollPeriod | null>(null);
  const [isCreatePeriodModalOpen, setIsCreatePeriodModalOpen] = useState(false);
  const [isViewRecordsModalOpen, setIsViewRecordsModalOpen] = useState(false);
  const [isProcessingModalOpen, setIsProcessingModalOpen] = useState(false);

  // Mock data - TODO: Replace with actual API calls
  const payrollPeriods: PayrollPeriod[] = [
    {
      id: '1',
      name: 'January 2025',
      periodName: 'January 2025',
      startDate: '2025-01-01',
      endDate: '2025-01-31',
      status: 'completed',
      totalEmployees: 25,
      totalAmount: 150000,
      createdBy: 'hr-user-1',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-31T23:59:59Z',
    },
    {
      id: '2',
      name: 'February 2025',
      periodName: 'February 2025',
      startDate: '2025-02-01',
      endDate: '2025-02-28',
      status: 'processing',
      totalEmployees: 25,
      totalAmount: 150000,
      createdBy: 'hr-user-1',
      createdAt: '2025-02-01T00:00:00Z',
      updatedAt: '2025-02-15T10:30:00Z',
    },
    {
      id: '3',
      name: 'March 2025',
      periodName: 'March 2025',
      startDate: '2025-03-01',
      endDate: '2025-03-31',
      status: 'draft',
      totalEmployees: 25,
      totalAmount: 150000,
      createdBy: 'hr-user-1',
      createdAt: '2025-03-01T00:00:00Z',
      updatedAt: '2025-03-01T00:00:00Z',
    },
  ];

  const handleCreatePeriod = () => {
    setIsCreatePeriodModalOpen(true);
  };

  const handleViewRecords = (period: PayrollPeriod) => {
    setSelectedPeriod(period);
    setIsViewRecordsModalOpen(true);
  };

  const handleProcessPayroll = (period: PayrollPeriod) => {
    setSelectedPeriod(period);
    setIsProcessingModalOpen(true);
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

  const totalEmployees = 150; // Mock data
  const totalGrossPay = 125000; // Mock data
  const totalNetPay = 100000; // Mock data
  const totalDeductions = 25000; // Mock data

  return (
    <PageLayout
      title="Payroll Management"
      subtitle="Process payroll and manage employee compensation"
      actions={
        <div className="flex items-center space-x-3">
          <Button variant="secondary" icon={<Download className="h-4 w-4" />}>
            Export Reports
          </Button>
          <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={handleCreatePeriod}>
            Create Payroll Period
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Payroll Statistics */}
        <Card>
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-text-primary">Payroll Overview</h3>
            <p className="text-sm text-text-secondary">
              Current payroll statistics and financial summary
            </p>
          </div>
          <div className="p-6 space-y-4">
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
              <p className="text-2xl font-bold text-text-primary">{totalEmployees}</p>
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
                ${totalGrossPay.toLocaleString()}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">Total Net Pay</p>
                  <p className="text-xs text-text-secondary">After deductions</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-text-primary">
                ${totalNetPay.toLocaleString()}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">Total Deductions</p>
                  <p className="text-xs text-text-secondary">Taxes and benefits</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-text-primary">
                ${totalDeductions.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        {/* Right Column - Payroll Periods */}
        <Card>
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-text-primary">Payroll Periods</h3>
            <p className="text-sm text-text-secondary">
              Manage payroll periods and process employee compensation
            </p>
          </div>
          <div className="p-6">
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {payrollPeriods.map((period) => (
                <div
                  key={period.id}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Calendar className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-text-primary">{period.periodName}</h4>
                        <p className="text-xs text-text-secondary">
                          {new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant={getStatusColor(period.status)}>
                      {getStatusLabel(period.status)}
                    </Badge>
                  </div>

                  <div className="text-sm text-text-secondary mb-3">
                    <p>{period.totalEmployees} employees • ${period.totalAmount?.toLocaleString() || '0'}</p>
                    <p className="text-xs">Created by: {period.createdBy}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-text-secondary">
                      Period ID: {period.id}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<Eye className="h-3 w-3" />}
                        onClick={() => handleViewRecords(period)}
                      >
                        View
                      </Button>
                      {period.status === 'draft' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleProcessPayroll(period)}
                        >
                          Process
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="mt-6">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-text-primary">Recent Activity</h3>
          <p className="text-sm text-text-secondary">
            Latest payroll processing activities and updates
          </p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-text-primary">
                  Payroll for February 2025 completed successfully
                </p>
                <p className="text-xs text-text-secondary">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-text-primary">
                  New employee added to payroll system
                </p>
                <p className="text-xs text-text-secondary">1 day ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <DollarSign className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-text-primary">
                  Deduction type updated: Health Insurance
                </p>
                <p className="text-xs text-text-secondary">3 days ago</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Create Payroll Period Modal */}
      <Modal
        isOpen={isCreatePeriodModalOpen}
        onClose={() => setIsCreatePeriodModalOpen(false)}
        title="Create Payroll Period"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Create a new payroll period for processing employee compensation.
          </p>
          {/* TODO: Implement PayrollPeriodForm component */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button variant="secondary" onClick={() => setIsCreatePeriodModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary">
              Create Period
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Records Modal */}
      <Modal
        isOpen={isViewRecordsModalOpen}
        onClose={() => setIsViewRecordsModalOpen(false)}
        title="Payroll Records"
        size="xl"
      >
        <div className="space-y-4">
          {selectedPeriod && (
            <div className="mb-4">
              <h4 className="font-medium text-text-primary">{selectedPeriod.periodName}</h4>
              <p className="text-sm text-text-secondary">
                {new Date(selectedPeriod.startDate).toLocaleDateString()} - {new Date(selectedPeriod.endDate).toLocaleDateString()}
              </p>
            </div>
          )}
          {/* TODO: Implement PayrollRecordsTable component */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button variant="secondary" onClick={() => setIsViewRecordsModalOpen(false)}>
              Close
            </Button>
            <Button variant="primary" icon={<Download className="h-4 w-4" />}>
              Export Records
            </Button>
          </div>
        </div>
      </Modal>

      {/* Process Payroll Modal */}
      <Modal
        isOpen={isProcessingModalOpen}
        onClose={() => setIsProcessingModalOpen(false)}
        title="Process Payroll"
        size="lg"
      >
        <div className="space-y-4">
          {selectedPeriod && (
            <div className="mb-4">
              <h4 className="font-medium text-text-primary">{selectedPeriod.periodName}</h4>
              <p className="text-sm text-text-secondary">
                This will calculate payroll for all active employees in this period.
              </p>
            </div>
          )}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Warning:</strong> This action will process payroll for all employees. 
              Make sure all attendance and leave data is accurate before proceeding.
            </p>
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button variant="secondary" onClick={() => setIsProcessingModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary">
              Process Payroll
            </Button>
          </div>
        </div>
      </Modal>
    </PageLayout>
  );
};

export default PayrollManagement;
