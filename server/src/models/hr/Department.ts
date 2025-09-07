import { Pool } from 'pg';
import { getPool } from '../../config/database';

export interface Department {
  id: string;
  name: string;
  description: string | null;
  department_head_user_id: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateDepartmentData {
  name: string;
  description?: string;
  department_head_user_id?: string;
  is_active?: boolean;
}

export interface UpdateDepartmentData {
  name?: string;
  description?: string;
  department_head_user_id?: string | null;
  is_active?: boolean;
}

export interface DepartmentWithHead extends Department {
  department_head?: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
  } | null | undefined;
  employee_count: number;
}

export class DepartmentModel {
  private pool: Pool;

  constructor() {
    this.pool = getPool();
  }

  /**
   * Create new department
   */
  async createDepartment(data: CreateDepartmentData): Promise<Department> {
    const query = `
      INSERT INTO departments (name, description, department_head_user_id, is_active)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const values = [
      data.name,
      data.description || null,
      data.department_head_user_id || null,
      data.is_active !== undefined ? data.is_active : true
    ];

    try {
      const result = await this.pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get department by ID
   */
  async findById(id: string): Promise<Department | null> {
    const query = 'SELECT * FROM departments WHERE id = $1';
    
    try {
      const result = await this.pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get department by name
   */
  async findByName(name: string): Promise<Department | null> {
    const query = 'SELECT * FROM departments WHERE name = $1';
    
    try {
      const result = await this.pool.query(query, [name]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get department with head information
   */
  async findByIdWithHead(id: string): Promise<DepartmentWithHead | null> {
    const query = `
      SELECT 
        d.*,
        u.id as head_user_id,
        u.email as head_email,
        u.first_name as head_first_name,
        u.last_name as head_last_name,
        u.role as head_role,
        COUNT(e.id) as employee_count
      FROM departments d
      LEFT JOIN users u ON d.department_head_user_id = u.id
      LEFT JOIN employees e ON d.id = e.department_id AND e.status = 'active'
      WHERE d.id = $1
      GROUP BY d.id, u.id, u.email, u.first_name, u.last_name, u.role
    `;

    try {
      const result = await this.pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      
      return {
        id: row.id,
        name: row.name,
        description: row.description,
        department_head_user_id: row.department_head_user_id,
        is_active: row.is_active,
        created_at: row.created_at,
        updated_at: row.updated_at,
        department_head: row.head_user_id ? {
          id: row.head_user_id,
          email: row.head_email,
          first_name: row.head_first_name,
          last_name: row.head_last_name,
          role: row.head_role
        } : null,
        employee_count: parseInt(row.employee_count)
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update department
   */
  async updateDepartment(id: string, data: UpdateDepartmentData): Promise<Department | null> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(data.description);
    }
    if (data.department_head_user_id !== undefined) {
      fields.push(`department_head_user_id = $${paramCount++}`);
      values.push(data.department_head_user_id);
    }
    if (data.is_active !== undefined) {
      fields.push(`is_active = $${paramCount++}`);
      values.push(data.is_active);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push(`updated_at = $${paramCount++}`);
    values.push(new Date());
    values.push(id);

    const query = `
      UPDATE departments 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    try {
      const result = await this.pool.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete department
   */
  async deleteDepartment(id: string): Promise<boolean> {
    // Check if department has employees
    const hasEmployees = await this.hasEmployees(id);
    if (hasEmployees) {
      throw new Error('Cannot delete department with active employees');
    }

    const query = 'DELETE FROM departments WHERE id = $1';
    
    try {
      const result = await this.pool.query(query, [id]);
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      throw error;
    }
  }

  /**
   * List all departments
   */
  async listAllDepartments(): Promise<DepartmentWithHead[]> {
    const query = `
      SELECT 
        d.*,
        u.id as head_user_id,
        u.email as head_email,
        u.first_name as head_first_name,
        u.last_name as head_last_name,
        u.role as head_role,
        COUNT(e.id) as employee_count
      FROM departments d
      LEFT JOIN users u ON d.department_head_user_id = u.id
      LEFT JOIN employees e ON d.id = e.department_id AND e.status = 'active'
      GROUP BY d.id, u.id, u.email, u.first_name, u.last_name, u.role
      ORDER BY d.name
    `;

    try {
      const result = await this.pool.query(query);
      
      return result.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        department_head_user_id: row.department_head_user_id,
        is_active: row.is_active,
        created_at: row.created_at,
        updated_at: row.updated_at,
        department_head: row.head_user_id ? {
          id: row.head_user_id,
          email: row.head_email,
          first_name: row.head_first_name,
          last_name: row.head_last_name,
          role: row.head_role
        } : undefined,
        employee_count: parseInt(row.employee_count)
      }));
    } catch (error) {
      throw error;
    }
  }

  /**
   * List active departments only
   */
  async listActiveDepartments(): Promise<DepartmentWithHead[]> {
    const query = `
      SELECT 
        d.*,
        u.id as head_user_id,
        u.email as head_email,
        u.first_name as head_first_name,
        u.last_name as head_last_name,
        u.role as head_role,
        COUNT(e.id) as employee_count
      FROM departments d
      LEFT JOIN users u ON d.department_head_user_id = u.id
      LEFT JOIN employees e ON d.id = e.department_id AND e.status = 'active'
      WHERE d.is_active = true
      GROUP BY d.id, u.id, u.email, u.first_name, u.last_name, u.role
      ORDER BY d.name
    `;

    try {
      const result = await this.pool.query(query);
      
      return result.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        department_head_user_id: row.department_head_user_id,
        is_active: row.is_active,
        created_at: row.created_at,
        updated_at: row.updated_at,
        department_head: row.head_user_id ? {
          id: row.head_user_id,
          email: row.head_email,
          first_name: row.head_first_name,
          last_name: row.head_last_name,
          role: row.head_role
        } : undefined,
        employee_count: parseInt(row.employee_count)
      }));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get department by department head user ID
   */
  async findByDepartmentHead(userId: string): Promise<Department | null> {
    const query = 'SELECT * FROM departments WHERE department_head_user_id = $1';
    
    try {
      const result = await this.pool.query(query, [userId]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if department has employees
   */
  async hasEmployees(departmentId: string): Promise<boolean> {
    const query = 'SELECT 1 FROM employees WHERE department_id = $1 AND status = $2 LIMIT 1';
    
    try {
      const result = await this.pool.query(query, [departmentId, 'active']);
      return result.rows.length > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get total department count
   */
  async getTotalDepartmentCount(): Promise<number> {
    const query = 'SELECT COUNT(*) FROM departments WHERE is_active = $1';
    
    try {
      const result = await this.pool.query(query, [true]);
      return parseInt(result.rows[0].count);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if department name exists
   */
  async nameExists(name: string, excludeId?: string): Promise<boolean> {
    const query = excludeId 
      ? 'SELECT 1 FROM departments WHERE name = $1 AND id != $2'
      : 'SELECT 1 FROM departments WHERE name = $1';
    
    try {
      const result = excludeId 
        ? await this.pool.query(query, [name, excludeId])
        : await this.pool.query(query, [name]);
      return result.rows.length > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Assign department head
   */
  async assignDepartmentHead(departmentId: string, userId: string): Promise<Department | null> {
    // First verify the user has department_head role
    const userQuery = 'SELECT role FROM users WHERE id = $1';
    const userResult = await this.pool.query(userQuery, [userId]);
    
    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }
    
    if (userResult.rows[0].role !== 'department_head') {
      throw new Error('User must have department_head role');
    }

    // Update the department
    return this.updateDepartment(departmentId, { department_head_user_id: userId });
  }

  /**
   * Remove department head
   */
  async removeDepartmentHead(departmentId: string): Promise<Department | null> {
    return this.updateDepartment(departmentId, { department_head_user_id: null });
  }
}

// Export singleton instance
export const departmentModel = new DepartmentModel(); 