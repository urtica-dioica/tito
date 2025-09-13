/**
 * Jest Configuration for Security Tests
 * 
 * Specialized configuration for security testing with extended timeouts
 * and security-specific test patterns
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Test patterns
  testMatch: [
    '**/tests/security/**/*.test.ts',
    '**/tests/security/**/*.test.js'
  ],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/security/setup.ts'],
  
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
  
  // Test timeout (extended for security tests)
  testTimeout: 120000, // 2 minutes
  
  // Coverage configuration
  collectCoverage: false, // Disable coverage for security tests
  
  // Verbose output
  verbose: true,
  
  // Test results processor
  // testResultsProcessor: 'jest-sonar-reporter',
  
  // Global setup and teardown
  globalSetup: '<rootDir>/tests/security/globalSetup.ts',
  globalTeardown: '<rootDir>/tests/security/globalTeardown.ts',
  
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
  
  // Security test specific options
  maxWorkers: 1, // Run security tests sequentially to avoid conflicts
  
  // Reporter configuration
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: './tests/security/reports',
      filename: 'security-test-report.html',
      expand: true
    }]
  ]
};

