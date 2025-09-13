# 🧪 TITO HR Management System - Testing Guide

## 🎯 **Overview**

This guide provides comprehensive information about the testing framework, strategies, and best practices for the TITO HR Management System. It covers unit testing, integration testing, end-to-end testing, and performance testing.

## 📋 **Table of Contents**

- [Testing Framework](#testing-framework)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Unit Testing](#unit-testing)
- [Integration Testing](#integration-testing)
- [End-to-End Testing](#end-to-end-testing)
- [Performance Testing](#performance-testing)
- [Test Utilities](#test-utilities)
- [Best Practices](#best-practices)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

---

## 🛠️ **Testing Framework**

### **Core Technologies**
- **Jest**: JavaScript testing framework
- **Supertest**: HTTP assertion library
- **ts-jest**: TypeScript preprocessor for Jest
- **@types/jest**: TypeScript definitions for Jest

### **Configuration**
```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 10000,
};
```

---

## 📁 **Test Structure**

### **Directory Organization**
```
tests/
├── setup.ts                    # Test setup and configuration
├── utils/                      # Test utilities and helpers
│   ├── testHelpers.ts         # Test helper functions
│   ├── mockData.ts            # Mock data for tests
│   └── testDatabase.ts        # Test database utilities
├── unit/                      # Unit tests
│   ├── controllers/           # Controller unit tests
│   ├── services/              # Service unit tests
│   ├── middleware/            # Middleware unit tests
│   └── utils/                 # Utility function tests
├── integration/               # Integration tests
│   ├── auth/                  # Authentication integration tests
│   ├── hr/                    # HR management integration tests
│   ├── attendance/            # Attendance integration tests
│   └── payroll/               # Payroll integration tests
└── e2e/                      # End-to-end tests
    ├── workflows/             # Complete workflow tests
    ├── api/                   # API endpoint tests
    └── performance/           # Performance tests
```

---

## 🏃 **Running Tests**

### **Basic Commands**
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:e2e

# Run tests for specific file
npm test -- auth.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="login"
```

### **Advanced Commands**
```bash
# Run tests with verbose output
npm test -- --verbose

# Run tests in parallel
npm test -- --maxWorkers=4

# Run tests with specific timeout
npm test -- --testTimeout=30000

# Run tests and update snapshots
npm test -- --updateSnapshot
```

---

## 🔬 **Unit Testing**

### **Controller Testing**
```typescript
// tests/unit/controllers/authController.test.ts
import { Request, Response } from 'express';
import { authController } from '../../../src/controllers/auth/authController';
import { authService } from '../../../src/services/auth/authService';

// Mock the service
jest.mock('../../../src/services/auth/authService');

describe('AuthController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = {
      body: {
        email: 'test@example.com',
        password: 'password123'
      }
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        role: 'employee'
      };
      const mockTokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token'
      };

      (authService.login as jest.Mock).mockResolvedValue({
        user: mockUser,
        ...mockTokens
      });

      await authController.login(mockReq as Request, mockRes as Response, mockNext);

      expect(authService.login).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Login successful',
        data: {
          user: mockUser,
          ...mockTokens
        }
      });
    });

    it('should return error for invalid credentials', async () => {
      (authService.login as jest.Mock).mockRejectedValue(new Error('Invalid credentials'));

      await authController.login(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
```

### **Service Testing**
```typescript
// tests/unit/services/authService.test.ts
import { authService } from '../../../src/services/auth/authService';
import { userModel } from '../../../src/models/auth/User';
import { jwtService } from '../../../src/services/auth/jwtService';
import { passwordService } from '../../../src/services/auth/passwordService';

// Mock dependencies
jest.mock('../../../src/models/auth/User');
jest.mock('../../../src/services/auth/jwtService');
jest.mock('../../../src/services/auth/passwordService');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should return user and tokens for valid credentials', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        password: 'hashed-password',
        role: 'employee'
      };

      (userModel.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (passwordService.compare as jest.Mock).mockResolvedValue(true);
      (jwtService.generateTokens as jest.Mock).mockReturnValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token'
      });

      const result = await authService.login('test@example.com', 'password123');

      expect(userModel.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(passwordService.compare).toHaveBeenCalledWith('password123', 'hashed-password');
      expect(jwtService.generateTokens).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual({
        user: {
          id: '1',
          email: 'test@example.com',
          role: 'employee'
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token'
      });
    });

    it('should throw error for invalid email', async () => {
      (userModel.findByEmail as jest.Mock).mockResolvedValue(null);

      await expect(authService.login('invalid@example.com', 'password123'))
        .rejects.toThrow('Invalid credentials');
    });

    it('should throw error for invalid password', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        password: 'hashed-password',
        role: 'employee'
      };

      (userModel.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (passwordService.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.login('test@example.com', 'wrong-password'))
        .rejects.toThrow('Invalid credentials');
    });
  });
});
```

### **Middleware Testing**
```typescript
// tests/unit/middleware/authenticate.test.ts
import { Request, Response, NextFunction } from 'express';
import { authenticate } from '../../../src/middleware/auth/authenticate';
import { jwtService } from '../../../src/services/auth/jwtService';

