// Button Component for TITO HR Management System

import React from 'react';
import type { ButtonProps } from '../../types';
import { cn } from '../../utils/cn';
import LoadingSpinner from './LoadingSpinner';

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  children,
  onClick,
  type = 'button',
  className = '',
  icon,
  iconPosition = 'left'
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-button-primary text-white hover:bg-button-primary/90 focus:ring-button-primary',
    secondary: 'bg-button-secondary text-text-primary border border-gray-200 hover:bg-gray-50 focus:ring-button-primary',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-button-primary',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-button-primary',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const classes = cn(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    className
  );

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? (
        <LoadingSpinner size="sm" className="mr-2" />
      ) : (
        icon && iconPosition === 'left' && <span className="mr-2">{icon}</span>
      )}
      {children}
      {!loading && icon && iconPosition === 'right' && <span className="ml-2">{icon}</span>}
    </button>
  );
};


export default Button;
