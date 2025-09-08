// Settings Hooks for TITO HR Management System

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SettingsService } from '../services/settingsService';
import type { CreateSettingRequest, UpdateSettingRequest } from '../services/settingsService';
import type { SystemSetting } from '../types';

export const useSettings = () => {
  return useQuery<SystemSetting[]>({
    queryKey: ['settings'],
    queryFn: SettingsService.getSettings,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useSetting = (key: string) => {
  return useQuery<SystemSetting>({
    queryKey: ['settings', key],
    queryFn: () => SettingsService.getSetting(key),
    enabled: !!key,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useUpdateSetting = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSettingRequest }) => 
      SettingsService.updateSetting(id, data),
    onSuccess: () => {
      // Invalidate and refetch settings
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
};

export const useCreateSetting = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateSettingRequest) => SettingsService.createSetting(data),
    onSuccess: () => {
      // Invalidate and refetch settings
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
};

export const useDeleteSetting = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => SettingsService.deleteSetting(id),
    onSuccess: () => {
      // Invalidate and refetch settings
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
};
