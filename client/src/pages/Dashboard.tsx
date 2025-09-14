import React from 'react';
import { useQuery } from '@tanstack/react-query';
// import api from '../lib/api'; // Unused for now
import {
  Users,
  Clock,
  DollarSign,
  Calendar,
  TrendingUp,
  UserCheck,
} from 'lucide-react';

interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  totalDepartments: number;
  pendingLeaves: number;
  monthlyPayroll: number;
  attendanceRate: number;
}

const Dashboard: React.FC = () => {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      // For now, return mock data since we don't have the actual API endpoints yet
      return {
        totalEmployees: 45,
        activeEmployees: 42,
        totalDepartments: 8,
        pendingLeaves: 12,
        monthlyPayroll: 125000,
        attendanceRate: 94.5,
      };
    },
  });

  const statCards = [
    {
      name: 'Total Employees',
      value: stats?.totalEmployees || 0,
      icon: Users,
      color: 'bg-blue-500',
      change: '+2.1%',
      changeType: 'positive' as const,
    },
    {
      name: 'Active Employees',
      value: stats?.activeEmployees || 0,
      icon: UserCheck,
      color: 'bg-green-500',
      change: '+1.2%',
      changeType: 'positive' as const,
    },
    {
      name: 'Departments',
      value: stats?.totalDepartments || 0,
      icon: TrendingUp,
      color: 'bg-purple-500',
      change: '0%',
      changeType: 'neutral' as const,
    },
    {
      name: 'Pending Leaves',
      value: stats?.pendingLeaves || 0,
      icon: Calendar,
      color: 'bg-yellow-500',
      change: '-0.5%',
      changeType: 'negative' as const,
    },
    {
      name: 'Monthly Payroll',
      value: `₱${(stats?.monthlyPayroll || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-indigo-500',
      change: '+3.2%',
      changeType: 'positive' as const,
    },
    {
      name: 'Attendance Rate',
      value: `${stats?.attendanceRate || 0}%`,
      icon: Clock,
      color: 'bg-pink-500',
      change: '+0.8%',
      changeType: 'positive' as const,
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome to Tito HR Management System
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="card">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stat.value}
                      </div>
                      <div
                        className={`ml-2 flex items-baseline text-sm font-semibold ${
                          stat.changeType === 'positive'
                            ? 'text-green-600'
                            : stat.changeType === 'negative'
                            ? 'text-red-600'
                            : 'text-gray-500'
                        }`}
                      >
                        {stat.change}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="h-2 w-2 bg-green-400 rounded-full"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">John Doe checked in</p>
                <p className="text-xs text-gray-500">2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="h-2 w-2 bg-blue-400 rounded-full"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">New employee added: Jane Smith</p>
                <p className="text-xs text-gray-500">1 hour ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="h-2 w-2 bg-yellow-400 rounded-full"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">Leave request submitted by Mike Johnson</p>
                <p className="text-xs text-gray-500">3 hours ago</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <div className="font-medium text-gray-900">Add New Employee</div>
              <div className="text-sm text-gray-500">Create a new employee record</div>
            </button>
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <div className="font-medium text-gray-900">Process Payroll</div>
              <div className="text-sm text-gray-500">Generate monthly payroll</div>
            </button>
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <div className="font-medium text-gray-900">View Attendance Report</div>
              <div className="text-sm text-gray-500">Check attendance statistics</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
