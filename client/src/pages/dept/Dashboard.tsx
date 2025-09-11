import React from 'react';
import { Users, DollarSign, FileText, Clock, TrendingUp, Calendar, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/shared/Button';
import PageLayout from '../../components/layout/PageLayout';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { 
  useDepartmentHeadDashboard
} from '../../hooks/useDepartmentHead';

const DepartmentHeadDashboard: React.FC = () => {
  const navigate = useNavigate();
  
  // Fetch dashboard data from API
  const { data: dashboard, isLoading, error } = useDepartmentHeadDashboard();

  const handleViewEmployees = () => {
    navigate('/dept/employees');
  };

  const handleViewRequests = () => {
    navigate('/dept/requests');
  };

  const handleViewPayrolls = () => {
    navigate('/dept/payrolls');
  };

  const handleViewAttendance = () => {
    // TODO: Navigate to attendance page when implemented
    console.log('View attendance clicked');
  };

  // Loading state
  if (isLoading) {
    return (
      <PageLayout title="Department Dashboard" subtitle="Loading department information...">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </PageLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <PageLayout title="Department Dashboard" subtitle="Error loading dashboard data">
        <div className="text-center py-12">
          <p className="text-red-600">
            Error loading dashboard data: {error.message}
          </p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Department Dashboard"
      subtitle={`Welcome to ${dashboard?.department?.name || 'Department'} management`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Quick Actions */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-full flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-text-primary">Quick Actions</h3>
            <p className="text-sm text-text-secondary">
              Access frequently used department management functions
            </p>
          </div>
          <div className="flex-1 p-6">
            <div className="grid grid-cols-2 gap-3 h-full">
              <Button 
                variant="secondary" 
                onClick={handleViewEmployees}
                className="h-full flex-col justify-center text-sm"
              >
                <Users className="h-6 w-6 mb-2" />
                Employee Management
              </Button>
              
              <Button 
                variant="secondary" 
                onClick={handleViewRequests}
                className="h-full flex-col justify-center text-sm"
              >
                <FileText className="h-6 w-6 mb-2" />
                Request Management
              </Button>
              
              <Button 
                variant="secondary" 
                onClick={handleViewAttendance}
                className="h-full flex-col justify-center text-sm"
              >
                <Clock className="h-6 w-6 mb-2" />
                Attendance Tracking
              </Button>
              
              <Button 
                variant="secondary" 
                onClick={handleViewPayrolls}
                className="h-full flex-col justify-center text-sm"
              >
                <DollarSign className="h-6 w-6 mb-2" />
                Payroll Reports
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column - Recent Activity */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-full flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-text-primary">Recent Activity</h3>
            <p className="text-sm text-text-secondary">
              Latest updates and activities in your department
            </p>
          </div>
          <div className="flex-1 p-6 overflow-y-auto">
            {dashboard?.recentActivity && dashboard.recentActivity.length > 0 ? (
              <div className="space-y-3">
                {dashboard.recentActivity.map((activity, index) => {
                  const getActivityIcon = () => {
                    switch (activity.type) {
                      case 'time_correction':
                        return <Clock className="h-4 w-4 text-blue-600" />;
                      case 'overtime':
                        return <TrendingUp className="h-4 w-4 text-green-600" />;
                      case 'leave':
                        return <Calendar className="h-4 w-4 text-purple-600" />;
                      default:
                        return <FileText className="h-4 w-4 text-gray-600" />;
                    }
                  };

                  const getStatusIcon = () => {
                    switch (activity.status) {
                      case 'pending':
                        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
                      case 'approved':
                        return <CheckCircle className="h-4 w-4 text-green-500" />;
                      case 'rejected':
                        return <XCircle className="h-4 w-4 text-red-500" />;
                      default:
                        return <AlertCircle className="h-4 w-4 text-gray-500" />;
                    }
                  };

                  const getActivityTypeLabel = () => {
                    switch (activity.type) {
                      case 'time_correction':
                        return 'Time Correction';
                      case 'overtime':
                        return 'Overtime Request';
                      case 'leave':
                        return 'Leave Request';
                      default:
                        return 'Request';
                    }
                  };

                  return (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0 mt-1">
                        {getActivityIcon()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-text-primary">
                            {getActivityTypeLabel()}
                          </p>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon()}
                            <span className="text-xs text-text-secondary capitalize">
                              {activity.status}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-text-secondary">
                          {activity.employeeName}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {new Date(activity.date).toLocaleDateString()} at {new Date(activity.date).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <FileText className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-sm text-text-secondary">
                  No recent activity found
                </p>
                <p className="text-xs text-text-secondary mt-1">
                  Activity will appear here as employees submit requests
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default DepartmentHeadDashboard;