import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isLoading, message = 'Loading data...' }) => {
  if (!isLoading) return null;

  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <Loader2 size={40} className="loading-spinner" />
        <p className="loading-message">{message}</p>
      </div>
    </div>
  );
};

interface LoadingIndicatorProps {
  size?: number | string;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ size = 24 }) => (
  <Loader2 size={typeof size === 'string' ? parseInt(size, 10) : size} className="loading-spinner inline" />
);

export { LoadingOverlay, LoadingIndicator };
export default LoadingOverlay;
