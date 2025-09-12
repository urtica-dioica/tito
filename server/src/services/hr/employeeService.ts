import { getPool } from '../../config/database';
import { UserModel } from '../../models/auth/User';
import { EmployeeModel } from '../../models/hr/Employee';
import { DepartmentModel } from '../../models/hr/Department';
import { emailService } from '../email/emailService';
import { redisService } from '../redis/redisService';
import logger from '../../utils/logger';

export interface CreateEmployeeData {
  email: string;
  firstName: string;
  lastName: string;
  departmentId: string;
  position: string;
  employmentType: 'regular' | 'contractual' | 'jo';
  hireDate: Date;
  baseSalary: number;
  password?: string;
}

export interface UpdateEmployeeData {
  firstName?: string;
  lastName?: string;
  departmentId?: string;
  position?: string;
  employmentType?: 'regular' | 'contractual' | 'jo';
  hireDate?: string;
  baseSalary?: number;
  status?: 'active' | 'inactive' | 'terminated' | 'on_leave';
}

export interface EmployeeWithUser {
  id: string;
  userId: string;
  employeeId: string;
  email: string;
  firstName: string;
  lastName: string;
  departmentId: string | null;
  departmentName: string | null;
  position: string;
  employmentType: string;
  hireDate: Date;
  baseSalary: number;
  status: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmployeeListParams {
  page?: number | undefined;
  limit?: number | undefined;
  search?: string | undefined;
  departmentId?: string | undefined;
  status?: string | undefined;
  employmentType?: string | undefined;
  sortBy?: string | undefined;
  sortOrder?: 'asc' | 'desc' | undefined;
}

export class EmployeeService {
  private userModel: UserModel;
  private employeeModel: EmployeeModel;
  private departmentModel: DepartmentModel;
  constructor() {
    this.userModel = new UserModel();
    this.employeeModel = new EmployeeModel();
    this.departmentModel = new DepartmentModel();
  }

