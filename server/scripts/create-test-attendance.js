const { getPool } = require('../src/config/database');
const logger = require('../src/utils/logger').default;

async function createTestAttendance() {
  const pool = getPool();
  const client = await pool.connect();

  try {
    console.log('🏗️  Creating Test Attendance Data...');
    console.log('=====================================');

    // Get active employees
    const employeesQuery = `
      SELECT e.id, e.employee_id, u.first_name, u.last_name, e.base_salary
      FROM employees e
      JOIN users u ON e.user_id = u.id
      WHERE e.status = 'active'
      ORDER BY e.employee_id
    `;
    
    const employeesResult = await client.query(employeesQuery);
    console.log(`Found ${employeesResult.rows.length} active employees`);

    if (employeesResult.rows.length === 0) {
      console.log('❌ No active employees found. Cannot create attendance data.');
      return;
    }

    // Create attendance records for January 2025 (22 working days)
    const workingDays = [
      '2025-01-02', '2025-01-03', '2025-01-06', '2025-01-07', '2025-01-08',
      '2025-01-09', '2025-01-10', '2025-01-13', '2025-01-14', '2025-01-15',
      '2025-01-16', '2025-01-17', '2025-01-20', '2025-01-21', '2025-01-22',
      '2025-01-23', '2025-01-24', '2025-01-27', '2025-01-28', '2025-01-29',
      '2025-01-30', '2025-01-31'
    ];

    let totalRecordsCreated = 0;
    let totalSessionsCreated = 0;

    for (const employee of employeesResult.rows) {
      console.log(`\n👤 Creating attendance for: ${employee.first_name} ${employee.last_name}`);
      
      for (const date of workingDays) {
        // Create attendance record
        const attendanceRecordQuery = `
          INSERT INTO attendance_records (employee_id, date, overall_status)
          VALUES ($1, $2, 'present')
          ON CONFLICT (employee_id, date) DO NOTHING
          RETURNING id
        `;
        
        const attendanceResult = await client.query(attendanceRecordQuery, [employee.id, date]);
        
        if (attendanceResult.rows.length > 0) {
          const attendanceRecordId = attendanceResult.rows[0].id;
          totalRecordsCreated++;
          
          // Create morning session (8:00 AM - 12:00 PM = 4 hours)
          const morningIn = new Date(`${date}T08:00:00.000Z`);
          const morningOut = new Date(`${date}T12:00:00.000Z`);
          
          const morningSessionQuery = `
            INSERT INTO attendance_sessions (attendance_record_id, session_type, clock_in, clock_out)
            VALUES ($1, 'morning_in', $2, $3)
            ON CONFLICT DO NOTHING
          `;
          
          await client.query(morningSessionQuery, [attendanceRecordId, morningIn, morningOut]);
          totalSessionsCreated++;
          
          // Create afternoon session (1:00 PM - 5:00 PM = 4 hours)
          const afternoonIn = new Date(`${date}T13:00:00.000Z`);
          const afternoonOut = new Date(`${date}T17:00:00.000Z`);
          
          const afternoonSessionQuery = `
            INSERT INTO attendance_sessions (attendance_record_id, session_type, clock_in, clock_out)
            VALUES ($1, 'afternoon_in', $2, $3)
            ON CONFLICT DO NOTHING
          `;
          
          await client.query(afternoonSessionQuery, [attendanceRecordId, afternoonIn, afternoonOut]);
          totalSessionsCreated++;
        }
      }
    }

    console.log('\n✅ Test Attendance Data Created Successfully!');
    console.log('=============================================');
    console.log(`📊 Summary:`);
    console.log(`   - Attendance Records Created: ${totalRecordsCreated}`);
    console.log(`   - Attendance Sessions Created: ${totalSessionsCreated}`);
    console.log(`   - Working Days: ${workingDays.length}`);
    console.log(`   - Expected Hours per Employee: ${workingDays.length * 8} hours`);
    console.log(`   - Period: January 2-31, 2025`);

    // Verify the data was created
    const verifyQuery = `
      SELECT 
        COUNT(DISTINCT ar.employee_id) as employees_with_attendance,
        COUNT(DISTINCT ar.date) as total_days,
        SUM(s.calculated_hours) as total_hours
      FROM attendance_records ar
      LEFT JOIN attendance_sessions s ON ar.id = s.attendance_record_id
      WHERE ar.date >= '2025-01-01' AND ar.date <= '2025-01-31'
    `;
    
    const verifyResult = await client.query(verifyQuery);
    const verifyData = verifyResult.rows[0];
    
    console.log(`\n🔍 Verification:`);
    console.log(`   - Employees with Attendance: ${verifyData.employees_with_attendance}`);
    console.log(`   - Total Days: ${verifyData.total_days}`);
    console.log(`   - Total Hours: ${verifyData.total_hours || 0}`);

  } catch (error) {
    console.error('❌ Error creating test attendance data:', error);
  } finally {
    client.release();
  }
}

createTestAttendance();
