import React, { useState } from 'react';
import { Calendar, Users, Clock, FileText, CheckCircle, XCircle, Search, Eye, Download } from 'lucide-react';
import Button from '../shared/Button';
import Badge from '../shared/Badge';
import Modal from '../shared/Modal';
import LoadingSpinner from '../shared/LoadingSpinner';
import type { PayrollPeriod, PayrollRecord } from '../../types';

interface PayrollPeriodDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  period: PayrollPeriod | null;
  payrollRecords: PayrollRecord[] | null;
  isLoading: boolean;
  onApprovePayroll?: (periodId: string, comments?: string) => Promise<void>;
  onRejectPayroll?: (periodId: string, reason?: string) => Promise<void>;
}

const PayrollPeriodDetailsModal: React.FC<PayrollPeriodDetailsModalProps> = ({
  isOpen,
  onClose,
  period,
  payrollRecords,
  isLoading,
  onApprovePayroll,
  onRejectPayroll
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null);
  const [isPaystubModalOpen, setIsPaystubModalOpen] = useState(false);
  const [approvalComments, setApprovalComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success">Paid</Badge>;
      case 'processed':
        return <Badge variant="warning">Processed</Badge>;
      case 'draft':
        return <Badge variant="default">Draft</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const filteredRecords = payrollRecords?.filter((record) => 
    record.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleViewPaystub = (record: PayrollRecord) => {
    setSelectedRecord(record);
    setIsPaystubModalOpen(true);
  };

  const handleApprovePayroll = async () => {
    if (onApprovePayroll && period) {
      await onApprovePayroll(period.id, approvalComments);
      setApprovalComments('');
    }
  };

  const handleRejectPayroll = async () => {
    if (onRejectPayroll && period) {
      await onRejectPayroll(period.id, rejectionReason);
      setRejectionReason('');
    }
  };

  if (!period) return null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Payroll Period Details"
        size="xl"
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-text-primary">{period.periodName}</h3>
              <p className="text-text-secondary">
                {new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()}
              </p>
              <div className="flex items-center space-x-2 mt-2">
                {getStatusBadge(period.status)}
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{period.totalEmployees}</p>
              <p className="text-sm text-gray-600">Employees</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{formatCurrency(period.totalAmount)}</p>
              <p className="text-sm text-gray-600">Total Amount</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {payrollRecords?.filter(r => r.status === 'paid').length || 0}
              </p>
              <p className="text-sm text-gray-600">Paid</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {payrollRecords?.filter(r => r.status === 'draft').length || 0}
              </p>
              <p className="text-sm text-gray-600">Pending</p>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center">
                        <LoadingSpinner size="lg" />
                      </td>
                    </tr>
                  ) : filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Employee Records</h3>
                        <p className="text-gray-600">
                          No employee records found for this payroll period.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((record) => (
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
                          {formatCurrency(record.baseSalary || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(record.grossPay || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                          -{formatCurrency(record.totalDeductions || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                          +{formatCurrency(record.totalBenefits || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                          {formatCurrency(record.netPay || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(record.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewPaystub(record)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {record.status === 'paid' && (
                              <Button
                                variant="secondary"
                                size="sm"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Payroll Approval Section */}
            {period.approvalStatus === 'pending' && (
              <div className="mt-6 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="text-lg font-semibold text-yellow-800 mb-4">Payroll Approval Required</h4>
                <p className="text-yellow-700 mb-4">
                  Please review the payroll records above and approve or reject this payroll period for your department.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-yellow-800 mb-2">
                      Comments (Optional)
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-yellow-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      rows={3}
                      placeholder="Add any comments about this payroll approval..."
                      value={approvalComments}
                      onChange={(e) => setApprovalComments(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-yellow-800 mb-2">
                      Rejection Reason (if rejecting)
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-yellow-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      rows={2}
                      placeholder="Provide reason for rejection..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <Button
                      variant="danger"
                      onClick={handleRejectPayroll}
                      disabled={!rejectionReason.trim()}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject Payroll
                    </Button>
                    <Button
                      variant="success"
                      onClick={handleApprovePayroll}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve Payroll
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Approval Status */}
            {period.approvalStatus && period.approvalStatus !== 'pending' && (
              <div className={`mt-6 p-4 rounded-lg ${
                period.approvalStatus === 'approved' 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center space-x-2">
                  {period.approvalStatus === 'approved' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className={`font-medium ${
                    period.approvalStatus === 'approved' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    Payroll {period.approvalStatus === 'approved' ? 'Approved' : 'Rejected'}
                  </span>
                </div>
                {period.approvalComments && (
                  <p className={`mt-2 text-sm ${
                    period.approvalStatus === 'approved' ? 'text-green-700' : 'text-red-700'
                  }`}>
                    Comments: {period.approvalComments}
                  </p>
                )}
                {period.approvedAt && (
                  <p className={`mt-1 text-xs ${
                    period.approvalStatus === 'approved' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {new Date(period.approvedAt).toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Individual Paystub Modal */}
      <Modal
        isOpen={isPaystubModalOpen}
        onClose={() => setIsPaystubModalOpen(false)}
        title="Employee Paystub"
        size="lg"
      >
        {selectedRecord && (
          <div className="space-y-6">
            {/* Employee Info */}
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary">
                  {selectedRecord.employeeName || 'Unknown Employee'}
                </h3>
                <p className="text-text-secondary">
                  {selectedRecord.employeeId || 'N/A'} • {selectedRecord.position || 'N/A'}
                </p>
              </div>
            </div>

            {/* Pay Period */}
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-text-primary">Pay Period</h4>
                <p className="text-text-secondary">
                  {new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Hours Worked */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Regular Hours</p>
                <p className="text-xl font-bold text-blue-600">{selectedRecord.totalRegularHours || 0}</p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg text-center">
                <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Overtime Hours</p>
                <p className="text-xl font-bold text-yellow-600">{selectedRecord.totalOvertimeHours || 0}</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg text-center">
                <Clock className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Late Hours</p>
                <p className="text-xl font-bold text-red-600">{selectedRecord.totalLateHours || 0}</p>
              </div>
            </div>

            {/* Pay Breakdown */}
            <div className="space-y-4">
              <h4 className="font-semibold text-text-primary">Pay Breakdown</h4>
              
              {/* Earnings */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h5 className="font-medium text-green-800 mb-2">Earnings</h5>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-green-700">Base Salary</span>
                    <span className="font-medium text-green-800">{formatCurrency(selectedRecord.baseSalary || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Benefits</span>
                    <span className="font-medium text-green-800">{formatCurrency(selectedRecord.totalBenefits || 0)}</span>
                  </div>
                  <div className="border-t border-green-200 pt-2 flex justify-between">
                    <span className="font-medium text-green-800">Gross Pay</span>
                    <span className="font-bold text-green-800">{formatCurrency(selectedRecord.grossPay || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div className="bg-red-50 p-4 rounded-lg">
                <h5 className="font-medium text-red-800 mb-2">Deductions</h5>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-red-700">Total Deductions</span>
                    <span className="font-medium text-red-800">-{formatCurrency(selectedRecord.totalDeductions || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-700">Late Deductions</span>
                    <span className="font-medium text-red-800">-{formatCurrency(selectedRecord.lateDeductions || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Net Pay */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-blue-800">Net Pay</span>
                  <span className="text-2xl font-bold text-blue-800">{formatCurrency(selectedRecord.netPay || 0)}</span>
                </div>
              </div>
            </div>

            {/* Status and Actions */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Status:</span>
                {getStatusBadge(selectedRecord.status)}
              </div>
              <div className="flex items-center space-x-2">
                {selectedRecord.status === 'paid' && (
                  <Button
                    variant="secondary"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download Paystub
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default PayrollPeriodDetailsModal;
