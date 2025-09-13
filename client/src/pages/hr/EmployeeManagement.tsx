import React, { useState, useEffect } from 'react';
import { Plus, Users, UserCheck, Building, DollarSign, Search } from 'lucide-react';
import Button from '../../components/shared/Button';
import Badge from '../../components/shared/Badge';
import Modal from '../../components/shared/Modal';
import Input from '../../components/shared/Input';
import Card from '../../components/shared/Card';
import PageLayout from '../../components/layout/PageLayout';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { useEmployees, useEmployeeStats, useCreateEmployee, useUpdateEmployee, useDeleteEmployee, useHardDeleteEmployee, useCreateBulkEmployees } from '../../hooks/useEmployees';
import { useDepartments } from '../../hooks/useDepartments';
import { useCreateIdCard, useQrCodeData, useIdCards } from '../../hooks/useIdCards';
import type { CreateHREmployeeRequest, HREmployee } from '../../services/hrEmployeeService';

const EmployeeManagement: React.FC = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkAddModalOpen, setIsBulkAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isHardDeleteModalOpen, setIsHardDeleteModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<HREmployee | null>(null);
  
  // ID Card Generation state
  const [selectedEmployeeForIdCard, setSelectedEmployeeForIdCard] = useState<HREmployee | null>(null);
  const [idCardSearchTerm, setIdCardSearchTerm] = useState('');
  const [idCardDepartmentFilter, setIdCardDepartmentFilter] = useState('');
  const [generatedIdCard, setGeneratedIdCard] = useState<{ id: string; expiryDate: string } | null>(null);
  const [idCardError, setIdCardError] = useState<string | null>(null);
  const [currentIdCardId, setCurrentIdCardId] = useState<string | null>(null);
  
  // Form state for adding employee
  const [addFormData, setAddFormData] = useState<CreateHREmployeeRequest>({
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

  // Bulk add employee form state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);
  const [bulkFormError, setBulkFormError] = useState<string | null>(null);
  const [bulkResults, setBulkResults] = useState<{
    totalProcessed: number;
    successCount: number;
    errorCount: number;
    errors: Array<{ row: number; data: any; error: string }>;
  } | null>(null);

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
  const createBulkEmployeesMutation = useCreateBulkEmployees();
  
  // ID Card hooks
  const createIdCardMutation = useCreateIdCard();
  const { data: qrCodeData, isLoading: qrCodeLoading, error: qrCodeError } = useQrCodeData(currentIdCardId || '');
  const { data: existingIdCards } = useIdCards({ isActive: true });
  
  
  // Helper function to check if employee has active ID card
  const employeeHasActiveIdCard = (employeeId: string) => {
    // Handle both array and object with idCards property
    const idCardsArray = Array.isArray(existingIdCards) ? existingIdCards : existingIdCards?.idCards;
    
    if (!idCardsArray) {
      return false;
    }

    const hasCard = idCardsArray.some(card =>
      card.employeeId === employeeId && card.isActive
    );
    return hasCard;
  };
  
  // Helper function to get existing ID card for employee
  const getExistingIdCard = (employeeId: string) => {
    // Handle both array and object with idCards property
    const idCardsArray = Array.isArray(existingIdCards) ? existingIdCards : existingIdCards?.idCards;
    
    const card = idCardsArray?.find(card => 
      card.employeeId === employeeId && card.isActive
    );
    console.log(`Existing card for employee ${employeeId}:`, card);
    return card;
  };

  // Effect to handle existing ID cards loading after employee selection
  useEffect(() => {
    const idCardsArray = Array.isArray(existingIdCards) ? existingIdCards : existingIdCards?.idCards;

    if (selectedEmployeeForIdCard && idCardsArray) {
      if (employeeHasActiveIdCard(selectedEmployeeForIdCard.id)) {
        const existingCard = getExistingIdCard(selectedEmployeeForIdCard.id);
        if (existingCard && existingCard.id !== currentIdCardId) {
          setCurrentIdCardId(existingCard.id);
        }
      }
    }
  }, [selectedEmployeeForIdCard, existingIdCards, currentIdCardId]);

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

  const handleBulkAddEmployee = () => {
    setCsvFile(null);
    setBulkFormError(null);
    setBulkResults(null);
    setIsBulkAddModalOpen(true);
  };

  const handleEditEmployee = (employee: HREmployee) => {
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

  const handleDeleteEmployee = async (employee: HREmployee) => {
    if (confirm(`Are you sure you want to delete ${employee.firstName} ${employee.lastName}? This action cannot be undone.`)) {
      try {
        await deleteEmployeeMutation.mutateAsync(employee.id);
        await refetch();
      } catch (error: any) {
        // Log error in development only
        if (import.meta.env.DEV) {
          console.error('Error deleting employee:', error);
        }
        alert(error.response?.data?.message || 'Failed to delete employee. Please try again.');
      }
    }
  };

  const handleHardDeleteEmployee = (employee: HREmployee) => {
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
      // Log error in development only
      if (import.meta.env.DEV) {
        console.error('Error hard deleting employee:', error);
      }
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
      // Log error in development only
      if (import.meta.env.DEV) {
        console.error('Error creating employee:', error);
      }
      setFormError(error.response?.data?.message || 'Failed to create employee. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCSVFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.name.toLowerCase().endsWith('.csv')) {
        setBulkFormError('Please select a CSV file');
        return;
      }
      
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setBulkFormError('File size must be less than 10MB');
        return;
      }
      
      setCsvFile(file);
      setBulkFormError(null);
    }
  };

  const handleBulkFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!csvFile) {
      setBulkFormError('Please select a CSV file');
      return;
    }

    try {
      setIsBulkSubmitting(true);
      setBulkFormError(null);
      setBulkResults(null);

      // Show progress message
      setBulkFormError('Processing CSV file and creating employees... This may take a few minutes for large files.');

      const result = await createBulkEmployeesMutation.mutateAsync(csvFile);
      
      setBulkResults(result.data);
      setBulkFormError(null); // Clear progress message
      
      // Refresh employees list
      await refetch();
      
      // Show results
      if (result.data.successCount > 0) {
        alert(`Successfully created ${result.data.successCount} employee(s)! ${result.data.errorCount > 0 ? `${result.data.errorCount} failed.` : ''}`);
      }
      
      if (result.data.errorCount > 0 && result.data.successCount === 0) {
        setBulkFormError(`Failed to create all ${result.data.errorCount} employees. Please check the CSV format and try again.`);
      }
    } catch (error: any) {
      // Log error in development only
      if (import.meta.env.DEV) {
        console.error('Error in bulk employee creation:', error);
      }

      // Handle timeout errors specifically
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        setBulkFormError('The operation timed out. This can happen with large CSV files. Please try with a smaller batch or contact support if the issue persists.');
      } else {
        setBulkFormError(error.response?.data?.message || 'An unexpected error occurred during bulk creation.');
      }
    } finally {
      setIsBulkSubmitting(false);
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
      // Log error in development only
      if (import.meta.env.DEV) {
        console.error('Error updating employee:', error);
      }
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

  // ID Card Generation handlers
  const handleSelectEmployeeForIdCard = (employee: HREmployee) => {
    setSelectedEmployeeForIdCard(employee);
    setIdCardError(null);
    
    // Wait for existing ID cards to load, then check
    const idCardsArray = Array.isArray(existingIdCards) ? existingIdCards : existingIdCards?.idCards;

    if (idCardsArray) {
      // If employee has an existing ID card, set the ID card ID to fetch QR code
      if (employeeHasActiveIdCard(employee.id)) {
        const existingCard = getExistingIdCard(employee.id);
        setCurrentIdCardId(existingCard?.id || null);
        setGeneratedIdCard(null); // Clear any newly generated card
      } else {
        setCurrentIdCardId(null);
        setGeneratedIdCard(null);
      }
    } else {
      setCurrentIdCardId(null);
      setGeneratedIdCard(null);
    }
  };

  // Function to print only the ID card
  const printIdCard = () => {
    if (!selectedEmployeeForIdCard || !qrCodeData) return;
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const expiryDate = generatedIdCard ? 
      new Date(generatedIdCard.expiryDate).toLocaleDateString() : 
      employeeHasActiveIdCard(selectedEmployeeForIdCard.id) ?
      new Date(getExistingIdCard(selectedEmployeeForIdCard.id)?.expiryDate || '').toLocaleDateString() :
      new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString();
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>ID Card - ${selectedEmployeeForIdCard.firstName} ${selectedEmployeeForIdCard.lastName}</title>
          <style>
            @page {
              size: A4;
              margin: 0.5in;
            }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            .id-card {
              width: 400px;
              height: 250px;
              border: 2px solid #d1d5db;
              border-radius: 8px;
              padding: 20px;
              background: white;
              display: flex;
              align-items: center;
              gap: 20px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .qr-code {
              width: 120px;
              height: 120px;
              flex-shrink: 0;
            }
            .qr-code img {
              width: 100%;
              height: 100%;
              border-radius: 4px;
            }
            .employee-info {
              flex: 1;
            }
            .employee-name {
              font-size: 18px;
              font-weight: bold;
              color: #374151;
              margin-bottom: 8px;
            }
            .employee-details {
              font-size: 14px;
              color: #374151;
              margin-bottom: 4px;
            }
            .expiry-date {
              font-size: 12px;
              color: #6b7280;
              margin-top: 12px;
            }
            .status-badge {
              display: inline-block;
              background: #10b981;
              color: white;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: bold;
              margin-top: 8px;
            }
          </style>
        </head>
        <body>
          <div class="id-card">
            <div class="qr-code">
              <img src="${qrCodeData.qrCodeImage}" alt="QR Code" />
            </div>
            <div class="employee-info">
              <div class="employee-name">
                ${selectedEmployeeForIdCard.firstName} ${selectedEmployeeForIdCard.lastName}
              </div>
              <div class="employee-details">${selectedEmployeeForIdCard.position}</div>
              <div class="employee-details">${selectedEmployeeForIdCard.departmentName}</div>
              <div class="employee-details">ID: ${selectedEmployeeForIdCard.employeeId}</div>
              <div class="expiry-date">Expires: ${expiryDate}</div>
              <div class="status-badge">Active</div>
            </div>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for the image to load, then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    };
  };

  // Function to download complete ID card as image
  const downloadIdCard = async () => {
    if (!selectedEmployeeForIdCard || !qrCodeData) return;
    
    try {
      // Create a canvas to generate the ID card image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Set canvas size (ID card dimensions)
      canvas.width = 400;
      canvas.height = 250;
      
      // White background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Border
      ctx.strokeStyle = '#d1d5db';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
      
      // Load QR code image
      const qrImg = new Image();
      qrImg.onload = () => {
        // Draw QR code (left side)
        ctx.drawImage(qrImg, 20, 20, 120, 120);
        
        // Draw employee info (right side)
        ctx.fillStyle = '#374151';
        ctx.font = 'bold 18px Arial';
        ctx.fillText(`${selectedEmployeeForIdCard.firstName} ${selectedEmployeeForIdCard.lastName}`, 160, 40);
        
        ctx.font = '14px Arial';
        ctx.fillText(selectedEmployeeForIdCard.position, 160, 65);
        ctx.fillText(selectedEmployeeForIdCard.departmentName, 160, 85);
        ctx.fillText(`ID: ${selectedEmployeeForIdCard.employeeId}`, 160, 105);
        
        // Draw expiry date
        ctx.font = '12px Arial';
        ctx.fillStyle = '#6b7280';
        const expiryDate = generatedIdCard ? 
          new Date(generatedIdCard.expiryDate).toLocaleDateString() : 
          employeeHasActiveIdCard(selectedEmployeeForIdCard.id) ?
          new Date(getExistingIdCard(selectedEmployeeForIdCard.id)?.expiryDate || '').toLocaleDateString() :
          new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString();
        ctx.fillText(`Expires: ${expiryDate}`, 160, 125);
        
        // Download the image
        const link = document.createElement('a');
        link.download = `id-card-${selectedEmployeeForIdCard.employeeId}.png`;
        link.href = canvas.toDataURL();
        link.click();
      };
      qrImg.src = qrCodeData.qrCodeImage;
    } catch (error) {
      console.error('Error generating ID card image:', error);
    }
  };

  const handleGenerateIdCard = async (employee: HREmployee) => {
    try {
      setIdCardError(null);
      setGeneratedIdCard(null);
      
      const result = await createIdCardMutation.mutateAsync({
        employeeId: employee.id,
        expiryYears: 1 // Default to 1 year expiry
      });
      
      setGeneratedIdCard(result);
      setCurrentIdCardId(result.id); // Set the new ID card ID to fetch QR code
      setSelectedEmployeeForIdCard(employee);
      
      // Show success message
      alert(`ID card generated successfully for ${employee.firstName} ${employee.lastName}!`);
    } catch (error: any) {
      // Log error in development only
      if (import.meta.env.DEV) {
        console.error('Error generating ID card:', error);
      }
      const errorMessage = error.response?.data?.message || 'Failed to generate ID card. Please try again.';
      setIdCardError(errorMessage);

      // Show specific message for existing ID card
      if (errorMessage.includes('already has an active ID card')) {
        alert(`${employee.firstName} ${employee.lastName} already has an active ID card. Please deactivate the existing card first or select a different employee.`);
      } else {
        alert(`Failed to generate ID card: ${errorMessage}`);
      }
    }
  };

  // Filter employees for ID card generation
  const filteredEmployeesForIdCard = employeesData?.employees?.filter(employee => {
    const matchesSearch = !idCardSearchTerm || 
      employee.firstName.toLowerCase().includes(idCardSearchTerm.toLowerCase()) ||
      employee.lastName.toLowerCase().includes(idCardSearchTerm.toLowerCase()) ||
      employee.employeeId.toLowerCase().includes(idCardSearchTerm.toLowerCase());
    
    const matchesDepartment = !idCardDepartmentFilter || employee.departmentId === idCardDepartmentFilter;
    
    return matchesSearch && matchesDepartment && employee.status === 'active';
  }) || [];

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
        <div className="flex gap-2">
          <Button variant="secondary" icon={<Plus className="h-4 w-4" />} onClick={handleBulkAddEmployee}>
            Bulk Add
          </Button>
          <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={handleAddEmployee}>
            Add Employee
          </Button>
        </div>
      }
    >
      <div className={`flex gap-6 transition-all duration-300 ease-in-out ${selectedEmployeeForIdCard ? 'h-auto' : 'h-[600px]'}`}>
        {/* Left Column - Employee Overview (1/4) */}
        <div className="w-1/4 transition-all duration-300 ease-in-out">
          <Card className="h-full flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-text-primary">Employee Overview</h3>
              <p className="text-sm text-text-secondary">
                Key metrics and statistics
              </p>
            </div>
            <div className="p-4 flex-1 overflow-hidden">
              <div className="flex flex-col h-full">
                <div className="flex-1 flex items-center justify-between p-4 bg-blue-50 rounded-lg mb-3">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">Total</p>
                      <p className="text-xs text-text-secondary">Employees</p>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-text-primary">{stats?.totalEmployees || 0}</p>
                </div>

                <div className="flex-1 flex items-center justify-between p-4 bg-green-50 rounded-lg mb-3">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <UserCheck className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">Active</p>
                      <p className="text-xs text-text-secondary">Working</p>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-text-primary">{stats?.activeEmployees || 0}</p>
                </div>

                <div className="flex-1 flex items-center justify-between p-4 bg-purple-50 rounded-lg mb-3">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <Building className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">Departments</p>
                      <p className="text-xs text-text-secondary">Total</p>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-text-primary">{stats?.employeesByDepartment?.length || 0}</p>
                </div>

                <div className="flex-1 flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <DollarSign className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">Avg Salary</p>
                      <p className="text-xs text-text-secondary">Monthly</p>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-text-primary">
                    ₱{stats?.averageSalary ? Math.round(stats.averageSalary / 1000).toFixed(0) + 'k' : '0'}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - ID Card Generation (3/4) */}
        <div className="w-3/4 transition-all duration-300 ease-in-out">
          <Card className={`${selectedEmployeeForIdCard ? "h-auto" : "h-full"} flex flex-col`}>
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-text-primary">ID Card Generation</h3>
              <p className="text-sm text-text-secondary">
                Generate and manage employee ID cards with QR codes
              </p>
            </div>
            <div className="p-4 flex-1 overflow-hidden flex flex-col">
              {/* Employee Selection - Fixed Height */}
              <div className="mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">
                      Search Employee
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search by name or employee ID..."
                        value={idCardSearchTerm}
                        onChange={(e) => setIdCardSearchTerm(e.target.value)}
                        className="h-10 pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-button-primary focus:border-transparent text-sm w-full"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">
                      Filter by Department
                    </label>
                    <select 
                      value={idCardDepartmentFilter}
                      onChange={(e) => setIdCardDepartmentFilter(e.target.value)}
                      className="h-10 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-button-primary focus:border-transparent text-sm w-full"
                    >
                      <option value="">All Departments</option>
                      {departments?.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Employee List - Fixed Height */}
              <div className="mb-4">
                <h4 className="text-md font-semibold text-text-primary mb-3">Available Employees</h4>
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {filteredEmployeesForIdCard.slice(0, 6).map((employee) => (
                    <div 
                      key={employee.id} 
                      className={`p-3 border rounded-lg transition-colors cursor-pointer ${
                        selectedEmployeeForIdCard?.id === employee.id 
                          ? 'border-button-primary bg-blue-50' 
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => handleSelectEmployeeForIdCard(employee)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-button-primary rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-xs">
                              {employee.firstName[0]}{employee.lastName[0]}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <p className="text-sm font-semibold text-text-primary">
                                {employee.firstName} {employee.lastName}
                              </p>
                              {employeeHasActiveIdCard(employee.id) && (
                                <Badge variant="success" size="sm">ID Card</Badge>
                              )}
                            </div>
                            <p className="text-xs text-text-secondary">
                              {employee.employeeId} • {employee.departmentName}
                            </p>
                          </div>
                        </div>
                            <Button 
                              variant={employeeHasActiveIdCard(employee.id) ? "secondary" : "primary"}
                              size="sm"
                              onClick={() => {
                                if (!employeeHasActiveIdCard(employee.id)) {
                                  handleGenerateIdCard(employee);
                                }
                              }}
                              disabled={createIdCardMutation.isPending || employeeHasActiveIdCard(employee.id)}
                            >
                              {createIdCardMutation.isPending ? 'Generating...' : 
                               employeeHasActiveIdCard(employee.id) ? 'ID Card Active' : 'Generate ID Card'}
                            </Button>
                      </div>
                    </div>
                  ))}
                  
                  {filteredEmployeesForIdCard.length === 0 && (
                    <div className="text-center py-2">
                      <p className="text-xs text-text-secondary">No employees found.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* ID Card Preview - Expandable Height */}
              {selectedEmployeeForIdCard && (
                <div className="mt-4">
                  <h4 className="text-md font-semibold text-text-primary mb-3">ID Card Preview</h4>
                  <div className="min-h-[200px]">
                  {selectedEmployeeForIdCard ? (
                    <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
                      <div className="flex items-center space-x-4">
                        {/* QR Code - Left Side */}
                        <div className="flex-shrink-0">
                          {qrCodeError ? (
                            <div className="w-32 h-32 bg-red-100 border border-red-300 rounded flex items-center justify-center">
                              <span className="text-sm text-red-600">Error</span>
                            </div>
                          ) : qrCodeData ? (
                            <img 
                              src={qrCodeData.qrCodeImage} 
                              alt="QR Code" 
                              className="w-32 h-32 rounded"
                            />
                          ) : qrCodeLoading ? (
                            <div className="w-32 h-32 bg-gray-200 border border-gray-300 rounded flex items-center justify-center">
                              <span className="text-sm text-gray-500">Loading...</span>
                            </div>
                          ) : (
                            <div className="w-32 h-32 bg-gray-200 border border-gray-300 rounded flex items-center justify-center">
                              <span className="text-sm text-gray-500">Generate ID Card First</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Employee Info - Right Side */}
                        <div className="flex-1">
                          <div className="space-y-1">
                            <h5 className="text-lg font-semibold text-text-primary">
                              {selectedEmployeeForIdCard.firstName} {selectedEmployeeForIdCard.lastName}
                            </h5>
                            <p className="text-sm font-medium text-text-primary">
                              {selectedEmployeeForIdCard.position}
                            </p>
                            <p className="text-sm font-medium text-text-primary">
                              {selectedEmployeeForIdCard.departmentName}
                            </p>
                            <p className="text-sm font-medium text-text-primary">
                              {selectedEmployeeForIdCard.employeeId}
                            </p>
                          </div>
                          
                          {/* Status and Expiry */}
                          <div className="mt-3 flex items-center justify-between">
                            <div className="text-xs text-text-secondary">
                              Expires: {generatedIdCard ? 
                                new Date(generatedIdCard.expiryDate).toLocaleDateString() : 
                                employeeHasActiveIdCard(selectedEmployeeForIdCard.id) ?
                                new Date(getExistingIdCard(selectedEmployeeForIdCard.id)?.expiryDate || '').toLocaleDateString() :
                                new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString()
                              }
                            </div>
                            <Badge variant={qrCodeData ? "success" : "default"}>
                              {qrCodeData ? "Active" : "Not Generated"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      {idCardError && (
                        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                          {idCardError}
                        </div>
                      )}
                      
                      {!qrCodeData && !qrCodeLoading && !idCardError && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-600">
                          <p className="font-medium">No ID Card Generated</p>
                          <p>Click "Generate ID Card" button above to create an ID card for this employee.</p>
                        </div>
                      )}
                      
                      {/* Download/Print Actions */}
                      <div className="mt-4 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={printIdCard}
                          disabled={!qrCodeData || qrCodeLoading}
                        >
                          Print ID Card
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={downloadIdCard}
                          disabled={!qrCodeData || qrCodeLoading}
                        >
                          Download ID Card
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <div className="text-gray-400 mb-4">
                        <Users className="h-12 w-12 mx-auto" />
                      </div>
                      <p className="text-sm text-text-secondary">
                        Select an employee to preview their ID card
                      </p>
                    </div>
                  )}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Employee Directory Section (Full Width Below) */}
      <div className="mt-6">
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
                onChange={(e) => setAddFormData(prev => ({ ...prev, employmentType: e.target.value as 'regular' | 'contractual' | 'jo' }))}
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

      {/* Bulk Add Employee Modal */}
      <Modal
        isOpen={isBulkAddModalOpen}
        onClose={() => setIsBulkAddModalOpen(false)}
        title="Bulk Add Employees from CSV"
        size="xl"
      >
        <form onSubmit={handleBulkFormSubmit} className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">CSV Format Requirements</h4>
            <p className="text-sm text-blue-700 mb-3">
              Your CSV file must include the following columns (case-insensitive):
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm text-blue-700">
              <div>• Email</div>
              <div>• First Name</div>
              <div>• Last Name</div>
              <div>• Department ID</div>
              <div>• Position</div>
              <div>• Employment Type</div>
              <div>• Hire Date</div>
              <div>• Base Salary</div>
            </div>
            <p className="text-xs text-blue-600 mt-3">
              Employment Type must be: regular, contractual, or jo<br/>
              Hire Date format: YYYY-MM-DD<br/>
              Base Salary must be a positive number<br/>
              <strong>Note:</strong> Large CSV files may take several minutes to process
            </p>
          </div>
          
          {bulkFormError && (
            <div className={`p-3 border rounded-md ${
              bulkFormError.includes('Processing CSV file') 
                ? 'bg-blue-50 border-blue-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <p className={`text-sm ${
                bulkFormError.includes('Processing CSV file') 
                  ? 'text-blue-600' 
                  : 'text-red-600'
              }`}>
                {bulkFormError}
              </p>
            </div>
          )}

          {bulkResults && (
            <div className="space-y-3">
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-600">
                  <strong>Processing Complete:</strong> {bulkResults.successCount} successful, {bulkResults.errorCount} failed out of {bulkResults.totalProcessed} total
                </p>
              </div>
              
              {bulkResults.errors.length > 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <h5 className="text-sm font-semibold text-yellow-800 mb-2">Errors Found:</h5>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {bulkResults.errors.map((error, index) => (
                      <div key={index} className="text-xs text-yellow-700">
                        <strong>Row {error.row}:</strong> {error.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Select CSV File
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCSVFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  disabled={isBulkSubmitting}
                />
              </div>
              {csvFile && (
                <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded-md">
                  <p className="text-sm text-gray-700">
                    <strong>Selected:</strong> {csvFile.name} ({(csvFile.size / 1024).toFixed(1)} KB)
                  </p>
                </div>
              )}
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h5 className="text-sm font-semibold text-gray-800">Sample CSV Format:</h5>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const csvContent = `Email,First Name,Last Name,Department ID,Position,Employment Type,Hire Date,Base Salary
john.doe@company.com,John,Doe,dept-123,Software Engineer,regular,2024-01-15,50000
jane.smith@company.com,Jane,Smith,dept-456,HR Manager,regular,2024-02-01,60000
mike.johnson@company.com,Mike,Johnson,dept-789,Marketing Specialist,contractual,2024-02-15,45000
sarah.wilson@company.com,Sarah,Wilson,dept-123,UI/UX Designer,regular,2024-03-01,55000
david.brown@company.com,David,Brown,dept-456,Accountant,regular,2024-03-15,48000`;
                    
                    const blob = new Blob([csvContent], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'employee_bulk_template.csv';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                  }}
                >
                  Download Template
                </Button>
              </div>
              <div className="text-xs text-gray-600 font-mono bg-white p-2 rounded border">
                Email,First Name,Last Name,Department ID,Position,Employment Type,Hire Date,Base Salary<br/>
                john.doe@company.com,John,Doe,dept-123,Software Engineer,regular,2024-01-15,50000<br/>
                jane.smith@company.com,Jane,Smith,dept-456,HR Manager,regular,2024-02-01,60000
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button 
              type="button"
              variant="secondary" 
              onClick={() => setIsBulkAddModalOpen(false)}
              disabled={isBulkSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              variant="primary"
              disabled={isBulkSubmitting || !csvFile}
            >
              {isBulkSubmitting ? 'Processing...' : 'Upload and Create Employees'}
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
                onChange={(e) => setEditFormData(prev => ({ ...prev, employmentType: e.target.value as 'regular' | 'contractual' | 'jo' }))}
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
                onChange={(e) => setEditFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' | 'terminated' | 'on_leave' }))}
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