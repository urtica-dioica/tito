# API Error Handling & Error Codes

## 🚨 **Error Handling Overview**

This document provides comprehensive information about API error handling, error codes, and best practices for the TITO HR Management System frontend.

## 📋 **Error Response Format**

### **Standard Error Response**
```typescript
interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId: string;
  };
}
```

### **Example Error Response**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    },
    "timestamp": "2025-01-15T10:30:00Z",
    "requestId": "req_123456789"
  }
}
```

## 🔢 **Error Code Categories**

### **1. Authentication Errors (1xxx)**
| Code | HTTP Status | Description | Action |
|------|-------------|-------------|---------|
| `AUTH_1001` | 401 | Invalid credentials | Show login form |
| `AUTH_1002` | 401 | Token expired | Refresh token |
| `AUTH_1003` | 401 | Token invalid | Redirect to login |
| `AUTH_1004` | 403 | Insufficient permissions | Show access denied |
| `AUTH_1005` | 401 | Account locked | Show account locked message |
| `AUTH_1006` | 401 | Account disabled | Show account disabled message |

### **2. Validation Errors (2xxx)**
| Code | HTTP Status | Description | Action |
|------|-------------|-------------|---------|
| `VAL_2001` | 400 | Required field missing | Highlight field |
| `VAL_2002` | 400 | Invalid field format | Show format error |
| `VAL_2003` | 400 | Field value too long | Show length error |
| `VAL_2004` | 400 | Field value too short | Show length error |
| `VAL_2005` | 400 | Invalid email format | Show email error |
| `VAL_2006` | 400 | Invalid date format | Show date error |
| `VAL_2007` | 400 | Invalid number format | Show number error |
| `VAL_2008` | 400 | Duplicate value | Show duplicate error |

### **3. Business Logic Errors (3xxx)**
| Code | HTTP Status | Description | Action |
|------|-------------|-------------|---------|
| `BIZ_3001` | 409 | Employee already exists | Show duplicate error |
| `BIZ_3002` | 409 | Department has employees | Show dependency error |
| `BIZ_3003` | 409 | Leave balance insufficient | Show balance error |
| `BIZ_3004` | 409 | Payroll already processed | Show processed error |
| `BIZ_3005` | 409 | Request already approved | Show status error |
| `BIZ_3006` | 409 | Attendance already recorded | Show duplicate error |

### **4. Resource Errors (4xxx)**
| Code | HTTP Status | Description | Action |
|------|-------------|-------------|---------|
| `RES_4001` | 404 | Employee not found | Show not found error |
| `RES_4002` | 404 | Department not found | Show not found error |
| `RES_4003` | 404 | Leave request not found | Show not found error |
| `RES_4004` | 404 | Payroll record not found | Show not found error |
| `RES_4005` | 404 | Attendance record not found | Show not found error |
| `RES_4006` | 404 | File not found | Show not found error |

### **5. System Errors (5xxx)**
| Code | HTTP Status | Description | Action |
|------|-------------|-------------|---------|
| `SYS_5001` | 500 | Internal server error | Show generic error |
| `SYS_5002` | 503 | Service unavailable | Show service error |
| `SYS_5003` | 500 | Database error | Show system error |
| `SYS_5004` | 500 | File system error | Show system error |
| `SYS_5005` | 500 | External service error | Show system error |
| `SYS_5006` | 429 | Rate limit exceeded | Show rate limit error |

## 🛠️ **Error Handling Implementation**

### **Error Handler Service**
```typescript
// src/services/errorHandler.ts
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const handleApiError = (error: any): ApiError => {
  if (error.response?.data?.error) {
    const { code, message, details } = error.response.data.error;
    return new ApiError(code, message, error.response.status, details);
  }

  if (error.response?.status) {
    return new ApiError(
      'NETWORK_ERROR',
      'Network request failed',
      error.response.status
    );
  }

  return new ApiError(
    'UNKNOWN_ERROR',
    'An unexpected error occurred',
    500
  );
};
```

### **Error Context Provider**
```typescript
// src/contexts/ErrorContext.tsx
interface ErrorContextType {
  errors: ErrorState[];
  addError: (error: ErrorState) => void;
  removeError: (id: string) => void;
  clearErrors: () => void;
}

