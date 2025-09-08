# Feature Components Documentation

## 🎯 **Feature Components Overview**

This document provides comprehensive documentation for all feature-specific components in the TITO HR Management System. Feature components handle business logic, data display, and user interactions for specific HR functionalities.

## 📋 **Component Categories**

### **Employee Management Components**
- **EmployeeCard** - Employee information display
- **EmployeeTable** - Employee list with sorting and filtering
- **EmployeeForm** - Employee creation and editing
- **EmployeeProfile** - Detailed employee profile view
- **EmployeeSearch** - Employee search and filtering

### **Attendance Management Components**
- **AttendanceCard** - Attendance status and summary
- **AttendanceTable** - Attendance records display
- **AttendanceForm** - Clock in/out form
- **AttendanceCalendar** - Monthly attendance calendar
- **TimeCorrectionForm** - Time correction request form

### **Leave Management Components**
- **LeaveCard** - Leave request and balance display
- **LeaveTable** - Leave requests list
- **LeaveRequestForm** - Leave request submission
- **LeaveBalance** - Leave balance display
- **LeaveCalendar** - Leave schedule calendar

### **Payroll Management Components**
- **PayrollCard** - Payroll information display
- **PayrollTable** - Payroll records list
- **PayrollForm** - Payroll processing form
- **DeductionForm** - Deduction management
- **PayrollSummary** - Payroll summary statistics

### **Department Management Components**
- **DepartmentCard** - Department information display
- **DepartmentTable** - Department list
- **DepartmentForm** - Department creation and editing
- **DepartmentSelector** - Department selection dropdown

### **Request Management Components**
- **RequestCard** - Request information display
- **RequestTable** - Requests list with filtering
- **RequestForm** - Request submission form
- **ApprovalForm** - Request approval/rejection form
- **RequestStatus** - Request status indicator

## 🧩 **Component Specifications**

### **EmployeeCard Component**

**Purpose**: Display employee information in a card format with key details and actions.

