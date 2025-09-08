import React from 'react';
import { Building2, Plus } from 'lucide-react';

const Departments: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage organizational departments
          </p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Department
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center">
            <Building2 className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Engineering</h3>
              <p className="text-sm text-gray-500">15 employees</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <Building2 className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Marketing</h3>
              <p className="text-sm text-gray-500">8 employees</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <Building2 className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Sales</h3>
              <p className="text-sm text-gray-500">12 employees</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <Building2 className="h-8 w-8 text-orange-500" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">HR</h3>
              <p className="text-sm text-gray-500">5 employees</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <Building2 className="h-8 w-8 text-red-500" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Finance</h3>
              <p className="text-sm text-gray-500">6 employees</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <Building2 className="h-8 w-8 text-indigo-500" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Operations</h3>
              <p className="text-sm text-gray-500">9 employees</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Departments;
