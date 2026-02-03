import React from 'react';
import { Inbox, AlertCircle, MapPin, Database, LucideIcon } from 'lucide-react';
import '../../styles/empty-state.css';

/**
 * EmptyState - Reusable component for when no data is available
 * Provides helpful messaging and visual feedback
 */

const ICON_MAP: Record<string, LucideIcon> = {
    data: Database,
    map: MapPin,
    error: AlertCircle,
    default: Inbox
};

export interface EmptyStateProps {
    icon?: 'data' | 'map' | 'error' | 'default';
    title?: string;
    message?: string;
    action?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({
    icon = 'default',
    title = 'No data available',
    message = 'Try adjusting your filters or selecting a different area.',
    action = null
}) => {
    const Icon = ICON_MAP[icon] || ICON_MAP.default;
    if (!Icon) return null;

    return (
        <div className="empty-state" role="status" aria-live="polite">
            <Icon className="empty-state-icon" size={48} aria-hidden="true" />
            <h3 className="empty-state-title">{title}</h3>
            <p className="empty-state-message">{message}</p>
            {action && (
                <div className="empty-state-action">
                    {action}
                </div>
            )}
        </div>
    );
};

export default EmptyState;
