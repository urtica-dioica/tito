import React, { useState } from 'react';
import { Settings as SettingsIcon, Clock, DollarSign, User, Shield, Database } from 'lucide-react';
import Card from '../../components/shared/Card';
import Input from '../../components/shared/Input';
import PageLayout from '../../components/layout/PageLayout';
import { useSettings, useUpdateSetting } from '../../hooks/useSettings';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
// import type { SystemSetting } from '../../types';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  
  // Fetch settings from API
  const { data: settingsData, isLoading: settingsLoading, error: settingsError } = useSettings();
  const updateSettingMutation = useUpdateSetting();

  if (settingsLoading) {
    return (
      <PageLayout title="System Settings" subtitle="Configure system-wide settings and preferences">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </PageLayout>
    );
  }

  if (settingsError) {
    return (
      <PageLayout title="System Settings" subtitle="Configure system-wide settings and preferences">
        <div className="text-center py-12">
          <p className="text-red-600">Error loading settings: {settingsError.message}</p>
        </div>
      </PageLayout>
    );
  }

  const settings = settingsData || [];

  // Remove the handleSaveSettings function since settings are saved individually

  const handleSettingChange = async (settingKey: string, value: string) => {
    try {
      await updateSettingMutation.mutateAsync({
        key: settingKey,
        data: { settingValue: value }
      });
    } catch (error) {
      console.error('Error updating setting:', error);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'payroll', label: 'Payroll', icon: DollarSign },
    { id: 'users', label: 'Users', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'system', label: 'System', icon: Database },
  ];

  const renderGeneralSettings = () => {
    const generalSettings = settings.filter(setting => 
      !setting.settingKey.includes('attendance') && 
      !setting.settingKey.includes('grace') && 
      !setting.settingKey.includes('late') && 
      !setting.settingKey.includes('early') &&
      !setting.settingKey.includes('payroll') && 
      !setting.settingKey.includes('overtime') && 
      !setting.settingKey.includes('monthly') &&
      !setting.settingKey.includes('max_overtime')
    );

    return (
      <div className="space-y-6">
        <Card>
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-text-primary">System Configuration</h3>
            <p className="text-sm text-text-secondary">
              Configure core system settings and parameters
            </p>
          </div>
          <div className="p-6 space-y-4">
            {generalSettings.map((setting) => (
              <div key={setting.id} className="flex items-center justify-between">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    {setting.settingKey.replace(/([A-Z])/g, ' $1').replace(/^./, (str: string) => str.toUpperCase())}
                  </label>
                  <p className="text-sm text-text-secondary">{setting.description}</p>
                </div>
                <div className="w-48">
                  <Input
                    type={setting.dataType === 'number' || setting.dataType === 'decimal' ? 'number' : 'text'}
                    value={setting.settingValue}
                    onChange={(value: string) => handleSettingChange(setting.settingKey, value)}
                    className="text-right"
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  };

  const renderAttendanceSettings = () => {
    const attendanceSettings = settings.filter(setting => 
      setting.settingKey.includes('attendance') || 
      setting.settingKey.includes('grace') || 
      setting.settingKey.includes('late') || 
      setting.settingKey.includes('early')
    );

    return (
      <div className="space-y-6">
        <Card>
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-text-primary">Attendance Rules</h3>
            <p className="text-sm text-text-secondary">
              Configure attendance tracking and validation rules
            </p>
          </div>
          <div className="p-6 space-y-4">
            {attendanceSettings.map((setting) => (
              <div key={setting.id} className="flex items-center justify-between">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    {setting.settingKey.replace(/([A-Z])/g, ' $1').replace(/^./, (str: string) => str.toUpperCase())}
                  </label>
                  <p className="text-sm text-text-secondary">{setting.description}</p>
                </div>
                <div className="w-48">
                  <Input
                    type={setting.dataType === 'number' || setting.dataType === 'decimal' ? 'number' : 'text'}
                    value={setting.settingValue}
                    onChange={(value: string) => handleSettingChange(setting.settingKey, value)}
                    className="text-right"
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  };

  const renderPayrollSettings = () => {
    const payrollSettings = settings.filter(setting => 
      setting.settingKey.includes('payroll') || 
      setting.settingKey.includes('overtime') || 
      setting.settingKey.includes('monthly') ||
      setting.settingKey.includes('max_overtime')
    );

    return (
      <div className="space-y-6">
        <Card>
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-text-primary">Payroll Configuration</h3>
            <p className="text-sm text-text-secondary">
              Configure payroll processing and calculation settings
            </p>
          </div>
          <div className="p-6 space-y-4">
            {payrollSettings.map((setting) => (
              <div key={setting.id} className="flex items-center justify-between">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    {setting.settingKey.replace(/([A-Z])/g, ' $1').replace(/^./, (str: string) => str.toUpperCase())}
                  </label>
                  <p className="text-sm text-text-secondary">{setting.description}</p>
                </div>
                <div className="w-48">
                  <Input
                    type={setting.dataType === 'number' || setting.dataType === 'decimal' ? 'number' : 'text'}
                    value={setting.settingValue}
                    onChange={(value: string) => handleSettingChange(setting.settingKey, value)}
                    className="text-right"
                    step={setting.dataType === 'decimal' ? '0.1' : undefined}
                    min={setting.settingKey.includes('day') ? '1' : undefined}
                    max={setting.settingKey.includes('day') ? '31' : undefined}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralSettings();
      case 'attendance':
        return renderAttendanceSettings();
      case 'payroll':
        return renderPayrollSettings();
      case 'users':
        return (
          <Card>
            <div className="p-6 text-center">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-2">User Management</h3>
              <p className="text-sm text-text-secondary">
                User management settings will be available in a future update.
              </p>
            </div>
          </Card>
        );
      case 'security':
        return (
          <Card>
            <div className="p-6 text-center">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-2">Security Settings</h3>
              <p className="text-sm text-text-secondary">
                Security settings will be available in a future update.
              </p>
            </div>
          </Card>
        );
      case 'system':
        return (
          <Card>
            <div className="p-6 text-center">
              <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-2">System Information</h3>
              <p className="text-sm text-text-secondary">
                System information and maintenance tools will be available in a future update.
              </p>
            </div>
          </Card>
        );
      default:
        return renderGeneralSettings();
    }
  };

  return (
    <PageLayout
      title="System Settings"
      subtitle="Configure system parameters and preferences"
    >
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64">
          <Card padding="sm">
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-button-primary text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          </Card>
        </div>

        {/* Content */}
        <div className="flex-1">
          {renderTabContent()}
        </div>
      </div>
    </PageLayout>
  );
};

export default Settings;
