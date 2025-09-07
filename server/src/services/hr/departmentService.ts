import { getPool } from '../../config/database';
import { DepartmentModel } from '../../models/hr/Department';
import { UserModel } from '../../models/auth/User';
import { emailService } from '../email/emailService';
import { redisService } from '../redis/redisService';
import logger from '../../utils/logger';
import bcrypt from 'bcrypt';

export interface CreateDepartmentData {
  name: string;
  description?: string;
  departmentHeadUserId?: string;
  isActive?: boolean;
}

export interface UpdateDepartmentData {
  name?: string;
  description?: string;
  departmentHeadUserId?: string;
  isActive?: boolean;
}

export interface DepartmentWithHead {
  id: string;
  name: string;
  description: string | null;
  departmentHeadUserId: string | null;
  departmentHead: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  } | null;
  employeeCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DepartmentListParams {
  page?: number | undefined;
  limit?: number | undefined;
  search?: string | undefined;
  isActive?: boolean | undefined;
  sortBy?: string | undefined;
  sortOrder?: 'asc' | 'desc' | undefined;
}

export class DepartmentService {
  private departmentModel: DepartmentModel;
  private userModel: UserModel;

  constructor() {
    this.departmentModel = new DepartmentModel();
    this.userModel = new UserModel();
  }

  /**
   * Create a new department
   */
  async createDepartment(data: CreateDepartmentData): Promise<DepartmentWithHead> {
    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check if department name already exists
      const existingDepartment = await this.departmentModel.findByName(data.name);
      if (existingDepartment) {
        throw new Error('Department name already exists');
      }

      // Verify department head if provided
      if (data.departmentHeadUserId) {
        const departmentHead = await this.userModel.findById(data.departmentHeadUserId);
        if (!departmentHead) {
          throw new Error('Department head user not found');
        }
        if (departmentHead.role !== 'department_head') {
          throw new Error('User is not a department head');
        }

        // Check if user is already assigned to another department
        const existingAssignment = await this.departmentModel.findByDepartmentHead(data.departmentHeadUserId);
        if (existingAssignment) {
          throw new Error('User is already assigned as head of another department');
        }
      }

      // Create department
      const departmentData: any = {
        name: data.name
      };
      
      if (data.description !== undefined) {
        departmentData.description = data.description;
      }
      
      if (data.departmentHeadUserId !== undefined) {
        departmentData.department_head_user_id = data.departmentHeadUserId;
      }
      
      if (data.isActive !== undefined) {
        departmentData.is_active = data.isActive;
      }
      
      const department = await this.departmentModel.createDepartment(departmentData);

      await client.query('COMMIT');

      // Get complete department data
      const completeDepartment = await this.getDepartmentWithHead(department.id);

      logger.info(`Department created successfully: ${department.name}`, {
        departmentId: department.id,
        departmentHeadUserId: data.departmentHeadUserId
      });

      return completeDepartment;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to create department', { error: (error as Error).message, data });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get department with head information
   */
  async getDepartmentWithHead(departmentId: string): Promise<DepartmentWithHead> {
    const query = `
      SELECT 
        d.id,
        d.name,
        d.description,
        d.department_head_user_id as "departmentHeadUserId",
        d.is_active as "isActive",
        d.created_at as "createdAt",
        d.updated_at as "updatedAt",
        u.id as head_id,
        u.email as head_email,
        u.first_name as head_first_name,
        u.last_name as head_last_name,
        COUNT(e.id) as employee_count
      FROM departments d
      LEFT JOIN users u ON d.department_head_user_id = u.id
      LEFT JOIN employees e ON d.id = e.department_id AND e.status = 'active'
      WHERE d.id = $1
      GROUP BY d.id, u.id, u.email, u.first_name, u.last_name
    `;

    const result = await getPool().query(query, [departmentId]);
    
    if (result.rows.length === 0) {
      throw new Error('Department not found');
    }

    const row = result.rows[0];
    
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      departmentHeadUserId: row.departmentHeadUserId,
      departmentHead: row.departmentHeadUserId ? {
        id: row.head_id,
        email: row.head_email,
        firstName: row.head_first_name,
        lastName: row.head_last_name
      } : null,
      employeeCount: parseInt(row.employee_count),
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };
  }

