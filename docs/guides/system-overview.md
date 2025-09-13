# System Overview Guide

## 🎯 **TITO HR Management System Overview**

This document provides a comprehensive overview of the TITO HR Management System, including system requirements, architecture, user roles, and business processes. This guide serves as the foundation for understanding the complete system before implementation.

## 📋 **Table of Contents**

- [System Purpose](#system-purpose)
- [Business Requirements](#business-requirements)
- [User Roles & Permissions](#user-roles--permissions)
- [Core Features](#core-features)
- [System Architecture](#system-architecture)
- [Data Flow](#data-flow)
- [Integration Points](#integration-points)
- [Security Requirements](#security-requirements)
- [Performance Requirements](#performance-requirements)
- [Compliance & Standards](#compliance--standards)

---

## 🎯 **System Purpose**

### **Primary Objectives**
The TITO HR Management System is designed to streamline and automate human resources operations for organizations, providing:

1. **Centralized Employee Management** - Complete employee lifecycle management
2. **Automated Attendance Tracking** - Real-time attendance monitoring with selfie verification
3. **Leave Management** - Comprehensive leave request and approval workflow
4. **Payroll Processing** - Automated payroll calculation and management
5. **Department Management** - Organizational structure and hierarchy management
6. **Request Management** - Time correction and overtime request handling
7. **ID Card Management** - Employee identification and QR code generation
8. **Audit & Compliance** - Complete audit trail and compliance reporting

### **Target Organizations**
- Small to medium-sized businesses (50-500 employees)
- Companies requiring strict attendance tracking
- Organizations with complex leave policies
- Businesses needing automated payroll processing
- Companies requiring audit compliance

---

## 📊 **Business Requirements**

### **Functional Requirements**

#### **Employee Management**
- **Employee Registration**: Complete employee onboarding with personal and professional details
- **Employee Records**: Maintain comprehensive employee profiles with documents
- **Employee Status**: Track employment status (active, inactive, terminated, on leave)
- **Employee Search**: Advanced search and filtering capabilities
- **Bulk Operations**: Mass updates and data import/export

#### **Attendance Management**
- **Clock In/Out**: Biometric and QR code-based attendance tracking
- **Selfie Verification**: Photo capture for attendance verification
- **Session Management**: Multiple daily sessions (morning, afternoon, overtime)
- **Time Tracking**: Automatic calculation of worked hours
- **Late Tracking**: Automatic detection and recording of late arrivals
- **Attendance Reports**: Comprehensive attendance analytics

#### **Leave Management**
- **Leave Types**: Vacation, sick, maternity, and other leave categories
- **Leave Balance**: Automatic leave balance calculation and tracking
- **Leave Requests**: Employee leave request submission
- **Approval Workflow**: Department head approval process
- **Leave Accrual**: Automatic leave accrual from overtime hours
- **Leave Calendar**: Visual leave schedule and planning

#### **Payroll Management**
- **Payroll Processing**: Automated payroll calculation based on attendance
- **Deduction Management**: Configurable deduction types and amounts
- **Payroll Periods**: Monthly payroll period management
- **Payroll Approval**: Multi-level payroll approval workflow
- **Payroll Reports**: Detailed payroll reports and analytics
- **Tax Calculations**: Automatic tax and deduction calculations

#### **Department Management**
- **Department Structure**: Organizational hierarchy management
- **Department Heads**: Assignment and management of department heads
- **Employee Assignment**: Employee-to-department assignment
- **Department Reports**: Department-specific analytics and reports

#### **Request Management**
- **Time Correction**: Employee time correction request system
- **Overtime Requests**: Overtime request submission and approval
- **Request Tracking**: Status tracking for all requests
- **Approval Workflow**: Department head approval process
- **Request History**: Complete request history and audit trail

### **Non-Functional Requirements**

#### **Performance**
- **Response Time**: < 2 seconds for all user interactions
- **Concurrent Users**: Support for 100+ concurrent users
- **Data Processing**: Handle 10,000+ employee records
- **Report Generation**: Generate reports within 30 seconds
- **System Availability**: 99.9% uptime

#### **Scalability**
- **Horizontal Scaling**: Support for load balancing
- **Database Scaling**: Efficient database query optimization
- **Storage Scaling**: Scalable file storage for documents and images
- **User Growth**: Support for 10x user growth

#### **Security**
- **Authentication**: Multi-factor authentication support
- **Authorization**: Role-based access control
- **Data Encryption**: End-to-end data encryption
- **Audit Trail**: Complete system audit logging
- **Compliance**: GDPR and data protection compliance

---

## 👥 **User Roles & Permissions**

### **HR Role**
**Full system access and management capabilities**

**Permissions**:
- ✅ **Employee Management**: Create, read, update, delete employee records
- ✅ **Department Management**: Manage departments and department heads
- ✅ **ID Card Management**: Generate and manage employee ID cards
- ✅ **Payroll Management**: Process payroll and manage deductions
- ✅ **System Settings**: Configure system parameters and settings
- ✅ **Reports**: Access all system reports and analytics
- ✅ **Request Viewing**: View all requests (read-only, approvals handled by department heads)

**Interface Features**:
- Dashboard with system overview and key metrics
- Complete employee management interface
- Department and organizational structure management
- Payroll processing and management
- System configuration and settings
- Comprehensive reporting and analytics

### **Department Head Role**
**Department-specific management with limited system access**

**Permissions**:
- 👁️ **Employee Viewing**: View employees in their department (read-only)
- 👁️ **Payroll Viewing**: View payroll information for their department (read-only)
- ✅ **Request Management**: Approve/reject time correction and overtime requests
- ✅ **Department Reports**: Access department-specific reports
- ❌ **Employee Editing**: Cannot create, edit, or delete employee records
- ❌ **Payroll Processing**: Cannot process or modify payroll
- ❌ **System Settings**: Cannot access system configuration

**Interface Features**:
- Dashboard with department overview
- Employee list (view-only) for their department
- Payroll information (view-only) for their department
- Request approval interface for time corrections and overtime
- Department-specific reports and analytics

### **Employee Role**
**Personal dashboard and request management**

**Permissions**:
- ✅ **Personal Attendance**: View own attendance records and clock in/out
- ✅ **Request Submission**: Submit time correction and overtime requests
- ✅ **Leave Management**: View leave balance and submit leave requests
- ✅ **Personal Profile**: View and update personal information
- ❌ **Other Employees**: Cannot view other employee information
- ❌ **Payroll Access**: Cannot access payroll information
- ❌ **System Management**: Cannot access system administration

**Interface Features**:
- Personal dashboard with attendance summary
- Attendance tracking and clock in/out functionality
- Leave balance display and request submission
- Time correction and overtime request submission
- Personal profile management

### **Kiosk Interface**
**Public attendance system for shared devices**

**Permissions**:
- ✅ **QR Code Verification**: Verify employee QR codes
- ✅ **Clock In/Out**: Process attendance for verified employees
- ✅ **Selfie Capture**: Capture attendance verification photos
- ❌ **Data Access**: Cannot access employee data or system information
- ❌ **Authentication**: No user authentication required

**Interface Features**:
- QR code scanner interface
- Clock in/out buttons
- Selfie capture functionality
- Success/error feedback
- Simple, touch-friendly interface

---

## 🏗️ **Core Features**

### **1. Employee Management System**

#### **Employee Lifecycle**
```
Registration → Onboarding → Active Employment → Status Changes → Termination
```

**Key Components**:
- **Employee Registration**: Complete employee data entry
- **Document Management**: Store and manage employee documents
- **Status Tracking**: Monitor employment status changes
- **Profile Management**: Maintain comprehensive employee profiles
- **Search & Filter**: Advanced employee search capabilities

#### **Employee Data Model**
```typescript
interface Employee {
  id: string;
  userId: string;
  employeeId: string; // Format: EMP-YYYY-NNNNNNN
  firstName: string;
  lastName: string;
  email: string;
  departmentId: string;
  position: string;
  employmentType: 'regular' | 'contractual' | 'jo';
  hireDate: string;
  baseSalary: number;
  status: 'active' | 'inactive' | 'terminated' | 'on_leave';
  createdAt: string;
  updatedAt: string;
}
```

### **2. Attendance Management System**

#### **Attendance Workflow**
```
Clock In → Session Tracking → Clock Out → Hours Calculation → Status Determination
```

**Key Components**:
- **Multi-Session Support**: Morning, afternoon, overtime sessions
- **Selfie Verification**: Photo capture for attendance verification
- **Automatic Calculations**: Worked hours, late hours, overtime
- **Status Determination**: Present, late, absent, partial status
- **Real-time Tracking**: Live attendance monitoring

#### **Attendance Data Model**
```typescript
interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  overallStatus: 'present' | 'late' | 'absent' | 'partial';
  sessions: AttendanceSession[];
  createdAt: string;
  updatedAt: string;
}

interface AttendanceSession {
  id: string;
  sessionType: string;
  clockIn: string | null;
  clockOut: string | null;
  calculatedHours: number;
  lateHours: number;
  status: 'present' | 'late' | 'early' | 'absent';
  selfieImagePath: string | null;
  selfieTakenAt: string | null;
}
```

### **3. Leave Management System**

#### **Leave Workflow**
```
Leave Request → Department Head Approval → Leave Balance Update → Leave Calendar Update
```

**Key Components**:
- **Leave Types**: Vacation, sick, maternity, other
- **Balance Tracking**: Automatic leave balance calculation
- **Request Workflow**: Employee request and approval process
- **Accrual System**: Automatic leave accrual from overtime
- **Calendar Integration**: Visual leave schedule

#### **Leave Data Model**
```typescript
interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveType: 'vacation' | 'sick' | 'maternity' | 'other';
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'rejected';
  approverId: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface LeaveBalance {
  id: string;
  employeeId: string;
  leaveType: 'vacation' | 'sick' | 'maternity' | 'other';
  balance: number;
  updatedAt: string;
}
```

### **4. Payroll Management System**

#### **Payroll Workflow**
```
Attendance Data → Hours Calculation → Deduction Application → Payroll Generation → Approval → Payment
```

**Key Components**:
- **Automatic Calculation**: Based on attendance and base salary
- **Deduction Management**: Configurable deduction types
- **Approval Workflow**: Multi-level approval process
- **Period Management**: Monthly payroll periods
- **Report Generation**: Comprehensive payroll reports

#### **Payroll Data Model**
```typescript
interface PayrollRecord {
  id: string;
  payrollPeriodId: string;
  employeeId: string;
  baseSalary: number;
  hourlyRate: number;
  totalWorkedHours: number;
  totalRegularHours: number;
  totalOvertimeHours: number;
  totalLateHours: number;
  lateDeductions: number;
  grossPay: number;
  netPay: number;
  totalDeductions: number;
  status: 'draft' | 'processed' | 'paid';
  deductions: PayrollDeduction[];
  createdAt: string;
  updatedAt: string;
}
```

### **5. Request Management System**

#### **Request Workflow**
```
Request Submission → Department Head Review → Approval/Rejection → System Update
```

**Key Components**:
- **Time Correction Requests**: Correct attendance time errors
- **Overtime Requests**: Request and approve overtime work
- **Status Tracking**: Monitor request status and history
- **Approval Workflow**: Department head approval process
- **Automatic Updates**: System updates based on approvals

#### **Request Data Models**
```typescript
interface TimeCorrectionRequest {
  id: string;
  employeeId: string;
  attendanceSessionId: string | null;
  correctionDate: string;
  sessionType: string;
  requestedClockIn: string | null;
  requestedClockOut: string | null;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approverId: string | null;
  approvedAt: string | null;
  comments: string | null;
  createdAt: string;
  updatedAt: string;
}

interface OvertimeRequest {
  id: string;
  employeeId: string;
  requestDate: string;
  overtimeDate: string;
  startTime: string;
  endTime: string;
  requestedHours: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approverId: string | null;
  approvedAt: string | null;
  comments: string | null;
  createdAt: string;
  updatedAt: string;
}
```

---

## 🏛️ **System Architecture**

### **Frontend Architecture**
```
React 18 + TypeScript
├── Components
│   ├── Layout Components (Header, Sidebar, Footer)
│   ├── Feature Components (Employee, Attendance, Leave, Payroll)
│   └── Shared Components (Button, Input, Table, Modal)
├── Pages
│   ├── HR Pages (Dashboard, Employees, Departments, Payroll)
│   ├── Department Head Pages (Dashboard, Requests, Reports)
│   ├── Employee Pages (Dashboard, Attendance, Requests)
│   └── Kiosk Pages (QR Scanner, Clock In/Out)
├── Services
│   ├── API Services (HTTP client, endpoints)
│   ├── Auth Services (Authentication, authorization)
│   └── Utility Services (Formatting, validation)
├── State Management
│   ├── React Context (Authentication state)
│   ├── TanStack Query (Server state)
│   └── Local State (Component state)
└── Routing
    ├── Role-based Routes
    ├── Protected Routes
    └── Public Routes (Kiosk)
```

### **Backend Architecture**
```
Node.js + TypeScript + Express
├── Controllers
│   ├── Auth Controller (Login, logout, refresh)
│   ├── HR Controllers (Employee, Department, Payroll)
│   ├── Attendance Controllers (Clock in/out, records)
│   ├── Leave Controllers (Requests, balances)
│   └── Request Controllers (Time correction, overtime)
├── Services
│   ├── Business Logic Services
│   ├── Data Processing Services
│   └── Integration Services
├── Models
│   ├── Database Models (Sequelize/TypeORM)
│   ├── Validation Models (Joi/Zod)
│   └── API Models (Request/Response)
├── Middleware
│   ├── Authentication Middleware
│   ├── Authorization Middleware
│   ├── Validation Middleware
│   └── Audit Middleware
└── Database
    ├── PostgreSQL (Primary database)
    ├── Redis (Caching and sessions)
    └── File Storage (Documents and images)
```

### **Database Architecture**
```
PostgreSQL Database
├── Core Tables
│   ├── users (Authentication and user data)
│   ├── employees (Employee information)
│   ├── departments (Organizational structure)
│   └── system_settings (Configuration)
├── Attendance Tables
│   ├── attendance_records (Daily attendance)
│   ├── attendance_sessions (Session details)
│   └── time_correction_requests (Time corrections)
├── Leave Tables
│   ├── leave_requests (Leave requests)
│   ├── leave_balances (Leave balances)
│   └── leave_accruals (Leave accruals)
├── Payroll Tables
│   ├── payroll_periods (Payroll periods)
│   ├── payroll_records (Payroll records)
│   ├── payroll_deductions (Deductions)
│   └── deduction_types (Deduction types)
├── Request Tables
│   ├── overtime_requests (Overtime requests)
│   └── id_cards (Employee ID cards)
└── Audit Tables
    └── audit_log (System audit trail)
```

---

## 🔄 **Data Flow**

### **Authentication Flow**
```
1. User Login → 2. Credential Validation → 3. JWT Token Generation → 4. Role Assignment → 5. Dashboard Redirect
```

### **Attendance Flow**
```
1. Employee Clock In → 2. QR Code Verification → 3. Selfie Capture → 4. Session Creation → 5. Hours Calculation
```

### **Leave Request Flow**
```
1. Employee Request → 2. Balance Check → 3. Department Head Notification → 4. Approval/Rejection → 5. Balance Update
```

### **Payroll Processing Flow**
```
1. Period Creation → 2. Attendance Aggregation → 3. Salary Calculation → 4. Deduction Application → 5. Approval Workflow → 6. Payment Processing
```

### **Request Approval Flow**
```
1. Request Submission → 2. Department Head Notification → 3. Review Process → 4. Approval Decision → 5. System Update
```

---

## 🔗 **Integration Points**

### **External Integrations**
- **Email Service**: Notification and communication
- **File Storage**: Document and image storage
- **QR Code Generation**: Employee ID card generation
- **Biometric Systems**: Attendance verification
- **Payroll Systems**: External payroll processing

### **API Integrations**
- **RESTful APIs**: Standard HTTP API endpoints
- **WebSocket**: Real-time notifications
- **File Upload**: Document and image upload
- **Export/Import**: Data exchange capabilities

---

## 🔒 **Security Requirements**

### **Authentication**
- **Multi-factor Authentication**: Optional 2FA support
- **JWT Tokens**: Secure token-based authentication
- **Session Management**: Redis-based session storage
- **Password Security**: bcrypt hashing with salt

### **Authorization**
- **Role-based Access Control**: Three-tier permission system
- **Resource-level Permissions**: Granular access control
- **API Security**: Rate limiting and request validation
- **Data Encryption**: End-to-end encryption

### **Data Protection**
- **Audit Logging**: Complete system audit trail
- **Data Backup**: Regular automated backups
- **Privacy Compliance**: GDPR and data protection
- **Secure Storage**: Encrypted data storage

---

## ⚡ **Performance Requirements**

### **Response Times**
- **Page Load**: < 2 seconds
- **API Responses**: < 1 second
- **Search Operations**: < 3 seconds
- **Report Generation**: < 30 seconds

### **Scalability**
- **Concurrent Users**: 100+ simultaneous users
- **Data Volume**: 10,000+ employee records
- **Storage**: Scalable file storage
- **Database**: Optimized query performance

### **Availability**
- **Uptime**: 99.9% system availability
- **Backup**: Daily automated backups
- **Recovery**: < 4 hours recovery time
- **Monitoring**: 24/7 system monitoring

---

## 📋 **Compliance & Standards**

### **Data Protection**
- **GDPR Compliance**: European data protection standards
- **Data Minimization**: Collect only necessary data
- **Right to Erasure**: Data deletion capabilities
- **Data Portability**: Export user data

### **Industry Standards**
- **ISO 27001**: Information security management
- **SOC 2**: Security and availability controls
- **PCI DSS**: Payment card data security (if applicable)
- **HIPAA**: Health information privacy (if applicable)

### **Accessibility**
- **WCAG 2.1 AA**: Web accessibility guidelines
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: Assistive technology compatibility
- **Color Contrast**: Minimum contrast ratios

---

## 🎯 **Success Metrics**

### **User Adoption**
- **User Engagement**: Daily active users
- **Feature Usage**: Feature adoption rates
- **User Satisfaction**: User feedback scores
- **Training Effectiveness**: User onboarding success

### **System Performance**
- **Response Times**: API and page load times
- **Error Rates**: System error frequency
- **Uptime**: System availability percentage
- **Scalability**: Performance under load

### **Business Impact**
- **Process Efficiency**: Time savings in HR processes
- **Data Accuracy**: Reduction in data errors
- **Compliance**: Audit and compliance improvements
- **Cost Reduction**: Operational cost savings

---

**Last Updated**: January 2025  
**System Version**: 1.0.0  
**Status**: ✅ **IMPLEMENTATION COMPLETE - PRODUCTION READY**
