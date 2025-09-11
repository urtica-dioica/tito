import React, { useState } from 'react';
import { 
  Calendar, 
  Users, 
  Plus, 
  Search, 
  // Filter,
  // Download,
  Upload,
  RefreshCw,
  AlertCircle,
  // CheckCircle,
  // Clock,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import Button from '../../components/shared/Button';
// import Badge from '../../components/shared/Badge';
import Card from '../../components/shared/Card';
// import Modal from '../../components/shared/Modal';
import PageLayout from '../../components/layout/PageLayout';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { 
  useLeaveBalances, 
  useLeaveBalanceStats, 
  useDeleteLeaveBalance,
  useBulkUpdateLeaveBalances,
  useInitializeYearLeaveBalances
} from '../../hooks/useLeaveBalance';
import { useDepartments } from '../../hooks/useDepartments';
import LeaveBalanceForm from '../../components/hr/LeaveBalanceForm';
import LeaveBalanceTable from '../../components/hr/LeaveBalanceTable';
import BulkLeaveBalanceModal from '../../components/hr/BulkLeaveBalanceModal';
import YearInitializationModal from '../../components/hr/YearInitializationModal';

const LeaveBalances: React.FC = () => {
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isYearInitModalOpen, setIsYearInitModalOpen] = useState(false);
  const [selectedBalance, setSelectedBalance] = useState<any>(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: '',
    departmentId: '',
    leaveType: '',
    year: new Date().getFullYear(),
    sortBy: 'updated_at',
    sortOrder: 'desc' as 'asc' | 'desc'
  });

  // Fetch data
  const { data: leaveBalances, isLoading: balancesLoading, error: balancesError, refetch } = useLeaveBalances({
    ...filters,
    leaveType: filters.leaveType as 'vacation' | 'sick' | 'maternity' | 'other' | undefined
  });
  const { data: stats, isLoading: statsLoading } = useLeaveBalanceStats(filters.departmentId, filters.year);
  const { data: departments } = useDepartments();

  // Mutations
  const deleteBalanceMutation = useDeleteLeaveBalance();
  const bulkUpdateMutation = useBulkUpdateLeaveBalances();
  const yearInitMutation = useInitializeYearLeaveBalances();

  const handleSearch = (searchTerm: string) => {
    setFilters(prev => ({ ...prev, search: searchTerm, page: 1 }));
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleSort = (sortBy: string) => {
    setFilters(prev => ({
      ...prev,
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'asc' ? 'desc' : 'asc',
      page: 1
    }));
  };

  const handleEditBalance = (balance: any) => {
    setSelectedBalance(balance);
    setIsFormModalOpen(true);
  };

  const handleDeleteBalance = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this leave balance?')) {
      try {
        await deleteBalanceMutation.mutateAsync(id);
      } catch (error) {
        console.error('Error deleting leave balance:', error);
      }
    }
  };

  const handleBulkUpdate = async (balances: any[]) => {
    try {
      await bulkUpdateMutation.mutateAsync(balances);
      setIsBulkModalOpen(false);
    } catch (error) {
      console.error('Error bulk updating leave balances:', error);
    }
  };

  const handleYearInitialization = async (data: any) => {
    try {
      await yearInitMutation.mutateAsync(data);
      setIsYearInitModalOpen(false);
    } catch (error) {
      console.error('Error initializing year leave balances:', error);
    }
  };

  const getLeaveTypeColor = (leaveType: string) => {
    switch (leaveType) {
      case 'vacation': return 'bg-blue-100 text-blue-800';
      case 'sick': return 'bg-green-100 text-green-800';
      case 'maternity': return 'bg-pink-100 text-pink-800';
      case 'other': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLeaveTypeLabel = (leaveType: string) => {
    switch (leaveType) {
      case 'vacation': return 'Vacation';
      case 'sick': return 'Sick';
      case 'maternity': return 'Maternity';
      case 'other': return 'Other';
      default: return leaveType;
    }
  };

  if (balancesLoading || statsLoading) {
    return (
      <PageLayout title="Leave Balances" subtitle="Loading leave balance data...">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </PageLayout>
    );
  }

  if (balancesError) {
    return (
      <PageLayout title="Leave Balances" subtitle="Error loading leave balance data">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">
            Error loading leave balance data: {(balancesError as Error).message}
          </p>
          <Button 
            variant="outline" 
            onClick={() => refetch()}
            className="mt-4"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Leave Balances"
      subtitle="Manage employee leave balances and allocations"
    >
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Employees</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalEmployees}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Leave Days</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalLeaveDays}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Used Days</p>
                <p className="text-2xl font-bold text-gray-900">{stats.usedLeaveDays}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingDown className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available Days</p>
                <p className="text-2xl font-bold text-gray-900">{stats.availableLeaveDays}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Leave Type Breakdown */}
      {stats && (
        <Card className="p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Leave Type Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(stats.byLeaveType).map(([leaveType, data]) => (
              <div key={leaveType} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getLeaveTypeColor(leaveType)}`}>
                    {getLeaveTypeLabel(leaveType)}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-medium">{data.total}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Used:</span>
                    <span className="font-medium text-red-600">{data.used}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Available:</span>
                    <span className="font-medium text-green-600">{data.available}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Filters and Actions */}
      <Card className="p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search employees..."
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={filters.departmentId}
              onChange={(e) => handleFilterChange('departmentId', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Departments</option>
              {departments?.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>

            <select
              value={filters.leaveType}
              onChange={(e) => handleFilterChange('leaveType', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Leave Types</option>
              <option value="vacation">Vacation</option>
              <option value="sick">Sick</option>
              <option value="maternity">Maternity</option>
              <option value="other">Other</option>
            </select>

            <select
              value={filters.year}
              onChange={(e) => handleFilterChange('year', parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={balancesLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${balancesLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            <Button
              variant="outline"
              onClick={() => setIsBulkModalOpen(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Bulk Update
            </Button>

            <Button
              variant="outline"
              onClick={() => setIsYearInitModalOpen(true)}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Initialize Year
            </Button>

            <Button
              variant="primary"
              onClick={() => {
                setSelectedBalance(null);
                setIsFormModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Balance
            </Button>
          </div>
        </div>
      </Card>

      {/* Leave Balances Table */}
      <Card className="p-6">
        <LeaveBalanceTable
          balances={leaveBalances?.balances || []}
          loading={balancesLoading}
          onEdit={handleEditBalance}
          onDelete={handleDeleteBalance}
          onSort={handleSort}
          sortBy={filters.sortBy}
          sortOrder={filters.sortOrder}
          pagination={{
            page: filters.page,
            limit: filters.limit,
            total: leaveBalances?.total || 0,
            totalPages: leaveBalances?.totalPages || 0,
            onPageChange: handlePageChange
          }}
        />
      </Card>

      {/* Modals */}
      <LeaveBalanceForm
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        balance={selectedBalance}
      />

      <BulkLeaveBalanceModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSubmit={handleBulkUpdate}
        departmentId={filters.departmentId}
      />

      <YearInitializationModal
        isOpen={isYearInitModalOpen}
        onClose={() => setIsYearInitModalOpen(false)}
        onSubmit={handleYearInitialization}
      />
    </PageLayout>
  );
};

export default LeaveBalances;
