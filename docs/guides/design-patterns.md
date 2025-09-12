# Design Patterns Guide

## 🎨 **Design Patterns Overview**

This document provides comprehensive guidance on design patterns, architectural principles, and best practices for the TITO HR Management System frontend. These patterns ensure consistency, maintainability, and scalability across the application.

## 📋 **Table of Contents**

- [Architectural Patterns](#architectural-patterns)
- [Component Patterns](#component-patterns)
- [State Management Patterns](#state-management-patterns)
- [Data Fetching Patterns](#data-fetching-patterns)
- [Form Handling Patterns](#form-handling-patterns)
- [Error Handling Patterns](#error-handling-patterns)
- [Performance Patterns](#performance-patterns)
- [Accessibility Patterns](#accessibility-patterns)
- [Testing Patterns](#testing-patterns)
- [Code Organization Patterns](#code-organization-patterns)

---

## 🏗️ **Architectural Patterns**

### **1. Component-Based Architecture**

**Pattern**: Modular component design with clear separation of concerns.

```typescript
// Component hierarchy structure
App
├── Layout
│   ├── Header
│   ├── Sidebar
│   └── Footer
├── Pages
│   ├── Dashboard
│   ├── Employees
│   └── Attendance
└── Components
    ├── Shared (Button, Input, Table)
    ├── Features (EmployeeCard, AttendanceForm)
    └── Layout (PageLayout, ContentArea)
```

**Implementation**:
```typescript
// src/components/layout/AppLayout.tsx
interface AppLayoutProps {
  children: React.ReactNode;
  role: UserRole;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, role }) => {
  return (
    <div className="min-h-screen bg-background-primary">
      <Header role={role} />
      <div className="flex">
        <Sidebar role={role} />
        <main className="flex-1">
          <ContentArea>
            {children}
          </ContentArea>
        </main>
      </div>
    </div>
  );
};
```

**Benefits**:
- Reusable components
- Clear separation of concerns
- Easy testing and maintenance
- Consistent UI/UX

### **2. Container/Presentational Pattern**

**Pattern**: Separation of logic (containers) from presentation (components).

```typescript
// Container Component (Logic)
// src/containers/EmployeeContainer.tsx
const EmployeeContainer: React.FC = () => {
  const { data: employees, loading, error } = useEmployees();
  const { mutate: deleteEmployee } = useDeleteEmployee();

  const handleDelete = (employee: Employee) => {
    if (confirm('Are you sure you want to delete this employee?')) {
      deleteEmployee(employee.id);
    }
  };

  return (
    <EmployeeList
      employees={employees || []}
      loading={loading}
      error={error}
      onDelete={handleDelete}
    />
  );
};

// Presentational Component (UI)
// src/components/EmployeeList.tsx
interface EmployeeListProps {
  employees: Employee[];
  loading: boolean;
  error: Error | null;
  onDelete: (employee: Employee) => void;
}

const EmployeeList: React.FC<EmployeeListProps> = ({
  employees,
  loading,
  error,
  onDelete
}) => {
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {employees.map((employee) => (
        <EmployeeCard
          key={employee.id}
          employee={employee}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};
```

**Benefits**:
- Clear separation of concerns
- Reusable presentational components
- Easy testing of business logic
- Better code organization

### **3. Higher-Order Component (HOC) Pattern**

**Pattern**: Function that takes a component and returns a new component with additional functionality.

```typescript
// HOC for role-based access control
// src/hocs/withRole.tsx
interface WithRoleProps {
  allowedRoles: UserRole[];
  fallback?: React.ReactNode;
}

const withRole = <P extends object>(
  Component: React.ComponentType<P>,
  { allowedRoles, fallback = <AccessDenied /> }: WithRoleProps
) => {
  return (props: P) => {
    const { user } = useAuth();
    
    if (!user || !allowedRoles.includes(user.role)) {
      return <>{fallback}</>;
    }
    
    return <Component {...props} />;
  };
};

// Usage
const HRDashboard = withRole(Dashboard, { 
  allowedRoles: ['hr'] 
});

const DepartmentHeadDashboard = withRole(Dashboard, { 
  allowedRoles: ['department_head'] 
});
```

**Benefits**:
- Reusable access control logic
- Clean component composition
- Easy to test and maintain
- Consistent authorization

---

## 🧩 **Component Patterns**

### **1. Compound Component Pattern**

**Pattern**: Components that work together to form a complete UI element.

```typescript
// src/components/shared/Modal.tsx
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> & {
  Header: React.FC<ModalHeaderProps>;
  Body: React.FC<ModalBodyProps>;
  Footer: React.FC<ModalFooterProps>;
} = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg">
          {children}
        </div>
      </div>
    </div>
  );
};

// Sub-components
const ModalHeader: React.FC<ModalHeaderProps> = ({ children, onClose }) => (
  <div className="flex items-center justify-between p-6 border-b border-gray-200">
    <h3 className="text-lg font-semibold">{children}</h3>
    {onClose && (
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
        <X className="h-6 w-6" />
      </button>
    )}
  </div>
);

const ModalBody: React.FC<ModalBodyProps> = ({ children }) => (
  <div className="p-6">{children}</div>
);

const ModalFooter: React.FC<ModalFooterProps> = ({ children }) => (
  <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
    {children}
  </div>
);

// Attach sub-components
Modal.Header = ModalHeader;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;

// Usage
<Modal isOpen={isOpen} onClose={onClose}>
  <Modal.Header onClose={onClose}>
    Add New Employee
  </Modal.Header>
  <Modal.Body>
    <EmployeeForm onSubmit={handleSubmit} />
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={onClose}>Cancel</Button>
    <Button variant="primary" onClick={handleSubmit}>Save</Button>
  </Modal.Footer>
</Modal>
```

**Benefits**:
- Flexible component composition
- Intuitive API design
- Reusable sub-components
- Better developer experience

### **2. Render Props Pattern**

**Pattern**: Component that uses a function as a child to share data.

```typescript
// src/components/shared/DataProvider.tsx
interface DataProviderProps<T> {
  url: string;
  children: (data: {
    data: T | null;
    loading: boolean;
    error: Error | null;
    refetch: () => void;
  }) => React.ReactNode;
}

const DataProvider = <T,>({ url, children }: DataProviderProps<T>) => {
  const { data, loading, error, refetch } = useQuery<T>(url);

  return <>{children({ data, loading, error, refetch })}</>;
};

// Usage
<DataProvider<Employee[]> url="/api/employees">
  {({ data: employees, loading, error, refetch }) => {
    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage error={error} />;
    
    return (
      <div>
        <button onClick={refetch}>Refresh</button>
        <EmployeeList employees={employees || []} />
      </div>
    );
  }}
</DataProvider>
```

**Benefits**:
- Flexible data sharing
- Reusable data logic
- Component composition
- Easy testing

### **3. Custom Hook Pattern**

**Pattern**: Extract component logic into reusable custom hooks.

```typescript
// src/hooks/useEmployeeForm.ts
interface UseEmployeeFormProps {
  initialData?: Partial<Employee>;
  onSubmit: (data: CreateEmployeeRequest) => void;
}

const useEmployeeForm = ({ initialData, onSubmit }: UseEmployeeFormProps) => {
  const [formData, setFormData] = useState<CreateEmployeeRequest>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    departmentId: '',
    position: '',
    employmentType: 'regular',
    hireDate: '',
    baseSalary: 0,
    ...initialData
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';
    if (!formData.departmentId) newErrors.departmentId = 'Department is required';
    if (!formData.position) newErrors.position = 'Position is required';
    if (!formData.hireDate) newErrors.hireDate = 'Hire date is required';
    if (formData.baseSalary <= 0) newErrors.baseSalary = 'Base salary must be greater than 0';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const updateField = (field: keyof CreateEmployeeRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return {
    formData,
    errors,
    updateField,
    handleSubmit,
    validateForm
  };
};

// Usage in component
const EmployeeForm: React.FC<EmployeeFormProps> = ({ onSubmit, initialData }) => {
  const { formData, errors, updateField, handleSubmit } = useEmployeeForm({
    initialData,
    onSubmit
  });

  return (
    <form onSubmit={handleSubmit}>
      <Input
        label="Email"
        value={formData.email}
        onChange={(value) => updateField('email', value)}
        error={errors.email}
        required
      />
      {/* Other form fields */}
    </form>
  );
};
```

**Benefits**:
- Reusable logic
- Easy testing
- Clean component code
- Better separation of concerns

---

## 🔄 **State Management Patterns**

### **1. Context + Reducer Pattern**

**Pattern**: Use React Context with useReducer for complex state management.

```typescript
// src/contexts/AppStateContext.tsx
interface AppState {
  notifications: Notification[];
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
  loading: boolean;
}

type AppAction =
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'SET_LOADING'; payload: boolean };

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [...state.notifications, action.payload]
      };
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload)
      };
    case 'TOGGLE_SIDEBAR':
      return {
        ...state,
        sidebarCollapsed: !state.sidebarCollapsed
      };
    case 'SET_THEME':
      return {
        ...state,
        theme: action.payload
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    default:
      return state;
  }
};

const AppStateContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, {
    notifications: [],
    sidebarCollapsed: false,
    theme: 'light',
    loading: false
  });

  return (
    <AppStateContext.Provider value={{ state, dispatch }}>
      {children}
    </AppStateContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return context;
};
```

**Benefits**:
- Centralized state management
- Predictable state updates
- Easy debugging
- Type safety

### **2. TanStack Query Pattern**

**Pattern**: Use TanStack Query for server state management.

```typescript
// src/hooks/useEmployees.ts
export const useEmployees = (filters?: EmployeeFilters) => {
  return useQuery({
    queryKey: ['employees', filters],
    queryFn: () => employeeService.getEmployees(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
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

export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEmployeeRequest }) =>
      employeeService.updateEmployee(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
    },
  });
};

export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: employeeService.deleteEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
};
```

**Benefits**:
- Automatic caching
- Background updates
- Optimistic updates
- Error handling

---

## 📡 **Data Fetching Patterns**

### **1. Service Layer Pattern**

**Pattern**: Centralized API service layer with consistent error handling.

```typescript
// src/services/api/base.ts
class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new ApiError(response.status, await response.text());
      }
      
      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(0, 'Network error');
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// src/services/employeeService.ts
class EmployeeService {
  constructor(private api: ApiService) {}

  async getEmployees(filters?: EmployeeFilters): Promise<Employee[]> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.department) params.append('department', filters.department);
    if (filters?.status) params.append('status', filters.status);
    
    const queryString = params.toString();
    return this.api.get<Employee[]>(`/employees${queryString ? `?${queryString}` : ''}`);
  }

  async getEmployee(id: string): Promise<Employee> {
    return this.api.get<Employee>(`/employees/${id}`);
  }

  async createEmployee(data: CreateEmployeeRequest): Promise<Employee> {
    return this.api.post<Employee>('/employees', data);
  }

  async updateEmployee(id: string, data: UpdateEmployeeRequest): Promise<Employee> {
    return this.api.put<Employee>(`/employees/${id}`, data);
  }

  async deleteEmployee(id: string): Promise<void> {
    return this.api.delete<void>(`/employees/${id}`);
  }
}
```

**Benefits**:
- Centralized API logic
- Consistent error handling
- Easy to test and mock
- Reusable across components

### **2. Optimistic Updates Pattern**

**Pattern**: Update UI immediately, then sync with server.

```typescript
// src/hooks/useOptimisticEmployee.ts
export const useOptimisticEmployee = () => {
  const queryClient = useQueryClient();

  const updateEmployee = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEmployeeRequest }) =>
      employeeService.updateEmployee(id, data),
    
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['employee', id] });
      
      // Snapshot previous value
      const previousEmployee = queryClient.getQueryData(['employee', id]);
      
      // Optimistically update
      queryClient.setQueryData(['employee', id], (old: Employee) => ({
        ...old,
        ...data
      }));
      
      return { previousEmployee };
    },
    
    onError: (err, { id }, context) => {
      // Rollback on error
      if (context?.previousEmployee) {
        queryClient.setQueryData(['employee', id], context.previousEmployee);
      }
    },
    
    onSettled: (data, error, { id }) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
    },
  });

  return updateEmployee;
};
```

**Benefits**:
- Immediate UI feedback
- Better user experience
- Automatic rollback on error
- Consistent state management

---

## 📝 **Form Handling Patterns**

### **1. Controlled Components Pattern**

**Pattern**: Form inputs controlled by React state.

```typescript
// src/components/forms/EmployeeForm.tsx
const EmployeeForm: React.FC<EmployeeFormProps> = ({ onSubmit, initialData }) => {
  const [formData, setFormData] = useState<CreateEmployeeRequest>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    departmentId: '',
    position: '',
    employmentType: 'regular',
    hireDate: '',
    baseSalary: 0,
    ...initialData
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (field: keyof CreateEmployeeRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateField = (field: keyof CreateEmployeeRequest, value: any) => {
    const newErrors = { ...errors };
    
    switch (field) {
      case 'email':
        if (!value) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(value)) newErrors.email = 'Email is invalid';
        else delete newErrors.email;
        break;
      case 'firstName':
        if (!value) newErrors.firstName = 'First name is required';
        else delete newErrors.firstName;
        break;
      // ... other validations
    }
    
    setErrors(newErrors);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    Object.keys(formData).forEach(field => {
      validateField(field as keyof CreateEmployeeRequest, formData[field as keyof CreateEmployeeRequest]);
    });
    
    // Check if there are any errors
    if (Object.keys(errors).length === 0) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Email"
        type="email"
        value={formData.email}
        onChange={(value) => updateField('email', value)}
        onBlur={() => validateField('email', formData.email)}
        error={errors.email}
        required
      />
      
      <Input
        label="First Name"
        value={formData.firstName}
        onChange={(value) => updateField('firstName', value)}
        onBlur={() => validateField('firstName', formData.firstName)}
        error={errors.firstName}
        required
      />
      
      {/* Other form fields */}
      
      <div className="flex justify-end space-x-3">
        <Button type="button" variant="secondary">Cancel</Button>
        <Button type="submit" variant="primary">Save</Button>
      </div>
    </form>
  );
};
```

**Benefits**:
- Full control over form state
- Real-time validation
- Easy to test
- Predictable behavior

### **2. React Hook Form Pattern**

**Pattern**: Use React Hook Form for complex forms with validation.

```typescript
// src/components/forms/EmployeeFormRHF.tsx
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const employeeSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  departmentId: z.string().min(1, 'Department is required'),
  position: z.string().min(1, 'Position is required'),
  employmentType: z.enum(['regular', 'contractual', 'jo']),
  hireDate: z.string().min(1, 'Hire date is required'),
  baseSalary: z.number().min(0, 'Base salary must be positive'),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

const EmployeeFormRHF: React.FC<EmployeeFormProps> = ({ onSubmit, initialData }) => {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      departmentId: '',
      position: '',
      employmentType: 'regular',
      hireDate: '',
      baseSalary: 0,
      ...initialData
    }
  });

  const onFormSubmit = async (data: EmployeeFormData) => {
    try {
      await onSubmit(data);
      reset();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <Controller
        name="email"
        control={control}
        render={({ field }) => (
          <Input
            label="Email"
            type="email"
            {...field}
            error={errors.email?.message}
            required
          />
        )}
      />
      
      <Controller
        name="firstName"
        control={control}
        render={({ field }) => (
          <Input
            label="First Name"
            {...field}
            error={errors.firstName?.message}
            required
          />
        )}
      />
      
      {/* Other form fields */}
      
      <div className="flex justify-end space-x-3">
        <Button type="button" variant="secondary" onClick={() => reset()}>
          Reset
        </Button>
        <Button type="submit" variant="primary" loading={isSubmitting}>
          Save
        </Button>
      </div>
    </form>
  );
};
```

**Benefits**:
- Minimal re-renders
- Built-in validation
- Easy form state management
- Better performance

---

## ⚠️ **Error Handling Patterns**

### **1. Error Boundary Pattern**

**Pattern**: Catch JavaScript errors anywhere in the component tree.

```typescript
// src/components/ErrorBoundary.tsx
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log error to monitoring service
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">
                  Something went wrong
                </h3>
              </div>
            </div>
            
            <div className="mt-4">
              <p className="text-sm text-gray-600">
                We're sorry, but something unexpected happened. Please try refreshing the page.
              </p>
            </div>
            
            <div className="mt-6 flex space-x-3">
              <Button
                variant="primary"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
              <Button
                variant="secondary"
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Usage
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

**Benefits**:
- Graceful error handling
- User-friendly error messages
- Error logging and monitoring
- Prevents app crashes

### **2. Global Error Handler Pattern**

**Pattern**: Centralized error handling for API calls and async operations.

```typescript
// src/utils/errorHandler.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const handleError = (error: unknown): AppError => {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(error.message, 'UNKNOWN_ERROR');
  }

  return new AppError('An unexpected error occurred', 'UNKNOWN_ERROR');
};

// src/hooks/useErrorHandler.ts
export const useErrorHandler = () => {
  const { addNotification } = useNotifications();

  const handleError = useCallback((error: unknown) => {
    const appError = handleError(error);
    
    // Log error
    console.error('Error:', appError);
    
    // Show user notification
    addNotification({
      type: 'error',
      title: 'Error',
      message: appError.message,
    });
  }, [addNotification]);

  return { handleError };
};

// Usage in components
const EmployeeList: React.FC = () => {
  const { handleError } = useErrorHandler();
  const { data: employees, error } = useEmployees();

  useEffect(() => {
    if (error) {
      handleError(error);
    }
  }, [error, handleError]);

  // Component render logic
};
```

**Benefits**:
- Consistent error handling
- Centralized error logging
- User-friendly error messages
- Easy to maintain and update

---

## ⚡ **Performance Patterns**

### **1. Memoization Pattern**

**Pattern**: Use React.memo, useMemo, and useCallback to prevent unnecessary re-renders.

```typescript
// src/components/EmployeeCard.tsx
interface EmployeeCardProps {
  employee: Employee;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
}

const EmployeeCard = React.memo<EmployeeCardProps>(({ employee, onEdit, onDelete }) => {
  const handleEdit = useCallback(() => {
    onEdit(employee);
  }, [employee, onEdit]);

  const handleDelete = useCallback(() => {
    onDelete(employee);
  }, [employee, onDelete]);

  const statusColor = useMemo(() => {
    switch (employee.status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'terminated': return 'bg-red-100 text-red-800';
      case 'on_leave': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, [employee.status]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Component content */}
    </div>
  );
});

EmployeeCard.displayName = 'EmployeeCard';
```

**Benefits**:
- Reduced re-renders
- Better performance
- Optimized component updates
- Memory efficiency

### **2. Virtual Scrolling Pattern**

**Pattern**: Render only visible items in large lists.

```typescript
// src/components/VirtualizedList.tsx
interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
}

const VirtualizedList = <T,>({
  items,
  itemHeight,
  containerHeight,
  renderItem
}: VirtualizedListProps<T>) => {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );

  const visibleItems = items.slice(visibleStart, visibleEnd);
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleStart * itemHeight;

  return (
    <div
      className="overflow-auto"
      style={{ height: containerHeight }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div
              key={visibleStart + index}
              style={{ height: itemHeight }}
            >
              {renderItem(item, visibleStart + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```

**Benefits**:
- Handles large datasets
- Better performance
- Reduced memory usage
- Smooth scrolling

---

## ♿ **Accessibility Patterns**

### **1. ARIA Pattern**

**Pattern**: Use ARIA attributes for screen reader support.

```typescript
// src/components/shared/Modal.tsx
const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          ref={modalRef}
          className="relative bg-white rounded-lg shadow-xl w-full max-w-lg"
          tabIndex={-1}
        >
          {title && (
            <h2 id="modal-title" className="text-lg font-semibold">
              {title}
            </h2>
          )}
          {children}
        </div>
      </div>
    </div>
  );
};
```

**Benefits**:
- Screen reader support
- Keyboard navigation
- Focus management
- WCAG compliance

### **2. Focus Management Pattern**

**Pattern**: Manage focus for better keyboard navigation.

```typescript
// src/hooks/useFocusManagement.ts
export const useFocusManagement = () => {
  const focusableElements = useRef<HTMLElement[]>([]);

  const setFocusableElements = useCallback((container: HTMLElement) => {
    focusableElements.current = Array.from(
      container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ) as HTMLElement[];
  }, []);

  const focusFirst = useCallback(() => {
    if (focusableElements.current.length > 0) {
      focusableElements.current[0].focus();
    }
  }, []);

  const focusLast = useCallback(() => {
    if (focusableElements.current.length > 0) {
      focusableElements.current[focusableElements.current.length - 1].focus();
    }
  }, []);

  const focusNext = useCallback((currentElement: HTMLElement) => {
    const currentIndex = focusableElements.current.indexOf(currentElement);
    const nextIndex = (currentIndex + 1) % focusableElements.current.length;
    focusableElements.current[nextIndex].focus();
  }, []);

  const focusPrevious = useCallback((currentElement: HTMLElement) => {
    const currentIndex = focusableElements.current.indexOf(currentElement);
    const previousIndex = currentIndex === 0 
      ? focusableElements.current.length - 1 
      : currentIndex - 1;
    focusableElements.current[previousIndex].focus();
  }, []);

  return {
    setFocusableElements,
    focusFirst,
    focusLast,
    focusNext,
    focusPrevious
  };
};
```

**Benefits**:
- Better keyboard navigation
- Improved accessibility
- Focus trapping
- User experience enhancement

---

## 🧪 **Testing Patterns**

### **1. Component Testing Pattern**

**Pattern**: Test components in isolation with mocked dependencies.

```typescript
// src/components/__tests__/EmployeeCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { EmployeeCard } from '../EmployeeCard';
import { mockEmployee } from '../../__mocks__/employee';

describe('EmployeeCard', () => {
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders employee information correctly', () => {
    render(
      <EmployeeCard
        employee={mockEmployee}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText(`${mockEmployee.firstName} ${mockEmployee.lastName}`)).toBeInTheDocument();
    expect(screen.getByText(mockEmployee.employeeId)).toBeInTheDocument();
    expect(screen.getByText(mockEmployee.position)).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    render(
      <EmployeeCard
        employee={mockEmployee}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    fireEvent.click(screen.getByText('Edit'));
    expect(mockOnEdit).toHaveBeenCalledWith(mockEmployee);
  });

  it('calls onDelete when delete button is clicked', () => {
    render(
      <EmployeeCard
        employee={mockEmployee}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    fireEvent.click(screen.getByText('Delete'));
    expect(mockOnDelete).toHaveBeenCalledWith(mockEmployee);
  });

  it('displays correct status badge', () => {
    render(
      <EmployeeCard
        employee={mockEmployee}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const statusBadge = screen.getByText(mockEmployee.status);
    expect(statusBadge).toHaveClass('bg-green-100', 'text-green-800');
  });
});
```

**Benefits**:
- Isolated testing
- Fast test execution
- Easy to debug
- Reliable test results

### **2. Integration Testing Pattern**

**Pattern**: Test component interactions and data flow.

```typescript
// src/components/__tests__/EmployeeList.integration.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EmployeeList } from '../EmployeeList';
import { employeeService } from '../../services/employeeService';

// Mock the service
jest.mock('../../services/employeeService');
const mockEmployeeService = employeeService as jest.Mocked<typeof employeeService>;

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('EmployeeList Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads and displays employees', async () => {
    const mockEmployees = [
      { id: '1', firstName: 'John', lastName: 'Doe', employeeId: 'EMP-2025-0000001' },
      { id: '2', firstName: 'Jane', lastName: 'Smith', employeeId: 'EMP-2025-0000002' },
    ];

    mockEmployeeService.getEmployees.mockResolvedValue(mockEmployees);

    renderWithQueryClient(<EmployeeList />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    expect(mockEmployeeService.getEmployees).toHaveBeenCalledTimes(1);
  });

  it('handles error state', async () => {
    mockEmployeeService.getEmployees.mockRejectedValue(new Error('Failed to fetch'));

    renderWithQueryClient(<EmployeeList />);

    await waitFor(() => {
      expect(screen.getByText('Error loading employees')).toBeInTheDocument();
    });
  });
});
```

**Benefits**:
- Tests real interactions
- Catches integration issues
- More realistic testing
- Better confidence in functionality

---

## 📁 **Code Organization Patterns**

### **1. Feature-Based Organization**

**Pattern**: Organize code by features rather than file types.

```
src/
├── features/
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   ├── employees/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   └── attendance/
│       ├── components/
│       ├── hooks/
│       ├── services/
│       └── types/
├── shared/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   └── utils/
└── app/
    ├── components/
    ├── hooks/
    └── providers/
```

**Benefits**:
- Clear feature boundaries
- Easy to find related code
- Better maintainability
- Reduced coupling

### **2. Barrel Export Pattern**

**Pattern**: Use index files to create clean import paths.

```typescript
// src/features/employees/index.ts
export { EmployeeCard } from './components/EmployeeCard';
export { EmployeeList } from './components/EmployeeList';
export { EmployeeForm } from './components/EmployeeForm';
export { useEmployees } from './hooks/useEmployees';
export { useCreateEmployee } from './hooks/useCreateEmployee';
export { employeeService } from './services/employeeService';
export type { Employee, CreateEmployeeRequest } from './types/employee';

// Usage
import { EmployeeCard, useEmployees, type Employee } from '@/features/employees';
```

**Benefits**:
- Clean import statements
- Easy to refactor
- Better encapsulation
- Consistent API

---

## 🎯 **Best Practices Summary**

### **Component Design**
- Use composition over inheritance
- Keep components small and focused
- Use TypeScript for type safety
- Follow single responsibility principle

### **State Management**
- Use local state for component-specific data
- Use context for app-wide state
- Use TanStack Query for server state
- Avoid prop drilling

### **Performance**
- Use React.memo for expensive components
- Use useMemo and useCallback appropriately
- Implement virtual scrolling for large lists
- Optimize bundle size

### **Accessibility**
- Use semantic HTML
- Provide ARIA labels
- Ensure keyboard navigation
- Test with screen readers

### **Testing**
- Write unit tests for components
- Write integration tests for workflows
- Use meaningful test descriptions
- Mock external dependencies

### **Code Quality**
- Follow consistent naming conventions
- Use meaningful variable names
- Write self-documenting code
- Regular code reviews

---

**Last Updated**: January 2025  
**Pattern Library Version**: 1.0.0  
**Status**: Ready for Implementation