```typescript
// src/components/features/EmployeeCard.tsx
interface EmployeeCardProps {
  employee: Employee;
  onEdit?: (employee: Employee) => void;
  onDelete?: (employee: Employee) => void;
  onView?: (employee: Employee) => void;
  showActions?: boolean;
  className?: string;
}

const EmployeeCard: React.FC<EmployeeCardProps> = ({
  employee,
  onEdit,
  onDelete,
  onView,
  showActions = true,
  className
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'terminated': return 'bg-red-100 text-red-800';
      case 'on_leave': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      {/* Header */}
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
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(employee.status)}`}>
          {employee.status}
        </span>
      </div>

      {/* Details */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <span className="text-sm text-text-secondary">Position:</span>
          <span className="text-sm text-text-primary">{employee.position}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-text-secondary">Department:</span>
          <span className="text-sm text-text-primary">{employee.departmentName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-text-secondary">Employment Type:</span>
          <span className="text-sm text-text-primary capitalize">{employee.employmentType}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-text-secondary">Hire Date:</span>
          <span className="text-sm text-text-primary">
            {new Date(employee.hireDate).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
          {onView && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onView(employee)}
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
          )}
          {onEdit && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onEdit(employee)}
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          )}
          {onDelete && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => onDelete(employee)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
```

**Features**:
- Employee avatar with initials
- Status indicator with color coding
- Key employee information display
- Action buttons (view, edit, delete)
- Responsive design
- Accessibility support

### **EmployeeTable Component**

**Purpose**: Display employees in a table format with sorting, filtering, and pagination.

```typescript
// src/components/features/EmployeeTable.tsx
interface EmployeeTableProps {
  employees: Employee[];
  loading?: boolean;
  onEdit?: (employee: Employee) => void;
  onDelete?: (employee: Employee) => void;
  onView?: (employee: Employee) => void;
  onSort?: (field: string, direction: 'asc' | 'desc') => void;
  onFilter?: (filters: EmployeeFilters) => void;
  pagination?: PaginationConfig;
  className?: string;
}

interface EmployeeFilters {
  search?: string;
  department?: string;
  status?: string;
  employmentType?: string;
}

const EmployeeTable: React.FC<EmployeeTableProps> = ({
  employees,
  loading = false,
  onEdit,
  onDelete,
  onView,
  onSort,
  onFilter,
  pagination,
  className
}) => {
  const [filters, setFilters] = useState<EmployeeFilters>({});
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: string) => {
    const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(direction);
    onSort?.(field, direction);
  };

  const handleFilter = (newFilters: EmployeeFilters) => {
    setFilters(newFilters);
    onFilter?.(newFilters);
  };

  const columns = [
    {
      key: 'employeeId',
      title: 'Employee ID',
      sortable: true,
      render: (employee: Employee) => (
        <span className="font-medium text-text-primary">{employee.employeeId}</span>
      ),
    },
    {
      key: 'name',
      title: 'Name',
      sortable: true,
      render: (employee: Employee) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-button-primary rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-medium">
              {employee.firstName[0]}{employee.lastName[0]}
            </span>
          </div>
          <span className="text-text-primary">
            {employee.firstName} {employee.lastName}
          </span>
        </div>
      ),
    },
    {
      key: 'position',
      title: 'Position',
      sortable: true,
      render: (employee: Employee) => (
        <span className="text-text-primary">{employee.position}</span>
      ),
    },
    {
      key: 'department',
      title: 'Department',
      sortable: true,
      render: (employee: Employee) => (
        <span className="text-text-primary">{employee.departmentName}</span>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      render: (employee: Employee) => {
        const statusColors = {
          active: 'bg-green-100 text-green-800',
          inactive: 'bg-gray-100 text-gray-800',
          terminated: 'bg-red-100 text-red-800',
          on_leave: 'bg-yellow-100 text-yellow-800',
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[employee.status]}`}>
            {employee.status}
          </span>
        );
      },
    },
    {
      key: 'actions',
      title: 'Actions',
      sortable: false,
      render: (employee: Employee) => (
        <div className="flex items-center space-x-2">
          {onView && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView(employee)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(employee)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(employee)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Filters */}
      <div className="p-4 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Search
            </label>
            <input
              type="text"
              placeholder="Search employees..."
              value={filters.search || ''}
              onChange={(e) => handleFilter({ ...filters, search: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-button-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Department
            </label>
            <select
              value={filters.department || ''}
              onChange={(e) => handleFilter({ ...filters, department: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-button-primary focus:border-transparent"
            >
              <option value="">All Departments</option>
              {/* Department options */}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Status
            </label>
            <select
              value={filters.status || ''}
              onChange={(e) => handleFilter({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-button-primary focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="terminated">Terminated</option>
              <option value="on_leave">On Leave</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Employment Type
            </label>
            <select
              value={filters.employmentType || ''}
              onChange={(e) => handleFilter({ ...filters, employmentType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-button-primary focus:border-transparent"
            >
              <option value="">All Types</option>
              <option value="regular">Regular</option>
              <option value="contractual">Contractual</option>
              <option value="jo">Job Order</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                  }`}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.title}</span>
                    {column.sortable && (
                      <div className="flex flex-col">
                        <ChevronUp className={`h-3 w-3 ${
                          sortField === column.key && sortDirection === 'asc' ? 'text-button-primary' : 'text-gray-400'
                        }`} />
                        <ChevronDown className={`h-3 w-3 ${
                          sortField === column.key && sortDirection === 'desc' ? 'text-button-primary' : 'text-gray-400'
                        }`} />
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {employees.map((employee) => (
              <tr key={employee.id} className="hover:bg-gray-50">
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4 whitespace-nowrap">
                    {column.render(employee)}
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
- Sortable columns
- Advanced filtering
- Pagination support
- Loading states
- Responsive design
- Action buttons
- Search functionality

### **AttendanceCard Component**

**Purpose**: Display attendance information for an employee with status and summary.

```typescript
// src/components/features/AttendanceCard.tsx
interface AttendanceCardProps {
  attendance: AttendanceRecord;
  employee: Employee;
  onViewDetails?: (attendance: AttendanceRecord) => void;
  onClockIn?: (employeeId: string) => void;
  onClockOut?: (employeeId: string) => void;
  showActions?: boolean;
  className?: string;
}

const AttendanceCard: React.FC<AttendanceCardProps> = ({
  attendance,
  employee,
  onViewDetails,
  onClockIn,
  onClockOut,
  showActions = true,
  className
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'late': return 'bg-yellow-100 text-yellow-800';
      case 'absent': return 'bg-red-100 text-red-800';
      case 'partial': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalHours = attendance.sessions.reduce((sum, session) => sum + session.calculatedHours, 0);

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">
            {employee.firstName} {employee.lastName}
          </h3>
          <p className="text-sm text-text-secondary">{employee.employeeId}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(attendance.overallStatus)}`}>
          {attendance.overallStatus}
        </span>
      </div>

      {/* Date */}
      <div className="mb-4">
        <p className="text-sm text-text-secondary">
          {new Date(attendance.date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>

      {/* Sessions */}
      <div className="space-y-2 mb-4">
        {attendance.sessions.map((session) => (
          <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <span className="text-sm font-medium text-text-primary capitalize">
                {session.sessionType}
              </span>
              <div className="text-xs text-text-secondary">
                {session.clockIn && new Date(session.clockIn).toLocaleTimeString()} - 
                {session.clockOut && new Date(session.clockOut).toLocaleTimeString()}
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-medium text-text-primary">
                {session.calculatedHours.toFixed(1)}h
              </span>
              <div className="text-xs text-text-secondary">
                {session.status}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between mb-4 p-3 bg-button-primary bg-opacity-5 rounded-lg">
        <span className="text-sm font-medium text-text-primary">Total Hours:</span>
        <span className="text-lg font-bold text-button-primary">{totalHours.toFixed(1)}h</span>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
          {onViewDetails && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onViewDetails(attendance)}
            >
              <Eye className="h-4 w-4 mr-1" />
              View Details
            </Button>
          )}
          {onClockIn && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onClockIn(employee.id)}
            >
              <Clock className="h-4 w-4 mr-1" />
              Clock In
            </Button>
          )}
          {onClockOut && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onClockOut(employee.id)}
            >
              <Clock className="h-4 w-4 mr-1" />
              Clock Out
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
```

**Features**:
- Attendance status display
- Session details
- Total hours calculation
- Clock in/out actions
- Date formatting
- Status color coding

### **LeaveRequestForm Component**

**Purpose**: Form for submitting leave requests with validation and approval workflow.

```typescript
// src/components/features/LeaveRequestForm.tsx
interface LeaveRequestFormProps {
  employeeId: string;
  onSubmit: (data: CreateLeaveRequest) => void;
  onCancel: () => void;
  loading?: boolean;
  leaveBalance?: LeaveBalance[];
  className?: string;
}

const LeaveRequestForm: React.FC<LeaveRequestFormProps> = ({
  employeeId,
  onSubmit,
  onCancel,
  loading = false,
  leaveBalance = [],
  className
}) => {
  const [formData, setFormData] = useState<CreateLeaveRequest>({
    employeeId,
    leaveType: 'vacation',
    startDate: '',
    endDate: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.leaveType) {
      newErrors.leaveType = 'Leave type is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      
      if (endDate < startDate) {
        newErrors.endDate = 'End date must be after start date';
      }

      if (startDate < new Date()) {
        newErrors.startDate = 'Start date cannot be in the past';
      }
    }

    // Check leave balance
    const selectedLeaveType = leaveBalance.find(lb => lb.leaveType === formData.leaveType);
    if (selectedLeaveType && formData.startDate && formData.endDate) {
      const daysRequested = Math.ceil((new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
      if (daysRequested > selectedLeaveType.balance) {
        newErrors.endDate = `Insufficient leave balance. Available: ${selectedLeaveType.balance} days`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const getAvailableBalance = (leaveType: string) => {
    const balance = leaveBalance.find(lb => lb.leaveType === leaveType);
    return balance ? balance.balance : 0;
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      {/* Leave Type */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Leave Type *
        </label>
        <select
          value={formData.leaveType}
          onChange={(e) => setFormData({ ...formData, leaveType: e.target.value as any })}
          className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-button-primary focus:border-transparent ${
            errors.leaveType ? 'border-red-300' : 'border-gray-300'
          }`}
        >
          <option value="vacation">Vacation</option>
          <option value="sick">Sick Leave</option>
          <option value="maternity">Maternity Leave</option>
          <option value="other">Other</option>
        </select>
        {errors.leaveType && (
          <p className="mt-1 text-sm text-red-600">{errors.leaveType}</p>
        )}
        <p className="mt-1 text-sm text-text-secondary">
          Available balance: {getAvailableBalance(formData.leaveType)} days
        </p>
      </div>

      {/* Start Date */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Start Date *
        </label>
        <input
          type="date"
          value={formData.startDate}
          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-button-primary focus:border-transparent ${
            errors.startDate ? 'border-red-300' : 'border-gray-300'
          }`}
        />
        {errors.startDate && (
          <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
        )}
      </div>

      {/* End Date */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          End Date *
        </label>
        <input
          type="date"
          value={formData.endDate}
          onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
          className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-button-primary focus:border-transparent ${
            errors.endDate ? 'border-red-300' : 'border-gray-300'
          }`}
        />
        {errors.endDate && (
          <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
        )}
      </div>

      {/* Leave Balance Display */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-text-primary mb-2">Leave Balance</h4>
        <div className="grid grid-cols-2 gap-4">
          {leaveBalance.map((balance) => (
            <div key={balance.leaveType} className="text-center">
              <div className="text-lg font-bold text-button-primary">{balance.balance}</div>
              <div className="text-xs text-text-secondary capitalize">{balance.leaveType}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          loading={loading}
        >
          Submit Request
        </Button>
      </div>
    </form>
  );
};
```

**Features**:
- Form validation
- Leave balance checking
- Date validation
- Leave type selection
- Error handling
- Loading states

## 🎨 **Styling Guidelines**

### **Card Components**
```typescript
const cardStyles = {
  base: 'bg-white rounded-lg shadow-sm border border-gray-200',
  padding: 'p-6',
  hover: 'hover:shadow-md transition-shadow',
  header: 'border-b border-gray-200 pb-4 mb-4',
  footer: 'border-t border-gray-200 pt-4 mt-4',
};
```

### **Table Components**
```typescript
const tableStyles = {
  container: 'bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden',
  header: 'bg-gray-50 border-b border-gray-200',
  row: 'hover:bg-gray-50 transition-colors',
  cell: 'px-6 py-4 whitespace-nowrap',
  actions: 'flex items-center space-x-2',
};
```

### **Form Components**
```typescript
const formStyles = {
  container: 'space-y-6',
  field: 'space-y-2',
  label: 'block text-sm font-medium text-text-primary',
  input: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-button-primary focus:border-transparent',
  error: 'text-sm text-red-600',
  help: 'text-sm text-text-secondary',
};
```

## ♿ **Accessibility Features**

### **Keyboard Navigation**
- Tab order follows logical flow
- Enter key submits forms
- Escape key cancels actions
- Arrow keys navigate tables

### **Screen Reader Support**
- Proper ARIA labels
- Table headers and captions
- Form field descriptions
- Status announcements

### **Visual Indicators**
- Clear focus states
- Color contrast compliance
- Status color coding
- Loading indicators

## 📱 **Responsive Behavior**

### **Mobile Layout**
- Stacked card layouts
- Horizontal scrolling tables
- Touch-friendly buttons
- Optimized form layouts

### **Tablet Layout**
- Adjusted card sizes
- Responsive table columns
- Optimized spacing
- Touch interactions

### **Desktop Layout**
- Multi-column layouts
- Full table visibility
- Hover states
- Keyboard shortcuts

## 🧪 **Testing Guidelines**

### **Unit Tests**
```typescript
// Example test for EmployeeCard
describe('EmployeeCard', () => {
  it('renders employee information correctly', () => {
    const employee = mockEmployee;
    render(<EmployeeCard employee={employee} />);
    
    expect(screen.getByText(`${employee.firstName} ${employee.lastName}`)).toBeInTheDocument();
    expect(screen.getByText(employee.employeeId)).toBeInTheDocument();
    expect(screen.getByText(employee.position)).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = jest.fn();
    const employee = mockEmployee;
    
    render(<EmployeeCard employee={employee} onEdit={onEdit} />);
    
    fireEvent.click(screen.getByText('Edit'));
    expect(onEdit).toHaveBeenCalledWith(employee);
  });
});
```

### **Integration Tests**
- Test component interactions
- Test form submissions
- Test data flow
- Test error handling

## 📦 **Export Structure**

```typescript
// src/components/features/index.ts
// Employee Components
export { EmployeeCard } from './EmployeeCard';
export { EmployeeTable } from './EmployeeTable';
export { EmployeeForm } from './EmployeeForm';
export { EmployeeProfile } from './EmployeeProfile';

// Attendance Components
export { AttendanceCard } from './AttendanceCard';
export { AttendanceTable } from './AttendanceTable';
export { AttendanceForm } from './AttendanceForm';
export { AttendanceCalendar } from './AttendanceCalendar';

// Leave Components
export { LeaveCard } from './LeaveCard';
export { LeaveTable } from './LeaveTable';
export { LeaveRequestForm } from './LeaveRequestForm';
export { LeaveBalance } from './LeaveBalance';

// Payroll Components
export { PayrollCard } from './PayrollCard';
export { PayrollTable } from './PayrollTable';
export { PayrollForm } from './PayrollForm';

// Department Components
export { DepartmentCard } from './DepartmentCard';
export { DepartmentTable } from './DepartmentTable';
export { DepartmentForm } from './DepartmentForm';

// Request Components
export { RequestCard } from './RequestCard';
export { RequestTable } from './RequestTable';
export { RequestForm } from './RequestForm';
export { ApprovalForm } from './ApprovalForm';

// Types
export type { EmployeeCardProps } from './EmployeeCard';
export type { EmployeeTableProps } from './EmployeeTable';
export type { AttendanceCardProps } from './AttendanceCard';
export type { LeaveRequestFormProps } from './LeaveRequestForm';
```

---

**Last Updated**: January 2025  
**Component Library Version**: 1.0.0  
**Status**: Ready for Implementation
