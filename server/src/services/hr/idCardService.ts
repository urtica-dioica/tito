import { getPool } from '../../config/database';
import logger from '../../utils/logger';
import crypto from 'crypto';

export interface IdCard {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  departmentName: string | null;
  qrCodeHash: string;
  isActive: boolean;
  expiryDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateIdCardData {
  employeeId: string;
  expiryYears?: number;
}

export interface IdCardListParams {
  page?: number | undefined;
  limit?: number | undefined;
  search?: string | undefined;
  departmentId?: string | undefined;
  isActive?: boolean | undefined;
  isExpired?: boolean | undefined;
  sortBy?: string | undefined;
  sortOrder?: 'asc' | 'desc' | undefined;
}

export class IdCardService {
  /**
   * Create ID card for employee
   */
  async createIdCard(data: CreateIdCardData): Promise<IdCard> {
    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get employee information
      const employeeQuery = `
        SELECT 
          e.id,
          e.employee_id,
          e.user_id,
          u.first_name,
          u.last_name,
          d.name as department_name
        FROM employees e
        JOIN users u ON e.user_id = u.id
        LEFT JOIN departments d ON e.department_id = d.id
        WHERE e.id = $1 AND e.status = 'active'
      `;

      const employeeResult = await client.query(employeeQuery, [data.employeeId]);
      if (employeeResult.rows.length === 0) {
        throw new Error('Employee not found or inactive');
      }

      const employee = employeeResult.rows[0];

      // Check if employee already has an active ID card
      const existingCardQuery = `
        SELECT id FROM id_cards 
        WHERE employee_id = $1 AND is_active = true
      `;
      const existingCard = await client.query(existingCardQuery, [data.employeeId]);
      if (existingCard.rows.length > 0) {
        throw new Error('Employee already has an active ID card');
      }


      // Get default expiry years from system settings
      const expiryYears = data.expiryYears || await this.getDefaultExpiryYears();

      // Generate QR code data
      const qrCodeData = this.generateQrCodeData(employee);
      const qrCodeHash = crypto.createHash('sha256').update(qrCodeData).digest('hex');

      // Calculate expiry date
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + expiryYears);

      // Create ID card
      const createQuery = `
        INSERT INTO id_cards (
          employee_id, 
          qr_code_hash, 
          is_active, 
          expiry_date
        )
        VALUES ($1, $2, $3, $4)
        RETURNING 
          id,
          employee_id as "employeeId",
          qr_code_hash as "qrCodeHash",
          is_active as "isActive",
          expiry_date as "expiryDate",
          created_at as "createdAt",
          updated_at as "updatedAt"
      `;

      const result = await client.query(createQuery, [
        data.employeeId,
        qrCodeHash,
        true,
        expiryDate
      ]);

      await client.query('COMMIT');

      const idCard = result.rows[0];

      // Get complete ID card data
      const completeIdCard = await this.getIdCardWithDetails(idCard.id);

      logger.info(`ID card created successfully for employee: ${employee.employee_id}`, {
        idCardId: idCard.id,
        employeeId: data.employeeId,
        expiryDate
      });

      return completeIdCard;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to create ID card', { error: (error as Error).message, data });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get ID card with complete details
   */
  async getIdCardWithDetails(idCardId: string): Promise<IdCard> {
    const query = `
      SELECT 
        ic.id,
        ic.employee_id as "employeeId",
        e.employee_id as "employeeCode",
        CONCAT(u.first_name, ' ', u.last_name) as "employeeName",
        d.name as "departmentName",
        ic.qr_code_hash as "qrCodeHash",
        ic.is_active as "isActive",
        ic.expiry_date as "expiryDate",
        ic.created_at as "createdAt",
        ic.updated_at as "updatedAt"
      FROM id_cards ic
      JOIN employees e ON ic.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE ic.id = $1
    `;

    const result = await getPool().query(query, [idCardId]);
    
    if (result.rows.length === 0) {
      throw new Error('ID card not found');
    }

    return result.rows[0];
  }

  /**
   * List ID cards with filtering and pagination
   */
  async listIdCards(params: IdCardListParams = {}): Promise<{
    idCards: IdCard[];
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
      isActive,
      isExpired,
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
        e.employee_id ILIKE $${paramIndex} OR 
        u.first_name ILIKE $${paramIndex} OR 
        u.last_name ILIKE $${paramIndex} OR 
        d.name ILIKE $${paramIndex}
      )`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (departmentId) {
      whereConditions.push(`e.department_id = $${paramIndex}`);
      queryParams.push(departmentId);
      paramIndex++;
    }

    if (isActive !== undefined) {
      whereConditions.push(`ic.is_active = $${paramIndex}`);
      queryParams.push(isActive);
      paramIndex++;
    }

    if (isExpired !== undefined) {
      if (isExpired) {
        whereConditions.push(`ic.expiry_date < CURRENT_DATE`);
      } else {
        whereConditions.push(`ic.expiry_date >= CURRENT_DATE`);
      }
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Count query
    const countQuery = `
      SELECT COUNT(*) as total
      FROM id_cards ic
      JOIN employees e ON ic.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
      ${whereClause}
    `;

    const countResult = await getPool().query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Data query
    const dataQuery = `
      SELECT 
        ic.id,
        ic.employee_id as "employeeId",
        e.employee_id as "employeeCode",
        CONCAT(u.first_name, ' ', u.last_name) as "employeeName",
        d.name as "departmentName",
        ic.qr_code_hash as "qrCodeHash",
        ic.is_active as "isActive",
        ic.expiry_date as "expiryDate",
        ic.created_at as "createdAt",
        ic.updated_at as "updatedAt"
      FROM id_cards ic
      JOIN employees e ON ic.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
      ${whereClause}
      ORDER BY ic.${sortBy} ${sortOrder.toUpperCase()}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);
    const result = await getPool().query(dataQuery, queryParams);

