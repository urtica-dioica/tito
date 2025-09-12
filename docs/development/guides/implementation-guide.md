# Frontend Implementation Guide

## 🚀 **Implementation Overview**

This guide provides step-by-step instructions for implementing the TITO HR Management System frontend, following the established patterns and architecture.

## 📋 **Implementation Phases**

### **Phase 1: Foundation Setup**
1. **Project Structure** - Set up folder structure and configuration
2. **Core Infrastructure** - Implement routing, authentication, and API layer
3. **Design System** - Create shared components and styling
4. **Basic Layout** - Implement main layout components

### **Phase 2: Core Features**
1. **Authentication System** - Login, logout, and role-based access
2. **Employee Management** - CRUD operations for employees
3. **Department Management** - Department structure and management
4. **Basic Dashboard** - Role-based dashboard views

### **Phase 3: Advanced Features**
1. **Attendance System** - Clock in/out and attendance tracking
2. **Leave Management** - Leave requests and approval workflow
3. **Payroll System** - Payroll processing and management
4. **Request Management** - Time correction and overtime requests

### **Phase 4: Polish & Optimization**
1. **Performance Optimization** - Code splitting and optimization
2. **Testing** - Unit and integration tests
3. **Accessibility** - WCAG compliance and screen reader support
4. **Documentation** - Component documentation and guides

## 🏗️ **Implementation Steps**

### **Step 1: Project Setup**

```bash
# Install dependencies
npm install

# Install additional packages
npm install @tanstack/react-query axios react-hook-form @hookform/resolvers/zod zod
npm install lucide-react react-router-dom
npm install -D @types/node
```

### **Step 2: Folder Structure**

```
src/
├── components/
│   ├── layout/          # Layout components
│   ├── features/        # Feature-specific components
│   └── shared/          # Reusable UI components
├── pages/               # Page components
├── hooks/               # Custom hooks
├── services/            # API services
├── contexts/            # React contexts
├── types/               # TypeScript types
├── utils/               # Utility functions
└── constants/           # App constants
```

### **Step 3: Core Infrastructure**

#### **API Service Setup**
```typescript
// src/services/api/base.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
});

// Request interceptor for auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

#### **Authentication Context**
```typescript
// src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (email: string, password: string) => {
    // Implementation
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

### **Step 4: Routing Setup**

```typescript
// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/kiosk" element={<KioskInterface />} />
            <Route path="/" element={<ProtectedRoute />}>
              <Route path="hr/*" element={<HRRoutes />} />
              <Route path="dept/*" element={<DepartmentHeadRoutes />} />
              <Route path="employee/*" element={<EmployeeRoutes />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

### **Step 5: Component Implementation**

#### **Shared Components**
Start with basic shared components:

```typescript
// src/components/shared/Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  loading = false,
  disabled = false
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors';
  const variantClasses = {
    primary: 'bg-button-primary text-white hover:bg-button-primary/90',
    secondary: 'bg-button-secondary text-button-secondary border border-button-secondary',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
  };
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? <LoadingSpinner /> : children}
    </button>
  );
};
```

#### **Layout Components**
Implement the main layout structure:

```typescript
// src/components/layout/AppLayout.tsx
const AppLayout: React.FC<{ children: React.ReactNode; role: UserRole }> = ({ children, role }) => {
  return (
    <div className="min-h-screen bg-background-primary">
      <Header role={role} />
      <div className="flex">
        <Sidebar role={role} />
        <main className="flex-1 ml-64">
          <ContentArea>
            {children}
          </ContentArea>
        </main>
      </div>
    </div>
  );
};
```

### **Step 6: Feature Implementation**

#### **Employee Management**
```typescript
// src/hooks/useEmployees.ts
export const useEmployees = (filters?: EmployeeFilters) => {
  return useQuery({
    queryKey: ['employees', filters],
    queryFn: () => employeeService.getEmployees(filters),
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateEmployee = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: employeeService.createEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
};
```

#### **Employee Components**
```typescript
// src/components/features/EmployeeCard.tsx
const EmployeeCard: React.FC<EmployeeCardProps> = ({ employee, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-button-primary rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-lg">
              {employee.firstName[0]}{employee.lastName[0]}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">
              {employee.firstName} {employee.lastName}
            </h3>
            <p className="text-sm text-text-secondary">{employee.employeeId}</p>
          </div>
        </div>
        <Badge variant={employee.status === 'active' ? 'success' : 'default'}>
          {employee.status}
        </Badge>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <span className="text-sm text-text-secondary">Position:</span>
          <span className="text-sm text-text-primary">{employee.position}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-text-secondary">Department:</span>
          <span className="text-sm text-text-primary">{employee.departmentName}</span>
        </div>
      </div>
      
      <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
        <Button variant="secondary" size="sm" onClick={() => onEdit(employee)}>
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>
        <Button variant="danger" size="sm" onClick={() => onDelete(employee)}>
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>
      </div>
    </div>
  );
};
```

## 🎨 **Styling Implementation**

### **Tailwind Configuration**
```typescript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'text-primary': '#0F0F0F',
        'text-secondary': '#DCDCDC',
        'background-primary': '#FAF9EE',
        'background-secondary': '#EEEEEE',
        'button-primary': '#181C14',
        'button-secondary': '#F8FAFC',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
```

### **CSS Variables**
```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-text-primary: #0F0F0F;
  --color-text-secondary: #DCDCDC;
  --color-background-primary: #FAF9EE;
  --color-background-secondary: #EEEEEE;
  --color-button-primary: #181C14;
  --color-button-secondary: #F8FAFC;
}
```

## 🧪 **Testing Setup**

### **Testing Configuration**
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

### **Test Utilities**
```typescript
// src/test/utils.tsx
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

export const renderWithProviders = (
  ui: React.ReactElement,
  options?: RenderOptions
) => {
  const queryClient = createTestQueryClient();
  
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </QueryClientProvider>,
    options
  );
};
```

## 📦 **Build & Deployment**

### **Build Configuration**
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          query: ['@tanstack/react-query'],
        },
      },
    },
  },
});
```

### **Environment Variables**
```bash
# .env.production
VITE_API_URL=https://api.tito-hr.com
VITE_APP_NAME=TITO HR Management System
VITE_APP_VERSION=1.0.0
```

## 🚀 **Deployment Steps**

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Deploy to hosting service**:
   - Upload `dist` folder to web server
   - Configure environment variables
   - Set up SSL certificate
   - Configure domain and DNS

3. **Monitor and maintain**:
   - Set up error tracking
   - Monitor performance
   - Regular backups
   - Security updates

## 📋 **Implementation Checklist**

### **Phase 1: Foundation** ✅
- [ ] Project setup and configuration
- [ ] Folder structure creation
- [ ] Core infrastructure (API, auth, routing)
- [ ] Basic shared components
- [ ] Layout components

### **Phase 2: Core Features** 🔄
- [ ] Authentication system
- [ ] Employee management
- [ ] Department management
- [ ] Role-based dashboards

### **Phase 3: Advanced Features** ⏳
- [ ] Attendance system
- [ ] Leave management
- [ ] Payroll system
- [ ] Request management

### **Phase 4: Polish** ⏳
- [ ] Performance optimization
- [ ] Testing implementation
- [ ] Accessibility compliance
- [ ] Documentation completion

---

**Last Updated**: January 2025  
**Implementation Version**: 1.0.0  
**Status**: Ready for Development
