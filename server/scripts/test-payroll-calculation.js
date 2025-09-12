const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'tito_hr',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function testPayrollCalculation() {
  const client = await pool.connect();
  
  try {
    console.log('🧪 Testing Payroll Calculation');
    console.log('==============================');
    console.log('');
    
    // Get all employees
    const employeesResult = await client.query(`
      SELECT e.id, e.employee_id, u.first_name, u.last_name, e.base_salary
      FROM employees e
      JOIN users u ON e.user_id = u.id
      WHERE e.status = 'active'
      LIMIT 5
    `);
    
    console.log(`Found ${employeesResult.rows.length} active employees:`);
    employeesResult.rows.forEach(emp => {
      console.log(`- ${emp.first_name} ${emp.last_name} (${emp.employee_id}) - Base Salary: ₱${emp.base_salary}`);
    });
    console.log('');
    
    // Test attendance data for each employee
    for (const employee of employeesResult.rows) {
      console.log(`🔍 Testing Employee: ${employee.first_name} ${employee.last_name}`);
      console.log(`   Employee ID: ${employee.employee_id}`);
      console.log(`   Base Salary: ₱${employee.base_salary}`);
      
      // Get attendance data using the EXACT same logic as dashboard service
      const attendanceQuery = `
        SELECT 
          SUM(
            COALESCE(
              -- Morning session hours (if both morning_in and morning_out exist)
              (SELECT EXTRACT(EPOCH FROM (m_out.clock_out - m_in.clock_in)) / 3600.0
               FROM attendance_sessions m_in, attendance_sessions m_out
               WHERE m_in.attendance_record_id = ar.id 
                 AND m_in.session_type = 'morning_in'
                 AND m_in.clock_in IS NOT NULL
                 AND m_out.attendance_record_id = ar.id 
                 AND m_out.session_type = 'morning_out'
                 AND m_out.clock_out IS NOT NULL), 0) +
            COALESCE(
              -- Afternoon session hours (if both afternoon_in and afternoon_out exist)
              (SELECT EXTRACT(EPOCH FROM (a_out.clock_out - a_in.clock_in)) / 3600.0
               FROM attendance_sessions a_in, attendance_sessions a_out
               WHERE a_in.attendance_record_id = ar.id 
                 AND a_in.session_type = 'afternoon_in'
                 AND a_in.clock_in IS NOT NULL
                 AND a_out.attendance_record_id = ar.id 
                 AND a_out.session_type = 'afternoon_out'
                 AND a_out.clock_out IS NOT NULL), 0)
          ) as total_worked_hours,
          SUM(
            COALESCE(
              -- Morning session hours (if both morning_in and morning_out exist)
              (SELECT EXTRACT(EPOCH FROM (m_out.clock_out - m_in.clock_in)) / 3600.0
               FROM attendance_sessions m_in, attendance_sessions m_out
               WHERE m_in.attendance_record_id = ar.id 
                 AND m_in.session_type = 'morning_in'
                 AND m_in.clock_in IS NOT NULL
                 AND m_out.attendance_record_id = ar.id 
                 AND m_out.session_type = 'morning_out'
                 AND m_out.clock_out IS NOT NULL), 0) +
            COALESCE(
              -- Afternoon session hours (if both afternoon_in and afternoon_out exist)
              (SELECT EXTRACT(EPOCH FROM (a_out.clock_out - a_in.clock_in)) / 3600.0
               FROM attendance_sessions a_in, attendance_sessions a_out
               WHERE a_in.attendance_record_id = ar.id 
                 AND a_in.session_type = 'afternoon_in'
                 AND a_in.clock_in IS NOT NULL
                 AND a_out.attendance_record_id = ar.id 
                 AND a_out.session_type = 'afternoon_out'
                 AND a_out.clock_out IS NOT NULL), 0)
          ) as total_regular_hours,
          0 as total_overtime_hours,
          0 as total_late_hours,
          COUNT(DISTINCT ar.date) as total_working_days
        FROM attendance_records ar
        WHERE ar.employee_id = $1 
          AND ar.date >= '2025-09-01' 
          AND ar.date <= '2025-09-30'
          AND ar.overall_status IN ('present', 'late', 'partial')
      `;
      
      const attendanceResult = await client.query(attendanceQuery, [employee.id]);
      const attendanceData = attendanceResult.rows[0];
      
      const totalWorkedHours = Math.round(parseFloat(attendanceData.total_worked_hours) || 0);
      const totalRegularHours = Math.round(parseFloat(attendanceData.total_regular_hours) || 0);
      const totalOvertimeHours = Math.round(parseFloat(attendanceData.total_overtime_hours) || 0);
      const totalLateHours = Math.round(parseFloat(attendanceData.total_late_hours) || 0);
      const totalWorkingDays = parseInt(attendanceData.total_working_days) || 0;
      
      console.log(`   📊 Attendance Data:`);
      console.log(`      Total Worked Hours: ${totalWorkedHours}`);
      console.log(`      Total Regular Hours: ${totalRegularHours}`);
      console.log(`      Total Overtime Hours: ${totalOvertimeHours}`);
      console.log(`      Total Late Hours: ${totalLateHours}`);
      console.log(`      Working Days: ${totalWorkingDays}`);
      
      // Calculate expected hours (assuming 22 working days in January 2025)
      const expectedWorkingDays = 22;
      const expectedHours = expectedWorkingDays * 8; // 176 hours
      
      // Calculate gross pay
      const baseSalary = Number(employee.base_salary) || 0;
      const grossPay = expectedHours > 0 ? (totalWorkedHours / expectedHours) * baseSalary : 0;
      
      console.log(`   💰 Payroll Calculation:`);
      console.log(`      Expected Hours: ${expectedHours} (${expectedWorkingDays} days × 8 hours)`);
      console.log(`      Gross Pay: ₱${grossPay.toFixed(2)} (${totalWorkedHours}/${expectedHours} × ₱${baseSalary})`);
      
      if (totalWorkedHours === 0) {
        console.log(`   ⚠️  WARNING: No attendance data found for this employee!`);
      }
      
      console.log('');
    }
    
    // Check if there are any attendance records at all
    const totalAttendanceResult = await client.query(`
      SELECT COUNT(*) as total_records
      FROM attendance_records ar
      WHERE ar.date >= '2025-09-01' AND ar.date <= '2025-09-30'
    `);
    
    console.log(`📅 Total attendance records in September 2025: ${totalAttendanceResult.rows[0].total_records}`);
    
    if (totalAttendanceResult.rows[0].total_records === 0) {
      console.log('⚠️  WARNING: No attendance records found for September 2025!');
      console.log('   This explains why gross pay is 0 - there are no attendance records to calculate from.');
    }
    
  } catch (error) {
    console.error('❌ Error testing payroll calculation:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

testPayrollCalculation();