    return {
      idCards: result.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Deactivate ID card
   */
  async deactivateIdCard(idCardId: string): Promise<void> {
    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check if ID card exists
      const existingCard = await this.getIdCardWithDetails(idCardId);
      if (!existingCard) {
        throw new Error('ID card not found');
      }

      // Deactivate ID card
      const query = `
        UPDATE id_cards 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `;

      await client.query(query, [idCardId]);

      await client.query('COMMIT');

      logger.info(`ID card deactivated successfully: ${existingCard.employeeCode}`, {
        idCardId,
        employeeId: existingCard.employeeId
      });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to deactivate ID card', { error: (error as Error).message, idCardId });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Generate ID cards for all employees in a department
   */
  async generateDepartmentIdCards(departmentId: string): Promise<{
    success: number;
    failed: number;
    errors: Array<{ employeeId: string; error: string }>;
  }> {
    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get all active employees in department
      const employeesQuery = `
        SELECT e.id, e.employee_id
        FROM employees e
        JOIN users u ON e.user_id = u.id
        WHERE e.department_id = $1 AND e.status = 'active' AND u.is_active = true
      `;

      const employeesResult = await client.query(employeesQuery, [departmentId]);
      const employees = employeesResult.rows;

      let success = 0;
      let failed = 0;
      const errors: Array<{ employeeId: string; error: string }> = [];

      for (const employee of employees) {
        try {
          // Check if employee already has active ID card
          const existingCardQuery = `
            SELECT id FROM id_cards 
            WHERE employee_id = $1 AND is_active = true
          `;
          const existingCard = await client.query(existingCardQuery, [employee.id]);
          
          if (existingCard.rows.length === 0) {
            // Create ID card
            await this.createIdCard({
              employeeId: employee.id
            });
            success++;
          } else {
            errors.push({
              employeeId: employee.employee_id,
              error: 'Employee already has an active ID card'
            });
            failed++;
          }
        } catch (error) {
          errors.push({
            employeeId: employee.employee_id,
            error: (error as Error).message
          });
          failed++;
        }
      }

      await client.query('COMMIT');

      logger.info(`Department ID cards generation completed`, {
        departmentId,
        success,
        failed,
        total: employees.length
      });

      return { success, failed, errors };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to generate department ID cards', { error: (error as Error).message, departmentId });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get ID card statistics
   */
  async getIdCardStats(): Promise<{
    total: number;
    active: number;
    expired: number;
    expiringSoon: number;
    byDepartment: Array<{ departmentName: string; count: number }>;
  }> {
    const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_active = true) as active,
        COUNT(*) FILTER (WHERE expiry_date < CURRENT_DATE) as expired,
        COUNT(*) FILTER (WHERE expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days') as expiring_soon
      FROM id_cards
    `;

    const deptQuery = `
      SELECT 
        COALESCE(d.name, 'Unassigned') as department_name,
        COUNT(*) as count
      FROM id_cards ic
      JOIN employees e ON ic.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE ic.is_active = true
      GROUP BY d.name
      ORDER BY count DESC
    `;

    const [statsResult, deptResult] = await Promise.all([
      getPool().query(query),
      getPool().query(deptQuery)
    ]);

    const stats = statsResult.rows[0];
    const byDepartment = deptResult.rows;

    return {
      total: parseInt(stats.total),
      active: parseInt(stats.active),
      expired: parseInt(stats.expired),
      expiringSoon: parseInt(stats.expiring_soon),
      byDepartment
    };
  }

  /**
   * Generate QR code data for employee
   */
  private generateQrCodeData(employee: any): string {
    const timestamp = Date.now();
    const data = {
      company: 'TITO_HR_SYSTEM',
      employeeId: employee.employee_id,
      department: employee.department_name || 'UNASSIGNED',
      timestamp: timestamp.toString()
    };

    return JSON.stringify(data);
  }

  /**
   * Get default expiry years from system settings
   */
  private async getDefaultExpiryYears(): Promise<number> {
    try {
      const query = `
        SELECT setting_value 
        FROM system_settings 
        WHERE setting_key = 'qr_code_expiry_years' AND is_active = true
      `;
      
      const result = await getPool().query(query);
      return result.rows.length > 0 ? parseInt(result.rows[0].setting_value) : 2;
    } catch (error) {
      logger.warn('Failed to get default expiry years from system settings, using default value', { error: (error as Error).message });
      return 2; // Default to 2 years
    }
  }
}