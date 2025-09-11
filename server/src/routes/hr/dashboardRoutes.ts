import { Router } from 'express';
import { hrDashboardController } from '../../controllers/hr/dashboardController';
import { authenticate } from '../../middleware/auth/authenticate';
import { requireHR } from '../../middleware/auth/authorize';

const router = Router();

// Apply authentication and HR admin authorization to all routes
router.use(authenticate);
router.use(requireHR);

/**
 * @route GET /api/v1/hr/dashboard
 * @desc Get HR dashboard data
 * @access HR Admin only
 */
router.get(
  '/',
  hrDashboardController.getDashboard
);

export default router;