interface ErrorState {
  id: string;
  code: string;
  message: string;
  type: 'error' | 'warning' | 'info';
  details?: any;
  timestamp: Date;
}

const ErrorContext = createContext<ErrorContextType | null>(null);

export const ErrorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [errors, setErrors] = useState<ErrorState[]>([]);

  const addError = useCallback((error: Omit<ErrorState, 'id' | 'timestamp'>) => {
    const newError: ErrorState = {
      ...error,
      id: `error_${Date.now()}_${Math.random()}`,
      timestamp: new Date(),
    };
    
    setErrors(prev => [...prev, newError]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeError(newError.id);
    }, 5000);
  }, []);

  const removeError = useCallback((id: string) => {
    setErrors(prev => prev.filter(error => error.id !== id));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  return (
    <ErrorContext.Provider value={{ errors, addError, removeError, clearErrors }}>
      {children}
    </ErrorContext.Provider>
  );
};

export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) throw new Error('useError must be used within ErrorProvider');
  return context;
};
```

### **Error Boundary Component**
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
      return <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}

const ErrorFallback: React.FC<{ error: Error | null }> = ({ error }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
      <div className="flex items-center mb-4">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <h3 className="ml-3 text-lg font-medium text-gray-900">
          Something went wrong
        </h3>
      </div>
      
      <div className="mt-4">
        <p className="text-sm text-gray-600">
          {error?.message || 'An unexpected error occurred. Please try refreshing the page.'}
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
          onClick={() => window.history.back()}
        >
          Go Back
        </Button>
      </div>
    </div>
  </div>
);
```

### **Error Toast Component**
```typescript
// src/components/ErrorToast.tsx
interface ErrorToastProps {
  error: ErrorState;
  onClose: () => void;
}

const ErrorToast: React.FC<ErrorToastProps> = ({ error, onClose }) => {
  const getIcon = () => {
    switch (error.type) {
      case 'error': return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info': return <Info className="h-5 w-5 text-blue-500" />;
      default: return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (error.type) {
      case 'error': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'info': return 'bg-blue-50 border-blue-200';
      default: return 'bg-red-50 border-red-200';
    }
  };

  return (
    <div className={`max-w-sm w-full border rounded-lg p-4 ${getBackgroundColor()}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="ml-3 w-0 flex-1">
          <p className="text-sm font-medium text-gray-900">
            {error.message}
          </p>
          {error.details && (
            <p className="mt-1 text-sm text-gray-500">
              {error.details}
            </p>
          )}
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            onClick={onClose}
            className="inline-flex text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
```

## 🎯 **Error Handling Hooks**

### **useApiError Hook**
```typescript
// src/hooks/useApiError.ts
export const useApiError = () => {
  const { addError } = useError();

  const handleError = useCallback((error: any) => {
    const apiError = handleApiError(error);
    
    // Map error codes to user-friendly messages
    const userMessage = getErrorMessage(apiError.code);
    
    addError({
      code: apiError.code,
      message: userMessage,
      type: getErrorType(apiError.code),
      details: apiError.details,
    });
  }, [addError]);

  return { handleError };
};

const getErrorMessage = (code: string): string => {
  const errorMessages: Record<string, string> = {
    'AUTH_1001': 'Invalid email or password. Please try again.',
    'AUTH_1002': 'Your session has expired. Please log in again.',
    'AUTH_1003': 'Invalid session. Please log in again.',
    'AUTH_1004': 'You do not have permission to perform this action.',
    'VAL_2001': 'Please fill in all required fields.',
    'VAL_2002': 'Please check the format of your input.',
    'VAL_2005': 'Please enter a valid email address.',
    'BIZ_3001': 'An employee with this email already exists.',
    'BIZ_3003': 'Insufficient leave balance for this request.',
    'RES_4001': 'Employee not found.',
    'SYS_5001': 'Something went wrong. Please try again later.',
    'SYS_5006': 'Too many requests. Please wait a moment.',
  };

  return errorMessages[code] || 'An unexpected error occurred.';
};

