import { Router } from 'express';
import { EmployeeController } from '../../controllers/hr/employeeController';
import { authenticate } from '../../middleware/auth/authenticate';
import { requireHR } from '../../middleware/auth/authorize';
import { validateBody, validateQuery, validateParams } from '../../middleware/validation/validate';
import { createEmployeeSchema, updateEmployeeSchema, employeeParamsSchema, employeeQuerySchema } from '../../middleware/validation/schemas/employeeSchemas';
import { uploadCSV, handleCSVUploadError } from '../../config/csvUpload';

const router = Router();
const employeeController = new EmployeeController();

// Apply authentication and HR admin authorization to all routes
router.use(authenticate);
router.use(requireHR);

/**
 * @route POST /api/v1/hr/employees
 * @desc Create a new employee
 * @access HR Admin only
 */
router.post(
  '/',
  validateBody(createEmployeeSchema),
  employeeController.createEmployee
);

/**
 * @route POST /api/v1/hr/employees/bulk
 * @desc Create multiple employees from CSV file
 * @access HR Admin only
 */
router.post(
  '/bulk',
  uploadCSV,
  handleCSVUploadError,
  employeeController.createBulkEmployees
);

/**
 * @route GET /api/v1/hr/employees
 * @desc List employees with filtering and pagination
 * @access HR Admin only
 */
router.get(
  '/',
  validateQuery(employeeQuerySchema),
  employeeController.listEmployees
);

/**
 * @route GET /api/v1/hr/employees/stats
 * @desc Get employee statistics
 * @access HR Admin only
 */
router.get(
  '/stats',
  employeeController.getEmployeeStats
);

/**
 * @route GET /api/v1/hr/employees/:id
 * @desc Get employee by ID
 * @access HR Admin only
 */
router.get(
  '/:id',
  validateParams(employeeParamsSchema),
  employeeController.getEmployee
);

/**
 * @route PUT /api/v1/hr/employees/:id
 * @desc Update employee
 * @access HR Admin only
 */
router.put(
  '/:id',
  validateParams(employeeParamsSchema),
  validateBody(updateEmployeeSchema),
  employeeController.updateEmployee
);

/**
 * @route DELETE /api/v1/hr/employees/:id
 * @desc Delete employee (soft delete)
 * @access HR Admin only
 */
router.delete(
  '/:id',
  validateParams(employeeParamsSchema),
  employeeController.deleteEmployee
);

/**
 * @route DELETE /api/v1/hr/employees/:id/hard-delete
 * @desc Hard delete employee (permanently remove from database)
 * @access HR Admin only
 */
router.delete(
  '/:id/hard-delete',
  validateParams(employeeParamsSchema),
  employeeController.hardDeleteEmployee
);

export default router;