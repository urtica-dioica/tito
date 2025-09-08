// Settings Service for TITO HR Management System

// import { apiMethods } from '../lib/api';
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
    // TODO: Replace with actual API call when backend is implemented
    // For now, return mock data that matches the current structure
    return [
      {
        id: '1',
        settingKey: 'expectedMonthlyHours',
        settingValue: '176',
        dataType: 'number',
        description: 'Expected monthly working hours for full-time employees',
        isEditable: true,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
      {
        id: '2',
        settingKey: 'overtimeToLeaveRatio',
        settingValue: '0.125',
        dataType: 'decimal',
        description: 'Ratio of overtime hours to leave days (0.125 = 8 hours = 1 day)',
        isEditable: true,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
      {
        id: '3',
        settingKey: 'selfieRetentionDays',
        settingValue: '2',
        dataType: 'number',
        description: 'Number of days to retain selfie images from attendance',
        isEditable: true,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
      {
        id: '4',
        settingKey: 'qrCodeExpiryYears',
        settingValue: '2',
        dataType: 'number',
        description: 'Number of years before QR codes expire',
        isEditable: true,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
      {
        id: '5',
        settingKey: 'maxOvertimeHoursPerDay',
        settingValue: '4',
        dataType: 'number',
        description: 'Maximum overtime hours allowed per day',
        isEditable: true,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
      {
        id: '6',
        settingKey: 'attendanceGracePeriodMinutes',
        settingValue: '15',
        dataType: 'number',
        description: 'Grace period in minutes for late attendance',
        isEditable: true,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      }
    ];
  }

  // Get setting by key
  static async getSetting(_key: string): Promise<SystemSetting> {
    // TODO: Replace with actual API call when backend is implemented
    throw new Error('Setting not found');
  }

  // Update setting
  static async updateSetting(_id: string, _data: UpdateSettingRequest): Promise<SystemSetting> {
    // TODO: Replace with actual API call when backend is implemented
    throw new Error('Not implemented');
  }

  // Create new setting
  static async createSetting(_data: CreateSettingRequest): Promise<SystemSetting> {
    // TODO: Replace with actual API call when backend is implemented
    throw new Error('Not implemented');
  }

  // Delete setting
  static async deleteSetting(_id: string): Promise<void> {
    // TODO: Replace with actual API call when backend is implemented
    throw new Error('Not implemented');
  }
}
