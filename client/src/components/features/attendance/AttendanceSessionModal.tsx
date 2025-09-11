import React from 'react';
import { Clock, Camera, User } from 'lucide-react';
import Modal from '../../shared/Modal';
import SelfieImage from '../../shared/SelfieImage';
import ImageViewerModal from '../../shared/ImageViewerModal';
import LoadingSpinner from '../../shared/LoadingSpinner';
import { useAttendanceRecordSessions } from '../../../hooks/useAttendance';

interface AttendanceSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  attendanceRecordId: string;
}

const AttendanceSessionModal: React.FC<AttendanceSessionModalProps> = ({
  isOpen,
  onClose,
  attendanceRecordId
}) => {
  const [imageViewerOpen, setImageViewerOpen] = React.useState(false);
  const [viewerImageSrc, setViewerImageSrc] = React.useState('');
  const [viewerImageAlt, setViewerImageAlt] = React.useState('');

  const { data: attendanceDetail, isLoading, error } = useAttendanceRecordSessions(
    attendanceRecordId,
    isOpen && !!attendanceRecordId
  );

  const handleImageView = (imageSrc: string, alt: string) => {
    setViewerImageSrc(imageSrc);
    setViewerImageAlt(alt);
    setImageViewerOpen(true);
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return 'Not recorded';
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getSessionTypeDisplay = (sessionType: string) => {
    switch (sessionType) {
      case 'morning_in': return 'Morning In';
      case 'morning_out': return 'Morning Out';
      case 'afternoon_in': return 'Afternoon In';
      case 'afternoon_out': return 'Afternoon Out';
      default: return sessionType;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'present': return 'text-green-600 bg-green-50';
      case 'late': return 'text-yellow-600 bg-yellow-50';
      case 'absent': return 'text-red-600 bg-red-50';
      case 'partial': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Attendance Session Details"
        size="lg"
      >
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Error loading attendance details</p>
          </div>
        ) : attendanceDetail ? (
          <div className="space-y-6">
            {/* Employee Information */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                <User className="h-4 w-4 mr-2" />
                Employee Information
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Name:</span>
                  <span className="ml-2 font-medium">{attendanceDetail.employeeName}</span>
                </div>
                <div>
                  <span className="text-blue-700">Employee ID:</span>
                  <span className="ml-2 font-medium">{attendanceDetail.employeeCode}</span>
                </div>
                <div>
                  <span className="text-blue-700">Department:</span>
                  <span className="ml-2 font-medium">{attendanceDetail.departmentName || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-blue-700">Position:</span>
                  <span className="ml-2 font-medium">{attendanceDetail.position || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-blue-700">Date:</span>
                  <span className="ml-2 font-medium">{formatDate(attendanceDetail.date)}</span>
                </div>
                <div>
                  <span className="text-blue-700">Status:</span>
                  <span className="ml-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(attendanceDetail.overallStatus)}`}>
                      {attendanceDetail.overallStatus || 'Unknown'}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Session Details */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Session Details
              </h4>
              
              {attendanceDetail.sessions && attendanceDetail.sessions.length > 0 ? (
                <div className="space-y-4">
                  {attendanceDetail.sessions.map((session, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium text-gray-900">
                          {getSessionTypeDisplay(session.sessionType)}
                        </h5>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(session.status)}`}>
                          {session.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-600 mb-2">Clock In:</div>
                          <div className="text-sm font-medium">
                            {formatTime(session.clockIn)}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 mb-2">Clock Out:</div>
                          <div className="text-sm font-medium">
                            {formatTime(session.clockOut)}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 mb-2">Calculated Hours:</div>
                          <div className="text-sm font-medium">
                            {(() => {
                              const hours = typeof session.calculatedHours === 'number' ? session.calculatedHours : parseFloat(session.calculatedHours);
                              return hours && !isNaN(hours) ? `${hours.toFixed(1)}h` : 'N/A';
                            })()}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 mb-2">Late Hours:</div>
                          <div className="text-sm font-medium">
                            {(() => {
                              const hours = typeof session.lateHours === 'number' ? session.lateHours : parseFloat(session.lateHours);
                              return hours && !isNaN(hours) ? `${hours.toFixed(1)}h` : '0h';
                            })()}
                          </div>
                        </div>
                      </div>

                      {/* Selfie Image */}
                      {session.selfieImagePath && (
                        <div className="mt-4">
                          <div className="text-sm text-gray-600 mb-2 flex items-center">
                            <Camera className="h-4 w-4 mr-1" />
                            Selfie Image:
                          </div>
                          <div className="flex justify-center">
                            <SelfieImage
                              imageUrl={session.selfieImagePath}
                              alt={`${attendanceDetail.employeeName} selfie - ${getSessionTypeDisplay(session.sessionType)}`}
                              className="w-32 h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                              clickable={true}
                              onClick={() => {
                                const imageSrc = `http://localhost:3000${session.selfieImagePath}`;
                                handleImageView(imageSrc, `${attendanceDetail.employeeName} selfie - ${getSessionTypeDisplay(session.sessionType)}`);
                              }}
                              fallbackIcon={<Camera className="h-8 w-8 text-gray-400" />}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">No session details available</p>
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Sessions:</span>
                  <span className="ml-2 font-medium">
                    {attendanceDetail.sessions?.length || 0}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Overall Status:</span>
                  <span className="ml-2 font-medium">
                    {attendanceDetail.overallStatus || 'Unknown'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">No attendance details found</p>
          </div>
        )}
      </Modal>

      {/* Image Viewer Modal */}
      <ImageViewerModal
        isOpen={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
        imageSrc={viewerImageSrc}
        alt={viewerImageAlt}
        title="Selfie Image"
      />
    </>
  );
};

export default AttendanceSessionModal;
