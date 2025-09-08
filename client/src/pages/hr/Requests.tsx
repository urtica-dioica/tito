import React, { useState } from 'react';
import { FileText, Clock, Calendar, User, Filter, Eye } from 'lucide-react';
import Button from '../../components/shared/Button';
import Card from '../../components/shared/Card';
import Badge from '../../components/shared/Badge';
import Modal from '../../components/shared/Modal';
import PageLayout from '../../components/layout/PageLayout';
import { useRequests, useRequestStats } from '../../hooks/useRequests';
import { useDepartments } from '../../hooks/useDepartments';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import type { Request } from '../../services/requestService';

const Requests: React.FC = () => {
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');

  // Fetch data from API
  const { data: requestsData, isLoading: requestsLoading, error: requestsError } = useRequests({
    type: filterType || undefined,
    status: filterStatus || undefined,
    departmentId: filterDepartment || undefined,
    page: 1,
    limit: 50
  });

  const { data: stats, isLoading: statsLoading } = useRequestStats();
  const { data: departments } = useDepartments();

  if (requestsLoading || statsLoading) {
    return (
      <PageLayout title="Employee Requests" subtitle="Manage and review employee requests">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </PageLayout>
    );
  }

  if (requestsError) {
    return (
      <PageLayout title="Employee Requests" subtitle="Manage and review employee requests">
        <div className="text-center py-12">
          <p className="text-red-600">Error loading requests: {requestsError.message}</p>
        </div>
      </PageLayout>
    );
  }

  const requests = requestsData?.requests || [];

  const handleViewRequest = (request: Request) => {
    setSelectedRequest(request);
    setIsViewModalOpen(true);
  };

  const getRequestTypeIcon = (type: string) => {
    switch (type) {
      case 'time_correction':
        return <Clock className="h-5 w-5" />;
      case 'overtime':
        return <Clock className="h-5 w-5" />;
      case 'leave':
        return <Calendar className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getRequestTypeLabel = (type: string) => {
    switch (type) {
      case 'time_correction':
        return 'Time Correction';
      case 'overtime':
        return 'Overtime Request';
      case 'leave':
        return 'Leave Request';
      default:
        return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesType = !filterType || request.type === filterType;
    const matchesStatus = !filterStatus || request.status === filterStatus;
    const matchesDepartment = !filterDepartment || request.departmentName === filterDepartment;
    return matchesType && matchesStatus && matchesDepartment;
  });

  // const requestStats = {
  //   total: requests.length,
  //   pending: requests.filter(r => r.status === 'pending').length,
  //   approved: requests.filter(r => r.status === 'approved').length,
  //   rejected: requests.filter(r => r.status === 'rejected').length,
  // };

  return (
    <PageLayout
      title="Employee Requests"
      subtitle="View all employee requests (Department heads handle approvals)"
    >
      <div className="space-y-6">
        {/* Top Row - Request Overview (Full Width) */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-text-primary">Request Overview</h3>
            <p className="text-sm text-text-secondary">
              Summary of all employee requests and their current status
            </p>
          </div>
          <div className="flex-1 p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-lg">
                <div className="p-3 bg-blue-100 rounded-lg mb-3">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <p className="text-sm font-medium text-text-secondary mb-1">Total</p>
                <p className="text-2xl font-bold text-text-primary">{stats?.total || 0}</p>
              </div>

              <div className="flex flex-col items-center justify-center p-4 bg-yellow-50 rounded-lg">
                <div className="p-3 bg-yellow-100 rounded-lg mb-3">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <p className="text-sm font-medium text-text-secondary mb-1">Pending</p>
                <p className="text-2xl font-bold text-text-primary">{stats?.pending || 0}</p>
              </div>

              <div className="flex flex-col items-center justify-center p-4 bg-green-50 rounded-lg">
                <div className="p-3 bg-green-100 rounded-lg mb-3">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-sm font-medium text-text-secondary mb-1">Approved</p>
                <p className="text-2xl font-bold text-text-primary">{stats?.approved || 0}</p>
              </div>

              <div className="flex flex-col items-center justify-center p-4 bg-red-50 rounded-lg">
                <div className="p-3 bg-red-100 rounded-lg mb-3">
                  <User className="h-6 w-6 text-red-600" />
                </div>
                <p className="text-sm font-medium text-text-secondary mb-1">Rejected</p>
                <p className="text-2xl font-bold text-text-primary">{stats?.rejected || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row - Employee Requests with Integrated Filters */}
        <Card>
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-text-primary">Employee Requests</h3>
                <p className="text-sm text-text-secondary">
                  {filteredRequests.length} request{filteredRequests.length !== 1 ? 's' : ''} found
                </p>
              </div>
              
              {/* Integrated Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="h-10 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-button-primary focus:border-transparent text-sm"
                  >
                    <option value="">All Types</option>
                    <option value="time_correction">Time Correction</option>
                    <option value="overtime">Overtime Request</option>
                    <option value="leave">Leave Request</option>
                  </select>
                  
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="h-10 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-button-primary focus:border-transparent text-sm"
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  
                  <select
                    value={filterDepartment}
                    onChange={(e) => setFilterDepartment(e.target.value)}
                    className="h-10 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-button-primary focus:border-transparent text-sm"
                  >
                    <option value="">All Departments</option>
                    {departments?.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <Button variant="secondary" icon={<Filter className="h-4 w-4" />} size="sm">
                  Clear
                </Button>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
              {filteredRequests.map((request) => (
                <div key={request.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col space-y-3">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        {getRequestTypeIcon(request.type)}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-text-primary">
                          {getRequestTypeLabel(request.type)}
                        </h4>
                        <Badge variant={getStatusColor(request.status)} className="text-xs">
                          {request.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-xs text-text-secondary">
                      <div>
                        <span className="font-medium text-text-primary">{request.employeeName}</span>
                        <p>{request.employeeId}</p>
                      </div>
                      <div>
                        <span className="text-text-secondary">Department:</span>
                        <p className="font-medium text-text-primary">{request.departmentName}</p>
                      </div>
                      <div>
                        <span className="text-text-secondary">Submitted:</span>
                        <p className="font-medium text-text-primary">
                          {new Date(request.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<Eye className="h-3 w-3" />}
                      onClick={() => handleViewRequest(request)}
                      className="w-full"
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            {filteredRequests.length === 0 && (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-3">
                  <FileText className="h-8 w-8 mx-auto" />
                </div>
                <h3 className="text-sm font-medium text-text-primary mb-1">No requests found</h3>
                <p className="text-xs text-text-secondary">
                  {filterType || filterStatus || filterDepartment
                    ? 'Try adjusting your filter criteria.'
                    : 'No employee requests have been submitted yet.'
                  }
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* View Request Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Request Details"
        size="lg"
      >
        {selectedRequest && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Request Type
                </label>
                <p className="text-text-primary">{getRequestTypeLabel(selectedRequest.type)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Status
                </label>
                <Badge variant={getStatusColor(selectedRequest.status)}>
                  {selectedRequest.status}
                </Badge>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Employee
                </label>
                <p className="text-text-primary">{selectedRequest.employeeName}</p>
                <p className="text-sm text-text-secondary">{selectedRequest.employeeId}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Department
                </label>
                <p className="text-text-primary">{selectedRequest.departmentName}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Request Details
              </label>
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="text-sm text-text-primary whitespace-pre-wrap">
                  {JSON.stringify(selectedRequest.details, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button variant="secondary" onClick={() => setIsViewModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </PageLayout>
  );
};

export default Requests;
