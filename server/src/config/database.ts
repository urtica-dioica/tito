import { Pool, PoolConfig } from 'pg';
import { config } from './environment';

// Database connection configuration
const dbConfig: PoolConfig = process.env.DATABASE_URL ? {
  connectionString: process.env.DATABASE_URL,
  max: config.database.maxConnections,
  idleTimeoutMillis: config.database.idleTimeoutMillis,
  connectionTimeoutMillis: config.database.connectionTimeoutMillis,
  // Additional connection options
  allowExitOnIdle: false,
  query_timeout: 60000,
  statement_timeout: 60000,
} : {
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  user: config.database.user,
  password: config.database.password,
  ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
  max: config.database.maxConnections,
  idleTimeoutMillis: config.database.idleTimeoutMillis,
  connectionTimeoutMillis: config.database.connectionTimeoutMillis,
  // Additional connection options
  allowExitOnIdle: false,
  query_timeout: 60000,
  statement_timeout: 60000,
};

// Create the connection pool
export const pool = new Pool(dbConfig);

// Handle pool events
pool.on('connect', () => {
  console.log('New client connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

pool.on('remove', () => {
  console.log('Client removed from pool');
});

// Test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('Database connection successful:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
};

// Close database pool
export const closePool = async (): Promise<void> => {
  try {
    await pool.end();
    console.log('Database pool closed successfully');
  } catch (error) {
    console.error('Error closing database pool:', error);
  }
};

// Get database pool instance
export const getPool = (): Pool => pool;

// Health check for database
export const healthCheck = async (): Promise<{ status: string; timestamp: string; responseTime: number }> => {
  const start = Date.now();
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    const responseTime = Date.now() - start;
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - start;
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime,
    };
  }
}; 