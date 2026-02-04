/**
 * Skeleton loading components for various UI elements.
 * Provides smooth loading states with shimmer animations.
 */

import React from 'react';

interface SkeletonProps {
  className?: string;
}

/**
 * Base skeleton component with shimmer animation
 */
export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return <div className={`skeleton ${className}`} />;
};

/**
 * Skeleton for text lines
 */
export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 3,
  className = '',
}) => {
  return (
    <div className={`stack-sm ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`skeleton skeleton-text ${
            i === lines - 1 ? 'skeleton-text-sm' : ''
          }`}
        />
      ))}
    </div>
  );
};

/**
 * Skeleton for card components
 */
export const SkeletonCard: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`card ${className}`}>
      <div className="skeleton skeleton-card" />
      <div className="stack-sm" style={{ marginTop: 'var(--space-3)' }}>
        <div className="skeleton skeleton-text" />
        <div className="skeleton skeleton-text skeleton-text-sm" />
      </div>
    </div>
  );
};

/**
 * Skeleton for list items
 */
export const SkeletonListItem: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`flex ${className}`} style={{ gap: 'var(--space-3)', alignItems: 'center' }}>
      <div className="skeleton skeleton-circle" style={{ width: '48px', height: '48px' }} />
      <div className="stack-sm" style={{ flex: 1 }}>
        <div className="skeleton skeleton-text" style={{ width: '70%' }} />
        <div className="skeleton skeleton-text-sm" style={{ width: '40%' }} />
      </div>
    </div>
  );
};

/**
 * Skeleton for a list of items
 */
export const SkeletonList: React.FC<{ count?: number; className?: string }> = ({
  count = 5,
  className = '',
}) => {
  return (
    <div className={`stack ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonListItem key={i} />
      ))}
    </div>
  );
};

/**
 * Skeleton for map layers sidebar
 */
export const SkeletonLayerCard: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`card ${className}`}>
      <div className="flex-between" style={{ marginBottom: 'var(--space-2)' }}>
        <div className="skeleton" style={{ width: '60%', height: '20px' }} />
        <div className="skeleton skeleton-circle" style={{ width: '24px', height: '24px' }} />
      </div>
      <div className="skeleton" style={{ width: '100%', height: '12px' }} />
    </div>
  );
};

/**
 * Skeleton for dashboard stats
 */
export const SkeletonStat: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`card ${className}`}>
      <div className="skeleton" style={{ width: '40%', height: '14px', marginBottom: 'var(--space-2)' }} />
      <div className="skeleton" style={{ width: '60%', height: '32px' }} />
    </div>
  );
};

/**
 * Skeleton for dashboard with multiple stats
 */
export const SkeletonDashboard: React.FC<{ stats?: number; className?: string }> = ({
  stats = 4,
  className = '',
}) => {
  return (
    <div
      className={className}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 'var(--space-4)',
      }}
    >
      {Array.from({ length: stats }).map((_, i) => (
        <SkeletonStat key={i} />
      ))}
    </div>
  );
};

/**
 * Skeleton for table rows
 */
export const SkeletonTable: React.FC<{ rows?: number; columns?: number; className?: string }> = ({
  rows = 5,
  columns = 4,
  className = '',
}) => {
  return (
    <div className={`stack-sm ${className}`}>
      <div className="flex" style={{ gap: 'var(--space-2)' }}>
        {Array.from({ length: columns }).map((_, i) => (
          <div
            key={i}
            className="skeleton"
            style={{ flex: 1, height: '24px' }}
          />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex" style={{ gap: 'var(--space-2)' }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={colIndex}
              className="skeleton"
              style={{ flex: 1, height: '20px' }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};
