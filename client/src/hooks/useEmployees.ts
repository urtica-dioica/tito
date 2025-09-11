import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HREmployeeService } from '../services/hrEmployeeService';
import type { HREmployeeListParams, UpdateHREmployeeRequest } from '../services/hrEmployeeService';

export const useEmployees = (params?: HREmployeeListParams) => {
  return useQuery({
    queryKey: ['employees', params],
    queryFn: () => HREmployeeService.getEmployees(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useEmployee = (id: string) => {
  return useQuery({
    queryKey: ['employees', id],
    queryFn: () => HREmployeeService.getEmployee(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useEmployeeStats = () => {
  return useQuery({
    queryKey: ['employees', 'stats'],
    queryFn: async () => {
      try {
        const result = await HREmployeeService.getEmployeeStats();
        console.log('useEmployeeStats result:', result);
        return result;
      } catch (error: any) {
        console.error('useEmployeeStats error:', error);
        // Don't throw for aborted requests - they're usually cancelled due to component unmounting
        if (error.code === 'ECONNABORTED' || (error.name === 'AxiosError' && error.message === 'Request aborted')) {
          console.log('Request was aborted, likely due to component unmounting');
          return null;
        }
        throw error;
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error: any) => {
      // Don't retry aborted requests
      if (error.code === 'ECONNABORTED' || (error.name === 'AxiosError' && error.message === 'Request aborted')) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

export const useEmployeesByDepartment = (departmentId: string) => {
  return useQuery({
    queryKey: ['employees', 'department', departmentId],
    queryFn: () => HREmployeeService.getEmployeesByDepartment(departmentId),
    enabled: !!departmentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Note: Employee creation creates new user accounts automatically
// No need for available users hook

export const useCreateEmployee = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: HREmployeeService.createEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employees', 'stats'] });
    },
  });
};

export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateHREmployeeRequest }) => 
      HREmployeeService.updateEmployee(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employees', id] });
      queryClient.invalidateQueries({ queryKey: ['employees', 'stats'] });
    },
  });
};

export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: HREmployeeService.deleteEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employees', 'stats'] });
    },
  });
};

export const useHardDeleteEmployee = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: HREmployeeService.hardDeleteEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employees', 'stats'] });
    },
  });
};