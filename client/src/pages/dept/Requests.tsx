import React, { useState } from 'react';
import { FileText, Clock, Calendar, Check, X, Eye, User } from 'lucide-react';
import Button from '../../components/shared/Button';
import Badge from '../../components/shared/Badge';
import Modal from '../../components/shared/Modal';
import PageLayout from '../../components/layout/PageLayout';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { 
  useDepartmentHeadRequests, 
  useDepartmentHeadRequestStats,
  useApproveRequest,
  useRejectRequest
} from '../../hooks/useDepartmentHead';

// Mock data types - TODO: Replace with actual types from API
interface Request {
  id: string;
  type: 'time_correction' | 'overtime' | 'leave';
  employeeId: string;
  employeeName: string;
  departmentName: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  approverName?: string;
  approvedAt?: string;
  details: any;
}

const DepartmentRequests: React.FC = () => {
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending');

  // Fetch real data from API
  const { data: requestsData, isLoading: requestsLoading, error: requestsError } = useDepartmentHeadRequests({
    type: (filterType as 'time_correction' | 'overtime' | 'leave') || undefined,
    status: (filterStatus as 'pending' | 'approved' | 'rejected') || undefined,
    page: 1,
    limit: 50
  });
  const { data: stats, isLoading: statsLoading, error: statsError } = useDepartmentHeadRequestStats();
  const approveRequestMutation = useApproveRequest();
  const rejectRequestMutation = useRejectRequest();

  const requests = requestsData?.requests || [];
  const filteredRequests = requests; // Already filtered by API

  const handleViewRequest = (request: any) => {
    setSelectedRequest(request);
    setIsViewModalOpen(true);
  };

  const handleApproveRequest = (request: any) => {
    setSelectedRequest(request);
    setIsApproveModalOpen(true);
  };

  const handleRejectRequest = (request: any) => {
    setSelectedRequest(request);
    setIsRejectModalOpen(true);
  };

  const handleConfirmApprove = async () => {
    if (selectedRequest) {
      try {
        await approveRequestMutation.mutateAsync(selectedRequest.id);
        setIsApproveModalOpen(false);
        setSelectedRequest(null);
      } catch (error) {
        console.error('Error approving request:', error);
      }
    }
  };

  const handleConfirmReject = async () => {
    if (selectedRequest) {
      try {
        await rejectRequestMutation.mutateAsync({ requestId: selectedRequest.id });
        setIsRejectModalOpen(false);
        setSelectedRequest(null);
      } catch (error) {
        console.error('Error rejecting request:', error);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'approved':
        return <Badge variant="success">Approved</Badge>;
      case 'rejected':
        return <Badge variant="error">Rejected</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'time_correction':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'overtime':
        return <Calendar className="h-5 w-5 text-yellow-600" />;
      case 'leave':
        return <FileText className="h-5 w-5 text-green-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'time_correction':
        return 'Time Correction';
      case 'overtime':
        return 'Overtime';
      case 'leave':
        return 'Leave Request';
      default:
        return type;
    }
  };

  // Loading state
  if (requestsLoading || statsLoading) {
    return (
      <PageLayout title="Department Requests" subtitle="Loading request information...">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </PageLayout>
    );
  }

  // Error state
  if (requestsError || statsError) {
    return (
      <PageLayout title="Department Requests" subtitle="Error loading request data">
        <div className="text-center py-12">
          <p className="text-red-600">
            Error loading request data: {requestsError?.message || statsError?.message}
          </p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Department Requests"
      subtitle="Review and approve employee requests from your department"
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
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-text-primary">Employee Requests</h3>
                <p className="text-sm text-text-secondary">
                  Review and approve requests from your department employees
                </p>
              </div>
              
              {/* Filters - Beside the header title */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="h-10 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-button-primary focus:border-transparent text-sm w-32"
                  >
                    <option value="">All Types</option>
                    <option value="time_correction">Time Correction</option>
                    <option value="overtime">Overtime</option>
                    <option value="leave">Leave</option>
                  </select>
                  
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="h-10 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-button-primary focus:border-transparent text-sm w-32"
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                
                <div className="text-sm text-text-secondary">
                  {filteredRequests.length} requests found
                </div>
              </div>
            </div>
          </div>

          {/* Request List */}
          <div className="p-6">
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {filteredRequests.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-text-secondary">No requests found</p>
                </div>
              ) : (
                filteredRequests.map((request) => (
                  <div key={request.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                          {getTypeIcon(request.type)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-text-primary">
                            {getTypeLabel(request.type)}
                          </h4>
                          <p className="text-sm text-text-secondary">{request.employeeName}</p>
                          <p className="text-xs text-text-secondary">
                            {new Date(request.submittedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        {getStatusBadge(request.status)}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleViewRequest(request)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {request.status === 'pending' && (
                          <>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleApproveRequest(request)}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleRejectRequest(request)}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Request Details Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Request Details"
      >
        {selectedRequest && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                {getTypeIcon(selectedRequest.type)}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-text-primary">
                  {getTypeLabel(selectedRequest.type)}
                </h3>
                <p className="text-text-secondary">{selectedRequest.employeeName}</p>
                <div className="flex items-center space-x-2 mt-2">
                  {getStatusBadge(selectedRequest.status)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Employee ID
                </label>
                <p className="text-text-primary">{selectedRequest.employeeId}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Department
                </label>
                <p className="text-text-primary">{selectedRequest.departmentName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Submitted At
                </label>
                <p className="text-text-primary">
                  {new Date(selectedRequest.submittedAt).toLocaleString()}
                </p>
              </div>
              {selectedRequest.approverName && (
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Approved By
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
          </div>
        )}
      </Modal>

      {/* Approve Request Modal */}
      <Modal
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        title="Approve Request"
      >
        {selectedRequest && (
          <div className="space-y-4">
            <p>Are you sure you want to approve this request?</p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="secondary"
                onClick={() => setIsApproveModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmApprove}
                disabled={approveRequestMutation.isPending}
              >
                {approveRequestMutation.isPending ? 'Approving...' : 'Approve'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Request Modal */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title="Reject Request"
      >
        {selectedRequest && (
          <div className="space-y-4">
            <p>Are you sure you want to reject this request?</p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="secondary"
                onClick={() => setIsRejectModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmReject}
                disabled={rejectRequestMutation.isPending}
              >
                {rejectRequestMutation.isPending ? 'Rejecting...' : 'Reject'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </PageLayout>
  );
};

export default DepartmentRequests;