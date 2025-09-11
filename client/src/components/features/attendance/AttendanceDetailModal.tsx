import React from 'react';
import { X, Clock, User, Calendar, Camera, AlertCircle } from 'lucide-react';
import { Button } from '../../shared';
import { useAttendanceDetail } from '../../../hooks/useAttendance';
import SelfieImage from '../../shared/SelfieImage';
import ImageViewerModal from '../../shared/ImageViewerModal';
import LoadingSpinner from '../../shared/LoadingSpinner';

interface AttendanceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  attendanceId: string | null;
}

const AttendanceDetailModal: React.FC<AttendanceDetailModalProps> = ({
  isOpen,
  onClose,
  attendanceId
}) => {
  const { data: attendance, isLoading, error } = useAttendanceDetail(
    attendanceId || '',
    isOpen && !!attendanceId
  );
  const [imageViewerOpen, setImageViewerOpen] = React.useState(false);
  const [viewerImageSrc, setViewerImageSrc] = React.useState('');
  const [viewerImageAlt, setViewerImageAlt] = React.useState('');

  const handleImageView = (imageSrc: string, alt: string) => {
    setViewerImageSrc(imageSrc);
    setViewerImageAlt(alt);
    setImageViewerOpen(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-text-primary">Attendance Details</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-2"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600">Error loading attendance details</p>
            </div>
          ) : attendance ? (
            <div className="space-y-6">
              {/* Employee Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-text-primary mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Employee Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-text-secondary">Name</p>
                    <p className="font-medium text-text-primary">{attendance.employeeName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Employee Code</p>
                    <p className="font-medium text-text-primary">{attendance.employeeCode}</p>
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Position</p>
                    <p className="font-medium text-text-primary">{attendance.position || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Department</p>
                    <p className="font-medium text-text-primary">{attendance.departmentName}</p>
                  </div>
                </div>
              </div>

              {/* Attendance Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-text-primary mb-4 flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Attendance Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-text-secondary">Action</p>
                    <p className="font-medium text-text-primary">{attendance.action}</p>
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Date</p>
                    <p className="font-medium text-text-primary">
                      {new Date(attendance.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Time</p>
                    <p className="font-medium text-text-primary">
                      {new Date(attendance.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Session Type</p>
                    <p className="font-medium text-text-primary capitalize">
                      {attendance.sessionType.replace('_', ' ')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Hours Information */}
              {(attendance.regularHours || attendance.overtimeHours || attendance.lateMinutes) && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-text-primary mb-4 flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Hours Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {attendance.regularHours && (
                      <div>
                        <p className="text-sm text-text-secondary">Regular Hours</p>
                        <p className="font-medium text-text-primary">{attendance.regularHours}h</p>
                      </div>
                    )}
                    {attendance.overtimeHours && (
                      <div>
                        <p className="text-sm text-text-secondary">Overtime Hours</p>
                        <p className="font-medium text-text-primary">{attendance.overtimeHours}h</p>
                      </div>
                    )}
                    {attendance.lateMinutes && (
                      <div>
                        <p className="text-sm text-text-secondary">Late Minutes</p>
                        <p className="font-medium text-text-primary">{attendance.lateMinutes}m</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Images Section */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-text-primary mb-4 flex items-center">
                  <Camera className="h-5 w-5 mr-2" />
                  Verification Images
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {/* Selfie Image */}
                  <div>
                    <p className="text-sm text-text-secondary mb-2">Attendance Selfie</p>
                    {attendance.selfieImageUrl ? (
                      <SelfieImage
                        imageUrl={attendance.selfieImageUrl}
                        alt="Attendance Selfie"
                        className="w-full h-48 object-cover rounded-lg border"
                        clickable={true}
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent any parent click handlers
                          const imageSrc = `http://localhost:3000${attendance.selfieImageUrl}`;
                          handleImageView(imageSrc, 'Attendance Selfie');
                        }}
                        fallbackIcon={
                          <div className="w-full h-48 bg-gray-200 rounded-lg border flex items-center justify-center">
                            <Camera className="h-12 w-12 text-gray-400" />
                            <p className="text-sm text-gray-500 ml-2">Image failed to load</p>
                          </div>
                        }
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 rounded-lg border flex items-center justify-center">
                        <Camera className="h-12 w-12 text-gray-400" />
                        <p className="text-sm text-gray-500 ml-2">No selfie taken</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      {/* Image Viewer Modal */}
      <ImageViewerModal
        isOpen={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
        imageSrc={viewerImageSrc}
        alt={viewerImageAlt}
        title="Attendance Selfie"
      />
    </div>
  );
};

export default AttendanceDetailModal;
