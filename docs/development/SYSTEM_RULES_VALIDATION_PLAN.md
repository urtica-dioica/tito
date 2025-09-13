# TITO System Rules - Comprehensive Validation Plan

## 🎯 **Validation Plan Overview**

This document provides a comprehensive validation plan for the TITO HR Management System business rules, derived from complete system analysis. The plan includes specific test scenarios, edge cases, and validation procedures to ensure 100% compliance with all business requirements.

---

## 📋 **Validation Scope**

### **Modules to Validate**
- ✅ **User Management & Authentication**
- ✅ **Employee Management**
- ✅ **Attendance Management (Mathematical Formulation)**
- ✅ **Leave Management**
- ✅ **Payroll Management**
- ✅ **Department Management**
- ✅ **Request Management**
- ✅ **System Settings & Configuration**
- ✅ **Data Validation & Integrity**
- ✅ **Security & Compliance**
- ✅ **Performance & Scalability**
- ✅ **API Integration & Consistency**

---

## 🧪 **Critical Test Scenarios**

### **1. Attendance Management Validation**

#### **Test Case 1.1: Grace Period Application**
```typescript
// Scenario: Employee arrives 31 minutes late
Input: {
  clockIn: '08:31:00',
  clockOut: '18:00:00',
  expectedMorningStart: '08:00:00',
  expectedAfternoonStart: '13:00:00',
  gracePeriod: 30 // minutes
}

Expected Output: {
  morningHours: 3,      // 9:00 AM to 12:00 PM (grace period applied)
  afternoonHours: 4,    // 1:00 PM to 5:00 PM (capped at 4 hours)
  totalHours: 7,
  status: 'late'        // Less than 8 hours
}

Validation Points:
- ✅ Grace period correctly applied (8:31 → 9:00)
- ✅ Morning session capped at 4 hours
- ✅ Afternoon session capped at 4 hours
- ✅ Break time (12:01-12:59) excluded
- ✅ Status correctly determined as 'late'
```

#### **Test Case 1.2: Session Cap Enforcement**
```typescript
// Scenario: Employee works extended hours
Input: {
  clockIn: '07:00:00',  // Early arrival
  clockOut: '19:00:00', // Late departure
  expectedMorningStart: '08:00:00',
  expectedAfternoonStart: '13:00:00'
}

Expected Output: {
  morningHours: 4,      // 8:00 AM to 12:00 PM (capped at 4)
  afternoonHours: 4,    // 1:00 PM to 5:00 PM (capped at 4)
  totalHours: 8,
  status: 'present'     // Full 8 hours
}

Validation Points:
- ✅ Early clock-in adjusted to 8:00 AM
- ✅ Late clock-out adjusted to 5:00 PM
- ✅ Both sessions capped at 4 hours maximum
- ✅ Total hours = 8 (full day)
- ✅ Status correctly determined as 'present'
```

#### **Test Case 1.3: Break Time Handling**
```typescript
// Scenario: Employee works through lunch break
Input: {
  clockIn: '08:00:00',
  clockOut: '13:30:00', // Works through lunch
  expectedMorningStart: '08:00:00',
  expectedAfternoonStart: '13:00:00'
}

Expected Output: {
  morningHours: 4,      // 8:00 AM to 12:00 PM
  afternoonHours: 0.5,  // 1:00 PM to 1:30 PM
  totalHours: 4.5,
  status: 'partial'     // Less than 4 hours
}

Validation Points:
- ✅ Break time (12:01-12:59) excluded from morning session
- ✅ Afternoon session starts at 1:00 PM
- ✅ Partial afternoon hours calculated correctly
- ✅ Status correctly determined as 'partial'
```

#### **Test Case 1.4: Edge Case - Very Late Arrival**
```typescript
// Scenario: Employee arrives very late
Input: {
  clockIn: '14:00:00',  // 2:00 PM arrival
  clockOut: '18:00:00',
  expectedMorningStart: '08:00:00',
  expectedAfternoonStart: '13:00:00'
}

Expected Output: {
  morningHours: 0,      // No morning session
  afternoonHours: 4,    // 1:00 PM to 5:00 PM (capped at 4)
  totalHours: 4,
  status: 'partial'     // Less than 4 hours
}

Validation Points:
- ✅ No morning hours credited (arrived after 12:00 PM)
- ✅ Afternoon session calculated from 1:00 PM
- ✅ Status correctly determined as 'partial'
```

