import { Request, Response } from 'express';
import { authService } from '../../services/auth/authService';
import { userModel } from '../../models/auth/User';
import { USER_ROLES } from '../../utils/constants/roles';
import { ApiResponse } from '../../utils/types/express';

export class AuthController {
  /**
   * Helper method to get request ID safely
   */
  private getRequestId(req: Request): string {
    return req.requestId || 'unknown';
  }

  /**
   * User login
   */
  async login(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: 'Email and password are required',
          error: 'MISSING_CREDENTIALS',
          timestamp: new Date().toISOString(),
          requestId: this.getRequestId(req)
        });
        return;
      }

      // Attempt login
      const result = await authService.login({ email, password });

      if (!result.success) {
        res.status(401).json({
          success: false,
          message: result.message,
          error: result.error || 'AUTHENTICATION_FAILED',
          timestamp: new Date().toISOString(),
          requestId: this.getRequestId(req)
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
        timestamp: new Date().toISOString(),
        requestId: this.getRequestId(req)
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Login failed',
        error: 'INTERNAL_SERVER_ERROR',
        timestamp: new Date().toISOString(),
        requestId: this.getRequestId(req)
      });
    }
  }

  /**
   * User logout
   */
  async logout(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      // Get user ID from authenticated request
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          error: 'AUTHENTICATION_REQUIRED',
          timestamp: new Date().toISOString(),
          requestId: this.getRequestId(req)
        });
        return;
      }

      // Perform logout
      const result = await authService.logout(userId);

      if (!result.success) {
        res.status(500).json({
          success: false,
          message: result.message,
          error: result.error || 'LOGOUT_FAILED',
          timestamp: new Date().toISOString(),
          requestId: this.getRequestId(req)
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: result.message,
        timestamp: new Date().toISOString(),
        requestId: this.getRequestId(req)
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Logout failed',
        error: 'INTERNAL_SERVER_ERROR',
        timestamp: new Date().toISOString(),
        requestId: this.getRequestId(req)
      });
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          message: 'Refresh token is required',
          error: 'MISSING_REFRESH_TOKEN',
          timestamp: new Date().toISOString(),
          requestId: this.getRequestId(req)
        });
        return;
      }

      // Attempt token refresh
      const result = await authService.refreshToken(refreshToken);

      if (!result.success) {
        res.status(401).json({
          success: false,
          message: result.message,
          error: result.error || 'TOKEN_REFRESH_FAILED',
          timestamp: new Date().toISOString(),
          requestId: this.getRequestId(req)
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
        timestamp: new Date().toISOString(),
        requestId: this.getRequestId(req)
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Token refresh failed',
        error: 'INTERNAL_SERVER_ERROR',
        timestamp: new Date().toISOString(),
        requestId: this.getRequestId(req)
      });
    }
  }

  /**
   * Change password
   */
  async changePassword(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          error: 'AUTHENTICATION_REQUIRED',
          timestamp: new Date().toISOString(),
          requestId: this.getRequestId(req)
        });
        return;
      }

      if (!currentPassword || !newPassword) {
        res.status(400).json({
          success: false,
          message: 'Current password and new password are required',
          error: 'MISSING_PASSWORDS',
          timestamp: new Date().toISOString(),
          requestId: this.getRequestId(req)
        });
        return;
      }

      if (newPassword.length < 8) {
        res.status(400).json({
          success: false,
          message: 'New password must be at least 8 characters long',
          error: 'PASSWORD_TOO_SHORT',
          timestamp: new Date().toISOString(),
          requestId: this.getRequestId(req)
        });
        return;
      }

      // Attempt password change
      const result = await authService.changePassword(userId, currentPassword, newPassword);

      if (!result.success) {
        res.status(400).json({
          success: false,
          message: result.message,
          error: result.error || 'PASSWORD_CHANGE_FAILED',
          timestamp: new Date().toISOString(),
          requestId: this.getRequestId(req)
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: result.message,
        timestamp: new Date().toISOString(),
        requestId: this.getRequestId(req)
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Password change failed',
        error: 'INTERNAL_SERVER_ERROR',
        timestamp: new Date().toISOString(),
        requestId: this.getRequestId(req)
      });
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          message: 'Email is required',
          error: 'MISSING_EMAIL',
          timestamp: new Date().toISOString(),
          requestId: this.getRequestId(req)
        });
        return;
      }

      // Attempt password reset request
      const result = await authService.requestPasswordReset(email);

      if (!result.success) {
        res.status(500).json({
          success: false,
          message: result.message,
          error: result.error || 'PASSWORD_RESET_REQUEST_FAILED',
          timestamp: new Date().toISOString(),
          requestId: this.getRequestId(req)
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: result.message,
        timestamp: new Date().toISOString(),
        requestId: this.getRequestId(req)
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Password reset request failed',
        error: 'INTERNAL_SERVER_ERROR',
        timestamp: new Date().toISOString(),
        requestId: this.getRequestId(req)
      });
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { email, resetToken, newPassword } = req.body;

      if (!email || !resetToken || !newPassword) {
        res.status(400).json({
          success: false,
          message: 'Email, reset token, and new password are required',
          error: 'MISSING_RESET_DATA',
          timestamp: new Date().toISOString(),
          requestId: this.getRequestId(req)
        });
        return;
      }

      if (newPassword.length < 8) {
        res.status(400).json({
          success: false,
          message: 'New password must be at least 8 characters long',
          error: 'PASSWORD_TOO_SHORT',
          timestamp: new Date().toISOString(),
          requestId: this.getRequestId(req)
        });
        return;
      }

      // Attempt password reset
      const result = await authService.resetPassword(email, resetToken, newPassword);

      if (!result.success) {
        res.status(400).json({
          success: false,
          message: result.message,
          error: result.error || 'PASSWORD_RESET_FAILED',
          timestamp: new Date().toISOString(),
          requestId: this.getRequestId(req)
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: result.message,
        timestamp: new Date().toISOString(),
        requestId: this.getRequestId(req)
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Password reset failed',
        error: 'INTERNAL_SERVER_ERROR',
        timestamp: new Date().toISOString(),
        requestId: this.getRequestId(req)
      });
    }
  }

  /**
   * Setup password for department head
   */
  async setupPassword(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        res.status(400).json({
          success: false,
          message: 'Setup token and password are required',
          error: 'MISSING_SETUP_DATA',
          timestamp: new Date().toISOString(),
          requestId: this.getRequestId(req)
        });
        return;
      }

      if (password.length < 8) {
        res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters long',
          error: 'PASSWORD_TOO_SHORT',
          timestamp: new Date().toISOString(),
          requestId: this.getRequestId(req)
        });
        return;
      }

      // Attempt password setup
      const result = await authService.setupPassword(token, password);

      if (!result.success) {
        res.status(400).json({
          success: false,
          message: result.message,
          error: result.error || 'PASSWORD_SETUP_FAILED',
          timestamp: new Date().toISOString(),
          requestId: this.getRequestId(req)
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: result.message,
        timestamp: new Date().toISOString(),
        requestId: this.getRequestId(req)
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Password setup failed',
        error: 'INTERNAL_SERVER_ERROR',
        timestamp: new Date().toISOString(),
        requestId: this.getRequestId(req)
      });
    }
  }

  /**
   * Get user profile
   */
  async getProfile(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          error: 'AUTHENTICATION_REQUIRED',
          timestamp: new Date().toISOString(),
          requestId: this.getRequestId(req)
        });
        return;
      }

      // Get user profile
      const result = await authService.getUserProfile(userId);

      if (!result.success) {
        res.status(404).json({
          success: false,
          message: result.message,
          error: result.error || 'PROFILE_NOT_FOUND',
          timestamp: new Date().toISOString(),
          requestId: this.getRequestId(req)
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
        timestamp: new Date().toISOString(),
        requestId: this.getRequestId(req)
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get profile',
        error: 'INTERNAL_SERVER_ERROR',
        timestamp: new Date().toISOString(),
        requestId: this.getRequestId(req)
      });
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const { firstName, lastName, email } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          error: 'AUTHENTICATION_REQUIRED',
          timestamp: new Date().toISOString(),
          requestId: this.getRequestId(req)
        });
        return;
      }

      // Validate input
      if (!firstName || !lastName || !email) {
        res.status(400).json({
          success: false,
          message: 'All fields are required',
          error: 'MISSING_FIELDS',
          timestamp: new Date().toISOString(),
          requestId: this.getRequestId(req)
        });
        return;
      }

      // Update user profile
      const result = await authService.updateUserProfile(userId, { firstName, lastName, email });

      if (!result.success) {
        res.status(400).json({
          success: false,
          message: result.message,
          error: result.error || 'UPDATE_FAILED',
          timestamp: new Date().toISOString(),
          requestId: this.getRequestId(req)
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
        timestamp: new Date().toISOString(),
        requestId: this.getRequestId(req)
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update profile',
        error: 'INTERNAL_SERVER_ERROR',
        timestamp: new Date().toISOString(),
        requestId: this.getRequestId(req)
      });
    }
  }

  /**
   * Create new user (HR only)
   */
  async createUser(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { email, password, first_name, last_name, role } = req.body;

      // Validate input
      if (!email || !password || !first_name || !last_name || !role) {
        res.status(400).json({
          success: false,
          message: 'All fields are required',
          error: 'MISSING_FIELDS',
          timestamp: new Date().toISOString(),
          requestId: this.getRequestId(req)
        });
        return;
      }

      // Validate role
      if (!Object.values(USER_ROLES).includes(role)) {
        res.status(400).json({
          success: false,
          message: 'Invalid role',
          error: 'INVALID_ROLE',
          timestamp: new Date().toISOString(),
          requestId: this.getRequestId(req)
        });
        return;
      }

      if (password.length < 8) {
        res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters long',
          error: 'PASSWORD_TOO_SHORT',
          timestamp: new Date().toISOString(),
          requestId: this.getRequestId(req)
        });
        return;
      }

      // Check if user already exists
      const userExists = await userModel.userExists(email);
      if (userExists) {
        res.status(409).json({
          success: false,
          message: 'User with this email already exists',
          error: 'USER_ALREADY_EXISTS',
          timestamp: new Date().toISOString(),
          requestId: this.getRequestId(req)
        });
        return;
      }

      // Create user
      const newUser = await userModel.createUser({
        email,
        password,
        first_name,
        last_name,
        role
      });

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: { user: newUser },
        timestamp: new Date().toISOString(),
        requestId: this.getRequestId(req)
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create user',
        error: 'INTERNAL_SERVER_ERROR',
        timestamp: new Date().toISOString(),
        requestId: this.getRequestId(req)
      });
    }
  }

  /**
   * Get all users (HR only)
   */
  async getAllUsers(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const users = await userModel.listAllUsers();

      res.status(200).json({
        success: true,
        message: 'Users retrieved successfully',
        data: { users },
        timestamp: new Date().toISOString(),
        requestId: this.getRequestId(req)
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve users',
        error: 'INTERNAL_SERVER_ERROR',
        timestamp: new Date().toISOString(),
        requestId: this.getRequestId(req)
      });
    }
  }

  /**
   * Update user (HR only)
   */
  async updateUser(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { id } = req.params;
      const { firstName, lastName, email, role, isActive } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'User ID is required',
          error: 'MISSING_USER_ID',
          timestamp: new Date().toISOString(),
          requestId: this.getRequestId(req)
        });
        return;
      }

      const result = await authService.updateUser(id, { firstName, lastName, email, role, isActive });

      if (!result.success) {
        res.status(400).json({
          success: false,
          message: result.message,
          error: result.error || 'UPDATE_FAILED',
          timestamp: new Date().toISOString(),
          requestId: this.getRequestId(req)
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
        timestamp: new Date().toISOString(),
        requestId: this.getRequestId(req)
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update user',
        error: 'INTERNAL_SERVER_ERROR',
        timestamp: new Date().toISOString(),
        requestId: this.getRequestId(req)
      });
    }
  }
}

// Export singleton instance
export const authController = new AuthController(); 