# Component Library Overview

## 🧩 **Component Library Documentation**

This document provides a comprehensive overview of the TITO HR Management System component library. The component library is built with React 18 + TypeScript and follows modern design principles with accessibility in mind.

## 📋 **Component Categories**

### **Layout Components**
- **AppLayout**: Main application layout with sidebar and header
- **Header**: Top navigation bar with user menu and notifications
- **Sidebar**: Collapsible navigation sidebar with role-based menu items
- **Footer**: Application footer with links and information

### **Common Components**
- **Button**: Primary, secondary, and variant button components
- **Input**: Text input, select, textarea, and form input components
- **Card**: Container component for content sections
- **Modal**: Dialog and modal components for overlays
- **Table**: Data table with sorting, filtering, and pagination
- **Loading**: Spinner, skeleton, and progress indicators

### **Feature Components**
- **EmployeeCard**: Employee information display component
- **AttendanceCard**: Attendance status and history component
- **LeaveCard**: Leave request and balance component
- **PayrollCard**: Payroll information display component
- **DepartmentCard**: Department information component

### **Form Components**
- **EmployeeForm**: Employee creation and editing form
- **AttendanceForm**: Attendance clock in/out form
- **LeaveRequestForm**: Leave request submission form
- **TimeCorrectionForm**: Time correction request form
- **DepartmentForm**: Department management form

## 🎨 **Design System**

### **Color Palette**
**TITO HR Color System:**
```typescript
const colors = {
  // Text Colors
  text: {
    primary: '#0F0F0F',    // Main font color
    secondary: '#DCDCDC',  // Secondary font color
  },
  
  // Background Colors
  background: {
    primary: '#FAF9EE',    // Main background color
    secondary: '#EEEEEE',  // Secondary background color
  },
  
  // Button Colors
  button: {
    primary: {
      background: '#181C14',  // Primary button background
      text: '#FFFFFF',        // Primary button text (white)
    },
    secondary: {
      background: '#F8FAFC',  // Secondary button background
      text: '#181C14',        // Secondary button text
      border: '#181C14',      // Secondary button border
    },
  },
  
  // Semantic Colors
  semantic: {
    success: '#10b981',    // Green for success states
    warning: '#f59e0b',    // Amber for warnings
    error: '#ef4444',      // Red for errors
    info: '#3b82f6',       // Blue for information
  },
};
```

### **Typography Scale**
```typescript
// Typography configuration
const typography = {
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};
```

### **Spacing System**
```typescript
// Spacing configuration (based on 4px grid)
const spacing = {
  0: '0px',
  1: '0.25rem',  // 4px
  2: '0.5rem',   // 8px
  3: '0.75rem',  // 12px
  4: '1rem',     // 16px
  5: '1.25rem',  // 20px
  6: '1.5rem',   // 24px
  8: '2rem',     // 32px
  10: '2.5rem',  // 40px
  12: '3rem',    // 48px
  16: '4rem',    // 64px
  20: '5rem',    // 80px
  24: '6rem',    // 96px
};
```

### **Border Radius**
```typescript
const borderRadius = {
  none: '0px',
  sm: '0.125rem',   // 2px
  base: '0.25rem',  // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  full: '9999px',
};
```

### **Shadows**
```typescript
const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
};
```

## 🧩 **Component Specifications**

### **Button Component**
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

// Usage examples
<Button variant="primary" size="md">Save Changes</Button>
<Button variant="secondary" size="sm" disabled>Cancel</Button>
<Button variant="danger" loading>Delete</Button>

// Color specifications
const buttonColors = {
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
};
```

### **Input Component**
```typescript
interface InputProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

// Usage examples
<Input 
  type="email" 
  label="Email Address" 
  placeholder="Enter your email"
  required 
/>
<Input 
  type="password" 
  label="Password" 
  error="Password is required"
/>
```

### **Card Component**
```typescript
interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
}

// Usage examples
<Card title="Employee Information" subtitle="John Doe">
  <p>Position: Senior Developer</p>
  <p>Department: Engineering</p>
</Card>
```

### **Table Component**
```typescript
interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  pagination?: PaginationConfig;
  sorting?: SortingConfig;
  filtering?: FilteringConfig;
  onRowClick?: (row: T) => void;
  className?: string;
}

interface Column<T> {
  key: keyof T;
  title: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
}

// Usage example
<Table
  data={employees}
  columns={employeeColumns}
  loading={isLoading}
  pagination={{ page: 1, pageSize: 10 }}
  onRowClick={(employee) => navigate(`/employees/${employee.id}`)}
/>
```

### **Modal Component**
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closable?: boolean;
  className?: string;
}

// Usage examples
<Modal 
  isOpen={isModalOpen} 
  onClose={() => setIsModalOpen(false)}
  title="Add New Employee"
  size="lg"
>
  <EmployeeForm onSubmit={handleSubmit} />
</Modal>
```

## 📱 **Responsive Design**

### **Breakpoint System**
```typescript
const breakpoints = {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop
  '2xl': '1536px', // Extra large desktop
};
```