---

### **2. Payroll Management Validation**

#### **Test Case 2.1: Standard Monthly Payroll**
```typescript
// Scenario: Standard monthly payroll calculation
Input: {
  baseSalary: 25000,        // PHP
  workingDays: 22,          // Days in month
  totalWorkedHours: 176,    // 22 days × 8 hours
  leaveDays: 0,
  benefits: 1500,           // PHP
  deductions: 4000          // PHP
}

Expected Output: {
  monthlyWorkingHours: 176, // 22 × 8
  hourlyRate: 142.05,       // 25000 / 176
  grossPay: 25000,          // (176/176) × 25000
  leavePay: 0,              // No leave days
  netPay: 22500             // 25000 + 0 + 1500 - 4000
}

Validation Points:
- ✅ Monthly working hours calculated correctly
- ✅ Hourly rate calculated correctly
- ✅ Gross pay formula applied correctly
- ✅ Leave pay calculated correctly (0 for no leave)
- ✅ Net pay calculated correctly
```

#### **Test Case 2.2: Leave Pay Calculation**
```typescript
// Scenario: Employee with leave days
Input: {
  baseSalary: 25000,        // PHP
  workingDays: 22,          // Days in month
  totalWorkedHours: 154,    // 19.25 days × 8 hours
  leaveDays: 2,             // 2 days leave
  benefits: 1500,           // PHP
  deductions: 4000          // PHP
}

Expected Output: {
  monthlyWorkingHours: 176, // 22 × 8
  hourlyRate: 142.05,       // 25000 / 176
  grossPay: 21875,          // (154/176) × 25000
  leavePay: 2272.73,        // (2×8/176) × 25000
  netPay: 21647.73          // 21875 + 2272.73 + 1500 - 4000
}

Validation Points:
- ✅ Gross pay calculated based on worked hours
- ✅ Leave pay calculated correctly: (2×8/176) × 25000
- ✅ Net pay includes leave pay
- ✅ All calculations match PAYROLL-COMPUTATION.md formulas
```

#### **Test Case 2.3: Deduction Application**
```typescript
// Scenario: Multiple deductions with balances
Input: {
  baseSalary: 25000,
  grossPay: 25000,
  deductions: [
    { type: 'SSS', amount: 2750, percentage: 11 },
    { type: 'PhilHealth', amount: 750, percentage: 3 },
    { type: 'Pag-IBIG', amount: 500, percentage: 2 },
    { type: 'Loan', amount: 1000, fixed: true }
  ]
}

Expected Output: {
  totalDeductions: 5000,    // 2750 + 750 + 500 + 1000
  deductionBreakdown: {
    SSS: 2750,              // 11% of 25000
    PhilHealth: 750,        // 3% of 25000
    PagIBIG: 500,           // 2% of 25000
    Loan: 1000              // Fixed amount
  }
}

Validation Points:
- ✅ Percentage-based deductions calculated correctly
- ✅ Fixed amount deductions applied correctly
- ✅ Total deductions sum correctly
- ✅ Deduction order applied correctly
```

#### **Test Case 2.4: Overtime Pay Calculation**
```typescript
// Scenario: Employee with approved overtime
Input: {
  baseSalary: 25000,
  regularHours: 160,        // 20 days × 8 hours
  overtimeHours: 16,        // 2 days × 8 hours overtime
  overtimeRate: 1.25,       // 125% of regular rate
  hourlyRate: 156.25        // 25000 / 160
}

Expected Output: {
  regularPay: 25000,        // (160/160) × 25000
  overtimePay: 3125,        // 16 × 156.25 × 1.25
  totalGrossPay: 28125,     // 25000 + 3125
  overtimeRateApplied: 1.25
}

Validation Points:
- ✅ Regular pay calculated correctly
- ✅ Overtime pay calculated with 125% rate
- ✅ Total gross pay includes overtime
- ✅ Overtime rate correctly applied
```

---

### **3. Leave Management Validation**

