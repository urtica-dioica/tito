import { Router } from 'express';
import { SystemController } from '../../controllers/hr/systemController';
import { authenticate } from '../../middleware/auth/authenticate';
import { requireHR } from '../../middleware/auth/authorize';
import { validateParams, validateBody } from '../../middleware/validation/validate';
import { systemSettingParamsSchema, createSystemSettingSchema, updateSystemSettingSchema } from '../../middleware/validation/schemas/systemSchemas';

const router = Router();
const systemController = new SystemController();

// Apply authentication and HR admin authorization to all routes
router.use(authenticate);
router.use(requireHR);

/**
 * @route GET /api/v1/hr/system/settings
 * @desc Get all system settings
 * @access HR Admin only
 */
router.get(
  '/settings',
  systemController.getSystemSettings
);

/**
 * @route GET /api/v1/hr/system/settings/:key
 * @desc Get system setting by key
 * @access HR Admin only
 */
router.get(
  '/settings/:key',
  validateParams(systemSettingParamsSchema),
  systemController.getSystemSetting
);

/**
 * @route POST /api/v1/hr/system/settings
 * @desc Create new system setting
 * @access HR Admin only
 */
router.post(
  '/settings',
  validateBody(createSystemSettingSchema),
  systemController.createSystemSetting
);

/**
 * @route PUT /api/v1/hr/system/settings/:key
 * @desc Update system setting
 * @access HR Admin only
 */
router.put(
  '/settings/:key',
  validateParams(systemSettingParamsSchema),
  validateBody(updateSystemSettingSchema),
  systemController.updateSystemSetting
);

/**
 * @route DELETE /api/v1/hr/system/settings/:key
 * @desc Delete system setting
 * @access HR Admin only
 */
router.delete(
  '/settings/:key',
  validateParams(systemSettingParamsSchema),
  systemController.deleteSystemSetting
);

/**
 * @route GET /api/v1/hr/system/stats
 * @desc Get system statistics
 * @access HR Admin only
 */
router.get(
  '/stats',
  systemController.getSystemStats
);

/**
 * @route GET /api/v1/hr/system/health
 * @desc Get system health status
 * @access HR Admin only
 */
router.get(
  '/health',
  systemController.getSystemHealth
);

export default router;