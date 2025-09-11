import { Request, Response } from 'express';
import { leaveBalanceService } from '../../services/hr/leaveBalanceService';
import { generateRequestId } from '../../utils/requestId';
import logger from '../../utils/logger';

export class LeaveBalanceController {
  /**
   * List all leave balances with filtering and pagination
   */
  async listLeaveBalances(req: Request, res: Response): Promise<void> {
    const requestId = generateRequestId();
    
    try {
      const {
        page = 1,
        limit = 20,
        employeeId,
        departmentId,
        leaveType,
        year,
        search,
        sortBy = 'updated_at',
        sortOrder = 'desc'
      } = req.query;

      const params = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        employeeId: employeeId as string,
        departmentId: departmentId as string,
        leaveType: leaveType as 'vacation' | 'sick' | 'maternity' | 'other',
        year: year ? parseInt(year as string) : undefined,
        search: search as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc'
      };

      const result = await leaveBalanceService.listLeaveBalances(params);
      
      res.json({
        success: true,
        message: 'Leave balances retrieved successfully',
        data: result,
        requestId
      });
    } catch (error) {
      logger.error('List leave balances error', {
        error: (error as Error).message,
        requestId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve leave balances',
        error: (error as Error).message,
        requestId
      });
    }
  }

  /**
   * Get leave balance by ID
   */
  async getLeaveBalance(req: Request, res: Response): Promise<void> {
    const requestId = generateRequestId();
    
    try {
      const { id } = req.params;

      const balance = await leaveBalanceService.getLeaveBalanceById(id);

      if (!balance) {
        res.status(404).json({
          success: false,
          message: 'Leave balance not found',
          requestId
        });
        return;
      }

      res.json({
        success: true,
        message: 'Leave balance retrieved successfully',
        data: balance,
        requestId
      });
    } catch (error) {
      logger.error('Get leave balance error', {
        error: (error as Error).message,
        requestId,
        balanceId: req.params.id
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve leave balance',
        error: (error as Error).message,
        requestId
      });
    }
  }

  /**
   * Create or update leave balance
   */
  async createLeaveBalance(req: Request, res: Response): Promise<void> {
    const requestId = generateRequestId();
    
    try {
      const { employeeId, leaveType, balance } = req.body;

      if (!employeeId || !leaveType || balance === undefined) {
        res.status(400).json({
          success: false,
          message: 'Employee ID, leave type, and balance are required',
          requestId
        });
        return;
      }

      if (!['vacation', 'sick', 'maternity', 'other'].includes(leaveType)) {
        res.status(400).json({
          success: false,
          message: 'Invalid leave type. Must be one of: vacation, sick, maternity, other',
          requestId
        });
        return;
      }

      const balanceData = {
        employeeId,
        leaveType: leaveType as 'vacation' | 'sick' | 'maternity' | 'other',
        balance: parseFloat(balance)
      };

      const result = await leaveBalanceService.upsertLeaveBalance(balanceData);

      res.status(201).json({
        success: true,
        message: 'Leave balance created successfully',
        data: result,
        requestId
      });
    } catch (error) {
      logger.error('Create leave balance error', {
        error: (error as Error).message,
        requestId
      });

      res.status(400).json({
        success: false,
        message: 'Failed to create leave balance',
        error: (error as Error).message,
        requestId
      });
    }
  }

  /**
   * Update leave balance
   */
  async updateLeaveBalance(req: Request, res: Response): Promise<void> {
    const requestId = generateRequestId();
    
    try {
      const { id } = req.params;
      const { balance } = req.body;

      if (balance === undefined) {
        res.status(400).json({
          success: false,
          message: 'Balance must be provided',
          requestId
        });
        return;
      }

      const updateData = {
        balance: parseFloat(balance)
      };

      const result = await leaveBalanceService.updateLeaveBalance(id, updateData);

      if (!result) {
        res.status(404).json({
          success: false,
          message: 'Leave balance not found',
          requestId
        });
        return;
      }

      res.json({
        success: true,
        message: 'Leave balance updated successfully',
        data: result,
        requestId
      });
    } catch (error) {
      logger.error('Update leave balance error', {
        error: (error as Error).message,
        requestId,
        balanceId: req.params.id
      });

      res.status(400).json({
        success: false,
        message: 'Failed to update leave balance',
        error: (error as Error).message,
        requestId
      });
    }
  }

  /**
   * Delete leave balance
   */
  async deleteLeaveBalance(req: Request, res: Response): Promise<void> {
    const requestId = generateRequestId();
    
    try {
      const { id } = req.params;

      const deleted = await leaveBalanceService.deleteLeaveBalance(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: 'Leave balance not found',
          requestId
        });
        return;
      }

      res.json({
        success: true,
        message: 'Leave balance deleted successfully',
        requestId
      });
    } catch (error) {
      logger.error('Delete leave balance error', {
        error: (error as Error).message,
        requestId,
        balanceId: req.params.id
      });

      res.status(500).json({
        success: false,
        message: 'Failed to delete leave balance',
        error: (error as Error).message,
        requestId
      });
    }
  }

  /**
   * Bulk create/update leave balances
   */
  async bulkUpdateLeaveBalances(req: Request, res: Response): Promise<void> {
    const requestId = generateRequestId();
    
    try {
      const { balances } = req.body;

      if (!Array.isArray(balances) || balances.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Balances array is required and must not be empty',
          requestId
        });
        return;
      }

      // Validate each balance
      for (const balance of balances) {
        if (!balance.employeeId || !balance.leaveType || balance.balance === undefined) {
          res.status(400).json({
            success: false,
            message: 'Each balance must have employeeId, leaveType, and balance',
            requestId
          });
          return;
        }

        if (!['vacation', 'sick', 'maternity', 'other'].includes(balance.leaveType)) {
          res.status(400).json({
            success: false,
            message: `Invalid leave type: ${balance.leaveType}. Must be one of: vacation, sick, maternity, other`,
            requestId
          });
          return;
        }
      }

      const results = await leaveBalanceService.bulkUpsertLeaveBalances(balances);

      res.json({
        success: true,
        message: `Successfully processed ${results.length} leave balances`,
        data: results,
        requestId
      });
    } catch (error) {
      logger.error('Bulk update leave balances error', {
        error: (error as Error).message,
        requestId
      });

      res.status(400).json({
        success: false,
        message: 'Failed to bulk update leave balances',
        error: (error as Error).message,
        requestId
      });
    }
  }

  /**
   * Initialize leave balances for all employees
   */
  async initializeLeaveBalances(req: Request, res: Response): Promise<void> {
    const requestId = generateRequestId();
    
    try {
      const { vacationDays = 15, sickDays = 10, maternityDays = 0, otherDays = 0 } = req.body;

      const result = await leaveBalanceService.initializeLeaveBalances(
        parseFloat(vacationDays),
        parseFloat(sickDays),
        parseFloat(maternityDays),
        parseFloat(otherDays)
      );

      res.json({
        success: true,
        message: `Successfully initialized leave balances for ${result.employeesProcessed} employees`,
        data: result,
        requestId
      });
    } catch (error) {
      logger.error('Initialize leave balances error', {
        error: (error as Error).message,
        requestId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to initialize leave balances',
        error: (error as Error).message,
        requestId
      });
    }
  }

  /**
   * Get leave balance statistics
   */
  async getLeaveBalanceStats(req: Request, res: Response): Promise<void> {
    const requestId = generateRequestId();
    
    try {
      const { departmentId } = req.query;

      const stats = await leaveBalanceService.getLeaveBalanceStats(
        departmentId as string
      );

      res.json({
        success: true,
        message: 'Leave balance statistics retrieved successfully',
        data: stats,
        requestId
      });
    } catch (error) {
      logger.error('Get leave balance stats error', {
        error: (error as Error).message,
        requestId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve leave balance statistics',
        error: (error as Error).message,
        requestId
      });
    }
  }

  /**
   * Get employee leave balances
   */
  async getEmployeeLeaveBalances(req: Request, res: Response): Promise<void> {
    const requestId = generateRequestId();
    
    try {
      const { employeeId } = req.params;

      const balances = await leaveBalanceService.getEmployeeLeaveBalances(employeeId);

      res.json({
        success: true,
        message: 'Employee leave balances retrieved successfully',
        data: balances,
        requestId
      });
    } catch (error) {
      logger.error('Get employee leave balances error', {
        error: (error as Error).message,
        requestId,
        employeeId: req.params.employeeId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve employee leave balances',
        error: (error as Error).message,
        requestId
      });
    }
  }

  /**
   * Get employees without leave balances
   */
  async getEmployeesWithoutLeaveBalances(req: Request, res: Response): Promise<void> {
    const requestId = generateRequestId();
    
    try {
      const { departmentId } = req.query;

      const employees = await leaveBalanceService.getEmployeesWithoutLeaveBalances(
        departmentId as string
      );

      res.json({
        success: true,
        message: 'Employees without leave balances retrieved successfully',
        data: employees,
        requestId
      });
    } catch (error) {
      logger.error('Get employees without leave balances error', {
        error: (error as Error).message,
        requestId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve employees without leave balances',
        error: (error as Error).message,
        requestId
      });
    }
  }

  /**
   * Get leave balance templates by position
   */
  async getLeaveBalanceTemplates(_req: Request, res: Response): Promise<void> {
    const requestId = generateRequestId();
    
    try {
      const templates = await leaveBalanceService.getLeaveBalanceTemplates();

      res.json({
        success: true,
        message: 'Leave balance templates retrieved successfully',
        data: templates,
        requestId
      });
    } catch (error) {
      logger.error('Get leave balance templates error', {
        error: (error as Error).message,
        requestId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve leave balance templates',
        error: (error as Error).message,
        requestId
      });
    }
  }
}

export const leaveBalanceController = new LeaveBalanceController();
