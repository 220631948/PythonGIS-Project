import React from 'react';
import '../../styles/skeleton.css';

export interface SkeletonCardProps {}

export const SkeletonCard: React.FC<SkeletonCardProps> = () => (
    <div className="skeleton-card">
        <div className="skeleton skeleton-title"></div>
        <div className="skeleton skeleton-text"></div>
        <div className="skeleton skeleton-text"></div>
    </div>
);

export interface SkeletonListProps {
  items?: number;
}

export const SkeletonList: React.FC<SkeletonListProps> = ({items = 3}) => (
    <div className="skeleton-list">
        {Array.from({length: items}).map((_, i) => (
            <div key={i} className="skeleton-list-item">
                <div className="skeleton skeleton-icon"></div>
                <div className="skeleton skeleton-text" style={{width: '80%'}}></div>
            </div>
        ))}
    </div>
);

export interface SkeletonMapProps {}

export const SkeletonMap: React.FC<SkeletonMapProps> = () => (
    <div className="skeleton-map">
        <div className="skeleton skeleton-rect"></div>
    </div>
);

export interface SkeletonLoaderProps {
  type?: 'card' | 'list' | 'map';
  items?: number;
}

/**
 * SkeletonLoader - Reusable loading placeholder component
 * Used across modules for consistent loading states
 */
const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({type = 'card', items = 3}) => {
    switch (type) {
        case 'list':
            return <SkeletonList items={items}/>;
        case 'map':
            return <SkeletonMap/>;
        default:
            return <SkeletonCard/>;
    }
};

export default SkeletonLoader;
