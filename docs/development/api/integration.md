# Frontend-Backend API Integration Guide

## 📡 **API Integration Overview**

This document provides comprehensive guidance for integrating the TITO HR frontend with the backend API. The backend provides a RESTful API with JWT-based authentication and role-based access control.

## 🔗 **API Base Configuration**

### **Base URL Configuration**
```typescript
// src/lib/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});
```

### **Environment Variables**
```bash
# .env
VITE_API_URL=http://localhost:3000/api/v1
VITE_APP_NAME=TITO HR Management System
VITE_APP_VERSION=1.0.0
```

## 🔐 **Authentication Integration**

### **Login Flow**
```typescript
// src/services/auth/authService.ts
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'hr' | 'employee' | 'department_head';
  };
}

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};
```

### **Token Management**
```typescript
// Request interceptor for auth tokens
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle token refresh or redirect to login
      await refreshToken();
    }
    return Promise.reject(error);
  }
);
```

### **Logout Implementation**
```typescript
export const logout = async (): Promise<void> => {
  try {
    await api.post('/auth/logout');
  } finally {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  }
};
```

## 👥 **User Management API**

### **Employee Management**
```typescript
// src/services/hr/employeeService.ts
export interface Employee {
  id: string;
  userId: string;
  employeeId: string; // Format: EMP-YYYY-NNNNNNN
  firstName: string;
  lastName: string;
  email: string;
  departmentId: string;
  departmentName: string;
  position: string;
  employmentType: 'regular' | 'contractual' | 'jo';
  hireDate: string; // DATE format
  baseSalary: number; // DECIMAL(10,2)
  status: 'active' | 'inactive' | 'terminated' | 'on_leave';
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeeRequest {
  // User fields
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'employee'; // Always employee for new employees
  
  // Employee fields
  departmentId: string;
  position: string;
  employmentType: 'regular' | 'contractual' | 'jo';
  hireDate: string; // DATE format
  baseSalary: number; // DECIMAL(10,2)
  status?: 'active' | 'inactive' | 'terminated' | 'on_leave'; // Defaults to 'active'
}

export interface UpdateEmployeeRequest {
  // User fields (optional)
  email?: string;
  firstName?: string;
  lastName?: string;
  
  // Employee fields (optional)
  departmentId?: string;
  position?: string;
  employmentType?: 'regular' | 'contractual' | 'jo';
  hireDate?: string;
  baseSalary?: number;
  status?: 'active' | 'inactive' | 'terminated' | 'on_leave';
}

// Get all employees
export const getEmployees = async (): Promise<Employee[]> => {
  const response = await api.get('/hr/employees');
  return response.data;
};

// Get employee by ID
export const getEmployee = async (id: string): Promise<Employee> => {
  const response = await api.get(`/hr/employees/${id}`);
  return response.data;
};

// Create new employee
export const createEmployee = async (employeeData: CreateEmployeeRequest): Promise<Employee> => {
  const response = await api.post('/hr/employees', employeeData);
  return response.data;
};

// Update employee
export const updateEmployee = async (id: string, employeeData: UpdateEmployeeRequest): Promise<Employee> => {
  const response = await api.put(`/hr/employees/${id}`, employeeData);
  return response.data;
};

// Delete employee
export const deleteEmployee = async (id: string): Promise<void> => {
  await api.delete(`/hr/employees/${id}`);
};
```

### **Department Management**
```typescript
// src/services/hr/departmentService.ts
export interface Department {
  id: string;
  name: string;
  description: string | null;
  departmentHeadUserId: string | null;
  departmentHeadName: string | null;
  employeeCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentRequest {
  name: string;
  description?: string;
  departmentHeadUserId?: string | null;
  isActive?: boolean; // Defaults to true
}

export interface UpdateDepartmentRequest {
  name?: string;
  description?: string;
  departmentHeadUserId?: string | null;
  isActive?: boolean;
}

export const getDepartments = async (): Promise<Department[]> => {
  const response = await api.get('/hr/departments');
  return response.data;
};

export const createDepartment = async (departmentData: CreateDepartmentRequest): Promise<Department> => {
  const response = await api.post('/hr/departments', departmentData);
  return response.data;
};
```

