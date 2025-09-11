import React, { useState, useEffect } from 'react';
import { Calendar, AlertTriangle, CheckCircle, X, Users } from 'lucide-react';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import { useEmployees } from '../../hooks/useEmployees';
// import { useDepartments } from '../../hooks/useDepartments';
import LoadingSpinner from '../shared/LoadingSpinner';

interface YearInitializationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

interface InitializationData {
  vacationDays: number;
  sickDays: number;
  maternityDays: number;
  otherDays: number;
}

const YearInitializationModal: React.FC<YearInitializationModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState<InitializationData>({
    vacationDays: 15,
    sickDays: 10,
    maternityDays: 0,
    otherDays: 0
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: employeesData } = useEmployees();
  // const { data: departments } = useDepartments();
  const employees = employeesData?.employees || [];

  useEffect(() => {
    if (isOpen) {
      setFormData({
        vacationDays: 15,
        sickDays: 10,
        maternityDays: 0,
        otherDays: 0
      });
      setErrors({});
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.vacationDays < 0) {
      newErrors.vacationDays = 'Vacation days cannot be negative';
    }

    if (formData.sickDays < 0) {
      newErrors.sickDays = 'Sick days cannot be negative';
    }

    if (formData.maternityDays < 0) {
      newErrors.maternityDays = 'Maternity days cannot be negative';
    }

    if (formData.otherDays < 0) {
      newErrors.otherDays = 'Other days cannot be negative';
    }

    const totalDays = formData.vacationDays + formData.sickDays + formData.maternityDays + formData.otherDays;
    if (totalDays === 0) {
      newErrors.general = 'At least one leave type must have days allocated';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error initializing year leave balances:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof InitializationData, value: number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: '' }));
    }
  };

  const getTotalDays = () => {
    return formData.vacationDays + formData.sickDays + formData.maternityDays + formData.otherDays;
  };

  const getTotalEmployees = () => {
    return employees?.filter(emp => emp.status === 'active').length || 0;
  };

  const getEstimatedBalances = () => {
    const activeEmployees = getTotalEmployees();
    const leaveTypes = [
      { type: 'vacation', days: formData.vacationDays },
      { type: 'sick', days: formData.sickDays },
      { type: 'maternity', days: formData.maternityDays },
      { type: 'other', days: formData.otherDays }
    ];

    return leaveTypes
      .filter(lt => lt.days > 0)
      .length * activeEmployees;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Initialize Leave Balances"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* General Error */}
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{errors.general}</p>
              </div>
            </div>
          </div>
        )}

        {/* Leave Type Allocations */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Leave Type Allocations</h3>
          
          {/* Vacation Days */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vacation Days
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                min="0"
                step="0.5"
                value={formData.vacationDays}
                onChange={(e) => handleInputChange('vacationDays', parseFloat(e.target.value) || 0)}
                className={`flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.vacationDays ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
                placeholder="Enter vacation days"
              />
              <span className="text-sm text-gray-500">days</span>
            </div>
            {errors.vacationDays && (
              <p className="mt-1 text-sm text-red-600">{errors.vacationDays}</p>
            )}
          </div>

          {/* Sick Days */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sick Days
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                min="0"
                step="0.5"
                value={formData.sickDays}
                onChange={(e) => handleInputChange('sickDays', parseFloat(e.target.value) || 0)}
                className={`flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.sickDays ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
                placeholder="Enter sick days"
              />
              <span className="text-sm text-gray-500">days</span>
            </div>
            {errors.sickDays && (
              <p className="mt-1 text-sm text-red-600">{errors.sickDays}</p>
            )}
          </div>

          {/* Maternity Days */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maternity Days
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                min="0"
                step="0.5"
                value={formData.maternityDays}
                onChange={(e) => handleInputChange('maternityDays', parseFloat(e.target.value) || 0)}
                className={`flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.maternityDays ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
                placeholder="Enter maternity days"
              />
              <span className="text-sm text-gray-500">days</span>
            </div>
            {errors.maternityDays && (
              <p className="mt-1 text-sm text-red-600">{errors.maternityDays}</p>
            )}
          </div>

          {/* Other Days */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Other Days
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                min="0"
                step="0.5"
                value={formData.otherDays}
                onChange={(e) => handleInputChange('otherDays', parseFloat(e.target.value) || 0)}
                className={`flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.otherDays ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
                placeholder="Enter other days"
              />
              <span className="text-sm text-gray-500">days</span>
            </div>
            {errors.otherDays && (
              <p className="mt-1 text-sm text-red-600">{errors.otherDays}</p>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-3">Initialization Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center">
              <Users className="h-4 w-4 text-blue-600 mr-2" />
              <span className="text-blue-800">
                <span className="font-medium">{getTotalEmployees()}</span> active employees
              </span>
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 text-blue-600 mr-2" />
              <span className="text-blue-800">
                <span className="font-medium">{getTotalDays()}</span> total days per employee
              </span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-blue-600 mr-2" />
              <span className="text-blue-800">
                <span className="font-medium">{getEstimatedBalances()}</span> leave balances to create
              </span>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <h4 className="text-sm font-medium text-yellow-800">Important Notice</h4>
              <p className="text-sm text-yellow-700 mt-1">
                This action will create leave balances for all active employees. 
                Existing leave balances will be updated. This action cannot be undone.
              </p>
            </div>
          </div>
        </div>

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
            type="submit"
            variant="primary"
            disabled={isSubmitting || getTotalDays() === 0}
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Initializing...
              </>
            ) : (
              <>
                <Calendar className="h-4 w-4 mr-2" />
                Initialize Leave Balances
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default YearInitializationModal;
