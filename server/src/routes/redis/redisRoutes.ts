import { Router } from 'express';
import { redisController } from '../../controllers/redis/redisController';
import { authenticate } from '../../middleware/auth/authenticate';
import { authorize } from '../../middleware/auth/authorize';
import { USER_ROLES } from '../../utils/constants/roles';

const router = Router();

/**
 * Redis Management Routes
 * These routes require HR admin access for security
 */

// Health and status endpoints
router.get('/health', redisController.getHealth.bind(redisController));
router.get('/test', redisController.testConnection.bind(redisController));

// Statistics and monitoring (HR admin only)
router.get('/stats', 
  authenticate, 
  authorize([USER_ROLES.HR]), 
  redisController.getStats.bind(redisController)
);

// Cache management (HR admin only)
router.get('/keys', 
  authenticate, 
  authorize([USER_ROLES.HR]), 
  redisController.getKeys.bind(redisController)
);

router.get('/cache/:key', 
  authenticate, 
  authorize([USER_ROLES.HR]), 
  redisController.getCacheValue.bind(redisController)
);

router.post('/cache/:key', 
  authenticate, 
  authorize([USER_ROLES.HR]), 
  redisController.setCacheValue.bind(redisController)
);

router.delete('/cache/:key', 
  authenticate, 
  authorize([USER_ROLES.HR]), 
  redisController.deleteCacheKey.bind(redisController)
);

router.delete('/cache', 
  authenticate, 
  authorize([USER_ROLES.HR]), 
  redisController.clearCache.bind(redisController)
);

// Cache invalidation (HR admin only)
router.delete('/cache/user/:userId', 
  authenticate, 
  authorize([USER_ROLES.HR]), 
  redisController.invalidateUserCache.bind(redisController)
);

router.delete('/cache/department/:departmentId', 
  authenticate, 
  authorize([USER_ROLES.HR]), 
  redisController.invalidateDepartmentCache.bind(redisController)
);

router.delete('/cache/system', 
  authenticate, 
  authorize([USER_ROLES.HR]), 
  redisController.invalidateSystemCache.bind(redisController)
);

export default router; 