/**
 * Empty state components for various scenarios.
 * Provides user-friendly messaging when no data is available.
 */

import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

/**
 * Base empty state component
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div
      className={`flex-center ${className}`}
      style={{
        flexDirection: 'column',
        padding: 'var(--space-12)',
        textAlign: 'center',
      }}
    >
      {icon && (
        <div
          style={{
            fontSize: '48px',
            marginBottom: 'var(--space-4)',
            opacity: 0.5,
          }}
        >
          {icon}
        </div>
      )}
      <h3
        style={{
          fontSize: 'var(--text-xl)',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--color-text-primary)',
          marginBottom: 'var(--space-2)',
        }}
      >
        {title}
      </h3>
      {description && (
        <p
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-secondary)',
            maxWidth: '400px',
            marginBottom: action ? 'var(--space-6)' : 0,
          }}
        >
          {description}
        </p>
      )}
      {action && (
        <button className="btn btn-primary" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
};

/**
 * Empty state for no search results
 */
export const EmptySearchResults: React.FC<{ searchTerm?: string; onClear?: () => void }> = ({
  searchTerm,
  onClear,
}) => {
  return (
    <EmptyState
      icon="🔍"
      title="No results found"
      description={
        searchTerm
          ? `No results match "${searchTerm}". Try adjusting your search.`
          : 'Try a different search term.'
      }
      action={
        onClear
          ? {
              label: 'Clear search',
              onClick: onClear,
            }
          : undefined
      }
    />
  );
};

/**
 * Empty state for no data layers
 */
export const EmptyDataLayers: React.FC<{ onLoad?: () => void }> = ({ onLoad }) => {
  return (
    <EmptyState
      icon="🗺️"
      title="No layers loaded"
      description="Add spatial data layers to visualize on the map."
      action={
        onLoad
          ? {
              label: 'Load data layers',
              onClick: onLoad,
            }
          : undefined
      }
    />
  );
};

/**
 * Empty state for error scenarios
 */
export const ErrorState: React.FC<{ error?: string; onRetry?: () => void }> = ({
  error,
  onRetry,
}) => {
  return (
    <EmptyState
      icon="⚠️"
      title="Something went wrong"
      description={error || 'An unexpected error occurred. Please try again.'}
      action={
        onRetry
          ? {
              label: 'Retry',
              onClick: onRetry,
            }
          : undefined
      }
    />
  );
};

/**
 * Empty state for no data available
 */
export const NoDataAvailable: React.FC<{ message?: string }> = ({ message }) => {
  return (
    <EmptyState
      icon="📊"
      title="No data available"
      description={message || 'There is currently no data to display.'}
    />
  );
};

/**
 * Empty state for features requiring authentication
 */
export const AuthRequired: React.FC<{ onLogin?: () => void }> = ({ onLogin }) => {
  return (
    <EmptyState
      icon="🔒"
      title="Authentication required"
      description="Please sign in to access this feature."
      action={
        onLogin
          ? {
              label: 'Sign in',
              onClick: onLogin,
            }
          : undefined
      }
    />
  );
};

/**
 * Empty state for offline scenarios
 */
export const OfflineState: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => {
  return (
    <EmptyState
      icon="📡"
      title="You're offline"
      description="Check your internet connection and try again."
      action={
        onRetry
          ? {
              label: 'Retry',
              onClick: onRetry,
            }
          : undefined
      }
    />
  );
};
