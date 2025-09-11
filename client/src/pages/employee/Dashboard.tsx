                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        import React, { useState } from 'react';
import { Clock, Calendar, FileText, TrendingUp, User, MapPin, DollarSign, Eye, Download } from 'lucide-react';
import Card from '../../components/shared/Card';
import Badge from '../../components/shared/Badge';
import Button from '../../components/shared/Button';
import Modal from '../../components/shared/Modal';
import PageLayout from '../../components/layout/PageLayout';
import { useEmployeeDashboard, useClockIn, useClockOut, useLatestPaystub } from '../../hooks/useEmployee';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

// Import types from service
// import type { EmployeeDashboard } from '../../services/employeeService';

const EmployeeDashboard: React.FC = () => {
  const [isPaystubModalOpen, setIsPaystubModalOpen] = useState(false);
  const [selectedPaystub, setSelectedPaystub] = useState<any>(null);

  // Fetch dashboard data from API
  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError } = useEmployeeDashboard();
  const { data: latestPaystub, isLoading: paystubLoading } = useLatestPaystub();
  // const { data: paystubsData } = useEmployeePaystubs({ limit: 5 });
  const clockInMutation = useClockIn();
  const clockOutMutation = useClockOut();

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

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'clock_in':
      case 'clock_out':
        return <Clock className="h-4 w-4" />;
      case 'request_submitted':
      case 'request_approved':
      case 'request_rejected':
        return <FileText className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getActivityColor = (status?: string) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-text-secondary';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'holiday': return <Calendar className="h-4 w-4" />;
      case 'meeting': return <User className="h-4 w-4" />;
      case 'deadline': return <TrendingUp className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const handleClockIn = () => {
    clockInMutation.mutate({}, {
      onSuccess: () => {
        // Refresh dashboard data after successful clock in
        window.location.reload(); // Simple refresh for now
      },
      onError: (error) => {
        console.error('Clock in failed:', error);
        alert('Failed to clock in. Please try again.');
      }
    });
  };

  const handleClockOut = () => {
    clockOutMutation.mutate({}, {
      onSuccess: () => {
        // Refresh dashboard data after successful clock out
        window.location.reload(); // Simple refresh for now
      },
      onError: (error) => {
        console.error('Clock out failed:', error);
        alert('Failed to clock out. Please try again.');
      }
    });
  };

  const handleViewPaystub = (paystub: any) => {
    setSelectedPaystub(paystub);
    setIsPaystubModalOpen(true);
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

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Clock className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-text-secondary">Present Days</p>
              <p className="text-2xl font-bold text-text-primary">
                {dashboardData.attendance.monthlyPresent}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <Calendar className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-text-secondary">Absent Days</p>
              <p className="text-2xl font-bold text-text-primary">
                {dashboardData.attendance.monthlyAbsent}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-text-secondary">Late Days</p>
              <p className="text-2xl font-bold text-text-primary">
                {dashboardData.attendance.monthlyLate}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-text-secondary">Pending Requests</p>
              <p className="text-2xl font-bold text-text-primary">
                {dashboardData.pendingRequests}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        {/* Recent Activity */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {dashboardData.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className={`p-1 rounded-full ${getActivityColor(activity.status)}`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary">{activity.description}</p>
                    <p className="text-xs text-text-secondary">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-200">
              <Button variant="secondary" className="w-full">
                View All Activity
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
              {dashboardData.attendance.clockInTime && (
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Clock In</span>
                  <span className="font-semibold text-text-primary">
                    {new Date(dashboardData.attendance.clockInTime).toLocaleTimeString()}
                  </span>
                </div>
              )}
              {dashboardData.attendance.clockOutTime && (
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Clock Out</span>
                  <span className="font-semibold text-text-primary">
                    {new Date(dashboardData.attendance.clockOutTime).toLocaleTimeString()}
                  </span>
                </div>
              )}
              {dashboardData.attendance.totalHours && (
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Total Hours</span>
                  <span className="font-semibold text-text-primary">
                    {dashboardData.attendance.totalHours} hours
                  </span>
                </div>
              )}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-200">
              {dashboardData.attendance.todayStatus === 'present' && !dashboardData.attendance.clockOutTime ? (
                <Button 
                  variant="danger" 
                  className="w-full"
                  onClick={handleClockOut}
                  disabled={clockOutMutation.isPending}
                >
                  {clockOutMutation.isPending ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Clocking Out...
                    </>
                  ) : (
                    'Clock Out'
                  )}
                </Button>
              ) : (
                <Button 
                  variant="primary" 
                  className="w-full"
                  onClick={handleClockIn}
                  disabled={clockInMutation.isPending}
                >
                  {clockInMutation.isPending ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Clocking In...
                    </>
                  ) : (
                    'Clock In'
                  )}
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Upcoming Events</h3>
            <div className="space-y-4">
              {dashboardData.upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center space-x-3">
                  <div className="p-1 text-blue-600">
                    {getEventIcon(event.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary">{event.title}</p>
                    <p className="text-xs text-text-secondary">
                      {new Date(event.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-200">
              <Button variant="secondary" className="w-full">
                View Calendar
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Paystub Section */}
      <div className="mt-8">
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
                      <p className="text-sm text-green-700">Net Pay</p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-text-secondary">Gross Pay</p>
                    <p className="font-semibold text-text-primary">{formatCurrency(latestPaystub.grossPay)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Deductions</p>
                    <p className="font-semibold text-red-600">-{formatCurrency(latestPaystub.totalDeductions)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Benefits</p>
                    <p className="font-semibold text-green-600">+{formatCurrency(latestPaystub.totalBenefits)}</p>
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
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Handle download
                      console.log('Download paystub');
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
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
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-text-primary">{selectedPaystub.periodName}</h3>
                <p className="text-text-secondary">
                  {new Date(selectedPaystub.createdAt).toLocaleDateString()}
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge variant="success">Paid</Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-text-primary">Earnings</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Base Salary:</span>
                    <span className="font-medium">{formatCurrency(selectedPaystub.baseSalary)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Regular Hours:</span>
                    <span className="font-medium">{selectedPaystub.totalRegularHours || 0} hrs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Overtime Hours:</span>
                    <span className="font-medium">{selectedPaystub.totalOvertimeHours || 0} hrs</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium">Gross Pay:</span>
                    <span className="font-bold text-green-600">{formatCurrency(selectedPaystub.grossPay)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-text-primary">Deductions & Benefits</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Total Deductions:</span>
                    <span className="font-medium text-red-600">-{formatCurrency(selectedPaystub.totalDeductions)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Late Deductions:</span>
                    <span className="font-medium text-red-600">-{formatCurrency(selectedPaystub.lateDeductions)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Benefits:</span>
                    <span className="font-medium text-green-600">+{formatCurrency(selectedPaystub.totalBenefits)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium">Net Pay:</span>
                    <span className="font-bold text-green-600">{formatCurrency(selectedPaystub.netPay)}</span>
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
              <Button
                variant="primary"
                onClick={() => {
                  // Handle download
                  console.log('Download paystub');
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </PageLayout>
  );
};

export default EmployeeDashboard;
