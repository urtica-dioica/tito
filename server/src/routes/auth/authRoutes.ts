import { Router } from 'express';
import { authController } from '../../controllers/auth/authController';
import { authenticate, requireAuth, requireRole } from '../../middleware/auth/authenticate';
import { USER_ROLES } from '../../utils/constants/roles';

const router = Router();

// Public routes (no authentication required)
router.post('/login', authController.login.bind(authController));
router.post('/refresh-token', authController.refreshToken.bind(authController));
router.post('/request-password-reset', authController.requestPasswordReset.bind(authController));
router.post('/reset-password', authController.resetPassword.bind(authController));
router.post('/setup-password', authController.setupPassword.bind(authController));

// Protected routes (authentication required)
router.use(authenticate); // Apply authentication middleware to all routes below

// User profile and password management
router.get('/profile', requireAuth, authController.getProfile.bind(authController));
router.put('/profile', requireAuth, authController.updateProfile.bind(authController));
router.put('/change-password', requireAuth, authController.changePassword.bind(authController));
router.post('/logout', requireAuth, authController.logout.bind(authController));

// HR-only routes
router.post('/users', requireRole(USER_ROLES.HR), authController.createUser.bind(authController));
router.get('/users', requireRole(USER_ROLES.HR), authController.getAllUsers.bind(authController));

export default router; 