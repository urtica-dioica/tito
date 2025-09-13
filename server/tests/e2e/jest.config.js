/**
 * Jest Configuration for End-to-End Tests
 * 
 * Specialized configuration for E2E testing with extended timeouts
 * and E2E-specific test patterns
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Test patterns
  testMatch: [
    '**/tests/e2e/**/*.test.ts',
    '**/tests/e2e/**/*.test.js'
  ],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/e2e/setup.ts'],
  
  // Module name mapping
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  },
  
  // Transform configuration
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  
  // TypeScript configuration
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json'
    }
  },
  
  // Test timeout (extended for E2E tests)
  testTimeout: 300000, // 5 minutes
  
  // Coverage configuration
  collectCoverage: false, // Disable coverage for E2E tests
  
  // Verbose output
  verbose: true,
  
  // Test results processor
  // testResultsProcessor: 'jest-sonar-reporter',
  
  // Global setup and teardown
  globalSetup: '<rootDir>/tests/e2e/globalSetup.ts',
  globalTeardown: '<rootDir>/tests/e2e/globalTeardown.ts',
  
  // Test environment options
  testEnvironmentOptions: {
    url: 'http://localhost:3000'
  },
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'js', 'json'],
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Error handling
  errorOnDeprecated: true,
  
  // E2E test specific options
  maxWorkers: 1, // Run E2E tests sequentially to avoid conflicts
  
  // Reporter configuration
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: './tests/e2e/reports',
      filename: 'e2e-test-report.html',
      expand: true
    }]
  ]
};

