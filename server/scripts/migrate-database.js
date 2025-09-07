#!/usr/bin/env node

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'tito_user',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'tito_hr',
};

async function migrateDatabase() {
  const client = new Client(config);
  
  try {
    console.log('🔌 Connecting to PostgreSQL...');
    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    // Check if database exists
    const dbCheck = await client.query('SELECT current_database()');
    console.log(`📊 Connected to database: ${dbCheck.rows[0].current_database}`);

    // Read and apply the schema
    const schemaPath = path.join(__dirname, '..', '..', 'database', 'schemas', 'main-schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found: ${schemaPath}`);
    }

    console.log('📄 Reading schema file...');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('🚀 Applying database schema...');
    await client.query(schema);
    console.log('✅ Database schema applied successfully');

    // Verify tables were created
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log('📋 Created tables:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    // Check if we have any data
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    console.log(`👥 Users in database: ${userCount.rows[0].count}`);

    console.log('🎉 Database migration completed successfully!');

  } catch (error) {
    console.error('❌ Database migration failed:');
    console.error(error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateDatabase();
}

module.exports = { migrateDatabase };