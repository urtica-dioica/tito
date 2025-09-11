const { getPool } = require('../dist/src/config/database');

async function checkDepartmentHeadView() {
  const pool = getPool();
  
  try {
    console.log('🔍 Checking Department Head View...\n');
    
    // Get department head user ID (Kim Galicia - Engineering department head)
    const deptHeadQuery = `
      SELECT u.id, u.first_name, u.last_name, u.email, d.id as department_id, d.name as department_name
      FROM users u
      JOIN departments d ON u.id = d.department_head_user_id
      WHERE u.email = 'kim404uni@gmail.com'
    `;
    const deptHeadResult = await pool.query(deptHeadQuery);
    
    if (deptHeadResult.rows.length === 0) {
      console.log('❌ Department head not found');
      return;
    }
    
    const deptHead = deptHeadResult.rows[0];
    console.log('👤 Department Head:', deptHead);
    
    // Check what payroll periods the department head should see
    console.log('\n📅 Payroll periods that department head should see:');
    const periodsQuery = `
      SELECT DISTINCT pp.*,
        COUNT(DISTINCT pr.employee_id) as total_employees,
        COALESCE(SUM(pr.net_pay), 0) as total_amount,
        pa.status as approval_status,
        pa.comments as approval_comments,
        pa.approved_at
      FROM payroll_periods pp
      INNER JOIN payroll_approvals pa ON pp.id = pa.payroll_period_id
      LEFT JOIN payroll_records pr ON pp.id = pr.payroll_period_id
      LEFT JOIN employees e ON pr.employee_id = e.id AND e.department_id = $1
      WHERE pa.approver_id = $2
      GROUP BY pp.id, pp.period_name, pp.start_date, pp.end_date, pp.status, 
               pp.working_days, pp.expected_hours, pp.created_at, pp.updated_at,
               pa.status, pa.comments, pa.approved_at
      ORDER BY pp.created_at DESC
    `;
    const periodsResult = await pool.query(periodsQuery, [deptHead.department_id, deptHead.id]);
    console.log('📊 Periods for department head:', periodsResult.rows.length);
    console.table(periodsResult.rows);
    
    // Check payroll approvals for this department head
    console.log('\n✅ Payroll approvals for this department head:');
    const approvalsQuery = `
      SELECT pa.*, pp.period_name, pp.start_date, pp.end_date
      FROM payroll_approvals pa
      JOIN payroll_periods pp ON pa.payroll_period_id = pp.id
      WHERE pa.approver_id = $1
      ORDER BY pa.created_at DESC
    `;
    const approvalsResult = await pool.query(approvalsQuery, [deptHead.id]);
    console.log('📊 Approvals for department head:', approvalsResult.rows.length);
    console.table(approvalsResult.rows);
    
    // Check employees in the department
    console.log('\n👥 Employees in Engineering department:');
    const employeesQuery = `
      SELECT e.id, e.employee_id, e.position, e.status, u.first_name, u.last_name
      FROM employees e
      JOIN users u ON e.user_id = u.id
      WHERE e.department_id = $1
    `;
    const employeesResult = await pool.query(employeesQuery, [deptHead.department_id]);
    console.table(employeesResult.rows);
    
    // Check payroll records for these employees
    console.log('\n💰 Payroll records for Engineering employees:');
    const recordsQuery = `
      SELECT pr.*, pp.period_name, e.employee_id, u.first_name, u.last_name
      FROM payroll_records pr
      JOIN payroll_periods pp ON pr.payroll_period_id = pp.id
      JOIN employees e ON pr.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      WHERE e.department_id = $1
      ORDER BY pp.created_at DESC, u.first_name
    `;
    const recordsResult = await pool.query(recordsQuery, [deptHead.department_id]);
    console.table(recordsResult.rows);
    
  } catch (error) {
    console.error('❌ Error checking department head view:', error);
  } finally {
    await pool.end();
  }
}

checkDepartmentHeadView();
