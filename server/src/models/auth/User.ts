import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { getPool } from '../../config/database';
import { config } from '../../config/environment';
import { UserRole, isValidRole } from '../../utils/constants/roles';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: UserRole;
}

export interface UpdateUserData {
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: UserRole;
  is_active?: boolean;
}

export interface UserWithPassword extends Omit<User, 'password_hash'> {
  password_hash: string;
}

export interface UserWithoutPassword extends Omit<User, 'password_hash'> {
  password_hash?: never;
}

export class UserModel {
  private pool: Pool;

  constructor() {
    this.pool = getPool();
  }

  /**
   * Create a new user
   */
  async createUser(userData: CreateUserData): Promise<UserWithoutPassword> {
    const { email, password, first_name, last_name, role } = userData;

    // Validate role
    if (!isValidRole(role)) {
      throw new Error(`Invalid role: ${role}`);
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, config.security.bcryptRounds);

    const query = `
      INSERT INTO users (email, password_hash, first_name, last_name, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, password_hash, first_name, last_name, role, is_active, created_at, updated_at
    `;

    const values = [email, password_hash, first_name, last_name, role];

    try {
      const result = await this.pool.query(query, values);
      const user = result.rows[0];
      
      // Remove password_hash from response
      const { password_hash: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      if (error instanceof Error && error.message.includes('duplicate key')) {
        throw new Error('User with this email already exists');
      }
      throw error;
    }
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<UserWithoutPassword | null> {
    const query = `
      SELECT id, email, password_hash, first_name, last_name, role, is_active, created_at, updated_at
      FROM users
      WHERE id = $1
    `;

    try {
      const result = await this.pool.query(query, [id]);
      if (result.rows.length === 0) {
        return null;
      }

      const user = result.rows[0];
      const { password_hash: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<UserWithPassword | null> {
    const query = `
      SELECT id, email, password_hash, first_name, last_name, role, is_active, created_at, updated_at
      FROM users
      WHERE email = $1
    `;

    try {
      const result = await this.pool.query(query, [email]);
      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find user by email (without password)
   */
  async findByEmailWithoutPassword(email: string): Promise<UserWithoutPassword | null> {
    const query = `
      SELECT id, email, first_name, last_name, role, is_active, created_at, updated_at
      FROM users
      WHERE email = $1
    `;

    try {
      const result = await this.pool.query(query, [email]);
      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update user
   */
  async updateUser(id: string, updateData: UpdateUserData): Promise<UserWithoutPassword | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    // Build dynamic query
    if (updateData.email !== undefined) {
      fields.push(`email = $${paramCount++}`);
      values.push(updateData.email);
    }
    if (updateData.first_name !== undefined) {
      fields.push(`first_name = $${paramCount++}`);
      values.push(updateData.first_name);
    }
    if (updateData.last_name !== undefined) {
      fields.push(`last_name = $${paramCount++}`);
      values.push(updateData.last_name);
    }
    if (updateData.role !== undefined) {
      if (!isValidRole(updateData.role)) {
        throw new Error(`Invalid role: ${updateData.role}`);
      }
      fields.push(`role = $${paramCount++}`);
      values.push(updateData.role);
    }
    if (updateData.is_active !== undefined) {
      fields.push(`is_active = $${paramCount++}`);
      values.push(updateData.is_active);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    // Add updated_at timestamp
    fields.push(`updated_at = $${paramCount++}`);
    values.push(new Date());

    // Add user ID
    values.push(id);

    const query = `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, email, first_name, last_name, role, is_active, created_at, updated_at
    `;

    try {
      const result = await this.pool.query(query, values);
      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      if (error instanceof Error && error.message.includes('duplicate key')) {
        throw new Error('User with this email already exists');
      }
      throw error;
    }
  }

  /**
   * Update user password
   */
  async updatePassword(id: string, newPassword: string): Promise<boolean> {
    const password_hash = await bcrypt.hash(newPassword, config.security.bcryptRounds);
    
    const query = `
      UPDATE users
      SET password_hash = $1, updated_at = $2
      WHERE id = $3
    `;

    try {
      const result = await this.pool.query(query, [password_hash, new Date(), id]);
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete user
   */
  async deleteUser(id: string): Promise<boolean> {
    const query = 'DELETE FROM users WHERE id = $1';
    
    try {
      const result = await this.pool.query(query, [id]);
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      throw error;
    }
  }

  /**
   * List all users (for HR admin)
   */
  async listAllUsers(): Promise<UserWithoutPassword[]> {
    const query = `
      SELECT id, email, first_name, last_name, role, is_active, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
    `;

    try {
      const result = await this.pool.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * List users by role
   */
  async listUsersByRole(role: UserRole): Promise<UserWithoutPassword[]> {
    const query = `
      SELECT id, email, first_name, last_name, role, is_active, created_at, updated_at
      FROM users
      WHERE role = $1
      ORDER BY created_at DESC
    `;

    try {
      const result = await this.pool.query(query, [role]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if user exists
   */
  async userExists(email: string): Promise<boolean> {
    const query = 'SELECT 1 FROM users WHERE email = $1';
    
    try {
      const result = await this.pool.query(query, [email]);
      return result.rows.length > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verify password
   */
  async verifyPassword(email: string, password: string): Promise<boolean> {
    const user = await this.findByEmail(email);
    if (!user) {
      return false;
    }

    return bcrypt.compare(password, user.password_hash);
  }

  /**
   * Get user count by role
   */
  async getUserCountByRole(role: UserRole): Promise<number> {
    const query = 'SELECT COUNT(*) FROM users WHERE role = $1';
    
    try {
      const result = await this.pool.query(query, [role]);
      return parseInt(result.rows[0].count);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get total user count
   */
  async getTotalUserCount(): Promise<number> {
    const query = 'SELECT COUNT(*) FROM users';
    
    try {
      const result = await this.pool.query(query);
      return parseInt(result.rows[0].count);
    } catch (error) {
      throw error;
    }
  }
}

// Export singleton instance
export const userModel = new UserModel(); 