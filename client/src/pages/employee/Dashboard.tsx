import React from 'react';
import { Clock, Calendar, FileText, TrendingUp, User, MapPin } from 'lucide-react';
import Card from '../../components/shared/Card';
import Badge from '../../components/shared/Badge';
import Button from '../../components/shared/Button';
import PageLayout from '../../components/layout/PageLayout';

// Mock data types - TODO: Replace with actual types from API
interface EmployeeDashboard {
  employee: {
    id: string;
    name: string;
    employeeId: string;
    department: string;
    position: string;
    hireDate: string;
    profilePicture?: string;
  };
  attendance: {
    todayStatus: 'present' | 'absent' | 'late' | 'half_day';
    clockInTime?: string;
    clockOutTime?: string;
    totalHours?: number;
    monthlyPresent: number;
    monthlyAbsent: number;
    monthlyLate: number;
  };
  leaveBalance: {
    vacation: number;
    sick: number;
    personal: number;
    emergency: number;
  };
  recentActivity: Array<{
    id: string;
    type: 'clock_in' | 'clock_out' | 'request_submitted' | 'request_approved' | 'request_rejected';
    description: string;
    timestamp: string;
    status?: 'success' | 'warning' | 'error';
  }>;
  pendingRequests: number;
  upcomingEvents: Array<{
    id: string;
    title: string;
    date: string;
    type: 'holiday' | 'meeting' | 'deadline';
  }>;
}

const EmployeeDashboard: React.FC = () => {
  // Mock data - TODO: Replace with actual API calls
  const dashboardData: EmployeeDashboard = {
    employee: {
      id: 'EMP-2025-0000001',
      name: 'John Doe',
      employeeId: 'EMP-2025-0000001',
      department: 'Engineering',
      position: 'Software Developer',
      hireDate: '2023-01-15',
    },
    attendance: {
      todayStatus: 'present',
      clockInTime: '2025-01-15T08:30:00Z',
      clockOutTime: undefined,
      totalHours: 7.5,
      monthlyPresent: 18,
      monthlyAbsent: 1,
      monthlyLate: 2,
    },
    leaveBalance: {
      vacation: 12,
      sick: 8,
      personal: 3,
      emergency: 2,
    },
    recentActivity: [
      {
        id: '1',
        type: 'clock_in',
        description: 'Clocked in at 8:30 AM',
        timestamp: '2025-01-15T08:30:00Z',
        status: 'success',
      },
      {
        id: '2',
        type: 'request_submitted',
        description: 'Submitted vacation request for Jan 20-24',
        timestamp: '2025-01-14T16:45:00Z',
        status: 'warning',
      },
      {
        id: '3',
        type: 'clock_out',
        description: 'Clocked out at 5:30 PM',
        timestamp: '2025-01-14T17:30:00Z',
        status: 'success',
      },
    ],
    pendingRequests: 1,
    upcomingEvents: [
      {
        id: '1',
        title: 'Team Meeting',
        date: '2025-01-16T10:00:00Z',
        type: 'meeting',
      },
      {
        id: '2',
        title: 'Project Deadline',
        date: '2025-01-20T17:00:00Z',
        type: 'deadline',
      },
      {
        id: '3',
        title: 'Company Holiday',
        date: '2025-01-25T00:00:00Z',
        type: 'holiday',
      },
    ],
  };

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
                <span className="text-text-secondary">Personal Leave</span>
                <span className="font-semibold text-text-primary">{dashboardData.leaveBalance.personal} days</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Emergency Leave</span>
                <span className="font-semibold text-text-primary">{dashboardData.leaveBalance.emergency} days</span>
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
                <Button variant="danger" className="w-full">
                  Clock Out
                </Button>
              ) : (
                <Button variant="primary" className="w-full">
                  Clock In
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
    </PageLayout>
  );
};

export default EmployeeDashboard;
