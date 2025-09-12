// Core Types for TITO HR Management System

export type UserRole = 'hr' | 'department_head' | 'employee';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentHead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  department?: {
    id: string;
    name: string;
    description: string;
  } | null;
}

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

export interface DepartmentEmployee {
  id: string;
  employeeId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  position: string;
  employmentType: string;
  baseSalary: number;
  hireDate: string;
  status: string;
  lastAttendance?: string;
}

export interface IdCard {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  departmentName: string | null;
  qrCodeHash: string;
  isActive: boolean;
  expiryDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIdCardRequest {
  employeeId: string;
  expiryYears?: number;
}

export interface IdCardListParams {
  page?: number;
  limit?: number;
  search?: string;
  departmentId?: string;
  isActive?: boolean;
  isExpired?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface Department {
  id: string;
  name: string;
  description: string | null;
  departmentHeadUserId: string | null;
  departmentHead: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  } | null;
  employeeCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string; // DATE format
  overallStatus: 'present' | 'late' | 'absent' | 'partial';
  sessions: AttendanceSession[];
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceSession {
  id: string;
  sessionType: string;
  clockIn: string | null; // TIMESTAMP
  clockOut: string | null; // TIMESTAMP
  calculatedHours: number; // DECIMAL(5,2)
  lateHours: number; // DECIMAL(5,2)
  status: 'present' | 'late' | 'early' | 'absent';
  selfieImagePath: string | null;
  selfieTakenAt: string | null;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveType: 'vacation' | 'sick' | 'maternity' | 'other';
  startDate: string; // DATE
  endDate: string; // DATE
  status: 'pending' | 'approved' | 'rejected';
  approverId: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveBalance {
  id: string;
  employeeId: string;
  leaveType: 'vacation' | 'sick' | 'maternity' | 'other';
  balance: number; // DECIMAL(5,2)
  updatedAt: string;
}

export interface PayrollRecord {
  id: string;
  payrollPeriodId: string;
  employeeId: string;
  employeeName?: string;
  periodName?: string;
  departmentId?: string;
  departmentName?: string;
  position?: string;
  baseSalary: number; // DECIMAL(10,2)
  hourlyRate: number; // DECIMAL(10,2)
  totalWorkedHours: number; // DECIMAL(5,2)
  totalRegularHours: number; // DECIMAL(5,2)
  totalOvertimeHours: number; // DECIMAL(5,2)
  totalLateHours: number; // DECIMAL(5,2)
  lateDeductions: number; // DECIMAL(10,2)
  paidLeaveHours: number; // DECIMAL(6,2) - Hours from approved leave days
  grossPay: number; // DECIMAL(10,2)
  netPay: number; // DECIMAL(10,2)
  totalDeductions: number; // DECIMAL(10,2)
  totalBenefits: number; // DECIMAL(10,2) - NEW FIELD
  status: 'draft' | 'processed' | 'paid';
  deductions: PayrollDeduction[];
  createdAt: string;
  updatedAt: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  approvalApprovedAt?: string;
  approvalComments?: string;
}

export interface PayrollDeduction {
  id: string;
  deductionTypeId: string;
  deductionTypeName: string;
  amount: number; // DECIMAL(10,2)
  description: string | null;
}

export interface TimeCorrectionRequest {
  id: string;
  employeeId: string;
  attendanceSessionId: string | null;
  correctionDate: string; // DATE
  sessionType: 'clock_in' | 'clock_out';
  requestedClockIn: string | null; // TIMESTAMP
  requestedClockOut: string | null; // TIMESTAMP
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approverId: string | null;
  approvedAt: string | null;
  comments: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OvertimeRequest {
  id: string;
  employeeId: string;
  requestDate: string; // DATE
  overtimeDate: string; // DATE
  startTime: string; // TIME
  endTime: string; // TIME
  requestedHours: number; // DECIMAL(5,2)
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approverId: string | null;
  approvedAt: string | null;
  comments: string | null;
  createdAt: string;
  updatedAt: string;
}

// API Request/Response Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    user: User;
  };
}

export interface CreateEmployeeRequest {
  email: string;
  firstName: string;
  lastName: string;
  departmentId: string;
  position: string;
  employmentType: 'regular' | 'contractual' | 'jo';
  hireDate: string;
  baseSalary: number;
}

export interface UpdateEmployeeRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  departmentId?: string;
  position?: string;
  employmentType?: 'regular' | 'contractual' | 'jo';
  baseSalary?: number;
  status?: 'active' | 'inactive' | 'terminated' | 'on_leave';
}

export interface CreateLeaveRequest {
  employeeId: string;
  leaveType: 'vacation' | 'sick' | 'maternity' | 'other';
  startDate: string;
  endDate: string;
}

export interface EmployeeFilters {
  search?: string;
  department?: string;
  status?: string;
  employmentType?: string;
}

export interface PaginationConfig {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export interface SortingConfig {
  field: string;
  direction: 'asc' | 'desc';
  onSort: (field: string, direction: 'asc' | 'desc') => void;
}

export interface FilteringConfig {
  filters: Record<string, any>;
  onFilter: (filters: Record<string, any>) => void;
}

// Component Props Types
export interface AppLayoutProps {
  children: React.ReactNode;
  role: UserRole;
  className?: string;
}

export interface HeaderProps {
  role: UserRole;
  className?: string;
}

export interface SidebarProps {
  role: UserRole;
  isCollapsed?: boolean;
  onToggle?: () => void;
  className?: string;
}

export interface PageLayoutProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: (e?: React.FormEvent) => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export interface InputProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'month';
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
  step?: string;
  min?: string;
  max?: string;
  // React Hook Form compatibility
  onBlur?: (event: any) => void;
  ref?: any;
}

export interface CardProps {
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

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closable?: boolean;
  className?: string;
  footer?: React.ReactNode;
}

export interface TableProps<T> {
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

export interface Column<T> {
  key: keyof T | string;
  title: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'white';
  className?: string;
}

// Error Types

export interface ErrorState {
  id: string;
  code: string;
  message: string;
  type: 'error' | 'warning' | 'info';
  details?: any;
  timestamp: Date;
}

// Notification Types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

// Dashboard Types
export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  totalDepartments: number;
  pendingRequests: number;
  todayAttendance: number;
  monthlyPayroll: number;
}

export interface AttendanceStats {
  present: number;
  late: number;
  absent: number;
  total: number;
}

export interface LeaveStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

// Additional Types for New Pages
export interface PayrollPeriod {
  id: string;
  name: string;
  periodName: string;
  startDate: string;
  endDate: string;
  status: 'draft' | 'processing' | 'completed' | 'cancelled' | 'sent_for_review';
  totalEmployees: number;
  totalAmount: number;
  workingDays?: number;
  expectedHours?: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  approvalComments?: string;
  approvedAt?: string;
}

export interface PayrollApproval {
  id: string;
  payrollPeriodId: string;
  approverId: string;
  departmentId?: string;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  // Nested objects from backend
  approver?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  department?: {
    id: string;
    name: string;
    description?: string;
  };
  payrollPeriod?: {
    id: string;
    periodName: string;
    startDate: string;
    endDate: string;
    status: string;
  };
  // Computed fields for backward compatibility
  approverName?: string;
  departmentName?: string;
}


export interface SystemSetting {
  id: string;
  settingKey: string;
  settingValue: string;
  dataType: 'string' | 'number' | 'boolean' | 'json' | 'decimal';
  description?: string;
  isEditable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentRequest {
  name: string;
  description?: string;
  departmentHeadId?: string;
}

export interface UpdateDepartmentRequest {
  name?: string;
  description?: string;
  departmentHeadId?: string;
  isActive?: boolean;
}

// Employee List Parameters
export interface EmployeeListParams {
  page?: number;
  limit?: number;
  status?: 'active' | 'inactive' | 'terminated' | 'on_leave';
  departmentId?: string;
  search?: string;
}

// ===== NEW PAYROLL SYSTEM TYPES =====

// Deduction Types Management
export interface DeductionType {
  id: string;
  name: string;
  description?: string;
  percentage?: number; // DECIMAL(5,2) - percentage-based deduction
  fixedAmount?: number; // DECIMAL(10,2) - fixed amount deduction
  amount?: number; // Added for form compatibility
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDeductionTypeRequest {
  name: string;
  description?: string;
  percentage?: number;
  fixedAmount?: number;
  amount?: number; // Added for form compatibility
  isActive?: boolean;
}

export interface UpdateDeductionTypeRequest {
  name?: string;
  description?: string;
  percentage?: number;
  fixedAmount?: number;
  amount?: number; // Added for form compatibility
  isActive?: boolean;
}

// Benefit Types Management
export interface BenefitType {
  id: string;
  name: string;
  description?: string;
  amount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBenefitTypeRequest {
  name: string;
  description?: string;
  amount: number;
  isActive?: boolean;
}

export interface UpdateBenefitTypeRequest {
  name?: string;
  description?: string;
  amount?: number;
  isActive?: boolean;
}

// Employee Deduction Balances Management
export interface EmployeeDeductionBalance {
  id: string;
  employeeId: string;
  deductionTypeId: string;
  deductionTypeName: string;
  originalAmount: number; // DECIMAL(10,2)
  remainingBalance: number; // DECIMAL(10,2)
  monthlyDeductionAmount: number; // DECIMAL(10,2)
  startDate: string; // DATE
  endDate?: string; // DATE
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Additional fields for display
  employeeName?: string;
  employeeCode?: string;
}

export interface CreateEmployeeDeductionBalanceRequest {
  employeeId: string;
  deductionTypeId: string;
  originalAmount: number;
  remainingBalance: number;
  monthlyDeductionAmount: number;
  startDate: string;
  endDate?: string;
  isActive?: boolean;
}

export interface UpdateEmployeeDeductionBalanceRequest {
  originalAmount?: number;
  remainingBalance?: number;
  monthlyDeductionAmount?: number;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

// Employee Benefits Management
export interface EmployeeBenefit {
  id: string;
  employeeId: string;
  benefitTypeId: string;
  benefitTypeName: string;
  amount: number; // DECIMAL(10,2)
  startDate: string; // DATE
  endDate?: string; // DATE
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Additional fields for display
  employeeName?: string;
  employeeCode?: string;
}

export interface CreateEmployeeBenefitRequest {
  employeeId: string;
  benefitTypeId: string;
  amount: number;
  startDate: string;
  endDate?: string;
  isActive?: boolean;
}

export interface UpdateEmployeeBenefitRequest {
  benefitTypeId?: string;
  amount?: number;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

// CSV Upload Types
export interface EmployeeDeductionBalanceCSVRow {
  employee_name: string;
  employee_id: string;
  deduction_type_name: string;
  deduction_type_id: string;
  remaining_balance: string;
  monthly_deduction_amount?: string;
  start_date?: string;
  end_date?: string;
  is_active?: string;
}

export interface CSVUploadResponse {
  successCount: number;
  errorCount: number;
  errors: Array<{
    row: number;
    error: string;
  }>;
}

// Updated PayrollRecord with new fields (duplicate for the new system)
export interface NewPayrollRecord {
  id: string;
  payrollPeriodId: string;
  employeeId: string;
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
  totalBenefits: number; // DECIMAL(10,2) - NEW FIELD
  status: 'draft' | 'processed' | 'paid';
  createdAt: string;
  updatedAt: string;
  // Additional fields for display
  employee?: {
    employeeId: string;
    user: {
      firstName: string;
      lastName: string;
    };
    department?: {
      name: string;
    };
  };
}
