import { Request, Response } from 'express';
import { DepartmentService, CreateDepartmentData, UpdateDepartmentData, DepartmentListParams } from '../../services/hr/departmentService';
import logger from '../../utils/logger';
import { getRequestId } from '../../utils/types/express';

export class DepartmentController {
  private departmentService: DepartmentService;

  constructor() {
    this.departmentService = new DepartmentService();
  }

  /**
   * Create a new department
   */
  createDepartment = async (req: Request, res: Response): Promise<void> => {
    try {
      const requestId = getRequestId(req);
      const data: CreateDepartmentData = req.body;

      // Validate required fields
      if (!data.name) {
        res.status(400).json({
          success: false,
          message: 'Department name is required',
          requestId
        });
        return;
      }

      const department = await this.departmentService.createDepartment(data);

      res.status(201).json({
        success: true,
        message: 'Department created successfully',
        data: department,
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error('Failed to create department', { error: (error as Error).message, requestId });
      
      res.status(400).json({
        success: false,
        message: (error as Error).message || 'Failed to create department',
        requestId
      });
    }
  };

  /**
   * Get department by ID
   */
  getDepartment = async (req: Request, res: Response): Promise<void> => {
    try {
      const requestId = getRequestId(req);
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Department ID is required',
          requestId
        });
        return;
      }

      const department = await this.departmentService.getDepartmentWithHead(id);

      res.status(200).json({
        success: true,
        message: 'Department retrieved successfully',
        data: department,
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error('Failed to get department', { error: (error as Error).message, requestId });
      
      const statusCode = (error as Error).message === 'Department not found' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: (error as Error).message || 'Failed to get department',
        requestId
      });
    }
  };

  /**
   * List departments with filtering and pagination
   */
  listDepartments = async (req: Request, res: Response): Promise<void> => {
    try {
      const requestId = getRequestId(req);
      const params: DepartmentListParams = {
        page: req.query["page"] ? parseInt(req.query["page"] as string) : undefined,
        limit: req.query["limit"] ? parseInt(req.query["limit"] as string) : undefined,
        search: req.query["search"] as string,
        isActive: req.query["isActive"] ? req.query["isActive"] === 'true' : undefined,
        sortBy: req.query["sortBy"] as string,
        sortOrder: req.query["sortOrder"] as 'asc' | 'desc'
      };

      const result = await this.departmentService.listDepartments(params);

      res.status(200).json({
        success: true,
        message: 'Departments retrieved successfully',
        data: result.departments,
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
      logger.error('Failed to list departments', { error: (error as Error).message, requestId });
      
      res.status(400).json({
        success: false,
        message: (error as Error).message || 'Failed to list departments',
        requestId
      });
    }
  };

  /**
   * Update department
   */
  updateDepartment = async (req: Request, res: Response): Promise<void> => {
    try {
      const requestId = getRequestId(req);
      const { id } = req.params;
      const data: UpdateDepartmentData = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Department ID is required',
          requestId
        });
        return;
      }

      const department = await this.departmentService.updateDepartment(id, data);

      res.status(200).json({
        success: true,
        message: 'Department updated successfully',
        data: department,
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error('Failed to update department', { error: (error as Error).message, requestId });
      
      const statusCode = (error as Error).message === 'Department not found' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: (error as Error).message || 'Failed to update department',
        requestId
      });
    }
  };

  /**
   * Delete department (soft delete)
   */
  deleteDepartment = async (req: Request, res: Response): Promise<void> => {
    try {
      const requestId = getRequestId(req);
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Department ID is required',
          requestId
        });
        return;
      }

      await this.departmentService.deleteDepartment(id);

      res.status(200).json({
        success: true,
        message: 'Department deleted successfully',
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error('Failed to delete department', { error: (error as Error).message, requestId });
      
      const statusCode = (error as Error).message === 'Department not found' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: (error as Error).message || 'Failed to delete department',
        requestId
      });
    }
  };

  /**
   * Hard delete department (permanently remove from database)
   */
  hardDeleteDepartment = async (req: Request, res: Response): Promise<void> => {
    try {
      const requestId = getRequestId(req);
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Department ID is required',
          requestId
        });
        return;
      }

      await this.departmentService.hardDeleteDepartment(id);

      res.status(200).json({
        success: true,
        message: 'Department permanently deleted successfully',
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error('Failed to hard delete department', { error: (error as Error).message, requestId });
      
      const statusCode = (error as Error).message === 'Department not found' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: (error as Error).message || 'Failed to permanently delete department',
        requestId
      });
    }
  };

  /**
   * Assign department head
   */
  assignDepartmentHead = async (req: Request, res: Response): Promise<void> => {
    try {
      const requestId = getRequestId(req);
      const { id } = req.params;
      const { userId } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Department ID is required',
          requestId
        });
        return;
      }

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'User ID is required',
          requestId
        });
        return;
      }

      const department = await this.departmentService.assignDepartmentHead(id, userId);

      res.status(200).json({
        success: true,
        message: 'Department head assigned successfully',
        data: department,
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error('Failed to assign department head', { error: (error as Error).message, requestId });
      
      res.status(400).json({
        success: false,
        message: (error as Error).message || 'Failed to assign department head',
        requestId
      });
    }
  };

  /**
   * Remove department head
   */
  removeDepartmentHead = async (req: Request, res: Response): Promise<void> => {
    try {
      const requestId = getRequestId(req);
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Department ID is required',
          requestId
        });
        return;
      }

      const department = await this.departmentService.removeDepartmentHead(id);

      res.status(200).json({
        success: true,
        message: 'Department head removed successfully',
        data: department,
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error('Failed to remove department head', { error: (error as Error).message, requestId });
      
      res.status(400).json({
        success: false,
        message: (error as Error).message || 'Failed to remove department head',
        requestId
      });
    }
  };

  /**
   * Get department statistics
   */
  getDepartmentStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const requestId = getRequestId(req);

      const stats = await this.departmentService.getDepartmentStats();

      res.status(200).json({
        success: true,
        message: 'Department statistics retrieved successfully',
        data: stats,
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error('Failed to get department statistics', { error: (error as Error).message, requestId });
      
      res.status(400).json({
        success: false,
        message: (error as Error).message || 'Failed to get department statistics',
        requestId
      });
    }
  };

  /**
   * Get all department heads
   */
  getDepartmentHeads = async (req: Request, res: Response): Promise<void> => {
    try {
      const requestId = getRequestId(req);
      const { page = 1, limit = 25, search = '', status = '' } = req.query;

      const params = {
        page: Number(page),
        limit: Number(limit),
        search: search as string,
        status: status as string,
      };

      const result = await this.departmentService.getDepartmentHeads(params);

      res.json({
        success: true,
        message: 'Department heads retrieved successfully',
        data: result,
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error('Failed to get department heads', { error: (error as Error).message, requestId });
      
      res.status(400).json({
        success: false,
        message: (error as Error).message || 'Failed to get department heads',
        requestId
      });
    }
  };

  /**
   * Get department head by ID
   */
  getDepartmentHeadById = async (req: Request, res: Response): Promise<void> => {
    try {
      const requestId = getRequestId(req);
      const { id } = req.params;

      const departmentHead = await this.departmentService.getDepartmentHeadById(id);

      if (!departmentHead) {
        res.status(404).json({
          success: false,
          message: 'Department head not found',
          requestId
        });
        return;
      }

      res.json({
        success: true,
        message: 'Department head retrieved successfully',
        data: departmentHead,
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error('Failed to get department head', { error: (error as Error).message, requestId });
      
      res.status(400).json({
        success: false,
        message: (error as Error).message || 'Failed to get department head',
        requestId
      });
    }
  };

  /**
   * Create a new department head user
   */
  createDepartmentHead = async (req: Request, res: Response): Promise<void> => {
    try {
      const requestId = getRequestId(req);
      const data = req.body;

      // Validate required fields
      if (!data.firstName || !data.lastName || !data.email) {
        res.status(400).json({
          success: false,
          message: 'First name, last name, and email are required',
          requestId
        });
        return;
      }

      const departmentHead = await this.departmentService.createDepartmentHead(data);

      res.status(201).json({
        success: true,
        message: 'Department head created successfully',
        data: departmentHead,
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error('Failed to create department head', { error: (error as Error).message, requestId });
      
      res.status(400).json({
        success: false,
        message: (error as Error).message || 'Failed to create department head',
        requestId
      });
    }
  };

  /**
   * Update department head
   */
  updateDepartmentHead = async (req: Request, res: Response): Promise<void> => {
    try {
      const requestId = getRequestId(req);
      const { id } = req.params;
      const data = req.body;

      const departmentHead = await this.departmentService.updateDepartmentHead(id, data);

      if (!departmentHead) {
        res.status(404).json({
          success: false,
          message: 'Department head not found',
          requestId
        });
        return;
      }

      res.json({
        success: true,
        message: 'Department head updated successfully',
        data: departmentHead,
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error('Failed to update department head', { error: (error as Error).message, requestId });
      
      res.status(400).json({
        success: false,
        message: (error as Error).message || 'Failed to update department head',
        requestId
      });
    }
  };

  /**
   * Delete department head
   */
  deleteDepartmentHead = async (req: Request, res: Response): Promise<void> => {
    try {
      const requestId = getRequestId(req);
      const { id } = req.params;

      await this.departmentService.deleteDepartmentHead(id);

      res.json({
        success: true,
        message: 'Department head deleted successfully',
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error('Failed to delete department head', { error: (error as Error).message, requestId });
      
      res.status(400).json({
        success: false,
        message: (error as Error).message || 'Failed to delete department head',
        requestId
      });
    }
  };

  /**
   * Get employees in a department
   */
  getDepartmentEmployees = async (req: Request, res: Response): Promise<void> => {
    try {
      const requestId = getRequestId(req);
      const { id } = req.params;

      const employees = await this.departmentService.getDepartmentEmployees(id);

      res.json({
        success: true,
        data: employees,
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error('Failed to get department employees', { error: (error as Error).message, requestId });
      
      res.status(400).json({
        success: false,
        message: (error as Error).message || 'Failed to get department employees',
        requestId
      });
    }
  };
}