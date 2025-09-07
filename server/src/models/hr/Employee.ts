import { Pool } from 'pg';
import { getPool } from '../../config/database';

export interface Employee {
  id: string;
  user_id: string;
  employee_id: string;
  department_id: string | null;
  position: string;
  employment_type: 'regular' | 'contractual' | 'jo';
  hire_date: Date;
  base_salary: number;
  status: 'active' | 'inactive' | 'terminated' | 'on_leave';
  created_at: Date;
  updated_at: Date;
}

export interface CreateEmployeeData {
  user_id: string;
  department_id?: string;
  position: string;
  employment_type: 'regular' | 'contractual' | 'jo';
  hire_date: Date;
  base_salary: number;
  status?: 'active' | 'inactive' | 'terminated' | 'on_leave';
}

export interface UpdateEmployeeData {
  department_id?: string;
  position?: string;
  employment_type?: 'regular' | 'contractual' | 'jo';
  hire_date?: Date;
  base_salary?: number;
  status?: 'active' | 'inactive' | 'terminated' | 'on_leave';
}

export interface EmployeeWithUser extends Employee {
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    is_active: boolean;
  };
  department?: {
    id: string;
    name: string;
    description: string | null;
  } | null | undefined;
}

export class EmployeeModel {
  private pool: Pool;

  constructor() {
    this.pool = getPool();
  }

