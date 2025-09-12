import React, { useState } from 'react';
import { History, Calendar, Users, DollarSign, Eye, Download, Search, Filter, Building2, FileText } from 'lucide-react';
import Button from '../../shared/Button';
import Card from '../../shared/Card';
import Badge from '../../shared/Badge';
import Modal from '../../shared/Modal';
import LoadingSpinner from '../../shared/LoadingSpinner';
import { usePayrollPeriods, usePayrollRecords } from '../../../hooks/usePayroll';
import { PayrollService } from '../../../services/payrollService';
import type { PayrollPeriod, PayrollRecord } from '../../../types';

interface PayrollHistoryManagementProps {
  className?: string;
}

const PayrollHistoryManagement: React.FC<PayrollHistoryManagementProps> = ({ className }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<PayrollPeriod | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Fetch data
  const { data: periodsData, isLoading: periodsLoading, error: periodsError } = usePayrollPeriods({
    page: 1,
    limit: 100
  });
  // Fetch payroll records for the selected period
  const { data: recordsData, isLoading: recordsLoading } = usePayrollRecords({
    page: 1,
    limit: 1000,
    payrollPeriodId: selectedPeriod?.id
  });

  const periods = periodsData?.periods || [];
  const records = recordsData?.records || [];

  // Group records by department for the selected period
  const recordsByDepartment = records.reduce((acc, record) => {
    const departmentName = record.departmentName || 'Unknown Department';
    
    if (!acc[departmentName]) {
      acc[departmentName] = [];
    }
    acc[departmentName].push(record);
    return acc;
  }, {} as Record<string, PayrollRecord[]>);

  // Filter periods by year and status
  const filteredPeriods = periods.filter(period => {
    const periodYear = new Date(period.startDate).getFullYear().toString();
    const matchesYear = !selectedYear || periodYear === selectedYear;
    const matchesStatus = !selectedStatus || period.status === selectedStatus;
    const matchesSearch = !searchTerm || period.periodName.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesYear && matchesStatus && matchesSearch;
  });

  // Get unique years from periods
  const availableYears = Array.from(new Set(periods.map(period => new Date(period.startDate).getFullYear()))).sort((a, b) => b - a);

  const handleViewPeriod = (period: PayrollPeriod) => {
    setSelectedPeriod(period);
    setIsViewModalOpen(true);
  };

  const handleExportPeriod = async (period: PayrollPeriod) => {
    try {
      console.log(`Exporting period: ${period.periodName}`);
      
      const response = await PayrollService.exportPeriodPaystubsPDF(period.id);
      
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
      link.download = `paystubs-${period.periodName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('PDF export completed successfully');
    } catch (error) {
      console.error('Error exporting period paystubs:', error);
      alert('Failed to export paystubs. Please try again.');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  // Status functions for periods
  const getPeriodStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'processing': return 'warning';
      case 'draft': return 'default';
      default: return 'default';
    }
  };

  const getPeriodStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'processing': return 'Processing';
      case 'draft': return 'Draft';
      default: return status;
    }
  };

  // Status functions for records
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

  if (periodsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (periodsError) {
    return (
      <Card className="p-6 text-center">
        <p className="text-red-600">Error loading payroll history: {periodsError.message}</p>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payroll History</h2>
          <p className="text-gray-600">View and track past payroll periods and records</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Total Periods:</span> {filteredPeriods.length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search by period name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Years</option>
              {availableYears.map((year) => (
                <option key={year} value={year.toString()}>
                  {year}
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
              <option value="completed">Completed</option>
              <option value="processing">Processing</option>
              <option value="draft">Draft</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <Button
              variant="outline"
              size="sm"
              icon={<Filter className="h-4 w-4" />}
              onClick={() => {
                setSearchTerm('');
                setSelectedYear('');
                setSelectedStatus('');
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* History Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Total Periods</h3>
              <p className="text-2xl font-bold text-blue-600">{periods.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <History className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Completed</h3>
              <p className="text-2xl font-bold text-green-600">
                {periods.filter(p => p.status === 'completed').length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">This Year</h3>
              <p className="text-2xl font-bold text-purple-600">
                {periods.filter(p => new Date(p.startDate).getFullYear() === new Date().getFullYear()).length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-orange-500" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Years Tracked</h3>
              <p className="text-2xl font-bold text-orange-600">{availableYears.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Payroll Periods History */}
      <div className="space-y-4">
        {filteredPeriods.length === 0 ? (
          <Card className="p-8 text-center">
            <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Payroll History</h3>
            <p className="text-gray-600">
              No payroll periods found matching your criteria.
            </p>
          </Card>
        ) : (
          filteredPeriods.map((period) => (
            <Card key={period.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{period.periodName}</h3>
                    <p className="text-sm text-gray-600">
                      {new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(period.startDate).getFullYear()} • {period.workingDays} working days
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <Badge variant={getPeriodStatusColor(period.status)}>
                    {getPeriodStatusLabel(period.status)}
                  </Badge>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Eye className="h-4 w-4" />}
                      onClick={() => handleViewPeriod(period)}
                    >
                      View Details
                    </Button>
                    {period.status === 'completed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Download className="h-4 w-4" />}
                        onClick={() => handleExportPeriod(period)}
                      >
                        Export
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
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
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Period Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Period Name:</span>
                  <span className="ml-2 font-medium">{selectedPeriod.periodName}</span>
                </div>
                <div>
                  <span className="text-blue-700">Status:</span>
                  <span className="ml-2">
                    <Badge variant={getPeriodStatusColor(selectedPeriod.status)}>
                      {getPeriodStatusLabel(selectedPeriod.status)}
                    </Badge>
                  </span>
                </div>
                <div>
                  <span className="text-blue-700">Start Date:</span>
                  <span className="ml-2 font-medium">{new Date(selectedPeriod.startDate).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-blue-700">End Date:</span>
                  <span className="ml-2 font-medium">{new Date(selectedPeriod.endDate).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-blue-700">Working Days:</span>
                  <span className="ml-2 font-medium">{selectedPeriod.workingDays}</span>
                </div>
                <div>
                  <span className="text-blue-700">Expected Hours:</span>
                  <span className="ml-2 font-medium">{selectedPeriod.expectedHours}</span>
                </div>
              </div>
            </div>

            {/* Payroll Records by Department */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Payroll Records by Department
              </h4>
              
              {recordsLoading ? (
                <div className="flex justify-center items-center h-32">
                  <LoadingSpinner size="md" />
                </div>
              ) : Object.keys(recordsByDepartment).length === 0 ? (
                <Card className="p-6 text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Payroll Records</h3>
                  <p className="text-gray-600">
                    No payroll records found for this period.
                  </p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {Object.entries(recordsByDepartment).map(([departmentName, departmentRecords]) => (
                    <Card key={departmentName} className="overflow-hidden">
                      <div className="bg-blue-50 px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center space-x-3">
                          <Building2 className="h-5 w-5 text-blue-600" />
                          <h5 className="text-lg font-semibold text-blue-900">{departmentName}</h5>
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
                                  <Badge variant={getRecordStatusColor(record.status)}>
                                    {getRecordStatusLabel(record.status)}
                                  </Badge>
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
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setIsViewModalOpen(false)}
              >
                Close
              </Button>
              {selectedPeriod.status === 'completed' && (
                <Button
                  variant="primary"
                  icon={<Download className="h-4 w-4" />}
                  onClick={() => handleExportPeriod(selectedPeriod)}
                >
                  Export Period Data
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PayrollHistoryManagement;