#### **Test Case 3.1: Leave Accrual Calculation**
```typescript
// Scenario: Monthly leave accrual
Input: {
  employeeId: 'EMP001',
  leaveType: 'vacation',
  accrualRate: 1.25,        // days per month
  currentBalance: 5.0,      // existing balance
  month: 'January 2025'
}

Expected Output: {
  newAccrual: 1.25,         // 1.25 days
  updatedBalance: 6.25,     // 5.0 + 1.25
  maxBalance: 15,           // vacation leave cap
  carryOver: true           // vacation leaves carry over
}

Validation Points:
- ✅ Accrual rate applied correctly
- ✅ Balance updated correctly
- ✅ Maximum balance enforced
- ✅ Carry-over rules applied correctly
```

#### **Test Case 3.2: Leave Request Validation**
```typescript
// Scenario: Leave request with insufficient balance
Input: {
  employeeId: 'EMP001',
  leaveType: 'vacation',
  requestedDays: 10,
  availableBalance: 5.0,
  startDate: '2025-02-01',
  endDate: '2025-02-10'
}

Expected Output: {
  validationResult: 'INSUFFICIENT_BALANCE',
  availableBalance: 5.0,
  requestedDays: 10,
  shortfall: 5.0,
  status: 'rejected'
}

Validation Points:
- ✅ Balance validation performed
- ✅ Shortfall calculated correctly
- ✅ Request rejected for insufficient balance
- ✅ Error message provided
```

#### **Test Case 3.3: Overtime to Leave Conversion**
```typescript
// Scenario: Overtime hours converted to leave
Input: {
  employeeId: 'EMP001',
  overtimeHours: 12,        // 12 hours overtime
  conversionRate: 1.5,      // 1.5 hours overtime = 1 hour leave
  maxConversion: 8          // hours per month
}

Expected Output: {
  convertedLeaveHours: 8,   // 12 / 1.5 = 8, capped at 8
  leaveCredits: 1,          // 8 hours = 1 day
  remainingOvertime: 4,     // 12 - 8 = 4 hours
  leaveType: 'vacation'     // converted to vacation leave
}

Validation Points:
- ✅ Conversion rate applied correctly
- ✅ Maximum conversion limit enforced
- ✅ Leave credits calculated correctly
- ✅ Remaining overtime tracked
```

---

### **4. API Data Consistency Validation**

#### **Test Case 4.1: Cross-Module Payroll Data Consistency**
```typescript
// Scenario: Same payroll data accessed from different modules
const testEmployeeId = 'EMP001';
const testPeriodId = 'PERIOD_2025_01';

// HR Module Response
const hrData = await hrService.getPayrollRecord(testEmployeeId, testPeriodId);

// Department Module Response
const deptData = await departmentService.getPayrollRecord(testEmployeeId, testPeriodId);

// Employee Module Response
const empData = await employeeService.getPayrollRecord(testEmployeeId, testPeriodId);

Expected Output: {
  dataConsistency: true,
  fieldMapping: {
    hrData.id === deptData.id === empData.id,
    hrData.grossPay === deptData.grossPay === empData.grossPay,
    hrData.netPay === deptData.netPay === empData.netPay,
    // ... all fields match
  }
}

Validation Points:
- ✅ All modules return identical data structure
- ✅ All field values match across modules
- ✅ Field naming is consistent (camelCase)
- ✅ Data types are consistent
```

#### **Test Case 4.2: Field Naming Consistency**
```typescript
// Scenario: Verify consistent field naming across all APIs
const expectedFields = [
  'id', 'payrollPeriodId', 'periodName', 'employeeId', 'employeeName',
  'position', 'departmentId', 'departmentName', 'baseSalary', 'hourlyRate',
  'totalWorkedHours', 'totalRegularHours', 'totalOvertimeHours',
  'totalLateHours', 'paidLeaveHours', 'grossPay', 'totalDeductions',
  'totalBenefits', 'lateDeductions', 'netPay', 'status', 'createdAt', 'updatedAt'
];

// Test all payroll-related endpoints
const endpoints = [
  '/api/v1/hr/payroll/records',
  '/api/v1/department-head/payroll/records',
  '/api/v1/employee/paystubs'
];

Expected Output: {
  fieldConsistency: true,
  namingConvention: 'camelCase',
  allFieldsPresent: true,
  noSnakeCase: true,
  noMixedNaming: true
}

Validation Points:
- ✅ All endpoints use camelCase naming
- ✅ No snake_case fields present
- ✅ No mixed naming conventions
- ✅ All required fields present
```

