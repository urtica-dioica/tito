import React, { useState } from 'react';
import { Settings as SettingsIcon, Clock, DollarSign, Database } from 'lucide-react';
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
    { id: 'system', label: 'System', icon: Database },
  ];

  const renderGeneralSettings = () => {
    // Show a welcome message and overview of all settings
    return (
      <div className="space-y-6">
        <Card>
          <div className="p-6 text-center">
            <SettingsIcon className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-text-primary mb-2">System Settings Overview</h3>
            <p className="text-sm text-text-secondary mb-4">
              Configure your HR system settings across different categories. Use the tabs above to navigate to specific setting categories.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h4 className="font-medium text-blue-900">Attendance</h4>
                <p className="text-sm text-blue-700">Time tracking and session rules</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h4 className="font-medium text-green-900">Payroll</h4>
                <p className="text-sm text-green-700">Payment and calculation settings</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <Database className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <h4 className="font-medium text-purple-900">System</h4>
                <p className="text-sm text-purple-700">Core system configuration</p>
              </div>
            </div>
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
      setting.settingKey.includes('expected_monthly') || 
      setting.settingKey.includes('overtime_to_leave')
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


  const renderSystemSettings = () => {
    // Show system information and maintenance settings
    const systemSettings = settings.filter(setting => 
      setting.settingKey.includes('qr_code') || 
      setting.settingKey.includes('selfie_retention') ||
      setting.settingKey.includes('attendance_calculation_updated')
    );

    return (
      <div className="space-y-6">
        <Card>
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-text-primary">System Configuration</h3>
            <p className="text-sm text-text-secondary">
              Core system settings and configuration parameters
            </p>
          </div>
          <div className="p-6 space-y-4">
            {systemSettings.map((setting) => (
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
                    min={setting.settingKey.includes('day') || setting.settingKey.includes('year') ? '1' : undefined}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
        
        <Card>
          <div className="p-6 text-center">
            <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-text-primary mb-2">System Maintenance</h3>
            <p className="text-sm text-text-secondary">
              System maintenance tools will be available in a future update.
            </p>
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
      case 'system':
        return renderSystemSettings();
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
