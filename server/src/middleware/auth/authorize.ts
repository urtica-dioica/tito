import { Request, Response, NextFunction } from 'express';
import { USER_ROLES } from '../../utils/constants/roles';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
    tokenVersion: number;
  };
}

/**
 * Middleware to authorize users based on their role
 * @param roles Array of roles that are allowed to access the endpoint
 */
export const authorize = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      // Handle CORS preflight requests
      if (req.method === 'OPTIONS') {
        next();
        return;
      }

      // Check if user exists in request (set by authenticate middleware)
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          error: 'AUTHENTICATION_REQUIRED'
        });
        return;
      }

      // Note: User active status is checked at the database level
      // This middleware only checks role-based permissions

      // Check if user has one of the required roles
      if (!roles.includes(req.user.role)) {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
          error: 'INSUFFICIENT_PERMISSIONS',
          requiredRoles: roles,
          userRole: req.user.role
        });
        return;
      }

      // User is authorized, continue to next middleware
      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Authorization check failed',
        error: 'AUTHORIZATION_FAILED'
      });
    }
  };
};

/**
 * Middleware to check if user is HR admin
 */
export const requireHR = authorize([USER_ROLES.HR]);

/**
 * Middleware to check if user is HR admin or department head
 */
export const requireHROrDeptHead = authorize([USER_ROLES.HR, USER_ROLES.DEPARTMENT_HEAD]);

/**
 * Middleware to check if user is HR admin, department head, or employee
 */
export const requireAuthenticatedUser = authorize([USER_ROLES.HR, USER_ROLES.DEPARTMENT_HEAD, USER_ROLES.EMPLOYEE]);

/**
 * Middleware to check if user is department head
 */
export const requireDepartmentHead = authorize([USER_ROLES.DEPARTMENT_HEAD]);

/**
 * Middleware to check if user is employee
 */
export const requireEmployee = authorize([USER_ROLES.EMPLOYEE]); 