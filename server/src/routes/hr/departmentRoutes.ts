import { Router } from 'express';
import { DepartmentController } from '../../controllers/hr/departmentController';
import { authenticate } from '../../middleware/auth/authenticate';
import { requireHR } from '../../middleware/auth/authorize';
import { validateBody, validateQuery, validateParams } from '../../middleware/validation/validate';
import { createDepartmentSchema, updateDepartmentSchema, departmentParamsSchema, departmentQuerySchema, assignDepartmentHeadSchema, departmentHeadsQuerySchema, createDepartmentHeadSchema } from '../../middleware/validation/schemas/departmentSchemas';

const router = Router();
const departmentController = new DepartmentController();

// Apply authentication and HR admin authorization to all routes
router.use(authenticate);
router.use(requireHR);

/**
 * @route POST /api/v1/hr/departments
 * @desc Create a new department
 * @access HR Admin only
 */
router.post(
  '/',
  validateBody(createDepartmentSchema),
  departmentController.createDepartment
);

/**
 * @route GET /api/v1/hr/departments
 * @desc List departments with filtering and pagination
 * @access HR Admin only
 */
router.get(
  '/',
  validateQuery(departmentQuerySchema),
  departmentController.listDepartments
);

/**
 * @route GET /api/v1/hr/departments/stats
 * @desc Get department statistics
 * @access HR Admin only
 */
router.get(
  '/stats',
  departmentController.getDepartmentStats
);

// Department Head Management Routes

/**
 * @route GET /api/v1/hr/departments/heads
 * @desc List all department heads with filtering and pagination
 * @access HR Admin only
 */
router.get(
  '/heads',
  validateQuery(departmentHeadsQuerySchema),
  departmentController.getDepartmentHeads
);

/**
 * @route GET /api/v1/hr/departments/heads/:id
 * @desc Get department head by ID
 * @access HR Admin only
 */
router.get(
  '/heads/:id',
  validateParams(departmentParamsSchema),
  departmentController.getDepartmentHeadById
);

/**
 * @route POST /api/v1/hr/departments/heads
 * @desc Create a new department head user
 * @access HR Admin only
 */
router.post(
  '/heads',
  validateBody(createDepartmentHeadSchema),
  departmentController.createDepartmentHead
);

/**
 * @route PUT /api/v1/hr/departments/heads/:id
 * @desc Update department head
 * @access HR Admin only
 */
router.put(
  '/heads/:id',
  validateParams(departmentParamsSchema),
  departmentController.updateDepartmentHead
);

/**
 * @route DELETE /api/v1/hr/departments/heads/:id
 * @desc Delete department head
 * @access HR Admin only
 */
router.delete(
  '/heads/:id',
  validateParams(departmentParamsSchema),
  departmentController.deleteDepartmentHead
);

/**
 * @route GET /api/v1/hr/departments/:id
 * @desc Get department by ID
 * @access HR Admin only
 */
router.get(
  '/:id',
  validateParams(departmentParamsSchema),
  departmentController.getDepartment
);

/**
 * @route PUT /api/v1/hr/departments/:id
 * @desc Update department
 * @access HR Admin only
 */
router.put(
  '/:id',
  validateParams(departmentParamsSchema),
  validateBody(updateDepartmentSchema),
  departmentController.updateDepartment
);

/**
 * @route DELETE /api/v1/hr/departments/:id
 * @desc Delete department (soft delete)
 * @access HR Admin only
 */
router.delete(
  '/:id',
  validateParams(departmentParamsSchema),
  departmentController.deleteDepartment
);

/**
 * @route DELETE /api/v1/hr/departments/:id/hard-delete
 * @desc Hard delete department (permanently remove from database)
 * @access HR Admin only
 */
router.delete(
  '/:id/hard-delete',
  validateParams(departmentParamsSchema),
  departmentController.hardDeleteDepartment
);

/**
 * @route POST /api/v1/hr/departments/:id/assign-head
 * @desc Assign department head
 * @access HR Admin only
 */
router.post(
  '/:id/assign-head',
  validateParams(departmentParamsSchema),
  validateBody(assignDepartmentHeadSchema),
  departmentController.assignDepartmentHead
);

/**
 * @route DELETE /api/v1/hr/departments/:id/remove-head
 * @desc Remove department head
 * @access HR Admin only
 */
router.delete(
  '/:id/remove-head',
  validateParams(departmentParamsSchema),
  departmentController.removeDepartmentHead
);

/**
 * @route GET /api/v1/hr/departments/:id/employees
 * @desc Get employees in a department
 * @access HR Admin only
 */
router.get(
  '/:id/employees',
  validateParams(departmentParamsSchema),
  departmentController.getDepartmentEmployees
);

export default router;