jest.mock('../../../src/services/auth/jwtService');

describe('Authenticate Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      headers: {
        authorization: 'Bearer valid-token'
      }
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
  });

  it('should authenticate user with valid token', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      role: 'employee'
    };

    (jwtService.verify as jest.Mock).mockReturnValue(mockUser);

    await authenticate(mockReq as Request, mockRes as Response, mockNext);

    expect(jwtService.verify).toHaveBeenCalledWith('valid-token');
    expect(mockReq.user).toEqual(mockUser);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should return 401 for missing token', async () => {
    mockReq.headers = {};

    await authenticate(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: 'Access token required'
    });
  });

  it('should return 401 for invalid token', async () => {
    (jwtService.verify as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid token');
    });

    await authenticate(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid token'
    });
  });
});
```

---

## 🔗 **Integration Testing**

### **API Endpoint Testing**
```typescript
// tests/integration/auth/auth.test.ts
import request from 'supertest';
import app from '../../../src/app';
import { TestHelpers } from '../../utils/testHelpers';
import { initializeTestConnections, cleanupTestDatabase, cleanupTestRedis } from '../../setup';

describe('Authentication API Integration Tests', () => {
  let testHelpers: TestHelpers;
  let testDbPool: any;

  beforeAll(async () => {
    const { testDbPool: pool } = await initializeTestConnections();
    testDbPool = pool;
    testHelpers = new TestHelpers(testDbPool);
  });

  afterAll(async () => {
    await cleanupTestDatabase();
    await cleanupTestRedis();
  });

  beforeEach(async () => {
    await testHelpers.cleanDatabase();
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login user with valid credentials', async () => {
      // Create test user
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'employee'
      };
      await testHelpers.createUser(userData);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user.email).toBe('test@example.com');
    });

    it('should return error for invalid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'invalid@example.com',
          password: 'wrong-password'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should return error for missing fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com'
          // Missing password
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation error');
    });
  });

  describe('POST /api/v1/auth/refresh-token', () => {
    it('should refresh token with valid refresh token', async () => {
      // Create test user and get tokens
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'employee'
      };
      await testHelpers.createUser(userData);

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      const refreshResponse = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({
          refreshToken: loginResponse.body.data.refreshToken
        });

      expect(refreshResponse.status).toBe(200);
      expect(refreshResponse.body.success).toBe(true);
      expect(refreshResponse.body.data).toHaveProperty('accessToken');
      expect(refreshResponse.body.data).toHaveProperty('refreshToken');
    });
  });
});
```

### **Database Integration Testing**
```typescript
// tests/integration/hr/employee.test.ts
import request from 'supertest';
import app from '../../../src/app';
import { TestHelpers } from '../../utils/testHelpers';
import { initializeTestConnections, cleanupTestDatabase } from '../../setup';

