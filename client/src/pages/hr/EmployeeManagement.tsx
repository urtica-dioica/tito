import React, { useState } from 'react';
import { Plus, Users, UserCheck, Building, DollarSign, Search } from 'lucide-react';
import Button from '../../components/shared/Button';
import Badge from '../../components/shared/Badge';
import Modal from '../../components/shared/Modal';
import Input from '../../components/shared/Input';
import PageLayout from '../../components/layout/PageLayout';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { useEmployees, useEmployeeStats, useCreateEmployee, useUpdateEmployee, useDeleteEmployee, useHardDeleteEmployee } from '../../hooks/useEmployees';
import { useDepartments } from '../../hooks/useDepartments';
import type { CreateEmployeeRequest } from '../../services/employeeService';
import type { Employee } from '../../types';

const EmployeeManagement: React.FC = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isHardDeleteModalOpen, setIsHardDeleteModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  
  // Form state for adding employee
  const [addFormData, setAddFormData] = useState<CreateEmployeeRequest>({
    email: '',
    firstName: '',
    lastName: '',
    departmentId: '',
    position: '',
    employmentType: 'regular',
    hireDate: '',
    baseSalary: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Edit employee form state
  const [editFormData, setEditFormData] = useState({
    departmentId: '',
    position: '',
    employmentType: 'regular' as 'regular' | 'contractual' | 'jo',
    hireDate: '',
    baseSalary: 0,
    status: 'active' as 'active' | 'inactive' | 'terminated' | 'on_leave'
  });
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [editFormError, setEditFormError] = useState<string | null>(null);

  // Filters and pagination
  const [filters, setFilters] = useState({
    search: '',
    status: '' as 'active' | 'inactive' | 'terminated' | 'on_leave' | '',
    departmentId: '',
    page: 1,
    limit: 10
  });

  const { data: employeesData, isLoading, error, refetch } = useEmployees({
    ...filters,
    status: filters.status || undefined
  });
  const { data: stats } = useEmployeeStats();
  const { data: departments } = useDepartments();
  const createEmployeeMutation = useCreateEmployee();
  const updateEmployeeMutation = useUpdateEmployee();
  const deleteEmployeeMutation = useDeleteEmployee();
  const hardDeleteEmployeeMutation = useHardDeleteEmployee();

  const handleAddEmployee = () => {
    setAddFormData({
      email: '',
      firstName: '',
      lastName: '',
      departmentId: '',
      position: '',
      employmentType: 'regular',
      hireDate: '',
      baseSalary: 0
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setEditFormData({
      departmentId: employee.departmentId,
      position: employee.position,
      employmentType: employee.employmentType,
      hireDate: employee.hireDate,
      baseSalary: employee.baseSalary,
      status: employee.status
    });
    setEditFormError(null);
    setIsEditModalOpen(true);
  };

  const handleDeleteEmployee = async (employee: Employee) => {
    if (confirm(`Are you sure you want to delete ${employee.firstName} ${employee.lastName}? This action cannot be undone.`)) {
      try {
        await deleteEmployeeMutation.mutateAsync(employee.id);
        await refetch();
      } catch (error: any) {
        console.error('Error deleting employee:', error);
        alert(error.response?.data?.message || 'Failed to delete employee. Please try again.');
      }
    }
  };

  const handleHardDeleteEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsHardDeleteModalOpen(true);
  };

  const confirmHardDelete = async () => {
    if (!selectedEmployee) return;
    
    try {
      await hardDeleteEmployeeMutation.mutateAsync(selectedEmployee.id);
      await refetch();
      setIsHardDeleteModalOpen(false);
      setSelectedEmployee(null);
      alert('Employee permanently deleted successfully!');
    } catch (error: any) {
      console.error('Error hard deleting employee:', error);
      alert(error.response?.data?.message || 'Failed to permanently delete employee. Please try again.');
    }
  };

  const handleAddFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!addFormData.email || !addFormData.firstName || !addFormData.lastName || !addFormData.departmentId || !addFormData.position || !addFormData.hireDate || addFormData.baseSalary <= 0) {
      setFormError('All fields are required and salary must be greater than 0');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      await createEmployeeMutation.mutateAsync(addFormData);
      
      // Reset form and close modal
      setAddFormData({
        email: '',
        firstName: '',
        lastName: '',
        departmentId: '',
        position: '',
        employmentType: 'regular',
        hireDate: '',
        baseSalary: 0
      });
      setIsAddModalOpen(false);
      
      // Refresh employees list
      await refetch();
      
      // Show success message
      alert('Employee created successfully! An email invitation has been sent for password setup.');
    } catch (error: any) {
      console.error('Error creating employee:', error);
      setFormError(error.response?.data?.message || 'Failed to create employee. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEmployee) return;
    
    if (!editFormData.position || !editFormData.hireDate || editFormData.baseSalary <= 0) {
      setEditFormError('All fields are required and salary must be greater than 0');
      return;
    }

    try {
      setIsEditSubmitting(true);
      setEditFormError(null);

      await updateEmployeeMutation.mutateAsync({
        id: selectedEmployee.id,
        data: editFormData
      });
      
      // Refresh employees list
      await refetch();
      setIsEditModalOpen(false);
    } catch (error: any) {
      console.error('Error updating employee:', error);
      setEditFormError(error.response?.data?.message || 'Failed to update employee. Please try again.');
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      page: 1 // Reset to first page when filtering
    }));
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'terminated': return 'error';
      case 'on_leave': return 'warning';
      default: return 'default';
    }
  };

  const getEmploymentTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'regular': return 'success';
      case 'contractual': return 'warning';
      case 'jo': return 'info';
      default: return 'default';
    }
  };

  if (isLoading) {
    return (
      <PageLayout title="Employee Management" subtitle="Manage employees and their information">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout title="Employee Management" subtitle="Manage employees and their information">
        <div className="text-center py-12">
          <p className="text-red-600">Error loading employees: {error.message}</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Employee Management"
      subtitle="Manage employees and their information"
      actions={
        <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={handleAddEmployee}>
          Add Employee
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Top Row - Employee Overview (Full Width) */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-text-primary">Employee Overview</h3>
            <p className="text-sm text-text-secondary">
              Key metrics and statistics for all employees
            </p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-lg">
                <div className="p-3 bg-blue-100 rounded-lg mb-3">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <p className="text-sm font-medium text-text-secondary mb-1">Total</p>
                <p className="text-2xl font-bold text-text-primary">{stats?.totalEmployees || 0}</p>
              </div>

              <div className="flex flex-col items-center justify-center p-4 bg-green-50 rounded-lg">
                <div className="p-3 bg-green-100 rounded-lg mb-3">
                  <UserCheck className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-sm font-medium text-text-secondary mb-1">Active</p>
                <p className="text-2xl font-bold text-text-primary">{stats?.activeEmployees || 0}</p>
              </div>

              <div className="flex flex-col items-center justify-center p-4 bg-purple-50 rounded-lg">
                <div className="p-3 bg-purple-100 rounded-lg mb-3">
                  <Building className="h-6 w-6 text-purple-600" />
                </div>
                <p className="text-sm font-medium text-text-secondary mb-1">Departments</p>
                <p className="text-2xl font-bold text-text-primary">{stats?.employeesByDepartment?.length || 0}</p>
              </div>

              <div className="flex flex-col items-center justify-center p-4 bg-orange-50 rounded-lg">
                <div className="p-3 bg-orange-100 rounded-lg mb-3">
                  <DollarSign className="h-6 w-6 text-orange-600" />
                </div>
                <p className="text-sm font-medium text-text-secondary mb-1">Avg Salary</p>
                <p className="text-2xl font-bold text-text-primary">
                  ${stats?.averageSalary ? Math.round(stats.averageSalary).toLocaleString() : 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row - Employee Directory with Search & Filters (Full Width) */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-text-primary">Employee Directory</h3>
                <p className="text-sm text-text-secondary">
                  Complete list of all employees with search and filter capabilities
                </p>
              </div>
              
              {/* Search & Filters - Beside the header title */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search employees..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      className="h-10 pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-button-primary focus:border-transparent text-sm w-64"
                    />
                  </div>
                  
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="h-10 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-button-primary focus:border-transparent text-sm w-32"
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="terminated">Terminated</option>
                    <option value="on_leave">On Leave</option>
                  </select>
                  
                  <select
                    value={filters.departmentId}
                    onChange={(e) => handleFilterChange('departmentId', e.target.value)}
                    className="h-10 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-button-primary focus:border-transparent text-sm w-40"
                  >
                    <option value="">All Departments</option>
                    {departments?.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                  
                  <select
                    value={filters.limit}
                    onChange={(e) => handleFilterChange('limit', e.target.value)}
                    className="h-10 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-button-primary focus:border-transparent text-sm w-32"
                  >
                    <option value={10}>10 per page</option>
                    <option value={25}>25 per page</option>
                    <option value={50}>50 per page</option>
                    <option value={100}>100 per page</option>
                  </select>
                </div>
                
                <div className="text-sm text-text-secondary">
                  {employeesData?.total || 0} employees found
                </div>
              </div>
            </div>
          </div>

          {/* Employee List */}
          <div className="p-6">
            <div className="space-y-4 max-h-96 overflow-y-auto">
                {employeesData?.employees?.map((employee) => (
                  <div key={employee.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-button-primary rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {employee.firstName[0]}{employee.lastName[0]}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-text-primary">
                            {employee.firstName} {employee.lastName}
                          </h4>
                          <p className="text-xs text-text-secondary">
                            {employee.employeeId}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <Badge variant={getStatusBadgeVariant(employee.status)}>
                          {employee.status.replace('_', ' ')}
                        </Badge>
                        <Badge variant={getEmploymentTypeBadgeVariant(employee.employmentType)}>
                          {employee.employmentType}
                        </Badge>
                      </div>
                    </div>

                    <div className="text-sm text-text-secondary mb-3">
                      <p>Position: {employee.position}</p>
                      <p>Department: {employee.departmentName}</p>
                      <p>Salary: ${employee.baseSalary.toLocaleString()}</p>
                      <p className="text-xs">Hired: {new Date(employee.hireDate).toLocaleDateString()}</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-text-secondary">
                        ID: {employee.id}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleEditEmployee(employee)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteEmployee(employee)}
                        >
                          Delete
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleHardDeleteEmployee(employee)}
                        >
                          Hard Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              
              {(!employeesData?.employees || employeesData.employees.length === 0) && (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-4">
                    <Users className="h-12 w-12 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-text-primary mb-2">No employees found</h3>
                  <p className="text-sm text-text-secondary">
                    {filters.search || filters.status || filters.departmentId 
                      ? 'Try adjusting your search criteria.' 
                      : 'Get started by adding your first employee.'}
                  </p>
                </div>
              )}
            </div>
            
            {/* Pagination */}
            {employeesData && employeesData.total > 0 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-text-secondary">
                  Showing {((filters.page - 1) * filters.limit) + 1} to {Math.min(filters.page * filters.limit, employeesData.total)} of {employeesData.total} employees
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={filters.page <= 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-text-secondary">
                    Page {filters.page} of {Math.ceil(employeesData.total / filters.limit)}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={filters.page >= Math.ceil(employeesData.total / filters.limit)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Employee Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Employee"
        size="lg"
      >
        <form onSubmit={handleAddFormSubmit} className="space-y-4">
          <p className="text-sm text-text-secondary">
            Create a new employee record. A user account will be created automatically and an email invitation will be sent for password setup.
          </p>
          
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{formError}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                placeholder="Enter first name"
                value={addFormData.firstName}
                onChange={(value) => setAddFormData(prev => ({ ...prev, firstName: value }))}
                required
              />
              <Input
                label="Last Name"
                placeholder="Enter last name"
                value={addFormData.lastName}
                onChange={(value) => setAddFormData(prev => ({ ...prev, lastName: value }))}
                required
              />
            </div>

            <Input
              label="Email"
              type="email"
              placeholder="Enter email address"
              value={addFormData.email}
              onChange={(value) => setAddFormData(prev => ({ ...prev, email: value }))}
              required
            />

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Department
              </label>
              <select
                value={addFormData.departmentId}
                onChange={(e) => setAddFormData(prev => ({ ...prev, departmentId: e.target.value }))}
                className="h-10 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-button-primary focus:border-transparent text-sm w-full"
                required
              >
                <option value="">Select a department</option>
                {departments?.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Position"
              placeholder="Enter position title"
              value={addFormData.position}
              onChange={(value) => setAddFormData(prev => ({ ...prev, position: value }))}
              required
            />

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Employment Type
              </label>
              <select
                value={addFormData.employmentType}
                onChange={(e) => setAddFormData(prev => ({ ...prev, employmentType: e.target.value as any }))}
                className="h-10 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-button-primary focus:border-transparent text-sm w-full"
                required
              >
                <option value="regular">Regular</option>
                <option value="contractual">Contractual</option>
                <option value="jo">Job Order</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Hire Date
              </label>
              <input
                type="date"
                value={addFormData.hireDate}
                onChange={(e) => setAddFormData(prev => ({ ...prev, hireDate: e.target.value }))}
                className="h-10 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-button-primary focus:border-transparent text-sm w-full"
                required
              />
            </div>

            <Input
              label="Base Salary"
              type="number"
              placeholder="Enter base salary"
              value={addFormData.baseSalary.toString()}
              onChange={(value) => setAddFormData(prev => ({ ...prev, baseSalary: parseFloat(value) || 0 }))}
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button 
              type="button"
              variant="secondary" 
              onClick={() => setIsAddModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              variant="primary"
              disabled={isSubmitting || !addFormData.email || !addFormData.firstName || !addFormData.lastName || !addFormData.departmentId || !addFormData.position || !addFormData.hireDate || addFormData.baseSalary <= 0}
            >
              {isSubmitting ? 'Creating...' : 'Add Employee'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Employee Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Employee"
        size="lg"
      >
        <form onSubmit={handleEditFormSubmit} className="space-y-4">
          {selectedEmployee && (
            <p className="text-sm text-text-secondary">
              Editing: {selectedEmployee.firstName} {selectedEmployee.lastName}
            </p>
          )}
          
          {editFormError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{editFormError}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Department
              </label>
              <select
                value={editFormData.departmentId}
                onChange={(e) => setEditFormData(prev => ({ ...prev, departmentId: e.target.value }))}
                className="h-10 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-button-primary focus:border-transparent text-sm w-full"
                required
              >
                <option value="">Select a department</option>
                {departments?.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Position"
              placeholder="Enter position title"
              value={editFormData.position}
              onChange={(value) => setEditFormData(prev => ({ ...prev, position: value }))}
              required
            />

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Employment Type
              </label>
              <select
                value={editFormData.employmentType}
                onChange={(e) => setEditFormData(prev => ({ ...prev, employmentType: e.target.value as any }))}
                className="h-10 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-button-primary focus:border-transparent text-sm w-full"
                required
              >
                <option value="regular">Regular</option>
                <option value="contractual">Contractual</option>
                <option value="jo">Job Order</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Hire Date
              </label>
              <input
                type="date"
                value={editFormData.hireDate}
                onChange={(e) => setEditFormData(prev => ({ ...prev, hireDate: e.target.value }))}
                className="h-10 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-button-primary focus:border-transparent text-sm w-full"
                required
              />
            </div>

            <Input
              label="Base Salary"
              type="number"
              placeholder="Enter base salary"
              value={editFormData.baseSalary.toString()}
              onChange={(value) => setEditFormData(prev => ({ ...prev, baseSalary: parseFloat(value) || 0 }))}
              required
            />

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Status
              </label>
              <select
                value={editFormData.status}
                onChange={(e) => setEditFormData(prev => ({ ...prev, status: e.target.value as any }))}
                className="h-10 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-button-primary focus:border-transparent text-sm w-full"
                required
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="terminated">Terminated</option>
                <option value="on_leave">On Leave</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button 
              type="button"
              variant="secondary" 
              onClick={() => setIsEditModalOpen(false)}
              disabled={isEditSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              variant="primary"
              disabled={isEditSubmitting || !editFormData.position || !editFormData.hireDate || editFormData.baseSalary <= 0}
            >
              {isEditSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Hard Delete Warning Modal */}
      <Modal
        isOpen={isHardDeleteModalOpen}
        onClose={() => setIsHardDeleteModalOpen(false)}
        title="⚠️ Permanent Employee Deletion"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 font-bold text-lg">!</span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-800 mb-2">
                  This action cannot be undone!
                </h3>
                <p className="text-sm text-red-700">
                  You are about to permanently delete <strong>{selectedEmployee?.firstName} {selectedEmployee?.lastName}</strong> and all associated data from the system.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-2">What will be permanently deleted:</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Employee record and personal information</li>
              <li>• User account and login credentials</li>
              <li>• All attendance records</li>
              <li>• All payroll records</li>
              <li>• All request history</li>
              <li>• All performance data</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">Alternative options:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Use regular "Delete" for soft deletion (can be restored)</li>
              <li>• Change employee status to "Terminated" instead</li>
              <li>• Contact system administrator for assistance</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button 
              type="button"
              variant="secondary" 
              onClick={() => setIsHardDeleteModalOpen(false)}
              disabled={hardDeleteEmployeeMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              type="button"
              variant="danger"
              onClick={confirmHardDelete}
              disabled={hardDeleteEmployeeMutation.isPending}
            >
              {hardDeleteEmployeeMutation.isPending ? 'Deleting...' : 'Permanently Delete Employee'}
            </Button>
          </div>
        </div>
      </Modal>
    </PageLayout>
  );
};

export default EmployeeManagement;