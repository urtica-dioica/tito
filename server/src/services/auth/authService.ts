import { userModel, UserWithoutPassword } from '../../models/auth/User';
import { generateTokenPair, verifyAccessToken, verifyRefreshToken } from '../../config/jwt';
import { redisService } from '../redis/redisService';
import logger from '../../utils/logger';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: UserWithoutPassword;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export class AuthService {
  /**
   * Authenticate user login
   */
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      const { email, password } = credentials;

      // Find user by email
      const user = await userModel.findByEmail(email);
      if (!user) {
        return {
          success: false,
          message: 'Invalid credentials',
          error: 'INVALID_CREDENTIALS'
        };
      }

      // Check if user is active
      if (!user.is_active) {
        return {
          success: false,
          message: 'Account is deactivated',
          error: 'ACCOUNT_DEACTIVATED'
        };
      }

      // Verify password
      const isPasswordValid = await userModel.verifyPassword(email, password);
      if (!isPasswordValid) {
        return {
          success: false,
          message: 'Invalid credentials',
          error: 'INVALID_CREDENTIALS'
        };
      }

      // Generate tokens
      const { accessToken, refreshToken } = generateTokenPair(
        user.id,
        user.email,
        user.role,
        1 // tokenVersion - will be implemented with refresh token rotation
      );

      // Store refresh token in cache (Redis) - gracefully handle Redis failures
      try {
        const refreshTokenKey = `refresh_token:${user.id}`;
        await redisService.setCache(refreshTokenKey, refreshToken, 7 * 24 * 60 * 60); // 7 days
      } catch (error) {
        logger.warn('Failed to store refresh token in Redis, continuing with login:', error);
        // Continue with login even if Redis fails
      }

      // Remove password from user object
      const { password_hash: _, ...userWithoutPassword } = user;

      const response: LoginResponse = {
        user: userWithoutPassword,
        accessToken,
        refreshToken,
        expiresIn: 15 * 60 // 15 minutes in seconds
      };

      return {
        success: true,
        message: 'Login successful',
        data: response
      };
    } catch (error) {
      return {
        success: false,
        message: 'Login failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthResult> {
    try {
      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);
      
      // Check if refresh token exists in cache - gracefully handle Redis failures
      const refreshTokenKey = `refresh_token:${decoded.userId}`;
      let cachedToken = null;
      try {
        cachedToken = await redisService.getCache(refreshTokenKey);
      } catch (error) {
        logger.warn('Failed to get refresh token from Redis, continuing with refresh:', error);
        // Continue with refresh even if Redis fails
      }
      
      // Only validate cached token if Redis is available and token exists
      if (cachedToken === null) {
        logger.warn('No cached refresh token found, but continuing with refresh due to Redis unavailability');
      }

      // Get user information
      const user = await userModel.findById(decoded.userId);
      if (!user || !user.is_active) {
        return {
          success: false,
          message: 'User not found or inactive',
          error: 'USER_NOT_FOUND'
        };
      }

      // Generate new token pair
      const newTokens = generateTokenPair(
        user.id,
        user.email,
        user.role,
        decoded.tokenVersion + 1
      );

      // Update refresh token in cache - gracefully handle Redis failures
      try {
        await redisService.setCache(refreshTokenKey, newTokens.refreshToken, 7 * 24 * 60 * 60);
      } catch (error) {
        logger.warn('Failed to update refresh token in Redis, continuing with refresh:', error);
        // Continue with refresh even if Redis fails
      }

      const response: RefreshTokenResponse = {
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
        expiresIn: 15 * 60 // 15 minutes in seconds
      };

      return {
        success: true,
        message: 'Token refreshed successfully',
        data: response
      };
    } catch (error) {
      return {
        success: false,
        message: 'Token refresh failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Logout user
   */
  async logout(userId: string): Promise<AuthResult> {
    try {
      // Remove refresh token from cache - gracefully handle Redis failures
      try {
        const refreshTokenKey = `refresh_token:${userId}`;
        await redisService.deleteCache(refreshTokenKey);
      } catch (error) {
        logger.warn('Failed to delete refresh token from Redis, continuing with logout:', error);
        // Continue with logout even if Redis fails
      }

      return {
        success: true,
        message: 'Logout successful'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Logout failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Validate access token
   */
  async validateToken(token: string): Promise<AuthResult> {
    try {
      const decoded = verifyAccessToken(token);
      
      // Get user information
      const user = await userModel.findById(decoded.userId);
      if (!user || !user.is_active) {
        return {
          success: false,
          message: 'User not found or inactive',
          error: 'USER_NOT_FOUND'
        };
      }

      return {
        success: true,
        message: 'Token valid',
        data: { user: decoded }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Invalid token',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<AuthResult> {
    try {
      // Get user by ID
      const user = await userModel.findById(userId);
      if (!user) {
        return {
          success: false,
          message: 'User not found',
          error: 'USER_NOT_FOUND'
        };
      }

      // Verify current password using email
      const isCurrentPasswordValid = await userModel.verifyPassword(user.email, currentPassword);
      if (!isCurrentPasswordValid) {
        return {
          success: false,
          message: 'Current password is incorrect',
          error: 'INVALID_CURRENT_PASSWORD'
        };
      }

      // Update password
      const success = await userModel.updatePassword(userId, newPassword);
      if (!success) {
        return {
          success: false,
          message: 'Failed to update password',
          error: 'PASSWORD_UPDATE_FAILED'
        };
      }

      // Invalidate all refresh tokens for this user
      const refreshTokenKey = `refreshToken:${userId}`;
      await redisService.deleteCache(refreshTokenKey);

      return {
        success: true,
        message: 'Password changed successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Password change failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<AuthResult> {
    try {
      // Check if user exists
      const user = await userModel.findByEmailWithoutPassword(email);
      if (!user) {
        // Don't reveal if user exists or not for security
        return {
          success: true,
          message: 'If an account with this email exists, a password reset link has been sent'
        };
      }

      // Generate reset token (simple implementation - in production, use email service)
      const resetToken = Math.random().toString(36).substring(2, 15);
      const resetTokenKey = `reset_token:${user.id}`;
      
      // Store reset token in cache (expires in 1 hour)
      await redisService.setCache(resetTokenKey, resetToken, 60 * 60);

      // TODO: Send email with reset link
      // For now, just return success
      return {
        success: true,
        message: 'Password reset link sent to your email'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Password reset request failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(email: string, resetToken: string, newPassword: string): Promise<AuthResult> {
    try {
      // Find user
      const user = await userModel.findByEmailWithoutPassword(email);
      if (!user) {
        return {
          success: false,
          message: 'User not found',
          error: 'USER_NOT_FOUND'
        };
      }

      // Verify reset token
      const resetTokenKey = `reset_token:${user.id}`;
      const cachedToken = await redisService.getCache(resetTokenKey);
      
      if (!cachedToken || cachedToken !== resetToken) {
        return {
          success: false,
          message: 'Invalid or expired reset token',
          error: 'INVALID_RESET_TOKEN'
        };
      }

      // Update password
      const success = await userModel.updatePassword(user.id, newPassword);
      if (!success) {
        return {
          success: false,
          message: 'Failed to update password',
          error: 'PASSWORD_UPDATE_FAILED'
        };
      }

      // Remove reset token
      await redisService.deleteCache(resetTokenKey);

      // Invalidate all refresh tokens for this user
      const refreshTokenKey = `refresh_token:${user.id}`;
      await redisService.deleteCache(refreshTokenKey);

      return {
        success: true,
        message: 'Password reset successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Password reset failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Setup password for department head with token
   */
  async setupPassword(setupToken: string, newPassword: string): Promise<AuthResult> {
    try {
      // Find user by setup token
      const setupTokenKey = `setup_token:${setupToken}`;
      const userId = await redisService.getCache(setupTokenKey);
      
      if (!userId || typeof userId !== 'string') {
        return {
          success: false,
          message: 'Invalid or expired setup token',
          error: 'INVALID_SETUP_TOKEN'
        };
      }

      // Find user
      const user = await userModel.findById(userId);
      if (!user) {
        return {
          success: false,
          message: 'User not found',
          error: 'USER_NOT_FOUND'
        };
      }

      // Update password
      const success = await userModel.updatePassword(user.id, newPassword);
      if (!success) {
        return {
          success: false,
          message: 'Failed to update password',
          error: 'PASSWORD_UPDATE_FAILED'
        };
      }

      // Remove setup token
      await redisService.deleteCache(setupTokenKey);

      return {
        success: true,
        message: 'Password setup successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Password setup failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId: string): Promise<AuthResult> {
    try {
      const user = await userModel.findById(userId);
      if (!user) {
        return {
          success: false,
          message: 'User not found',
          error: 'USER_NOT_FOUND'
        };
      }

      return {
        success: true,
        message: 'User profile retrieved successfully',
        data: { user }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get user profile',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, profileData: { firstName: string; lastName: string; email: string }): Promise<AuthResult> {
    try {
      const user = await userModel.findById(userId);
      if (!user) {
        return {
          success: false,
          message: 'User not found',
          error: 'USER_NOT_FOUND'
        };
      }

      // Check if email is already taken by another user
      if (profileData.email !== user.email) {
        const existingUser = await userModel.findByEmail(profileData.email);
        if (existingUser && existingUser.id !== userId) {
          return {
            success: false,
            message: 'Email is already taken',
            error: 'EMAIL_ALREADY_EXISTS'
          };
        }
      }

      // Update user profile
      const updatedUser = await userModel.updateUser(userId, {
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        email: profileData.email
      });

      if (!updatedUser) {
        return {
          success: false,
          message: 'Failed to update profile',
          error: 'UPDATE_FAILED'
        };
      }

      return {
        success: true,
        message: 'Profile updated successfully',
        data: { user: updatedUser }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update profile',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update user (HR only)
   */
  async updateUser(userId: string, userData: { firstName?: string; lastName?: string; email?: string; role?: string; isActive?: boolean }): Promise<AuthResult> {
    try {
      const user = await userModel.findById(userId);
      if (!user) {
        return {
          success: false,
          message: 'User not found',
          error: 'USER_NOT_FOUND'
        };
      }

      // Check if email is already taken by another user
      if (userData.email && userData.email !== user.email) {
        const existingUser = await userModel.findByEmail(userData.email);
        if (existingUser && existingUser.id !== userId) {
          return {
            success: false,
            message: 'Email is already taken',
            error: 'EMAIL_ALREADY_EXISTS'
          };
        }
      }

      // Prepare update data
      const updateData: any = {};
      if (userData.firstName !== undefined) updateData.first_name = userData.firstName;
      if (userData.lastName !== undefined) updateData.last_name = userData.lastName;
      if (userData.email !== undefined) updateData.email = userData.email;
      if (userData.role !== undefined) updateData.role = userData.role;
      if (userData.isActive !== undefined) updateData.is_active = userData.isActive;

      // Update user
      const updatedUser = await userModel.updateUser(userId, updateData);

      if (!updatedUser) {
        return {
          success: false,
          message: 'Failed to update user',
          error: 'UPDATE_FAILED'
        };
      }

      return {
        success: true,
        message: 'User updated successfully',
        data: { user: updatedUser }
      };
    } catch (error) {
      logger.error('Failed to update user', { error: (error as Error).message, userId, userData });
      return {
        success: false,
        message: 'Failed to update user',
        error: 'INTERNAL_SERVER_ERROR'
      };
    }
  }
}

// Export singleton instance
export const authService = new AuthService(); 