// Settings Service for TITO HR Management System

import { apiMethods } from '../lib/api';
import type { SystemSetting } from '../types';

export interface CreateSettingRequest {
  settingKey: string;
  settingValue: string;
  dataType: 'string' | 'number' | 'decimal' | 'boolean';
  description: string;
  isEditable: boolean;
}

export interface UpdateSettingRequest {
  settingValue?: string;
  description?: string;
  isEditable?: boolean;
}

// Re-export for compatibility
export type { UpdateSettingRequest as UpdateSettingRequestType };

export class SettingsService {
  // Get all system settings
  static async getSettings(): Promise<SystemSetting[]> {
    const response = await apiMethods.get<{ success: boolean; data: SystemSetting[] }>('/hr/system/settings');
    return response.data;
  }

  // Get setting by key
  static async getSetting(key: string): Promise<SystemSetting> {
    const response = await apiMethods.get<{ success: boolean; data: SystemSetting }>(`/hr/system/settings/${key}`);
    return response.data;
  }

  // Update setting by key
  static async updateSetting(key: string, data: UpdateSettingRequest): Promise<SystemSetting> {
    const response = await apiMethods.put<{ success: boolean; data: SystemSetting }>(`/hr/system/settings/${key}`, data);
    return response.data;
  }

  // Create new setting
  static async createSetting(data: CreateSettingRequest): Promise<SystemSetting> {
    const response = await apiMethods.post<{ success: boolean; data: SystemSetting }>('/hr/system/settings', data);
    return response.data;
  }

  // Delete setting by key
  static async deleteSetting(key: string): Promise<void> {
    await apiMethods.delete<{ success: boolean }>(`/hr/system/settings/${key}`);
  }
}
