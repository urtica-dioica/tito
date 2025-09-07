// Test environment setup
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://postgres:password@localhost:5432/tito_hr_test';
process.env.REDIS_URL = process.env.TEST_REDIS_URL || 'redis://localhost:6379/1';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key';
process.env.JWT_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.PORT = '3001';

// Global test database connection (only for tests that need it)
let testDbPool: any = null;
let testRedisClient: any = null;

// Initialize connections for integration tests
export async function initializeTestConnections() {
  if (!testDbPool) {
    testDbPool = await setupTestDatabase();
  }
  if (!testRedisClient) {
    testRedisClient = await setupTestRedis();
  }
  return { testDbPool, testRedisClient };
}

// Only setup database connections for tests that actually need them
export async function setupTestDatabase() {
  if (testDbPool) return testDbPool;
  
  const { Pool } = await import('pg');
  testDbPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
  
  return testDbPool;
}

export async function setupTestRedis() {
  if (testRedisClient) return testRedisClient;
  
  const { createClient } = await import('redis');
  testRedisClient = createClient({
    url: process.env.REDIS_URL,
  });
  
  await testRedisClient.connect();
  return testRedisClient;
}

export async function cleanupTestDatabase() {
  if (!testDbPool) return;
  
  try {
    const client = await testDbPool.connect();
    try {
      // Disable foreign key checks temporarily
      await client.query('SET session_replication_role = replica;');
      
      // Clean all tables in reverse dependency order
      const tables = [
        'payroll_approvals',
        'payroll_deductions', 
        'payroll_records',
        'payroll_periods',
        'deduction_types',
        'leave_balances',
        'leaves',
        'overtime_requests',
        'time_correction_requests',
        'attendance_sessions',
        'attendance_records',
        'id_cards',
        'system_settings',
        'employees',
        'departments',
        'users'
      ];

      for (const table of tables) {
        await client.query(`DELETE FROM ${table}`);
      }

      // Reset sequences
      await client.query('ALTER SEQUENCE users_id_seq RESTART WITH 1');
      await client.query('ALTER SEQUENCE departments_id_seq RESTART WITH 1');
      await client.query('ALTER SEQUENCE employees_id_seq RESTART WITH 1');
      await client.query('ALTER SEQUENCE attendance_records_id_seq RESTART WITH 1');
      await client.query('ALTER SEQUENCE attendance_sessions_id_seq RESTART WITH 1');
      await client.query('ALTER SEQUENCE time_correction_requests_id_seq RESTART WITH 1');
      await client.query('ALTER SEQUENCE overtime_requests_id_seq RESTART WITH 1');
      await client.query('ALTER SEQUENCE leaves_id_seq RESTART WITH 1');
      await client.query('ALTER SEQUENCE leave_balances_id_seq RESTART WITH 1');
      await client.query('ALTER SEQUENCE payroll_periods_id_seq RESTART WITH 1');
      await client.query('ALTER SEQUENCE payroll_records_id_seq RESTART WITH 1');
      await client.query('ALTER SEQUENCE payroll_deductions_id_seq RESTART WITH 1');
      await client.query('ALTER SEQUENCE deduction_types_id_seq RESTART WITH 1');
      await client.query('ALTER SEQUENCE payroll_approvals_id_seq RESTART WITH 1');
      await client.query('ALTER SEQUENCE system_settings_id_seq RESTART WITH 1');
      await client.query('ALTER SEQUENCE id_cards_id_seq RESTART WITH 1');

      // Re-enable foreign key checks
      await client.query('SET session_replication_role = DEFAULT;');
    } finally {
      client.release();
    }
  } catch (error) {
    console.warn('Database cleanup failed (this is expected if database is not available):', (error as Error).message);
  }
}

export async function cleanupTestRedis() {
  if (!testRedisClient) return;
  
  try {
    await testRedisClient.flushDb();
  } catch (error) {
    console.warn('Redis cleanup failed (this is expected if Redis is not available):', (error as Error).message);
  }
}

// Export test utilities
export { testDbPool, testRedisClient };