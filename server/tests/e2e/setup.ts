/**
 * End-to-End Test Setup
 * 
 * Global setup for E2E tests including mocks and configurations
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
  process.env.TEST_TIMEOUT = '300000'; // 5 minutes for E2E tests
  process.env.E2E_TEST_MODE = 'true';
  
  // Disable console warnings for cleaner test output
  const originalWarn = console.warn;
  console.warn = (...args) => {
    if (!args[0]?.includes('E2E test')) {
      originalWarn(...args);
    }
  };
});

afterAll(() => {
  // Cleanup after all tests
  jest.clearAllMocks();
});

// Global test utilities
global.e2eTestUtils = {
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

  // Generate test data
  generateTestData: (type: 'user' | 'employee' | 'department' | 'payroll' = 'user') => {
    const timestamp = Date.now();
    switch (type) {
      case 'user':
        return {
          username: `e2euser${timestamp}`,
          email: `e2euser${timestamp}@example.com`,
          password: 'E2ETest123!',
          role: 'employee'
        };
      case 'employee':
        return {
          name: `E2E Employee ${timestamp}`,
          email: `e2eemployee${timestamp}@example.com`,
          position: 'E2E Test Position',
          department_id: 1,
          hire_date: new Date().toISOString().split('T')[0],
          base_salary: 50000
        };
      case 'department':
        return {
          name: `E2E Department ${timestamp}`,
          description: 'Department created for E2E testing'
        };
      case 'payroll':
        return {
          period: `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}`,
          amount: Math.floor(Math.random() * 100000) + 30000
        };
      default:
        return {};
    }
  },

  // Generate test workflow steps
  generateWorkflowSteps: (workflowType: 'hr' | 'employee' | 'department-head' | 'kiosk') => {
    const baseSteps = [
      { name: 'Login', action: 'POST /api/v1/auth/login', expected: '200' },
      { name: 'Access Dashboard', action: 'GET /api/v1/{role}/dashboard', expected: '200' }
    ];

    switch (workflowType) {
      case 'hr':
        return [
          ...baseSteps,
          { name: 'Create Department', action: 'POST /api/v1/hr/departments', expected: '201' },
          { name: 'Create Employee', action: 'POST /api/v1/hr/employees', expected: '201' },
          { name: 'Generate Payroll', action: 'POST /api/v1/hr/payroll/generate', expected: '201' }
        ];
      case 'employee':
        return [
          ...baseSteps,
          { name: 'View Profile', action: 'GET /api/v1/employee/profile', expected: '200' },
          { name: 'Submit Leave Request', action: 'POST /api/v1/employee/leaves', expected: '201' },
          { name: 'View Paystubs', action: 'GET /api/v1/employee/paystubs', expected: '200' }
        ];
      case 'department-head':
        return [
          ...baseSteps,
          { name: 'View Department Employees', action: 'GET /api/v1/department-head/employees', expected: '200' },
          { name: 'Approve Leave Request', action: 'PUT /api/v1/department-head/leaves/{id}/approve', expected: '200' },
          { name: 'View Attendance Summary', action: 'GET /api/v1/department-head/attendance/summary', expected: '200' }
        ];
      case 'kiosk':
        return [
          { name: 'Scan QR Code', action: 'POST /api/v1/kiosk/scan', expected: '200' },
          { name: 'Clock In', action: 'POST /api/v1/kiosk/clock-in', expected: '200' },
          { name: 'Clock Out', action: 'POST /api/v1/kiosk/clock-out', expected: '200' }
        ];
      default:
        return baseSteps;
    }
  },

  // Validate workflow step
  validateWorkflowStep: (step: any, response: any) => {
    const expectedStatus = parseInt(step.expected);
    return response.status === expectedStatus;
  },

  // Generate business process test data
  generateBusinessProcessData: (processType: 'onboarding' | 'payroll' | 'leave' | 'attendance') => {
    const timestamp = Date.now();
    switch (processType) {
      case 'onboarding':
        return {
          department: { name: `E2E Dept ${timestamp}`, description: 'E2E test department' },
          employee: { name: `E2E Emp ${timestamp}`, email: `e2e${timestamp}@example.com`, position: 'E2E Position' },
          user: { username: `e2euser${timestamp}`, password: 'E2ETest123!' }
        };
      case 'payroll':
        return {
          period: { name: `E2E Period ${timestamp}`, start_date: '2024-01-01', end_date: '2024-01-31' },
          employee_ids: [1, 2, 3]
        };
      case 'leave':
        return {
          type: 'vacation',
          start_date: '2024-02-01',
          end_date: '2024-02-05',
          reason: 'E2E test leave request'
        };
      case 'attendance':
        return {
          employee_id: 1,
          selfie_image: 'base64-encoded-image-data',
          qr_code: `e2e-qr-${timestamp}`
        };
      default:
        return {};
    }
  }
};

// Extend Jest matchers for E2E tests
expect.extend({
  toBeSuccessfulWorkflow(received: any) {
    const pass = received.status >= 200 && received.status < 300;
    return {
      message: () => `expected ${received.status} to be a successful workflow response (2xx)`,
      pass
    };
  },

  toBeValidWorkflowStep(received: any, expected: any) {
    const pass = received.status === parseInt(expected);
    return {
      message: () => `expected workflow step to return status ${expected}, but got ${received.status}`,
      pass
    };
  },

  toHaveWorkflowData(received: any, expectedProperty: string) {
    const pass = received.data && received.data.hasOwnProperty(expectedProperty);
    return {
      message: () => `expected workflow response to have property ${expectedProperty}`,
      pass
    };
  }
});

// Type declarations for global utilities
declare global {
  var e2eTestUtils: {
    createMockResponse: (status: number, data: any, headers?: any) => any;
    createMockError: (status: number, message: string) => any;
    wait: (ms: number) => Promise<void>;
    generateTestData: (type?: 'user' | 'employee' | 'department' | 'payroll') => any;
    generateWorkflowSteps: (workflowType: 'hr' | 'employee' | 'department-head' | 'kiosk') => any[];
    validateWorkflowStep: (step: any, response: any) => boolean;
    generateBusinessProcessData: (processType: 'onboarding' | 'payroll' | 'leave' | 'attendance') => any;
  };
}
