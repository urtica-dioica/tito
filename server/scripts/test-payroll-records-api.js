// Test script to verify payroll records API response

const { getPool } = require('../dist/src/config/database');
const { DepartmentHeadService } = require('../dist/src/services/department-head/departmentHeadService');

async function testPayrollRecordsAPI() {
  const pool = getPool();
  const departmentHeadService = new DepartmentHeadService();
  
  try {
    console.log('🔍 Testing Payroll Records API...\n');
    
    // Find the Engineering department head
    const departmentHeadQuery = `
      SELECT 
        u.id as user_id,
        u.first_name,
        u.last_name,
        u.email,
        d.id as department_id,
        d.name as department_name
      FROM users u
      JOIN departments d ON u.id = d.department_head_user_id
      WHERE u.role = 'department_head' AND d.name = 'Engineering'
      LIMIT 1
    `;
    
    const departmentHeadResult = await pool.query(departmentHeadQuery);
    
    if (departmentHeadResult.rows.length === 0) {
      console.log('❌ No Engineering department head found!');
      return;
    }
    
    const departmentHead = departmentHeadResult.rows[0];
    console.log('👤 Engineering Department Head:', departmentHead);
    
    // Get payroll periods first
    console.log('\n📋 Getting payroll periods...');
    const payrollPeriods = await departmentHeadService.getPayrollPeriods(departmentHead.user_id);
    console.log('Payroll periods found:', payrollPeriods.length);
    
    if (payrollPeriods.length === 0) {
      console.log('❌ No payroll periods found!');
      return;
    }
    
    // Test with the first period
    const testPeriod = payrollPeriods[0];
    console.log('\n🧪 Testing with period:', testPeriod.periodName, 'ID:', testPeriod.id);
    
    // Get payroll records for this period
    console.log('\n📊 Getting payroll records...');
    const payrollRecords = await departmentHeadService.getPayrollRecords(departmentHead.user_id, testPeriod.id);
    console.log('Payroll records found:', payrollRecords.length);
    
    if (payrollRecords.length > 0) {
      console.log('\n📋 Sample payroll record:');
      const sampleRecord = payrollRecords[0];
      console.log('  ID:', sampleRecord.id);
      console.log('  Employee:', sampleRecord.employeeName);
      console.log('  Position:', sampleRecord.position);
      console.log('  Base Salary:', sampleRecord.baseSalary);
      console.log('  Hourly Rate:', sampleRecord.hourlyRate);
      console.log('  Total Worked Hours:', sampleRecord.totalWorkedHours);
      console.log('  Total Regular Hours:', sampleRecord.totalRegularHours);
      console.log('  Total Overtime Hours:', sampleRecord.totalOvertimeHours);
      console.log('  Total Late Hours:', sampleRecord.totalLateHours);
      console.log('  Late Deductions:', sampleRecord.lateDeductions);
      console.log('  Gross Pay:', sampleRecord.grossPay);
      console.log('  Net Pay:', sampleRecord.netPay);
      console.log('  Total Deductions:', sampleRecord.totalDeductions);
      console.log('  Total Benefits:', sampleRecord.totalBenefits);
      console.log('  Status:', sampleRecord.status);
    } else {
      console.log('❌ No payroll records found for this period!');
    }
    
  } catch (error) {
    console.error('❌ Error testing payroll records API:', error);
  } finally {
    await pool.end();
  }
}

testPayrollRecordsAPI();
