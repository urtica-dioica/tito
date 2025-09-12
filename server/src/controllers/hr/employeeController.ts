import { Request, Response } from 'express';
import { EmployeeService, CreateEmployeeData, UpdateEmployeeData, EmployeeListParams } from '../../services/hr/employeeService';
import logger from '../../utils/logger';
import { getRequestId } from '../../utils/types/express';
import * as Papa from 'papaparse';
import fs from 'fs';

export class EmployeeController {
  private employeeService: EmployeeService;

  constructor() {
    this.employeeService = new EmployeeService();
  }

  /**
   * Create a new employee
   */
  createEmployee = async (req: Request, res: Response): Promise<void> => {
    try {
      const requestId = getRequestId(req);
      const data: CreateEmployeeData = req.body;

      // Validate required fields
      if (!data.email || !data.firstName || !data.lastName || !data.departmentId || 
          !data.position || !data.employmentType || !data.hireDate || !data.baseSalary) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields',
          requestId
        });
        return;
      }

      const employee = await this.employeeService.createEmployee(data);

      res.status(201).json({
        success: true,
        message: 'Employee created successfully',
        data: employee,
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error('Failed to create employee', { error: (error as Error).message, requestId });
      
      res.status(400).json({
        success: false,
        message: (error as Error).message || 'Failed to create employee',
        requestId
      });
    }
  };

  /**
   * Get employee by ID
   */
  getEmployee = async (req: Request, res: Response): Promise<void> => {
    try {
      const requestId = getRequestId(req);
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Employee ID is required',
          requestId
        });
        return;
      }

      const employee = await this.employeeService.getEmployeeWithUser(id);

      res.status(200).json({
        success: true,
        message: 'Employee retrieved successfully',
        data: employee,
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error('Failed to get employee', { error: (error as Error).message, requestId });
      
      const statusCode = (error as Error).message === 'Employee not found' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: (error as Error).message || 'Failed to get employee',
        requestId
      });
    }
  };

  /**
   * List employees with filtering and pagination
   */
  listEmployees = async (req: Request, res: Response): Promise<void> => {
    try {
      const requestId = getRequestId(req);
      const params: EmployeeListParams = {
        page: req.query['page'] ? parseInt(req.query['page'] as string) : undefined,
        limit: req.query['limit'] ? parseInt(req.query['limit'] as string) : undefined,
        search: req.query['search'] as string,
        departmentId: req.query['departmentId'] as string,
        status: req.query['status'] as string,
        employmentType: req.query['employmentType'] as string,
        sortBy: req.query['sortBy'] as string,
        sortOrder: req.query['sortOrder'] as 'asc' | 'desc'
      };

      const result = await this.employeeService.listEmployees(params);

      res.status(200).json({
        success: true,
        message: 'Employees retrieved successfully',
        data: result.employees,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages
        },
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error('Failed to list employees', { error: (error as Error).message, requestId });
      
      res.status(400).json({
        success: false,
        message: (error as Error).message || 'Failed to list employees',
        requestId
      });
    }
  };

  /**
   * Update employee
   */
  updateEmployee = async (req: Request, res: Response): Promise<void> => {
    try {
      const requestId = getRequestId(req);
      const { id } = req.params;
      const data: UpdateEmployeeData = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Employee ID is required',
          requestId
        });
        return;
      }

      const employee = await this.employeeService.updateEmployee(id, data);

      res.status(200).json({
        success: true,
        message: 'Employee updated successfully',
        data: employee,
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error('Failed to update employee', { error: (error as Error).message, requestId });
      
      const statusCode = (error as Error).message === 'Employee not found' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: (error as Error).message || 'Failed to update employee',
        requestId
      });
    }
  };

  /**
   * Delete employee (soft delete)
   */
  deleteEmployee = async (req: Request, res: Response): Promise<void> => {
    try {
      const requestId = getRequestId(req);
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Employee ID is required',
          requestId
        });
        return;
      }

      await this.employeeService.deleteEmployee(id);

      res.status(200).json({
        success: true,
        message: 'Employee deleted successfully',
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error('Failed to delete employee', { error: (error as Error).message, requestId });
      
      const statusCode = (error as Error).message === 'Employee not found' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: (error as Error).message || 'Failed to delete employee',
        requestId
      });
    }
  };

  /**
   * Hard delete employee (permanently remove from database)
   */
  hardDeleteEmployee = async (req: Request, res: Response): Promise<void> => {
    try {
      const requestId = getRequestId(req);
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Employee ID is required',
          requestId
        });
        return;
      }

      await this.employeeService.hardDeleteEmployee(id);

      res.status(200).json({
        success: true,
        message: 'Employee permanently deleted successfully',
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error('Failed to hard delete employee', { error: (error as Error).message, requestId });
      
      const statusCode = (error as Error).message === 'Employee not found' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: (error as Error).message || 'Failed to permanently delete employee',
        requestId
      });
    }
  };

  /**
   * Get employee statistics
   */
  getEmployeeStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const requestId = getRequestId(req);

      const stats = await this.employeeService.getEmployeeStats();

      res.status(200).json({
        success: true,
        message: 'Employee statistics retrieved successfully',
        data: stats,
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error('Failed to get employee statistics', { error: (error as Error).message, requestId });
      
      res.status(400).json({
        success: false,
        message: (error as Error).message || 'Failed to get employee statistics',
        requestId
      });
    }
  };

  /**
   * Create multiple employees from CSV file
   */
  createBulkEmployees = async (req: Request, res: Response): Promise<void> => {
    const requestId = getRequestId(req);
    
    try {
      // Check if file was uploaded
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'No CSV file uploaded',
          requestId
        });
        return;
      }

      const csvFilePath = req.file.path;
      
      // Read and parse CSV file
      const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
      
      // Parse CSV with Papa Parse
      const parseResult = Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, ''),
        transform: (value) => value.trim()
      });

      if (parseResult.errors.length > 0) {
        // Clean up uploaded file
        fs.unlinkSync(csvFilePath);
        
        res.status(400).json({
          success: false,
          message: 'CSV parsing errors',
          errors: parseResult.errors,
          requestId
        });
        return;
      }

      // Validate CSV headers
      const requiredHeaders = ['email', 'firstname', 'lastname', 'departmentid', 'position', 'employmenttype', 'hiredate', 'basesalary'];
      const csvHeaders = Object.keys(parseResult.data[0] || {});
      const missingHeaders = requiredHeaders.filter(header => !csvHeaders.includes(header));
      
      if (missingHeaders.length > 0) {
        // Clean up uploaded file
        fs.unlinkSync(csvFilePath);
        
        res.status(400).json({
          success: false,
          message: `Missing required CSV headers: ${missingHeaders.join(', ')}`,
          requiredHeaders,
          foundHeaders: csvHeaders,
          requestId
        });
        return;
      }

      // Transform CSV data to CreateEmployeeData format
      const employeesData: CreateEmployeeData[] = parseResult.data.map((row: any) => ({
        email: row.email,
        firstName: row.firstname,
        lastName: row.lastname,
        departmentId: row.departmentid,
        position: row.position,
        employmentType: row.employmenttype.toLowerCase(),
        hireDate: new Date(row.hiredate),
        baseSalary: parseFloat(row.basesalary)
      }));

      // Validate that we have data to process
      if (employeesData.length === 0) {
        // Clean up uploaded file
        fs.unlinkSync(csvFilePath);
        
        res.status(400).json({
          success: false,
          message: 'No valid employee data found in CSV file',
          requestId
        });
        return;
      }

      // Process bulk employee creation
      const results = await this.employeeService.createBulkEmployees(employeesData);

      // Clean up uploaded file
      fs.unlinkSync(csvFilePath);

      // Return results
      res.status(200).json({
        success: true,
        message: `Bulk employee creation completed: ${results.successCount} successful, ${results.errorCount} failed`,
        data: {
          totalProcessed: results.totalProcessed,
          successCount: results.successCount,
          errorCount: results.errorCount,
          successfulEmployees: results.success,
          errors: results.errors
        },
        requestId
      });

    } catch (error) {
      const requestId = getRequestId(req);
      logger.error('Failed to create bulk employees', { error: (error as Error).message, requestId });
      
      // Clean up uploaded file if it exists
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      res.status(500).json({
        success: false,
        message: (error as Error).message || 'Failed to process bulk employee creation',
        requestId
      });
    }
  };
}