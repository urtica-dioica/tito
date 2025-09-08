// PageLayout Component for TITO HR Management System

import React from 'react';
import type { PageLayoutProps } from '../../types';
import { cn } from '../../utils/cn';

const PageLayout: React.FC<PageLayoutProps> = ({
  title,
  subtitle,
  actions,
  children,
  className
}) => {
  return (
    <div className={cn('h-full transition-all duration-300 ease-in-out', className)}>
      {/* Page Header */}
      {(title || actions) && (
        <div className="px-6 py-6 transition-all duration-300 ease-in-out">
          <div className="flex items-center justify-between">
            <div>
              {title && (
                <h1 className="text-2xl font-bold text-text-primary">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-text-secondary">
                  {subtitle}
                </p>
              )}
            </div>
            {actions && (
              <div className="flex items-center space-x-3">
                {actions}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Page Content */}
      <div className="px-6 py-6 transition-all duration-300 ease-in-out">
        {children}
      </div>
    </div>
  );
};

export default PageLayout;
