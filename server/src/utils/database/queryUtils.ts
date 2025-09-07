import { Pool } from 'pg';

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface SearchOptions {
  search?: string;
  searchFields?: string[];
}

export interface FilterOptions {
  [key: string]: any;
}

export interface SortOptions {
  field: string;
  direction: 'ASC' | 'DESC';
}

export class QueryUtils {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Build WHERE clause for filters
   */
  buildWhereClause(filters: FilterOptions, tableAlias: string = ''): { clause: string; values: any[] } {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null) {
        const field = tableAlias ? `${tableAlias}.${key}` : key;
        
        if (Array.isArray(value)) {
          const placeholders = value.map(() => `$${paramCount++}`).join(', ');
          conditions.push(`${field} IN (${placeholders})`);
          values.push(...value);
        } else {
          conditions.push(`${field} = $${paramCount++}`);
          values.push(value);
        }
      }
    }

    return {
      clause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
      values
    };
  }

  /**
   * Build search clause
   */
  buildSearchClause(search: string, searchFields: string[], tableAlias: string = ''): { clause: string; values: any[] } {
    if (!search || !searchFields.length) {
      return { clause: '', values: [] };
    }

    const conditions: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    for (const field of searchFields) {
      const fieldName = tableAlias ? `${tableAlias}.${field}` : field;
      conditions.push(`${fieldName} ILIKE $${paramCount++}`);
      values.push(`%${search}%`);
    }

    return {
      clause: `AND (${conditions.join(' OR ')})`,
      values
    };
  }

  /**
   * Build ORDER BY clause
   */
  buildOrderClause(sort: SortOptions, tableAlias: string = ''): string {
    const field = tableAlias ? `${tableAlias}.${sort.field}` : sort.field;
    return `ORDER BY ${field} ${sort.direction}`;
  }

  /**
   * Build LIMIT and OFFSET for pagination
   */
  buildPaginationClause(page: number, limit: number): { clause: string; values: number[] } {
    const offset = (page - 1) * limit;
    return {
      clause: `LIMIT $1 OFFSET $2`,
      values: [limit, offset]
    };
  }

  /**
   * Execute paginated query
   */
  async executePaginatedQuery<T>(
    baseQuery: string,
    countQuery: string,
    params: any[],
    options: PaginationOptions
  ): Promise<PaginationResult<T>> {
    try {
      // Execute count query
      const countResult = await this.pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].count);

      // Execute data query with pagination
      const paginationClause = this.buildPaginationClause(options.page, options.limit);
      const dataQuery = `${baseQuery} ${paginationClause.clause}`;
      const dataParams = [...params, ...paginationClause.values];

      const dataResult = await this.pool.query(dataQuery, dataParams);

      const totalPages = Math.ceil(total / options.limit);
      const hasNext = options.page < totalPages;
      const hasPrev = options.page > 1;

      return {
        data: dataResult.rows,
        pagination: {
          page: options.page,
          limit: options.limit,
          total,
          totalPages,
          hasNext,
          hasPrev
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Build complete SELECT query with filters, search, and pagination
   */
  buildSelectQuery(
    table: string,
    fields: string[],
    filters: FilterOptions = {},
    search?: SearchOptions,
    sort?: SortOptions,
    tableAlias: string = ''
  ): { query: string; values: any[] } {
    const selectFields = fields.map(field => 
      tableAlias ? `${tableAlias}.${field}` : field
    ).join(', ');

    let query = `SELECT ${selectFields} FROM ${table}`;
    if (tableAlias) {
      query += ` ${tableAlias}`;
    }

    const values: any[] = [];
    let paramCount = 1;

    // Add filters
    const whereClause = this.buildWhereClause(filters, tableAlias);
    if (whereClause.clause) {
      query += ` ${whereClause.clause}`;
      values.push(...whereClause.values);
      paramCount += whereClause.values.length;
    }

    // Add search
    if (search?.search && search?.searchFields) {
      const searchClause = this.buildSearchClause(search.search, search.searchFields, tableAlias);
      if (searchClause.clause) {
        query += ` ${searchClause.clause}`;
        values.push(...searchClause.values);
      }
    }

    // Add sorting
    if (sort) {
      query += ` ${this.buildOrderClause(sort, tableAlias)}`;
    }

    return { query, values };
  }

  /**
   * Execute transaction
   */
  async executeTransaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Check if record exists
   */
  async recordExists(table: string, field: string, value: any, excludeId?: string): Promise<boolean> {
    let query = `SELECT 1 FROM ${table} WHERE ${field} = $1`;
    const values = [value];

    if (excludeId) {
      query += ` AND id != $2`;
      values.push(excludeId);
    }

    query += ' LIMIT 1';

    try {
      const result = await this.pool.query(query, values);
      return result.rows.length > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get record count
   */
  async getRecordCount(table: string, filters: FilterOptions = {}): Promise<number> {
    const whereClause = this.buildWhereClause(filters);
    const query = `SELECT COUNT(*) FROM ${table} ${whereClause.clause}`;

    try {
      const result = await this.pool.query(query, whereClause.values);
      return parseInt(result.rows[0].count);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Soft delete record
   */
  async softDelete(table: string, id: string, deletedAtField: string = 'deleted_at'): Promise<boolean> {
    const query = `UPDATE ${table} SET ${deletedAtField} = NOW() WHERE id = $1`;
    
    try {
      const result = await this.pool.query(query, [id]);
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Restore soft deleted record
   */
  async restore(table: string, id: string, deletedAtField: string = 'deleted_at'): Promise<boolean> {
    const query = `UPDATE ${table} SET ${deletedAtField} = NULL WHERE id = $1`;
    
    try {
      const result = await this.pool.query(query, [id]);
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      throw error;
    }
  }
}

// Export utility functions that don't require pool instance
export const buildSearchQuery = (search: string, fields: string[]): string => {
  if (!search || !fields.length) return '';
  
  return fields.map(field => `${field} ILIKE '%${search}%'`).join(' OR ');
};

export const sanitizeFieldName = (field: string): string => {
  // Remove any characters that could be used for SQL injection
  return field.replace(/[^a-zA-Z0-9_]/g, '');
};

export const buildInClause = (values: any[]): string => {
  if (!values.length) return '';
  return values.map((_, index) => `$${index + 1}`).join(', ');
}; 