describe('Employee Management Integration Tests', () => {
  let testHelpers: TestHelpers;
  let testDbPool: any;
  let authToken: string;

  beforeAll(async () => {
    const { testDbPool: pool } = await initializeTestConnections();
    testDbPool = pool;
    testHelpers = new TestHelpers(testDbPool);
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  beforeEach(async () => {
    await testHelpers.cleanDatabase();
    
    // Create HR admin user and get auth token
    const hrAdminData = {
      email: 'hr.admin@example.com',
      password: 'admin123',
      firstName: 'HR',
      lastName: 'Admin',
      role: 'hr'
    };
    await testHelpers.createUser(hrAdminData);

    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'hr.admin@example.com',
        password: 'admin123'
      });

    authToken = loginResponse.body.data.accessToken;
  });

  describe('POST /api/v1/hr/employees', () => {
    it('should create employee with valid data', async () => {
      const employeeData = {
        email: 'employee@example.com',
        firstName: 'John',
        lastName: 'Doe',
        departmentId: '1',
        position: 'Software Developer',
        employmentType: 'regular',
        hireDate: '2025-01-01',
        baseSalary: 50000
      };

      const response = await request(app)
        .post('/api/v1/hr/employees')
        .set('Authorization', `Bearer ${authToken}`)
        .send(employeeData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.email).toBe('employee@example.com');
    });

    it('should return error for invalid data', async () => {
      const invalidData = {
        email: 'invalid-email',
        firstName: 'John',
        lastName: 'Doe'
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/v1/hr/employees')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation error');
    });
  });
});
```

---

## 🌐 **End-to-End Testing**

### **Complete Workflow Testing**
```typescript
// tests/e2e/workflows/employee-lifecycle.test.ts
import request from 'supertest';
import app from '../../../src/app';
import { TestHelpers } from '../../utils/testHelpers';
import { initializeTestConnections, cleanupTestDatabase } from '../../setup';

describe('Employee Lifecycle E2E Tests', () => {
  let testHelpers: TestHelpers;
  let testDbPool: any;
  let hrAdminToken: string;
  let employeeToken: string;
  let employeeId: string;

  beforeAll(async () => {
    const { testDbPool: pool } = await initializeTestConnections();
    testDbPool = pool;
    testHelpers = new TestHelpers(testDbPool);
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  beforeEach(async () => {
    await testHelpers.cleanDatabase();
    
    // Setup HR admin
    const hrAdminData = {
      email: 'hr.admin@example.com',
      password: 'admin123',
      firstName: 'HR',
      lastName: 'Admin',
      role: 'hr'
    };
    await testHelpers.createUser(hrAdminData);

    const hrLoginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'hr.admin@example.com',
        password: 'admin123'
      });

    hrAdminToken = hrLoginResponse.body.data.accessToken;
  });

  it('should complete full employee lifecycle', async () => {
    // 1. Create employee
    const employeeData = {
      email: 'employee@example.com',
      firstName: 'John',
      lastName: 'Doe',
      departmentId: '1',
      position: 'Software Developer',
      employmentType: 'regular',
      hireDate: '2025-01-01',
      baseSalary: 50000
    };

    const createResponse = await request(app)
      .post('/api/v1/hr/employees')
      .set('Authorization', `Bearer ${hrAdminToken}`)
      .send(employeeData);

    expect(createResponse.status).toBe(201);
    employeeId = createResponse.body.data.id;

    // 2. Employee login
    const employeeLoginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'employee@example.com',
        password: 'password123'
      });

    expect(employeeLoginResponse.status).toBe(200);
    employeeToken = employeeLoginResponse.body.data.accessToken;

    // 3. Clock in
    const clockInResponse = await request(app)
      .post('/api/v1/attendance/clock-in')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        qrCodeHash: 'test-qr-hash',
        timestamp: new Date().toISOString()
      });

    expect(clockInResponse.status).toBe(200);

    // 4. Clock out
    const clockOutResponse = await request(app)
      .post('/api/v1/attendance/clock-out')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        qrCodeHash: 'test-qr-hash',
        timestamp: new Date().toISOString()
      });

    expect(clockOutResponse.status).toBe(200);

    // 5. Submit leave request
    const leaveRequestResponse = await request(app)
      .post('/api/v1/leaves')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        leaveType: 'vacation',
        startDate: '2025-12-01',
        endDate: '2025-12-05',
        totalDays: 5,
        reason: 'Family vacation'
      });

    expect(leaveRequestResponse.status).toBe(201);

    // 6. HR admin approve leave request
    const approveLeaveResponse = await request(app)
      .post(`/api/v1/leaves/${leaveRequestResponse.body.data.id}/approve`)
      .set('Authorization', `Bearer ${hrAdminToken}`)
      .send({
        comments: 'Approved by HR'
      });

    expect(approveLeaveResponse.status).toBe(200);

    // 7. Generate payroll
    const payrollPeriodResponse = await request(app)
      .post('/api/v1/payroll/periods')
      .set('Authorization', `Bearer ${hrAdminToken}`)
      .send({
        periodName: 'December 2025',
        startDate: '2025-12-01',
        endDate: '2025-12-31',
        status: 'draft'
      });

    expect(payrollPeriodResponse.status).toBe(201);

    const generatePayrollResponse = await request(app)
      .post(`/api/v1/payroll/periods/${payrollPeriodResponse.body.data.id}/generate`)
      .set('Authorization', `Bearer ${hrAdminToken}`);

    expect(generatePayrollResponse.status).toBe(200);

    // 8. Verify employee can view their payroll
    const employeePayrollResponse = await request(app)
      .get('/api/v1/employee/payrolls')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(employeePayrollResponse.status).toBe(200);
    expect(employeePayrollResponse.body.data.length).toBeGreaterThan(0);
  });
});
```

---

## ⚡ **Performance Testing**

### **Load Testing**
```typescript
// tests/e2e/performance/load.test.ts
import request from 'supertest';
import app from '../../../src/app';

