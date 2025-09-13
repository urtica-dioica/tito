/**
 * Security Test Setup
 * 
 * Global setup for security tests including mocks and configurations
 */

import { jest } from '@jest/globals';

// Mock external dependencies
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    }
  })),
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn()
  }
}));

// Mock file system operations
jest.mock('fs/promises', () => ({
  writeFile: jest.fn(),
  readFile: jest.fn(),
  unlink: jest.fn(),
  mkdir: jest.fn(),
  access: jest.fn()
}));

// Mock path operations
jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
  resolve: jest.fn((...args) => args.join('/')),
  dirname: jest.fn((path: any) => path.split('/').slice(0, -1).join('/')),
  basename: jest.fn((path: any) => path.split('/').pop())
}));

// Mock performance timing
jest.mock('perf_hooks', () => ({
  performance: {
    now: jest.fn(() => Date.now())
  }
}));

// Global test configuration
beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.TEST_BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
  process.env.TEST_TIMEOUT = '30000';
  process.env.SECURITY_TEST_MODE = 'true';
  
  // Disable console warnings for cleaner test output
  const originalWarn = console.warn;
  console.warn = (...args) => {
    if (!args[0]?.includes('Security test')) {
      originalWarn(...args);
    }
  };
});

afterAll(() => {
  // Cleanup after all tests
  jest.clearAllMocks();
});

// Global test utilities
global.securityTestUtils = {
  // Create mock HTTP response
  createMockResponse: (status: number, data: any, headers: any = {}) => ({
    status,
    data,
    headers,
    statusText: status === 200 ? 'OK' : 'Error',
    config: {},
    request: {}
  }),

  // Create mock error response
  createMockError: (status: number, message: string) => ({
    response: {
      status,
      data: { error: message },
      headers: {},
      statusText: 'Error',
      config: {},
      request: {}
    },
    message,
    isAxiosError: true
  }),

  // Wait for specified time
  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  // Generate random string
  randomString: (length: number = 10) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  // Generate test payload
  generateTestPayload: (type: 'sql' | 'xss' | 'normal' = 'normal') => {
    switch (type) {
      case 'sql':
        return [
          "' OR '1'='1",
          "'; DROP TABLE users; --",
          "' UNION SELECT * FROM users --",
          "1' OR 1=1 --"
        ];
      case 'xss':
        return [
          '<script>alert("XSS")</script>',
          '<img src=x onerror=alert("XSS")>',
          'javascript:alert("XSS")',
          '<svg onload=alert("XSS")>'
        ];
      default:
        return [
          'test@example.com',
          'Test User',
          '123-456-7890',
          'Test Description'
        ];
    }
  }
};

// Extend Jest matchers for security tests
expect.extend({
  toBeSecureResponse(received: any) {
    const pass = received.status >= 200 && received.status < 300;
    return {
      message: () => `expected ${received.status} to be a secure response (2xx)`,
      pass
    };
  },

  toHaveSecurityHeader(received: any, header: string) {
    const pass = received.headers && received.headers[header.toLowerCase()] !== undefined;
    return {
      message: () => `expected response to have security header ${header}`,
      pass
    };
  },

  toBeRejected(received: any) {
    const pass = received.status >= 400;
    return {
      message: () => `expected ${received.status} to be a rejection (4xx or 5xx)`,
      pass
    };
  }
});

// Type declarations for global utilities
declare global {
  var securityTestUtils: {
    createMockResponse: (status: number, data: any, headers?: any) => any;
    createMockError: (status: number, message: string) => any;
    wait: (ms: number) => Promise<void>;
    randomString: (length?: number) => string;
    generateTestPayload: (type?: 'sql' | 'xss' | 'normal') => string[];
  };
}