## ⏰ **Attendance Management API**

### **Attendance Records**
```typescript
// src/services/attendance/attendanceService.ts
export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string; // DATE format
  overallStatus: 'present' | 'late' | 'absent' | 'partial';
  sessions: AttendanceSession[];
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceSession {
  id: string;
  attendanceRecordId: string;
  sessionType: string; // VARCHAR(50)
  clockIn: string | null; // TIMESTAMP
  clockOut: string | null; // TIMESTAMP
  calculatedHours: number; // DECIMAL(4,2) - auto-calculated
  lateHours: number; // DECIMAL(4,2)
  status: 'present' | 'late' | 'early' | 'absent';
  selfieImagePath: string | null; // VARCHAR(500)
  selfieTakenAt: string | null; // TIMESTAMP
  createdAt: string;
}

export interface ClockInRequest {
  employeeId: string;
  sessionType: string;
  clockIn: string; // TIMESTAMP
  selfieImagePath?: string;
}

export interface ClockOutRequest {
  employeeId: string;
  sessionType: string;
  clockOut: string; // TIMESTAMP
}

// Get attendance records
export const getAttendanceRecords = async (params: AttendanceQueryParams): Promise<AttendanceRecord[]> => {
  const response = await api.get('/attendance/records', { params });
  return response.data;
};

// Clock in/out
export const clockIn = async (data: ClockInRequest): Promise<AttendanceSession> => {
  const response = await api.post('/attendance/clock-in', data);
  return response.data;
};

export const clockOut = async (data: ClockOutRequest): Promise<AttendanceSession> => {
  const response = await api.post('/attendance/clock-out', data);
  return response.data;
};
```

### **Time Correction Requests**
```typescript
// src/services/attendance/timeCorrectionService.ts
export interface TimeCorrectionRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  attendanceSessionId: string | null; // References attendance_sessions.id
  correctionDate: string; // DATE format
  sessionType: string; // VARCHAR(50)
  requestedClockIn: string | null; // TIMESTAMP
  requestedClockOut: string | null; // TIMESTAMP
  reason: string; // TEXT - required
  status: 'pending' | 'approved' | 'rejected';
  approverId: string | null;
  approverName: string | null;
  approvedAt: string | null; // TIMESTAMP
  comments: string | null; // TEXT
  createdAt: string;
  updatedAt: string;
}

export interface CreateTimeCorrectionRequest {
  employeeId: string;
  attendanceSessionId?: string | null;
  correctionDate: string; // DATE format
  sessionType: string;
  requestedClockIn?: string | null; // TIMESTAMP
  requestedClockOut?: string | null; // TIMESTAMP
  reason: string; // TEXT - required
}

export interface ApprovalRequest {
  status: 'approved' | 'rejected';
  comments?: string; // TEXT
}

export const getTimeCorrectionRequests = async (): Promise<TimeCorrectionRequest[]> => {
  const response = await api.get('/attendance/time-corrections');
  return response.data;
};

export const createTimeCorrectionRequest = async (data: CreateTimeCorrectionRequest): Promise<TimeCorrectionRequest> => {
  const response = await api.post('/attendance/time-corrections', data);
  return response.data;
};

export const approveTimeCorrectionRequest = async (id: string, data: ApprovalRequest): Promise<TimeCorrectionRequest> => {
  const response = await api.put(`/attendance/time-corrections/${id}/approve`, data);
  return response.data;
};
```

