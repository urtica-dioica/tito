# Layout Components Documentation

## 🏗️ **Layout Components Overview**

This document provides comprehensive documentation for all layout components in the TITO HR Management System. Layout components handle the overall structure, navigation, and responsive behavior of the application.

## 📋 **Component Categories**

### **Core Layout Components**
- **AppLayout** - Main application wrapper with role-based layout
- **Header** - Top navigation bar with user menu and notifications
- **Sidebar** - Collapsible navigation sidebar with role-based menu items
- **Footer** - Application footer with links and information
- **PageLayout** - Standard page wrapper with consistent spacing
- **ContentArea** - Main content area with responsive padding

## 🧩 **Component Specifications**

### **AppLayout Component**

**Purpose**: Main application wrapper that provides role-based layout structure.

```typescript
// src/components/layout/AppLayout.tsx
interface AppLayoutProps {
  children: React.ReactNode;
  role: 'hr' | 'department_head' | 'employee';
  className?: string;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, role, className }) => {
  return (
    <div className={`min-h-screen bg-background-primary ${className}`}>
      <Header role={role} />
      <div className="flex">
        <Sidebar role={role} />
        <main className="flex-1 ml-64 lg:ml-64">
          <ContentArea>
            {children}
          </ContentArea>
        </main>
      </div>
    </div>
  );
};
```

**Features**:
- Role-based layout rendering
- Responsive design with mobile support
- Consistent spacing and structure
- Accessibility compliance

**Usage**:
```typescript
<AppLayout role="hr">
  <Dashboard />
</AppLayout>
```

### **Header Component**

**Purpose**: Top navigation bar with user information, notifications, and global actions.

```typescript
// src/components/layout/Header.tsx
interface HeaderProps {
  role: 'hr' | 'department_head' | 'employee';
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ role, className }) => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  return (
    <header className={`h-16 bg-white border-b border-gray-200 ${className}`}>
      <div className="flex items-center justify-between h-full px-6">
        {/* Logo and App Title */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-button-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <h1 className="text-xl font-semibold text-text-primary">TITO HR</h1>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search employees, departments..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-button-primary focus:border-transparent"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>

        {/* Notifications and User Menu */}
        <div className="flex items-center space-x-4">
          <NotificationBell notifications={notifications} />
          <UserMenu user={user} onLogout={logout} />
        </div>
      </div>
    </header>
  );
};
```

**Features**:
- Global search functionality
- Notification system
- User menu with profile and logout
- Responsive design
- Role-based visibility

**Sub-components**:
- `NotificationBell` - Notification dropdown
- `UserMenu` - User profile and actions menu
- `SearchBar` - Global search input

### **Sidebar Component**

**Purpose**: Collapsible navigation sidebar with role-based menu items.

```typescript
// src/components/layout/Sidebar.tsx
interface SidebarProps {
  role: 'hr' | 'department_head' | 'employee';
  isCollapsed?: boolean;
  onToggle?: () => void;
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ role, isCollapsed, onToggle, className }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const getMenuItems = (role: string) => {
    switch (role) {
      case 'hr':
        return [
          { path: '/hr/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { path: '/hr/employees', label: 'Employees', icon: Users },
          { path: '/hr/departments', label: 'Departments', icon: Building },
          { path: '/hr/payrolls', label: 'Payrolls', icon: DollarSign },
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
    <aside className={`bg-white border-r border-gray-200 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    } ${className}`}>
      <div className="flex flex-col h-full">
        {/* Toggle Button */}
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Menu className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <button
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-button-primary text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
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

        {/* Footer */}
        {!isCollapsed && (
          <div className="p-4 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              TITO HR v1.0.0
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
```

**Features**:
- Role-based menu items
- Collapsible design
- Active state indication
- Responsive behavior
- Icon and text labels

**Menu Items by Role**:

**HR Role**:
- Dashboard
- Employees
- Departments
- Payrolls
- Requests
- Settings

**Department Head Role**:
- Dashboard
- Employees (view-only)
- Payrolls (view-only)
- Requests (approval)

**Employee Role**:
- Dashboard
- Attendance
- Requests

### **Footer Component**

**Purpose**: Application footer with links, information, and system status.

