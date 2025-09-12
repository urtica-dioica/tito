const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'tito_hr',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function forceCleanup() {
  const client = await pool.connect();
  
  try {
    console.log('🔥 FORCE CLEANUP - Payroll Data');
    console.log('===============================');
    
    // Start transaction
    await client.query('BEGIN');
    
    // Disable foreign key checks
    await client.query('SET session_replication_role = replica');
    console.log('🔓 Foreign key checks disabled');
    
    // Delete in order
    console.log('🗑️  Deleting payroll deductions...');
    const deductionsResult = await client.query('DELETE FROM payroll_deductions');
    console.log(`   ✅ Deleted ${deductionsResult.rowCount} deductions`);
    
    console.log('🗑️  Deleting payroll records...');
    const recordsResult = await client.query('DELETE FROM payroll_records');
    console.log(`   ✅ Deleted ${recordsResult.rowCount} records`);
    
    console.log('🗑️  Deleting payroll approvals...');
    const approvalsResult = await client.query('DELETE FROM payroll_approvals');
    console.log(`   ✅ Deleted ${approvalsResult.rowCount} approvals`);
    
    console.log('🗑️  Deleting payroll periods...');
    const periodsResult = await client.query('DELETE FROM payroll_periods');
    console.log(`   ✅ Deleted ${periodsResult.rowCount} periods`);
    
    // Re-enable foreign key checks
    await client.query('SET session_replication_role = DEFAULT');
    console.log('🔒 Foreign key checks re-enabled');
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('✅ Transaction committed');
    
    // Verify cleanup
    console.log('');
    console.log('🔍 Verification:');
    const verifyResult = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM payroll_periods) as periods,
        (SELECT COUNT(*) FROM payroll_records) as records,
        (SELECT COUNT(*) FROM payroll_approvals) as approvals,
        (SELECT COUNT(*) FROM payroll_deductions) as deductions
    `);
    
    const counts = verifyResult.rows[0];
    console.log(`📅 Periods: ${counts.periods}`);
    console.log(`📊 Records: ${counts.records}`);
    console.log(`✅ Approvals: ${counts.approvals}`);
    console.log(`📝 Deductions: ${counts.deductions}`);
    
    const total = parseInt(counts.periods) + parseInt(counts.records) + parseInt(counts.approvals) + parseInt(counts.deductions);
    
    if (total === 0) {
      console.log('');
      console.log('🎉 SUCCESS: All payroll data deleted!');
    } else {
      console.log('');
      console.log(`❌ WARNING: ${total} records still remain!`);
    }
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error during force cleanup:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

forceCleanup()
  .then(() => {
    console.log('✅ Force cleanup completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Force cleanup failed:', error);
    process.exit(1);
  });
