import React, { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import { QrCode, AlertCircle } from 'lucide-react';

interface QRScannerProps {
  onScan: (data: string) => void;
  onError?: (error: string) => void;
  isActive: boolean;
}

const QRScannerComponent: React.FC<QRScannerProps> = ({ onScan, onError, isActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    if (isActive && videoRef.current) {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isActive]);

  const startScanner = async () => {
    try {
      if (!videoRef.current) return;

      // Check camera permissions first
      const hasCameraPermission = await QrScanner.hasCamera();
      if (!hasCameraPermission) {
        setError('Camera not available. Please check your camera permissions.');
        setHasPermission(false);
        onError?.('Camera not available');
        return;
      }

      // Check if we're on HTTPS or localhost (for development)
      const isSecureContext = window.isSecureContext || window.location.hostname === 'localhost';
      if (!isSecureContext) {
        setError('Camera access requires HTTPS or localhost. Please use HTTPS or access via localhost.');
        setHasPermission(false);
        onError?.('HTTPS required for camera access');
        return;
      }

      setHasPermission(true);
      setError(null);

      // Create QR scanner instance
      qrScannerRef.current = new QrScanner(
        videoRef.current,
        (result) => {
          console.log('QR Code detected:', result.data);
          onScan(result.data);
          stopScanner(); // Stop scanning after successful scan
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment', // Use back camera if available
        }
      );

      await qrScannerRef.current.start();
      setIsScanning(true);
    } catch (err) {
      console.error('Error starting QR scanner:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to start camera';
      setError(errorMessage);
      setHasPermission(false);
      onError?.(errorMessage);
    }
  };

  const stopScanner = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    setIsScanning(false);
  };

  const retryScanner = () => {
    setError(null);
    if (isActive) {
      startScanner();
    }
  };

  if (!isActive) {
    return (
      <div className="w-full h-80 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-text-secondary">QR Scanner Inactive</p>
        </div>
      </div>
    );
  }

  if (hasPermission === false) {
    return (
      <div className="w-full h-80 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <p className="text-red-600 font-medium mb-2">Camera Access Required</p>
          <p className="text-red-500 text-sm mb-4">{error}</p>
          <div className="space-y-2">
            <button
              onClick={retryScanner}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors mr-2"
            >
              Try Again
            </button>
            <button
              onClick={() => onScan('{"company":"TITO_HR_SYSTEM","employeeId":"EMP-2025-0000002","department":"Accounting","timestamp":"' + Date.now() + '"}')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Test with Sample QR
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-80 bg-gray-100 rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        muted
      />
      
      {/* Scanning overlay */}
      {isScanning && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Corner indicators */}
          <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
          <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
          <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
          <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>
          
          {/* Scanning line animation */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-blue-500 animate-pulse"></div>
          
          {/* Instructions overlay */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white px-4 py-2 rounded-lg">
            <p className="text-sm">Position QR code within the frame</p>
          </div>
        </div>
      )}

      {/* Loading state */}
      {!isScanning && hasPermission && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-text-secondary">Starting camera...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && hasPermission && (
        <div className="absolute inset-0 bg-red-50 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-600 text-sm mb-4">{error}</p>
            <button
              onClick={retryScanner}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRScannerComponent;