### **Overtime Requests**
```typescript
// src/services/attendance/overtimeService.ts
export interface OvertimeRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  requestDate: string; // DATE format
  overtimeDate: string; // DATE format
  startTime: string; // TIME format
  endTime: string; // TIME format
  requestedHours: number; // DECIMAL(4,2)
  reason: string; // TEXT - required
  status: 'pending' | 'approved' | 'rejected';
  approverId: string | null;
  approverName: string | null;
  approvedAt: string | null; // TIMESTAMP
  comments: string | null; // TEXT
  createdAt: string;
  updatedAt: string;
}

export interface CreateOvertimeRequest {
  employeeId: string;
  requestDate: string; // DATE format
  overtimeDate: string; // DATE format
  startTime: string; // TIME format
  endTime: string; // TIME format
  requestedHours: number; // DECIMAL(4,2)
  reason: string; // TEXT - required
}

export const getOvertimeRequests = async (): Promise<OvertimeRequest[]> => {
  const response = await api.get('/attendance/overtime-requests');
  return response.data;
};

export const createOvertimeRequest = async (data: CreateOvertimeRequest): Promise<OvertimeRequest> => {
  const response = await api.post('/attendance/overtime-requests', data);
  return response.data;
};

export const approveOvertimeRequest = async (id: string, data: ApprovalRequest): Promise<OvertimeRequest> => {
  const response = await api.put(`/attendance/overtime-requests/${id}/approve`, data);
  return response.data;
};
```

## 🏖️ **Leave Management API**

### **Leave Requests**
```typescript
// src/services/leave/leaveService.ts
export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: 'vacation' | 'sick' | 'maternity' | 'other';
  startDate: string; // DATE format
  endDate: string; // DATE format
  status: 'pending' | 'approved' | 'rejected';
  approverId: string | null;
  approverName: string | null;
  approvedAt: string | null; // TIMESTAMP
  createdAt: string;
  updatedAt: string;
}

export interface LeaveBalance {
  id: string;
  employeeId: string;
  leaveType: 'vacation' | 'sick' | 'maternity' | 'other';
  balance: number; // DECIMAL(6,2)
  updatedAt: string;
}

export interface CreateLeaveRequest {
  employeeId: string;
  leaveType: 'vacation' | 'sick' | 'maternity' | 'other';
  startDate: string; // DATE format
  endDate: string; // DATE format
}

export interface LeaveAccrual {
  id: string;
  employeeId: string;
  attendanceRecordId: string | null;
  overtimeHours: number; // DECIMAL(4,2)
  leaveDaysAccrued: number; // DECIMAL(4,2)
  accrualDate: string; // DATE format
  createdAt: string;
}

export const getLeaveRequests = async (): Promise<LeaveRequest[]> => {
  const response = await api.get('/leave/requests');
  return response.data;
};

export const createLeaveRequest = async (data: CreateLeaveRequest): Promise<LeaveRequest> => {
  const response = await api.post('/leave/requests', data);
  return response.data;
};

export const getLeaveBalance = async (employeeId: string): Promise<LeaveBalance[]> => {
  const response = await api.get(`/leave/balance/${employeeId}`);
  return response.data;
};
```

## 💰 **Payroll Management API**

### **Payroll Records**
```typescript
// src/services/payroll/payrollService.ts
export interface PayrollRecord {
  id: string;
  payrollPeriodId: string;
  employeeId: string;
  employeeName: string;
  baseSalary: number; // DECIMAL(10,2)
  hourlyRate: number; // DECIMAL(8,2)
  totalWorkedHours: number; // DECIMAL(6,2)
  totalRegularHours: number; // DECIMAL(6,2)
  totalOvertimeHours: number; // DECIMAL(6,2)
  totalLateHours: number; // DECIMAL(6,2)
  lateDeductions: number; // DECIMAL(10,2)
  grossPay: number; // DECIMAL(10,2)
  netPay: number; // DECIMAL(10,2)
  totalDeductions: number; // DECIMAL(10,2)
  status: 'draft' | 'processed' | 'paid';
  deductions: PayrollDeduction[];
  createdAt: string;
  updatedAt: string;
}

export interface PayrollPeriod {
  id: string;
  periodName: string; // VARCHAR(50)
  startDate: string; // DATE format
  endDate: string; // DATE format
  status: 'draft' | 'processing' | 'sent_for_review' | 'completed';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollDeduction {
  id: string;
  payrollRecordId: string;
  deductionTypeId: string | null;
  name: string; // VARCHAR(100)
  amount: number; // DECIMAL(10,2)
  createdAt: string;
}

export interface DeductionType {
  id: string;
  name: string; // VARCHAR(100) UNIQUE
  description: string | null;
  percentage: number | null; // DECIMAL(5,2) - 0-100
  fixedAmount: number | null; // DECIMAL(10,2)
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollApproval {
  id: string;
  payrollPeriodId: string;
  approverId: string;
  departmentId: string | null;
  status: 'pending' | 'approved' | 'rejected';
  comments: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const getPayrollPeriods = async (): Promise<PayrollPeriod[]> => {
  const response = await api.get('/payroll/periods');
  return response.data;
};

export const getPayrollRecords = async (periodId: string): Promise<PayrollRecord[]> => {
  const response = await api.get(`/payroll/periods/${periodId}/records`);
  return response.data;
};
```

