import { Router } from 'express';
import { AuditController } from '../../controllers/audit/auditController';
import { authenticate } from '../../middleware/auth/authenticate';
import { authorize } from '../../middleware/auth/authorize';

const router = Router();
const auditController = new AuditController();

// All audit routes require authentication and HR role
router.use(authenticate);
router.use(authorize(['hr']));

// Get audit logs with filtering and pagination
router.get(
  '/',
  auditController.getAuditLogs.bind(auditController)
);

// Get audit statistics
router.get(
  '/stats',
  auditController.getAuditStats.bind(auditController)
);

// Get specific audit log by ID
router.get(
  '/:id',
  auditController.getAuditLogById.bind(auditController)
);

// Get audit logs for a specific record
router.get(
  '/record/:tableName/:recordId',
  auditController.getAuditLogsByRecord.bind(auditController)
);

// Get audit logs for a specific user
router.get(
  '/user/:userId',
  auditController.getAuditLogsByUser.bind(auditController)
);

// Cleanup old audit logs
router.post(
  '/cleanup',
  auditController.cleanupOldLogs.bind(auditController)
);

export default router;