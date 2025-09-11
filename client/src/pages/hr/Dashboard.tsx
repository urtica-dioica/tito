// HR Dashboard Page for TITO HR Management System

import React, { useState } from 'react';
import { Users, Building, FileText, DollarSign, Clock, LogIn, LogOut, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '../../components/layout';
import { Button } from '../../components/shared';
import { useEmployeeStats } from '../../hooks/useEmployees';
import { useDepartments } from '../../hooks/useDepartments';
import { useAttendanceStats } from '../../hooks/useAttendance';
import DailyAttendanceTable from '../../components/features/attendance/DailyAttendanceTable';
import AttendanceSessionModal from '../../components/features/attendance/AttendanceSessionModal';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

const HRDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [selectedAttendanceRecordId, setSelectedAttendanceRecordId] = useState<string | null>(null);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  
  const { data: stats, isLoading: statsLoading, error: statsError } = useEmployeeStats();
  const { data: departments, isLoading: departmentsLoading } = useDepartments();
  const { data: attendanceStats, isLoading: attendanceStatsLoading } = useAttendanceStats();

  const handleViewEmployees = () => {
    navigate('/hr/employees');
  };

  const handleViewDepartments = () => {
    navigate('/hr/departments');
  };

  const handleViewRequests = () => {
    navigate('/hr/requests');
  };

  const handleViewPayrolls = () => {
    navigate('/hr/payroll');
  };

  const handleViewLeaveBalances = () => {
    navigate('/hr/leave-balances');
  };

  const handleAttendanceRowClick = (attendanceRecordId: string) => {
    setSelectedAttendanceRecordId(attendanceRecordId);
    setIsSessionModalOpen(true);
  };

  const handleCloseSessionModal = () => {
    setIsSessionModalOpen(false);
    setSelectedAttendanceRecordId(null);
  };

  if (statsLoading || departmentsLoading || attendanceStatsLoading) {
    return (
      <PageLayout title="HR Dashboard" subtitle="Welcome back! Here's what's happening with your HR system today.">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </PageLayout>
    );
  }

  if (statsError) {
    return (
      <PageLayout title="HR Dashboard" subtitle="Welcome back! Here's what's happening with your HR system today.">
        <div className="text-center py-12">
          <p className="text-red-600">Error loading dashboard data: {statsError.message}</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="HR Dashboard"
      subtitle="Welcome back! Here's what's happening with your HR system today."
    >
      <div className="space-y-6">
        {/* Top Row - Quick Actions and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Quick Actions */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-full flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-text-primary">Quick Actions</h3>
              <p className="text-sm text-text-secondary">
                Access frequently used HR management functions
              </p>
            </div>
            <div className="flex-1 p-6">
              <div className="grid grid-cols-2 gap-4 h-full">
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
                  onClick={handleViewDepartments}
                  className="h-full flex-col justify-center text-sm"
                >
                  <Building className="h-6 w-6 mb-2" />
                  Department Management
                </Button>
                
                <Button 
                  variant="secondary" 
                  onClick={handleViewLeaveBalances}
                  className="h-full flex-col justify-center text-sm"
                >
                  <Calendar className="h-6 w-6 mb-2" />
                  Leave Balances
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
                  onClick={handleViewPayrolls}
                  className="h-full flex-col justify-center text-sm"
                >
                  <DollarSign className="h-6 w-6 mb-2" />
                  Payroll Management
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column - Recent Activity */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-full flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-text-primary">Recent Activity</h3>
              <p className="text-sm text-text-secondary">
                Latest updates and activities in the HR system
              </p>
            </div>
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="space-y-4">
                {/* System Stats */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text-primary">
                        Total employees: {stats?.totalEmployees || 0}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {stats?.activeEmployees || 0} active, {stats?.inactiveEmployees || 0} inactive
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Building className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text-primary">
                        Total departments: {departments?.length || 0}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {stats?.employeesByDepartment?.length || 0} departments with employees
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text-primary">
                        Average salary: ${stats?.averageSalary ? Math.round(stats.averageSalary).toLocaleString() : 0}
                      </p>
                      <p className="text-xs text-text-secondary">
                        Based on {stats?.totalEmployees || 0} employees
                      </p>
                    </div>
                  </div>
                </div>

                {/* Attendance Stats */}
                <div className="border-t pt-4">
                  <h4 className="text-md font-medium text-text-primary mb-4 flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Today's Attendance
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <LogIn className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">
                          {attendanceStats?.clockInsToday || 0}
                        </span>
                      </div>
                      <p className="text-xs text-green-600">Clock Ins</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <LogOut className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">
                          {attendanceStats?.clockOutsToday || 0}
                        </span>
                      </div>
                      <p className="text-xs text-blue-600">Clock Outs</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row - Daily Attendance Table (Full Width) */}
        <DailyAttendanceTable 
          limit={10} 
          onRowClick={handleAttendanceRowClick}
        />
      </div>

      {/* Attendance Session Modal */}
      <AttendanceSessionModal
        isOpen={isSessionModalOpen}
        onClose={handleCloseSessionModal}
        attendanceRecordId={selectedAttendanceRecordId || ''}
      />
    </PageLayout>
  );
};

export default HRDashboard;
