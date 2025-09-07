import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from '../../src/config/environment';

export interface TestUser {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
}

export interface TestDepartment {
  id: string;
  name: string;
  description: string;
  departmentHeadUserId?: string;
  isActive: boolean;
}

export interface TestEmployee {
  id: string;
  userId: string;
  employeeId: string;
  departmentId: string;
  position: string;
  employmentType: string;
  hireDate: string;
  baseSalary: number;
  status: string;
}

export class TestHelpers {
  constructor(private dbPool: Pool) {}

  // User management
  async createTestUser(userData: Partial<TestUser> = {}): Promise<TestUser> {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const defaultUser: TestUser = {
      id: '',
      email: `test-${timestamp}-${randomId}@example.com`,
      password: 'password123',
      firstName: `Test${timestamp}`,
      lastName: `User${randomId}`,
      role: 'employee',
      isActive: true,
      ...userData
    };

    const hashedPassword = await bcrypt.hash(defaultUser.password, 10);
    
    const query = `
      INSERT INTO users (email, password_hash, first_name, last_name, role, is_active)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email, first_name, last_name, role, is_active
    `;
    
    const values = [
      defaultUser.email,
      hashedPassword,
      defaultUser.firstName,
      defaultUser.lastName,
      defaultUser.role,
      defaultUser.isActive
    ];

    const result = await this.dbPool.query(query, values);
    const user = result.rows[0];
    
    return {
      id: user.id,
      email: user.email,
      password: defaultUser.password, // Return plain password for testing
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      isActive: user.is_active
    };
  }

  async createTestDepartment(departmentData: Partial<TestDepartment> = {}): Promise<TestDepartment> {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const defaultDepartment: TestDepartment = {
      id: '',
      name: `Test Department ${timestamp}-${randomId}`,
      description: `Test department description ${timestamp}`,
      isActive: true,
      ...departmentData
    };

    const query = `
      INSERT INTO departments (name, description, department_head_user_id, is_active)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, description, department_head_user_id, is_active
    `;
    
    const values = [
      defaultDepartment.name,
      defaultDepartment.description,
      defaultDepartment.departmentHeadUserId || null,
      defaultDepartment.isActive
    ];

    const result = await this.dbPool.query(query, values);
    const department = result.rows[0];
    
    return {
      id: department.id,
      name: department.name,
      description: department.description,
      departmentHeadUserId: department.department_head_user_id,
      isActive: department.is_active
    };
  }

  async createTestEmployee(employeeData: Partial<TestEmployee> = {}): Promise<TestEmployee> {
    // Create user if not provided
    const user = await this.createTestUser(employeeData.userId ? { id: employeeData.userId } : {});
    
    // Create department if not provided
    const department = await this.createTestDepartment(employeeData.departmentId ? { id: employeeData.departmentId } : {});

    const defaultEmployee: TestEmployee = {
      id: '',
      userId: user.id,
      employeeId: 'EMP001',
      departmentId: department.id,
      position: 'Software Developer',
      employmentType: 'regular',
      hireDate: '2025-01-01',
      baseSalary: 50000,
      status: 'active',
      ...employeeData
    };

    const query = `
      INSERT INTO employees (user_id, employee_id, department_id, position, employment_type, hire_date, base_salary, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, user_id, employee_id, department_id, position, employment_type, hire_date, base_salary, status
    `;
    
    const values = [
      defaultEmployee.userId,
      defaultEmployee.employeeId,
      defaultEmployee.departmentId,
      defaultEmployee.position,
      defaultEmployee.employmentType,
      defaultEmployee.hireDate,
      defaultEmployee.baseSalary,
      defaultEmployee.status
    ];

    const result = await this.dbPool.query(query, values);
    const employee = result.rows[0];
    
    return {
      id: employee.id,
      userId: employee.user_id,
      employeeId: employee.employee_id,
      departmentId: employee.department_id,
      position: employee.position,
      employmentType: employee.employment_type,
      hireDate: employee.hire_date,
      baseSalary: employee.base_salary,
      status: employee.status
    };
  }

  // JWT token generation
  generateAccessToken(user: TestUser): string {
    return jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        tokenVersion: 1
      },
      config.jwt.secret,
      { 
        expiresIn: '15m',
        issuer: 'tito-hr-system',
        audience: 'tito-hr-users'
      }
    );
  }

  generateRefreshToken(user: TestUser): string {
    return jwt.sign(
      { 
        userId: user.id, 
        tokenVersion: 1
      },
      config.jwt.secret,
      { 
        expiresIn: '7d',
        issuer: 'tito-hr-system',
        audience: 'tito-hr-refresh'
      }
    );
  }

  // Database queries
  async getUserById(id: string): Promise<any> {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await this.dbPool.query(query, [id]);
    return result.rows[0];
  }

  async getDepartmentById(id: string): Promise<any> {
    const query = 'SELECT * FROM departments WHERE id = $1';
    const result = await this.dbPool.query(query, [id]);
    return result.rows[0];
  }

  async getEmployeeById(id: string): Promise<any> {
    const query = 'SELECT * FROM employees WHERE id = $1';
    const result = await this.dbPool.query(query, [id]);
    return result.rows[0];
  }

  // Cleanup helpers
  async deleteUser(id: string): Promise<void> {
    await this.dbPool.query('DELETE FROM users WHERE id = $1', [id]);
  }

  async deleteDepartment(id: string): Promise<void> {
    await this.dbPool.query('DELETE FROM departments WHERE id = $1', [id]);
  }

  async deleteEmployee(id: string): Promise<void> {
    await this.dbPool.query('DELETE FROM employees WHERE id = $1', [id]);
  }

  async cleanupTestData(): Promise<void> {
    // Clean up all test data in the correct order (respecting foreign key constraints)
    await this.dbPool.query('DELETE FROM employees');
    await this.dbPool.query('DELETE FROM users');
    await this.dbPool.query('DELETE FROM departments');
  }
}