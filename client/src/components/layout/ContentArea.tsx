// ContentArea Component for TITO HR Management System

import React from 'react';
import { cn } from '../../utils/cn';

interface ContentAreaProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const ContentArea: React.FC<ContentAreaProps> = ({
  children,
  className,
  padding = 'md'
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6'
  };

  return (
    <div className={cn('flex-1 overflow-auto', paddingClasses[padding], className)}>
      {children}
    </div>
  );
};

export default ContentArea;