const getErrorType = (code: string): 'error' | 'warning' | 'info' => {
  if (code.startsWith('AUTH_') || code.startsWith('SYS_')) return 'error';
  if (code.startsWith('VAL_') || code.startsWith('BIZ_')) return 'warning';
  return 'info';
};
```

### **useMutationWithErrorHandling Hook**
```typescript
// src/hooks/useMutationWithErrorHandling.ts
export const useMutationWithErrorHandling = <TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>
) => {
  const { handleError } = useApiError();

  return useMutation({
    mutationFn,
    onError: (error) => {
      handleError(error);
    },
  });
};

// Usage
const createEmployee = useMutationWithErrorHandling(employeeService.createEmployee);
```

## 📱 **Error Display Components**

### **Error Message Component**
```typescript
// src/components/ErrorMessage.tsx
interface ErrorMessageProps {
  error: ApiError;
  onRetry?: () => void;
  className?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ error, onRetry, className }) => {
  const getErrorIcon = () => {
    switch (error.code) {
      case 'AUTH_1001':
      case 'AUTH_1002':
      case 'AUTH_1003':
        return <Lock className="h-8 w-8 text-red-500" />;
      case 'VAL_2001':
      case 'VAL_2002':
        return <AlertTriangle className="h-8 w-8 text-yellow-500" />;
      case 'RES_4001':
      case 'RES_4002':
        return <Search className="h-8 w-8 text-gray-500" />;
      default:
        return <AlertCircle className="h-8 w-8 text-red-500" />;
    }
  };

  const getErrorTitle = () => {
    switch (error.code) {
      case 'AUTH_1001':
      case 'AUTH_1002':
      case 'AUTH_1003':
        return 'Authentication Error';
      case 'VAL_2001':
      case 'VAL_2002':
        return 'Validation Error';
      case 'RES_4001':
      case 'RES_4002':
        return 'Not Found';
      default:
        return 'Error';
    }
  };

  return (
    <div className={`text-center p-6 ${className}`}>
      <div className="flex justify-center mb-4">
        {getErrorIcon()}
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {getErrorTitle()}
      </h3>
      
      <p className="text-sm text-gray-600 mb-4">
        {error.message}
      </p>
      
      {error.details && (
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <p className="text-xs text-gray-500">
            <strong>Details:</strong> {JSON.stringify(error.details)}
          </p>
        </div>
      )}
      
      {onRetry && (
        <Button variant="primary" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
};
```

### **Form Error Display**
```typescript
// src/components/FormError.tsx
interface FormErrorProps {
  error: ApiError;
  field?: string;
}

const FormError: React.FC<FormErrorProps> = ({ error, field }) => {
  if (error.code.startsWith('VAL_') && error.details?.field === field) {
    return (
      <p className="mt-1 text-sm text-red-600" role="alert">
        {error.details.reason || error.message}
      </p>
    );
  }

  if (error.code.startsWith('BIZ_') && error.details?.field === field) {
    return (
      <p className="mt-1 text-sm text-yellow-600" role="alert">
        {error.message}
      </p>
    );
  }

  return null;
};
```

## 🔄 **Error Recovery Strategies**

### **Automatic Retry**
```typescript
// src/utils/retry.ts
export const retry = async <T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      // Don't retry on certain error codes
      if (error instanceof ApiError && 
          (error.code.startsWith('AUTH_') || error.code.startsWith('VAL_'))) {
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }

  throw lastError!;
};
```

### **Offline Support**
```typescript
// src/hooks/useOfflineSupport.ts
export const useOfflineSupport = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline };
};
```

## 📊 **Error Monitoring**

### **Error Logging**
```typescript
// src/utils/errorLogger.ts
export const logError = (error: Error, context?: any) => {
  const errorLog = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    context,
  };

  // Send to monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Send to Sentry, LogRocket, etc.
    console.error('Error logged:', errorLog);
  } else {
    console.error('Development error:', errorLog);
  }
};
```

---

**Last Updated**: January 2025  
**Error Handling Version**: 1.0.0  
**Status**: Ready for Implementation
