const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'tito_hr',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function verifyCleanup() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Verifying Payroll Data Cleanup');
    console.log('=================================');
    console.log('');
    
    // Check payroll periods
    const periodsResult = await client.query('SELECT COUNT(*) as count FROM payroll_periods');
    console.log(`📅 Payroll Periods: ${periodsResult.rows[0].count}`);
    
    // Check payroll records
    const recordsResult = await client.query('SELECT COUNT(*) as count FROM payroll_records');
    console.log(`📊 Payroll Records: ${recordsResult.rows[0].count}`);
    
    // Check payroll approvals
    const approvalsResult = await client.query('SELECT COUNT(*) as count FROM payroll_approvals');
    console.log(`✅ Payroll Approvals: ${approvalsResult.rows[0].count}`);
    
    // Check payroll deductions
    const deductionsResult = await client.query('SELECT COUNT(*) as count FROM payroll_deductions');
    console.log(`📝 Payroll Deductions: ${deductionsResult.rows[0].count}`);
    
    console.log('');
    
    // Show any remaining data
    if (periodsResult.rows[0].count > 0) {
      console.log('⚠️  Remaining Payroll Periods:');
      const remainingPeriods = await client.query('SELECT id, period_name, status FROM payroll_periods');
      remainingPeriods.rows.forEach(period => {
        console.log(`   - ${period.period_name} (${period.status}) - ID: ${period.id}`);
      });
    }
    
    if (recordsResult.rows[0].count > 0) {
      console.log('⚠️  Remaining Payroll Records:');
      const remainingRecords = await client.query('SELECT id, employee_id, gross_pay, net_pay FROM payroll_records');
      remainingRecords.rows.forEach(record => {
        console.log(`   - Employee: ${record.employee_id}, Gross: ${record.gross_pay}, Net: ${record.net_pay} - ID: ${record.id}`);
      });
    }
    
    const totalRemaining = parseInt(periodsResult.rows[0].count) + 
                          parseInt(recordsResult.rows[0].count) + 
                          parseInt(approvalsResult.rows[0].count) + 
                          parseInt(deductionsResult.rows[0].count);
    
    console.log('');
    if (totalRemaining === 0) {
      console.log('✅ SUCCESS: All payroll data has been deleted!');
    } else {
      console.log(`❌ WARNING: ${totalRemaining} records still remain in the database.`);
    }
    
  } catch (error) {
    console.error('❌ Error verifying cleanup:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

verifyCleanup();
