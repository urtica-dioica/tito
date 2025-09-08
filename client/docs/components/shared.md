# Shared Components Documentation

## 🔧 **Shared Components Overview**

This document provides comprehensive documentation for all shared UI components in the TITO HR Management System. Shared components are reusable UI elements that provide consistent styling and behavior across the application.

## 📋 **Component Categories**

### **Form Components**
- **Button** - Primary, secondary, and variant button components
- **Input** - Text input, select, textarea, and form input components
- **Checkbox** - Checkbox input with label
- **Radio** - Radio button input with label
- **Switch** - Toggle switch component
- **Select** - Dropdown select component
- **DatePicker** - Date selection component
- **TimePicker** - Time selection component

### **Display Components**
- **Card** - Container component for content sections
- **Badge** - Status and label indicators
- **Avatar** - User avatar with initials or image
- **Tooltip** - Hover tooltip component
- **Alert** - Success, warning, error, and info alerts
- **Progress** - Progress bar and loading indicators
- **Skeleton** - Loading skeleton components

### **Navigation Components**
- **Breadcrumb** - Navigation breadcrumb trail
- **Pagination** - Table and list pagination
- **Tabs** - Tab navigation component
- **Accordion** - Collapsible content sections
- **Menu** - Dropdown menu component

### **Feedback Components**
- **Modal** - Dialog and modal components
- **Drawer** - Side drawer component
- **Toast** - Notification toast messages
- **LoadingSpinner** - Loading spinner component
- **EmptyState** - Empty state placeholder

### **Data Display Components**
- **Table** - Data table with sorting, filtering, and pagination
- **List** - List component with various layouts
- **Grid** - Responsive grid layout
- **Chart** - Data visualization components
- **Calendar** - Calendar display component

## 🧩 **Component Specifications**

### **Button Component**

**Purpose**: Versatile button component with multiple variants and states.

```typescript
// src/components/shared/Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

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
    secondary: 'bg-button-secondary text-button-secondary border border-button-secondary hover:bg-gray-50 focus:ring-button-secondary',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-button-primary',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-button-primary',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

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
```

**Features**:
- Multiple variants (primary, secondary, outline, ghost, danger)
- Three sizes (sm, md, lg)
- Loading state with spinner
- Icon support (left/right positioning)
- Disabled state
- Focus and hover states
- Accessibility compliance

**Usage Examples**:
```typescript
// Primary button
<Button variant="primary" onClick={handleSave}>
  Save Changes
</Button>

// Secondary button with icon
<Button variant="secondary" icon={<Plus className="h-4 w-4" />}>
  Add Employee
</Button>

// Loading button
<Button variant="primary" loading>
  Processing...
</Button>

// Danger button
<Button variant="danger" onClick={handleDelete}>
  Delete
</Button>
```

### **Input Component**

**Purpose**: Form input component with validation and error states.

```typescript
// src/components/shared/Input.tsx
interface InputProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  id?: string;
  name?: string;
  autoComplete?: string;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const Input: React.FC<InputProps> = ({
  type = 'text',
  label,
  placeholder,
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  className = '',
  id,
  name,
  autoComplete,
  maxLength,
  minLength,
  pattern,
  icon,
  iconPosition = 'left'
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  const baseClasses = 'block w-full rounded-md border-gray-300 shadow-sm focus:border-button-primary focus:ring-button-primary sm:text-sm';
  const errorClasses = 'border-red-300 focus:border-red-500 focus:ring-red-500';
  const disabledClasses = 'bg-gray-50 text-gray-500 cursor-not-allowed';
  const iconClasses = iconPosition === 'left' ? 'pl-10' : 'pr-10';

  const inputClasses = `${baseClasses} ${error ? errorClasses : ''} ${disabled ? disabledClasses : ''} ${icon ? iconClasses : ''} ${className}`;

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-text-primary">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && iconPosition === 'left' && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400">{icon}</span>
          </div>
        )}
        <input
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          maxLength={maxLength}
          minLength={minLength}
          pattern={pattern}
          className={inputClasses}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
        />
        {icon && iconPosition === 'right' && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-400">{icon}</span>
          </div>
        )}
      </div>
      {error && (
        <p id={`${inputId}-error`} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
```

**Features**:
- Multiple input types
- Label and placeholder support
- Error state with validation messages
- Required field indication
- Icon support (left/right positioning)
- Accessibility compliance
- Disabled state
- Auto-complete support

### **Card Component**

**Purpose**: Container component for grouping related content.

