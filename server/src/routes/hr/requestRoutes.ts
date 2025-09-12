import { Router } from 'express';
import { authenticate } from '../../middleware/auth/authenticate';
import { requireHR } from '../../middleware/auth/authorize';
import { validateQuery } from '../../middleware/validation/validate';
import { requestQuerySchema } from '../../middleware/validation/schemas/requestSchema';
import { hrRequestController } from '../../controllers/hr/hrRequestController';

const router = Router();

// Apply authentication and HR admin authorization to all routes
router.use(authenticate);
router.use(requireHR);

/**
 * @route GET /api/v1/hr/requests
 * @desc List all employee requests with filtering and pagination
 * @access HR Admin only
 * @query type, status, departmentId, search, page, limit
 */
router.get(
  '/',
  validateQuery(requestQuerySchema),
  hrRequestController.listRequests.bind(hrRequestController)
);

/**
 * @route GET /api/v1/hr/requests/stats
 * @desc Get request statistics
 * @access HR Admin only
 */
router.get(
  '/stats',
  hrRequestController.getRequestStats.bind(hrRequestController)
);

/**
 * @route GET /api/v1/hr/requests/:id
 * @desc Get request details by ID
 * @access HR Admin only
 */
router.get(
  '/:id',
  hrRequestController.getRequestById.bind(hrRequestController)
);

export default router;
