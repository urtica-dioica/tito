// AppLayout Component for TITO HR Management System

import React, { useState } from 'react';
import type { AppLayoutProps } from '../../types';
import Sidebar from './Sidebar';
import { cn } from '../../utils/cn';

const AppLayout: React.FC<AppLayoutProps> = ({ children, role, className }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className={cn('min-h-screen bg-background-primary', className)}>
      <Sidebar 
        role={role} 
        isCollapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
      />
      <main className={cn(
        'bg-background-primary transition-all duration-300 ease-in-out',
        sidebarCollapsed ? 'ml-20' : 'ml-64'
      )}>
        <div className="transition-all duration-300 ease-in-out">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
