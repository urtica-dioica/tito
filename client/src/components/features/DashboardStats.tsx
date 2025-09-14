// Dashboard Stats Component for TITO HR Management System

import React from 'react';
import { Users, Building, FileText, DollarSign, Clock, TrendingUp } from 'lucide-react';
import { Card } from '../shared';
import type { DashboardStats } from '../../types';

interface DashboardStatsProps {
  stats: DashboardStats;
  loading?: boolean;
}

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}> = ({ title, value, icon, color, trend }) => (
  <Card>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-text-secondary">{title}</p>
        <p className="text-2xl font-bold text-text-primary">{value}</p>
        {trend && (
          <div className={`flex items-center mt-1 text-sm ${
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            <TrendingUp className={`h-4 w-4 mr-1 ${
              trend.isPositive ? '' : 'rotate-180'
            }`} />
            {trend.value}%
          </div>
        )}
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        {icon}
      </div>
    </div>
  </Card>
);

const DashboardStatsComponent: React.FC<DashboardStatsProps> = ({ stats, loading = false }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
      <StatCard
        title="Total Employees"
        value={stats.totalEmployees}
        icon={<Users className="h-6 w-6 text-white" />}
        color="bg-blue-500"
        trend={{ value: 5.2, isPositive: true }}
      />
      
      <StatCard
        title="Active Employees"
        value={stats.activeEmployees}
        icon={<Users className="h-6 w-6 text-white" />}
        color="bg-green-500"
        trend={{ value: 2.1, isPositive: true }}
      />
      
      <StatCard
        title="Departments"
        value={stats.totalDepartments}
        icon={<Building className="h-6 w-6 text-white" />}
        color="bg-purple-500"
      />
      
      <StatCard
        title="Pending Requests"
        value={stats.pendingRequests}
        icon={<FileText className="h-6 w-6 text-white" />}
        color="bg-yellow-500"
        trend={{ value: -3.2, isPositive: false }}
      />
      
      <StatCard
        title="Today's Attendance"
        value={stats.todayAttendance}
        icon={<Clock className="h-6 w-6 text-white" />}
        color="bg-indigo-500"
        trend={{ value: 1.8, isPositive: true }}
      />
      
      <StatCard
        title="Monthly Payroll"
        value={`₱${stats.monthlyPayroll.toLocaleString()}`}
        icon={<DollarSign className="h-6 w-6 text-white" />}
        color="bg-emerald-500"
        trend={{ value: 4.5, isPositive: true }}
      />
    </div>
  );
};

export default DashboardStatsComponent;
