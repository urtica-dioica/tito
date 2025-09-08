import React, { useState } from 'react';
import { Plus, Clock, Calendar, FileText, Eye, Edit, Filter } from 'lucide-react';
import Card from '../../components/shared/Card';
import Badge from '../../components/shared/Badge';
import Button from '../../components/shared/Button';
import Modal from '../../components/shared/Modal';
import PageLayout from '../../components/layout/PageLayout';

// Mock data types - TODO: Replace with actual types from API
interface Request {
  id: string;
  type: 'time_correction' | 'overtime' | 'leave';
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  approverName?: string;
  approvedAt?: string;
  rejectionReason?: string;
  details: any;
}

interface LeaveBalance {
  vacation: number;
  sick: number;
  personal: number;
  emergency: number;
}

const EmployeeRequests: React.FC = () => {
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Mock data - TODO: Replace with actual API calls
  const requests: Request[] = [
    {
      id: '1',
      type: 'leave',
      status: 'pending',
      submittedAt: '2025-01-14T16:45:00Z',
      details: {
        leaveType: 'vacation',
        startDate: '2025-01-20',
        endDate: '2025-01-24',
        reason: 'Family vacation',
        days: 5,
      },
    },
    {
      id: '2',
      type: 'overtime',
      status: 'approved',
      submittedAt: '2025-01-12T15:30:00Z',
      approverName: 'Jane Smith (Department Head)',
      approvedAt: '2025-01-13T10:15:00Z',
      details: {
        requestDate: '2025-01-12',
        overtimeDate: '2025-01-13',
        startTime: '17:00',
        endTime: '21:00',
        requestedHours: 4,
        reason: 'Client presentation preparation',
      },
    },
    {
      id: '3',
      type: 'time_correction',
      status: 'rejected',
      submittedAt: '2025-01-10T09:30:00Z',
      approverName: 'Jane Smith (Department Head)',
      approvedAt: '2025-01-11T14:20:00Z',
      rejectionReason: 'Insufficient documentation provided',
      details: {
        correctionDate: '2025-01-09',
        sessionType: 'morning',
        requestedClockIn: '2025-01-09T08:00:00Z',
        requestedClockOut: '2025-01-09T17:00:00Z',
        reason: 'Forgot to clock in due to emergency meeting',
      },
    },
    {
      id: '4',
      type: 'leave',
      status: 'approved',
      submittedAt: '2025-01-08T14:20:00Z',
      approverName: 'Jane Smith (Department Head)',
      approvedAt: '2025-01-09T09:30:00Z',
      details: {
        leaveType: 'sick',
        startDate: '2025-01-15',
        endDate: '2025-01-15',
        reason: 'Medical appointment',
        days: 1,
      },
    },
  ];

  const leaveBalance: LeaveBalance = {
    vacation: 12,
    sick: 8,
    personal: 3,
    emergency: 2,
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

  const getLeaveTypeLabel = (type: string) => {
    switch (type) {
      case 'vacation': return 'Vacation Leave';
      case 'sick': return 'Sick Leave';
      case 'personal': return 'Personal Leave';
      case 'emergency': return 'Emergency Leave';
      default: return type;
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesType = !filterType || request.type === filterType;
    const matchesStatus = !filterStatus || request.status === filterStatus;
    return matchesType && matchesStatus;
  });

  const requestStats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };

  const handleViewRequest = (request: Request) => {
    setSelectedRequest(request);
    setIsViewModalOpen(true);
  };

  const handleEditRequest = (request: Request) => {
    setSelectedRequest(request);
    setIsEditModalOpen(true);
  };


  const handleCreateRequest = () => {
    setIsCreateModalOpen(true);
  };

  return (
    <PageLayout
      title="My Requests"
      subtitle="Manage your time corrections, overtime, and leave requests"
      actions={
        <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={handleCreateRequest}>
          New Request
        </Button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Leave Balance & Statistics */}
        <div className="space-y-6">
          {/* Leave Balance */}
          <Card>
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-text-primary">Leave Balance</h3>
              <p className="text-sm text-text-secondary">
                Your current leave entitlements and remaining days
              </p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{leaveBalance.vacation}</p>
                  <p className="text-sm text-text-secondary">Vacation Days</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{leaveBalance.sick}</p>
                  <p className="text-sm text-text-secondary">Sick Days</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{leaveBalance.personal}</p>
                  <p className="text-sm text-text-secondary">Personal Days</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{leaveBalance.emergency}</p>
                  <p className="text-sm text-text-secondary">Emergency Days</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Request Statistics */}
          <Card>
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-text-primary">Request Statistics</h3>
              <p className="text-sm text-text-secondary">
                Overview of your request history and status
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">Total Requests</p>
                    <p className="text-xs text-text-secondary">All time</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-text-primary">{requestStats.total}</p>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">Pending</p>
                    <p className="text-xs text-text-secondary">Awaiting approval</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-text-primary">{requestStats.pending}</p>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">Approved</p>
                    <p className="text-xs text-text-secondary">Successfully processed</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-text-primary">{requestStats.approved}</p>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <FileText className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">Rejected</p>
                    <p className="text-xs text-text-secondary">Not approved</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-text-primary">{requestStats.rejected}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Filters and Requests */}
        <div className="space-y-6">
          {/* Filters */}
          <Card>
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-text-primary">Filters</h3>
              <p className="text-sm text-text-secondary">
                Filter and search your requests
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-text-secondary" />
                <span className="text-sm font-medium text-text-secondary">Filter by:</span>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Request Type
                  </label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-button-primary focus:border-transparent"
                  >
                    <option value="">All Types</option>
                    <option value="time_correction">Time Correction</option>
                    <option value="overtime">Overtime Request</option>
                    <option value="leave">Leave Request</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Status
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-button-primary focus:border-transparent"
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <Button 
                  variant="secondary" 
                  onClick={() => {
                    setFilterType('');
                    setFilterStatus('');
                  }}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </Card>

          {/* Requests List */}
          <Card>
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-text-primary">Recent Requests</h3>
              <p className="text-sm text-text-secondary">
                {filteredRequests.length} request{filteredRequests.length !== 1 ? 's' : ''} found
              </p>
            </div>
            <div className="p-6">
              {filteredRequests.length > 0 ? (
                <div className="space-y-4">
                  {filteredRequests.map((request) => (
                    <div key={request.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            {getRequestTypeIcon(request.type)}
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-text-primary">
                              {getRequestTypeLabel(request.type)}
                            </h4>
                            <p className="text-xs text-text-secondary">
                              {new Date(request.submittedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-text-secondary mb-3">
                        {request.type === 'leave' && (
                          <p>{getLeaveTypeLabel(request.details.leaveType)} • {request.details.days} day(s)</p>
                        )}
                        {request.type === 'overtime' && (
                          <p>Overtime • {request.details.requestedHours} hours</p>
                        )}
                        {request.type === 'time_correction' && (
                          <p>Time Correction • {request.details.sessionType} session</p>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-text-secondary">
                          {request.approverName && (
                            <span>
                              {request.status === 'approved' ? 'Approved' : 'Rejected'} by {request.approverName}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={<Eye className="h-3 w-3" />}
                            onClick={() => handleViewRequest(request)}
                          >
                            View
                          </Button>
                          {request.status === 'pending' && (
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={<Edit className="h-3 w-3" />}
                              onClick={() => handleEditRequest(request)}
                            >
                              Edit
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-4">
                    <FileText className="h-12 w-12 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-text-primary mb-2">No requests found</h3>
                  <p className="text-sm text-text-secondary">
                    {filterType || filterStatus
                      ? 'Try adjusting your filter criteria.'
                      : 'You haven\'t submitted any requests yet.'
                    }
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
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
                  Submitted
                </label>
                <p className="text-text-primary">
                  {new Date(selectedRequest.submittedAt).toLocaleString()}
                </p>
              </div>
              {selectedRequest.approverName && (
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    {selectedRequest.status === 'approved' ? 'Approved' : 'Rejected'} by
                  </label>
                  <p className="text-text-primary">{selectedRequest.approverName}</p>
                </div>
              )}
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

            {selectedRequest.rejectionReason && (
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Rejection Reason
                </label>
                <p className="text-red-600">{selectedRequest.rejectionReason}</p>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button variant="secondary" onClick={() => setIsViewModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Request Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Request"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Request creation form will be implemented in a future update.
          </p>
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary">
              Create Request
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Request Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Request"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Request editing form will be implemented in a future update.
          </p>
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary">
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </PageLayout>
  );
};

export default EmployeeRequests;
