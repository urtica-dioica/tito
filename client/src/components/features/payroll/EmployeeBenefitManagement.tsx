import React, { useState } from 'react';
import { Plus, Edit, Trash2, Search, Filter, Upload, Download } from 'lucide-react';
import Button from '../../shared/Button';
import Card from '../../shared/Card';
import Badge from '../../shared/Badge';
import Modal from '../../shared/Modal';
import Input from '../../shared/Input';
import LoadingSpinner from '../../shared/LoadingSpinner';
import { useEmployeeBenefits, useCreateEmployeeBenefit, useUpdateEmployeeBenefit, useDeleteEmployeeBenefit, useUploadEmployeeBenefits } from '../../../hooks/useEmployeeBenefits';
import { useEmployees } from '../../../hooks/useEmployees';
import { useBenefitTypes } from '../../../hooks/useBenefitTypes';
import type { EmployeeBenefit, CreateEmployeeBenefitRequest, UpdateEmployeeBenefitRequest } from '../../../types';

interface EmployeeBenefitManagementProps {
  className?: string;
}

const EmployeeBenefitManagement: React.FC<EmployeeBenefitManagementProps> = ({ className }) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedBenefit, setSelectedBenefit] = useState<EmployeeBenefit | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEmployee, setFilterEmployee] = useState<string>('');
  const [filterBenefitType, setFilterBenefitType] = useState<string>('');
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Form state
  const [formData, setFormData] = useState<CreateEmployeeBenefitRequest>({
    employeeId: '',
    benefitTypeId: '',
    amount: 0,
    startDate: '',
    isActive: true
  });

  // Fetch data
  const { data: benefitsData, isLoading, error } = useEmployeeBenefits({
    search: searchTerm || undefined,
    employeeId: filterEmployee || undefined,
    benefitTypeId: filterBenefitType || undefined,
    isActive: filterActive
  });

  const { data: employeesData } = useEmployees();
  const { data: benefitTypesData } = useBenefitTypes();

  const createMutation = useCreateEmployeeBenefit();
  const updateMutation = useUpdateEmployeeBenefit();
  const deleteMutation = useDeleteEmployeeBenefit();
  const uploadMutation = useUploadEmployeeBenefits();

  const benefits = benefitsData?.records || [];
  const employees = employeesData?.employees || [];
  const benefitTypes = benefitTypesData?.records || [];

  const handleCreate = () => {
    setFormData({
      employeeId: '',
      benefitTypeId: '',
      amount: 0,
      startDate: '',
      isActive: true
    });
    setIsCreateModalOpen(true);
  };

  const handleEdit = (benefit: EmployeeBenefit) => {
    setSelectedBenefit(benefit);
    setFormData({
      employeeId: benefit.employeeId,
      benefitTypeId: benefit.benefitTypeId,
      amount: benefit.amount,
      startDate: benefit.startDate,
      isActive: benefit.isActive
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this employee benefit?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error: any) {
        console.error('Error deleting employee benefit:', error);
        alert('Error deleting employee benefit. Please try again.');
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setUploadFile(file);
    } else {
      alert('Please select a valid CSV file');
    }
  };

  const parseCSV = (csvText: string): any[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header row and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const requiredHeaders = ['employee_name', 'employee_id', 'benefit_type_name', 'benefit_type_id', 'amount', 'is_active'];
    
    // Check if all required headers are present
    const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
    }

    const data: any[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length !== headers.length) {
        throw new Error(`Row ${i + 1} has ${values.length} columns but expected ${headers.length}`);
      }

      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });

      // Validate required fields
      if (!row.employee_name || !row.employee_id || !row.benefit_type_name || !row.benefit_type_id || !row.amount) {
        throw new Error(`Row ${i + 1} is missing required fields`);
      }

      // Validate UUID format for benefit_type_id
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(row.benefit_type_id)) {
        throw new Error(`Row ${i + 1}: benefit_type_id must be a valid UUID format`);
      }

      data.push({
        employee_name: row.employee_name,
        employee_id: row.employee_id,
        benefit_type_name: row.benefit_type_name,
        benefit_type_id: row.benefit_type_id,
        amount: row.amount,
        start_date: row.start_date || new Date().toISOString().split('T')[0],
        end_date: row.end_date || undefined,
        is_active: row.is_active || 'true'
      });
    }

    return data;
  };

  const handleCSVUpload = async () => {
    if (!uploadFile) return;

    try {
      setUploadProgress(0);
      
      // Read the CSV file
      const csvText = await uploadFile.text();
      
      // Parse the CSV
      const csvData = parseCSV(csvText);
      
      // Debug: Log the parsed CSV data
      console.log('Parsed CSV data:', csvData);
      
      // Simulate progress during upload
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 20, 90));
      }, 300);

      // Upload the data
      const result = await uploadMutation.mutateAsync(csvData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setTimeout(() => {
        setIsUploadModalOpen(false);
        setUploadFile(null);
        setUploadProgress(0);
        
        // Show success message with details
        if (result.errorCount > 0) {
          const errorDetails = result.errors.map((error: any) => `Row ${error.row}: ${error.error}`).join('\n');
          alert(`Upload completed with ${result.successCount} successful uploads and ${result.errorCount} errors.\n\nErrors:\n${errorDetails}`);
          console.log('Upload errors:', result.errors);
        } else {
          alert(`Successfully uploaded ${result.successCount} employee benefits!`);
        }
      }, 500);

    } catch (error: any) {
      console.error('Error uploading CSV:', error);
      setUploadProgress(0);
      alert(`Error uploading CSV file: ${error.message || 'Unknown error'}`);
    }
  };

  const downloadTemplate = () => {
    // Get actual benefit types for the template
    const benefitTypeOptions = benefitTypes.length > 0 
      ? benefitTypes.map(bt => `${bt.name} (${bt.id})`).join('\n# ')
      : 'No benefit types available';
    
    // Use actual benefit type UUIDs if available
    const sampleBenefitType1 = benefitTypes.length > 0 ? benefitTypes[0].id : 'benefit-type-uuid-1';
    const sampleBenefitType2 = benefitTypes.length > 1 ? benefitTypes[1].id : 'benefit-type-uuid-2';
    const sampleBenefitType3 = benefitTypes.length > 2 ? benefitTypes[2].id : 'benefit-type-uuid-3';
    
    const csvContent = 'employee_name,employee_id,benefit_type_name,benefit_type_id,amount,start_date,is_active\n' +
      `John Doe,EMP-2025-0000001,${benefitTypes.length > 0 ? benefitTypes[0].name : 'Transportation Allowance'},${sampleBenefitType1},5000,2025-01-01,true\n` +
      `Jane Smith,EMP-2025-0000002,${benefitTypes.length > 1 ? benefitTypes[1].name : 'Meal Allowance'},${sampleBenefitType2},3000,2025-01-01,true\n` +
      `Bob Johnson,EMP-2025-0000003,${benefitTypes.length > 2 ? benefitTypes[2].name : 'Housing Allowance'},${sampleBenefitType3},8000,2025-01-01,true\n\n` +
      `# Available benefit types:\n# ${benefitTypeOptions}\n` +
      '# Note: Use actual employee IDs and benefit type UUIDs from your system\n' +
      '# The benefit_type_id must be a valid UUID format';
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employee-benefits-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleCreateSubmit = async () => {
    try {
      // Get the amount from the selected benefit type
      const selectedBenefitType = benefitTypes.find(bt => bt.id === formData.benefitTypeId);
      const submitData = {
        ...formData,
        amount: selectedBenefitType?.amount || 0
      };
      
      await createMutation.mutateAsync(submitData);
      setIsCreateModalOpen(false);
      setFormData({
        employeeId: '',
        benefitTypeId: '',
        amount: 0,
        startDate: '',
        isActive: true
      });
    } catch (error: any) {
      console.error('Error creating employee benefit:', error);
      
      // Check if it's a duplicate constraint error
      if (error?.response?.data?.error?.includes('duplicate key value violates unique constraint')) {
        const employeeName = getEmployeeName(formData.employeeId);
        const benefitTypeName = getBenefitTypeName(formData.benefitTypeId);
        alert(`Error: ${employeeName} already has the ${benefitTypeName} benefit starting on ${formData.startDate}. Please choose a different start date or benefit type.`);
      } else {
        alert('Error creating employee benefit. Please try again.');
      }
    }
  };

  const handleEditSubmit = async () => {
    if (!selectedBenefit) return;
    
    try {
      // Get the amount from the selected benefit type
      const selectedBenefitType = benefitTypes.find(bt => bt.id === formData.benefitTypeId);
      const updateData: UpdateEmployeeBenefitRequest = {
        benefitTypeId: formData.benefitTypeId,
        amount: selectedBenefitType?.amount || 0,
        startDate: formData.startDate,
        isActive: formData.isActive
      };
      
      await updateMutation.mutateAsync({
        id: selectedBenefit.id,
        data: updateData
      });
      
      setIsEditModalOpen(false);
      setSelectedBenefit(null);
    } catch (error: any) {
      console.error('Error updating employee benefit:', error);
      
      // Check if it's a duplicate constraint error
      if (error?.response?.data?.error?.includes('duplicate key value violates unique constraint')) {
        const employeeName = getEmployeeName(formData.employeeId);
        const benefitTypeName = getBenefitTypeName(formData.benefitTypeId);
        alert(`Error: ${employeeName} already has the ${benefitTypeName} benefit starting on ${formData.startDate}. Please choose a different start date or benefit type.`);
      } else {
        alert('Error updating employee benefit. Please try again.');
      }
    }
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown Employee';
  };

  const getBenefitTypeName = (benefitTypeId: string) => {
    const benefitType = benefitTypes.find(bt => bt.id === benefitTypeId);
    return benefitType ? benefitType.name : 'Unknown Benefit Type';
  };


  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading employee benefits: {error.message}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Employee Benefits</h2>
          <p className="text-sm text-gray-500">Manage employee-specific benefits</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={downloadTemplate} 
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download Template
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setIsUploadModalOpen(true)} 
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload CSV
          </Button>
          <Button onClick={handleCreate} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Benefit
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search benefits..."
              value={searchTerm}
              onChange={(value) => setSearchTerm(value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={filterEmployee}
            onChange={(e) => setFilterEmployee(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">All Employees</option>
            {employees.map(employee => (
              <option key={employee.id} value={employee.id}>
                {employee.firstName} {employee.lastName}
              </option>
            ))}
          </select>
          <select
            value={filterBenefitType}
            onChange={(e) => setFilterBenefitType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">All Benefit Types</option>
            {benefitTypes.map(benefitType => (
              <option key={benefitType.id} value={benefitType.id}>
                {benefitType.name}
              </option>
            ))}
          </select>
          <select
            value={filterActive === undefined ? 'all' : filterActive.toString()}
            onChange={(e) => setFilterActive(e.target.value === 'all' ? undefined : e.target.value === 'true')}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      {/* Benefits List */}
      <div className="grid gap-4">
        {benefits.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500">No employee benefits found</p>
          </Card>
        ) : (
          benefits.map((benefit) => (
            <Card key={benefit.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium text-gray-900">
                      {benefit.employeeName || 'Unknown Employee'}
                    </h3>
                    <Badge variant={benefit.isActive ? 'success' : 'default'}>
                      {benefit.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {getBenefitTypeName(benefit.benefitTypeId)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Amount: ₱{benefit.amount?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(benefit)}
                    className="flex items-center gap-1"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(benefit.id)}
                    className="flex items-center gap-1 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Employee Benefit"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Employee *
            </label>
            <select
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">Select Employee</option>
              {employees.map(employee => (
                <option key={employee.id} value={employee.id}>
                  {employee.firstName} {employee.lastName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Benefit Type *
            </label>
            <select
              value={formData.benefitTypeId}
              onChange={(e) => setFormData({ ...formData, benefitTypeId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">Select Benefit Type</option>
              {benefitTypes.map(benefitType => (
                <option key={benefitType.id} value={benefitType.id}>
                  {benefitType.name} (₱{benefitType.amount?.toLocaleString() || '0'})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount
            </label>
            <div className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 text-gray-600">
              ₱{benefitTypes.find(bt => bt.id === formData.benefitTypeId)?.amount?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-gray-500 mt-1">Amount is automatically set from the selected benefit type</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date *
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Each employee can only have one benefit of the same type starting on the same date</p>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
              Active
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => setIsCreateModalOpen(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateSubmit}
            disabled={!formData.employeeId || !formData.benefitTypeId || !formData.startDate || createMutation.isPending}
          >
            {createMutation.isPending ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Employee Benefit"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Employee *
            </label>
            <select
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">Select Employee</option>
              {employees.map(employee => (
                <option key={employee.id} value={employee.id}>
                  {employee.firstName} {employee.lastName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Benefit Type *
            </label>
            <select
              value={formData.benefitTypeId}
              onChange={(e) => setFormData({ ...formData, benefitTypeId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">Select Benefit Type</option>
              {benefitTypes.map(benefitType => (
                <option key={benefitType.id} value={benefitType.id}>
                  {benefitType.name} (₱{benefitType.amount?.toLocaleString() || '0'})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount
            </label>
            <div className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 text-gray-600">
              ₱{benefitTypes.find(bt => bt.id === formData.benefitTypeId)?.amount?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-gray-500 mt-1">Amount is automatically set from the selected benefit type</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date *
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              required
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActiveEdit"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isActiveEdit" className="ml-2 block text-sm text-gray-700">
              Active
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => setIsEditModalOpen(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleEditSubmit}
            disabled={!formData.employeeId || !formData.benefitTypeId || !formData.startDate || updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Updating...' : 'Update'}
          </Button>
        </div>
      </Modal>

      {/* Upload CSV Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Employee Benefits CSV"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">CSV Format Requirements</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• CSV must have headers: employee_name, employee_id, benefit_type_name, benefit_type_id, amount, is_active</li>
              <li>• employee_name: Employee full name (e.g., John Doe)</li>
              <li>• employee_id: Employee ID (e.g., EMP-2025-0000001)</li>
              <li>• benefit_type_name: Benefit type name (e.g., Transportation Allowance)</li>
              <li>• benefit_type_id: UUID of the benefit type</li>
              <li>• amount: Benefit amount (decimal)</li>
              <li>• is_active: true or false</li>
            </ul>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select CSV File
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {uploadFile && (
              <p className="mt-2 text-sm text-green-600">
                Selected: {uploadFile.name}
              </p>
            )}
          </div>

          {uploadProgress > 0 && (
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => {
              setIsUploadModalOpen(false);
              setUploadFile(null);
              setUploadProgress(0);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCSVUpload}
            disabled={!uploadFile || uploadProgress > 0 || uploadMutation.isPending}
          >
            {uploadProgress > 0 || uploadMutation.isPending ? 'Uploading...' : 'Upload CSV'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default EmployeeBenefitManagement;
