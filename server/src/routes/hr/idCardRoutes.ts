import { Router } from 'express';
import { IdCardController } from '../../controllers/hr/idCardController';
import { authenticate } from '../../middleware/auth/authenticate';
import { requireHR } from '../../middleware/auth/authorize';
import { validateParams, validateBody } from '../../middleware/validation/validate';
import { idCardParamsSchema, departmentIdParamsSchema, generateDepartmentIdCardsSchema } from '../../middleware/validation/schemas/idCardSchemas';

const router = Router();
const idCardController = new IdCardController();

// Apply authentication and HR admin authorization to all routes
router.use(authenticate);
router.use(requireHR);

/**
 * @route POST /api/v1/hr/id-cards
 * @desc Create ID card for employee
 * @access HR Admin only
 */
router.post(
  '/',
  idCardController.createIdCard
);

/**
 * @route GET /api/v1/hr/id-cards
 * @desc List ID cards with filtering and pagination
 * @access HR Admin only
 */
router.get(
  '/',
  idCardController.listIdCards
);

/**
 * @route GET /api/v1/hr/id-cards/stats
 * @desc Get ID card statistics
 * @access HR Admin only
 */
router.get(
  '/stats',
  idCardController.getIdCardStats
);

/**
 * @route GET /api/v1/hr/id-cards/:id
 * @desc Get ID card by ID
 * @access HR Admin only
 */
router.get(
  '/:id',
  validateParams(idCardParamsSchema),
  idCardController.getIdCard
);

/**
 * @route DELETE /api/v1/hr/id-cards/:id
 * @desc Deactivate ID card
 * @access HR Admin only
 */
router.delete(
  '/:id',
  validateParams(idCardParamsSchema),
  idCardController.deactivateIdCard
);

/**
 * @route POST /api/v1/hr/id-cards/departments/:departmentId/generate
 * @desc Generate ID cards for all employees in a department
 * @access HR Admin only
 */
router.post(
  '/departments/:departmentId/generate',
  validateParams(departmentIdParamsSchema),
  validateBody(generateDepartmentIdCardsSchema),
  idCardController.generateDepartmentIdCards
);

export default router;