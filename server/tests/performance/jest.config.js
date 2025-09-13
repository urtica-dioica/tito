module.exports = {
  displayName: 'Performance Tests',
  testEnvironment: 'node',
  testMatch: ['**/tests/performance/**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.ts'],
  globalSetup: '<rootDir>/tests/globalSetup.ts',
  globalTeardown: '<rootDir>/tests/globalTeardown.ts',
  collectCoverage: false, // Disable coverage for performance tests
  testTimeout: 300000, // 5 minutes timeout for performance tests
  maxWorkers: 1, // Run performance tests sequentially to avoid resource conflicts
  verbose: true,
  detectOpenHandles: true,
  forceExit: true,
  // Performance test specific configuration
  globals: {
    'ts-jest': {
      tsconfig: {
        target: 'es2020',
        module: 'commonjs',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        strict: true,
        skipLibCheck: true
      }
    }
  },
  // Custom test environment variables
  setupFiles: ['<rootDir>/tests/performance/setup.ts'],
  // Performance thresholds (optional)
  // These can be used to fail tests if performance degrades
  performanceThresholds: {
    // API endpoint response time thresholds (in milliseconds)
    apiThresholds: {
      auth: {
        login: 2000,
        profile: 1000,
        refresh: 1500
      },
      payroll: {
        periods: 2000,
        records: 3000,
        summary: 2500,
        stats: 3000
      },
      employee: {
        listing: 2000,
        search: 2500,
        details: 1500
      }
    },
    // Database query time thresholds (in milliseconds)
    dbThresholds: {
      userAuth: 50,
      employeeList: 100,
      attendanceStats: 150,
      payrollSummary: 200,
      departmentStats: 100
    },
    // Load test thresholds
    loadTestThresholds: {
      averageResponseTime: 2000,
      maxResponseTime: 5000,
      errorRate: 0.05, // 5%
      requestsPerSecond: 10
    }
  }
};