```typescript
// src/components/shared/Card.tsx
interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  border?: boolean;
  hover?: boolean;
}

const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  children,
  actions,
  className = '',
  padding = 'md',
  shadow = 'sm',
  border = true,
  hover = false
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
  };

  const baseClasses = 'bg-white rounded-lg';
  const borderClass = border ? 'border border-gray-200' : '';
  const hoverClass = hover ? 'hover:shadow-md transition-shadow' : '';

  const classes = `${baseClasses} ${borderClass} ${shadowClasses[shadow]} ${hoverClass} ${className}`;

  return (
    <div className={classes}>
      {(title || subtitle || actions) && (
        <div className="border-b border-gray-200 pb-4 mb-4">
          <div className="flex items-start justify-between">
            <div>
              {title && (
                <h3 className="text-lg font-semibold text-text-primary">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-text-secondary">
                  {subtitle}
                </p>
              )}
            </div>
            {actions && (
              <div className="flex items-center space-x-2">
                {actions}
              </div>
            )}
          </div>
        </div>
      )}
      <div className={paddingClasses[padding]}>
        {children}
      </div>
    </div>
  );
};
```

**Features**:
- Optional title and subtitle
- Action buttons area
- Configurable padding
- Shadow and border options
- Hover effects
- Flexible content area

### **Modal Component**

**Purpose**: Modal dialog component for overlays and forms.

```typescript
// src/components/shared/Modal.tsx
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closable?: boolean;
  className?: string;
  footer?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closable = true,
  className = '',
  footer
}) => {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closable) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, closable, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={closable ? onClose : undefined}
        />

        {/* Modal */}
        <div className={`relative bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]} ${className}`}>
          {/* Header */}
          {(title || closable) && (
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              {title && (
                <h3 className="text-lg font-semibold text-text-primary">
                  {title}
                </h3>
              )}
              {closable && (
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
```

**Features**:
- Backdrop click to close
- Escape key to close
- Multiple sizes
- Optional header and footer
- Body scroll lock
- Focus management
- Accessibility compliance

### **Table Component**

**Purpose**: Data table with sorting, filtering, and pagination.