  /**
   * Create a new employee with user account
   */
  async createEmployee(data: CreateEmployeeData): Promise<EmployeeWithUser> {
    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check if email already exists
      const existingUser = await this.userModel.findByEmail(data.email);
      if (existingUser) {
        throw new Error('Email already exists');
      }

      // Verify department exists
      const department = await this.departmentModel.findById(data.departmentId);
      if (!department) {
        throw new Error('Department not found');
      }

      // Create user account
      const userData = {
        email: data.email,
        password: data.password || this.generateTemporaryPassword(),
        first_name: data.firstName,
        last_name: data.lastName,
        role: 'employee' as const
      };

      const user = await this.userModel.createUser(userData);

      // Create employee record
      const employeeData = {
        user_id: user.id,
        department_id: data.departmentId,
        position: data.position,
        employment_type: data.employmentType,
        hire_date: data.hireDate,
        base_salary: data.baseSalary
      };

      const employee = await this.employeeModel.createEmployee(employeeData);

      // Generate password setup token
      const setupToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const setupTokenKey = `setup_token:${setupToken}`;
      
      // Store setup token in cache with user ID as value (expires in 24 hours)
      await redisService.setCache(setupTokenKey, user.id, 24 * 60 * 60);

      await client.query('COMMIT');

      // Send password setup email
      const emailSent = await emailService.sendEmployeePasswordSetupEmail(
        data.email,
        data.firstName,
        data.lastName,
        employee.employee_id,
        setupToken
      );

      if (!emailSent) {
        logger.warn('Failed to send password setup email', {
          employeeId: employee.id,
          email: data.email
        });
      }

      // Get complete employee data with user info
      const completeEmployee = await this.getEmployeeWithUser(employee.id);

      logger.info(`Employee created successfully: ${employee.employee_id}`, {
        employeeId: employee.id,
        userId: user.id,
        email: data.email,
        emailSent
      });

      return completeEmployee;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to create employee', { error: (error as Error).message, data });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get employee with user information using a specific client
   */
  private async getEmployeeWithUserWithClient(client: any, employeeId: string): Promise<EmployeeWithUser> {
    const query = `
      SELECT 
        e.id,
        e.user_id as "userId",
        e.employee_id as "employeeId",
        u.email,
        u.first_name as "firstName",
        u.last_name as "lastName",
        e.department_id as "departmentId",
        d.name as "departmentName",
        e.position,
        e.employment_type as "employmentType",
        e.hire_date as "hireDate",
        e.base_salary as "baseSalary",
        e.status,
        u.is_active as "isActive",
        e.created_at as "createdAt",
        e.updated_at as "updatedAt"
      FROM employees e
      JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE e.id = $1
    `;

    const result = await client.query(query, [employeeId]);
    
    if (result.rows.length === 0) {
      throw new Error('Employee not found');
    }

    const employee = result.rows[0];
    // Convert numeric fields to numbers
    employee.baseSalary = parseFloat(employee.baseSalary);
    
    return employee;
  }

  /**
   * Get employee with user information
   */
  async getEmployeeWithUser(employeeId: string): Promise<EmployeeWithUser> {
    const query = `
      SELECT 
        e.id,
        e.user_id as "userId",
        e.employee_id as "employeeId",
        u.email,
        u.first_name as "firstName",
        u.last_name as "lastName",
        e.department_id as "departmentId",
        d.name as "departmentName",
        e.position,
        e.employment_type as "employmentType",
        e.hire_date as "hireDate",
        e.base_salary as "baseSalary",
        e.status,
        u.is_active as "isActive",
        e.created_at as "createdAt",
        e.updated_at as "updatedAt"
      FROM employees e
      JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE e.id = $1
    `;

    const result = await getPool().query(query, [employeeId]);
    
    if (result.rows.length === 0) {
      throw new Error('Employee not found');
    }

    const employee = result.rows[0];
    // Convert numeric fields to numbers
    employee.baseSalary = parseFloat(employee.baseSalary);
    
    return employee;
  }

  /**
   * List employees with filtering and pagination
   */
  async listEmployees(params: EmployeeListParams = {}): Promise<{
    employees: EmployeeWithUser[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 20,
      search,
      departmentId,
      status,
      employmentType,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = params;

    const offset = (page - 1) * limit;

    // Build WHERE clause
    const whereConditions: string[] = [];
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (search) {
      whereConditions.push(`(
        u.first_name ILIKE $${paramIndex} OR 
        u.last_name ILIKE $${paramIndex} OR 
        u.email ILIKE $${paramIndex} OR 
        e.employee_id ILIKE $${paramIndex} OR 
        e.position ILIKE $${paramIndex}
      )`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (departmentId) {
      whereConditions.push(`e.department_id = $${paramIndex}`);
      queryParams.push(departmentId);
      paramIndex++;
    }

    if (status) {
      whereConditions.push(`e.status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    if (employmentType) {
      whereConditions.push(`e.employment_type = $${paramIndex}`);
      queryParams.push(employmentType);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Count query
    const countQuery = `
      SELECT COUNT(*) as total
      FROM employees e
      JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
      ${whereClause}
    `;

    const countResult = await getPool().query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Data query
    const dataQuery = `
      SELECT 
        e.id,
        e.user_id as "userId",
        e.employee_id as "employeeId",
        u.email,
        u.first_name as "firstName",
        u.last_name as "lastName",
        e.department_id as "departmentId",
        d.name as "departmentName",
        e.position,
        e.employment_type as "employmentType",
        e.hire_date as "hireDate",
        e.base_salary as "baseSalary",
        e.status,
        u.is_active as "isActive",
        e.created_at as "createdAt",
        e.updated_at as "updatedAt"
      FROM employees e
      JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
      ${whereClause}
      ORDER BY e.${sortBy} ${sortOrder.toUpperCase()}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);
    const result = await getPool().query(dataQuery, queryParams);

    // Convert numeric fields to numbers for each employee
    const employees = result.rows.map(employee => ({
      ...employee,
      baseSalary: parseFloat(employee.baseSalary)
    }));

    return {
      employees,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Update employee information
   */
  async updateEmployee(employeeId: string, data: UpdateEmployeeData): Promise<EmployeeWithUser> {
    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get current employee
      const currentEmployee = await this.getEmployeeWithUser(employeeId);
      if (!currentEmployee) {
        throw new Error('Employee not found');
      }

      // Update user information if provided
      if (data.firstName || data.lastName) {
        const userUpdateData: any = {};
        if (data.firstName) userUpdateData.first_name = data.firstName;
        if (data.lastName) userUpdateData.last_name = data.lastName;

        await this.userModel.updateUser(currentEmployee.userId, userUpdateData);
      }

      // Update employee information
      const employeeUpdateData: any = {};
      if (data.departmentId) {
        // Verify department exists
        const department = await this.departmentModel.findById(data.departmentId);
        if (!department) {
          throw new Error('Department not found');
        }
        employeeUpdateData.department_id = data.departmentId;
      }
      if (data.position) employeeUpdateData.position = data.position;
      if (data.employmentType) employeeUpdateData.employment_type = data.employmentType;
      if (data.hireDate) employeeUpdateData.hire_date = data.hireDate;
      if (data.baseSalary !== undefined) employeeUpdateData.base_salary = data.baseSalary;
      if (data.status) employeeUpdateData.status = data.status;

      if (Object.keys(employeeUpdateData).length > 0) {
        await this.employeeModel.updateEmployee(employeeId, employeeUpdateData);
      }

      await client.query('COMMIT');

      // Get updated employee data using the same client to ensure we see the committed changes
      const updatedEmployee = await this.getEmployeeWithUserWithClient(client, employeeId);

      logger.info(`Employee updated successfully: ${currentEmployee.employeeId}`, {
        employeeId,
        updates: { ...data }
      });

      return updatedEmployee;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to update employee', { error: (error as Error).message, employeeId, data });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Delete employee (soft delete by deactivating user)
   */
  async deleteEmployee(employeeId: string): Promise<void> {
    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get employee
      const employee = await this.getEmployeeWithUser(employeeId);
      if (!employee) {
        throw new Error('Employee not found');
      }

      // Deactivate user account
      await this.userModel.updateUser(employee.userId, { is_active: false });

      // Update employee status to inactive
      await this.employeeModel.updateEmployee(employeeId, { status: 'inactive' });

      await client.query('COMMIT');

      logger.info(`Employee deleted successfully: ${employee.employeeId}`, {
        employeeId,
        userId: employee.userId
      });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to delete employee', { error: (error as Error).message, employeeId });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Hard delete employee (permanently remove from database)
   */
  async hardDeleteEmployee(employeeId: string): Promise<void> {
    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get employee
      const employee = await this.getEmployeeWithUser(employeeId);
      if (!employee) {
        throw new Error('Employee not found');
      }

      // Check if employee has any related records that would prevent deletion
      // For now, we'll allow hard delete but this could be extended to check for:
      // - Active ID cards
      // - Time corrections
      // - Leave requests
      // - Other related records

      // Hard delete user account first (this will cascade delete the employee due to FK constraint)
      await this.userModel.deleteUser(employee.userId);

      await client.query('COMMIT');

      logger.info(`Employee hard deleted successfully: ${employee.employeeId}`, {
        employeeId,
        userId: employee.userId
      });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to hard delete employee', { error: (error as Error).message, employeeId });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get employee statistics
   */
  async getEmployeeStats(): Promise<{
    totalEmployees: number;
    activeEmployees: number;
    inactiveEmployees: number;
    terminatedEmployees: number;
    onLeaveEmployees: number;
    averageSalary: number;
    employeesByDepartment: Array<{
      departmentId: string;
      departmentName: string;
      count: number;
    }>;
  }> {
    const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE e.status = 'active') as active,
        COUNT(*) FILTER (WHERE e.status = 'inactive') as inactive,
        COUNT(*) FILTER (WHERE e.status = 'terminated') as terminated,
        COUNT(*) FILTER (WHERE e.status = 'on_leave') as on_leave,
        AVG(e.base_salary) as avg_salary
      FROM employees e
      JOIN users u ON e.user_id = u.id
      WHERE u.is_active = true
    `;

    const deptQuery = `
      SELECT 
        d.id as department_id,
        COALESCE(d.name, 'Unassigned') as department_name,
        COUNT(*) as count
      FROM employees e
      JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE u.is_active = true AND e.status = 'active'
      GROUP BY d.id, d.name
      ORDER BY count DESC
    `;

    const [statsResult, deptResult] = await Promise.all([
      getPool().query(query),
      getPool().query(deptQuery)
    ]);

    const stats = statsResult.rows[0];
    const employeesByDepartment = deptResult.rows.map(row => ({
      departmentId: row.department_id || '',
      departmentName: row.department_name,
      count: parseInt(row.count)
    }));

    return {
      totalEmployees: parseInt(stats.total),
      activeEmployees: parseInt(stats.active),
      inactiveEmployees: parseInt(stats.inactive),
      terminatedEmployees: parseInt(stats.terminated),
      onLeaveEmployees: parseInt(stats.on_leave),
      averageSalary: parseFloat(stats.avg_salary) || 0,
      employeesByDepartment
    };
  }

  /**
   * Generate temporary password for new employees
   */
  private generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Create multiple employees from CSV data
   */
  async createBulkEmployees(csvData: CreateEmployeeData[]): Promise<{
    success: EmployeeWithUser[];
    errors: Array<{ row: number; data: CreateEmployeeData; error: string }>;
    totalProcessed: number;
    successCount: number;
    errorCount: number;
  }> {
    const results = {
      success: [] as EmployeeWithUser[],
      errors: [] as Array<{ row: number; data: CreateEmployeeData; error: string }>,
      totalProcessed: csvData.length,
      successCount: 0,
      errorCount: 0
    };

    // Process each employee sequentially to handle individual errors
    for (let i = 0; i < csvData.length; i++) {
      const employeeData = csvData[i];
      const rowNumber = i + 1; // 1-based row numbering for user feedback

      try {
        // Validate required fields
        if (!employeeData.email || !employeeData.firstName || !employeeData.lastName || 
            !employeeData.departmentId || !employeeData.position || !employeeData.hireDate || 
            !employeeData.baseSalary) {
          throw new Error('Missing required fields');
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(employeeData.email)) {
          throw new Error('Invalid email format');
        }

        // Validate salary is positive
        if (employeeData.baseSalary <= 0) {
          throw new Error('Base salary must be greater than 0');
        }

        // Validate employment type
        if (!['regular', 'contractual', 'jo'].includes(employeeData.employmentType)) {
          throw new Error('Invalid employment type. Must be: regular, contractual, or jo');
        }

        // Validate hire date
        const hireDate = new Date(employeeData.hireDate);
        if (isNaN(hireDate.getTime())) {
          throw new Error('Invalid hire date format');
        }

        // Create the employee using existing logic
        const employee = await this.createEmployee(employeeData);
        results.success.push(employee);
        results.successCount++;

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        results.errors.push({
          row: rowNumber,
          data: employeeData,
          error: errorMessage
        });
        results.errorCount++;
        
        logger.error(`Bulk employee creation failed for row ${rowNumber}:`, {
          error: errorMessage,
          data: employeeData
        });
      }
    }

    logger.info(`Bulk employee creation completed: ${results.successCount} successful, ${results.errorCount} failed`);
    return results;
  }
}