  /**
   * Create new employee
   */
  async createEmployee(data: CreateEmployeeData): Promise<Employee> {
    const query = `
      INSERT INTO employees (
        user_id, department_id, position, employment_type, 
        hire_date, base_salary, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      data.user_id,
      data.department_id || null,
      data.position,
      data.employment_type,
      data.hire_date,
      data.base_salary,
      data.status || 'active'
    ];

    try {
      const result = await this.pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get employee by ID
   */
  async findById(id: string): Promise<Employee | null> {
    const query = 'SELECT * FROM employees WHERE id = $1';
    
    try {
      const result = await this.pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get employee by user ID
   */
  async findByUserId(userId: string): Promise<Employee | null> {
    const query = 'SELECT * FROM employees WHERE user_id = $1';
    
    try {
      const result = await this.pool.query(query, [userId]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get employee by employee ID
   */
  async findByEmployeeId(employeeId: string): Promise<Employee | null> {
    const query = 'SELECT * FROM employees WHERE employee_id = $1';
    
    try {
      const result = await this.pool.query(query, [employeeId]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get employee with user and department information
   */
  async findByIdWithDetails(id: string): Promise<EmployeeWithUser | null> {
    const query = `
      SELECT 
        e.*,
        u.id as user_id_inner,
        u.email,
        u.first_name,
        u.last_name,
        u.role,
        u.is_active as user_is_active,
        d.id as dept_id,
        d.name as dept_name,
        d.description as dept_description
      FROM employees e
      JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE e.id = $1
    `;

    try {
      const result = await this.pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      
      return {
        id: row.id,
        user_id: row.user_id_inner,
        employee_id: row.employee_id,
        department_id: row.department_id,
        position: row.position,
        employment_type: row.employment_type,
        hire_date: row.hire_date,
        base_salary: row.base_salary,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at,
        user: {
          id: row.user_id_inner,
          email: row.email,
          first_name: row.first_name,
          last_name: row.last_name,
          role: row.role,
          is_active: row.user_is_active
        },
        department: row.dept_id ? {
          id: row.dept_id,
          name: row.dept_name,
          description: row.dept_description
        } : undefined
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update employee
   */
  async updateEmployee(id: string, data: UpdateEmployeeData): Promise<Employee | null> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (data.department_id !== undefined) {
      fields.push(`department_id = $${paramCount++}`);
      values.push(data.department_id);
    }
    if (data.position !== undefined) {
      fields.push(`position = $${paramCount++}`);
      values.push(data.position);
    }
    if (data.employment_type !== undefined) {
      fields.push(`employment_type = $${paramCount++}`);
      values.push(data.employment_type);
    }
    if (data.hire_date !== undefined) {
      fields.push(`hire_date = $${paramCount++}`);
      values.push(data.hire_date);
    }
    if (data.base_salary !== undefined) {
      fields.push(`base_salary = $${paramCount++}`);
      values.push(data.base_salary);
    }
    if (data.status !== undefined) {
      fields.push(`status = $${paramCount++}`);
      values.push(data.status);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push(`updated_at = $${paramCount++}`);
    values.push(new Date());
    values.push(id);

    const query = `
      UPDATE employees 
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
   * Delete employee
   */
  async deleteEmployee(id: string): Promise<boolean> {
    const query = 'DELETE FROM employees WHERE id = $1';
    
    try {
      const result = await this.pool.query(query, [id]);
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      throw error;
    }
  }

  /**
   * List all employees
   */
  async listAllEmployees(): Promise<EmployeeWithUser[]> {
    const query = `
      SELECT 
        e.*,
        u.id as user_id_inner,
        u.email,
        u.first_name,
        u.last_name,
        u.role,
        u.is_active as user_is_active,
        d.id as dept_id,
        d.name as dept_name,
        d.description as dept_description
      FROM employees e
      JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
      ORDER BY u.last_name, u.first_name
    `;

    try {
      const result = await this.pool.query(query);
      
      return result.rows.map(row => ({
        id: row.id,
        user_id: row.user_id_inner,
        employee_id: row.employee_id,
        department_id: row.department_id,
        position: row.position,
        employment_type: row.employment_type,
        hire_date: row.hire_date,
        base_salary: row.base_salary,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at,
        user: {
          id: row.user_id_inner,
          email: row.email,
          first_name: row.first_name,
          last_name: row.last_name,
          role: row.role,
          is_active: row.user_is_active
        },
        department: row.dept_id ? {
          id: row.dept_id,
          name: row.dept_name,
          description: row.dept_description
        } : undefined
      }));
    } catch (error) {
      throw error;
    }
  }

  /**
   * List employees by department
   */
  async listEmployeesByDepartment(departmentId: string): Promise<EmployeeWithUser[]> {
    const query = `
      SELECT 
        e.*,
        u.id as user_id_inner,
        u.email,
        u.first_name,
        u.last_name,
        u.role,
        u.is_active as user_is_active,
        d.id as dept_id,
        d.name as dept_name,
        d.description as dept_description
      FROM employees e
      JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE e.department_id = $1
      ORDER BY u.last_name, u.first_name
    `;

    try {
      const result = await this.pool.query(query, [departmentId]);
      
      return result.rows.map(row => ({
        id: row.id,
        user_id: row.user_id_inner,
        employee_id: row.employee_id,
        department_id: row.department_id,
        position: row.position,
        employment_type: row.employment_type,
        hire_date: row.hire_date,
        base_salary: row.base_salary,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at,
        user: {
          id: row.user_id_inner,
          email: row.email,
          first_name: row.first_name,
          last_name: row.last_name,
          role: row.role,
          is_active: row.user_is_active
        },
        department: row.dept_id ? {
          id: row.dept_id,
          name: row.dept_name,
          description: row.dept_description
        } : undefined
      }));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get employee count by department
   */
  async getEmployeeCountByDepartment(departmentId: string): Promise<number> {
    const query = 'SELECT COUNT(*) FROM employees WHERE department_id = $1 AND status = $2';
    
    try {
      const result = await this.pool.query(query, [departmentId, 'active']);
      return parseInt(result.rows[0].count);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get total employee count
   */
  async getTotalEmployeeCount(): Promise<number> {
    const query = 'SELECT COUNT(*) FROM employees WHERE status = $1';
    
    try {
      const result = await this.pool.query(query, ['active']);
      return parseInt(result.rows[0].count);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find all employees with optional filtering
   */
  async findAll(params: { status?: string; department_id?: string; page?: number; limit?: number } = {}): Promise<{ employees: EmployeeWithUser[]; total: number }> {
    const client = await this.pool.connect();
    try {
      const { page = 1, limit = 10, status, department_id } = params;
      const offset = (page - 1) * limit;
      
      let whereClause = '';
      const conditions: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (status) {
        conditions.push(`e.status = $${paramIndex++}`);
        values.push(status);
      }

      if (department_id) {
        conditions.push(`e.department_id = $${paramIndex++}`);
        values.push(department_id);
      }

      if (conditions.length > 0) {
        whereClause = `WHERE ${conditions.join(' AND ')}`;
      }

      // Get total count
      const countQuery = `
        SELECT COUNT(*) FROM employees e
        JOIN users u ON e.user_id = u.id
        ${whereClause}
      `;
      const countResult = await client.query(countQuery, values);
      const total = parseInt(countResult.rows[0].count);

      // Get employees
      const query = `
        SELECT 
          e.*,
          u.id as user_id,
          u.email,
          u.first_name,
          u.last_name,
          u.role,
          u.is_active as user_is_active,
          d.id as department_id,
          d.name as department_name,
          d.description as department_description
        FROM employees e
        JOIN users u ON e.user_id = u.id
        LEFT JOIN departments d ON e.department_id = d.id
        ${whereClause}
        ORDER BY e.created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;
      values.push(limit, offset);
      
      const result = await client.query(query, values);
      
      const employees: EmployeeWithUser[] = result.rows.map(row => ({
        id: row.id,
        user_id: row.user_id,
        employee_id: row.employee_id,
        department_id: row.department_id,
        position: row.position,
        employment_type: row.employment_type,
        hire_date: row.hire_date,
        base_salary: row.base_salary,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at,
        user: {
          id: row.user_id,
          email: row.email,
          first_name: row.first_name,
          last_name: row.last_name,
          role: row.role,
          is_active: row.user_is_active
        },
        department: row.department_id ? {
          id: row.department_id,
          name: row.department_name,
          description: row.department_description
        } : null
      }));
      
      return {
        employees,
        total
      };
    } catch (error) {
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Check if employee exists
   */
  async employeeExists(employeeId: string): Promise<boolean> {
    const query = 'SELECT 1 FROM employees WHERE employee_id = $1';
    
    try {
      const result = await this.pool.query(query, [employeeId]);
      return result.rows.length > 0;
    } catch (error) {
      throw error;
    }
  }
}

// Export singleton instance
export const employeeModel = new EmployeeModel(); 