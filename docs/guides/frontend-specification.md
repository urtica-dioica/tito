# Frontend Specification & UI Requirements

## 🎨 **Frontend Specification Overview**

This document defines the complete UI requirements, design specifications, and user experience guidelines for the TITO HR Management System frontend. The specification covers all user roles, interfaces, and interaction patterns.

## 🎯 **Design Principles**

### **Core Design Values**
1. **User-Centric**: Interfaces designed for specific user roles and workflows
2. **Accessibility**: WCAG 2.1 AA compliance for inclusive design
3. **Consistency**: Unified design language across all interfaces
4. **Efficiency**: Streamlined workflows for common tasks
5. **Responsiveness**: Optimal experience across all device sizes
6. **Performance**: Fast loading and smooth interactions

### **Visual Design Philosophy**
- **Clean & Modern**: Minimalist design with clear hierarchy
- **Professional**: Corporate-appropriate styling and branding
- **Intuitive**: Self-explanatory interfaces with clear navigation
- **Scalable**: Design system that grows with the application

## 🎨 **Color Palette Specification**

### **Primary Colors**
**TITO HR Color System:**
```typescript
// TITO HR Color Palette
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
  
  // Semantic Colors (using the primary colors as base)
  semantic: {
    success: '#10b981',    // Green for success states
    warning: '#f59e0b',    // Amber for warnings
    error: '#ef4444',      // Red for errors
    info: '#3b82f6',       // Blue for information
  },
};
```

### **Semantic Colors**
```typescript
const semanticColors = {
  success: '#10b981',    // Green for success states
  warning: '#f59e0b',    // Amber for warnings
  error: '#ef4444',      // Red for errors
  info: '#3b82f6',       // Blue for information
  neutral: '#6b7280',    // Gray for neutral states
};
```