## 🆔 **ID Card Management API**

### **ID Card Operations**
```typescript
// src/services/hr/idCardService.ts
export interface IDCard {
  id: string;
  employeeId: string;
  employeeName: string;
  qrCodeHash: string; // VARCHAR(255) UNIQUE
  qrCodeData: string; // TEXT
  isActive: boolean;
  issuedDate: string; // DATE format
  expiryDate: string; // DATE format
  issuedBy: string;
  issuedByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIDCardRequest {
  employeeId: string;
  issuedBy: string; // User ID of the issuer
}

export interface QRVerificationResponse {
  isValid: boolean;
  employee: {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    departmentName: string;
    position: string;
  } | null;
  message: string;
}

export const generateIDCard = async (data: CreateIDCardRequest): Promise<IDCard> => {
  const response = await api.post('/hr/id-cards', data);
  return response.data;
};

export const getEmployeeIDCard = async (employeeId: string): Promise<IDCard> => {
  const response = await api.get(`/hr/id-cards/employee/${employeeId}`);
  return response.data;
};

export const verifyQRCode = async (qrData: string): Promise<QRVerificationResponse> => {
  const response = await api.post('/kiosk/verify-qr', { qrData });
  return response.data;
};
```

## ⚙️ **System Settings API**

### **System Configuration**
```typescript
// src/services/hr/systemService.ts
export interface SystemSetting {
  id: string;
  settingKey: string; // VARCHAR(100) UNIQUE
  settingValue: string; // TEXT
  dataType: 'number' | 'boolean' | 'string' | 'decimal';
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSystemSettingRequest {
  settingValue: string;
  description?: string;
}

// Default system settings from schema
export interface SystemSettings {
  expectedMonthlyHours: number; // Default: 176
  overtimeToLeaveRatio: number; // Default: 0.125
  selfieRetentionDays: number; // Default: 2
  qrCodeExpiryYears: number; // Default: 2
}

export const getSystemSettings = async (): Promise<SystemSetting[]> => {
  const response = await api.get('/hr/system-settings');
  return response.data;
};

export const updateSystemSetting = async (key: string, data: UpdateSystemSettingRequest): Promise<SystemSetting> => {
  const response = await api.put(`/hr/system-settings/${key}`, data);
  return response.data;
};
```

## 👨‍💼 **Department Head API**

### **Department Head Dashboard**
```typescript
// src/services/department-head/departmentHeadService.ts
export interface DepartmentHeadDashboard {
  department: {
    id: string;
    name: string;
    description: string;
  };
  employeeCount: number;
  pendingRequests: {
    timeCorrections: number;
    overtimeRequests: number;
    leaveRequests: number;
  };
  attendanceSummary: {
    todayPresent: number;
    todayAbsent: number;
    monthlyAverage: number;
  };
  recentActivity: ActivityItem[];
}

export const getDepartmentHeadDashboard = async (): Promise<DepartmentHeadDashboard> => {
  const response = await api.get('/department-head/dashboard');
  return response.data;
};

export const getDepartmentEmployees = async (): Promise<Employee[]> => {
  const response = await api.get('/department-head/employees');
  return response.data;
};
```

## 🖥️ **Kiosk API**