  /**
   * List departments with filtering and pagination
   */
  async listDepartments(params: DepartmentListParams = {}): Promise<{
    departments: DepartmentWithHead[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 20,
      search,
      isActive,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = params;

    const offset = (page - 1) * limit;

    // Build WHERE clause
    const whereConditions: string[] = [];
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (search) {
      whereConditions.push(`(d.name ILIKE $${paramIndex} OR d.description ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (isActive !== undefined) {
      whereConditions.push(`d.is_active = $${paramIndex}`);
      queryParams.push(isActive);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Count query
    const countQuery = `
      SELECT COUNT(*) as total
      FROM departments d
      ${whereClause}
    `;

    const countResult = await getPool().query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Data query
    const dataQuery = `
      SELECT 
        d.id,
        d.name,
        d.description,
        d.department_head_user_id as "departmentHeadUserId",
        d.is_active as "isActive",
        d.created_at as "createdAt",
        d.updated_at as "updatedAt",
        u.id as head_id,
        u.email as head_email,
        u.first_name as head_first_name,
        u.last_name as head_last_name,
        COUNT(e.id) as employee_count
      FROM departments d
      LEFT JOIN users u ON d.department_head_user_id = u.id
      LEFT JOIN employees e ON d.id = e.department_id AND e.status = 'active'
      ${whereClause}
      GROUP BY d.id, u.id, u.email, u.first_name, u.last_name
      ORDER BY d.${sortBy} ${sortOrder.toUpperCase()}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);
    const result = await getPool().query(dataQuery, queryParams);

    const departments = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      departmentHeadUserId: row.departmentHeadUserId,
      departmentHead: row.departmentHeadUserId ? {
        id: row.head_id,
        email: row.head_email,
        firstName: row.head_first_name,
        lastName: row.head_last_name
      } : null,
      employeeCount: parseInt(row.employee_count),
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }));