### **Color Usage Guidelines**
- **Primary Text (#0F0F0F)**: Main content, headings, and important text
- **Secondary Text (#DCDCDC)**: Supporting text, labels, and secondary information
- **Primary Background (#FAF9EE)**: Main page backgrounds and content areas
- **Secondary Background (#EEEEEE)**: Cards, panels, and secondary content areas
- **Primary Button (#181C14)**: Main actions, submit buttons, and primary CTAs
- **Secondary Button (#F8FAFC)**: Secondary actions, cancel buttons, and alternative CTAs
- **Success**: Confirmation messages, completed states
- **Warning**: Caution messages, pending states
- **Error**: Error messages, destructive actions
- **Info**: Informational messages, help text

## 📝 **Typography Specification**

### **Font Family**
```typescript
const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
    mono: ['JetBrains Mono', 'Consolas', 'Monaco', 'monospace'],
  },
};
```

### **Type Scale**
```typescript
const typeScale = {
  // Headings
  h1: {
    fontSize: '2.25rem',    // 36px
    lineHeight: '2.5rem',   // 40px
    fontWeight: 700,
    letterSpacing: '-0.025em',
  },
  h2: {
    fontSize: '1.875rem',   // 30px
    lineHeight: '2.25rem',  // 36px
    fontWeight: 600,
    letterSpacing: '-0.025em',
  },
  h3: {
    fontSize: '1.5rem',     // 24px
    lineHeight: '2rem',     // 32px
    fontWeight: 600,
  },
  h4: {
    fontSize: '1.25rem',    // 20px
    lineHeight: '1.75rem',  // 28px
    fontWeight: 600,
  },
  h5: {
    fontSize: '1.125rem',   // 18px
    lineHeight: '1.75rem',  // 28px
    fontWeight: 600,
  },
  h6: {
    fontSize: '1rem',       // 16px
    lineHeight: '1.5rem',   // 24px
    fontWeight: 600,
  },
  
  // Body text
  body: {
    fontSize: '1rem',       // 16px
    lineHeight: '1.5rem',   // 24px
    fontWeight: 400,
  },
  bodySmall: {
    fontSize: '0.875rem',   // 14px
    lineHeight: '1.25rem',  // 20px
    fontWeight: 400,
  },
  
  // UI text
  caption: {
    fontSize: '0.75rem',    // 12px
    lineHeight: '1rem',     // 16px
    fontWeight: 400,
  },
  label: {
    fontSize: '0.875rem',   // 14px
    lineHeight: '1.25rem',  // 20px
    fontWeight: 500,
  },
};
```

### **Typography Usage Guidelines**
- **H1**: Page titles and main headings
- **H2**: Section headings
- **H3**: Subsection headings
- **H4-H6**: Component headings and labels
- **Body**: Main content text
- **Body Small**: Secondary content and descriptions
- **Caption**: Metadata, timestamps, and small text
- **Label**: Form labels and UI element labels

## 📐 **Spacing & Layout**

### **Spacing Scale**
```typescript
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
  32: '8rem',    // 128px
};
```

### **Layout Grid System**
```typescript
const grid = {
  container: {
    maxWidth: '1280px',
    padding: '0 1rem',
    margin: '0 auto',
  },
  columns: 12,
  gutters: '1.5rem', // 24px
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  },
};
```

### **Component Spacing**
- **Card Padding**: 24px (1.5rem)
- **Form Spacing**: 16px (1rem) between form elements
- **Section Spacing**: 32px (2rem) between major sections
- **List Item Spacing**: 12px (0.75rem) between list items

## 🧩 **Component Specifications**

### **Button Components**
```typescript
interface ButtonSpec {
  variants: {
    primary: {
      background: 'primary-600',
      text: 'white',
      hover: 'primary-700',
      focus: 'primary-500',
    },
    secondary: {
      background: 'gray-200',
      text: 'gray-900',
      hover: 'gray-300',
      focus: 'gray-500',
    },
    outline: {
      background: 'transparent',
      text: 'gray-700',
      border: 'gray-300',
      hover: 'gray-50',
      focus: 'primary-500',
    },
    ghost: {
      background: 'transparent',
      text: 'gray-700',
      hover: 'gray-100',
      focus: 'gray-500',
    },
    danger: {
      background: 'red-600',
      text: 'white',
      hover: 'red-700',
      focus: 'red-500',
    },
  },
  sizes: {
    sm: { padding: '0.375rem 0.75rem', fontSize: '0.875rem' },
    md: { padding: '0.5rem 1rem', fontSize: '1rem' },
    lg: { padding: '0.75rem 1.5rem', fontSize: '1.125rem' },
  },
  borderRadius: '0.375rem', // 6px
  transition: 'all 0.2s ease-in-out',
}
```

### **Input Components**
```typescript
interface InputSpec {
  base: {
    padding: '0.5rem 0.75rem',
    fontSize: '1rem',
    borderRadius: '0.375rem',
    border: '1px solid gray-300',
    background: 'white',
  },
  states: {
    focus: {
      border: 'primary-500',
      ring: 'primary-500',
      ringWidth: '2px',
    },
    error: {
      border: 'red-300',
      ring: 'red-500',
    },
    disabled: {
      background: 'gray-50',
      text: 'gray-500',
      cursor: 'not-allowed',
    },
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: 'gray-700',
    marginBottom: '0.25rem',
  },
  helper: {
    fontSize: '0.75rem',
    marginTop: '0.25rem',
  },
}
```

### **Card Components**
```typescript
interface CardSpec {
  base: {
    background: 'white',
    borderRadius: '0.5rem',
    border: '1px solid gray-200',
    shadow: 'sm',
  },
  padding: {
    sm: '1rem',    // 16px
    md: '1.5rem',  // 24px
    lg: '2rem',    // 32px
  },
  header: {
    padding: '1.5rem 1.5rem 0 1.5rem',
    borderBottom: '1px solid gray-200',
    marginBottom: '1.5rem',
  },
  footer: {
    padding: '0 1.5rem 1.5rem 1.5rem',
    borderTop: '1px solid gray-200',
    marginTop: '1.5rem',
  },
}
```

## 📱 **Responsive Design Specifications**

### **Breakpoint System**
```typescript
const breakpoints = {
  mobile: {
    min: '0px',
    max: '639px',
    container: '100%',
    columns: 1,
    gutters: '1rem',
  },
  tablet: {
    min: '640px',
    max: '1023px',
    container: '640px',
    columns: 2,
    gutters: '1.5rem',
  },
  desktop: {
    min: '1024px',
    max: '1279px',
    container: '1024px',
    columns: 3,
    gutters: '2rem',
  },
  large: {
    min: '1280px',
    max: '1535px',
    container: '1280px',
    columns: 4,
    gutters: '2rem',
  },
  xlarge: {
    min: '1536px',
    max: 'infinity',
    container: '1536px',
    columns: 4,
    gutters: '2rem',
  },
};
```

### **Responsive Patterns**
- **Mobile First**: Design for mobile, enhance for larger screens
- **Progressive Enhancement**: Add features as screen size increases
- **Touch Friendly**: Minimum 44px touch targets on mobile
- **Readable Text**: Minimum 16px font size on mobile devices

## 🎭 **User Role Interfaces**

### **HR Interface**
```typescript
interface HRInterface {
  layout: {
    sidebar: {
      width: '256px',
      collapsed: '64px',
      items: [
        'Dashboard',
        'Employees',
        'Departments',
        'Payrolls',
        'Requests',
        'Settings',
      ],
    },
    header: {
      height: '64px',
      elements: ['Logo', 'Search', 'Notifications', 'User Menu'],
    },
  },
  features: {
    dashboard: 'System overview and key metrics',
    employeeManagement: 'Add, edit, view, delete employee records',
    departmentManagement: 'Manage departments and department heads',
    idCardManagement: 'Generate and manage employee ID cards (within departments)',
    payrollManagement: 'Setup deduction types, benefits, upload employee deduction balances, and manage automatic payroll generation',
    requestsView: 'View all requests (read-only, department heads handle approvals)',
    systemSettings: 'Configure system parameters',
  },
  userMenu: {
    avatar: 'Initials-based avatar',
    name: 'User full name',
    actions: ['Profile', 'Logout'],
  },
  colors: {
    primary: '#181C14',
    background: '#FAF9EE',
    text: '#0F0F0F',
  },
}
```

### **Department Head Interface**
```typescript
interface DepartmentHeadInterface {
  layout: {
    sidebar: {
      width: '256px',
      items: [
        'Employees',
        'Payrolls',
        'Requests',
      ],
    },
  },
  features: {
    employees: 'View department employees (read-only, no edit/delete)',
    payrolls: 'Review and approve department payroll records (read-only, approve/reject only)',
    requests: 'View and manage employee requests (approve/reject)',
  },
  userMenu: {
    avatar: 'Initials-based avatar',
    name: 'User full name',
    actions: ['Profile', 'Logout'],
  },
  colors: {
    primary: '#181C14',
    background: '#FAF9EE',
    text: '#0F0F0F',
  },
}
```

### **Employee Interface**
```typescript
interface EmployeeInterface {
  layout: {
    sidebar: {
      width: '240px',
      items: [
        'Attendance',
        'Requests',
      ],
    },
  },
  features: {
    attendance: 'View personal attendance records and history',
    requests: 'Submit and manage requests (time corrections, overtime, leaves)',
    leaveBalance: 'View leave balance (integrated within requests interface)',
  },
  userMenu: {
    avatar: 'Initials-based avatar',
    name: 'User full name',
    actions: ['Profile', 'Logout'],
  },
  colors: {
    primary: '#181C14',
    background: '#FAF9EE',
    text: '#0F0F0F',
  },
}
```

### **Kiosk Interface**
```typescript
interface KioskInterface {
  layout: {
    fullscreen: true,
    header: {
      height: '80px',
      elements: ['Logo', 'Title', 'Time'],
    },
    main: {
      centered: true,
      maxWidth: '800px',
    },
  },
  components: {
    qrScanner: {
      size: '400px',
      border: '4px solid primary-500',
      borderRadius: '1rem',
    },
    employeeDisplay: {
      card: true,
      padding: '2rem',
      textAlign: 'center',
    },
  },
  colors: {
    primary: 'blue-600',
    background: 'gray-50',
    accent: 'blue-500',
  },
}
```

## 🎨 **Visual Design Elements**

### **Icons & Imagery**
```typescript
const iconography = {
  library: 'Lucide React',
  size: {
    sm: '16px',
    md: '20px',
    lg: '24px',
    xl: '32px',
  },
  style: {
    stroke: '2px',
    fill: 'none',
    color: 'currentColor',
  },
  categories: {
    navigation: ['Home', 'Users', 'Settings', 'Logout'],
    actions: ['Add', 'Edit', 'Delete', 'Save', 'Cancel'],
    status: ['Check', 'X', 'Alert', 'Info'],
    business: ['Employee', 'Department', 'Payroll', 'Attendance'],
  },
};
```

### **Shadows & Elevation**
```typescript
const elevation = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
};
```

### **Animation & Transitions**
```typescript
const animations = {
  duration: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
  },
  easing: {
    ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  properties: {
    opacity: 'opacity 200ms ease',
    transform: 'transform 200ms ease',
    color: 'color 200ms ease',
    background: 'background-color 200ms ease',
  },
};
```

## ♿ **Accessibility Specifications**

### **WCAG 2.1 AA Compliance**
```typescript
const accessibility = {
  colorContrast: {
    normal: '4.5:1',
    large: '3:1',
    ui: '3:1',
  },
  focus: {
    visible: true,
    style: '2px solid primary-500',
    offset: '2px',
  },
  keyboard: {
    tabOrder: 'logical',
    skipLinks: true,
    shortcuts: {
      main: 'Alt + M',
      search: 'Alt + S',
      navigation: 'Alt + N',
    },
  },
  screenReader: {
    labels: 'descriptive',
    landmarks: 'semantic',
    announcements: 'contextual',
  },
};
```

### **Accessibility Features**
- **High Contrast Mode**: Support for high contrast color schemes
- **Reduced Motion**: Respect user's motion preferences
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **Focus Management**: Clear focus indicators and logical tab order

## 📊 **Data Visualization**

### **Charts & Graphs**
```typescript
const charts = {
  library: 'Chart.js or Recharts',
  colors: {
    primary: ['primary-500', 'primary-600', 'primary-700'],
    secondary: ['gray-400', 'gray-500', 'gray-600'],
    success: ['green-400', 'green-500', 'green-600'],
    warning: ['yellow-400', 'yellow-500', 'yellow-600'],
    error: ['red-400', 'red-500', 'red-600'],
  },
  types: {
    line: 'Attendance trends, performance over time',
    bar: 'Department comparisons, monthly reports',
    pie: 'Leave distribution, status breakdowns',
    donut: 'Attendance percentages, completion rates',
  },
};
```

### **Data Tables**
```typescript
const tables = {
  styling: {
    header: {
      background: 'gray-50',
      text: 'gray-900',
      fontWeight: '600',
      padding: '0.75rem 1rem',
    },
    row: {
      hover: 'gray-50',
      border: '1px solid gray-200',
      padding: '0.75rem 1rem',
    },
    cell: {
      padding: '0.75rem 1rem',
      fontSize: '0.875rem',
    },
  },
  features: {
    sorting: true,
    filtering: true,
    pagination: true,
    selection: true,
    actions: true,
  },
};
```

## 💰 **Payroll Process Components**

### **HR Admin Payroll Interface**

#### **1. Deduction Types Management**
```typescript
interface DeductionTypesInterface {
  components: {
    listView: {
      table: {
        columns: ['Name', 'Type', 'Value', 'Status', 'Actions'],
        actions: ['Edit', 'Delete', 'Toggle Status'],
      },
      filters: ['Status', 'Type'],
      search: 'Search by name or description',
    },
    createForm: {
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'description', type: 'textarea' },
        { name: 'type', type: 'radio', options: ['percentage', 'fixed'] },
        { name: 'value', type: 'number', required: true },
        { name: 'isActive', type: 'checkbox', default: true },
      ],
      validation: 'Either percentage or fixed amount, not both',
    },
  },
  layout: {
    header: 'Deduction Types Management',
    actions: ['Create New', 'Bulk Actions'],
    pagination: true,
  },
}
```

#### **2. Benefits Management**
```typescript
interface BenefitsInterface {
  components: {
    listView: {
      table: {
        columns: ['Name', 'Description', 'Status', 'Actions'],
        actions: ['Edit', 'Delete', 'Toggle Status'],
      },
      filters: ['Status'],
      search: 'Search by name or description',
    },
    createForm: {
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'description', type: 'textarea' },
        { name: 'isActive', type: 'checkbox', default: true },
      ],
    },
  },
  layout: {
    header: 'Benefits Management',
    actions: ['Create New', 'Bulk Actions'],
    pagination: true,
  },
}
```

#### **3. Employee Deduction Balances Upload**
```typescript
interface DeductionUploadInterface {
  components: {
    uploadArea: {
      dragDrop: true,
      fileTypes: ['.csv'],
      maxSize: '10MB',
      validation: 'CSV format validation',
    },
    csvTemplate: {
      download: 'Download CSV template',
      columns: [
        'employee_name',
        'employee_id', 
        'deduction_type_name',
        'deduction_type_id',
        'remaining_balance'
      ],
      example: 'Sample data preview',
    },
    progressIndicator: {
      uploadProgress: 'Real-time upload progress',
      processingStatus: 'Row-by-row processing status',
      errorReporting: 'Detailed error messages for failed rows',
    },
    results: {
      successCount: 'Successfully processed records',
      errorCount: 'Failed records with reasons',
      errorDetails: 'Downloadable error report',
    },
  },
  layout: {
    header: 'Upload Employee Deduction Balances',
    steps: ['Select File', 'Validate', 'Upload', 'Review Results'],
  },
}
```

#### **4. Employee Benefits Assignment**
```typescript
interface EmployeeBenefitsInterface {
  components: {
    employeeSelector: {
      search: 'Search by employee name or ID',
      filters: ['Department', 'Status'],
      multiSelect: true,
    },
    benefitAssignment: {
      benefitTypes: 'Available benefit types dropdown',
      amount: 'Benefit amount input',
      startDate: 'Start date picker',
      endDate: 'End date picker (optional)',
      isActive: 'Active status toggle',
    },
    bulkAssignment: {
      selectAll: 'Select all employees',
      bulkAmount: 'Set amount for all selected',
      bulkStartDate: 'Set start date for all selected',
    },
  },
  layout: {
    header: 'Employee Benefits Assignment',
    sections: ['Select Employees', 'Assign Benefits', 'Review & Save'],
  },
}
```

#### **5. Automatic Payroll Generation**
```typescript
interface PayrollGenerationInterface {
  components: {
    periodOverview: {
      currentPeriod: 'Current month period display',
      status: 'Generation status indicator',
      employeeCount: 'Total employees count',
      lastGenerated: 'Last generation timestamp',
    },
    generationControls: {
      generateButton: 'Generate Monthly Payroll',
      forceRegenerate: 'Force regenerate (if already exists)',
      previewMode: 'Preview before generation',
    },
    progressIndicator: {
      steps: [
        'Create Payroll Period',
        'Calculate Attendance Hours',
        'Apply Deductions',
        'Apply Benefits',
        'Generate Records',
        'Complete'
      ],
      realTimeProgress: 'Step-by-step progress',
      errorHandling: 'Error reporting and recovery',
    },
    results: {
      summary: 'Generation summary statistics',
      errors: 'Any errors encountered',
      nextSteps: 'Recommended next actions',
    },
  },
  layout: {
    header: 'Automatic Payroll Generation',
    sections: ['Period Overview', 'Generation Controls', 'Progress', 'Results'],
  },
}
```

### **Department Head Payroll Interface**

#### **1. Payroll Review Dashboard**
```typescript
interface PayrollReviewInterface {
  components: {
    periodSelector: {
      dropdown: 'Select payroll period to review',
      statusFilter: 'Filter by approval status',
      departmentFilter: 'Filter by department (if multiple)',
    },
    summaryCards: {
      totalEmployees: 'Total employees in department',
      pendingApprovals: 'Pending approval count',
      approvedCount: 'Approved count',
      rejectedCount: 'Rejected count',
    },
    payrollTable: {
      columns: [
        'Employee Name',
        'Position',
        'Base Salary',
        'Worked Hours',
        'Regular Hours',
        'Late Hours',
        'Gross Pay',
        'Deductions',
        'Benefits',
        'Net Pay',
        'Status',
        'Actions'
      ],
      sorting: 'Sort by any column',
      filtering: 'Filter by status, amount ranges',
      selection: 'Multi-select for bulk actions',
    },
    bulkActions: {
      approveSelected: 'Approve selected records',
      rejectSelected: 'Reject selected records',
      exportSelected: 'Export selected records',
    },
    individualActions: {
      viewDetails: 'View detailed breakdown',
      approve: 'Approve individual record',
      reject: 'Reject with reason',
      addComment: 'Add approval comment',
    },
  },
  layout: {
    header: 'Department Payroll Review',
    sections: ['Period Selection', 'Summary', 'Payroll Records', 'Actions'],
  },
}
```

#### **2. Payroll Record Details**
```typescript
interface PayrollRecordDetailsInterface {
  components: {
    employeeInfo: {
      name: 'Employee full name',
      position: 'Current position',
      department: 'Department name',
      employeeId: 'Employee ID',
    },
    attendanceSummary: {
      totalHours: 'Total worked hours',
      regularHours: 'Regular hours (capped at 176)',
      lateHours: 'Late hours with deductions',
      overtimeHours: 'Overtime hours (converted to leave)',
    },
    payrollBreakdown: {
      baseSalary: 'Monthly base salary',
      grossPay: 'Base salary + benefits',
      deductions: 'List of applied deductions',
      benefits: 'List of applied benefits',
      lateDeductions: 'Late hour deductions',
      netPay: 'Final net pay amount',
    },
    deductionDetails: {
      table: {
        columns: ['Deduction Type', 'Original Balance', 'Applied Amount', 'Remaining Balance'],
        status: 'Active/Completed indicators',
      },
    },
    benefitDetails: {
      table: {
        columns: ['Benefit Type', 'Amount', 'Start Date', 'End Date', 'Status'],
      },
    },
    approvalActions: {
      approve: 'Approve payroll record',
      reject: 'Reject with reason',
      comment: 'Add approval comment',
      requestChanges: 'Request HR to make changes',
    },
  },
  layout: {
    header: 'Payroll Record Details',
    sections: ['Employee Info', 'Attendance', 'Payroll Breakdown', 'Actions'],
  },
}
```

### **Attendance Hour Computation Display**

#### **1. Hour Calculation Component**
```typescript
interface AttendanceCalculationInterface {
  components: {
    timeDisplay: {
      clockIn: 'Clock-in time display',
      clockOut: 'Clock-out time display',
      workStart: 'Expected work start time',
      gracePeriod: 'Grace period indicator',
    },
    calculationBreakdown: {
      totalHours: 'Total worked hours',
      lateHours: 'Late hours (rounded up)',
      effectiveHours: 'Effective hours after late deduction',
      regularHours: 'Regular hours (capped at 8)',
      overtimeHours: 'Overtime hours',
    },
    visualIndicator: {
      status: 'On-time/Late indicator',
      color: 'Green (on-time), Red (late)',
      icon: 'Clock icon with status',
    },
    gracePeriodInfo: {
      explanation: 'Grace period explanation',
      examples: 'Late calculation examples',
    },
  },
  layout: {
    header: 'Attendance Hour Calculation',
    sections: ['Time Information', 'Calculation Breakdown', 'Status Indicator'],
  },
}
```

## 🎯 **User Experience Guidelines**

### **Navigation Patterns**
- **Breadcrumbs**: Show current location in hierarchy
- **Sidebar Navigation**: Persistent navigation for main sections
- **Tab Navigation**: For related content within sections
- **Breadcrumb Navigation**: For deep hierarchical content

### **Interaction Patterns**
- **Loading States**: Show progress for async operations
- **Error Handling**: Clear error messages with recovery options
- **Confirmation Dialogs**: For destructive actions
- **Success Feedback**: Confirm successful operations
- **Form Validation**: Real-time validation with helpful messages

### **Content Organization**
- **Progressive Disclosure**: Show essential info first, details on demand
- **Grouping**: Related information grouped together
- **Prioritization**: Most important content prominently displayed
- **Scanning**: Easy to scan with clear visual hierarchy

---

## 📋 **Implementation Checklist**

### **Design System**
- [ ] Define color palette (user choice)
- [ ] Set up typography scale
- [ ] Create spacing system
- [ ] Define component specifications
- [ ] Set up icon library

### **Components**
- [ ] Build base components (Button, Input, Card)
- [ ] Create layout components (Header, Sidebar, Footer)
- [ ] Develop form components
- [ ] Build data display components (Table, Charts)
- [ ] Create feature-specific components

### **Responsive Design**
- [ ] Implement mobile-first approach
- [ ] Test on all breakpoints
- [ ] Optimize touch interactions
- [ ] Ensure readable text sizes

### **Accessibility**
- [ ] Implement WCAG 2.1 AA compliance
- [ ] Test with screen readers
- [ ] Ensure keyboard navigation
- [ ] Validate color contrast ratios

---

**Last Updated**: January 2025  
**Specification Version**: 1.0.0  
**Status**: ✅ **IMPLEMENTATION COMPLETE - PRODUCTION READY**
