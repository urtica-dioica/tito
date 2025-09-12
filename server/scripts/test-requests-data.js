// Test script to check if there are any requests in the database

const { getPool } = require('../dist/src/config/database');

async function testRequestsData() {
  const pool = getPool();
  
  try {
    console.log('🔍 Checking for requests data in the database...\n');
    
    // Check overtime requests
    const overtimeQuery = `
      SELECT 
        ot.id,
        ot.employee_id,
        ot.request_date,
        ot.overtime_date,
        ot.start_time,
        ot.end_time,
        ot.requested_hours,
        ot.reason,
        ot.status,
        ot.created_at,
        e.employee_id as employee_code,
        u.first_name,
        u.last_name,
        d.name as department_name
      FROM overtime_requests ot
      JOIN employees e ON ot.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      JOIN departments d ON e.department_id = d.id
      ORDER BY ot.created_at DESC
      LIMIT 5
    `;
    
    const overtimeResult = await pool.query(overtimeQuery);
    console.log('📊 Overtime Requests:', overtimeResult.rows.length);
    if (overtimeResult.rows.length > 0) {
      console.log('Sample overtime request:', overtimeResult.rows[0]);
    }
    
    // Check leave requests
    const leaveQuery = `
      SELECT 
        l.id,
        l.employee_id,
        l.start_date,
        l.end_date,
        l.leave_type,
        l.status,
        l.created_at,
        e.employee_id as employee_code,
        u.first_name,
        u.last_name,
        d.name as department_name
      FROM leaves l
      JOIN employees e ON l.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      JOIN departments d ON e.department_id = d.id
      ORDER BY l.created_at DESC
      LIMIT 5
    `;
    
    const leaveResult = await pool.query(leaveQuery);
    console.log('\n📊 Leave Requests:', leaveResult.rows.length);
    if (leaveResult.rows.length > 0) {
      console.log('Sample leave request:', leaveResult.rows[0]);
    }
    
    // Check time correction requests
    const timeCorrectionQuery = `
      SELECT 
        tcr.id,
        tcr.employee_id,
        tcr.correction_date,
        tcr.session_type,
        tcr.requested_clock_in,
        tcr.requested_clock_out,
        tcr.reason,
        tcr.status,
        tcr.created_at,
        e.employee_id as employee_code,
        u.first_name,
        u.last_name,
        d.name as department_name
      FROM time_correction_requests tcr
      JOIN employees e ON tcr.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      JOIN departments d ON e.department_id = d.id
      ORDER BY tcr.created_at DESC
      LIMIT 5
    `;
    
    const timeCorrectionResult = await pool.query(timeCorrectionQuery);
    console.log('\n📊 Time Correction Requests:', timeCorrectionResult.rows.length);
    if (timeCorrectionResult.rows.length > 0) {
      console.log('Sample time correction request:', timeCorrectionResult.rows[0]);
    }
    
    // Check departments and department heads
    const departmentQuery = `
      SELECT 
        d.id,
        d.name,
        d.description,
        u.first_name,
        u.last_name,
        u.email
      FROM departments d
      JOIN users u ON d.department_head_user_id = u.id
      ORDER BY d.name
    `;
    
    const departmentResult = await pool.query(departmentQuery);
    console.log('\n📊 Departments with Department Heads:', departmentResult.rows.length);
    if (departmentResult.rows.length > 0) {
      console.log('Sample department:', departmentResult.rows[0]);
    }
    
    // Summary
    const totalRequests = overtimeResult.rows.length + leaveResult.rows.length + timeCorrectionResult.rows.length;
    console.log('\n📈 Summary:');
    console.log(`Total Requests: ${totalRequests}`);
    console.log(`Departments: ${departmentResult.rows.length}`);
    
    if (totalRequests === 0) {
      console.log('\n⚠️  No requests found in the database!');
      console.log('This could be why the requests table is empty.');
      console.log('You may need to create some test requests or check if employees are creating requests.');
    } else {
      console.log('\n✅ Requests data found! The issue might be in the API or frontend.');
    }
    
  } catch (error) {
    console.error('❌ Error checking requests data:', error);
  } finally {
    await pool.end();
  }
}

testRequestsData();
