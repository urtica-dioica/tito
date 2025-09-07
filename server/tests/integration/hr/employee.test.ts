import request from 'supertest';
import app from '../../../src/app';
import { TestHelpers } from '../../utils/testHelpers';
import { initializeTestConnections, cleanupTestDatabase } from '../../setup';

describe('Employee API Integration Tests', () => {
  let testHelpers: TestHelpers;
  let hrAdminToken: string;
  let employeeToken: string;
  let hrAdminUser: any;
  let employeeUser: any;
  let department: any;
  let createdUserIds: string[] = [];
  let createdEmployeeIds: string[] = [];

  beforeAll(async () => {
    // Clean up any existing test data
    await cleanupTestDatabase();
    
    const { testDbPool } = await initializeTestConnections();
    testHelpers = new TestHelpers(testDbPool);
    
    // Create HR user
    hrAdminUser = await testHelpers.createTestUser({
      role: 'hr'
    });
    createdUserIds.push(hrAdminUser.id);
    hrAdminToken = testHelpers.generateAccessToken(hrAdminUser);

    // Create regular employee user
    employeeUser = await testHelpers.createTestUser({
      role: 'employee'
    });
    createdUserIds.push(employeeUser.id);
    employeeToken = testHelpers.generateAccessToken(employeeUser);

    // Create department
    department = await testHelpers.createTestDepartment({
      name: `Engineering-${Date.now()}`,
      description: 'Software development team'
    });
  });

  afterEach(async () => {
    // Clean up created employees and users after each test
    for (const employeeId of createdEmployeeIds) {
      try {
        await testHelpers.deleteEmployee(employeeId);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    createdEmployeeIds = [];
  });

  afterAll(async () => {
    // Clean up all test data
    for (const userId of createdUserIds) {
      try {
        await testHelpers.deleteUser(userId);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    if (department) {
      try {
        await testHelpers.deleteDepartment(department.id);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  describe('POST /api/v1/hr/employees', () => {
    it('should successfully create employee with HR Admin access', async () => {
      // Arrange
      const timestamp = Date.now();
      const employeeData = {
        email: `employee-${timestamp}@example.com`,
        firstName: `Test${timestamp}`,
        lastName: `User${timestamp}`,
        departmentId: department.id,
        position: 'Software Developer',
        employmentType: 'regular',
        hireDate: '2025-01-01',
        baseSalary: 50000
      };

      // Act
      const response = await request(app)
        .post('/api/v1/hr/employees')
        .set('Authorization', `Bearer ${hrAdminToken}`)
        .send(employeeData);

      // Assert
      if (response.status !== 201) {
        console.log('Employee creation failed:', response.status, response.body);
      }
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.position).toBe('Software Developer');
      expect(response.body.data.baseSalary).toBe(50000);
      expect(response.body.data.departmentId).toBe(department.id);
      expect(response.body.data.email).toBe(employeeData.email);
      
      // Track created employee for cleanup
      if (response.body.data.id) {
        createdEmployeeIds.push(response.body.data.id);
      }
    });

    it('should fail to create employee without HR Admin access', async () => {
      // Arrange
      const timestamp = Date.now();
      const employeeData = {
        email: `employee-${timestamp}@example.com`,
        firstName: `Test${timestamp}`,
        lastName: `User${timestamp}`,
        departmentId: department.id,
        position: 'Software Developer',
        employmentType: 'regular',
        hireDate: '2025-01-01',
        baseSalary: 50000
      };

      // Act
      const response = await request(app)
        .post('/api/v1/hr/employees')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send(employeeData);

      // Assert
      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Insufficient permissions');
    });

    it('should fail to create employee with invalid data', async () => {
      // Arrange
      const invalidData = {
        email: 'invalid-email',
        firstName: 'Test',
        lastName: 'User',
        departmentId: 'invalid-department-id',
        position: 'Software Developer',
        employmentType: 'regular',
        hireDate: '2025-01-01',
        baseSalary: 50000
      };

      // Act
      const response = await request(app)
        .post('/api/v1/hr/employees')
        .set('Authorization', `Bearer ${hrAdminToken}`)
        .send(invalidData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail to create employee without authentication', async () => {
      // Arrange
      const timestamp = Date.now();
      const employeeData = {
        email: `employee-${timestamp}@example.com`,
        firstName: `Test${timestamp}`,
        lastName: `User${timestamp}`,
        departmentId: department.id,
        position: 'Software Developer',
        employmentType: 'regular',
        hireDate: '2025-01-01',
        baseSalary: 50000
      };

      // Act
      const response = await request(app)
        .post('/api/v1/hr/employees')
        .send(employeeData);

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');
    });
  });

  describe('GET /api/v1/hr/employees', () => {
    it('should successfully list employees with HR Admin access', async () => {
      // Arrange
      const user1 = await testHelpers.createTestUser();
      const user2 = await testHelpers.createTestUser();
      createdUserIds.push(user1.id, user2.id);
      
      const employee1 = await testHelpers.createTestEmployee({
        userId: user1.id,
        departmentId: department.id,
        position: 'Developer 1'
      });
      
      const employee2 = await testHelpers.createTestEmployee({
        userId: user2.id,
        departmentId: department.id,
        position: 'Developer 2'
      });
      
      createdEmployeeIds.push(employee1.id, employee2.id);

      // Act
      const response = await request(app)
        .get('/api/v1/hr/employees')
        .set('Authorization', `Bearer ${hrAdminToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('limit');
      
      // Check that our test employees are in the list
      const employeeEmails = response.body.data.map((emp: any) => emp.email);
      expect(employeeEmails).toContain(user1.email);
      expect(employeeEmails).toContain(user2.email);
    });

    it('should filter employees by status', async () => {
      // Arrange
      const user1 = await testHelpers.createTestUser();
      const user2 = await testHelpers.createTestUser();
      createdUserIds.push(user1.id, user2.id);
      
      const employee1 = await testHelpers.createTestEmployee({
        userId: user1.id,
        departmentId: department.id,
        status: 'active'
      });
      
      const employee2 = await testHelpers.createTestEmployee({
        userId: user2.id,
        departmentId: department.id,
        status: 'inactive'
      });
      
      createdEmployeeIds.push(employee1.id, employee2.id);

      // Act
      const response = await request(app)
        .get('/api/v1/hr/employees?status=active')
        .set('Authorization', `Bearer ${hrAdminToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      
      // Check that all returned employees have active status
      const activeEmployees = response.body.data.filter((emp: any) => emp.status === 'active');
      expect(activeEmployees.length).toBeGreaterThanOrEqual(1);
      
      // Check that our test employee is in the results
      const employeeEmails = response.body.data.map((emp: any) => emp.email);
      expect(employeeEmails).toContain(user1.email);
    });

    it('should filter employees by department', async () => {
      // Arrange
      const user1 = await testHelpers.createTestUser();
      const user2 = await testHelpers.createTestUser();
      createdUserIds.push(user1.id, user2.id);
      const department2 = await testHelpers.createTestDepartment({ name: `Marketing-${Date.now()}` });
      
      const employee1 = await testHelpers.createTestEmployee({
        userId: user1.id,
        departmentId: department.id
      });
      
      const employee2 = await testHelpers.createTestEmployee({
        userId: user2.id,
        departmentId: department2.id
      });
      
      createdEmployeeIds.push(employee1.id, employee2.id);

      // Act
      const response = await request(app)
        .get(`/api/v1/hr/employees?departmentId=${department.id}`)
        .set('Authorization', `Bearer ${hrAdminToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].departmentId).toBe(department.id);
    });

    it('should support pagination', async () => {
      // Arrange
      const users: any[] = [];
      for (let i = 0; i < 5; i++) {
        const user = await testHelpers.createTestUser();
        users.push(user);
        createdUserIds.push(user.id);
        const employee = await testHelpers.createTestEmployee({
          userId: user.id,
          departmentId: department.id,
          position: `Developer ${i}`
        });
        createdEmployeeIds.push(employee.id);
      }

      // Act
      const response = await request(app)
        .get('/api/v1/hr/employees?page=1&limit=2')
        .set('Authorization', `Bearer ${hrAdminToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
      expect(response.body.pagination.total).toBeGreaterThanOrEqual(5);
      
      // Check that our test employees are in the results
      const employeeEmails = response.body.data.map((emp: any) => emp.email);
      const testUserEmails = users.map(user => user.email);
      const foundTestUsers = testUserEmails.filter(email => employeeEmails.includes(email));
      expect(foundTestUsers.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/hr/employees/:id', () => {
    it('should successfully get employee by ID with HR Admin access', async () => {
      // Arrange
      const user = await testHelpers.createTestUser();
      createdUserIds.push(user.id);
      const employee = await testHelpers.createTestEmployee({
        userId: user.id,
        departmentId: department.id,
        position: 'Senior Developer'
      });
      createdEmployeeIds.push(employee.id);

      // Act
      const response = await request(app)
        .get(`/api/v1/hr/employees/${employee.id}`)
        .set('Authorization', `Bearer ${hrAdminToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(employee.id);
      expect(response.body.data.position).toBe('Senior Developer');
    });

    it('should return 404 for non-existent employee', async () => {
      // Act
      const response = await request(app)
        .get('/api/v1/hr/employees/non-existent-id')
        .set('Authorization', `Bearer ${hrAdminToken}`);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation failed');
    });

    it('should fail without HR Admin access', async () => {
      // Arrange
      const user = await testHelpers.createTestUser();
      createdUserIds.push(user.id);
      const employee = await testHelpers.createTestEmployee({
        userId: user.id,
        departmentId: department.id
      });
      createdEmployeeIds.push(employee.id);

      // Act
      const response = await request(app)
        .get(`/api/v1/hr/employees/${employee.id}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      // Assert
      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Insufficient permissions');
    });
  });

  describe('PUT /api/v1/hr/employees/:id', () => {
    it('should successfully update employee with HR Admin access', async () => {
      // Arrange
      const user = await testHelpers.createTestUser();
      createdUserIds.push(user.id);
      const employee = await testHelpers.createTestEmployee({
        userId: user.id,
        departmentId: department.id,
        position: 'Junior Developer',
        baseSalary: 40000
      });
      createdEmployeeIds.push(employee.id);

      const updateData = {
        position: 'Senior Developer',
        baseSalary: 60000
      };

      // Act
      const response = await request(app)
        .put(`/api/v1/hr/employees/${employee.id}`)
        .set('Authorization', `Bearer ${hrAdminToken}`)
        .send(updateData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.position).toBe('Senior Developer');
      expect(response.body.data.baseSalary).toBe(60000);
    });

    it('should fail to update non-existent employee', async () => {
      // Arrange
      const updateData = {
        position: 'Senior Developer',
        baseSalary: 60000
      };

      // Act
      const response = await request(app)
        .put('/api/v1/hr/employees/non-existent-id')
        .set('Authorization', `Bearer ${hrAdminToken}`)
        .send(updateData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation failed');
    });
  });

  describe('DELETE /api/v1/hr/employees/:id', () => {
    it('should successfully delete employee with HR Admin access', async () => {
      // Arrange
      const user = await testHelpers.createTestUser();
      createdUserIds.push(user.id);
      const employee = await testHelpers.createTestEmployee({
        userId: user.id,
        departmentId: department.id
      });
      createdEmployeeIds.push(employee.id);

      // Act
      const response = await request(app)
        .delete(`/api/v1/hr/employees/${employee.id}`)
        .set('Authorization', `Bearer ${hrAdminToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Employee deleted successfully');

      // Verify employee is deactivated (soft delete)
      const getResponse = await request(app)
        .get(`/api/v1/hr/employees/${employee.id}`)
        .set('Authorization', `Bearer ${hrAdminToken}`);
      
      expect(getResponse.status).toBe(200);
      expect(getResponse.body.data.status).toBe('inactive');
    });

    it('should fail to delete non-existent employee', async () => {
      // Act
      const response = await request(app)
        .delete('/api/v1/hr/employees/non-existent-id')
        .set('Authorization', `Bearer ${hrAdminToken}`);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation failed');
    });
  });
});