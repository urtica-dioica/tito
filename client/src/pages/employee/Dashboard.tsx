                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        import React, { useState, useEffect, useRef } from 'react';
import { User, MapPin, DollarSign, Eye, Download, FileText, Table } from 'lucide-react';
import Card from '../../components/shared/Card';
import Badge from '../../components/shared/Badge';
import Button from '../../components/shared/Button';
import Modal from '../../components/shared/Modal';
import PageLayout from '../../components/layout/PageLayout';
import { useEmployeeDashboard, useLatestPaystub } from '../../hooks/useEmployee';
import { EmployeeService } from '../../services/employeeService';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

// Import types from service
// import type { EmployeeDashboard } from '../../services/employeeService';

const EmployeeDashboard: React.FC = () => {
  const [isPaystubModalOpen, setIsPaystubModalOpen] = useState(false);
  const [selectedPaystub, setSelectedPaystub] = useState<any>(null);
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch dashboard data from API
  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError } = useEmployeeDashboard();
  const { data: latestPaystub, isLoading: paystubLoading } = useLatestPaystub();
  // const { data: paystubsData } = useEmployeePaystubs({ limit: 5 });

  // Handle clicking outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDownloadDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Show loading state
  if (dashboardLoading) {
    return (
      <PageLayout title="Dashboard" subtitle="Loading your dashboard...">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </PageLayout>
    );
  }

  // Show error state
  if (dashboardError) {
    return (
      <PageLayout title="Dashboard" subtitle="Error loading dashboard">
        <Card className="p-6 text-center">
          <p className="text-red-600">Failed to load dashboard data. Please try again later.</p>
        </Card>
      </PageLayout>
    );
  }

  // Show empty state if no data
  if (!dashboardData) {
    return (
      <PageLayout title="Dashboard" subtitle="No data available">
        <Card className="p-6 text-center">
          <p className="text-gray-600">No dashboard data available.</p>
        </Card>
      </PageLayout>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'success';
      case 'absent': return 'error';
      case 'late': return 'warning';
      case 'half_day': return 'warning';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'present': return 'Present';
      case 'absent': return 'Absent';
      case 'late': return 'Late';
      case 'half_day': return 'Half Day';
      default: return status;
    }
  };



  const handleViewPaystub = (paystub: any) => {
    setSelectedPaystub(paystub);
    setIsPaystubModalOpen(true);
  };

  const handleDownloadPDF = async (paystub: any) => {
    try {
      console.log('Downloading PDF for paystub:', paystub);
      
      if (!paystub || !paystub.id) {
        alert('Paystub ID not found. Please try again.');
        return;
      }
      
      const response = await EmployeeService.downloadPaystubPDF(paystub.id);
      
      // Check if response is a valid Blob
      if (!(response instanceof Blob)) {
        console.error('Invalid response type:', typeof response, response);
        alert('Invalid response from server. Please try again.');
        return;
      }
      
      const url = window.URL.createObjectURL(response);
      const link = document.createElement('a');
      link.href = url;
      link.download = `paystub-${paystub.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setShowDownloadDropdown(false);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };

  const handleDownloadExcel = async (paystub: any) => {
    try {
      console.log('Downloading Excel for paystub:', paystub);
      
      if (!paystub || !paystub.id) {
        alert('Paystub ID not found. Please try again.');
        return;
      }
      
      const response = await EmployeeService.downloadPaystubExcel(paystub.id);
      
      // Check if response is a valid Blob
      if (!(response instanceof Blob)) {
        console.error('Invalid response type:', typeof response, response);
        alert('Invalid response from server. Please try again.');
        return;
      }
      
      const url = window.URL.createObjectURL(response);
      const link = document.createElement('a');
      link.href = url;
      link.download = `paystub-${paystub.id}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setShowDownloadDropdown(false);
    } catch (error) {
      console.error('Error downloading Excel:', error);
      alert('Failed to download Excel. Please try again.');
    }
  };

  const formatCurrency = (amount: number | string | null | undefined) => {
    // Convert to number and handle various input types
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
    
    // Check if the conversion resulted in a valid number
    if (isNaN(numericAmount) || numericAmount === null || numericAmount === undefined) {
      return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP'
      }).format(0);
    }
    
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(numericAmount);
  };

  return (
    <PageLayout
      title={`Welcome back, ${dashboardData.employee.name}!`}
      subtitle="Here's your daily overview and quick actions"
    >
      {/* Employee Info Card */}
      <Card className="mb-6">
        <div className="p-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-button-primary rounded-full flex items-center justify-center">
              <span className="text-white text-xl font-bold">
                {dashboardData.employee.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-text-primary">
                {dashboardData.employee.name}
              </h2>
              <p className="text-text-secondary">{dashboardData.employee.position}</p>
              <p className="text-sm text-text-secondary">{dashboardData.employee.email}</p>
              <div className="flex items-center space-x-4 mt-2 text-sm text-text-secondary">
                <div className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4" />
                  <span>{dashboardData.employee.department}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <User className="h-4 w-4" />
                  <span>{dashboardData.employee.employeeId}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <Badge variant={getStatusColor(dashboardData.attendance.todayStatus)}>
                {getStatusLabel(dashboardData.attendance.todayStatus)}
              </Badge>
              {dashboardData.attendance.clockInTime && (
                <p className="text-sm text-text-secondary mt-1">
                  Clocked in: {new Date(dashboardData.attendance.clockInTime).toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
        </div>
      </Card>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leave Balance */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Leave Balance</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Vacation Leave</span>
                <span className="font-semibold text-text-primary">{dashboardData.leaveBalance.vacation} days</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Sick Leave</span>
                <span className="font-semibold text-text-primary">{dashboardData.leaveBalance.sick} days</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Maternity Leave</span>
                <span className="font-semibold text-text-primary">{dashboardData.leaveBalance.maternity} days</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Other Leave</span>
                <span className="font-semibold text-text-primary">{dashboardData.leaveBalance.other} days</span>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-200">
              <Button variant="primary" className="w-full">
                Request Leave
              </Button>
            </div>
          </div>
        </Card>

        {/* Today's Attendance */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Today's Attendance</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Status</span>
                <Badge variant={getStatusColor(dashboardData.attendance.todayStatus)}>
                  {getStatusLabel(dashboardData.attendance.todayStatus)}
                </Badge>
              </div>

              {/* Morning Session */}
              <div className="p-3 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Morning Session</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Clock In:</span>
                    <span className="font-medium text-blue-900">
                      {(dashboardData.attendance as any).morningClockIn ? 
                        new Date((dashboardData.attendance as any).morningClockIn).toLocaleTimeString() : 
                        'Not clocked in'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Clock Out:</span>
                    <span className="font-medium text-blue-900">
                      {(dashboardData.attendance as any).morningClockOut ? 
                        new Date((dashboardData.attendance as any).morningClockOut).toLocaleTimeString() : 
                        'Not clocked out'
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* Break Time */}
              <div className="p-3 bg-yellow-50 rounded-lg">
                <h4 className="text-sm font-medium text-yellow-900 mb-2">Break Time</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-yellow-700">Break Start:</span>
                    <span className="font-medium text-yellow-900">
                      {(dashboardData.attendance as any).breakStart ? 
                        new Date((dashboardData.attendance as any).breakStart).toLocaleTimeString() : 
                        'No break'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-yellow-700">Break End:</span>
                    <span className="font-medium text-yellow-900">
                      {(dashboardData.attendance as any).breakEnd ? 
                        new Date((dashboardData.attendance as any).breakEnd).toLocaleTimeString() : 
                        'No break'
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* Afternoon Session */}
              <div className="p-3 bg-green-50 rounded-lg">
                <h4 className="text-sm font-medium text-green-900 mb-2">Afternoon Session</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-700">Clock In:</span>
                    <span className="font-medium text-green-900">
                      {(dashboardData.attendance as any).afternoonClockIn ? 
                        new Date((dashboardData.attendance as any).afternoonClockIn).toLocaleTimeString() : 
                        'Not clocked in'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-700">Clock Out:</span>
                    <span className="font-medium text-green-900">
                      {(dashboardData.attendance as any).afternoonClockOut ? 
                        new Date((dashboardData.attendance as any).afternoonClockOut).toLocaleTimeString() : 
                        'Not clocked out'
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* Total Hours */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Total Hours Today</span>
                  <span className="text-lg font-bold text-gray-900">
                    {dashboardData.attendance.totalHours ? 
                      `${dashboardData.attendance.totalHours} hours` : 
                      '0 hours'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Latest Paystub */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary">Latest Paystub</h3>
              {latestPaystub && (
                <Badge variant="success">Available</Badge>
              )}
            </div>
            
            {paystubLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="lg" />
              </div>
            ) : latestPaystub ? (
              <div className="space-y-4">
                {/* Employee Info */}
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-blue-700">Employee ID:</span>
                      <span className="text-sm font-medium text-blue-900">{latestPaystub.employeeId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-blue-700">Name:</span>
                      <span className="text-sm font-medium text-blue-900">{latestPaystub.employeeName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-blue-700">Position:</span>
                      <span className="text-sm font-medium text-blue-900">{latestPaystub.position}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-blue-700">Department:</span>
                      <span className="text-sm font-medium text-blue-900">{latestPaystub.department}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-blue-700">Base Salary:</span>
                      <span className="text-sm font-medium text-blue-900">{formatCurrency(latestPaystub.baseSalary)}</span>
                    </div>
                  </div>
                </div>

                {/* Period and Net Pay */}
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-green-900">{latestPaystub.periodName}</h4>
                      <p className="text-sm text-green-700">
                        {new Date(latestPaystub.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(latestPaystub.netPay)}
                      </p>
                      <p className="text-sm text-green-700">Net Pay (Total Monthly Income)</p>
                    </div>
                  </div>
                </div>
                
                {/* Benefits */}
                <div className="p-4 bg-green-50 rounded-lg">
                  <h5 className="font-medium text-green-900 mb-2">Benefits</h5>
                  <div className="space-y-1">
                    {latestPaystub.benefits && latestPaystub.benefits.length > 0 ? (
                      latestPaystub.benefits.map((benefit: any, index: number) => (
                        <div key={index} className="flex justify-between">
                          <span className="text-sm text-green-700">{benefit.name}:</span>
                          <span className="text-sm font-medium text-green-900">+{formatCurrency(benefit.amount)}</span>
                        </div>
                      ))
                    ) : (
                      <div className="flex justify-between">
                        <span className="text-sm text-green-700">No benefits</span>
                        <span className="text-sm font-medium text-green-900">+{formatCurrency(0)}</span>
                      </div>
                    )}
                    <div className="border-t border-green-200 pt-1 mt-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-green-900">Total Benefits:</span>
                        <span className="text-sm font-bold text-green-900">+{formatCurrency(latestPaystub.totalBenefits)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div className="p-4 bg-red-50 rounded-lg">
                  <h5 className="font-medium text-red-900 mb-2">Deductions</h5>
                  <div className="space-y-1">
                    {latestPaystub.deductions.map((deduction: { name: string; amount: number }, index: number) => (
                      <div key={index} className="flex justify-between">
                        <span className="text-sm text-red-700">{deduction.name}:</span>
                        <span className="text-sm font-medium text-red-900">-{formatCurrency(deduction.amount)}</span>
                      </div>
                    ))}
                    <div className="border-t border-red-200 pt-1 mt-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-red-900">Total Deductions:</span>
                        <span className="text-sm font-bold text-red-900">-{formatCurrency(latestPaystub.totalDeductions)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <Button
                    variant="primary"
                    className="flex-1"
                    onClick={() => handleViewPaystub(latestPaystub)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                  <div className="relative" ref={dropdownRef}>
                    <Button
                      variant="outline"
                      onClick={() => setShowDownloadDropdown(!showDownloadDropdown)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    {showDownloadDropdown && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                        <div className="py-1">
                          <button
                            onClick={() => handleDownloadPDF(latestPaystub)}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Download PDF
                          </button>
                          <button
                            onClick={() => handleDownloadExcel(latestPaystub)}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Table className="h-4 w-4 mr-2" />
                            Download Excel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-text-secondary">No paystub available yet</p>
                <p className="text-sm text-text-secondary mt-1">
                  Your paystub will appear here after payroll processing
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Paystub Details Modal */}
      <Modal
        isOpen={isPaystubModalOpen}
        onClose={() => setIsPaystubModalOpen(false)}
        title="Paystub Details"
        size="lg"
      >
        {selectedPaystub && (
          <div className="space-y-6">
            {/* Employee Information */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-3">Employee Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Employee ID:</span>
                  <span className="ml-2 font-medium text-blue-900">{selectedPaystub.employeeId}</span>
                </div>
                <div>
                  <span className="text-blue-700">Name:</span>
                  <span className="ml-2 font-medium text-blue-900">{selectedPaystub.employeeName}</span>
                </div>
                <div>
                  <span className="text-blue-700">Position:</span>
                  <span className="ml-2 font-medium text-blue-900">{selectedPaystub.position}</span>
                </div>
                <div>
                  <span className="text-blue-700">Department:</span>
                  <span className="ml-2 font-medium text-blue-900">{selectedPaystub.department}</span>
                </div>
                <div>
                  <span className="text-blue-700">Base Salary:</span>
                  <span className="ml-2 font-medium text-blue-900">{formatCurrency(selectedPaystub.baseSalary)}</span>
                </div>
                <div>
                  <span className="text-blue-700">Period:</span>
                  <span className="ml-2 font-medium text-blue-900">{selectedPaystub.periodName}</span>
                </div>
              </div>
            </div>

            {/* Net Pay (Total Monthly Income) */}
            <div className="p-4 bg-green-50 rounded-lg text-center">
              <h4 className="font-medium text-green-900 mb-2">Net Pay (Total Monthly Income)</h4>
              <p className="text-3xl font-bold text-green-600">{formatCurrency(selectedPaystub.netPay)}</p>
              <p className="text-sm text-green-700 mt-1">
                {new Date(selectedPaystub.createdAt).toLocaleDateString()}
              </p>
            </div>

            {/* Benefits */}
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900 mb-3">Benefits</h4>
              <div className="space-y-2">
                {selectedPaystub.benefits && selectedPaystub.benefits.length > 0 ? (
                  selectedPaystub.benefits.map((benefit: any, index: number) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-green-700">{benefit.name}:</span>
                      <span className="font-medium text-green-900">+{formatCurrency(benefit.amount)}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex justify-between">
                    <span className="text-green-700">No benefits</span>
                    <span className="font-medium text-green-900">+{formatCurrency(0)}</span>
                  </div>
                )}
                <div className="border-t border-green-200 pt-2 mt-3">
                  <div className="flex justify-between">
                    <span className="font-medium text-green-900">Total Benefits:</span>
                    <span className="font-bold text-green-900">+{formatCurrency(selectedPaystub.totalBenefits)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div className="p-4 bg-red-50 rounded-lg">
              <h4 className="font-medium text-red-900 mb-3">Deductions</h4>
              <div className="space-y-2">
                {selectedPaystub.deductions.map((deduction: { name: string; amount: number }, index: number) => (
                  <div key={index} className="flex justify-between">
                    <span className="text-red-700">{deduction.name}:</span>
                    <span className="font-medium text-red-900">-{formatCurrency(deduction.amount)}</span>
                  </div>
                ))}
                <div className="border-t border-red-200 pt-2 mt-3">
                  <div className="flex justify-between">
                    <span className="font-medium text-red-900">Total Deductions:</span>
                    <span className="font-bold text-red-900">-{formatCurrency(selectedPaystub.totalDeductions)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setIsPaystubModalOpen(false)}
              >
                Close
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleDownloadPDF(selectedPaystub)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDownloadExcel(selectedPaystub)}
                >
                  <Table className="h-4 w-4 mr-2" />
                  Download Excel
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </PageLayout>
  );
};

export default EmployeeDashboard;
