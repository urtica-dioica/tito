import React from 'react';
import { Users, DollarSign, FileText, Clock, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/shared/Button';
import PageLayout from '../../components/layout/PageLayout';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { 
  useDepartmentInfo, 
  useDepartmentHeadEmployeeStats, 
  useDepartmentHeadRequestStats 
} from '../../hooks/useDepartmentHead';

const DepartmentHeadDashboard: React.FC = () => {
  const navigate = useNavigate();
  
  // Fetch real data from API
  const { data: department, isLoading: departmentLoading, error: departmentError } = useDepartmentInfo();
  const { data: employeeStats, isLoading: statsLoading, error: statsError } = useDepartmentHeadEmployeeStats();
  const { data: requestStats, isLoading: requestStatsLoading, error: requestStatsError } = useDepartmentHeadRequestStats();

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
  if (departmentLoading || statsLoading || requestStatsLoading) {
    return (
      <PageLayout title="Department Dashboard" subtitle="Loading department information...">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </PageLayout>
    );
  }

  // Error state
  if (departmentError || statsError || requestStatsError) {
    return (
      <PageLayout title="Department Dashboard" subtitle="Error loading dashboard data">
        <div className="text-center py-12">
          <p className="text-red-600">
            Error loading dashboard data: {departmentError?.message || statsError?.message || requestStatsError?.message}
          </p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Department Dashboard"
      subtitle={`Welcome to ${department?.name || 'Department'} management`}
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
          <div className="flex-1 p-6">
            <div className="space-y-4 h-full">
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-primary">
                    Total employees: {employeeStats?.totalEmployees || 0}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {employeeStats?.activeEmployees || 0} active employees
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <FileText className="h-5 w-5 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-primary">
                    Pending requests: {requestStats?.pending || 0}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {requestStats?.total || 0} total requests this month
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-primary">
                    Average salary: ${employeeStats?.averageSalary ? Math.round(employeeStats.averageSalary).toLocaleString() : 0}
                  </p>
                  <p className="text-xs text-text-secondary">
                    Based on {employeeStats?.totalEmployees || 0} employees
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default DepartmentHeadDashboard;