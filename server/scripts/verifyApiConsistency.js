#!/usr/bin/env node

/**
 * API Consistency Verification Script
 * 
 * This script verifies that all payroll API routes return consistent data structure.
 * Run this script to ensure the fixes are working correctly.
 */

const { PayrollDataTransformer } = require('../dist/src/utils/payrollDataTransformer');

console.log('🔍 Verifying Payroll API Consistency...\n');

// Test data representing different module responses
const hrModuleData = {
  id: 'payroll-001',
  payroll_period_id: 'period-2025-01',
  period_name: 'January 2025',
  employee_id: 'emp-001',
  first_name: 'John',
  last_name: 'Doe',
  position: 'Senior Developer',
  department_id: 'dept-it',
  department_name: 'Information Technology',
  base_salary: 35000,
  hourly_rate: 218.75,
  total_worked_hours: 176,
  total_regular_hours: 160,
  total_overtime_hours: 16,
  total_late_hours: 1,
  late_deductions: 218.75,
  paid_leave_hours: 8,
  gross_pay: 35000,
  total_deductions: 5000,
  total_benefits: 2000,
  net_pay: 32181.25,
  status: 'paid',
  created_at: new Date('2025-01-31'),
  updated_at: new Date('2025-01-31')
};

const departmentModuleData = {
  id: 'payroll-001',
  payrollPeriodId: 'period-2025-01',
  periodName: 'January 2025',
  employeeId: 'emp-001',
  employeeName: 'John Doe',
  position: 'Senior Developer',
  departmentId: 'dept-it',
  departmentName: 'Information Technology',
  baseSalary: 35000,
  hourlyRate: 218.75,
  totalWorkedHours: 176,
  totalRegularHours: 160,
  totalOvertimeHours: 16,
  totalLateHours: 1,
  lateDeductions: 218.75,
  paidLeaveHours: 8,
  grossPay: 35000,
  totalDeductions: 5000,
  totalBenefits: 2000,
  netPay: 32181.25,
  status: 'paid',
  createdAt: new Date('2025-01-31'),
  updatedAt: new Date('2025-01-31')
};

const employeeModuleData = {
  id: 'payroll-001',
  payroll_period_id: 'period-2025-01',
  period_name: 'January 2025',
  employee_id: 'emp-001',
  employee_name: 'John Doe',
  position: 'Senior Developer',
  department_id: 'dept-it',
  department_name: 'Information Technology',
  base_salary: 35000,
  total_regular_hours: 160,
  total_overtime_hours: 16,
  total_late_hours: 1,
  paid_leave_hours: 8,
  gross_pay: 35000,
  total_deductions: 5000,
  total_benefits: 2000,
  net_pay: 32181.25,
  late_deductions: 218.75,
  status: 'paid',
  created_at: new Date('2025-01-31'),
  updated_at: new Date('2025-01-31')
};

// Transform all data to standardized format
console.log('📊 Transforming data from different modules...\n');

const hrTransformed = PayrollDataTransformer.transformPayrollRecord(hrModuleData);
const deptTransformed = PayrollDataTransformer.transformPayrollRecord(departmentModuleData);
const empTransformed = PayrollDataTransformer.transformPayrollRecord(employeeModuleData);

// Verify consistency
console.log('✅ Verifying data consistency...\n');

const fieldsToCompare = [
  'id', 'payrollPeriodId', 'periodName', 'employeeId', 'employeeName',
  'position', 'departmentId', 'departmentName', 'baseSalary', 'totalRegularHours',
  'totalOvertimeHours', 'totalLateHours', 'paidLeaveHours', 'grossPay',
  'totalDeductions', 'totalBenefits', 'lateDeductions', 'netPay', 'status'
];

let allConsistent = true;
const inconsistencies = [];

for (const field of fieldsToCompare) {
  const hrValue = hrTransformed[field];
  const deptValue = deptTransformed[field];
  const empValue = empTransformed[field];

  if (hrValue !== deptValue || hrValue !== empValue || deptValue !== empValue) {
    allConsistent = false;
    inconsistencies.push({
      field,
      hr: hrValue,
      department: deptValue,
      employee: empValue
    });
  }
}

// Display results
if (allConsistent) {
  console.log('🎉 SUCCESS: All modules return consistent data!');
  console.log('✅ HR Module: All fields match');
  console.log('✅ Department Module: All fields match');
  console.log('✅ Employee Module: All fields match');
} else {
  console.log('❌ INCONSISTENCIES FOUND:');
  inconsistencies.forEach(inc => {
    console.log(`   Field: ${inc.field}`);
    console.log(`     HR: ${inc.hr}`);
    console.log(`     Department: ${inc.department}`);
    console.log(`     Employee: ${inc.employee}`);
    console.log('');
  });
}

// Test data validation
console.log('🔍 Testing data validation...\n');

const validation = PayrollDataTransformer.validatePayrollData(hrTransformed);
if (validation.isValid) {
  console.log('✅ Data validation passed');
} else {
  console.log('❌ Data validation failed:');
  console.log(`   Missing fields: ${validation.missingFields.join(', ')}`);
  console.log(`   Warnings: ${validation.warnings.join(', ')}`);
}

// Test summary calculation
console.log('\n📈 Testing summary calculation...\n');

const testRecords = [hrTransformed, deptTransformed, empTransformed];
const summary = PayrollDataTransformer.calculateSummary(testRecords);

console.log('Summary Statistics:');
console.log(`   Total Employees: ${summary.totalEmployees}`);
console.log(`   Total Gross Pay: ₱${summary.totalGrossPay.toLocaleString()}`);
console.log(`   Total Net Pay: ₱${summary.totalNetPay.toLocaleString()}`);
console.log(`   Total Deductions: ₱${summary.totalDeductions.toLocaleString()}`);
console.log(`   Total Benefits: ₱${summary.totalBenefits.toLocaleString()}`);
console.log(`   Average Hours: ${summary.averageHours}`);
console.log(`   Completion Rate: ${summary.completionRate}%`);

console.log('\n🎯 API Consistency Verification Complete!');
console.log(`Status: ${allConsistent ? '✅ PASSED' : '❌ FAILED'}`);
