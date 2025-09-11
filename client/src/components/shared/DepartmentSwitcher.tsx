import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface DepartmentSwitcherProps {
  className?: string;
}

const DepartmentSwitcher: React.FC<DepartmentSwitcherProps> = ({ className = '' }) => {
  const [currentDepartment, setCurrentDepartment] = useState<string>('it');
  const [isOpen, setIsOpen] = useState(false);

  const departments = [
    { id: 'it', name: 'Engineering Department', color: 'bg-blue-500' },
    { id: 'hr', name: 'Legal Department', color: 'bg-green-500' },
    { id: 'finance', name: 'Accounting Department', color: 'bg-purple-500' },
  ];

  useEffect(() => {
    // Load current department from localStorage
    const savedDepartment = localStorage.getItem('devDepartmentType');
    if (savedDepartment) {
      setCurrentDepartment(savedDepartment);
    }
  }, []);

  const handleDepartmentChange = (departmentId: string) => {
    setCurrentDepartment(departmentId);
    localStorage.setItem('devDepartmentType', departmentId);
    setIsOpen(false);
    
    // Reload the page to apply the new department context
    window.location.reload();
  };

  const currentDept = departments.find(d => d.id === currentDepartment);

  // Only show in development mode
  if (import.meta.env.PROD) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
      >
        <div className={`w-3 h-3 rounded-full ${currentDept?.color || 'bg-gray-500'}`} />
        <span className="text-sm font-medium text-gray-700">
          {currentDept?.name || 'Select Department'}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-2">
            <div className="text-xs font-medium text-gray-500 mb-2 px-2">
              Switch Department (Dev Mode)
            </div>
            {departments.map((dept) => (
              <button
                key={dept.id}
                onClick={() => handleDepartmentChange(dept.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-gray-50 transition-colors ${
                  currentDepartment === dept.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className={`w-3 h-3 rounded-full ${dept.color}`} />
                <span className="text-sm text-gray-700">{dept.name}</span>
                {currentDepartment === dept.id && (
                  <span className="text-xs text-blue-600 ml-auto">Current</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentSwitcher;
