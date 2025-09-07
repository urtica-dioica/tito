#!/usr/bin/env node

const { Client } = require('pg');
const bcrypt = require('bcryptjs');

// Database configuration
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: 'tito_hr',
};

async function seedDatabase() {
  const client = new Client(config);
  
  try {
    console.log('🔌 Connecting to tito_hr database...');
    await client.connect();
    console.log('✅ Connected to tito_hr database');

    // Check if HR user already exists
    const hrExists = await client.query(
      "SELECT 1 FROM users WHERE role = 'hr'"
    );

    if (hrExists.rows.length === 0) {
      console.log('👑 Creating HR user...');
      
      // Hash password for HR user
      const password = 'admin123'; // Change this in production!
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Create HR user
      const hrUser = await client.query(`
        INSERT INTO users (email, password_hash, first_name, last_name, role, is_active)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, email
      `, [
        'hr.admin@tito.com',
        hashedPassword,
        'HR',
        'Administrator',
        'hr',
        true
      ]);

      console.log(`✅ HR user created: ${hrUser.rows[0].email}`);
      console.log(`🔑 Default password: ${password}`);
      console.log('⚠️  IMPORTANT: Change this password immediately!');
    } else {
      console.log('ℹ️  HR user already exists');
    }

    // Check if default department exists
    const deptExists = await client.query(
      "SELECT 1 FROM departments WHERE name = 'General'"
    );

    if (deptExists.rows.length === 0) {
      console.log('🏢 Creating default department...');
      
      await client.query(`
        INSERT INTO departments (name, description, is_active)
        VALUES ($1, $2, $3)
      `, [
        'General',
        'Default department for new employees',
        true
      ]);

      console.log('✅ Default department created');
    } else {
      console.log('ℹ️  Default department already exists');
    }

    // Check if basic deduction types exist
    const deductionExists = await client.query(
      "SELECT 1 FROM deduction_types WHERE name = 'SSS'"
    );

    if (deductionExists.rows.length === 0) {
      console.log('💰 Creating basic deduction types...');
      
      const deductions = [
        { name: 'SSS', description: 'Social Security System', percentage: 11.0, fixed_amount: null },
        { name: 'PhilHealth', description: 'Philippine Health Insurance', percentage: 2.5, fixed_amount: null },
        { name: 'Pag-IBIG', description: 'Home Development Mutual Fund', percentage: 2.0, fixed_amount: null },
        { name: 'Tax', description: 'Income Tax', percentage: null, fixed_amount: 0 },
        { name: 'Late Deduction', description: 'Deduction for late attendance', percentage: null, fixed_amount: 0 }
      ];

      for (const deduction of deductions) {
        await client.query(`
          INSERT INTO deduction_types (name, description, percentage, fixed_amount, is_active)
          VALUES ($1, $2, $3, $4, $5)
        `, [
          deduction.name,
          deduction.description,
          deduction.percentage,
          deduction.fixed_amount,
          true
        ]);
      }

      console.log('✅ Basic deduction types created');
    } else {
      console.log('ℹ️  Basic deduction types already exist');
    }

    // Verify system settings
    console.log('⚙️  Verifying system settings...');
    
    const settings = await client.query('SELECT setting_key, setting_value FROM system_settings');
    console.log('📋 Current system settings:');
    
    for (const setting of settings.rows) {
      console.log(`   ${setting.setting_key}: ${setting.setting_value}`);
    }

    console.log('🎉 Database seeding completed successfully!');
    
    // Display connection info
    console.log('\n📊 Database Connection Info:');
    console.log(`   Host: ${config.host}`);
    console.log(`   Port: ${config.port}`);
    console.log(`   Database: ${config.database}`);
    console.log(`   User: ${config.user}`);

  } catch (error) {
    console.error('❌ Database seeding failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the seeding
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase }; 