// Authentication Context for TITO HR Management System

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, LoginCredentials, UserRole } from '../types';
import { AuthService } from '../services/authService';
import { ApiError } from '../lib/api';
import { useQueryClient } from '@tanstack/react-query';

interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  getUserFullName: () => string;
  getUserInitials: () => string;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const currentUser = AuthService.getCurrentUser();
        const isAuth = AuthService.isAuthenticated();
        
        if (currentUser && isAuth) {
          setUser(currentUser);
        } else {
          AuthService.clearAuthData();
          // Clear React Query cache when no valid user
          queryClient.invalidateQueries({ queryKey: ['departmentHead'] });
          queryClient.removeQueries({ queryKey: ['departmentHead'] });
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        // Clear invalid auth data
        AuthService.clearAuthData();
        // Clear React Query cache when there's an error
        queryClient.invalidateQueries({ queryKey: ['departmentHead'] });
        queryClient.removeQueries({ queryKey: ['departmentHead'] });
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [queryClient]);

  // Clear cache when user changes (e.g., switching between department head accounts)
  useEffect(() => {
    if (user) {
      // Clear department head cache when a new user logs in
      queryClient.invalidateQueries({ queryKey: ['departmentHead'] });
      queryClient.removeQueries({ queryKey: ['departmentHead'] });
    }
  }, [user?.id, queryClient]); // Only trigger when user ID changes

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await AuthService.login(credentials);
      
      if (response.success && response.data) {
        setUser(response.data.user);
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : err instanceof Error 
        ? err.message 
        : 'Login failed. Please try again.';
      
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      await AuthService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Clear React Query cache to prevent data from previous user
      // Specifically clear department head related queries
      queryClient.invalidateQueries({ queryKey: ['departmentHead'] });
      queryClient.removeQueries({ queryKey: ['departmentHead'] });
      
      setUser(null);
      setError(null);
      setLoading(false);
    }
  };

  const hasRole = (role: UserRole): boolean => {
    return user?.role === role;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return user ? roles.includes(user.role) : false;
  };

  const getUserFullName = (): string => {
    if (!user) return '';
    // Handle both camelCase and snake_case properties
    const firstName = (user as any).firstName || (user as any).first_name || '';
    const lastName = (user as any).lastName || (user as any).last_name || '';
    return `${firstName} ${lastName}`.trim();
  };

  const getUserInitials = (): string => {
    if (!user) return '';
    // Handle both camelCase and snake_case properties
    const firstName = (user as any).firstName || (user as any).first_name || '';
    const lastName = (user as any).lastName || (user as any).last_name || '';
    
    if (!firstName || !lastName) return '';
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    loading,
    error,
    isAuthenticated: !!user,
    hasRole,
    hasAnyRole,
    getUserFullName,
    getUserInitials,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;