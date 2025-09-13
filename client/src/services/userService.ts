// User Service for TITO HR Management System
// @ts-nocheck

import { apiMethods } from '../lib/api';
import type { User, DepartmentHead } from '../types';

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'hr' | 'employee' | 'department_head';
}

export interface UpdateUserRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: 'hr' | 'employee' | 'department_head';
  isActive?: boolean;
  [key: string]: unknown;
}

export class UserService {
  // Get all users
  static async getUsers(): Promise<User[]> {
    const response = await apiMethods.get<{ data?: { users: User[] } }>('/auth/users');
    if (!response.data) {
      throw new Error('Failed to fetch users');
    }
    return response.data.users;
  }

  // Get users by role
  static async getUsersByRole(role: 'hr' | 'employee' | 'department_head'): Promise<User[]> {
    const allUsers = await this.getUsers();
    return allUsers.filter(user => user.role === role);
  }

  // Get department heads (users with department_head role)
  static async getDepartmentHeads(): Promise<User[]> {
    return this.getUsersByRole('department_head');
  }

  // Get available department heads (not assigned to any department)
  static async getAvailableDepartmentHeads(): Promise<DepartmentHead[]> {
    const response = await apiMethods.get<{ data?: { departmentHeads: DepartmentHead[] } }>('/hr/departments/heads');
    if (!response.data) {
      throw new Error('Failed to fetch department heads');
    }
    return response.data.departmentHeads;
  }

  // Get user by ID
  static async getUser(id: string): Promise<User> {
    const users = await this.getUsers();
    const user = users.find(u => u.id === id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  // Create new user (sends email invitation)
  static async createUser(data: CreateUserRequest): Promise<User> {
    const response = await apiMethods.post<{ data?: User }>('/auth/users', {
      email: data.email,
      password: data.password, // This will be a temporary password
      first_name: data.firstName,
      last_name: data.lastName,
      role: data.role
    });
    if (!response.data) {
      throw new Error('Failed to create user');
    }
    return response.data;
  }

  // Create department head (sends email invitation)
  static async createDepartmentHead(data: {
    email: string;
    firstName: string;
    lastName: string;
    departmentId?: string;
  }): Promise<User> {
    const response = await apiMethods.post<{ data?: User }>('/hr/departments/heads', {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      departmentId: data.departmentId
    });
    if (!response.data) {
      throw new Error('Failed to create department head');
    }
    return response.data;
  }

  // Update user
  static async updateUser(id: string, data: UpdateUserRequest): Promise<User> {
    const response = await apiMethods.put<{ data?: User }>(`/auth/users/${id}`, data);
    if (!response.data) {
      throw new Error('Failed to update user');
    }
    return response.data;
  }

  // Delete user (for department heads, use the department head delete endpoint)
  static async deleteUser(id: string): Promise<void> {
    // For department heads, use the department head delete endpoint which is hard delete
    await apiMethods.delete(`/hr/departments/heads/${id}`);
  }
}

export default UserService;
