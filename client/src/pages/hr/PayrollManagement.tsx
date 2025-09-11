import React, { useState } from 'react';
import { DollarSign, Calendar, Users, FileText, CheckCircle, AlertCircle, CreditCard, Gift, Zap, Receipt } from 'lucide-react';
import Card from '../../components/shared/Card';
import PageLayout from '../../components/layout/PageLayout';
import { usePayrollStats, usePayrollPeriods } from '../../hooks/usePayroll';
import { 
  DeductionTypeManagement, 
  BenefitTypeManagement, 
  EmployeeDeductionBalanceManagement, 
  EmployeeBenefitManagement,
  PayrollPeriodManagement,
  PayrollApprovalManagement,
  PayrollProcessingManagement,
  PayrollRecordsManagement,
  PayrollHistoryManagement
} from '../../components/features/payroll';

const PayrollManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'payroll-periods' | 'payroll-processing' | 'payroll-records' | 'payroll-approvals' | 'payroll-history' | 'deduction-types' | 'benefit-types' | 'employee-deductions' | 'employee-benefits'>('overview');
  
  // Fetch real data for overview
  const { data: statsData } = usePayrollStats();
  const { data: periodsData } = usePayrollPeriods({ page: 1, limit: 100 });
  
  const stats = statsData || { totalEmployees: 0, totalPayroll: 0, processedPeriods: 0, pendingPeriods: 0 };
  const periods = periodsData?.periods || [];
  const currentPeriod = periods.find(p => p.status === 'processing') || periods[0];
  const pendingApprovals = periods.filter(p => p.status === 'draft').length;
  
  const tabs = [
    { id: 'overview', label: 'Overview', icon: DollarSign },
    { id: 'payroll-periods', label: 'Payroll Periods', icon: Calendar },
    { id: 'payroll-processing', label: 'Processing', icon: Zap },
    { id: 'payroll-records', label: 'Payroll Records', icon: Receipt },
    { id: 'payroll-approvals', label: 'Approvals', icon: CheckCircle },
    { id: 'payroll-history', label: 'History', icon: FileText },
    { id: 'deduction-types', label: 'Deduction Types', icon: CreditCard },
    { id: 'benefit-types', label: 'Benefit Types', icon: Gift },
    { id: 'employee-deductions', label: 'Employee Deductions', icon: AlertCircle },
    { id: 'employee-benefits', label: 'Employee Benefits', icon: CheckCircle },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-500" />
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Total Employees</h3>
                    <p className="text-2xl font-bold text-blue-600">{stats.totalEmployees || 0}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-green-500" />
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Total Payroll</h3>
                    <p className="text-2xl font-bold text-green-600">₱{stats.totalPayroll || 0}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center">
                  <Calendar className="h-8 w-8 text-purple-500" />
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Current Period</h3>
                    <p className="text-2xl font-bold text-purple-600">{currentPeriod?.periodName || '-'}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center">
                  <FileText className="h-8 w-8 text-orange-500" />
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Pending</h3>
                    <p className="text-2xl font-bold text-orange-600">{pendingApprovals}</p>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payroll System Overview</h3>
              <p className="text-gray-600 mb-4">
                The payroll system follows a comprehensive workflow for managing employee compensation:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Setup Phase (HR Admin)</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                    <li>Create deduction types (percentage or fixed amount)</li>
                    <li>Create benefit types for employee benefits</li>
                    <li>Upload employee deduction balances via CSV</li>
                    <li>Assign benefits to employees</li>
                    <li>Auto-generate monthly payroll periods with actual working days calculated</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Processing Phase (System)</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                    <li>Automatic monthly payroll period generation</li>
                    <li>Base salary calculation (176 hours = full salary)</li>
                    <li>Automatic deduction application until balance reaches zero</li>
                    <li>Benefits addition to net pay</li>
                    <li>Late deduction calculation based on attendance</li>
                    <li>Send payroll to departments for review and approval</li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Payroll Calculation Formula</h4>
                <p className="text-sm text-blue-800">
                  <strong>Net Pay = Base Salary - Deductions - Late Deductions + Benefits</strong>
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Where: Base Salary is paid based on actual working days in the month (excluding weekends), 
                  deductions are automatically applied from employee balances, 
                  late deductions are calculated based on attendance, 
                  and benefits are added to the final amount.
                </p>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('payroll-periods')}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <Calendar className="h-6 w-6 text-blue-500 mb-2" />
                  <h4 className="font-medium text-gray-900">Payroll Periods</h4>
                  <p className="text-sm text-gray-600">Create and manage payroll periods</p>
                </button>
                
                <button
                  onClick={() => setActiveTab('payroll-approvals')}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <CheckCircle className="h-6 w-6 text-green-500 mb-2" />
                  <h4 className="font-medium text-gray-900">Approvals</h4>
                  <p className="text-sm text-gray-600">Track department approval status</p>
                </button>
                
                <button
                  onClick={() => setActiveTab('deduction-types')}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <CreditCard className="h-6 w-6 text-purple-500 mb-2" />
                  <h4 className="font-medium text-gray-900">Deduction Types</h4>
                  <p className="text-sm text-gray-600">Create and configure deduction types</p>
                </button>
                
                <button
                  onClick={() => setActiveTab('benefit-types')}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <Gift className="h-6 w-6 text-pink-500 mb-2" />
                  <h4 className="font-medium text-gray-900">Benefit Types</h4>
                  <p className="text-sm text-gray-600">Create and configure benefit types</p>
                </button>
                
                <button
                  onClick={() => setActiveTab('employee-deductions')}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <AlertCircle className="h-6 w-6 text-orange-500 mb-2" />
                  <h4 className="font-medium text-gray-900">Employee Deductions</h4>
                  <p className="text-sm text-gray-600">Upload and manage employee deduction balances</p>
                </button>
                
                <button
                  onClick={() => setActiveTab('employee-benefits')}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <CheckCircle className="h-6 w-6 text-emerald-500 mb-2" />
                  <h4 className="font-medium text-gray-900">Employee Benefits</h4>
                  <p className="text-sm text-gray-600">Assign and manage employee benefits</p>
                </button>
              </div>
            </Card>
          </div>
        );
      case 'payroll-periods':
        return <PayrollPeriodManagement />;
      case 'payroll-processing':
        return <PayrollProcessingManagement />;
      case 'payroll-records':
        return <PayrollRecordsManagement />;
      case 'payroll-approvals':
        return <PayrollApprovalManagement />;
      case 'payroll-history':
        return <PayrollHistoryManagement />;
      case 'deduction-types':
        return <DeductionTypeManagement />;
      case 'benefit-types':
        return <BenefitTypeManagement />;
      case 'employee-deductions':
        return <EmployeeDeductionBalanceManagement />;
      case 'employee-benefits':
        return <EmployeeBenefitManagement />;
      default:
        return null;
    }
  };

  return (
    <PageLayout
      title="Payroll Management"
      subtitle="Process payroll and manage employee compensation with the comprehensive system"
    >
      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="transition-all duration-300 ease-in-out">
        {renderTabContent()}
      </div>
    </PageLayout>
  );
};

export default PayrollManagement;