#!/usr/bin/env node

const { Client } = require('pg');

// Database configuration
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: 'postgres', // Connect to default postgres database first
};

async function setupDatabase() {
  const client = new Client(config);
  
  try {
    console.log('🔌 Connecting to PostgreSQL...');
    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    // Check if database exists
    const dbExists = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'tito_hr'"
    );

    if (dbExists.rows.length === 0) {
      console.log('🗄️  Creating database "tito_hr"...');
      await client.query('CREATE DATABASE tito_hr');
      console.log('✅ Database "tito_hr" created successfully');
    } else {
      console.log('ℹ️  Database "tito_hr" already exists');
    }

    // Check if user exists
    const userExists = await client.query(
      "SELECT 1 FROM pg_roles WHERE rolname = 'tito_user'"
    );

    if (userExists.rows.length === 0) {
      console.log('👤 Creating user "tito_user"...');
      await client.query("CREATE USER tito_user WITH PASSWORD 'password'");
      console.log('✅ User "tito_user" created successfully');
    } else {
      console.log('ℹ️  User "tito_user" already exists');
    }

    // Grant privileges to the user
    console.log('🔐 Granting privileges to tito_user...');
    await client.query('GRANT ALL PRIVILEGES ON DATABASE tito_hr TO tito_user');
    console.log('✅ Database privileges granted successfully');

    await client.end();

    // Connect to tito_hr database to grant schema privileges
    const titoClient = new Client({
      ...config,
      database: 'tito_hr',
    });

    await titoClient.connect();
    console.log('✅ Connected to tito_hr database');

    await titoClient.query('GRANT ALL PRIVILEGES ON SCHEMA public TO tito_user');
    await titoClient.query('GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO tito_user');
    await titoClient.query('GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO tito_user');
    await titoClient.query('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO tito_user');
    await titoClient.query('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO tito_user');
    console.log('✅ Schema privileges granted successfully');

    await titoClient.end();

    console.log('🎉 Database setup completed successfully!');
    console.log('💡 Run "npm run db:migrate" to apply the database schema');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the setup
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };