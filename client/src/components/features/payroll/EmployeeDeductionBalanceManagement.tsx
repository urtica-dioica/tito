import React, { useState } from 'react';
import { Plus, Edit, Trash2, Search, Filter, Upload, Download } from 'lucide-react';
import Button from '../../shared/Button';
import Card from '../../shared/Card';
import Badge from '../../shared/Badge';
import Modal from '../../shared/Modal';
import Input from '../../shared/Input';
import LoadingSpinner from '../../shared/LoadingSpinner';
import { useEmployeeDeductionBalances, useCreateEmployeeDeductionBalance, useUpdateEmployeeDeductionBalance, useDeleteEmployeeDeductionBalance, useUploadEmployeeDeductionBalances } from '../../../hooks/useEmployeeDeductionBalances';
import { useEmployees } from '../../../hooks/useEmployees';
import { useDeductionTypes } from '../../../hooks/useDeductionTypes';
import type { EmployeeDeductionBalance, CreateEmployeeDeductionBalanceRequest, UpdateEmployeeDeductionBalanceRequest, EmployeeDeductionBalanceCSVRow } from '../../../types';

interface EmployeeDeductionBalanceManagementProps {
  className?: string;
}

const EmployeeDeductionBalanceManagement: React.FC<EmployeeDeductionBalanceManagementProps> = ({ className }) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedBalance, setSelectedBalance] = useState<EmployeeDeductionBalance | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEmployee, setFilterEmployee] = useState<string>('');
  const [filterDeductionType, setFilterDeductionType] = useState<string>('');
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Form state
  const [formData, setFormData] = useState<CreateEmployeeDeductionBalanceRequest>({
    employeeId: '',
    deductionTypeId: '',
    originalAmount: 0,
    remainingBalance: 0,
    monthlyDeductionAmount: 0,
    startDate: '',
    isActive: true
  });


  // Fetch data
  const { data: balancesData, isLoading, error } = useEmployeeDeductionBalances({
    search: searchTerm || undefined,
    employeeId: filterEmployee || undefined,
    deductionTypeId: filterDeductionType || undefined,
    isActive: filterActive
  });

  const { data: employeesData } = useEmployees();
  const { data: deductionTypesData } = useDeductionTypes();

  const createMutation = useCreateEmployeeDeductionBalance();
  const updateMutation = useUpdateEmployeeDeductionBalance();
  const deleteMutation = useDeleteEmployeeDeductionBalance();
  const uploadMutation = useUploadEmployeeDeductionBalances();

  const balances = balancesData?.records || [];
  const employees = employeesData?.employees || [];
  const deductionTypes = deductionTypesData?.records || [];

  const handleCreate = () => {
    setFormData({
      employeeId: '',
      deductionTypeId: '',
      originalAmount: 0,
      remainingBalance: 0,
      monthlyDeductionAmount: 0,
      startDate: '',
      isActive: true
    });
    setIsCreateModalOpen(true);
  };

  const handleEdit = (balance: EmployeeDeductionBalance) => {
    setSelectedBalance(balance);
    setFormData({
      employeeId: balance.employeeId,
      deductionTypeId: balance.deductionTypeId,
      originalAmount: balance.originalAmount,
      remainingBalance: balance.remainingBalance,
      monthlyDeductionAmount: balance.monthlyDeductionAmount,
      startDate: balance.startDate,
      isActive: balance.isActive
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this deduction balance?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        console.error('Error deleting deduction balance:', error);
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

  const parseCSV = (csvText: string): EmployeeDeductionBalanceCSVRow[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header row and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const requiredHeaders = ['employee_id', 'employee_name', 'deduction_type', 'deduction_type_id', 'original_amount', 'remaining_balance', 'monthly_deduction_amount', 'start_date', 'is_active'];
    
    // Check if all required headers are present
    const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
    }

    const data: EmployeeDeductionBalanceCSVRow[] = [];
    
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
      if (!row.employee_id || !row.employee_name || !row.deduction_type || !row.deduction_type_id || !row.remaining_balance) {
        throw new Error(`Row ${i + 1} is missing required fields`);
      }

      // Validate UUID format for deduction_type_id
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(row.deduction_type_id)) {
        throw new Error(`Row ${i + 1}: deduction_type_id must be a valid UUID format`);
      }

      data.push({
        employee_id: row.employee_id,
        employee_name: row.employee_name,
        deduction_type_name: row.deduction_type,
        deduction_type_id: row.deduction_type_id,
        remaining_balance: row.remaining_balance,
        monthly_deduction_amount: row.monthly_deduction_amount || row.remaining_balance,
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
      
      // Simulate progress during upload
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 20, 90));
      }, 300);

      // Debug: Log the parsed CSV data
      console.log('Parsed CSV data:', csvData);
      
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
          alert(`Successfully uploaded ${result.successCount} employee deduction balances!`);
        }
      }, 500);

    } catch (error: any) {
      console.error('Error uploading CSV:', error);
      setUploadProgress(0);
      alert(`Error uploading CSV file: ${error.message || 'Unknown error'}`);
    }
  };

  const downloadTemplate = () => {
    // Get actual deduction types for the template
    const deductionTypeOptions = deductionTypes.length > 0 
      ? deductionTypes.map(dt => `${dt.name} (${dt.id})`).join('\n# ')
      : 'No deduction types available';
    
    // Use actual deduction type UUIDs if available
    const sampleDeductionType1 = deductionTypes.length > 0 ? deductionTypes[0].id : 'deduction-type-uuid-1';
    const sampleDeductionType2 = deductionTypes.length > 1 ? deductionTypes[1].id : 'deduction-type-uuid-2';
    const sampleDeductionType3 = deductionTypes.length > 2 ? deductionTypes[2].id : 'deduction-type-uuid-3';
    
    const csvContent = 'employee_id,employee_name,deduction_type,deduction_type_id,original_amount,remaining_balance,monthly_deduction_amount,start_date,is_active\n' +
      `EMP-2025-0000001,John Doe,${deductionTypes.length > 0 ? deductionTypes[0].name : 'SSS'},${sampleDeductionType1},10000,10000,1000,2025-01-01,true\n` +
      `EMP-2025-0000002,Jane Smith,${deductionTypes.length > 1 ? deductionTypes[1].name : 'PAG-IBIG'},${sampleDeductionType2},15000,12000,1500,2025-01-01,true\n` +
      `EMP-2025-0000003,Bob Johnson,${deductionTypes.length > 2 ? deductionTypes[2].name : 'PhilHealth'},${sampleDeductionType3},5000,3000,500,2025-01-01,true\n\n` +
      `# Available deduction types:\n# ${deductionTypeOptions}\n` +
      '# Note: Use actual employee IDs and deduction type UUIDs from your system\n' +
      '# The deduction_type_id must be a valid UUID format';
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employee-deduction-balances-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleCreateSubmit = async () => {
    try {
      await createMutation.mutateAsync(formData);
      setIsCreateModalOpen(false);
      setFormData({
        employeeId: '',
        deductionTypeId: '',
        originalAmount: 0,
        remainingBalance: 0,
        monthlyDeductionAmount: 0,
        startDate: '',
        isActive: true
      });
    } catch (error) {
      console.error('Error creating deduction balance:', error);
    }
  };

  const handleEditSubmit = async () => {
    if (!selectedBalance) return;
    
    try {
      const updateData: UpdateEmployeeDeductionBalanceRequest = {
        originalAmount: formData.originalAmount,
        remainingBalance: formData.remainingBalance,
        monthlyDeductionAmount: formData.monthlyDeductionAmount,
        startDate: formData.startDate,
        isActive: formData.isActive
      };
      
      await updateMutation.mutateAsync({
        id: selectedBalance.id,
        data: updateData
      });
      
      setIsEditModalOpen(false);
      setSelectedBalance(null);
    } catch (error) {
      console.error('Error updating deduction balance:', error);
    }
  };


  const getEmployeeName = (balance: any) => {
    // Use the employee name from the backend response if available
    if (balance.firstName && balance.lastName) {
      return `${balance.firstName} ${balance.lastName}`;
    }
    
    // Fallback to employee lookup if names not available
    if (!employees || employees.length === 0) {
      return 'Loading...';
    }
    const employee = employees.find(emp => emp.id === balance.employeeId);
    if (!employee) {
      console.log('Employee not found for ID:', balance.employeeId, 'Available employees:', employees.map(e => ({ id: e.id, name: `${e.firstName} ${e.lastName}` })));
      return 'Unknown Employee';
    }
    return `${employee.firstName} ${employee.lastName}`;
  };

  const getDeductionTypeName = (deductionTypeId: string) => {
    if (!deductionTypes || deductionTypes.length === 0) {
      return 'Loading...';
    }
    const deductionType = deductionTypes.find(dt => dt.id === deductionTypeId);
    return deductionType ? deductionType.name : 'Unknown Deduction Type';
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
        <p className="text-red-600">Error loading deduction balances: {error.message}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Employee Deduction Balances</h2>
          <p className="text-sm text-gray-500">Manage employee-specific deduction balances</p>
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
            Add Balance
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search balances..."
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
            value={filterDeductionType}
            onChange={(e) => setFilterDeductionType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">All Deduction Types</option>
            {deductionTypes.map(deductionType => (
              <option key={deductionType.id} value={deductionType.id}>
                {deductionType.name}
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

      {/* Balances List */}
      <div className="grid gap-4">
        {balances.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500">No deduction balances found</p>
          </Card>
        ) : (
          balances.map((balance) => (
            <Card key={balance.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium text-gray-900">
                      {getEmployeeName(balance)}
                    </h3>
                    <Badge variant={balance.isActive ? 'success' : 'default'}>
                      {balance.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {getDeductionTypeName(balance.deductionTypeId)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Remaining Balance: ₱{balance.remainingBalance.toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(balance)}
                    className="flex items-center gap-1"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(balance.id)}
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
        title="Create Employee Deduction Balance"
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
              Deduction Type *
            </label>
            <select
              value={formData.deductionTypeId}
              onChange={(e) => setFormData({ ...formData, deductionTypeId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">Select Deduction Type</option>
              {deductionTypes.map(deductionType => (
                <option key={deductionType.id} value={deductionType.id}>
                  {deductionType.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Original Amount *
            </label>
            <Input
              type="number"
              value={formData.originalAmount.toString()}
              onChange={(value) => setFormData({ ...formData, originalAmount: parseFloat(value) || 0 })}
              placeholder="Enter original amount"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Remaining Balance *
            </label>
            <Input
              type="number"
              value={formData.remainingBalance.toString()}
              onChange={(value) => setFormData({ ...formData, remainingBalance: parseFloat(value) || 0 })}
              placeholder="Enter remaining balance"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monthly Deduction Amount *
            </label>
            <Input
              type="number"
              value={formData.monthlyDeductionAmount.toString()}
              onChange={(value) => setFormData({ ...formData, monthlyDeductionAmount: parseFloat(value) || 0 })}
              placeholder="Enter monthly deduction amount"
            />
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
            disabled={!formData.employeeId || !formData.deductionTypeId || !formData.startDate || formData.originalAmount <= 0 || formData.remainingBalance <= 0 || formData.monthlyDeductionAmount <= 0 || createMutation.isPending}
          >
            {createMutation.isPending ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Employee Deduction Balance"
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
              Deduction Type *
            </label>
            <select
              value={formData.deductionTypeId}
              onChange={(e) => setFormData({ ...formData, deductionTypeId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">Select Deduction Type</option>
              {deductionTypes.map(deductionType => (
                <option key={deductionType.id} value={deductionType.id}>
                  {deductionType.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Original Amount *
            </label>
            <Input
              type="number"
              value={formData.originalAmount.toString()}
              onChange={(value) => setFormData({ ...formData, originalAmount: parseFloat(value) || 0 })}
              placeholder="Enter original amount"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Remaining Balance *
            </label>
            <Input
              type="number"
              value={formData.remainingBalance.toString()}
              onChange={(value) => setFormData({ ...formData, remainingBalance: parseFloat(value) || 0 })}
              placeholder="Enter remaining balance"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monthly Deduction Amount *
            </label>
            <Input
              type="number"
              value={formData.monthlyDeductionAmount.toString()}
              onChange={(value) => setFormData({ ...formData, monthlyDeductionAmount: parseFloat(value) || 0 })}
              placeholder="Enter monthly deduction amount"
            />
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
            disabled={!formData.employeeId || !formData.deductionTypeId || !formData.startDate || formData.originalAmount <= 0 || formData.remainingBalance <= 0 || formData.monthlyDeductionAmount <= 0 || updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Updating...' : 'Update'}
          </Button>
        </div>
      </Modal>

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Employee Deduction Balances"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">CSV Format Requirements</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• CSV must have headers: employee_id, employee_name, deduction_type, deduction_type_id, original_amount, remaining_balance, monthly_deduction_amount, start_date, is_active</li>
              <li>• employee_id: Employee ID (e.g., EMP-2025-0000001)</li>
              <li>• employee_name: Employee full name (e.g., John Doe)</li>
              <li>• deduction_type: Deduction type name (e.g., SSS Loan)</li>
              <li>• deduction_type_id: UUID of the deduction type</li>
              <li>• original_amount: Original deduction amount (decimal)</li>
              <li>• remaining_balance: Current remaining balance (decimal)</li>
              <li>• monthly_deduction_amount: Amount to deduct monthly (decimal)</li>
              <li>• start_date: Start date (YYYY-MM-DD format)</li>
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

export default EmployeeDeductionBalanceManagement;