---

### **5. Security & Access Control Validation**

#### **Test Case 5.1: Role-Based Access Control**
```typescript
// Scenario: Test access control for different roles
const testCases = [
  {
    role: 'hr',
    endpoint: '/api/v1/hr/employees',
    expectedStatus: 200,
    expectedAccess: 'full'
  },
  {
    role: 'department_head',
    endpoint: '/api/v1/hr/employees',
    expectedStatus: 403,
    expectedAccess: 'denied'
  },
  {
    role: 'employee',
    endpoint: '/api/v1/hr/employees',
    expectedStatus: 403,
    expectedAccess: 'denied'
  }
];

Expected Output: {
  hrAccess: 'granted',
  departmentHeadAccess: 'denied',
  employeeAccess: 'denied',
  properErrorMessages: true,
  auditLogging: true
}

Validation Points:
- ✅ HR role has full access
- ✅ Department Head role has limited access
- ✅ Employee role has personal access only
- ✅ Proper error messages for denied access
- ✅ All access attempts logged
```

#### **Test Case 5.2: Data Encryption Validation**
```typescript
// Scenario: Verify data encryption at rest and in transit
const sensitiveData = {
  password: 'userPassword123',
  salary: 25000,
  personalInfo: {
    ssn: '123-45-6789',
    bankAccount: '1234567890'
  }
};

Expected Output: {
  passwordEncrypted: true,      // bcrypt hash
  salaryEncrypted: true,        // database encryption
  personalInfoEncrypted: true,  // field-level encryption
  transmissionEncrypted: true,  // HTTPS/TLS
  encryptionAlgorithm: 'AES-256'
}

Validation Points:
- ✅ Passwords hashed with bcrypt
- ✅ Sensitive data encrypted in database
- ✅ Data encrypted in transit (HTTPS)
- ✅ Proper encryption algorithms used
- ✅ Encryption keys properly managed
```

---

### **6. Performance & Scalability Validation**

#### **Test Case 6.1: Response Time Validation**
```typescript
// Scenario: Test response times for critical endpoints
const performanceTests = [
  {
    endpoint: '/api/v1/hr/employees',
    expectedResponseTime: 2000, // 2 seconds
    concurrentUsers: 100
  },
  {
    endpoint: '/api/v1/payroll/calculate',
    expectedResponseTime: 5000, // 5 seconds
    concurrentUsers: 50
  },
  {
    endpoint: '/api/v1/reports/payroll',
    expectedResponseTime: 30000, // 30 seconds
    concurrentUsers: 10
  }
];

Expected Output: {
  averageResponseTime: '< 2 seconds',
  maxResponseTime: '< 5 seconds',
  reportGenerationTime: '< 30 seconds',
  concurrentUserSupport: '100+ users',
  systemStability: 'stable'
}

Validation Points:
- ✅ Response times meet requirements
- ✅ System handles concurrent users
- ✅ Report generation within limits
- ✅ No performance degradation
- ✅ System remains stable under load
```

#### **Test Case 6.2: Database Performance Validation**
```typescript
// Scenario: Test database query performance
const queryTests = [
  {
    query: 'SELECT * FROM employees WHERE department_id = ?',
    expectedTime: 100, // milliseconds
    indexUsed: 'department_id_index'
  },
  {
    query: 'SELECT * FROM payroll_records WHERE employee_id = ? AND payroll_period_id = ?',
    expectedTime: 50, // milliseconds
    indexUsed: 'employee_period_index'
  },
  {
    query: 'SELECT COUNT(*) FROM attendance_records WHERE date BETWEEN ? AND ?',
    expectedTime: 200, // milliseconds
    indexUsed: 'date_index'
  }
];

Expected Output: {
  queryPerformance: 'optimized',
  indexUsage: 'proper',
  connectionPooling: 'efficient',
  queryOptimization: 'enabled',
  slowQueryLogging: 'enabled'
}

Validation Points:
- ✅ Queries execute within time limits
- ✅ Proper indexes are used
- ✅ Connection pooling is efficient
- ✅ Query optimization is enabled
- ✅ Slow queries are logged
```

---

## 🔍 **Edge Case Testing**

