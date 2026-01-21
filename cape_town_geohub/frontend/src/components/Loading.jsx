import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingOverlay = ({ isLoading, message = 'Loading data...' }) => {
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

const LoadingIndicator = ({ size = 24 }) => (
  <Loader2 size={size} className="loading-spinner inline" />
);

export { LoadingOverlay, LoadingIndicator };
export default LoadingOverlay;
