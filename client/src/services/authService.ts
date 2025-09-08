// Authentication Service for TITO HR Management System

import { apiMethods } from '../lib/api';
import type { LoginCredentials, AuthResponse, User } from '../types';

export class AuthService {
  // Transform user data from snake_case to camelCase
  private static transformUser(userData: any): User {
    return {
      id: userData.id,
      email: userData.email,
      firstName: userData.first_name || userData.firstName,
      lastName: userData.last_name || userData.lastName,
      role: userData.role,
      isActive: userData.is_active || userData.isActive,
      createdAt: userData.created_at || userData.createdAt,
      updatedAt: userData.updated_at || userData.updatedAt,
    };
  }

  // Login user
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiMethods.post<any>('/auth/login', credentials);
    
    // Store tokens and user data
    if (response.success && response.data) {
      const transformedUser = this.transformUser(response.data.user);
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(transformedUser));
      
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
    
    return response;
  }

  // Logout user
  static async logout(): Promise<void> {
    try {
      await apiMethods.post('/auth/logout');
    } finally {
      // Clear local storage regardless of API call success
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  }

  // Refresh access token
  static async refreshToken(): Promise<string> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiMethods.post<{ data: { accessToken: string } }>('/auth/refresh', {
      refreshToken,
    });

    const newAccessToken = response.data.accessToken;
    localStorage.setItem('accessToken', newAccessToken);
    
    return newAccessToken;
  }

  // Get current user from localStorage
  static getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      const userData = JSON.parse(userStr);
      // Transform if needed (for backward compatibility)
      return this.transformUser(userData);
    } catch {
      return null;
    }
  }

  // Check if user is authenticated
  static isAuthenticated(): boolean {
    const token = localStorage.getItem('accessToken');
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  // Get access token
  static getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  // Update user data in localStorage
  static updateUser(user: User): void {
    localStorage.setItem('user', JSON.stringify(user));
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