    return {
      departments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Update department information
   */
  async updateDepartment(departmentId: string, data: UpdateDepartmentData): Promise<DepartmentWithHead> {
    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get current department
      const currentDepartment = await this.getDepartmentWithHead(departmentId);
      if (!currentDepartment) {
        throw new Error('Department not found');
      }

      // Check if new name conflicts with existing departments
      if (data.name && data.name !== currentDepartment.name) {
        const existingDepartment = await this.departmentModel.findByName(data.name);
        if (existingDepartment) {
          throw new Error('Department name already exists');
        }
      }

      // Verify department head if provided
      if (data.departmentHeadUserId) {
        const departmentHead = await this.userModel.findById(data.departmentHeadUserId);
        if (!departmentHead) {
          throw new Error('Department head user not found');
        }
        if (departmentHead.role !== 'department_head') {
          throw new Error('User is not a department head');
        }

        // Check if user is already assigned to another department (excluding current)
        const existingAssignment = await this.departmentModel.findByDepartmentHead(data.departmentHeadUserId);
        if (existingAssignment && existingAssignment.id !== departmentId) {
          throw new Error('User is already assigned as head of another department');
        }
      }

      // Update department - convert camelCase to snake_case for model
      const modelData = {
        name: data.name,
        description: data.description,
        department_head_user_id: data.departmentHeadUserId,
        is_active: data.isActive
      };
      await this.departmentModel.updateDepartment(departmentId, modelData);

      await client.query('COMMIT');

      // Get updated department data
      const updatedDepartment = await this.getDepartmentWithHead(departmentId);

      logger.info(`Department updated successfully: ${currentDepartment.name}`, {
        departmentId,
        updates: { ...data }
      });

      return updatedDepartment;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to update department', { error: (error as Error).message, departmentId, data });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Delete department (soft delete)
   */
  async deleteDepartment(departmentId: string): Promise<void> {
    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get department
      const department = await this.getDepartmentWithHead(departmentId);
      if (!department) {
        throw new Error('Department not found');
      }

      // Check if department has active employees
      if (department.employeeCount > 0) {
        throw new Error('Cannot delete department with active employees');
      }

      // Deactivate department
      await this.departmentModel.updateDepartment(departmentId, { is_active: false });

      await client.query('COMMIT');

      logger.info(`Department deleted successfully: ${department.name}`, {
        departmentId
      });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to delete department', { error: (error as Error).message, departmentId });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Hard delete department (permanently remove from database)
   */
  async hardDeleteDepartment(departmentId: string): Promise<void> {
    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get department
      const department = await this.getDepartmentWithHead(departmentId);
      if (!department) {
        throw new Error('Department not found');
      }

      // Check if department has active employees
      if (department.employeeCount > 0) {
        throw new Error('Cannot delete department with active employees');
      }

      // Check if department has a department head assigned
      if (department.departmentHeadUserId) {
        throw new Error('Cannot delete department with assigned department head. Please remove the department head first.');
      }

      // Hard delete department
      await this.departmentModel.deleteDepartment(departmentId);

      await client.query('COMMIT');

      logger.info(`Department hard deleted successfully: ${department.name}`, {
        departmentId
      });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to hard delete department', { error: (error as Error).message, departmentId });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Assign department head
   */
  async assignDepartmentHead(departmentId: string, userId: string): Promise<DepartmentWithHead> {
    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Verify user is a department head
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      if (user.role !== 'department_head') {
        throw new Error('User is not a department head');
      }

      // Check if user is already assigned to another department
              const existingAssignment = await this.departmentModel.findByDepartmentHead(userId);
      if (existingAssignment && existingAssignment.id !== departmentId) {
        throw new Error('User is already assigned as head of another department');
      }

      // Update department
      await this.departmentModel.assignDepartmentHead(departmentId, userId);

      await client.query('COMMIT');

      // Get updated department data
      const updatedDepartment = await this.getDepartmentWithHead(departmentId);

      logger.info(`Department head assigned successfully`, {
        departmentId,
        userId,
        departmentName: updatedDepartment.name
      });

      return updatedDepartment;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to assign department head', { error: (error as Error).message, departmentId, userId });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Remove department head
   */
  async removeDepartmentHead(departmentId: string): Promise<DepartmentWithHead> {
    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Update department
      await this.departmentModel.removeDepartmentHead(departmentId);

      await client.query('COMMIT');

      // Get updated department data
      const updatedDepartment = await this.getDepartmentWithHead(departmentId);

      logger.info(`Department head removed successfully`, {
        departmentId,
        departmentName: updatedDepartment.name
      });

      return updatedDepartment;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to remove department head', { error: (error as Error).message, departmentId });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get department statistics
   */
  async getDepartmentStats(): Promise<{
    total: number;
    active: number;
    withHeads: number;
    withoutHeads: number;
    totalEmployees: number;
    averageEmployeesPerDepartment: number;
  }> {
    const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_active = true) as active,
        COUNT(*) FILTER (WHERE department_head_user_id IS NOT NULL) as with_heads,
        COUNT(*) FILTER (WHERE department_head_user_id IS NULL) as without_heads,
        COUNT(e.id) as total_employees
      FROM departments d
      LEFT JOIN employees e ON d.id = e.department_id AND e.status = 'active'
      WHERE d.is_active = true
    `;

    const result = await getPool().query(query);
    const stats = result.rows[0];

    const total = parseInt(stats.total);
    const totalEmployees = parseInt(stats.total_employees);
    const averageEmployeesPerDepartment = total > 0 ? totalEmployees / total : 0;

    return {
      total: total,
      active: parseInt(stats.active),
      withHeads: parseInt(stats.with_heads),
      withoutHeads: parseInt(stats.without_heads),
      totalEmployees,
      averageEmployeesPerDepartment: Math.round(averageEmployeesPerDepartment * 100) / 100
    };
  }

  /**
   * Get all department heads with pagination and filtering
   */
  async getDepartmentHeads(params: { page: number; limit: number; search?: string; status?: string }): Promise<{
    departmentHeads: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const pool = getPool();
    const client = await pool.connect();

    try {
      const { page, limit, search = '', status = '' } = params;
      const offset = (page - 1) * limit;

      // Build WHERE clause
      let whereClause = "WHERE u.role = 'department_head'";
      const queryParams: any[] = [];
      let paramIndex = 1;

      if (search && search.trim()) {
        whereClause += ` AND (u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`;
        queryParams.push(`%${search}%`);
        paramIndex++;
      }

      if (status && status.trim()) {
        // Convert status to boolean for is_active column
        const isActive = status === 'active';
        whereClause += ` AND u.is_active = $${paramIndex}`;
        queryParams.push(isActive);
        paramIndex++;
      }

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM users u
        ${whereClause}
      `;
      const countResult = await client.query(countQuery, queryParams);
      const total = parseInt(countResult.rows[0].total);

      // Get department heads with their assigned departments
      const query = `
        SELECT 
          u.id,
          u.first_name,
          u.last_name,
          u.email,
          u.is_active,
          u.created_at,
          u.updated_at,
          d.id as department_id,
          d.name as department_name,
          d.description as department_description
        FROM users u
        LEFT JOIN departments d ON d.department_head_user_id = u.id
        ${whereClause}
        ORDER BY u.last_name, u.first_name
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      
      queryParams.push(limit, offset);
      const result = await client.query(query, queryParams);

      const departmentHeads = result.rows.map(row => ({
        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email,
        status: row.is_active ? 'active' : 'inactive',
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        department: row.department_id ? {
          id: row.department_id,
          name: row.department_name,
          description: row.department_description
        } : null
      }));

      return {
        departmentHeads,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error('Failed to get department heads', { error: (error as Error).message, params });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get department head by ID
   */
  async getDepartmentHeadById(userId: string): Promise<any | null> {
    const pool = getPool();
    const client = await pool.connect();

    try {
      const query = `
        SELECT 
          u.id,
          u.first_name,
          u.last_name,
          u.email,
          u.is_active,
          u.created_at,
          u.updated_at,
          d.id as department_id,
          d.name as department_name,
          d.description as department_description
        FROM users u
        LEFT JOIN departments d ON d.department_head_user_id = u.id
        WHERE u.id = $1 AND u.role = 'department_head'
      `;
      
      const result = await client.query(query, [userId]);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email,
        status: row.is_active ? 'active' : 'inactive',
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        department: row.department_id ? {
          id: row.department_id,
          name: row.department_name,
          description: row.department_description
        } : null
      };
    } catch (error) {
      logger.error('Failed to get department head by ID', { error: (error as Error).message, userId });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Create a new department head user
   */
  async createDepartmentHead(data: {
    firstName: string;
    lastName: string;
    email: string;
    departmentId?: string;
  }): Promise<any> {
    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check if email already exists
      const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [data.email]);
      if (existingUser.rows.length > 0) {
        throw new Error('Email already exists');
      }

      // Generate a temporary password for initial setup
      const temporaryPassword = this.generateTemporaryPassword();
      const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

      const userQuery = `
        INSERT INTO users (first_name, last_name, email, password_hash, role, is_active)
        VALUES ($1, $2, $3, $4, 'department_head', true)
        RETURNING id, first_name, last_name, email, is_active, created_at, updated_at
      `;
      
      const userResult = await client.query(userQuery, [
        data.firstName,
        data.lastName,
        data.email,
        hashedPassword
      ]);

      const newUser = userResult.rows[0];

      // If department is specified, assign the user as department head
      if (data.departmentId) {
        await this.assignDepartmentHeadWithClient(client, data.departmentId, newUser.id);
      }

      // Generate password setup token
      const setupToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const setupTokenKey = `setup_token:${setupToken}`;
      
      // Store setup token in cache with user ID as value (expires in 24 hours)
      await redisService.setCache(setupTokenKey, newUser.id, 24 * 60 * 60);

      await client.query('COMMIT');

      // Send password setup email
      const emailSent = await emailService.sendDepartmentHeadPasswordSetupEmail(
        data.email,
        data.firstName,
        data.lastName,
        setupToken
      );

      if (!emailSent) {
        logger.warn('Failed to send password setup email to department head', {
          userId: newUser.id,
          email: data.email
        });
      }

      // Get the complete department head data
      const departmentHead = await this.getDepartmentHeadById(newUser.id);

      logger.info('Department head created successfully', {
        userId: newUser.id,
        email: newUser.email,
        departmentId: data.departmentId,
        emailSent
      });

      return departmentHead;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to create department head', { error: (error as Error).message, data });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update department head
   */
  async updateDepartmentHead(userId: string, data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    status?: string;
    departmentId?: string;
  }): Promise<any | null> {
    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check if user exists and is a department head
      const existingUser = await client.query(
        'SELECT id, email FROM users WHERE id = $1 AND role = $2',
        [userId, 'department_head']
      );

      if (existingUser.rows.length === 0) {
        throw new Error('Department head not found');
      }

      // Check if email is being changed and if it already exists
      if (data.email && data.email !== existingUser.rows[0].email) {
        const emailCheck = await client.query('SELECT id FROM users WHERE email = $1 AND id != $2', [data.email, userId]);
        if (emailCheck.rows.length > 0) {
          throw new Error('Email already exists');
        }
      }

      // Update user data
      const updateFields = [];
      const updateValues = [];
      let paramIndex = 1;

      if (data.firstName) {
        updateFields.push(`first_name = $${paramIndex}`);
        updateValues.push(data.firstName);
        paramIndex++;
      }
      if (data.lastName) {
        updateFields.push(`last_name = $${paramIndex}`);
        updateValues.push(data.lastName);
        paramIndex++;
      }
      if (data.email) {
        updateFields.push(`email = $${paramIndex}`);
        updateValues.push(data.email);
        paramIndex++;
      }
      if (data.status) {
        updateFields.push(`is_active = $${paramIndex}`);
        updateValues.push(data.status === 'active');
        paramIndex++;
      }

      let updatedUserData = null;
      if (updateFields.length > 0) {
        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        updateValues.push(userId);

        const updateQuery = `
          UPDATE users 
          SET ${updateFields.join(', ')}
          WHERE id = $${paramIndex}
          RETURNING id, first_name, last_name, email, is_active, created_at, updated_at
        `;
        
        const updateResult = await client.query(updateQuery, updateValues);
        updatedUserData = updateResult.rows[0];
      }

      // Handle department assignment
      if (data.departmentId !== undefined) {
        // First, remove from current department if any
        await client.query(
          'UPDATE departments SET department_head_user_id = NULL WHERE department_head_user_id = $1',
          [userId]
        );

        // Assign to new department if specified
        if (data.departmentId) {
          // Verify the user has department_head role
          const userQuery = 'SELECT role FROM users WHERE id = $1';
          const userResult = await client.query(userQuery, [userId]);
          
          if (userResult.rows.length === 0) {
            throw new Error('User not found');
          }
          
          if (userResult.rows[0].role !== 'department_head') {
            throw new Error('User must have department_head role');
          }

          // Update the department within the same transaction
          await client.query(
            'UPDATE departments SET department_head_user_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [userId, data.departmentId]
          );
        }
      }

      await client.query('COMMIT');

      // Return updated department head data from transaction
      logger.info('Transaction committed successfully', { userId });
      
      const result = {
        id: updatedUserData?.id || userId,
        firstName: updatedUserData?.first_name || data.firstName,
        lastName: updatedUserData?.last_name || data.lastName,
        email: updatedUserData?.email || data.email,
        status: updatedUserData?.is_active ? 'active' : 'inactive',
        createdAt: updatedUserData?.created_at,
        updatedAt: updatedUserData?.updated_at,
        department: data.departmentId ? {
          id: data.departmentId,
          name: null, // We'll need to fetch this separately if needed
          description: null
        } : null
      };

      logger.info('Department head updated successfully', {
        userId,
        departmentId: data.departmentId
      });

      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to update department head', { error: (error as Error).message, userId, data });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Delete department head
   */
  async deleteDepartmentHead(userId: string): Promise<void> {
    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check if user exists and is a department head
      const existingUser = await client.query(
        'SELECT id FROM users WHERE id = $1 AND role = $2',
        [userId, 'department_head']
      );

      if (existingUser.rows.length === 0) {
        throw new Error('Department head not found');
      }

      // Remove from any assigned department
      await client.query(
        'UPDATE departments SET department_head_user_id = NULL WHERE department_head_user_id = $1',
        [userId]
      );

      // Delete the user
      await client.query('DELETE FROM users WHERE id = $1', [userId]);

      await client.query('COMMIT');

      logger.info('Department head deleted successfully', { userId });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to delete department head', { error: (error as Error).message, userId });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Assign department head using a specific database client (for transactions)
   */
  private async assignDepartmentHeadWithClient(client: any, departmentId: string, userId: string): Promise<void> {
    // First verify the user has department_head role
    const userQuery = 'SELECT role FROM users WHERE id = $1';
    const userResult = await client.query(userQuery, [userId]);
    
    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }
    
    if (userResult.rows[0].role !== 'department_head') {
      throw new Error('User must have department_head role');
    }

    // Update the department
    const updateQuery = 'UPDATE departments SET department_head_user_id = $1 WHERE id = $2';
    await client.query(updateQuery, [userId, departmentId]);
  }

  /**
   * Generate temporary password for new department heads
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
   * Get employees in a department
   */
  async getDepartmentEmployees(departmentId: string): Promise<any[]> {
    const pool = getPool();
    
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
        e.created_at as "createdAt",
        e.updated_at as "updatedAt"
      FROM employees e
      JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE e.department_id = $1
      ORDER BY u.last_name, u.first_name
    `;
    
    const result = await pool.query(query, [departmentId]);
    return result.rows;
  }
}