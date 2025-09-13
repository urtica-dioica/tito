/**
 * Mock Database Service for Testing
 * 
 * This mock service provides the same interface as the real database service
 * but stores data in memory instead of connecting to PostgreSQL.
 */

export interface MockQueryResult {
  rows: any[];
  rowCount: number;
}

export interface MockDatabaseData {
  [tableName: string]: {
    [id: string]: any;
  };
}

export class MockDatabaseService {
  private data: MockDatabaseData = {};
  private sequenceCounters: { [sequenceName: string]: number } = {};

  constructor() {
    this.initializeSequences();
  }

  private initializeSequences(): void {
    // Initialize sequence counters
    this.sequenceCounters = {
      users_id_seq: 1,
      departments_id_seq: 1,
      employees_id_seq: 1,
      attendance_records_id_seq: 1,
      attendance_sessions_id_seq: 1,
      time_correction_requests_id_seq: 1,
      overtime_requests_id_seq: 1,
      leaves_id_seq: 1,
      leave_balances_id_seq: 1,
      payroll_periods_id_seq: 1,
      payroll_records_id_seq: 1,
      payroll_deductions_id_seq: 1,
      deduction_types_id_seq: 1,
      payroll_approvals_id_seq: 1,
      system_settings_id_seq: 1,
      id_cards_id_seq: 1
    };

    // Initialize table data
    this.data = {
      users: {},
      departments: {},
      employees: {},
      attendance_records: {},
      attendance_sessions: {},
      time_correction_requests: {},
      overtime_requests: {},
      leaves: {},
      leave_balances: {},
      payroll_periods: {},
      payroll_records: {},
      payroll_deductions: {},
      deduction_types: {},
      payroll_approvals: {},
      system_settings: {},
      id_cards: {}
    };
  }

  // Event emitter methods
  on(_event: string, _callback: (...args: any[]) => void): void {
    // Mock event emitter - do nothing for tests
  }

  // Connection methods
  async connect(): Promise<any> {
    return {
      query: this.query.bind(this),
      release: () => {}
    };
  }

  async query(query: string, values: any[] = []): Promise<MockQueryResult> {
    console.log('Mock DB: Query called:', query);
    const normalizedQuery = query.trim().toLowerCase();
    
    // Handle INSERT queries
    if (normalizedQuery.startsWith('insert into')) {
      return this.handleInsert(query, values);
    }
    
    // Handle SELECT queries
    if (normalizedQuery.startsWith('select')) {
      return this.handleSelect(query, values);
    }
    
    // Handle UPDATE queries
    if (normalizedQuery.startsWith('update')) {
      return this.handleUpdate(query, values);
    }
    
    // Handle DELETE queries
    if (normalizedQuery.startsWith('delete')) {
      return this.handleDelete(query, values);
    }
    
    // Handle ALTER SEQUENCE queries
    if (normalizedQuery.startsWith('alter sequence')) {
      return this.handleAlterSequence(query, values);
    }
    
    // Handle SET queries
    if (normalizedQuery.startsWith('set')) {
      return { rows: [], rowCount: 0 };
    }
    
    // Default response for other queries
    return { rows: [], rowCount: 0 };
  }

  private handleInsert(query: string, values: any[]): MockQueryResult {
    // Extract table name from INSERT query
    const tableMatch = query.match(/insert into\s+(\w+)/i);
    if (!tableMatch) {
      return { rows: [], rowCount: 0 };
    }
    
    const tableName = tableMatch[1];
    
    // Generate ID if not provided
    const id = this.generateId(tableName);
    
    // Create row data
    const row: any = { id };
    
    // Map values to columns (simplified - assumes values are in order)
    const columnMatch = query.match(/insert into\s+\w+\s*\(([^)]+)\)/i);
    if (columnMatch) {
      const columns = columnMatch[1].split(',').map(col => col.trim());
      columns.forEach((column, index) => {
        if (values[index] !== undefined) {
          row[column] = values[index];
        }
      });
    }
    
    // Store in mock data
    this.data[tableName][id] = row;
    