### **Responsive Component Patterns**
```typescript
// Responsive table that becomes cards on mobile
const ResponsiveTable = ({ data, columns }) => {
  return (
    <>
      {/* Desktop table view */}
      <div className="hidden lg:block">
        <Table data={data} columns={columns} />
      </div>
      
      {/* Mobile card view */}
      <div className="lg:hidden space-y-4">
        {data.map((item) => (
          <Card key={item.id}>
            {/* Render data as cards */}
          </Card>
        ))}
      </div>
    </>
  );
};
```

## ♿ **Accessibility Standards**

### **WCAG 2.1 AA Compliance**
- **Color Contrast**: Minimum 4.5:1 ratio for normal text
- **Keyboard Navigation**: All interactive elements accessible via keyboard
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **Focus Management**: Clear focus indicators and logical tab order

### **Accessibility Features**
```typescript
// Accessible button component
const AccessibleButton = ({ children, ...props }) => {
  return (
    <button
      {...props}
      role="button"
      tabIndex={0}
      aria-disabled={props.disabled}
      className="focus:outline-none focus:ring-2 focus:ring-primary-500"
    >
      {children}
    </button>
  );
};

// Accessible form input
const AccessibleInput = ({ label, error, ...props }) => {
  const id = useId();
  
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        {...props}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
      />
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
```

## 🎨 **Component Styling**

### **Tailwind CSS Classes**
```typescript
// Component class patterns
const componentClasses = {
  button: {
    base: 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
    variants: {
      primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
      secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
      outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-primary-500',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    },
    sizes: {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    },
  },
  input: {
    base: 'block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm',
    error: 'border-red-300 focus:border-red-500 focus:ring-red-500',
    disabled: 'bg-gray-50 text-gray-500 cursor-not-allowed',
  },
  card: {
    base: 'bg-white rounded-lg shadow-sm border border-gray-200',
    padding: {
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    },
  },
};
```

### **CSS-in-JS Alternative**
```typescript
// Styled components approach (if preferred)
import styled from 'styled-components';

const StyledButton = styled.button<ButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  font-weight: 500;
  transition: all 0.2s ease-in-out;
  
  ${({ variant }) => {
    switch (variant) {
      case 'primary':
        return `
          background-color: var(--color-primary-600);
          color: white;
          &:hover { background-color: var(--color-primary-700); }
        `;
      case 'secondary':
        return `
          background-color: var(--color-gray-200);
          color: var(--color-gray-900);
          &:hover { background-color: var(--color-gray-300); }
        `;
      default:
        return '';
    }
  }}
`;
```

## 🧪 **Component Testing**

### **Testing Strategy**
```typescript
// Component testing with React Testing Library
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows loading state', () => {
    render(<Button loading>Click me</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('disabled');
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });
});
```

### **Visual Regression Testing**
```typescript
// Storybook stories for visual testing
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'outline', 'ghost', 'danger'],
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
  },
};

export const Loading: Story = {
  args: {
    variant: 'primary',
    loading: true,
    children: 'Loading Button',
  },
};
```

## 📦 **Component Export Structure**

### **Index File Organization**
```typescript
// src/components/index.ts
// Layout components
export { AppLayout } from './layout/AppLayout';
export { Header } from './layout/Header';
export { Sidebar } from './layout/Sidebar';

// Common components
export { Button } from './common/Button';
export { Input } from './common/Input';
export { Card } from './common/Card';
export { Modal } from './common/Modal';
export { Table } from './common/Table';
export { LoadingSpinner } from './common/LoadingSpinner';

// Feature components
export { EmployeeCard } from './features/EmployeeCard';
export { AttendanceCard } from './features/AttendanceCard';
export { LeaveCard } from './features/LeaveCard';

// Form components
export { EmployeeForm } from './forms/EmployeeForm';
export { AttendanceForm } from './forms/AttendanceForm';
export { LeaveRequestForm } from './forms/LeaveRequestForm';

// Types
export type { ButtonProps } from './common/Button';
export type { InputProps } from './common/Input';
export type { CardProps } from './common/Card';
```

## 🔄 **Component Lifecycle**

### **Development Workflow**
1. **Design**: Create component design in Figma/Sketch
2. **Specification**: Define props interface and behavior
3. **Implementation**: Build component with TypeScript
4. **Testing**: Write unit and integration tests
5. **Documentation**: Create Storybook stories and docs
6. **Review**: Code review and accessibility audit
7. **Integration**: Add to component library and export

### **Versioning Strategy**
- **Major**: Breaking changes to props or behavior
- **Minor**: New features or props (backward compatible)
- **Patch**: Bug fixes and improvements

---

## 📚 **Related Documentation**

- [Layout Components](layout.md) - Layout-specific components
- [Feature Components](features.md) - Business logic components
- [Shared Components](shared.md) - Reusable UI components
- [API Integration Guide](../api/integration.md) - Backend integration
- [Design Patterns Guide](../guides/design-patterns.md) - Implementation patterns

---

**Last Updated**: September 7, 2025  
**Component Library Version**: 1.0.0  
**Status**: Documentation in Progress