### **Kiosk Operations**
```typescript
// src/services/kiosk/kioskService.ts
export interface KioskClockRequest {
  employeeId: string;
  sessionType: string; // VARCHAR(50)
  selfieImagePath?: string; // VARCHAR(500) - optional
}

export interface KioskClockResponse {
  success: boolean;
  message: string;
  attendanceSession: AttendanceSession;
  employee: {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    departmentName: string;
    position: string;
  };
}

export const kioskClockIn = async (data: KioskClockRequest): Promise<KioskClockResponse> => {
  const response = await api.post('/kiosk/clock-in', data);
  return response.data;
};

export const kioskClockOut = async (data: KioskClockRequest): Promise<KioskClockResponse> => {
  const response = await api.post('/kiosk/clock-out', data);
  return response.data;
};
```

## 🔄 **Data Fetching Patterns**

### **Using TanStack Query**
```typescript
// src/hooks/useEmployees.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from '../services/hr/employeeService';

export const useEmployees = () => {
  return useQuery({
    queryKey: ['employees'],
    queryFn: getEmployees,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateEmployee = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
};

export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEmployeeRequest }) => 
      updateEmployee(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
};
```

### **Error Handling**
```typescript
// src/utils/errorHandler.ts
export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: any;
}

export const handleApiError = (error: any): ApiError => {
  if (error.response) {
    return {
      message: error.response.data.message || 'An error occurred',
      status: error.response.status,
      code: error.response.data.code,
      details: error.response.data.details,
    };
  } else if (error.request) {
    return {
      message: 'Network error - please check your connection',
      status: 0,
    };
  } else {
    return {
      message: error.message || 'An unexpected error occurred',
      status: 500,
    };
  }
};
```

## 📊 **Real-time Updates**

### **WebSocket Integration**
```typescript
// src/services/websocket/websocketService.ts
export class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(token: string) {
    const wsUrl = `${process.env.VITE_WS_URL}?token=${token}`;
    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    };

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleMessage(data);
    };

    this.socket.onclose = () => {
      console.log('WebSocket disconnected');
      this.attemptReconnect(token);
    };
  }

  private handleMessage(data: any) {
    // Handle real-time updates
    switch (data.type) {
      case 'attendance_update':
        // Update attendance data
        break;
      case 'request_approval':
        // Update request status
        break;
      case 'notification':
        // Show notification
        break;
    }
  }
}
```

## 🧪 **Testing API Integration**

### **Mock API for Testing**
```typescript
// src/mocks/apiMocks.ts
export const mockEmployees: Employee[] = [
  {
    id: '1',
    userId: 'user-1',
    employeeId: 'EMP-2024-0000001',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@company.com',
    departmentId: 'dept-1',
    departmentName: 'Engineering',
    position: 'Senior Developer',
    employmentType: 'regular',
    hireDate: '2024-01-15',
    baseSalary: 75000,
    status: 'active',
  },
];

export const mockApi = {
  get: (url: string) => Promise.resolve({ data: mockEmployees }),
  post: (url: string, data: any) => Promise.resolve({ data: { ...data, id: 'new-id' } }),
  put: (url: string, data: any) => Promise.resolve({ data }),
  delete: (url: string) => Promise.resolve({ data: null }),
};
```

## 🔒 **Security Best Practices**

### **Input Validation**
```typescript
// src/utils/validation.ts
import { z } from 'zod';

export const employeeSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  position: z.string().min(1, 'Position is required'),
  baseSalary: z.number().min(0, 'Salary must be positive'),
});

export const validateEmployee = (data: any) => {
  return employeeSchema.parse(data);
};
```

### **Request Sanitization**
```typescript
// src/utils/sanitize.ts
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 255); // Limit length
};
```

---

## 📚 **API Reference Links**

- [Backend API Documentation](../../server/docs/api/api-reference.md)
- [Authentication Endpoints](../../server/docs/api/api-reference.md#authentication)
- [HR Management Endpoints](../../server/docs/api/api-reference.md#hr-management)
- [Attendance Endpoints](../../server/docs/api/api-reference.md#attendance)
- [Leave Management Endpoints](../../server/docs/api/api-reference.md#leave-management)
- [Payroll Endpoints](../../server/docs/api/api-reference.md#payroll)

---

**Last Updated**: September 7, 2025  
**API Version**: 1.0.0  
**Status**: Ready for Implementation