```typescript
// src/components/layout/Footer.tsx
interface FooterProps {
  className?: string;
}

const Footer: React.FC<FooterProps> = ({ className }) => {
  return (
    <footer className={`bg-white border-t border-gray-200 ${className}`}>
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <span className="text-sm text-gray-500">
              © 2025 TITO HR Management System
            </span>
            <div className="flex items-center space-x-4">
              <a href="#" className="text-sm text-gray-500 hover:text-gray-700">
                Privacy Policy
              </a>
              <a href="#" className="text-sm text-gray-500 hover:text-gray-700">
                Terms of Service
              </a>
              <a href="#" className="text-sm text-gray-500 hover:text-gray-700">
                Support
              </a>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-500">System Online</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
```

**Features**:
- Copyright information
- Legal links
- System status indicator
- Responsive design

### **PageLayout Component**

**Purpose**: Standard page wrapper with consistent spacing and structure.

```typescript
// src/components/layout/PageLayout.tsx
interface PageLayoutProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const PageLayout: React.FC<PageLayoutProps> = ({
  title,
  subtitle,
  actions,
  children,
  className
}) => {
  return (
    <div className={`min-h-screen bg-background-primary ${className}`}>
      {/* Page Header */}
      {(title || actions) && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-6">
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
        </div>
      )}

      {/* Page Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {children}
      </div>
    </div>
  );
};
```

**Features**:
- Consistent page structure
- Optional title and subtitle
- Action buttons area
- Responsive padding
- Background styling

**Usage**:
```typescript
<PageLayout
  title="Employee Management"
  subtitle="Manage employee records and information"
  actions={
    <Button variant="primary" onClick={handleAddEmployee}>
      Add Employee
    </Button>
  }
>
  <EmployeeTable />
</PageLayout>
```

### **ContentArea Component**

**Purpose**: Main content area with responsive padding and scrolling.

```typescript
// src/components/layout/ContentArea.tsx
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
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  return (
    <div className={`flex-1 overflow-auto ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
};
```

**Features**:
- Responsive padding options
- Overflow handling
- Flexible content area
- Customizable styling

## 🎨 **Styling Guidelines**

### **Color Usage**
```typescript
const layoutColors = {
  background: {
    primary: 'bg-background-primary',    // #FAF9EE
    secondary: 'bg-background-secondary', // #EEEEEE
    white: 'bg-white',
  },
  text: {
    primary: 'text-text-primary',        // #0F0F0F
    secondary: 'text-text-secondary',    // #DCDCDC
  },
  border: {
    light: 'border-gray-200',
    medium: 'border-gray-300',
  },
};
```

### **Spacing System**
```typescript
const spacing = {
  padding: {
    sm: 'p-4',    // 16px
    md: 'p-6',    // 24px
    lg: 'p-8',    // 32px
  },
  margin: {
    sm: 'm-4',    // 16px
    md: 'm-6',    // 24px
    lg: 'm-8',    // 32px
  },
};
```

### **Responsive Breakpoints**
```typescript
const breakpoints = {
  mobile: 'sm:',      // 640px
  tablet: 'md:',      // 768px
  desktop: 'lg:',     // 1024px
  large: 'xl:',       // 1280px
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
- Collapsible sidebar
- Stacked header elements
- Touch-friendly button sizes
- Optimized spacing

### **Tablet Layout**
- Sidebar auto-collapse
- Adjusted padding and margins
- Optimized form layouts
- Touch-optimized interactions

### **Desktop Layout**
- Full sidebar visibility
- Multi-column layouts
- Hover states and interactions
- Keyboard shortcuts

## 🧪 **Testing Guidelines**

### **Unit Tests**
```typescript
// Example test for AppLayout
describe('AppLayout', () => {
  it('renders with correct role-based layout', () => {
    render(<AppLayout role="hr">Test Content</AppLayout>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('applies correct CSS classes for role', () => {
    render(<AppLayout role="employee">Test</AppLayout>);
    // Test role-specific styling
  });
});
```

### **Integration Tests**
- Test layout with different user roles
- Test responsive behavior
- Test navigation functionality
- Test accessibility compliance

## 📦 **Export Structure**

```typescript
// src/components/layout/index.ts
export { AppLayout } from './AppLayout';
export { Header } from './Header';
export { Sidebar } from './Sidebar';
export { Footer } from './Footer';
export { PageLayout } from './PageLayout';
export { ContentArea } from './ContentArea';

// Types
export type { AppLayoutProps } from './AppLayout';
export type { HeaderProps } from './Header';
export type { SidebarProps } from './Sidebar';
export type { FooterProps } from './Footer';
export type { PageLayoutProps } from './PageLayout';
export type { ContentAreaProps } from './ContentArea';
```

---

**Last Updated**: January 2025  
**Component Library Version**: 1.0.0  
**Status**: Ready for Implementation
