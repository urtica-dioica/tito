import React, { useState, useRef, useEffect } from 'react';
import { Camera, Clock, User, CheckCircle, AlertCircle, QrCode, Wifi, WifiOff } from 'lucide-react';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Input from '../../components/shared/Input';
import Badge from '../../components/shared/Badge';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

// Mock data types - TODO: Replace with actual types from API
interface Employee {
  id: string;
  employeeId: string;
  name: string;
  department: string;
  position: string;
  profilePicture?: string;
  qrCode: string;
}

interface AttendanceRecord {
  id: string;
  employeeId: string;
  type: 'clock_in' | 'clock_out';
  timestamp: string;
  location: string;
  selfieUrl?: string;
  qrCodeScanned: boolean;
}

const KioskAttendance: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(true);
  const [attendanceMode, setAttendanceMode] = useState<'qr' | 'manual' | 'camera'>('qr');
  const [employeeId, setEmployeeId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastAttendance, setLastAttendance] = useState<AttendanceRecord | null>(null);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Check online status
  useEffect(() => {
    const checkOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener('online', checkOnlineStatus);
    window.addEventListener('offline', checkOnlineStatus);
    checkOnlineStatus();

    return () => {
      window.removeEventListener('online', checkOnlineStatus);
      window.removeEventListener('offline', checkOnlineStatus);
    };
  }, []);

  // Initialize camera when camera mode is selected
  useEffect(() => {
    if (attendanceMode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [attendanceMode]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setErrorMessage('Camera access denied. Please use QR code or manual entry.');
      setShowError(true);
      setAttendanceMode('qr');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        // Convert to blob and process
        canvas.toBlob((blob) => {
          if (blob) {
            processAttendance('camera', blob);
          }
        }, 'image/jpeg', 0.8);
      }
    }
  };

  const processAttendance = async (mode: string, _data?: any) => {
    setIsProcessing(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock successful attendance
      const mockAttendance: AttendanceRecord = {
        id: Date.now().toString(),
        employeeId: currentEmployee?.employeeId || employeeId,
        type: 'clock_in', // This would be determined by business logic
        timestamp: new Date().toISOString(),
        location: 'Main Office - Kiosk 1',
        qrCodeScanned: mode === 'qr',
      };
      
      setLastAttendance(mockAttendance);
      setShowSuccess(true);
      setEmployeeId('');
      setCurrentEmployee(null);
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
      
    } catch (error) {
      setErrorMessage('Failed to record attendance. Please try again.');
      setShowError(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQRCodeScan = (qrData: string) => {
    // Mock QR code processing
    const mockEmployee: Employee = {
      id: '1',
      employeeId: 'EMP-2025-0000001',
      name: 'John Doe',
      department: 'Engineering',
      position: 'Software Developer',
      qrCode: qrData,
    };
    
    setCurrentEmployee(mockEmployee);
    processAttendance('qr');
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (employeeId.trim()) {
      processAttendance('manual');
    }
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getNextAction = () => {
    if (!lastAttendance) return 'Clock In';
    return lastAttendance.type === 'clock_in' ? 'Clock Out' : 'Clock In';
  };

  return (
    <div className="min-h-screen bg-background-main flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Clock className="h-8 w-8 text-button-primary" />
            <h1 className="text-4xl font-bold text-text-primary">Attendance Kiosk</h1>
          </div>
          <div className="flex items-center justify-center space-x-4 text-lg text-text-secondary">
            <span>{getGreeting()}!</span>
            <span>•</span>
            <span>{currentTime.toLocaleDateString()}</span>
            <span>•</span>
            <span>{currentTime.toLocaleTimeString()}</span>
          </div>
          <div className="flex items-center justify-center space-x-2 mt-2">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-600" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-600" />
            )}
            <span className={`text-sm ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <div className="p-6 text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-green-800 mb-2">Attendance Recorded!</h3>
              {lastAttendance && (
                <div className="text-green-700">
                  <p className="font-medium">{currentEmployee?.name || 'Employee'}</p>
                  <p className="text-sm">
                    {lastAttendance.type === 'clock_in' ? 'Clocked In' : 'Clocked Out'} at{' '}
                    {new Date(lastAttendance.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Error Message */}
        {showError && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <div className="p-6 text-center">
              <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-red-800 mb-2">Error</h3>
              <p className="text-red-700">{errorMessage}</p>
              <Button 
                variant="secondary" 
                className="mt-4"
                onClick={() => setShowError(false)}
              >
                Dismiss
              </Button>
            </div>
          </Card>
        )}

        {/* Mode Selection */}
        <Card className="mb-6">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Select Attendance Method</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Button
                variant={attendanceMode === 'qr' ? 'primary' : 'secondary'}
                className="h-20 flex flex-col items-center justify-center space-y-2"
                onClick={() => setAttendanceMode('qr')}
              >
                <QrCode className="h-8 w-8" />
                <span>QR Code Scan</span>
              </Button>
              <Button
                variant={attendanceMode === 'manual' ? 'primary' : 'secondary'}
                className="h-20 flex flex-col items-center justify-center space-y-2"
                onClick={() => setAttendanceMode('manual')}
              >
                <User className="h-8 w-8" />
                <span>Manual Entry</span>
              </Button>
              <Button
                variant={attendanceMode === 'camera' ? 'primary' : 'secondary'}
                className="h-20 flex flex-col items-center justify-center space-y-2"
                onClick={() => setAttendanceMode('camera')}
              >
                <Camera className="h-8 w-8" />
                <span>Face Recognition</span>
              </Button>
            </div>
          </div>
        </Card>

        {/* Attendance Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Input Method */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">
                {attendanceMode === 'qr' && 'Scan QR Code'}
                {attendanceMode === 'manual' && 'Enter Employee ID'}
                {attendanceMode === 'camera' && 'Face Recognition'}
              </h3>

              {attendanceMode === 'qr' && (
                <div className="text-center">
                  <div className="w-64 h-64 mx-auto bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                    <div className="text-center">
                      <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                      <p className="text-text-secondary">QR Scanner will be activated here</p>
                      <p className="text-sm text-text-secondary mt-2">
                        Point your employee QR code at the camera
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    onClick={() => handleQRCodeScan('mock-qr-data')}
                    disabled={isProcessing}
                  >
                    {isProcessing ? <LoadingSpinner size="sm" /> : 'Simulate QR Scan'}
                  </Button>
                </div>
              )}

              {attendanceMode === 'manual' && (
                <form onSubmit={handleManualSubmit} className="space-y-4">
                  <Input
                    label="Employee ID"
                    placeholder="Enter your employee ID"
                    value={employeeId}
                    onChange={(value: string) => setEmployeeId(value)}
                    required
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full"
                    disabled={isProcessing || !employeeId.trim()}
                  >
                    {isProcessing ? <LoadingSpinner size="sm" /> : getNextAction()}
                  </Button>
                </form>
              )}

              {attendanceMode === 'camera' && (
                <div className="space-y-4">
                  <div className="relative">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-64 bg-gray-100 rounded-lg object-cover"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={capturePhoto}
                    disabled={isProcessing || !cameraStream}
                  >
                    {isProcessing ? <LoadingSpinner size="sm" /> : 'Capture & Record'}
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Right Panel - Employee Info & Status */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Employee Information</h3>
              
              {currentEmployee ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-button-primary rounded-full flex items-center justify-center">
                      <span className="text-white text-xl font-bold">
                        {currentEmployee.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-text-primary">
                        {currentEmployee.name}
                      </h4>
                      <p className="text-text-secondary">{currentEmployee.position}</p>
                      <p className="text-sm text-text-secondary">{currentEmployee.department}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Employee ID:</span>
                      <span className="font-medium text-text-primary">{currentEmployee.employeeId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Current Time:</span>
                      <span className="font-medium text-text-primary">
                        {currentTime.toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Action:</span>
                      <Badge variant="info">{getNextAction()}</Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-text-secondary">
                    {attendanceMode === 'qr' && 'Scan your QR code to begin'}
                    {attendanceMode === 'manual' && 'Enter your employee ID above'}
                    {attendanceMode === 'camera' && 'Position your face in the camera'}
                  </p>
                </div>
              )}

              {isProcessing && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <LoadingSpinner size="sm" />
                    <span className="text-blue-800">Processing attendance...</span>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="mt-6">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Instructions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div>
                <h4 className="font-medium text-text-primary mb-2">QR Code Method</h4>
                <ul className="space-y-1 text-text-secondary">
                  <li>• Open your employee QR code</li>
                  <li>• Position it in front of the scanner</li>
                  <li>• Wait for confirmation</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-text-primary mb-2">Manual Entry</h4>
                <ul className="space-y-1 text-text-secondary">
                  <li>• Enter your employee ID</li>
                  <li>• Click the action button</li>
                  <li>• Wait for confirmation</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-text-primary mb-2">Face Recognition</h4>
                <ul className="space-y-1 text-text-secondary">
                  <li>• Position your face in the camera</li>
                  <li>• Click capture when ready</li>
                  <li>• Wait for processing</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default KioskAttendance;
