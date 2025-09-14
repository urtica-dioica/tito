import React from 'react';
import { DollarSign, Users, Calendar, FileText } from 'lucide-react';

const Payroll: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payroll</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage employee payroll and compensation
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Total Payroll</h3>
              <p className="text-2xl font-bold text-green-600">₱125,000</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Employees Paid</h3>
              <p className="text-2xl font-bold text-blue-600">42</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Current Period</h3>
              <p className="text-2xl font-bold text-purple-600">Sep 2024</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-orange-500" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Pending</h3>
              <p className="text-2xl font-bold text-orange-600">3</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Payroll Management</h3>
        <p className="text-gray-500">Payroll processing features coming soon...</p>
      </div>
    </div>
  );
};

export default Payroll;