### **1. Attendance Edge Cases**
- **Midnight Crossings**: Clock-in/out across midnight
- **Weekend Work**: Attendance on weekends and holidays
- **Multiple Sessions**: Multiple clock-in/out in same day
- **System Clock Changes**: Daylight saving time adjustments
- **Network Failures**: Offline attendance recording

### **2. Payroll Edge Cases**
- **Partial Month Employment**: Employee hired mid-month
- **Salary Changes**: Mid-month salary adjustments
- **Multiple Deductions**: Complex deduction scenarios
- **Overtime Limits**: Maximum overtime hour enforcement
- **Tax Bracket Changes**: Mid-year tax bracket adjustments

### **3. Leave Edge Cases**
- **Leave Overlap**: Overlapping leave requests
- **Holiday Leave**: Leave requests on holidays
- **Maternity Leave**: Extended maternity leave scenarios
- **Leave Expiration**: Leave balance expiration handling
- **Emergency Leave**: Emergency leave approval workflows

### **4. System Edge Cases**
- **Database Failures**: Database connection failures
- **Memory Limits**: High memory usage scenarios
- **File Storage**: File storage capacity limits
- **Concurrent Updates**: Simultaneous data updates
- **Data Corruption**: Data integrity recovery

---

## 📊 **Validation Metrics**

### **Success Criteria**
- ✅ **100% Test Pass Rate**: All test cases must pass
- ✅ **Performance Requirements**: All performance targets met
- ✅ **Security Compliance**: All security requirements satisfied
- ✅ **Data Integrity**: No data corruption or loss
- ✅ **API Consistency**: 100% data consistency across modules
- ✅ **Business Rule Compliance**: All business rules enforced

### **Quality Gates**
- **Code Coverage**: Minimum 90% test coverage
- **Performance**: Response times within specified limits
- **Security**: All security tests pass
- **Integration**: All integration tests pass
- **User Acceptance**: All user acceptance tests pass

---

## 🚀 **Validation Execution Plan**

### **Phase 1: Unit Testing (Week 1)**
- Individual component testing
- Business logic validation
- Data validation testing
- Error handling testing

### **Phase 2: Integration Testing (Week 2)**
- API endpoint testing
- Cross-module integration testing
- Database integration testing
- External service integration testing

### **Phase 3: System Testing (Week 3)**
- End-to-end workflow testing
- Performance testing
- Security testing
- Load testing

### **Phase 4: User Acceptance Testing (Week 4)**
- User role testing
- Business process testing
- Usability testing
- Compliance testing

---

## 📋 **Validation Checklist**

### **Pre-Validation Checklist**
- [ ] All test environments configured
- [ ] Test data prepared and validated
- [ ] Test scripts reviewed and approved
- [ ] Validation team trained
- [ ] Success criteria defined

### **During Validation Checklist**
- [ ] All test cases executed
- [ ] Results documented
- [ ] Issues logged and tracked
- [ ] Performance metrics recorded
- [ ] Security tests completed

### **Post-Validation Checklist**
- [ ] All issues resolved
- [ ] Validation report prepared
- [ ] Sign-off obtained
- [ ] Production deployment approved
- [ ] Monitoring and alerting configured

---

## 🎯 **Expected Outcomes**

### **Validation Success**
- ✅ **100% Business Rule Compliance**: All business rules properly implemented
- ✅ **100% API Consistency**: All modules return consistent data
- ✅ **100% Performance Compliance**: All performance requirements met
- ✅ **100% Security Compliance**: All security requirements satisfied
- ✅ **100% Data Integrity**: No data corruption or loss
- ✅ **Production Ready**: System ready for production deployment

### **Risk Mitigation**
- **Data Loss Prevention**: Comprehensive backup and recovery procedures
- **Security Breach Prevention**: Multi-layered security implementation
- **Performance Degradation Prevention**: Performance monitoring and optimization
- **Business Rule Violation Prevention**: Comprehensive validation and testing
- **System Failure Prevention**: Fault tolerance and error handling

---

**Last Updated**: January 27, 2025  
**Validation Plan Version**: 1.0.0  
**Status**: ✅ **READY FOR EXECUTION**  
**Estimated Duration**: 4 weeks  
**Success Criteria**: 100% test pass rate with all requirements met
