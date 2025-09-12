import { Router } from 'express';
import { schedulerController } from '../../controllers/scheduler/schedulerController';
import { authenticate } from '../../middleware/auth/authenticate';
import { authorize } from '../../middleware/auth/authorize';
import { USER_ROLES } from '../../utils/constants/roles';

const router = Router();

/**
 * Scheduler Management Routes
 * These routes require HR admin access for security
 */

// Get scheduler status
router.get('/status', 
  authenticate, 
  authorize([USER_ROLES.HR]), 
  schedulerController.getStatus.bind(schedulerController)
);

// Start scheduler service
router.post('/start', 
  authenticate, 
  authorize([USER_ROLES.HR]), 
  schedulerController.start.bind(schedulerController)
);

// Stop scheduler service
router.post('/stop', 
  authenticate, 
  authorize([USER_ROLES.HR]), 
  schedulerController.stop.bind(schedulerController)
);

// Manually trigger selfie cleanup
router.post('/cleanup/selfies', 
  authenticate, 
  authorize([USER_ROLES.HR]), 
  schedulerController.triggerSelfieCleanup.bind(schedulerController)
);

// Manually trigger audit log cleanup
router.post('/cleanup/audit-logs', 
  authenticate, 
  authorize([USER_ROLES.HR]), 
  schedulerController.triggerAuditLogCleanup.bind(schedulerController)
);

export default router;
