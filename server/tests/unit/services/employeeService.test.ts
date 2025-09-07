import { EmployeeService } from '../../../src/services/hr/employeeService';
import { TestHelpers } from '../../utils/testHelpers';
import { initializeTestConnections } from '../../setup';

describe('EmployeeService', () => {
  let employeeService: EmployeeService;
  let testHelpers: TestHelpers;

  beforeAll(async () => {
    const { testDbPool } = await initializeTestConnections();
    employeeService = new EmployeeService();
    testHelpers = new TestHelpers(testDbPool);
  });

  afterEach(async () => {
    // Clean up test data after each test
    await testHelpers.cleanupTestData();
  });

  describe('createEmployee', () => {
    it('should successfully create an employee', async () => {
      // Arrange
      const department = await testHelpers.createTestDepartment();
      
      const timestamp = Date.now();
      const employeeData = {
        email: `employee-${timestamp}@example.com`,
        firstName: 'John',
        lastName: 'Doe',
        departmentId: department.id,
        position: 'Software Developer',
        employmentType: 'regular' as const,
        hireDate: new Date('2025-01-01'),
        baseSalary: 50000
      };

      // Act
      const result = await employeeService.createEmployee(employeeData);

      // Assert
      expect(result).toHaveProperty('id');
      expect(result.position).toBe('Software Developer');
      expect(result.baseSalary).toBe(50000);
      expect(result.departmentId).toBe(department.id);
    });

    it('should fail to create employee with invalid department ID', async () => {
      // Arrange
      const timestamp = Date.now();
      const employeeData = {
        email: `employee-${timestamp}@example.com`,
        firstName: 'John',
        lastName: 'Doe',
        departmentId: '00000000-0000-0000-0000-000000000000',
        position: 'Software Developer',
        employmentType: 'regular' as const,
        hireDate: new Date('2025-01-01'),
        baseSalary: 50000
      };

      // Act & Assert
      await expect(employeeService.createEmployee(employeeData)).rejects.toThrow('Department not found');
    });

    it('should fail to create employee with duplicate email', async () => {
      // Arrange
      const department = await testHelpers.createTestDepartment();
      const duplicateEmail = `duplicate-${Date.now()}@example.com`;
      
      // Create first employee
      const employeeData1 = {
        email: duplicateEmail,
        firstName: 'John',
        lastName: 'Doe',
        departmentId: department.id,
        position: 'Software Developer',
        employmentType: 'regular' as const,
        hireDate: new Date('2025-01-01'),
        baseSalary: 50000
      };
      
      await employeeService.createEmployee(employeeData1);
      
      // Try to create second employee with same email
      const employeeData2 = {
        email: duplicateEmail,
        firstName: 'Jane',
        lastName: 'Smith',
        departmentId: department.id,
        position: 'Software Developer',
        employmentType: 'regular' as const,
        hireDate: new Date('2025-01-01'),
        baseSalary: 50000
      };

      // Act & Assert
      await expect(employeeService.createEmployee(employeeData2)).rejects.toThrow('Email already exists');
    });

    it('should fail to create employee with duplicate email', async () => {
      // Arrange
      const department = await testHelpers.createTestDepartment();
      const duplicateEmail = `duplicate-${Date.now()}@example.com`;
      
      // Create first employee
      await employeeService.createEmployee({
        email: duplicateEmail,
        firstName: 'John',
        lastName: 'Doe',
        departmentId: department.id,
        position: 'Software Developer',
        employmentType: 'regular' as const,
        hireDate: new Date('2025-01-01'),
        baseSalary: 50000
      });

      // Try to create second employee with same email
      const employeeData = {
        email: duplicateEmail,
        firstName: 'Jane',
        lastName: 'Smith',
        departmentId: department.id,
        position: 'Senior Developer',
        employmentType: 'regular' as const,
        hireDate: new Date('2025-01-01'),
        baseSalary: 60000
      };

      // Act & Assert
      await expect(employeeService.createEmployee(employeeData)).rejects.toThrow('Email already exists');
    });
  });

  describe('getEmployeeById', () => {
    it('should successfully get employee by ID', async () => {
      // Arrange
      const user = await testHelpers.createTestUser();
      const department = await testHelpers.createTestDepartment();
      const employee = await testHelpers.createTestEmployee({
        userId: user.id,
        departmentId: department.id
      });

      // Act
      const result = await employeeService.getEmployeeWithUser(employee.id);

      // Assert
      expect(result.id).toBe(employee.id);
      expect(result.userId).toBe(user.id);
      expect(result.departmentId).toBe(department.id);
    });

    it('should return error for non-existent employee', async () => {
      // Act & Assert
      await expect(employeeService.getEmployeeWithUser('00000000-0000-0000-0000-000000000000')).rejects.toThrow('Employee not found');
    });
  });

  describe('updateEmployee', () => {
    it('should successfully update employee', async () => {
      // Arrange
      const user = await testHelpers.createTestUser();
      const department = await testHelpers.createTestDepartment();
      const employee = await testHelpers.createTestEmployee({
        userId: user.id,
        departmentId: department.id,
        position: 'Software Developer',
        baseSalary: 50000
      });

      const updateData = {
        position: 'Senior Software Developer',
        baseSalary: 60000
      };

      // Act
      const result = await employeeService.updateEmployee(employee.id, updateData);

      // Assert
      expect(result.position).toBe('Senior Software Developer');
      expect(result.baseSalary).toBe(60000);
    });

    it('should return error for non-existent employee', async () => {
      // Arrange
      const updateData = {
        position: 'Senior Software Developer',
        baseSalary: 60000
      };

      // Act & Assert
      await expect(employeeService.updateEmployee('00000000-0000-0000-0000-000000000000', updateData)).rejects.toThrow('Employee not found');
    });
  });

  describe('deleteEmployee', () => {
    it('should successfully delete employee', async () => {
      // Arrange
      const user = await testHelpers.createTestUser();
      const department = await testHelpers.createTestDepartment();
      const employee = await testHelpers.createTestEmployee({
        userId: user.id,
        departmentId: department.id
      });

      // Act
      await employeeService.deleteEmployee(employee.id);

      // Verify employee is deactivated (soft delete)
      const deletedEmployee = await employeeService.getEmployeeWithUser(employee.id);
      expect(deletedEmployee.status).toBe('inactive');
      expect(deletedEmployee.isActive).toBe(false);
    });

    it('should return error for non-existent employee', async () => {
      // Act & Assert
      await expect(employeeService.deleteEmployee('00000000-0000-0000-0000-000000000000')).rejects.toThrow('Employee not found');
    });
  });

  describe('listEmployees', () => {
    it('should successfully list employees with pagination', async () => {
      // Arrange
      const user1 = await testHelpers.createTestUser();
      const user2 = await testHelpers.createTestUser();
      const department = await testHelpers.createTestDepartment();
      
      await testHelpers.createTestEmployee({
        userId: user1.id,
        departmentId: department.id,
        position: 'Developer 1'
      });
      
      await testHelpers.createTestEmployee({
        userId: user2.id,
        departmentId: department.id,
        position: 'Developer 2'
      });

      // Act
      const result = await employeeService.listEmployees({
        page: 1,
        limit: 10
      });

      // Assert
      expect(result.employees).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should filter employees by status', async () => {
      // Arrange
      const user1 = await testHelpers.createTestUser();
      const user2 = await testHelpers.createTestUser();
      const department = await testHelpers.createTestDepartment();
      
      await testHelpers.createTestEmployee({
        userId: user1.id,
        departmentId: department.id,
        status: 'active'
      });
      
      await testHelpers.createTestEmployee({
        userId: user2.id,
        departmentId: department.id,
        status: 'inactive'
      });

      // Act
      const result = await employeeService.listEmployees({
        status: 'active',
        page: 1,
        limit: 10
      });

      // Assert
      expect(result.employees).toHaveLength(1);
      expect(result.employees[0].status).toBe('active');
    });

    it('should filter employees by department', async () => {
      // Arrange
      const user1 = await testHelpers.createTestUser();
      const user2 = await testHelpers.createTestUser();
      const department1 = await testHelpers.createTestDepartment();
      const department2 = await testHelpers.createTestDepartment();
      
      await testHelpers.createTestEmployee({
        userId: user1.id,
        departmentId: department1.id
      });
      
      await testHelpers.createTestEmployee({
        userId: user2.id,
        departmentId: department2.id
      });

      // Act
      const result = await employeeService.listEmployees({
        departmentId: department1.id,
        page: 1,
        limit: 10
      });

      // Assert
      expect(result.employees).toHaveLength(1);
      expect(result.employees[0].departmentId).toBe(department1.id);
    });
  });
});