describe('Performance Tests', () => {
  describe('Authentication Endpoint Load Test', () => {
    it('should handle multiple concurrent login requests', async () => {
      const concurrentRequests = 100;
      const promises = [];

      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          request(app)
            .post('/api/v1/auth/login')
            .send({
              email: 'test@example.com',
              password: 'password123'
            })
        );
      }

      const startTime = Date.now();
      const responses = await Promise.all(promises);
      const endTime = Date.now();

      const responseTime = endTime - startTime;
      const averageResponseTime = responseTime / concurrentRequests;

      // Check that all requests completed
      expect(responses).toHaveLength(concurrentRequests);
      
      // Check response times
      expect(averageResponseTime).toBeLessThan(1000); // Less than 1 second average
      
      // Check that no requests failed
      const failedRequests = responses.filter(r => r.status >= 400);
      expect(failedRequests).toHaveLength(0);
    });
  });

  describe('Database Query Performance', () => {
    it('should retrieve employee list within acceptable time', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/v1/hr/employees?page=1&limit=100')
        .set('Authorization', `Bearer ${authToken}`);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(500); // Less than 500ms
    });
  });
});
```

---

## 🛠️ **Test Utilities**

### **Test Helpers**
```typescript
// tests/utils/testHelpers.ts
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

export class TestHelpers {
  private dbPool: Pool;

  constructor(dbPool: Pool) {
    this.dbPool = dbPool;
  }

  async cleanDatabase(): Promise<void> {
    const tables = [
      'payroll_approvals',
      'payroll_deductions',
      'payroll_records',
      'payroll_periods',
      'leaves',
      'leave_balances',
      'overtime_requests',
      'time_correction_requests',
      'attendance_sessions',
      'attendance_records',
      'id_cards',
      'employees',
      'departments',
      'system_settings',
      'users'
    ];

    for (const table of tables) {
      await this.dbPool.query(`DELETE FROM ${table}`);
    }
  }

  async createUser(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
  }): Promise<any> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const result = await this.dbPool.query(
      'INSERT INTO users (email, password, first_name, last_name, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userData.email, hashedPassword, userData.firstName, userData.lastName, userData.role]
    );

    return result.rows[0];
  }

  async createEmployee(employeeData: {
    userId: string;
    departmentId: string;
    position: string;
    employmentType: string;
    hireDate: string;
    baseSalary: number;
  }): Promise<any> {
    const result = await this.dbPool.query(
      'INSERT INTO employees (user_id, department_id, position, employment_type, hire_date, base_salary) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [employeeData.userId, employeeData.departmentId, employeeData.position, employeeData.employmentType, employeeData.hireDate, employeeData.baseSalary]
    );

    return result.rows[0];
  }

  async createDepartment(departmentData: {
    name: string;
    description: string;
    departmentHeadUserId?: string;
  }): Promise<any> {
    const result = await this.dbPool.query(
      'INSERT INTO departments (name, description, department_head_user_id) VALUES ($1, $2, $3) RETURNING *',
      [departmentData.name, departmentData.description, departmentData.departmentHeadUserId]
    );

    return result.rows[0];
  }

  async getAuthToken(email: string, password: string): Promise<string> {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password });

    return response.body.data.accessToken;
  }
}
```

### **Mock Data**
```typescript
// tests/utils/mockData.ts
export const mockUsers = {
  hrAdmin: {
    email: 'hr.admin@example.com',
    password: 'admin123',
    firstName: 'HR',
    lastName: 'Admin',
    role: 'hr'
  },
  employee: {
    email: 'employee@example.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Doe',
    role: 'employee'
  },
  departmentHead: {
    email: 'dept.head@example.com',
    password: 'head123',
    firstName: 'Jane',
    lastName: 'Smith',
    role: 'department_head'
  }
};

