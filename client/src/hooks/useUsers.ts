// useUsers Hook for TITO HR Management System

import { useQuery } from '@tanstack/react-query';
import { UserService } from '../services/userService';
import type { User, DepartmentHead } from '../types';

export const useUsers = () => {
  return useQuery<User[]>({
    queryKey: ['users'],
    queryFn: UserService.getUsers,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useDepartmentHeads = () => {
  return useQuery<DepartmentHead[]>({
    queryKey: ['users', 'department-heads'],
    queryFn: UserService.getAvailableDepartmentHeads,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useAvailableDepartmentHeads = () => {
  return useQuery<DepartmentHead[]>({
    queryKey: ['users', 'available-department-heads'],
    queryFn: UserService.getAvailableDepartmentHeads,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUsersByRole = (role: 'hr' | 'employee' | 'department_head') => {
  return useQuery<User[]>({
    queryKey: ['users', 'role', role],
    queryFn: () => UserService.getUsersByRole(role),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