    // Return the inserted row
    return { rows: [row], rowCount: 1 };
  }

  private handleSelect(query: string, values: any[]): MockQueryResult {
    // Handle getDepartmentStats query (catch-all for department stats)
    if (query.includes('COUNT(*) as total') && 
        query.includes('FROM departments d') &&
        query.includes('LEFT JOIN employees e') &&
        query.includes('WHERE d.is_active = true')) {
      console.log('Mock DB: Handling getDepartmentStats query (catch-all):', query);
      const departmentsData = this.data.departments || {};
      const employeesData = this.data.employees || {};
      
      // Convert object to array
      const departments = Object.values(departmentsData);
      const employees = Object.values(employeesData);
      
      console.log('Mock DB: getDepartmentStats - Departments count:', departments.length);
      console.log('Mock DB: getDepartmentStats - Employees count:', employees.length);
      
      // Apply WHERE clause filtering if present
      let filteredDepartments = departments;
      if (query.toLowerCase().includes('where d.is_active = true')) {
        filteredDepartments = departments.filter((d: any) => d.is_active === true);
        console.log('Mock DB: getDepartmentStats - Filtered departments (active only):', filteredDepartments.length);
      }
      
      const total = filteredDepartments.length;
      const active = filteredDepartments.filter((d: any) => d.is_active !== false).length;
      const withHeads = filteredDepartments.filter((d: any) => d.department_head_user_id).length;
      const withoutHeads = filteredDepartments.filter((d: any) => !d.department_head_user_id).length;
      const totalEmployees = employees.filter((e: any) => e.status === 'active').length;
      const averageEmployeesPerDepartment = total > 0 ? totalEmployees / total : 0;

      const result = {
        rows: [{
          total: total,
          active: active,
          with_heads: withHeads,
          without_heads: withoutHeads,
          total_employees: totalEmployees,
          average_employees_per_department: averageEmployeesPerDepartment
        }],
        rowCount: 1
      };
      
      console.log('Mock DB: getDepartmentStats - Returning department stats:', result);
      return result;
    }

    // Handle COUNT(*) queries (case-insensitive)
    if (query.toLowerCase().includes('count(*)')) {
      const tableMatch = query.match(/from\s+(\w+)/i);
      if (!tableMatch) {
        return { rows: [{ count: '0' }], rowCount: 1 };
      }
      
      const tableName = tableMatch[1];
      const tableData = this.data[tableName] || {};
      let count = Object.keys(tableData).length;
      
      // Handle WHERE clauses for COUNT
      if (query.includes('where')) {
        let rows = Object.values(tableData);
        
        // Handle WHERE status = $1
        if (query.includes('where status = $1') && values[0]) {
          rows = rows.filter(row => row.status === values[0]);
        }
        
        // Handle WHERE employee_id = $1
        if (query.includes('where employee_id = $1') && values[0]) {
          rows = rows.filter(row => row.employee_id === values[0]);
        }
        
        count = rows.length;
      }
      
      return { rows: [{ count: count.toString() }], rowCount: 1 };
    }
    
    // Handle SUM queries (case-insensitive)
    if (query.toLowerCase().includes('sum(')) {
      const tableMatch = query.match(/from\s+(\w+)/i);
      if (!tableMatch) {
        return { rows: [{ total: '0' }], rowCount: 1 };
      }

      const tableName = tableMatch[1];
      const tableData = this.data[tableName] || {};
      let rows = Object.values(tableData);

      // Handle WHERE clauses for SUM
      if (query.includes('where')) {
        // Handle WHERE status = $1
        if (query.includes('where status = $1') && values[0]) {
          rows = rows.filter(row => row.status === values[0]);
        }
      }

      // Calculate sum (for simplicity, assume we're summing a numeric field)
      const sum = rows.reduce((total, row) => {
        // Try to find a numeric field to sum (net_pay, gross_pay, etc.)
        const numericFields = ['net_pay', 'gross_pay', 'total_deductions', 'total_benefits'];
        for (const field of numericFields) {
          if (row[field] !== undefined) {
            return total + (parseFloat(row[field]) || 0);
          }
        }
        return total;
      }, 0);

      return { rows: [{ total: sum.toString() }], rowCount: 1 };
    }

    // Handle getDepartmentStats query (simpler pattern)
    if (query.includes('COUNT(*) as total') && 
        query.includes('COUNT(*) FILTER') &&
        query.includes('FROM departments d') &&
        query.includes('LEFT JOIN employees e') &&
        query.includes('WHERE d.is_active = true')) {
      console.log('Mock DB: Handling getDepartmentStats query (simple pattern):', query);
      const departmentsData = this.data.departments || {};
      const employeesData = this.data.employees || {};
      
      // Convert object to array
      const departments = Object.values(departmentsData);
      const employees = Object.values(employeesData);
      
      console.log('Mock DB: getDepartmentStats - Departments count:', departments.length);
      console.log('Mock DB: getDepartmentStats - Employees count:', employees.length);
      
      // Apply WHERE clause filtering if present
      let filteredDepartments = departments;
      if (query.toLowerCase().includes('where d.is_active = true')) {
        filteredDepartments = departments.filter((d: any) => d.is_active === true);
        console.log('Mock DB: getDepartmentStats - Filtered departments (active only):', filteredDepartments.length);
      }
      
      const total = filteredDepartments.length;
      const active = filteredDepartments.filter((d: any) => d.is_active !== false).length;
      const withHeads = filteredDepartments.filter((d: any) => d.department_head_user_id).length;
      const withoutHeads = filteredDepartments.filter((d: any) => !d.department_head_user_id).length;
      const totalEmployees = employees.filter((e: any) => e.status === 'active').length;
      const averageEmployeesPerDepartment = total > 0 ? totalEmployees / total : 0;

      const result = {
        rows: [{
          total: total,
          active: active,
          with_heads: withHeads,
          without_heads: withoutHeads,
          total_employees: totalEmployees,
          average_employees_per_department: averageEmployeesPerDepartment
        }],
        rowCount: 1
      };
      
      console.log('Mock DB: getDepartmentStats - Returning department stats:', result);
      return result;
    }

    // Handle getDepartmentStats query (specific pattern)
    if (query.includes('COUNT(*) as total') && 
        query.includes('COUNT(*) FILTER (WHERE is_active = true) as active') &&
        query.includes('COUNT(*) FILTER (WHERE department_head_user_id IS NOT NULL) as with_heads') &&
        query.includes('FROM departments d') &&
        query.includes('LEFT JOIN employees e')) {
      console.log('Mock DB: Handling getDepartmentStats query:', query);
      const departmentsData = this.data.departments || {};
      const employeesData = this.data.employees || {};
      
      // Convert object to array
      const departments = Object.values(departmentsData);
      const employees = Object.values(employeesData);
      
      console.log('Mock DB: getDepartmentStats - Departments count:', departments.length);
      console.log('Mock DB: getDepartmentStats - Employees count:', employees.length);
      
      // Apply WHERE clause filtering if present
      let filteredDepartments = departments;
      if (query.toLowerCase().includes('where d.is_active = true')) {
        filteredDepartments = departments.filter((d: any) => d.is_active === true);
        console.log('Mock DB: getDepartmentStats - Filtered departments (active only):', filteredDepartments.length);
      }
      
      const total = filteredDepartments.length;
      const active = filteredDepartments.filter((d: any) => d.is_active !== false).length;
      const withHeads = filteredDepartments.filter((d: any) => d.department_head_user_id).length;
      const withoutHeads = filteredDepartments.filter((d: any) => !d.department_head_user_id).length;
      const totalEmployees = employees.filter((e: any) => e.status === 'active').length;
      const averageEmployeesPerDepartment = total > 0 ? totalEmployees / total : 0;

      const result = {
        rows: [{
          total: total,
          active: active,
          with_heads: withHeads,
          without_heads: withoutHeads,
          total_employees: totalEmployees,
          average_employees_per_department: averageEmployeesPerDepartment
        }],
        rowCount: 1
      };
      
      console.log('Mock DB: getDepartmentStats - Returning department stats:', result);
      return result;
    }

    // Handle complex department stats queries
    if (query.toLowerCase().includes('count(*)') && query.toLowerCase().includes('departments') && (query.toLowerCase().includes('filter') || query.includes('FILTER'))) {
      console.log('Mock DB: Handling department stats query:', query);
      const departmentsData = this.data.departments || {};
      const employeesData = this.data.employees || {};
      
      // Convert object to array
      const departments = Object.values(departmentsData);
      const employees = Object.values(employeesData);
      
      console.log('Mock DB: Departments count:', departments.length);
      console.log('Mock DB: Employees count:', employees.length);
      
      // Apply WHERE clause filtering if present
      let filteredDepartments = departments;
      if (query.toLowerCase().includes('where d.is_active = true')) {
        filteredDepartments = departments.filter((d: any) => d.is_active === true);
        console.log('Mock DB: Filtered departments (active only):', filteredDepartments.length);
      }
      
      const total = filteredDepartments.length;
      const active = filteredDepartments.filter((d: any) => d.is_active !== false).length;
      const withHeads = filteredDepartments.filter((d: any) => d.department_head_user_id).length;
      const withoutHeads = filteredDepartments.filter((d: any) => !d.department_head_user_id).length;
      const totalEmployees = employees.filter((e: any) => e.status === 'active').length;
      const averageEmployeesPerDepartment = total > 0 ? totalEmployees / total : 0;

      const result = {
        rows: [{
          total: total,
          active: active,
          with_heads: withHeads,
          without_heads: withoutHeads,
          total_employees: totalEmployees,
          average_employees_per_department: averageEmployeesPerDepartment
        }],
        rowCount: 1
      };
      
      console.log('Mock DB: Returning department stats:', result);
      return result;
    }

    // Handle specific department stats query pattern
    if (query.includes('COUNT(*) FILTER (WHERE is_active = true)') && query.includes('FROM departments d')) {
      console.log('Mock DB: Handling specific department stats query:', query);
      const departmentsData = this.data.departments || {};
      const employeesData = this.data.employees || {};
      
      // Convert object to array
      const departments = Object.values(departmentsData);
      const employees = Object.values(employeesData);
      
      console.log('Mock DB: Departments count:', departments.length);
      console.log('Mock DB: Employees count:', employees.length);
      
      // Apply WHERE clause filtering if present
      let filteredDepartments = departments;
      if (query.toLowerCase().includes('where d.is_active = true')) {
        filteredDepartments = departments.filter((d: any) => d.is_active === true);
        console.log('Mock DB: Filtered departments (active only):', filteredDepartments.length);
      }
      
      const total = filteredDepartments.length;
      const active = filteredDepartments.filter((d: any) => d.is_active !== false).length;
      const withHeads = filteredDepartments.filter((d: any) => d.department_head_user_id).length;
      const withoutHeads = filteredDepartments.filter((d: any) => !d.department_head_user_id).length;
      const totalEmployees = employees.filter((e: any) => e.status === 'active').length;
      const averageEmployeesPerDepartment = total > 0 ? totalEmployees / total : 0;

      const result = {
        rows: [{
          total: total,
          active: active,
          with_heads: withHeads,
          without_heads: withoutHeads,
          total_employees: totalEmployees,
          average_employees_per_department: averageEmployeesPerDepartment
        }],
        rowCount: 1
      };
      
      console.log('Mock DB: Returning department stats:', result);
      return result;
    }

    // Handle any department stats query with FILTER
    if (query.includes('FILTER') && query.includes('FROM departments d')) {
      console.log('Mock DB: Handling department stats query with FILTER:', query);
      const departmentsData = this.data.departments || {};
      const employeesData = this.data.employees || {};
      
      // Convert object to array
      const departments = Object.values(departmentsData);
      const employees = Object.values(employeesData);
      
      console.log('Mock DB: Departments count:', departments.length);
      console.log('Mock DB: Employees count:', employees.length);
      
      // Apply WHERE clause filtering if present
      let filteredDepartments = departments;
      if (query.toLowerCase().includes('where d.is_active = true')) {
        filteredDepartments = departments.filter((d: any) => d.is_active === true);
        console.log('Mock DB: Filtered departments (active only):', filteredDepartments.length);
      }
      
      const total = filteredDepartments.length;
      const active = filteredDepartments.filter((d: any) => d.is_active !== false).length;
      const withHeads = filteredDepartments.filter((d: any) => d.department_head_user_id).length;
      const withoutHeads = filteredDepartments.filter((d: any) => !d.department_head_user_id).length;
      const totalEmployees = employees.filter((e: any) => e.status === 'active').length;
      const averageEmployeesPerDepartment = total > 0 ? totalEmployees / total : 0;

      const result = {
        rows: [{
          total: total,
          active: active,
          with_heads: withHeads,
          without_heads: withoutHeads,
          total_employees: totalEmployees,
          average_employees_per_department: averageEmployeesPerDepartment
        }],
        rowCount: 1
      };
      
      console.log('Mock DB: Returning department stats:', result);
      return result;
    }

    // Handle department stats query with specific pattern
    if (query.includes('COUNT(*) FILTER (WHERE is_active = true)') && 
        query.includes('COUNT(*) FILTER (WHERE department_head_user_id IS NOT NULL)') &&
        query.includes('FROM departments d')) {
      console.log('Mock DB: Handling specific department stats query pattern:', query);
      const departmentsData = this.data.departments || {};
      const employeesData = this.data.employees || {};
      
      // Convert object to array
      const departments = Object.values(departmentsData);
      const employees = Object.values(employeesData);
      
      console.log('Mock DB: Departments count:', departments.length);
      console.log('Mock DB: Employees count:', employees.length);
      
      // Apply WHERE clause filtering if present
      let filteredDepartments = departments;
      if (query.toLowerCase().includes('where d.is_active = true')) {
        filteredDepartments = departments.filter((d: any) => d.is_active === true);
        console.log('Mock DB: Filtered departments (active only):', filteredDepartments.length);
      }
      
      const total = filteredDepartments.length;
      const active = filteredDepartments.filter((d: any) => d.is_active !== false).length;
      const withHeads = filteredDepartments.filter((d: any) => d.department_head_user_id).length;
      const withoutHeads = filteredDepartments.filter((d: any) => !d.department_head_user_id).length;
      const totalEmployees = employees.filter((e: any) => e.status === 'active').length;
      const averageEmployeesPerDepartment = total > 0 ? totalEmployees / total : 0;

      const result = {
        rows: [{
          total: total,
          active: active,
          with_heads: withHeads,
          without_heads: withoutHeads,
          total_employees: totalEmployees,
          average_employees_per_department: averageEmployeesPerDepartment
        }],
        rowCount: 1
      };
      
      console.log('Mock DB: Returning department stats:', result);
      return result;
    }

    // Handle any query with FILTER and departments (catch-all)
    if (query.includes('FILTER') && query.includes('departments')) {
      console.log('Mock DB: Handling FILTER + departments query (catch-all):', query);
      const departmentsData = this.data.departments || {};
      const employeesData = this.data.employees || {};
      
      // Convert object to array
      const departments = Object.values(departmentsData);
      const employees = Object.values(employeesData);
      
      console.log('Mock DB: Departments count:', departments.length);
      console.log('Mock DB: Employees count:', employees.length);
      
      // Apply WHERE clause filtering if present
      let filteredDepartments = departments;
      if (query.toLowerCase().includes('where d.is_active = true')) {
        filteredDepartments = departments.filter((d: any) => d.is_active === true);
        console.log('Mock DB: Filtered departments (active only):', filteredDepartments.length);
      }
      
      const total = filteredDepartments.length;
      const active = filteredDepartments.filter((d: any) => d.is_active !== false).length;
      const withHeads = filteredDepartments.filter((d: any) => d.department_head_user_id).length;
      const withoutHeads = filteredDepartments.filter((d: any) => !d.department_head_user_id).length;
      const totalEmployees = employees.filter((e: any) => e.status === 'active').length;
      const averageEmployeesPerDepartment = total > 0 ? totalEmployees / total : 0;

      const result = {
        rows: [{
          total: total,
          active: active,
          with_heads: withHeads,
          without_heads: withoutHeads,
          total_employees: totalEmployees,
          average_employees_per_department: averageEmployeesPerDepartment
        }],
        rowCount: 1
      };
      
      console.log('Mock DB: Returning department stats:', result);
      return result;
    }

    // Handle listDepartments query (returns actual department records)
    if (query.toLowerCase().includes('from departments d') && 
        query.toLowerCase().includes('left join users u') && 
        query.toLowerCase().includes('left join employees e') &&
        query.toLowerCase().includes('group by d.id')) {
      console.log('Mock DB: Handling listDepartments query:', query);
      const departmentsData = this.data.departments || {};
      const usersData = this.data.users || {};
      const employeesData = this.data.employees || {};
      
      // Convert object to array
      const departments = Object.values(departmentsData);
      const users = Object.values(usersData);
      const employees = Object.values(employeesData);
      
      console.log('Mock DB: listDepartments - Departments count:', departments.length);
      
      // Apply WHERE clause filtering if present
      let filteredDepartments = departments;
      if (query.toLowerCase().includes('where d.is_active = true')) {
        filteredDepartments = departments.filter((d: any) => d.is_active === true);
        console.log('Mock DB: listDepartments - Filtered departments (active only):', filteredDepartments.length);
      }
      
      // Apply pagination (LIMIT and OFFSET)
      let limit = 20; // default
      let offset = 0; // default
      if (values.length >= 2) {
        limit = values[0] || 20;
        offset = values[1] || 0;
      }
      
      // Sort by created_at DESC (default)
      filteredDepartments.sort((a: any, b: any) => {
        const dateA = new Date(a.created_at || 0);
        const dateB = new Date(b.created_at || 0);
        return dateB.getTime() - dateA.getTime();
      });
      
      // Apply pagination
      const paginatedDepartments = filteredDepartments.slice(offset, offset + limit);
      
      // Transform to match the expected format
      const result = {
        rows: paginatedDepartments.map((dept: any) => {
          // Find associated user (department head)
          const departmentHead = users.find((u: any) => u.id === dept.department_head_user_id);
          
          // Count employees in this department
          const employeeCount = employees.filter((e: any) => 
            e.department_id === dept.id && e.status === 'active'
          ).length;
          
          return {
            id: dept.id,
            name: dept.name,
            description: dept.description,
            departmentHeadUserId: dept.department_head_user_id,
            isActive: dept.is_active,
            createdAt: dept.created_at,
            updatedAt: dept.updated_at,
            head_id: departmentHead?.id || null,
            head_email: departmentHead?.email || null,
            head_first_name: departmentHead?.first_name || null,
            head_last_name: departmentHead?.last_name || null,
            employee_count: employeeCount.toString()
          };
        }),
        rowCount: paginatedDepartments.length
      };
      
      console.log('Mock DB: listDepartments - Returning', result.rows.length, 'departments');
      return result;
    }

    // Simple test condition - match any query with departments (for stats)
    if (query.toLowerCase().includes('from departments d')) {
      console.log('Mock DB: TEST - Found query with "FROM departments d":', query);
      const departmentsData = this.data.departments || {};
      const employeesData = this.data.employees || {};
      
      // Convert object to array
      const departments = Object.values(departmentsData);
      const employees = Object.values(employeesData);
      
      console.log('Mock DB: TEST - Departments count:', departments.length);
      console.log('Mock DB: TEST - Employees count:', employees.length);
      
      // Apply WHERE clause filtering if present
      let filteredDepartments = departments;
      if (query.toLowerCase().includes('where d.is_active = true')) {
        filteredDepartments = departments.filter((d: any) => d.is_active === true);
        console.log('Mock DB: TEST - Filtered departments (active only):', filteredDepartments.length);
      }
      
      const total = filteredDepartments.length;
      const active = filteredDepartments.filter((d: any) => d.is_active !== false).length;
      const withHeads = filteredDepartments.filter((d: any) => d.department_head_user_id).length;
      const withoutHeads = filteredDepartments.filter((d: any) => !d.department_head_user_id).length;
      const totalEmployees = employees.filter((e: any) => e.status === 'active').length;
      const averageEmployeesPerDepartment = total > 0 ? totalEmployees / total : 0;

      const result = {
        rows: [{
          total: total,
          active: active,
          with_heads: withHeads,
          without_heads: withoutHeads,
          total_employees: totalEmployees,
          average_employees_per_department: averageEmployeesPerDepartment
        }],
        rowCount: 1
      };
      
      console.log('Mock DB: TEST - Returning department stats:', result);
      return result;
    }
    
    // Extract table name from SELECT query
    const tableMatch = query.match(/from\s+(\w+)/i);
    if (!tableMatch) {
      return { rows: [], rowCount: 0 };
    }
    
    const tableName = tableMatch[1];
    const tableData = this.data[tableName] || {};
    
    // Simple WHERE clause handling
    let rows = Object.values(tableData);
    
    // Handle WHERE id = $1
    if (query.includes('where id = $1') && values[0]) {
      rows = rows.filter(row => row.id === values[0]);
    }
    
    // Handle WHERE email = $1
    if (query.includes('where email = $1') && values[0]) {
      rows = rows.filter(row => row.email === values[0]);
    }
    
    // Handle WHERE status = $1
    if (query.includes('where status = $1') && values[0]) {
      rows = rows.filter(row => row.status === values[0]);
    }
    
    // Handle WHERE employee_id = $1
    if (query.includes('where employee_id = $1') && values[0]) {
      rows = rows.filter(row => row.employee_id === values[0]);
    }
    
    // Handle WHERE attendance_record_id = $1
    if (query.includes('where attendance_record_id = $1') && values[0]) {
      rows = rows.filter(row => row.attendance_record_id === values[0]);
    }
    
    // Handle WHERE date = $1
    if (query.includes('where date = $1') && values[0]) {
      rows = rows.filter(row => row.date === values[0]);
    }
    
    // Handle ORDER BY
    if (query.includes('order by')) {
      if (query.includes('order by first_name, last_name')) {
        rows.sort((a, b) => {
          const nameA = `${a.first_name || ''} ${a.last_name || ''}`.trim();
          const nameB = `${b.first_name || ''} ${b.last_name || ''}`.trim();
          return nameA.localeCompare(nameB);
        });
      }
    }
    
    // Handle LIMIT
    if (query.includes('limit')) {
      const limitMatch = query.match(/limit\s+(\d+)/i);
      if (limitMatch) {
        const limit = parseInt(limitMatch[1]);
        rows = rows.slice(0, limit);
      }
    }
    
    return { rows, rowCount: rows.length };
  }

  private handleUpdate(query: string, values: any[]): MockQueryResult {
    // Extract table name from UPDATE query
    const tableMatch = query.match(/update\s+(\w+)/i);
    if (!tableMatch) {
      return { rows: [], rowCount: 0 };
    }
    
    const tableName = tableMatch[1];
    const tableData = this.data[tableName] || {};
    
    // Handle WHERE id = $1
    if (query.includes('where id = $1') && values[0]) {
      const id = values[0];
      if (tableData[id]) {
        // Update the row (simplified - assumes SET clause is at the end)
        const setMatch = query.match(/set\s+(.+?)\s+where/i);
        if (setMatch) {
          const setClause = setMatch[1];
          const updates = setClause.split(',').map(update => update.trim());
          updates.forEach(update => {
            const [column, value] = update.split('=').map(part => part.trim());
            if (value.startsWith('$')) {
              const paramIndex = parseInt(value.substring(1)) - 1;
              if (values[paramIndex] !== undefined) {
                tableData[id][column] = values[paramIndex];
              }
            }
          });
        }
        return { rows: [tableData[id]], rowCount: 1 };
      }
    }
    
    return { rows: [], rowCount: 0 };
  }

  private handleDelete(query: string, values: any[]): MockQueryResult {
    // Extract table name from DELETE query
    const tableMatch = query.match(/delete from\s+(\w+)/i);
    if (!tableMatch) {
      return { rows: [], rowCount: 0 };
    }
    
    const tableName = tableMatch[1];
    const tableData = this.data[tableName] || {};
    
    // Handle WHERE id = $1
    if (query.includes('where id = $1') && values[0]) {
      const id = values[0];
      if (tableData[id]) {
        delete tableData[id];
        return { rows: [], rowCount: 1 };
      }
    }
    
    // Handle DELETE FROM table (no WHERE clause)
    if (!query.includes('where')) {
      const rowCount = Object.keys(tableData).length;
      this.data[tableName] = {};
      return { rows: [], rowCount };
    }
    
    return { rows: [], rowCount: 0 };
  }

  private handleAlterSequence(query: string, _values: any[]): MockQueryResult {
    // Extract sequence name from ALTER SEQUENCE query
    const sequenceMatch = query.match(/alter sequence\s+(\w+)/i);
    if (sequenceMatch) {
      const sequenceName = sequenceMatch[1];
      this.sequenceCounters[sequenceName] = 1;
    }
    
    return { rows: [], rowCount: 0 };
  }

  private generateId(_tableName: string): string {
    // Generate a UUID-like ID
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `${timestamp}-${random}`;
  }

  // Test utilities
  getData(): MockDatabaseData {
    return { ...this.data };
  }

  clearData(): void {
    this.initializeSequences();
  }

  setData(tableName: string, data: any): void {
    this.data[tableName] = { ...data };
  }

  getTableData(tableName: string): any {
    return { ...this.data[tableName] };
  }
}

// Singleton instance for tests
export const mockDatabaseService = new MockDatabaseService();

// Export for use in tests
export default mockDatabaseService;
