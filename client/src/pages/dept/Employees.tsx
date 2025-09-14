import React, { useState } from 'react';
import { Users, Search, Eye, UserCheck, DollarSign, TrendingUp } from 'lucide-react';
import Button from '../../components/shared/Button';
import Badge from '../../components/shared/Badge';
import Modal from '../../components/shared/Modal';
import PageLayout from '../../components/layout/PageLayout';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { 
  useDepartmentHeadEmployees, 
  useDepartmentHeadEmployeeStats, 
  useDepartmentHeadEmployeePerformance,
  useDepartmentInfo
} from '../../hooks/useDepartmentHead';
import type { DepartmentEmployee } from '../../types';

const DepartmentEmployees: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<DepartmentEmployee | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Fetch real data from API
  const { data: employeesData, isLoading: employeesLoading, error: employeesError } = useDepartmentHeadEmployees({
    search: searchTerm || undefined,
    page: 1,
    limit: 50
  });
  const { data: stats, isLoading: statsLoading, error: statsError } = useDepartmentHeadEmployeeStats();
  const { data: performanceStats, isLoading: performanceLoading, error: performanceError } = useDepartmentHeadEmployeePerformance();
  const { data: departmentInfo } = useDepartmentInfo();

  const employees = employeesData?.employees || [];
  const filteredEmployees = employees; // Already filtered by API

  const handleViewEmployee = (employee: DepartmentEmployee) => {
    setSelectedEmployee(employee);
    setIsViewModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'inactive':
        return <Badge variant="warning">Inactive</Badge>;
      case 'terminated':
        return <Badge variant="error">Terminated</Badge>;
      case 'on_leave':
        return <Badge variant="warning">On Leave</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getEmploymentTypeBadge = (type: string) => {
    switch (type) {
      case 'regular':
        return <Badge variant="info">Regular</Badge>;
      case 'contractual':
        return <Badge variant="warning">Contractual</Badge>;
      case 'jo':
        return <Badge variant="default">Job Order</Badge>;
      default:
        return <Badge variant="default">{type}</Badge>;
    }
  };

  const getPerformanceBadge = (score: number) => {
    if (score >= 90) return <Badge variant="success">Excellent</Badge>;
    if (score >= 80) return <Badge variant="info">Good</Badge>;
    if (score >= 70) return <Badge variant="warning">Fair</Badge>;
    return <Badge variant="error">Poor</Badge>;
  };

  // Loading state
  if (employeesLoading || statsLoading || performanceLoading) {
    return (
      <PageLayout title="Department Employees" subtitle="Loading employee information...">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </PageLayout>
    );
  }

  // Error state
  if (employeesError || statsError || performanceError) {
    return (
      <PageLayout title="Department Employees" subtitle="Error loading employee data">
        <div className="text-center py-12">
          <p className="text-red-600">
            Error loading employee data: {employeesError?.message || statsError?.message || performanceError?.message}
          </p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Department Employees"
      subtitle="Manage and view your department employees"
    >
      <div className="space-y-6 transition-all duration-300 ease-in-out">
        {/* Top Row - Employee Overview (1/4) and Employee Directory (3/4) */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 transition-all duration-300 ease-in-out">
          {/* Left Column - Employee Overview (1/4) */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-96 flex flex-col transition-all duration-300 ease-in-out">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-text-primary">Employee Overview</h3>
              <p className="text-sm text-text-secondary">
                Key metrics and statistics
              </p>
            </div>
            <div className="flex-1 p-4">
              <div className="grid grid-cols-2 gap-3 h-full">
                <div className="flex flex-col items-center justify-center p-3 bg-blue-50 rounded-lg">
                  <div className="p-2 bg-blue-100 rounded-lg mb-2">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="text-xs font-medium text-text-secondary mb-1">Total</p>
                  <p className="text-xl font-bold text-text-primary">{stats?.totalEmployees || 0}</p>
                </div>

                <div className="flex flex-col items-center justify-center p-3 bg-green-50 rounded-lg">
                  <div className="p-2 bg-green-100 rounded-lg mb-2">
                    <UserCheck className="h-5 w-5 text-green-600" />
                  </div>
                  <p className="text-xs font-medium text-text-secondary mb-1">Active</p>
                  <p className="text-xl font-bold text-text-primary">{stats?.activeEmployees || 0}</p>
                </div>

                <div className="flex flex-col items-center justify-center p-3 bg-orange-50 rounded-lg">
                  <div className="p-2 bg-orange-100 rounded-lg mb-2">
                    <DollarSign className="h-5 w-5 text-orange-600" />
                  </div>
                  <p className="text-xs font-medium text-text-secondary mb-1">Avg Salary</p>
                  <p className="text-xl font-bold text-text-primary">
                    ₱{stats?.averageSalary ? Math.round(stats.averageSalary).toLocaleString() : 0}
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center p-3 bg-purple-50 rounded-lg">
                  <div className="p-2 bg-purple-100 rounded-lg mb-2">
                    <Users className="h-5 w-5 text-purple-600" />
                  </div>
                  <p className="text-xs font-medium text-text-secondary mb-1">Inactive</p>
                  <p className="text-xl font-bold text-text-primary">{stats?.inactiveEmployees || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Employee Directory (3/4) */}
          <div className="lg:col-span-3 bg-white rounded-lg border border-gray-200 shadow-sm h-96 flex flex-col transition-all duration-300 ease-in-out">
            <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-text-primary">Employee Directory</h3>
                <p className="text-sm text-text-secondary">
                  Complete list of your department employees with search capabilities
                </p>
              </div>
              
              {/* Search - Beside the header title */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search employees..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-10 pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-button-primary focus:border-transparent text-sm w-64"
                    />
                  </div>
                </div>
                
                <div className="text-sm text-text-secondary">
                  {filteredEmployees.length} employees found
                </div>
              </div>
            </div>
          </div>

          {/* Employee List */}
          <div className="flex-1 p-6 overflow-hidden">
            <div className="space-y-4 h-full overflow-y-auto">
              {filteredEmployees.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-text-secondary">No employees found</p>
                </div>
              ) : (
                filteredEmployees.map((employee) => (
                  <div key={employee.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-button-primary rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-lg">
                            {employee.user.firstName[0]}{employee.user.lastName[0]}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-text-primary">
                            {employee.user.firstName} {employee.user.lastName}
                          </h4>
                          <p className="text-sm text-text-secondary">{employee.position}</p>
                          <p className="text-xs text-text-secondary">{employee.user.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <p className="text-sm font-medium text-text-primary">
                            {employee.position}
                          </p>
                          <p className="text-xs text-text-secondary">
                            {employee.employeeId}
                          </p>
                        </div>
                        {getStatusBadge(employee.status)}
                        {getEmploymentTypeBadge(employee.employmentType)}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleViewEmployee(employee)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          </div>
        </div>

        {/* Bottom Row - Employee Performance Statistics */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-[32rem] flex flex-col transition-all duration-300 ease-in-out">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-text-primary">Employee Performance Statistics</h3>
            <p className="text-sm text-text-secondary">
              Attendance and punctuality metrics for your department employees
            </p>
          </div>
          <div className="flex-1 p-6 overflow-hidden">
            <div className="space-y-4 h-full overflow-y-auto">
              {performanceStats && performanceStats.length > 0 ? (
                performanceStats.map((performance) => (
                  <div key={performance.employeeId} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-button-primary rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-lg">
                            {performance.employeeName.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-text-primary">{performance.employeeName}</h4>
                          <p className="text-sm text-text-secondary">{performance.position}</p>
                          <p className="text-xs text-text-secondary">
                            Avg Clock-in: {performance.averageClockInTime}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <p className="text-sm font-medium text-text-primary">{performance.attendanceRate}%</p>
                          <p className="text-xs text-text-secondary">Attendance</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-text-primary">{performance.punctualityScore}%</p>
                          <p className="text-xs text-text-secondary">Punctuality</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-text-primary">{performance.totalDaysLate}</p>
                          <p className="text-xs text-text-secondary">Days Late</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-text-primary">{performance.totalDaysAbsent}</p>
                          <p className="text-xs text-text-secondary">Days Absent</p>
                        </div>
                        {getPerformanceBadge(performance.punctualityScore)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-text-secondary">No performance data available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Employee Details Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Employee Details"
      >
        {selectedEmployee && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-button-primary rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-xl">
                  {selectedEmployee.user.firstName[0]}{selectedEmployee.user.lastName[0]}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-text-primary">
                  {selectedEmployee.user.firstName} {selectedEmployee.user.lastName}
                </h3>
                <p className="text-text-secondary">{selectedEmployee.position}</p>
                <div className="flex items-center space-x-2 mt-2">
                  {getStatusBadge(selectedEmployee.status)}
                  {getEmploymentTypeBadge(selectedEmployee.employmentType)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Employee ID
                </label>
                <p className="text-text-primary">{selectedEmployee.employeeId}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Email
                </label>
                <p className="text-text-primary">{selectedEmployee.user.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Department
                </label>
                <p className="text-text-primary">{departmentInfo?.name || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Employment Type
                </label>
                <p className="text-text-primary capitalize">{selectedEmployee.employmentType}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Hire Date
                </label>
                <p className="text-text-primary">
                  {new Date(selectedEmployee.hireDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Base Salary
                </label>
                <p className="text-text-primary">₱{selectedEmployee.baseSalary?.toLocaleString() || 'N/A'}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </PageLayout>
  );
};

export default DepartmentEmployees;