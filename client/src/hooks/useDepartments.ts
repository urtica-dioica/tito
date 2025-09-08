// React Query hooks for Department management

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DepartmentService } from '../services/departmentService';
import type { CreateDepartmentRequest, UpdateDepartmentRequest } from '../services/departmentService';
// import type { Department } from '../types'; // Unused for now

// Query keys
export const departmentKeys = {
  all: ['departments'] as const,
  lists: () => [...departmentKeys.all, 'list'] as const,
  details: () => [...departmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...departmentKeys.details(), id] as const,
  stats: () => [...departmentKeys.all, 'stats'] as const,
  withEmployeeCount: () => [...departmentKeys.all, 'with-employee-count'] as const,
};

// Get all departments
export const useDepartments = () => {
  return useQuery({
    queryKey: departmentKeys.lists(),
    queryFn: () => DepartmentService.getDepartments(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
};

// Get department by ID
export const useDepartment = (id: string) => {
  return useQuery({
    queryKey: departmentKeys.detail(id),
    queryFn: () => DepartmentService.getDepartment(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
};

// Get departments with employee count
export const useDepartmentsWithEmployeeCount = () => {
  return useQuery({
    queryKey: departmentKeys.withEmployeeCount(),
    queryFn: () => DepartmentService.getDepartmentsWithEmployeeCount(),
    staleTime: 10 * 60 * 1000,
  });
};

// Get department statistics
export const useDepartmentStats = () => {
  return useQuery({
    queryKey: departmentKeys.stats(),
    queryFn: () => DepartmentService.getDepartmentStats(),
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
};

// Create department mutation
export const useCreateDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDepartmentRequest) => DepartmentService.createDepartment(data),
    onSuccess: () => {
      // Invalidate and refetch department lists
      queryClient.invalidateQueries({ queryKey: departmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: departmentKeys.withEmployeeCount() });
      queryClient.invalidateQueries({ queryKey: departmentKeys.stats() });
    },
  });
};

// Update department mutation
export const useUpdateDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDepartmentRequest }) =>
      DepartmentService.updateDepartment(id, data),
    onSuccess: (updatedDepartment, { id }) => {
      // Update the specific department in cache
      queryClient.setQueryData(departmentKeys.detail(id), updatedDepartment);
      
      // Invalidate lists to refetch
      queryClient.invalidateQueries({ queryKey: departmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: departmentKeys.withEmployeeCount() });
      queryClient.invalidateQueries({ queryKey: departmentKeys.stats() });
    },
  });
};

// Delete department mutation
export const useDeleteDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => DepartmentService.deleteDepartment(id),
    onSuccess: (_, id) => {
      // Remove the department from cache
      queryClient.removeQueries({ queryKey: departmentKeys.detail(id) });
      
      // Invalidate lists to refetch
      queryClient.invalidateQueries({ queryKey: departmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: departmentKeys.withEmployeeCount() });
      queryClient.invalidateQueries({ queryKey: departmentKeys.stats() });
    },
  });
};
