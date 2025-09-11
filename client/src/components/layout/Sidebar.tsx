// Sidebar Component for TITO HR Management System

import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building,
  DollarSign,
  FileText,
  Settings,
  Clock,
  Menu,
  X,
  LogOut,
  User,
  Bell,
  MoreVertical,
  Calendar
} from 'lucide-react';
import type { SidebarProps } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../utils/cn';

const Sidebar: React.FC<SidebarProps> = ({ role, isCollapsed, onToggle, className }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, getUserFullName, getUserInitials } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getMenuItems = (role: string) => {
    switch (role) {
      case 'hr':
        return [
          { path: '/hr/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { path: '/hr/employees', label: 'Employees', icon: Users },
          { path: '/hr/departments', label: 'Departments', icon: Building },
          { path: '/hr/leave-balances', label: 'Leave Balances', icon: Calendar },
          { path: '/hr/payroll', label: 'Payrolls', icon: DollarSign },
          { path: '/hr/requests', label: 'Requests', icon: FileText },
          { path: '/hr/settings', label: 'Settings', icon: Settings },
        ];
      case 'department_head':
        return [
          { path: '/dept/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { path: '/dept/employees', label: 'Employees', icon: Users },
          { path: '/dept/payrolls', label: 'Payrolls', icon: DollarSign },
          { path: '/dept/requests', label: 'Requests', icon: FileText },
        ];
      case 'employee':
        return [
          { path: '/employee/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { path: '/employee/attendance', label: 'Attendance', icon: Clock },
          { path: '/employee/requests', label: 'Requests', icon: FileText },
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems(role);

  return (
    <aside className={cn(
      'bg-background-primary border-r border-gray-200 transition-all duration-300 h-screen fixed left-0 top-0 z-10',
      isCollapsed ? 'w-20' : 'w-64',
      className
    )}>
      <div className="flex flex-col h-full">
        {/* Logo and Toggle Button */}
        <div className={cn("border-b border-gray-200", isCollapsed ? "p-3" : "p-4")}>
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-button-primary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">T</span>
                </div>
                <h1 className="text-xl font-semibold text-text-primary">TITO HR</h1>
              </div>
            )}
            <button
              onClick={onToggle}
              className={cn(
                "rounded-lg hover:bg-gray-100 transition-colors",
                isCollapsed ? "p-2 w-full flex justify-center" : "p-2"
              )}
            >
              {isCollapsed ? (
                <Menu className="h-5 w-5 text-gray-600" />
              ) : (
                <Menu className="h-5 w-5 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className={cn("flex-1", isCollapsed ? "p-2" : "p-4")}>
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <button
                    onClick={() => navigate(item.path)}
                    className={cn(
                      'w-full flex items-center rounded-lg transition-colors',
                      isCollapsed 
                        ? 'justify-center px-2 py-3' 
                        : 'space-x-3 px-3 py-2',
                      isActive
                        ? 'bg-button-primary text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {!isCollapsed && (
                      <span className="font-medium">{item.label}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Profile Section */}
        <div className="border-t border-gray-200">
          {!isCollapsed ? (
            <div className="p-4">
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-button-primary rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {getUserInitials()}
                    </span>
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-sm font-medium text-text-primary">
                      {getUserFullName()}
                    </p>
                    <p className="text-xs text-text-secondary capitalize">
                      {role.replace('_', ' ')}
                    </p>
                  </div>
                  <div className="text-gray-400">
                    {isUserMenuOpen ? (
                      <X className="h-4 w-4" />
                    ) : (
                      <MoreVertical className="h-4 w-4" />
                    )}
                  </div>
                </button>

                {/* User Menu Dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute bottom-full left-0 mb-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>Profile</span>
                    </button>
                    <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center space-x-2">
                      <Bell className="h-4 w-4" />
                      <span>Notifications</span>
                    </button>
                    <hr className="my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-2"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-2">
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="w-full flex items-center justify-center p-3 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-button-primary rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {getUserInitials()}
                    </span>
                  </div>
                </button>

                {/* User Menu Dropdown for collapsed sidebar */}
                {isUserMenuOpen && (
                  <div className="absolute bottom-full left-full ml-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-sm font-medium text-text-primary">
                        {getUserFullName()}
                      </p>
                      <p className="text-xs text-text-secondary capitalize">
                        {role.replace('_', ' ')}
                      </p>
                    </div>
                    <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>Profile</span>
                    </button>
                    <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center space-x-2">
                      <Bell className="h-4 w-4" />
                      <span>Notifications</span>
                    </button>
                    <hr className="my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-2"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* App Version */}
          {!isCollapsed && (
            <div className="px-4 pb-2">
              <div className="text-xs text-gray-500">
                TITO HR v1.0.0
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
