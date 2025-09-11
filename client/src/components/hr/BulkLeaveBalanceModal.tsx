import React, { useState, useEffect } from 'react';
import { Upload, Download, X, Plus, Trash2, AlertCircle } from 'lucide-react';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import { useEmployees } from '../../hooks/useEmployees';
import { useDepartments } from '../../hooks/useDepartments';
import LoadingSpinner from '../shared/LoadingSpinner';

interface BulkLeaveBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (balances: any[]) => void;
  departmentId?: string;
}

interface BulkBalanceItem {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: 'vacation' | 'sick' | 'maternity' | 'other';
  balance: number;
}

const BulkLeaveBalanceModal: React.FC<BulkLeaveBalanceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  departmentId
}) => {
  const [balances, setBalances] = useState<BulkBalanceItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: employeesData } = useEmployees();
  const { data: departments } = useDepartments();
  const employees = employeesData?.employees || [];

  // Filter employees by department if specified
  const filteredEmployees = employees.filter(emp => 
    !departmentId || emp.departmentId === departmentId
  );

  useEffect(() => {
    if (isOpen) {
      setBalances([]);
      setErrors({});
    }
  }, [isOpen]);

  const addBalance = () => {
    const newBalance: BulkBalanceItem = {
      id: `temp-${Date.now()}`,
      employeeId: '',
      employeeName: '',
      leaveType: 'vacation',
      balance: 0
    };
    setBalances(prev => [...prev, newBalance]);
  };

  const removeBalance = (id: string) => {
    setBalances(prev => prev.filter(balance => balance.id !== id));
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[id];
      return newErrors;
    });
  };

  const updateBalance = (id: string, field: keyof BulkBalanceItem, value: any) => {
    setBalances(prev => prev.map(balance => {
      if (balance.id === id) {
        const updated = { ...balance, [field]: value };
        
        // Update employee name when employee is selected
        if (field === 'employeeId') {
          const employee = filteredEmployees.find(emp => emp.id === value);
          updated.employeeName = employee ? `${employee.firstName} ${employee.lastName}` : '';
        }
        
        return updated;
      }
      return balance;
    }));

    // Clear error for this field
    if (errors[id]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
    }
  };

  const validateBalances = () => {
    const newErrors: Record<string, string> = {};
    const employeeLeaveTypes = new Set<string>();

    balances.forEach((balance, _index) => {
      const errorKey = `${balance.id}`;
      
      if (!balance.employeeId) {
        newErrors[errorKey] = 'Employee is required';
        return;
      }

      if (balance.balance < 0) {
        newErrors[errorKey] = 'Leave balance cannot be negative';
        return;
      }

      // Check for duplicate employee + leave type combinations
      const key = `${balance.employeeId}-${balance.leaveType}`;
      if (employeeLeaveTypes.has(key)) {
        newErrors[errorKey] = 'Duplicate employee and leave type combination';
        return;
      }
      employeeLeaveTypes.add(key);
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (balances.length === 0) {
      setErrors({ general: 'Please add at least one leave balance' });
      return;
    }

    if (!validateBalances()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const balanceData = balances.map(balance => ({
        employeeId: balance.employeeId,
        leaveType: balance.leaveType,
        balance: balance.balance
      }));

      await onSubmit(balanceData);
    } catch (error) {
      console.error('Error submitting bulk balances:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = [
      ['Employee ID', 'Leave Type', 'Total Days', 'Used Days'],
      ['EMP001', 'vacation', '15', '0'],
      ['EMP001', 'sick', '10', '0'],
      ['EMP002', 'vacation', '15', '0']
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leave-balance-template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // const getLeaveTypeColor = (leaveType: string) => {
  //   switch (leaveType) {
  //     case 'vacation': return 'bg-blue-100 text-blue-800';
  //     case 'sick': return 'bg-green-100 text-green-800';
  //     case 'maternity': return 'bg-pink-100 text-pink-800';
  //     case 'other': return 'bg-gray-100 text-gray-800';
  //     default: return 'bg-gray-100 text-gray-800';
  //   }
  // };

  // const getLeaveTypeLabel = (leaveType: string) => {
  //   switch (leaveType) {
  //     case 'vacation': return 'Vacation';
  //     case 'sick': return 'Sick';
  //     case 'maternity': return 'Maternity';
  //     case 'other': return 'Other';
  //     default: return leaveType;
  //   }
  // };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bulk Update Leave Balances"
      size="xl"
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">
              Add multiple leave balances
              {departmentId && departments && (
                <span className="ml-1">
                  in {departments.find(d => d.id === departmentId)?.name}
                </span>
              )}
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={downloadTemplate}
            >
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={addBalance}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Balance
            </Button>
          </div>
        </div>

        {/* General Error */}
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{errors.general}</p>
              </div>
            </div>
          </div>
        )}

        {/* Balances List */}
        {balances.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <Upload className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No leave balances added</h3>
            <p className="text-gray-600 mb-4">Click "Add Balance" to get started.</p>
            <Button variant="outline" onClick={addBalance}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Balance
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {balances.map((balance, index) => (
              <div key={balance.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-gray-900">
                    Balance #{index + 1}
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeBalance(balance.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {errors[balance.id] && (
                  <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-800">{errors[balance.id]}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Employee Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Employee *
                    </label>
                    <select
                      value={balance.employeeId}
                      onChange={(e) => updateBalance(balance.id, 'employeeId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select employee</option>
                      {filteredEmployees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.employeeId} - {employee.firstName} {employee.lastName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Leave Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Leave Type *
                    </label>
                    <select
                      value={balance.leaveType}
                      onChange={(e) => updateBalance(balance.id, 'leaveType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="vacation">Vacation</option>
                      <option value="sick">Sick</option>
                      <option value="maternity">Maternity</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Balance */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Leave Balance *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={balance.balance}
                      onChange={(e) => updateBalance(balance.id, 'balance', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter leave balance"
                    />
                  </div>
                </div>

                {/* Balance Display */}
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-800">Available Days:</span>
                    <span className="text-sm font-bold text-green-900">
                      {balance.balance} days
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={addBalance}
            disabled={isSubmitting}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Another
          </Button>
          <Button
            onClick={(e) => handleSubmit(e)}
            variant="primary"
            disabled={isSubmitting || balances.length === 0}
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Update {balances.length} Balance{balances.length !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default BulkLeaveBalanceModal;
