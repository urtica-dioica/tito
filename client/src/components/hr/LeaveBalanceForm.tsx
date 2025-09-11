import React, { useState, useEffect } from 'react';
import { User, Plus, X } from 'lucide-react';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import { useCreateLeaveBalance, useUpdateLeaveBalance } from '../../hooks/useLeaveBalance';
import { useEmployees } from '../../hooks/useEmployees';
import LoadingSpinner from '../shared/LoadingSpinner';

interface LeaveBalanceFormProps {
  isOpen: boolean;
  onClose: () => void;
  balance?: any;
}

const LeaveBalanceForm: React.FC<LeaveBalanceFormProps> = ({
  isOpen,
  onClose,
  balance
}) => {
  const [formData, setFormData] = useState({
    employeeId: '',
    leaveType: 'vacation' as 'vacation' | 'sick' | 'maternity' | 'other',
    balance: 0
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useCreateLeaveBalance();
  const updateMutation = useUpdateLeaveBalance();
  const { data: employeesData } = useEmployees();
  const employees = employeesData?.employees || [];

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const isEditing = !!balance;

  useEffect(() => {
    if (balance) {
      setFormData({
        employeeId: balance.employeeId,
        leaveType: balance.leaveType,
        balance: balance.balance
      });
    } else {
      setFormData({
        employeeId: '',
        leaveType: 'vacation',
        balance: 0
      });
    }
    setErrors({});
  }, [balance, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.employeeId) {
      newErrors.employeeId = 'Employee is required';
    }

    if (formData.balance < 0) {
      newErrors.balance = 'Leave balance cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          id: balance.id,
          data: {
            balance: formData.balance
          }
        });
      } else {
        await createMutation.mutateAsync({
          employeeId: formData.employeeId,
          leaveType: formData.leaveType,
          balance: formData.balance
        });
      }
      onClose();
    } catch (error) {
      console.error('Error saving leave balance:', error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getLeaveTypeColor = (leaveType: string) => {
    switch (leaveType) {
      case 'vacation': return 'bg-blue-100 text-blue-800';
      case 'sick': return 'bg-green-100 text-green-800';
      case 'maternity': return 'bg-pink-100 text-pink-800';
      case 'other': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLeaveTypeLabel = (leaveType: string) => {
    switch (leaveType) {
      case 'vacation': return 'Vacation';
      case 'sick': return 'Sick';
      case 'maternity': return 'Maternity';
      case 'other': return 'Other';
      default: return leaveType;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Leave Balance' : 'Add Leave Balance'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Employee Selection (only for new balances) */}
        {!isEditing && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Employee *
            </label>
            <div className="relative">
              <User className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <select
                value={formData.employeeId}
                onChange={(e) => handleInputChange('employeeId', e.target.value)}
                className={`w-full pl-10 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.employeeId ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isLoading}
              >
                <option value="">Select an employee</option>
                {employees?.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.employeeId} - {employee.firstName} {employee.lastName}
                  </option>
                ))}
              </select>
            </div>
            {errors.employeeId && (
              <p className="mt-1 text-sm text-red-600">{errors.employeeId}</p>
            )}
          </div>
        )}

        {/* Leave Type Selection (only for new balances) */}
        {!isEditing && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Leave Type *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['vacation', 'sick', 'maternity', 'other'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleInputChange('leaveType', type)}
                  className={`p-3 text-left border rounded-md transition-colors ${
                    formData.leaveType === type
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  disabled={isLoading}
                >
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getLeaveTypeColor(type)}`}>
                    {getLeaveTypeLabel(type)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}


        {/* Balance */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Leave Balance *
          </label>
          <input
            type="number"
            min="0"
            step="0.5"
            value={formData.balance}
            onChange={(e) => handleInputChange('balance', parseFloat(e.target.value) || 0)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.balance ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isLoading}
            placeholder="Enter leave balance"
          />
          {errors.balance && (
            <p className="mt-1 text-sm text-red-600">{errors.balance}</p>
          )}
        </div>

        {/* Available Days Display */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Available Days
          </label>
          <div className="flex items-center p-3 bg-green-50 border border-green-300 rounded-md">
            <span className="text-green-800 font-medium">
              {formData.balance} days
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                {isEditing ? 'Update Balance' : 'Create Balance'}
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default LeaveBalanceForm;
