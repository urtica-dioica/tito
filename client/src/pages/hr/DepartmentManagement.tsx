import React, { useState } from 'react';
import { Plus, Building, Users, UserCheck, Settings, UserPlus } from 'lucide-react';
import Button from '../../components/shared/Button';
import Badge from '../../components/shared/Badge';
import Modal from '../../components/shared/Modal';
import Input from '../../components/shared/Input';
import PageLayout from '../../components/layout/PageLayout';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { useDepartments } from '../../hooks/useDepartments';
import { useAvailableDepartmentHeads, useDepartmentHeads } from '../../hooks/useUsers';
import { DepartmentService, type CreateDepartmentRequest } from '../../services/departmentService';
import { UserService } from '../../services/userService';
import type { Department, DepartmentHead } from '../../types';

const DepartmentManagement: React.FC = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignHeadModalOpen, setIsAssignHeadModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  
  // Form state for adding department
  const [addFormData, setAddFormData] = useState<CreateDepartmentRequest>({
    name: '',
    description: '',
    departmentHeadId: undefined
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Edit department form state
  const [editFormData, setEditFormData] = useState<CreateDepartmentRequest>({
    name: '',
    description: '',
    departmentHeadId: undefined
  });
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [editFormError, setEditFormError] = useState<string | null>(null);

  // Department heads management state
  const [isAddHeadModalOpen, setIsAddHeadModalOpen] = useState(false);
  const [isEditHeadModalOpen, setIsEditHeadModalOpen] = useState(false);
  const [selectedHead, setSelectedHead] = useState<DepartmentHead | null>(null);
  const [headFormData, setHeadFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    departmentId: ''
  });
  const [isHeadSubmitting, setIsHeadSubmitting] = useState(false);
  const [headFormError, setHeadFormError] = useState<string | null>(null);

  // Edit department head form state
  const [editHeadFormData, setEditHeadFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    departmentId: ''
  });
  const [isEditHeadSubmitting, setIsEditHeadSubmitting] = useState(false);
  const [editHeadFormError, setEditHeadFormError] = useState<string | null>(null);

  const { data: departments, isLoading, error, refetch } = useDepartments();
  const { data: departmentHeads, refetch: refetchDepartmentHeads } = useDepartmentHeads();
  const { data: availableDepartmentHeads } = useAvailableDepartmentHeads();

  const handleAddDepartment = () => {
    setAddFormData({ name: '', description: '', departmentHeadId: undefined });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleEditDepartment = (department: Department) => {
    setSelectedDepartment(department);
    setEditFormData({
      name: department.name,
      description: department.description || '',
      departmentHeadId: department.departmentHeadUserId || undefined
    });
    setEditFormError(null);
    setIsEditModalOpen(true);
  };

  const handleAssignHead = (department: Department) => {
    setSelectedDepartment(department);
    setIsAssignHeadModalOpen(true);
  };

  const handleEditFormChange = (field: keyof CreateDepartmentRequest, value: string) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEditFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDepartment) return;
    
    if (!editFormData.name.trim()) {
      setEditFormError('Department name is required');
      return;
    }

    // Check if department head is already assigned to another department
    if (editFormData.departmentHeadId) {
      const headAlreadyAssigned = departments?.find(dept => 
        dept.departmentHeadUserId === editFormData.departmentHeadId && 
        dept.id !== selectedDepartment.id
      );
      
      if (headAlreadyAssigned) {
        const assignedHead = availableDepartmentHeads?.find(head => head.id === editFormData.departmentHeadId);
        setEditFormError(`${assignedHead?.firstName} ${assignedHead?.lastName} is already assigned to the ${headAlreadyAssigned.name} department.`);
        return;
      }
    }

    try {
      setIsEditSubmitting(true);
      setEditFormError(null);

      await DepartmentService.updateDepartment(selectedDepartment.id, editFormData);
      
      // Refresh departments list
      await refetch();
      setIsEditModalOpen(false);
    } catch (error: any) {
      console.error('Error updating department:', error);
      setEditFormError(error.response?.data?.message || 'Failed to update department. Please try again.');
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleDeleteDepartment = async (department: Department) => {
    if (confirm(`Are you sure you want to delete the ${department.name} department? This action cannot be undone.`)) {
      try {
        await DepartmentService.deleteDepartment(department.id);
        // Refresh departments list
        await refetch();
      } catch (error: any) {
        console.error('Error deleting department:', error);
        alert(error.response?.data?.message || 'Failed to delete department. Please try again.');
      }
    }
  };

  const handleAddFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!addFormData.name.trim()) {
      setFormError('Department name is required');
      return;
    }

    // Check if department head is already assigned to another department
    if (addFormData.departmentHeadId) {
      const headAlreadyAssigned = departments?.find(dept => 
        dept.departmentHeadUserId === addFormData.departmentHeadId
      );
      
      if (headAlreadyAssigned) {
        const assignedHead = availableDepartmentHeads?.find(head => head.id === addFormData.departmentHeadId);
        setFormError(`${assignedHead?.firstName} ${assignedHead?.lastName} is already assigned to the ${headAlreadyAssigned.name} department.`);
        return;
      }
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      await DepartmentService.createDepartment({
        name: addFormData.name.trim(),
        description: addFormData.description?.trim() || undefined,
        departmentHeadId: addFormData.departmentHeadId || undefined
      });
      
      // Reset form and close modal
      setAddFormData({ name: '', description: '', departmentHeadId: undefined });
      setIsAddModalOpen(false);
      
      // Refresh departments list
      await refetch();
    } catch (error: any) {
      console.error('Error creating department:', error);
      setFormError(error.response?.data?.message || 'Failed to create department. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddFormChange = (field: keyof CreateDepartmentRequest, value: string) => {
    setAddFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (formError) {
      setFormError(null);
    }
  };

  // Department heads handlers
  const handleAddDepartmentHead = () => {
    setHeadFormData({ email: '', firstName: '', lastName: '', departmentId: '' });
    setHeadFormError(null);
    setIsAddHeadModalOpen(true);
  };

  const handleEditDepartmentHead = (head: DepartmentHead) => {
    setSelectedHead(head);
    setEditHeadFormData({
      email: head.email,
      firstName: head.firstName,
      lastName: head.lastName,
      departmentId: head.department?.id || ''
    });
    setEditHeadFormError(null);
    setIsEditHeadModalOpen(true);
  };

  const handleDeleteDepartmentHead = async (head: DepartmentHead) => {
    if (confirm(`Are you sure you want to delete ${head.firstName} ${head.lastName}? This action cannot be undone.`)) {
      try {
        await UserService.deleteUser(head.id);
        // Refresh department heads list
        await refetchDepartmentHeads();
        await refetch(); // Also refresh departments in case this head was assigned
      } catch (error: any) {
        console.error('Error deleting department head:', error);
        alert(error.response?.data?.message || 'Failed to delete department head. Please try again.');
      }
    }
  };

  const handleHeadFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!headFormData.email || !headFormData.firstName || !headFormData.lastName || !headFormData.departmentId) {
      setHeadFormError('All fields are required');
      return;
    }

    setIsHeadSubmitting(true);
    setHeadFormError(null);

    try {
      // Create new department head user (sends email invitation)
      await UserService.createDepartmentHead({
        email: headFormData.email,
        firstName: headFormData.firstName,
        lastName: headFormData.lastName,
        departmentId: headFormData.departmentId
      });
      
      // Reset form and close modal
      setHeadFormData({ email: '', firstName: '', lastName: '', departmentId: '' });
      setIsAddHeadModalOpen(false);
      
      // Refresh data
      await refetch();
      await refetchDepartmentHeads();
      
      // Show success message
      alert('Department head created successfully! An email invitation has been sent for password setup.');
    } catch (error: any) {
      console.error('Error creating department head:', error);
      setHeadFormError(error.response?.data?.message || 'Failed to create department head. Please try again.');
    } finally {
      setIsHeadSubmitting(false);
    }
  };

  const handleHeadFormChange = (field: string, value: string) => {
    setHeadFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (headFormError) {
      setHeadFormError(null);
    }
  };

  const handleEditHeadFormChange = (field: string, value: string) => {
    setEditHeadFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (editHeadFormError) {
      setEditHeadFormError(null);
    }
  };

  const handleEditHeadFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedHead) return;
    
    if (!editHeadFormData.email || !editHeadFormData.firstName || !editHeadFormData.lastName) {
      setEditHeadFormError('All fields are required');
      return;
    }

    try {
      setIsEditHeadSubmitting(true);
      setEditHeadFormError(null);

      await UserService.updateUser(selectedHead.id, {
        email: editHeadFormData.email,
        firstName: editHeadFormData.firstName,
        lastName: editHeadFormData.lastName
      });
      
      // Refresh department heads list
      await refetchDepartmentHeads();
      setIsEditHeadModalOpen(false);
    } catch (error: any) {
      console.error('Error updating department head:', error);
      setEditHeadFormError(error.response?.data?.message || 'Failed to update department head. Please try again.');
    } finally {
      setIsEditHeadSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <PageLayout title="Department Management" subtitle="Manage departments and department heads">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout title="Department Management" subtitle="Manage departments and department heads">
        <div className="text-center py-12">
          <p className="text-red-600">Error loading departments: {error.message}</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Department Management"
      subtitle="Manage departments and department heads"
      actions={
        <div className="flex items-center space-x-3">
          <Button variant="secondary" icon={<UserPlus className="h-4 w-4" />} onClick={handleAddDepartmentHead}>
            Add Department Head
          </Button>
          <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={handleAddDepartment}>
            Add Department
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Top Row - Department Overview (Full Width) */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-text-primary">Department Overview</h3>
            <p className="text-sm text-text-secondary">
              Key metrics and statistics for all departments
            </p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-lg">
                <div className="p-3 bg-blue-100 rounded-lg mb-3">
                  <Building className="h-6 w-6 text-blue-600" />
                </div>
                <p className="text-sm font-medium text-text-secondary mb-1">Total</p>
                <p className="text-2xl font-bold text-text-primary">{departments?.length || 0}</p>
              </div>

              <div className="flex flex-col items-center justify-center p-4 bg-green-50 rounded-lg">
                <div className="p-3 bg-green-100 rounded-lg mb-3">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-sm font-medium text-text-secondary mb-1">Employees</p>
                <p className="text-2xl font-bold text-text-primary">
                  {departments?.reduce((sum, dept) => sum + dept.employeeCount, 0) || 0}
                </p>
              </div>

              <div className="flex flex-col items-center justify-center p-4 bg-purple-50 rounded-lg">
                <div className="p-3 bg-purple-100 rounded-lg mb-3">
                  <UserCheck className="h-6 w-6 text-purple-600" />
                </div>
                <p className="text-sm font-medium text-text-secondary mb-1">Heads</p>
                <p className="text-2xl font-bold text-text-primary">
                  {departments?.filter(dept => dept.departmentHeadUserId).length || 0}
                </p>
              </div>

              <div className="flex flex-col items-center justify-center p-4 bg-orange-50 rounded-lg">
                <div className="p-3 bg-orange-100 rounded-lg mb-3">
                  <Settings className="h-6 w-6 text-orange-600" />
                </div>
                <p className="text-sm font-medium text-text-secondary mb-1">Active</p>
                <p className="text-2xl font-bold text-text-primary">
                  {departments?.length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row - Department Directory and Department Heads Directory (50/50) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Department Directory */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-full flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-text-primary">Department Directory</h3>
              <p className="text-sm text-text-secondary">
                Manage departments and their configurations
              </p>
            </div>
            <div className="flex-1 p-6">
              <div className="space-y-4 h-full overflow-y-auto">
                {departments?.map((department) => (
                  <div key={department.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Building className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-text-primary">
                            {department.name}
                          </h4>
                          <p className="text-xs text-text-secondary">
                            {department.employeeCount} employees
                          </p>
                        </div>
                      </div>
                      <Badge variant="success">
                        Active
                      </Badge>
                    </div>

                    {department.description && (
                      <p className="text-sm text-text-secondary mb-3">
                        {department.description}
                      </p>
                    )}

                    <div className="text-sm text-text-secondary mb-3">
                      <p>Head: {department.departmentHead ? `${department.departmentHead.firstName} ${department.departmentHead.lastName}` : 'Not assigned'}</p>
                      <p className="text-xs">Created: {new Date(department.createdAt).toLocaleDateString()}</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-text-secondary">
                        Department ID: {department.id}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleEditDepartment(department)}
                        >
                          Edit
                        </Button>
                        {!department.departmentHeadUserId && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleAssignHead(department)}
                          >
                            Assign Head
                          </Button>
                        )}
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteDepartment(department)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {departments?.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-4">
                    <Building className="h-12 w-12 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-text-primary mb-2">No departments found</h3>
                  <p className="text-sm text-text-secondary">
                    Get started by creating your first department.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Department Heads Directory */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-full flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-text-primary">Department Heads Directory</h3>
              <p className="text-sm text-text-secondary">
                Manage department heads and their assignments
              </p>
            </div>
            <div className="flex-1 p-6">
              <div className="space-y-4 h-full overflow-y-auto">
                {departmentHeads && Array.isArray(departmentHeads) && departmentHeads.map((head) => {
                  // Use department info from the head object or find from departments list
                  const assignedDepartment = head.department || departments?.find(dept => dept.departmentHeadUserId === head.id);
                  
                  return (
                    <div key={head.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-button-primary rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {head.firstName[0]}{head.lastName[0]}
                            </span>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-text-primary">
                              {head.firstName} {head.lastName}
                            </h4>
                            <p className="text-xs text-text-secondary">
                              Department Head
                            </p>
                          </div>
                        </div>
                        <Badge variant={head.status === 'active' ? 'success' : 'default'}>
                          {head.status === 'active' ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>

                      <div className="text-sm text-text-secondary mb-3">
                        <p>Email: {head.email}</p>
                        <p>Department: {assignedDepartment?.name || 'Not assigned'}</p>
                        <p className="text-xs">Created: {new Date(head.createdAt).toLocaleDateString()}</p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-xs text-text-secondary">
                          ID: {head.id}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleEditDepartmentHead(head)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteDepartmentHead(head)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {(!departmentHeads || departmentHeads.length === 0) && (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-4">
                    <UserCheck className="h-12 w-12 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-text-primary mb-2">No department heads found</h3>
                  <p className="text-sm text-text-secondary">
                    Create department heads to manage departments.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Department Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Department"
        size="lg"
      >
        <form onSubmit={handleAddFormSubmit} className="space-y-4">
          <p className="text-sm text-text-secondary">
            Create a new department and optionally assign a department head.
          </p>
          
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{formError}</p>
            </div>
          )}

          <div className="space-y-4">
            <Input
              label="Department Name"
              placeholder="Enter department name"
              value={addFormData.name}
              onChange={(value) => handleAddFormChange('name', value)}
              required
              error={!addFormData.name.trim() && formError ? 'Department name is required' : undefined}
            />

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Description
              </label>
              <textarea
                placeholder="Enter department description (optional)"
                value={addFormData.description || ''}
                onChange={(e) => handleAddFormChange('description', e.target.value)}
                className="block w-full h-20 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-button-primary focus:border-transparent text-sm resize-none"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Department Head (Optional)
              </label>
              <select
                value={addFormData.departmentHeadId || ''}
                onChange={(e) => handleAddFormChange('departmentHeadId', e.target.value)}
                className="h-10 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-button-primary focus:border-transparent text-sm w-full"
              >
                <option value="">Select department head (optional)</option>
                {availableDepartmentHeads && Array.isArray(availableDepartmentHeads) && availableDepartmentHeads.map((head) => (
                  <option key={head.id} value={head.id}>
                    {head.firstName} {head.lastName} ({head.email})
                  </option>
                ))}
              </select>
            </div>
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
              disabled={isSubmitting || !addFormData.name.trim()}
            >
              {isSubmitting ? 'Creating...' : 'Add Department'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Department Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Department"
        size="lg"
      >
        <form onSubmit={handleEditFormSubmit} className="space-y-4">
          {selectedDepartment && (
            <p className="text-sm text-text-secondary">
              Editing: {selectedDepartment.name}
            </p>
          )}
          
          {editFormError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{editFormError}</p>
            </div>
          )}

          <div className="space-y-4">
            <Input
              label="Department Name"
              placeholder="Enter department name"
              value={editFormData.name}
              onChange={(value) => handleEditFormChange('name', value)}
              required
            />

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Description
              </label>
              <textarea
                value={editFormData.description}
                onChange={(e) => handleEditFormChange('description', e.target.value)}
                placeholder="Enter department description"
                className="h-20 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-button-primary focus:border-transparent text-sm w-full resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Department Head
              </label>
              <select
                value={editFormData.departmentHeadId || ''}
                onChange={(e) => handleEditFormChange('departmentHeadId', e.target.value)}
                className="h-10 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-button-primary focus:border-transparent text-sm w-full"
              >
                <option value="">No department head assigned</option>
                {availableDepartmentHeads && Array.isArray(availableDepartmentHeads) && availableDepartmentHeads.map((head) => (
                  <option key={head.id} value={head.id}>
                    {head.firstName} {head.lastName} ({head.email})
                  </option>
                ))}
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
              disabled={isEditSubmitting || !editFormData.name.trim()}
            >
              {isEditSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Assign Department Head Modal */}
      <Modal
        isOpen={isAssignHeadModalOpen}
        onClose={() => setIsAssignHeadModalOpen(false)}
        title="Assign Department Head"
        size="lg"
      >
        <div className="space-y-4">
          {selectedDepartment && (
            <p className="text-sm text-text-secondary">
              Assign a department head for: {selectedDepartment.name}
            </p>
          )}
          {/* TODO: Implement DepartmentHeadAssignment component */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button variant="secondary" onClick={() => setIsAssignHeadModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary">
              Assign Head
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Department Head Modal */}
      <Modal
        isOpen={isAddHeadModalOpen}
        onClose={() => setIsAddHeadModalOpen(false)}
        title="Add Department Head"
        size="lg"
      >
        <form onSubmit={handleHeadFormSubmit} className="space-y-4">
          <p className="text-sm text-text-secondary">
            Create a new department head user and assign them to a department. An email invitation will be sent for password setup.
          </p>
          
          {headFormError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{headFormError}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                placeholder="Enter first name"
                value={headFormData.firstName}
                onChange={(value) => handleHeadFormChange('firstName', value)}
                required
              />
              <Input
                label="Last Name"
                placeholder="Enter last name"
                value={headFormData.lastName}
                onChange={(value) => handleHeadFormChange('lastName', value)}
                required
              />
            </div>

            <Input
              label="Email"
              type="email"
              placeholder="Enter email address"
              value={headFormData.email}
              onChange={(value) => handleHeadFormChange('email', value)}
              required
            />

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Department
              </label>
              <select
                value={headFormData.departmentId}
                onChange={(e) => handleHeadFormChange('departmentId', e.target.value)}
                className="h-10 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-button-primary focus:border-transparent text-sm w-full"
                required
              >
                <option value="">Select a department</option>
                {departments?.filter(dept => !dept.departmentHeadUserId).map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-text-secondary mt-1">
                Only departments without assigned heads are shown
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button 
              type="button"
              variant="secondary" 
              onClick={() => setIsAddHeadModalOpen(false)}
              disabled={isHeadSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              variant="primary"
              disabled={isHeadSubmitting || !headFormData.email || !headFormData.firstName || !headFormData.lastName || !headFormData.departmentId}
            >
              {isHeadSubmitting ? 'Creating...' : 'Create Department Head'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Department Head Modal */}
      <Modal
        isOpen={isEditHeadModalOpen}
        onClose={() => setIsEditHeadModalOpen(false)}
        title="Edit Department Head"
        size="lg"
      >
        <form onSubmit={handleEditHeadFormSubmit} className="space-y-4">
          {selectedHead && (
            <p className="text-sm text-text-secondary">
              Editing: {selectedHead.firstName} {selectedHead.lastName}
            </p>
          )}
          
          {editHeadFormError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{editHeadFormError}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                placeholder="Enter first name"
                value={editHeadFormData.firstName}
                onChange={(value) => handleEditHeadFormChange('firstName', value)}
                required
              />
              <Input
                label="Last Name"
                placeholder="Enter last name"
                value={editHeadFormData.lastName}
                onChange={(value) => handleEditHeadFormChange('lastName', value)}
                required
              />
            </div>

            <Input
              label="Email"
              type="email"
              placeholder="Enter email address"
              value={editHeadFormData.email}
              onChange={(value) => handleEditHeadFormChange('email', value)}
              required
            />

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Department
              </label>
              <select
                value={editHeadFormData.departmentId}
                onChange={(e) => handleEditHeadFormChange('departmentId', e.target.value)}
                className="h-10 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-button-primary focus:border-transparent text-sm w-full"
              >
                <option value="">No department assigned</option>
                {departments?.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button 
              type="button"
              variant="secondary" 
              onClick={() => setIsEditHeadModalOpen(false)}
              disabled={isEditHeadSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              variant="primary"
              disabled={isEditHeadSubmitting || !editHeadFormData.email || !editHeadFormData.firstName || !editHeadFormData.lastName}
            >
              {isEditHeadSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>
    </PageLayout>
  );
};

export default DepartmentManagement;
