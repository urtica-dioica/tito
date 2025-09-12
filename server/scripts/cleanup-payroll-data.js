const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'tito_hr',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function cleanupPayrollData() {
  const client = await pool.connect();
  
  try {
    console.log('🧹 Starting payroll data cleanup...');
    
    // Start transaction
    await client.query('BEGIN');
    
    // 1. Delete payroll deductions (child records first)
    console.log('📝 Deleting payroll deductions...');
    const deductionsResult = await client.query('DELETE FROM payroll_deductions');
    console.log(`   ✅ Deleted ${deductionsResult.rowCount} payroll deduction records`);
    
    // 2. Delete payroll records
    console.log('📊 Deleting payroll records...');
    const recordsResult = await client.query('DELETE FROM payroll_records');
    console.log(`   ✅ Deleted ${recordsResult.rowCount} payroll record records`);
    
    // 3. Delete payroll approvals
    console.log('✅ Deleting payroll approvals...');
    const approvalsResult = await client.query('DELETE FROM payroll_approvals');
    console.log(`   ✅ Deleted ${approvalsResult.rowCount} payroll approval records`);
    
    // 4. Delete payroll periods
    console.log('📅 Deleting payroll periods...');
    const periodsResult = await client.query('DELETE FROM payroll_periods');
    console.log(`   ✅ Deleted ${periodsResult.rowCount} payroll period records`);
    
    // 5. Reset sequences (optional - to start IDs from 1 again)
    console.log('🔄 Resetting sequences...');
    await client.query('ALTER SEQUENCE payroll_periods_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE payroll_records_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE payroll_approvals_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE payroll_deductions_id_seq RESTART WITH 1');
    console.log('   ✅ Sequences reset');
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('🎉 Payroll data cleanup completed successfully!');
    console.log('');
    console.log('📋 Summary:');
    console.log(`   • Payroll Deductions: ${deductionsResult.rowCount} deleted`);
    console.log(`   • Payroll Records: ${recordsResult.rowCount} deleted`);
    console.log(`   • Payroll Approvals: ${approvalsResult.rowCount} deleted`);
    console.log(`   • Payroll Periods: ${periodsResult.rowCount} deleted`);
    console.log('');
    console.log('✨ You can now recompute payroll with fresh data!');
    
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error('❌ Error during cleanup:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the cleanup
cleanupPayrollData()
  .then(() => {
    console.log('✅ Cleanup script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Cleanup script failed:', error);
    process.exit(1);
  });
