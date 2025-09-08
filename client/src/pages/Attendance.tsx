import React from 'react';
import { Clock, Calendar, TrendingUp } from 'lucide-react';

const Attendance: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track and manage employee attendance
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Today's Attendance</h3>
              <p className="text-2xl font-bold text-blue-600">42/45</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">This Month</h3>
              <p className="text-2xl font-bold text-green-600">94.5%</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Average Hours</h3>
              <p className="text-2xl font-bold text-purple-600">8.2h</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Attendance Records</h3>
        <p className="text-gray-500">Attendance management features coming soon...</p>
      </div>
    </div>
  );
};

export default Attendance;
