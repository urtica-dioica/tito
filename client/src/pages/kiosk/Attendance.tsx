import React, { useState, useRef, useEffect } from 'react';
import { Clock, CheckCircle, AlertCircle, Wifi, WifiOff, Timer, Coffee } from 'lucide-react';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import QRScannerComponent from '../../components/kiosk/QRScanner';
import { 
  useVerifyEmployeeByQR, 
  useRecordTimeBasedAttendance, 
  useNextExpectedSession,
  useTodayAttendanceSummary
} from '../../hooks/useKiosk';
import type { KioskEmployee, KioskAttendanceRecord, SessionType, SessionDisplayInfo } from '../../services/kioskService';

const KioskAttendance: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(true);
  const [currentStep, setCurrentStep] = useState<'scan' | 'verify' | 'capture' | 'complete'>('scan');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastAttendance, setLastAttendance] = useState<KioskAttendanceRecord | null>(null);
  const [currentEmployee, setCurrentEmployee] = useState<KioskEmployee | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [scannedQRCode, setScannedQRCode] = useState<string | null>(null);
  const [nextSessionType, setNextSessionType] = useState<SessionType | null>(null);
  const [sessionDisplayInfo, setSessionDisplayInfo] = useState<SessionDisplayInfo | null>(null);
  const [canPerformAction, setCanPerformAction] = useState(true);
  const [validationReason, setValidationReason] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // React Query hooks
  const { data: verifiedEmployee, isLoading: isVerifyingEmployee, error: verificationError } = useVerifyEmployeeByQR(
    scannedQRCode || '', 
    !!scannedQRCode && currentStep === 'verify'
  );
  
  const recordTimeBasedAttendanceMutation = useRecordTimeBasedAttendance();
  
  const { data: nextSessionData, isLoading: isLoadingNextSession, error: nextSessionError } = useNextExpectedSession(
    currentEmployee?.id || '', 
    !!currentEmployee && currentStep === 'verify'
  );
  
  const { data: todaySummaryData } = useTodayAttendanceSummary(
    currentEmployee?.id || '', 
    !!currentEmployee && currentStep === 'verify'
  );
  

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

  // Initialize camera when capture step is reached
  useEffect(() => {
    if (currentStep === 'capture') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [currentStep]);

  // Handle verified employee data
  useEffect(() => {
    if (verifiedEmployee && currentStep === 'verify') {
      console.log('Setting current employee:', verifiedEmployee);
      setCurrentEmployee(verifiedEmployee);
    }
  }, [verifiedEmployee, currentStep]);

  // Handle next session data
  useEffect(() => {
    console.log('Next session hook state:', {
      nextSessionData,
      isLoadingNextSession,
      nextSessionError,
      currentStep,
      currentEmployeeId: currentEmployee?.id
    });
    
    if (nextSessionData && currentStep === 'verify') {
      console.log('Setting next session data:', nextSessionData);
      console.log('Session type from API:', nextSessionData.sessionType);
      setNextSessionType(nextSessionData.sessionType);
      setSessionDisplayInfo(nextSessionData.displayInfo);
      setCanPerformAction(nextSessionData.canPerform);
      setValidationReason(nextSessionData.reason || '');
    } else if (currentStep === 'verify' && !isLoadingNextSession) {
      console.log('No next session data available, using fallback logic');
      // Fallback: determine session type based on current time
      const currentHour = new Date().getHours();
      let fallbackSessionType: SessionType | null = null;
      
      if (currentHour >= 7 && currentHour < 12) {
        fallbackSessionType = 'morning_in';
      } else if (currentHour >= 12 && currentHour < 13) {
        fallbackSessionType = 'morning_out';
      } else if (currentHour >= 13 && currentHour < 18) {
        fallbackSessionType = 'afternoon_in';
      } else if (currentHour >= 18) {
        fallbackSessionType = 'afternoon_out';
      }
      
      console.log('Using fallback session type:', fallbackSessionType);
      setNextSessionType(fallbackSessionType);
      setCanPerformAction(true);
    }
  }, [nextSessionData, currentStep, isLoadingNextSession, nextSessionError, currentEmployee]);

  // Handle today's attendance summary
  useEffect(() => {
    if (todaySummaryData && currentStep === 'verify') {
      // Set the most recent attendance record
      if (todaySummaryData.sessions.length > 0) {
        setLastAttendance(todaySummaryData.sessions[0]);
      }
    }
  }, [todaySummaryData, currentStep]);

  // Handle verification error
  useEffect(() => {
    if (verificationError && currentStep === 'verify') {
      setErrorMessage('Invalid QR code. Please scan a valid employee ID card.');
      setShowError(true);
      setCurrentStep('scan');
      setScannedQRCode(null);
    }
  }, [verificationError, currentStep]);

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
      setErrorMessage('Camera access denied. Please allow camera access to continue.');
      setShowError(true);
      setCurrentStep('scan');
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
        
        // Convert to data URL for preview
        const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedPhoto(photoDataUrl);
        
        console.log('Photo captured, processing attendance...');
        
        // Process attendance immediately after photo capture
        processAttendance('face_capture');
      }
    } else {
      console.error('Video or canvas not available for photo capture');
      setErrorMessage('Camera not ready. Please try again.');
      setShowError(true);
    }
  };

  const processAttendance = async (mode: string, _data?: any) => {
    if (!currentEmployee || !scannedQRCode || !nextSessionType) {
      console.error('Missing required data for attendance:', {
        currentEmployee: !!currentEmployee,
        scannedQRCode: !!scannedQRCode,
        nextSessionType: !!nextSessionType
      });
      setErrorMessage('Missing required information. Please try again.');
      setShowError(true);
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Record time-based attendance using the API
      const attendanceData = {
        employeeId: currentEmployee.id,
        sessionType: nextSessionType,
        location: 'Main Office - Kiosk 1',
        qrCodeData: scannedQRCode,
        selfieUrl: mode === 'face_capture' ? capturedPhoto || undefined : undefined,
      };
      
      console.log('Recording attendance with data:', attendanceData);
      
      recordTimeBasedAttendanceMutation.mutate(attendanceData, {
        onSuccess: (attendanceRecord: unknown) => {
          console.log('Attendance recorded successfully:', attendanceRecord);
          setLastAttendance(attendanceRecord as KioskAttendanceRecord);
          setCurrentStep('complete');
          setShowSuccess(true);
          setIsProcessing(false);
          
          // Auto-hide success message and reset after 5 seconds
          setTimeout(() => {
            setShowSuccess(false);
            resetKiosk();
          }, 5000);
        },
        onError: (error: any) => {
          console.error('Error recording attendance:', error);
          setErrorMessage(error?.response?.data?.message || 'Failed to record attendance. Please try again.');
          setShowError(true);
          setIsProcessing(false);
        }
      });
      
    } catch (error) {
      console.error('Error recording attendance:', error);
      setErrorMessage('Failed to record attendance. Please try again.');
      setShowError(true);
      setIsProcessing(false);
    }
  };

  const handleQRCodeScan = (qrData: string) => {
    console.log('QR Code scanned:', qrData);
    setScannedQRCode(qrData);
    setCurrentStep('verify');
  };

  const handleVerifyEmployee = () => {
    if (currentEmployee) {
      setCurrentStep('capture');
    }
  };

  const resetKiosk = () => {
    setCurrentStep('scan');
    setCurrentEmployee(null);
    setCapturedPhoto(null);
    setLastAttendance(null);
    setScannedQRCode(null);
    setNextSessionType(null);
    setSessionDisplayInfo(null);
    setCanPerformAction(true);
    setValidationReason('');
    setShowSuccess(false);
    setShowError(false);
    setErrorMessage('');
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getNextAction = () => {
    if (!sessionDisplayInfo) return 'Clock In';
    return sessionDisplayInfo.label;
  };

  const isBreakPeriod = () => {
    const hour = currentTime.getHours();
    const minute = currentTime.getMinutes();
    const currentMinutes = hour * 60 + minute;
    const breakStart = 12 * 60; // 12:00 PM
    const breakEnd = 13 * 60;   // 1:00 PM
    return currentMinutes >= breakStart && currentMinutes < breakEnd;
  };

  const getTimeStatus = () => {
    const hour = currentTime.getHours();
    const minute = currentTime.getMinutes();
    const currentMinutes = hour * 60 + minute;
    
    if (currentMinutes < 7 * 60) return 'before-hours';
    if (currentMinutes >= 7 * 60 && currentMinutes < 12 * 60) return 'morning-session';
    if (currentMinutes >= 12 * 60 && currentMinutes < 13 * 60) return 'break-period';
    if (currentMinutes >= 13 * 60 && currentMinutes < 18 * 60) return 'afternoon-session';
    return 'after-hours';
  };

  const getEmployeeDisplayName = (employee: KioskEmployee) => {
    return `${employee.firstName} ${employee.lastName}`;
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
          <div className="flex items-center justify-center space-x-4 mt-2">
            <div className="flex items-center space-x-2">
              {isOnline ? (
                <Wifi className="h-4 w-4 text-green-600" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-600" />
              )}
              <span className={`text-sm ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {isBreakPeriod() ? (
                <Coffee className="h-4 w-4 text-orange-600" />
              ) : (
                <Timer className="h-4 w-4 text-blue-600" />
              )}
              <span className={`text-sm ${
                getTimeStatus() === 'break-period' ? 'text-orange-600' : 
                getTimeStatus() === 'morning-session' || getTimeStatus() === 'afternoon-session' ? 'text-blue-600' :
                'text-gray-600'
              }`}>
                {getTimeStatus() === 'break-period' ? 'Break Time' :
                 getTimeStatus() === 'morning-session' ? 'Morning Session' :
                 getTimeStatus() === 'afternoon-session' ? 'Afternoon Session' :
                 getTimeStatus() === 'before-hours' ? 'Before Hours' :
                 'After Hours'}
              </span>
            </div>
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
                  <p className="font-medium">{currentEmployee ? getEmployeeDisplayName(currentEmployee) : 'Employee'}</p>
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

        {/* Main Kiosk Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Current Step */}
          <Card>
            <div className="p-6">
              {/* Step 1: QR Code Scan */}
              {currentStep === 'scan' && (
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-text-primary mb-6">Scan Your ID Card</h3>
                  <div className="mb-6">
                    <QRScannerComponent
                      onScan={handleQRCodeScan}
                      onError={(error) => {
                        setErrorMessage(error);
                        setShowError(true);
                      }}
                      isActive={currentStep === 'scan'}
                    />
                  </div>
                  <p className="text-sm text-text-secondary">
                    Position your employee ID card QR code in front of the camera
                  </p>
                </div>
              )}

              {/* Step 2: Employee Verification */}
              {currentStep === 'verify' && (
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-text-primary mb-6">Verify Your Information</h3>
                  
                  {isVerifyingEmployee ? (
                    <div className="bg-blue-50 rounded-lg p-6 mb-6">
                      <div className="flex items-center justify-center space-x-3">
                        <LoadingSpinner size="sm" />
                        <span className="text-blue-800">Verifying employee information...</span>
                      </div>
                    </div>
                  ) : isLoadingNextSession ? (
                    <div className="bg-blue-50 rounded-lg p-6 mb-6">
                      <div className="flex items-center justify-center space-x-3">
                        <LoadingSpinner size="sm" />
                        <span className="text-blue-800">Loading attendance session data...</span>
                      </div>
                    </div>
                  ) : currentEmployee ? (
                    <>
                      <div className="bg-blue-50 rounded-lg p-6 mb-6">
                        <div className="flex items-center justify-center space-x-4 mb-4">
                          <div className="w-16 h-16 bg-button-primary rounded-full flex items-center justify-center">
                            <span className="text-white text-xl font-bold">
                              {getEmployeeDisplayName(currentEmployee).split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div className="text-left">
                            <h4 className="text-lg font-semibold text-text-primary">
                              {getEmployeeDisplayName(currentEmployee)}
                            </h4>
                            <p className="text-text-secondary">{currentEmployee.position}</p>
                            <p className="text-sm text-text-secondary">{currentEmployee.departmentName}</p>
                          </div>
                        </div>
                        <div className="text-sm text-text-secondary space-y-1">
                          <p>Employee ID: <span className="font-medium">{currentEmployee.employeeId}</span></p>
                          <p>Status: <span className="font-medium capitalize">{currentEmployee.status}</span></p>
                          {sessionDisplayInfo && (
                            <div className="mt-3 p-3 bg-blue-100 rounded-lg">
                              <p className="font-medium text-blue-800">Next Action: {sessionDisplayInfo.label}</p>
                              <p className="text-blue-700 text-xs">{sessionDisplayInfo.description}</p>
                              <p className="text-blue-600 text-xs">Time Window: {sessionDisplayInfo.timeWindow}</p>
                            </div>
                          )}
                          {!canPerformAction && validationReason && (
                            <div className="mt-3 p-3 bg-yellow-100 rounded-lg">
                              <p className="font-medium text-yellow-800">Notice</p>
                              <p className="text-yellow-700 text-xs">{validationReason}</p>
                            </div>
                          )}
                          {lastAttendance && (
                            <p className="mt-2">Last Action: <span className="font-medium">
                              {lastAttendance.type === 'clock_in' ? 'Clocked In' : 'Clocked Out'} at{' '}
                              {new Date(lastAttendance.timestamp).toLocaleTimeString()}
                            </span></p>
                          )}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Button
                          variant="primary"
                          size="lg"
                          onClick={handleVerifyEmployee}
                          disabled={!canPerformAction}
                          className="w-full px-8 py-3"
                        >
                          {canPerformAction ? `Yes, This is Me - ${getNextAction()}` : 'Action Not Available'}
                        </Button>
                        <Button
                          variant="secondary"
                          size="lg"
                          onClick={resetKiosk}
                          className="w-full px-8 py-3"
                        >
                          No, Try Again
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="bg-red-50 rounded-lg p-6 mb-6">
                      <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                      <p className="text-red-600 font-medium mb-2">Employee Not Found</p>
                      <p className="text-red-500 text-sm">The QR code could not be verified. Please try again.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Face Capture */}
              {currentStep === 'capture' && (
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-text-primary mb-6">Capture Your Photo</h3>
                  <div className="relative mb-6">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-80 bg-gray-100 rounded-lg object-cover"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    {capturedPhoto && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                        <div className="text-center text-white">
                          <CheckCircle className="h-12 w-12 mx-auto mb-2" />
                          <p className="text-lg font-semibold">Photo Captured!</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={capturePhoto}
                    disabled={isProcessing || !cameraStream}
                    className="w-full px-8 py-3"
                  >
                    {isProcessing ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span className="ml-2">Processing...</span>
                      </>
                    ) : (
                      'Capture Photo'
                    )}
                  </Button>
                </div>
              )}

              {/* Step 4: Complete */}
              {currentStep === 'complete' && (
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-text-primary mb-6">Attendance Recorded!</h3>
                  <div className="bg-green-50 rounded-lg p-6 mb-6">
                    <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                    <p className="text-lg text-green-800 font-semibold mb-2">Success!</p>
                    <p className="text-green-700">
                      Your attendance has been recorded successfully.
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={resetKiosk}
                    className="w-full px-8 py-3"
                  >
                    Record Another Attendance
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Right Panel - Status & Instructions */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Status</h3>
              
              {/* Progress Steps */}
              <div className="space-y-4 mb-6">
                <div className={`flex items-center space-x-3 p-3 rounded-lg ${
                  currentStep === 'scan' ? 'bg-blue-50 border border-blue-200' : 
                  ['verify', 'capture', 'complete'].includes(currentStep) ? 'bg-green-50 border border-green-200' : 
                  'bg-gray-50'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    currentStep === 'scan' ? 'bg-blue-600 text-white' : 
                    ['verify', 'capture', 'complete'].includes(currentStep) ? 'bg-green-600 text-white' : 
                    'bg-gray-300 text-gray-600'
                  }`}>
                    {['verify', 'capture', 'complete'].includes(currentStep) ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-bold">1</span>
                    )}
                  </div>
                  <span className={`font-medium ${
                    currentStep === 'scan' ? 'text-blue-800' : 
                    ['verify', 'capture', 'complete'].includes(currentStep) ? 'text-green-800' : 
                    'text-gray-600'
                  }`}>
                    Scan ID Card
                  </span>
                </div>

                <div className={`flex items-center space-x-3 p-3 rounded-lg ${
                  currentStep === 'verify' ? 'bg-blue-50 border border-blue-200' : 
                  ['capture', 'complete'].includes(currentStep) ? 'bg-green-50 border border-green-200' : 
                  'bg-gray-50'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    currentStep === 'verify' ? 'bg-blue-600 text-white' : 
                    ['capture', 'complete'].includes(currentStep) ? 'bg-green-600 text-white' : 
                    'bg-gray-300 text-gray-600'
                  }`}>
                    {['capture', 'complete'].includes(currentStep) ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-bold">2</span>
                    )}
                  </div>
                  <span className={`font-medium ${
                    currentStep === 'verify' ? 'text-blue-800' : 
                    ['capture', 'complete'].includes(currentStep) ? 'text-green-800' : 
                    'text-gray-600'
                  }`}>
                    Verify Identity
                  </span>
                </div>

                <div className={`flex items-center space-x-3 p-3 rounded-lg ${
                  currentStep === 'capture' ? 'bg-blue-50 border border-blue-200' : 
                  currentStep === 'complete' ? 'bg-green-50 border border-green-200' : 
                  'bg-gray-50'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    currentStep === 'capture' ? 'bg-blue-600 text-white' : 
                    currentStep === 'complete' ? 'bg-green-600 text-white' : 
                    'bg-gray-300 text-gray-600'
                  }`}>
                    {currentStep === 'complete' ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-bold">3</span>
                    )}
                  </div>
                  <span className={`font-medium ${
                    currentStep === 'capture' ? 'text-blue-800' : 
                    currentStep === 'complete' ? 'text-green-800' : 
                    'text-gray-600'
                  }`}>
                    Capture Photo
                  </span>
                </div>
              </div>

              {/* Current Time */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="text-center">
                  <p className="text-sm text-text-secondary mb-1">Current Time</p>
                  <p className="text-2xl font-bold text-text-primary">
                    {currentTime.toLocaleTimeString()}
                  </p>
                  <p className="text-sm text-text-secondary">
                    {currentTime.toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Processing Status */}
              {isProcessing && (
                <div className="bg-blue-50 rounded-lg p-4">
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
            <h3 className="text-lg font-semibold text-text-primary mb-4">How to Use the Kiosk</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div>
                <h4 className="font-medium text-text-primary mb-2">Step 1: Scan ID Card</h4>
                <ul className="space-y-1 text-text-secondary">
                  <li>• Position your employee ID card QR code in front of the scanner</li>
                  <li>• Wait for the system to read your information</li>
                  <li>• Verify your details are correct</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-text-primary mb-2">Step 2: Verify Identity</h4>
                <ul className="space-y-1 text-text-secondary">
                  <li>• Check that your name and employee ID are correct</li>
                  <li>• Click "Yes, This is Me" to confirm</li>
                  <li>• Or click "No, Try Again" to restart</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-text-primary mb-2">Step 3: Capture Photo</h4>
                <ul className="space-y-1 text-text-secondary">
                  <li>• Position your face in the camera frame</li>
                  <li>• Click "Capture Photo" when ready</li>
                  <li>• Your attendance will be recorded automatically</li>
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
