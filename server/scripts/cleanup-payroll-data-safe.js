const { Pool } = require('pg');
const readline = require('readline');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'tito_hr',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function showCurrentData() {
  const client = await pool.connect();
  
  try {
    console.log('📊 Current Payroll Data:');
    console.log('========================');
    
    // Count payroll periods
    const periodsResult = await client.query('SELECT COUNT(*) as count FROM payroll_periods');
    console.log(`📅 Payroll Periods: ${periodsResult.rows[0].count}`);
    
    // Count payroll records
    const recordsResult = await client.query('SELECT COUNT(*) as count FROM payroll_records');
    console.log(`📊 Payroll Records: ${recordsResult.rows[0].count}`);
    
    // Count payroll approvals
    const approvalsResult = await client.query('SELECT COUNT(*) as count FROM payroll_approvals');
    console.log(`✅ Payroll Approvals: ${approvalsResult.rows[0].count}`);
    
    // Count payroll deductions
    const deductionsResult = await client.query('SELECT COUNT(*) as count FROM payroll_deductions');
    console.log(`📝 Payroll Deductions: ${deductionsResult.rows[0].count}`);
    
    console.log('');
    
  } finally {
    client.release();
  }
}

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
    try {
      await client.query('ALTER SEQUENCE payroll_periods_id_seq RESTART WITH 1');
      console.log('   ✅ payroll_periods_id_seq reset');
    } catch (e) {
      console.log('   ⚠️  payroll_periods_id_seq not found (using default)');
    }
    
    try {
      await client.query('ALTER SEQUENCE payroll_records_id_seq RESTART WITH 1');
      console.log('   ✅ payroll_records_id_seq reset');
    } catch (e) {
      console.log('   ⚠️  payroll_records_id_seq not found (using default)');
    }
    
    try {
      await client.query('ALTER SEQUENCE payroll_approvals_id_seq RESTART WITH 1');
      console.log('   ✅ payroll_approvals_id_seq reset');
    } catch (e) {
      console.log('   ⚠️  payroll_approvals_id_seq not found (using default)');
    }
    
    try {
      await client.query('ALTER SEQUENCE payroll_deductions_id_seq RESTART WITH 1');
      console.log('   ✅ payroll_deductions_id_seq reset');
    } catch (e) {
      console.log('   ⚠️  payroll_deductions_id_seq not found (using default)');
    }
    
    console.log('   ✅ Sequence reset completed');
    
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

async function main() {
  try {
    console.log('🗑️  Payroll Data Cleanup Tool');
    console.log('=============================');
    console.log('');
    
    // Show current data
    await showCurrentData();
    
    // Ask for confirmation
    const confirm1 = await askQuestion('⚠️  WARNING: This will DELETE ALL payroll data. Are you sure? (yes/no): ');
    
    if (confirm1.toLowerCase() !== 'yes') {
      console.log('❌ Cleanup cancelled by user');
      rl.close();
      return;
    }
    
    const confirm2 = await askQuestion('🔴 FINAL WARNING: This action cannot be undone. Type "DELETE" to confirm: ');
    
    if (confirm2 !== 'DELETE') {
      console.log('❌ Cleanup cancelled by user');
      rl.close();
      return;
    }
    
    console.log('');
    console.log('🚀 Proceeding with cleanup...');
    console.log('');
    
    // Run the cleanup
    await cleanupPayrollData();
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  } finally {
    rl.close();
  }
}

// Run the main function
main();
