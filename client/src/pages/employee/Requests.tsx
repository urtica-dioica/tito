import React, { useState } from 'react';
import { Plus, Clock, Calendar, FileText, Eye, Edit, Filter, AlertCircle, CheckCircle } from 'lucide-react';
import Card from '../../components/shared/Card';
import Badge from '../../components/shared/Badge';
import Button from '../../components/shared/Button';
import Modal from '../../components/shared/Modal';
import PageLayout from '../../components/layout/PageLayout';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { useEmployeeRequests, useRequestStats, useLeaveBalance, useCreateLeaveRequest, useCreateTimeCorrectionRequest, useCreateOvertimeRequest } from '../../hooks/useEmployee';
import type { Request } from '../../services/employeeService';

const EmployeeRequests: React.FC = () => {
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Form state
  const [requestType, setRequestType] = useState<'leave' | 'overtime' | 'time_correction'>('leave');
  const [formData, setFormData] = useState({
    // Leave request fields
    leaveType: 'vacation' as 'vacation' | 'sick' | 'maternity' | 'other',
    startDate: '',
    endDate: '',
    // Overtime request fields
    overtimeDate: '',
    startTime: '',
    endTime: '',
    // Time correction fields
    correctionDate: '',
    sessionType: 'morning_in' as 'morning_in' | 'morning_out' | 'afternoon_in' | 'afternoon_out',
    requestedTime: '',
    // Common fields
    reason: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Mutation hooks
  const createLeaveRequest = useCreateLeaveRequest();
  const createTimeCorrectionRequest = useCreateTimeCorrectionRequest();
  const createOvertimeRequest = useCreateOvertimeRequest();

  // Fetch data from API
  const { data: requests = [], isLoading: requestsLoading, error: requestsError } = useEmployeeRequests({
    type: filterType || undefined,
    status: filterStatus || undefined,
    limit: 50
  });

  // Debug: Log requests data
  console.log('Requests data:', requests);
  console.log('Requests count:', requests.length);
  console.log('Request IDs:', requests.map(r => r.id));
  
  const { data: requestStats, isLoading: statsLoading, error: statsError } = useRequestStats();
  const { data: leaveBalance, isLoading: leaveLoading, error: leaveError } = useLeaveBalance();

  // Show loading state
  if (requestsLoading || statsLoading || leaveLoading) {
    return (
      <PageLayout title="My Requests" subtitle="Loading request data...">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </PageLayout>
    );
  }

  // Show error state
  if (requestsError || statsError || leaveError) {
    return (
      <PageLayout title="My Requests" subtitle="Error loading request data">
        <Card className="p-6 text-center">
          <p className="text-red-600">Failed to load request data. Please try again later.</p>
        </Card>
      </PageLayout>
    );
  }

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
      case 'maternity': return 'Maternity Leave';
      case 'other': return 'Other Leave';
      default: return type;
    }
  };

  // Since we're filtering on the backend, we can use the requests directly
  const filteredRequests = requests;

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
    setSubmitSuccess(false);
    setFormErrors({});
    // Reset form data
    setFormData({
      leaveType: 'vacation',
      startDate: '',
      endDate: '',
      overtimeDate: '',
      startTime: '',
      endTime: '',
      correctionDate: '',
      sessionType: 'morning_in',
      requestedTime: '',
      reason: ''
    });
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.reason.trim()) {
      errors.reason = 'Reason is required';
    }

    if (requestType === 'leave') {
      if (!formData.startDate) errors.startDate = 'Start date is required';
      if (!formData.endDate) errors.endDate = 'End date is required';
      if (formData.startDate && formData.endDate && new Date(formData.startDate) > new Date(formData.endDate)) {
        errors.endDate = 'End date must be after start date';
      }
    } else if (requestType === 'overtime') {
      if (!formData.overtimeDate) errors.overtimeDate = 'Overtime date is required';
      if (!formData.startTime) errors.startTime = 'Start time is required';
      if (!formData.endTime) errors.endTime = 'End time is required';
      
      // Validate time format
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (formData.startTime && !timeRegex.test(formData.startTime)) {
        errors.startTime = 'Invalid time format. Use HH:MM (e.g., 09:30)';
      }
      if (formData.endTime && !timeRegex.test(formData.endTime)) {
        errors.endTime = 'Invalid time format. Use HH:MM (e.g., 09:30)';
      }
      
      if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
        errors.endTime = 'End time must be after start time';
      }
    } else if (requestType === 'time_correction') {
      if (!formData.correctionDate) errors.correctionDate = 'Correction date is required';
      if (!formData.requestedTime) errors.requestedTime = 'Requested time is required';
      
      // Validate time format
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (formData.requestedTime && !timeRegex.test(formData.requestedTime)) {
        errors.requestedTime = 'Invalid time format. Use HH:MM (e.g., 09:30)';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted!', { requestType, formData });
    
    if (!validateForm()) {
      console.log('Form validation failed:', formErrors);
      return;
    }

    console.log('Form validation passed, starting submission...');
    setIsSubmitting(true);
    setFormErrors({});

    try {
      let result;

      if (requestType === 'leave') {
        console.log('Creating leave request with data:', {
          leaveType: formData.leaveType,
          startDate: formData.startDate,
          endDate: formData.endDate,
          reason: formData.reason
        });
        result = await createLeaveRequest.mutateAsync({
          leaveType: formData.leaveType,
          startDate: formData.startDate,
          endDate: formData.endDate,
          reason: formData.reason
        });
      } else if (requestType === 'overtime') {
        console.log('Creating overtime request with data:', {
          overtimeDate: formData.overtimeDate,
          startTime: formData.startTime,
          endTime: formData.endTime,
          reason: formData.reason
        });
        result = await createOvertimeRequest.mutateAsync({
          overtimeDate: formData.overtimeDate,
          startTime: formData.startTime,
          endTime: formData.endTime,
          reason: formData.reason
        });
      } else if (requestType === 'time_correction') {
        console.log('Creating time correction request with data:', {
          correctionDate: formData.correctionDate,
          sessionType: formData.sessionType,
          requestedTime: formData.requestedTime,
          reason: formData.reason
        });
        result = await createTimeCorrectionRequest.mutateAsync({
          correctionDate: formData.correctionDate,
          sessionType: formData.sessionType as 'morning_in' | 'morning_out' | 'afternoon_in' | 'afternoon_out',
          requestedTime: formData.requestedTime,
          reason: formData.reason
        });
      }

      if (result?.success) {
        setSubmitSuccess(true);
        setTimeout(() => {
          setIsCreateModalOpen(false);
          setSubmitSuccess(false);
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error creating request:', error);
      setFormErrors({ submit: error?.response?.data?.message || 'Failed to create request. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
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
              {leaveBalance ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">
                      {typeof leaveBalance.vacation === 'object' ? (leaveBalance.vacation as any).available : leaveBalance.vacation}
                    </p>
                    <p className="text-sm text-text-secondary">Vacation Days</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {typeof leaveBalance.sick === 'object' ? (leaveBalance.sick as any).available : leaveBalance.sick}
                    </p>
                    <p className="text-sm text-text-secondary">Sick Days</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">
                      {typeof leaveBalance.other === 'object' ? (leaveBalance.other as any).available : leaveBalance.other}
                    </p>
                    <p className="text-sm text-text-secondary">Other Days</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">
                      {typeof leaveBalance.maternity === 'object' ? (leaveBalance.maternity as any).available : leaveBalance.maternity}
                    </p>
                    <p className="text-sm text-text-secondary">Maternity Days</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-text-secondary">Leave balance not available</p>
                </div>
              )}
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
              {requestStats ? (
                <>
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
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-text-secondary">Request statistics not available</p>
                </div>
              )}
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
                          <p>{getLeaveTypeLabel((request.details as any).leaveType)} • {(request.details as any).days} day(s)</p>
                        )}
                        {request.type === 'overtime' && (
                          <p>Overtime • {(request.details as any).requestedHours} hours</p>
                        )}
                        {request.type === 'time_correction' && (
                          <p>Time Correction • {(request.details as any).sessionType} session</p>
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
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Success Message */}
          {submitSuccess && (
            <div className="flex items-center space-x-2 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="text-green-800 font-medium">Request submitted successfully!</p>
            </div>
          )}

          {/* Error Message */}
          {formErrors.submit && (
            <div className="flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-800">{formErrors.submit}</p>
            </div>
          )}

          {/* Request Type Selection */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-3">
              Request Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setRequestType('leave')}
                className={`p-3 rounded-lg border-2 text-center transition-colors ${
                  requestType === 'leave'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Calendar className="h-6 w-6 mx-auto mb-2" />
                <span className="text-sm font-medium">Leave Request</span>
              </button>
              <button
                type="button"
                onClick={() => setRequestType('overtime')}
                className={`p-3 rounded-lg border-2 text-center transition-colors ${
                  requestType === 'overtime'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Clock className="h-6 w-6 mx-auto mb-2" />
                <span className="text-sm font-medium">Overtime Request</span>
              </button>
              <button
                type="button"
                onClick={() => setRequestType('time_correction')}
                className={`p-3 rounded-lg border-2 text-center transition-colors ${
                  requestType === 'time_correction'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <FileText className="h-6 w-6 mx-auto mb-2" />
                <span className="text-sm font-medium">Time Correction</span>
              </button>
            </div>
          </div>

          {/* Leave Request Fields */}
          {requestType === 'leave' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Leave Type
                </label>
                <select
                  value={formData.leaveType}
                  onChange={(e) => handleInputChange('leaveType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="vacation">Vacation Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="maternity">Maternity Leave</option>
                  <option value="other">Other Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.startDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.startDate && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.startDate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.endDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.endDate && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.endDate}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Overtime Request Fields */}
          {requestType === 'overtime' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Overtime Date
                </label>
                <input
                  type="date"
                  value={formData.overtimeDate}
                  onChange={(e) => handleInputChange('overtimeDate', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.overtimeDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.overtimeDate && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.overtimeDate}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => handleInputChange('startTime', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.startTime ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.startTime && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.startTime}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => handleInputChange('endTime', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.endTime ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.endTime && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.endTime}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Time Correction Request Fields */}
          {requestType === 'time_correction' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Correction Date
                </label>
                <input
                  type="date"
                  value={formData.correctionDate}
                  onChange={(e) => handleInputChange('correctionDate', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.correctionDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.correctionDate && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.correctionDate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Session Type
                </label>
                <select
                  value={formData.sessionType}
                  onChange={(e) => handleInputChange('sessionType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="morning_in">Morning Clock-In</option>
                  <option value="morning_out">Morning Clock-Out</option>
                  <option value="afternoon_in">Afternoon Clock-In</option>
                  <option value="afternoon_out">Afternoon Clock-Out</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Requested {formData.sessionType.includes('in') ? 'Clock-In' : 'Clock-Out'} Time
                </label>
                <input
                  type="time"
                  value={formData.requestedTime}
                  onChange={(e) => handleInputChange('requestedTime', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.requestedTime ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.requestedTime && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.requestedTime}</p>
                )}
              </div>
            </div>
          )}

          {/* Reason Field */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => handleInputChange('reason', e.target.value)}
              rows={3}
              placeholder="Please provide a reason for this request..."
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                formErrors.reason ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {formErrors.reason && (
              <p className="text-red-500 text-xs mt-1">{formErrors.reason}</p>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button 
              type="button"
              variant="secondary" 
              onClick={() => setIsCreateModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <button 
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
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
