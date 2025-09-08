// HR Dashboard Page for TITO HR Management System

import React from 'react';
import { Users, Building, FileText, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '../../components/layout';
import { Button } from '../../components/shared';
import { useEmployeeStats } from '../../hooks/useEmployees';
import { useDepartments } from '../../hooks/useDepartments';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

const HRDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading, error: statsError } = useEmployeeStats();
  const { data: departments, isLoading: departmentsLoading } = useDepartments();

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

  if (statsLoading || departmentsLoading) {
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
                onClick={handleViewDepartments}
                className="h-full flex-col justify-center text-sm"
              >
                <Building className="h-6 w-6 mb-2" />
                Department Management
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
          <div className="flex-1 p-6">
            <div className="space-y-4 h-full">
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
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default HRDashboard;