```typescript
// src/components/shared/Table.tsx
interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  pagination?: PaginationConfig;
  sorting?: SortingConfig;
  filtering?: FilteringConfig;
  onRowClick?: (row: T) => void;
  className?: string;
  emptyState?: React.ReactNode;
}

interface Column<T> {
  key: keyof T | string;
  title: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface PaginationConfig {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

interface SortingConfig {
  field: string;
  direction: 'asc' | 'desc';
  onSort: (field: string, direction: 'asc' | 'desc') => void;
}

const Table = <T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  pagination,
  sorting,
  onRowClick,
  className = '',
  emptyState
}: TableProps<T>) => {
  const handleSort = (field: string) => {
    if (!sorting) return;
    
    const direction = sorting.field === field && sorting.direction === 'asc' ? 'desc' : 'asc';
    sorting.onSort(field, direction);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-8 text-center">
          <LoadingSpinner />
          <p className="mt-2 text-sm text-text-secondary">Loading data...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {emptyState || (
          <div className="p-8 text-center">
            <div className="text-gray-400 mb-4">
              <FileText className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-text-primary mb-2">No data available</h3>
            <p className="text-sm text-text-secondary">There are no records to display.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                  } ${column.width ? `w-${column.width}` : ''}`}
                  onClick={() => column.sortable && handleSort(String(column.key))}
                >
                  <div className={`flex items-center space-x-1 ${
                    column.align === 'center' ? 'justify-center' : 
                    column.align === 'right' ? 'justify-end' : ''
                  }`}>
                    <span>{column.title}</span>
                    {column.sortable && (
                      <div className="flex flex-col">
                        <ChevronUp className={`h-3 w-3 ${
                          sorting?.field === column.key && sorting?.direction === 'asc' 
                            ? 'text-button-primary' : 'text-gray-400'
                        }`} />
                        <ChevronDown className={`h-3 w-3 ${
                          sorting?.field === column.key && sorting?.direction === 'desc' 
                            ? 'text-button-primary' : 'text-gray-400'
                        }`} />
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, index) => (
              <tr
                key={index}
                className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => (
                  <td
                    key={String(column.key)}
                    className={`px-6 py-4 whitespace-nowrap text-sm ${
                      column.align === 'center' ? 'text-center' : 
                      column.align === 'right' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {column.render 
                      ? column.render(row[column.key], row)
                      : row[column.key]
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="px-6 py-3 border-t border-gray-200">
          <Pagination {...pagination} />
        </div>
      )}
    </div>
  );
};
```

**Features**:
- Generic type support
- Sortable columns
- Custom cell rendering
- Pagination support
- Loading states
- Empty state handling
- Row click handling
- Responsive design

### **Badge Component**

**Purpose**: Status and label indicators with color coding.

```typescript
// src/components/shared/Badge.tsx
interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'md',
  children,
  className = '',
  dot = false
}) => {
  const baseClasses = 'inline-flex items-center rounded-full font-medium';
  
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
    lg: 'px-3 py-1 text-base',
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  return (
    <span className={classes}>
      {dot && <div className="w-2 h-2 bg-current rounded-full mr-1" />}
      {children}
    </span>
  );
};
```

**Features**:
- Multiple variants (default, success, warning, error, info)
- Three sizes (sm, md, lg)
- Optional dot indicator
- Color-coded status display

### **LoadingSpinner Component**

**Purpose**: Loading spinner with different sizes and colors.

```typescript
// src/components/shared/LoadingSpinner.tsx
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'white';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  const colorClasses = {
    primary: 'text-button-primary',
    secondary: 'text-gray-600',
    white: 'text-white',
  };

  const classes = `animate-spin ${sizeClasses[size]} ${colorClasses[color]} ${className}`;

  return (
    <svg className={classes} fill="none" viewBox="0 0 24 24">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};
```

**Features**:
- Three sizes (sm, md, lg)
- Multiple colors (primary, secondary, white)
- Smooth animation
- Customizable styling

## 🎨 **Styling Guidelines**

### **Color System**
```typescript
const sharedColors = {
  primary: {
    background: '#181C14',
    text: '#FFFFFF',
    hover: '#2A2F26',
  },
  secondary: {
    background: '#F8FAFC',
    text: '#181C14',
    border: '#181C14',
    hover: '#F1F5F9',
  },
  status: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
};
```

### **Spacing System**
```typescript
const spacing = {
  padding: {
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
  },
  margin: {
    sm: 'm-2',
    md: 'm-4',
    lg: 'm-6',
  },
  gap: {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
  },
};
```

### **Typography Scale**
```typescript
const typography = {
  text: {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  },
  weight: {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  },
};
```

## ♿ **Accessibility Features**

### **Keyboard Navigation**
- All interactive elements are keyboard accessible
- Tab order follows logical flow
- Focus indicators are clearly visible
- Escape key closes modals and dropdowns

### **Screen Reader Support**
- Proper ARIA labels and roles
- Semantic HTML structure
- Descriptive alt text for icons
- Live regions for dynamic content

### **Color Contrast**
- Minimum 4.5:1 contrast ratio
- High contrast mode support
- Color-blind friendly palette
- Alternative indicators beyond color

## 📱 **Responsive Behavior**

### **Mobile Layout**
- Touch-friendly button sizes (44px minimum)
- Optimized spacing and padding
- Horizontal scrolling for tables
- Stacked form layouts

### **Tablet Layout**
- Adjusted component sizes
- Optimized spacing
- Touch-optimized interactions
- Responsive grid layouts

### **Desktop Layout**
- Full component visibility
- Hover states and interactions
- Keyboard shortcuts
- Multi-column layouts

## 🧪 **Testing Guidelines**

### **Unit Tests**
```typescript
// Example test for Button component
describe('Button', () => {
  it('renders with correct variant classes', () => {
    render(<Button variant="primary">Click me</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-button-primary');
  });

  it('shows loading state', () => {
    render(<Button loading>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### **Integration Tests**
- Test component interactions
- Test form submissions
- Test modal behavior
- Test table functionality

## 📦 **Export Structure**

```typescript
// src/components/shared/index.ts
// Form Components
export { Button } from './Button';
export { Input } from './Input';
export { Checkbox } from './Checkbox';
export { Radio } from './Radio';
export { Switch } from './Switch';
export { Select } from './Select';
export { DatePicker } from './DatePicker';
export { TimePicker } from './TimePicker';

// Display Components
export { Card } from './Card';
export { Badge } from './Badge';
export { Avatar } from './Avatar';
export { Tooltip } from './Tooltip';
export { Alert } from './Alert';
export { Progress } from './Progress';
export { Skeleton } from './Skeleton';

// Navigation Components
export { Breadcrumb } from './Breadcrumb';
export { Pagination } from './Pagination';
export { Tabs } from './Tabs';
export { Accordion } from './Accordion';
export { Menu } from './Menu';

// Feedback Components
export { Modal } from './Modal';
export { Drawer } from './Drawer';
export { Toast } from './Toast';
export { LoadingSpinner } from './LoadingSpinner';
export { EmptyState } from './EmptyState';

// Data Display Components
export { Table } from './Table';
export { List } from './List';
export { Grid } from './Grid';
export { Chart } from './Chart';
export { Calendar } from './Calendar';

// Types
export type { ButtonProps } from './Button';
export type { InputProps } from './Input';
export type { CardProps } from './Card';
export type { ModalProps } from './Modal';
export type { TableProps } from './Table';
export type { BadgeProps } from './Badge';
```

---

**Last Updated**: January 2025  
**Component Library Version**: 1.0.0  
**Status**: Ready for Implementation
