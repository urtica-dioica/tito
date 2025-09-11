import React, { useState, useEffect } from 'react';
import { Camera } from 'lucide-react';

interface SelfieImageProps {
  imageUrl: string;
  alt: string;
  className?: string;
  fallbackIcon?: React.ReactNode;
  onError?: () => void;
  onClick?: (e: React.MouseEvent) => void;
  clickable?: boolean;
}

const SelfieImage: React.FC<SelfieImageProps> = ({
  imageUrl,
  alt,
  className = '',
  fallbackIcon,
  onError,
  onClick,
  clickable = false
}) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!imageUrl) {
      setIsLoading(false);
      setHasError(true);
      return;
    }

    // Use direct uploads path for better performance and CORS handling
    setImageSrc(`http://localhost:3000${imageUrl}`);
    setIsLoading(false);
  }, [imageUrl]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (hasError || !imageSrc) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        {fallbackIcon || <Camera className="w-6 h-6 text-gray-400" />}
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={`${className} ${clickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
      onClick={clickable ? onClick : undefined}
      onError={() => {
        setHasError(true);
        onError?.();
      }}
      onLoad={() => {
        setHasError(false);
      }}
    />
  );
};

export default SelfieImage;
