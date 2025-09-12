// Check which department the requests belong to and find the correct department head

const { getPool } = require('../dist/src/config/database');

async function checkDepartmentMapping() {
  const pool = getPool();
  
  try {
    console.log('🔍 Checking department mapping for requests...\n');
    
    // Check which department the requests belong to
    const requestsQuery = `
      WITH all_requests AS (
        SELECT 'overtime' as request_type, ot.employee_id, e.department_id, d.name as department_name
        FROM overtime_requests ot
        JOIN employees e ON ot.employee_id = e.id
        JOIN departments d ON e.department_id = d.id
        
        UNION ALL
        
        SELECT 'leave' as request_type, l.employee_id, e.department_id, d.name as department_name
        FROM leaves l
        JOIN employees e ON l.employee_id = e.id
        JOIN departments d ON e.department_id = d.id
        
        UNION ALL
        
        SELECT 'time_correction' as request_type, tcr.employee_id, e.department_id, d.name as department_name
        FROM time_correction_requests tcr
        JOIN employees e ON tcr.employee_id = e.id
        JOIN departments d ON e.department_id = d.id
      )
      SELECT 
        request_type,
        department_name,
        COUNT(*) as request_count
      FROM all_requests
      GROUP BY request_type, department_name
      ORDER BY department_name, request_type
    `;
    
    const requestsResult = await pool.query(requestsQuery);
    console.log('📊 Requests by Department:');
    requestsResult.rows.forEach(row => {
      console.log(`  ${row.request_type}: ${row.request_count} in ${row.department_name}`);
    });
    
    // Check all departments and their heads
    const departmentsQuery = `
      SELECT 
        d.id,
        d.name,
        d.description,
        u.id as head_user_id,
        u.first_name,
        u.last_name,
        u.email
      FROM departments d
      LEFT JOIN users u ON d.department_head_user_id = u.id
      ORDER BY d.name
    `;
    
    const departmentsResult = await pool.query(departmentsQuery);
    console.log('\n📋 Departments and their heads:');
    departmentsResult.rows.forEach(row => {
      console.log(`  ${row.name}: ${row.first_name} ${row.last_name} (${row.email || 'No head assigned'})`);
    });
    
    // Check if there are any requests for departments without heads
    const requestsWithoutHeadsQuery = `
      WITH all_requests AS (
        SELECT 'overtime' as request_type, ot.employee_id, e.department_id, d.name as department_name, d.department_head_user_id
        FROM overtime_requests ot
        JOIN employees e ON ot.employee_id = e.id
        JOIN departments d ON e.department_id = d.id
        
        UNION ALL
        
        SELECT 'leave' as request_type, l.employee_id, e.department_id, d.name as department_name, d.department_head_user_id
        FROM leaves l
        JOIN employees e ON l.employee_id = e.id
        JOIN departments d ON e.department_id = d.id
        
        UNION ALL
        
        SELECT 'time_correction' as request_type, tcr.employee_id, e.department_id, d.name as department_name, d.department_head_user_id
        FROM time_correction_requests tcr
        JOIN employees e ON tcr.employee_id = e.id
        JOIN departments d ON e.department_id = d.id
      )
      SELECT 
        department_name,
        COUNT(*) as request_count,
        CASE WHEN department_head_user_id IS NULL THEN 'No head assigned' ELSE 'Has head' END as head_status
      FROM all_requests
      GROUP BY department_name, department_head_user_id
      ORDER BY department_name
    `;
    
    const requestsWithoutHeadsResult = await pool.query(requestsWithoutHeadsQuery);
    console.log('\n⚠️  Requests by department head status:');
    requestsWithoutHeadsResult.rows.forEach(row => {
      console.log(`  ${row.department_name}: ${row.request_count} requests (${row.head_status})`);
    });
    
  } catch (error) {
    console.error('❌ Error checking department mapping:', error);
  } finally {
    await pool.end();
  }
}

checkDepartmentMapping();
