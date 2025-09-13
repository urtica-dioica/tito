// Authentication Service for TITO HR Management System

import { apiMethods } from '../lib/api';
import type { LoginCredentials, AuthResponse, User } from '../types';
import Cookies from 'js-cookie';

interface UserData {
  id: string;
  email: string;
  first_name?: string;
  firstName?: string;
  last_name?: string;
  lastName?: string;
  role: string;
  is_active?: boolean;
  isActive?: boolean;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

export class AuthService {
  // Transform user data from snake_case to camelCase
  private static transformUser(userData: UserData): User {
    return {
      id: userData.id,
      email: userData.email,
      firstName: userData.first_name || userData.firstName || '',
      lastName: userData.last_name || userData.lastName || '',
      role: userData.role as any, // TODO: Fix UserRole type
      isActive: userData.is_active ?? userData.isActive ?? true,
      createdAt: userData.created_at || userData.createdAt || '',
      updatedAt: userData.updated_at || userData.updatedAt || '',
    };
  }

  // Login user
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiMethods.post<{ accessToken: string; refreshToken: string; user: UserData }>('/auth/login', credentials as unknown as Record<string, unknown>);

    // Store tokens and user data securely
    if (response.success && response.data) {
      const transformedUser = this.transformUser(response.data.user);

      // Store tokens in HttpOnly cookies (set by server)
      // Store user data in secure cookie (not HttpOnly for client access)
      Cookies.set('user', JSON.stringify(transformedUser), {
        secure: true,
        sameSite: 'strict',
        expires: 7 // 7 days
      });

      // Return transformed response
      return {
        success: response.success,
        message: response.message,
        data: {
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
          user: transformedUser,
        },
      };
    }

    return response as AuthResponse;
  }

  // Logout user (with API call)
  static async logout(): Promise<void> {
    try {
      await apiMethods.post('/auth/logout');
    } finally {
      // Clear cookies regardless of API call success
      Cookies.remove('user');
      // Note: HttpOnly cookies (accessToken, refreshToken) are cleared by server
    }
  }

  // Clear auth data only (no API call)
  static clearAuthData(): void {
    Cookies.remove('user');
    // Note: HttpOnly cookies (accessToken, refreshToken) are cleared by server
  }

  // Refresh access token
  static async refreshToken(): Promise<string> {
    // Note: refreshToken is stored in HttpOnly cookie, accessed via API
    const response = await apiMethods.post<{ accessToken: string }>('/auth/refresh');

    if (!response.data) {
      throw new Error('No access token received from refresh');
    }

    const newAccessToken = response.data.accessToken;
    // New access token will be set in HttpOnly cookie by server

    return newAccessToken;
  }

  // Get current user from secure cookie
  static getCurrentUser(): User | null {
    const userStr = Cookies.get('user');
    if (!userStr) return null;

    try {
      const userData = JSON.parse(userStr);
      // Transform if needed (for backward compatibility)
      return this.transformUser(userData);
    } catch (error) {
      console.error('Error parsing user data from cookie:', error);
      return null;
    }
  }

  // Check if user is authenticated
  static isAuthenticated(): boolean {
    // Note: We can't directly check HttpOnly accessToken cookie from client
    // Server will validate tokens on protected routes
    const user = this.getCurrentUser();
    return !!user;
  }

  // Get access token (Note: HttpOnly cookies can't be accessed by client-side JavaScript)
  static getAccessToken(): string | null {
    // Access tokens are now HttpOnly and can't be read by client-side code
    // They are automatically sent with requests via httpOnly cookies
    return null; // Client-side code should not need direct access to tokens
  }

  // Update user data in secure cookie
  static updateUser(user: User): void {
    Cookies.set('user', JSON.stringify(user), {
      secure: true,
      sameSite: 'strict',
      expires: 7 // 7 days
    });
  }

  // Check if user has specific role
  static hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  // Check if user has any of the specified roles
  static hasAnyRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    return user ? roles.includes(user.role) : false;
  }

  // Get user's full name
  static getUserFullName(): string {
    const user = this.getCurrentUser();
    if (!user) return '';
    // Handle both camelCase and snake_case properties
    const firstName = (user as any).firstName || (user as any).first_name || '';
    const lastName = (user as any).lastName || (user as any).last_name || '';
    return `${firstName} ${lastName}`.trim();
  }

  // Get user's initials for avatar
  static getUserInitials(): string {
    const user = this.getCurrentUser();
    if (!user) return '';
    
    // Handle both camelCase and snake_case properties
    const firstName = (user as any).firstName || (user as any).first_name || '';
    const lastName = (user as any).lastName || (user as any).last_name || '';
    
    if (!firstName || !lastName) return '';
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }
}

export default AuthService;
