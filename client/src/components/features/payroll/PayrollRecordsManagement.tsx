import React, { useState } from 'react';
import { FileText, Eye, Edit, XCircle, Search, Building2 } from 'lucide-react';
import Button from '../../shared/Button';
import Card from '../../shared/Card';
import Badge from '../../shared/Badge';
import Modal from '../../shared/Modal';
import LoadingSpinner from '../../shared/LoadingSpinner';
import { usePayrollRecords, usePayrollPeriods } from '../../../hooks/usePayroll';
// import { useDepartments } from '../../../hooks/useDepartments';
import type { PayrollRecord } from '../../../types';

interface PayrollRecordsManagementProps {
  className?: string;
}

const PayrollRecordsManagement: React.FC<PayrollRecordsManagementProps> = ({ className }) => {
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');

  // Fetch data
  const { data: recordsData, isLoading, error, refetch } = usePayrollRecords({
    page: 1,
    limit: 100,
    payrollPeriodId: selectedPeriod || undefined,
    status: selectedStatus || undefined
  });
  const { data: periodsData } = usePayrollPeriods({ page: 1, limit: 100 });
  // const { data: departmentsData } = useDepartments();

  const records = recordsData?.records || [];
  const allPeriods = periodsData?.periods || [];
  // Filter out completed periods - they should not be displayed in payroll records
  const periods = allPeriods.filter(p => p.status !== 'completed');
  // const departments = departmentsData?.departments || [];

  // Filter records based on search term, department, and period status
  const filteredRecords = records.filter(record => {
    const matchesSearch = record.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = !selectedDepartment || record.departmentId === selectedDepartment;
    
    // Filter out records from completed periods
    const period = allPeriods.find(p => p.id === record.payrollPeriodId);
    const isNotFromCompletedPeriod = !period || period.status !== 'completed';
    
    return matchesSearch && matchesDepartment && isNotFromCompletedPeriod;
  });

  // Group records by department
  const recordsByDepartment = filteredRecords.reduce((acc, record) => {
    const departmentName = record.departmentName || 'Unknown Department';
    
    if (!acc[departmentName]) {
      acc[departmentName] = [];
    }
    acc[departmentName].push(record);
    return acc;
  }, {} as Record<string, PayrollRecord[]>);

  // Get unique departments from records for filter dropdown
  const availableDepartments = Array.from(
    new Set(records.map(record => record.departmentName).filter(Boolean))
  ).map(name => ({
    id: records.find(r => r.departmentName === name)?.departmentId || '',
    name: name || 'Unknown Department'
  }));

  const handleViewRecord = (record: PayrollRecord) => {
    setSelectedRecord(record);
    setIsViewModalOpen(true);
  };

  const handleEditRecord = (record: PayrollRecord) => {
    setSelectedRecord(record);
    setIsEditModalOpen(true);
  };





  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'success';
      case 'processed': return 'warning';
      case 'draft': return 'default';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'Paid';
      case 'processed': return 'Processed';
      case 'draft': return 'Draft';
      default: return status;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
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
      <Card className="p-6 text-center">
        <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Data</h3>
        <p className="text-gray-600 mb-4">{error instanceof Error ? error.message : 'An error occurred'}</p>
        <Button onClick={() => refetch()}>Try Again</Button>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payroll Records</h2>
          <p className="text-gray-600">View and manage individual employee payroll records</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Total Records:</span> {filteredRecords.length}
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-medium">Departments:</span> {Object.keys(recordsByDepartment).length}
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search by employee name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Departments</option>
              {availableDepartments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Periods</option>
              {periods.map((period) => (
                <option key={period.id} value={period.id}>
                  {period.periodName}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="processed">Processed</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Records by Department */}
      {Object.keys(recordsByDepartment).length === 0 ? (
        <Card className="p-8 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Payroll Records</h3>
          <p className="text-gray-600">
            No payroll records found matching your criteria.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(recordsByDepartment).map(([departmentName, departmentRecords]) => (
            <Card key={departmentName} className="overflow-hidden">
              <div className="bg-blue-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-blue-900">{departmentName}</h3>
                  <Badge variant="default">{departmentRecords.length} employee{departmentRecords.length !== 1 ? 's' : ''}</Badge>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Period
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
                    {departmentRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {record.employeeName || 'Unknown Employee'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {record.employeeId || 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.periodName || 'N/A'}
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
                          <Badge variant={getStatusColor(record.status)}>
                            {getStatusLabel(record.status)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              icon={<Eye className="h-4 w-4" />}
                              onClick={() => handleViewRecord(record)}
                            >
                              View
                            </Button>
                            {record.status === 'draft' && (
                              <Button
                                variant="outline"
                                size="sm"
                                icon={<Edit className="h-4 w-4" />}
                                onClick={() => handleEditRecord(record)}
                              >
                                Edit
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* View Record Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Payroll Record Details"
        size="lg"
      >
        <div className="space-y-6">
          {selectedRecord && (
            <>
              {/* Employee Information */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Employee Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">Name:</span>
                    <span className="ml-2 font-medium">{selectedRecord.employeeName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Employee ID:</span>
                    <span className="ml-2 font-medium">{selectedRecord.employeeId || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Period:</span>
                    <span className="ml-2 font-medium">{selectedRecord.periodName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Status:</span>
                    <span className="ml-2">
                      <Badge variant={getStatusColor(selectedRecord.status)}>
                        {getStatusLabel(selectedRecord.status)}
                      </Badge>
                    </span>
                  </div>
                </div>
              </div>

              {/* Paystub Details - Matching Employee Dashboard Format */}
              <div className="space-y-4">
                {/* Period and Net Pay Summary */}
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-green-900">{selectedRecord.periodName || 'Payroll Period'}</h4>
                      <p className="text-sm text-green-700">
                        {selectedRecord.createdAt ? new Date(selectedRecord.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(selectedRecord.netPay || 0)}
                      </p>
                      <p className="text-sm text-green-700">Net Pay (Total Monthly Income)</p>
                    </div>
                  </div>
                </div>

                {/* Benefits Section */}
                <div className="p-4 bg-green-50 rounded-lg">
                  <h5 className="font-medium text-green-900 mb-2">Benefits</h5>
                  <div className="space-y-1">
                    {selectedRecord.totalBenefits && selectedRecord.totalBenefits > 0 ? (
                      <div className="flex justify-between">
                        <span className="text-sm text-green-700">Benefits:</span>
                        <span className="text-sm font-medium text-green-900">+{formatCurrency(selectedRecord.totalBenefits)}</span>
                      </div>
                    ) : (
                      <p className="text-sm text-green-700">No benefits for this period</p>
                    )}
                    <div className="border-t border-green-200 pt-1 mt-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-green-900">Total Benefits:</span>
                        <span className="text-sm font-bold text-green-900">+{formatCurrency(selectedRecord.totalBenefits || 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Deductions Section */}
                <div className="p-4 bg-red-50 rounded-lg">
                  <h5 className="font-medium text-red-900 mb-2">Deductions</h5>
                  <div className="space-y-1">
                    {selectedRecord.totalDeductions && selectedRecord.totalDeductions > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-red-700">Employee Deductions:</span>
                        <span className="text-sm font-medium text-red-900">-{formatCurrency(selectedRecord.totalDeductions)}</span>
                      </div>
                    )}
                    {selectedRecord.lateDeductions && selectedRecord.lateDeductions > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-red-700">Late Deductions:</span>
                        <span className="text-sm font-medium text-red-900">-{formatCurrency(selectedRecord.lateDeductions)}</span>
                      </div>
                    )}
                        <div className="border-t border-red-200 pt-1 mt-2">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium text-red-900">Total Deductions:</span>
                            <span className="text-sm font-bold text-red-900">-{formatCurrency(Number(selectedRecord.totalDeductions || 0) + Number(selectedRecord.lateDeductions || 0))}</span>
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
                      <span className="text-sm font-medium text-blue-900">{formatCurrency(selectedRecord.baseSalary || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-blue-700">Total Hours Worked:</span>
                      <span className="text-sm font-medium text-blue-900">{selectedRecord.totalWorkedHours || 0} hrs</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-blue-700">Regular Hours:</span>
                      <span className="text-sm font-medium text-blue-900">{selectedRecord.totalRegularHours || 0} hrs</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-blue-700">Overtime Hours:</span>
                      <span className="text-sm font-medium text-blue-900">{selectedRecord.totalOvertimeHours || 0} hrs</span>
                    </div>
                    {(selectedRecord.paidLeaveHours || 0) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-blue-700">Paid Leave Hours:</span>
                        <span className="text-sm font-medium text-blue-900">{selectedRecord.paidLeaveHours || 0} hrs</span>
                      </div>
                    )}
                    {(selectedRecord.paidLeaveHours || 0) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-blue-700">Leave Pay:</span>
                        <span className="text-sm font-medium text-blue-900">
                          {formatCurrency(((selectedRecord.paidLeaveHours || 0) * (selectedRecord.hourlyRate || 0)))}
                        </span>
                      </div>
                    )}
                    <div className="border-t border-blue-200 pt-2 mt-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-blue-900">Gross Pay:</span>
                        <span className="text-sm font-bold text-blue-900">{formatCurrency(selectedRecord.grossPay || 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setIsViewModalOpen(false)}
                >
                  Close
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setIsViewModalOpen(false);
                    handleEditRecord(selectedRecord);
                  }}
                >
                  Edit Record
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Edit Record Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Payroll Record"
        size="lg"
      >
        <div className="space-y-4">
          {selectedRecord && (
            <>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-yellow-900 mb-2">Edit Payroll Record</h4>
                <p className="text-yellow-800 text-sm">
                  You can adjust the payroll record values. Changes will be logged for audit purposes.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Base Salary</label>
                  <input
                    type="number"
                    defaultValue={selectedRecord.baseSalary || 0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Deductions</label>
                  <input
                    type="number"
                    defaultValue={selectedRecord.totalDeductions || 0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Benefits</label>
                  <input
                    type="number"
                    defaultValue={selectedRecord.totalBenefits || 0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    defaultValue={selectedRecord.status}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="draft">Draft</option>
                    <option value="processed">Processed</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    // Handle save logic
                    setIsEditModalOpen(false);
                  }}
                >
                  Save Changes
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default PayrollRecordsManagement;