export const mockEmployees = {
  softwareDeveloper: {
    position: 'Software Developer',
    employmentType: 'regular',
    hireDate: '2025-01-01',
    baseSalary: 50000
  },
  seniorDeveloper: {
    position: 'Senior Software Developer',
    employmentType: 'regular',
    hireDate: '2024-01-01',
    baseSalary: 75000
  }
};

export const mockDepartments = {
  engineering: {
    name: 'Engineering',
    description: 'Software development team'
  },
  hr: {
    name: 'Human Resources',
    description: 'HR management team'
  }
};
```

---

## 📋 **Best Practices**

### **Test Organization**
1. **Arrange-Act-Assert**: Structure tests with clear setup, execution, and verification
2. **Single Responsibility**: Each test should verify one specific behavior
3. **Descriptive Names**: Use clear, descriptive test names
4. **Independent Tests**: Tests should not depend on each other

### **Mocking Strategy**
1. **Mock External Dependencies**: Database, external APIs, file system
2. **Use Real Objects When Possible**: For simple data structures
3. **Verify Interactions**: Check that mocked methods are called correctly
4. **Reset Mocks**: Clear mocks between tests

### **Data Management**
1. **Clean State**: Start each test with a clean database
2. **Test Data**: Use realistic test data
3. **Isolation**: Tests should not affect each other
4. **Teardown**: Clean up after tests complete

### **Error Testing**
1. **Test Error Cases**: Verify error handling works correctly
2. **Edge Cases**: Test boundary conditions
3. **Validation Errors**: Test input validation
4. **Network Errors**: Test network failure scenarios

---

## 🔄 **CI/CD Integration**

### **GitHub Actions**
```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: tito_hr_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:6
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run linting
      run: npm run lint

    - name: Run type checking
      run: npm run type-check

    - name: Run tests
      run: npm test
      env:
        NODE_ENV: test
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/tito_hr_test
        REDIS_URL: redis://localhost:6379

    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
```

---

## 🔧 **Troubleshooting**

### **Common Issues**

#### **1. Database Connection Issues**
```bash
# Error: Database connection failed
# Solution: Check PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL if not running
sudo systemctl start postgresql

# Check database exists
psql -h localhost -U tito_user -d tito_hr_test -c "\l"
```

#### **2. Redis Connection Issues**
```bash
# Error: Redis connection failed
# Solution: Check Redis is running
sudo systemctl status redis-server

# Start Redis if not running
sudo systemctl start redis-server

# Test Redis connection
redis-cli ping
```

#### **3. Test Timeout Issues**
```bash
# Error: Test timeout
# Solution: Increase timeout in jest.config.js
module.exports = {
  testTimeout: 30000, // 30 seconds
  // ... other config
};
```

#### **4. Memory Issues**
```bash
# Error: JavaScript heap out of memory
# Solution: Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm test
```

### **Debug Mode**
```bash
# Run tests with debug output
DEBUG=* npm test

# Run specific test with debug
DEBUG=* npm test -- auth.test.ts

# Run tests with verbose output
npm test -- --verbose
```

---

## 📞 **Support**

### **Documentation**
- Check the [API Reference](../api/api-reference.md)
- Review the [Development Setup](development-setup.md)
- Read the [Contribution Guidelines](contribution-guidelines.md)

### **Common Commands**
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- auth.test.ts

# Run tests in watch mode
npm run test:watch

# Debug tests
DEBUG=* npm test
```

### **Getting Help**
- Create an issue in the repository
- Check existing issues for solutions
- Contact the development team

---

**Last Updated**: September 4, 2025  
**Version**: 1.0.0  
**Testing Framework**: Jest + Supertest + ts-jest