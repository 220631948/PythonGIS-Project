/**
 * NotificationBell Component
 *
 * Header bell icon with unread notification count badge
 * Opens notification inbox on click
 */

// React import not needed in React 17+
import { Bell, BellRing } from 'lucide-react';

interface NotificationBellProps {
  unreadCount: number;
  onClick: () => void;
  hasActiveAlerts?: boolean;
  className?: string;
}

export default function NotificationBell({
  unreadCount,
  onClick,
  hasActiveAlerts = false,
  className = ''
}: NotificationBellProps) {
  const hasUnread = unreadCount > 0;

  return (
    <button
      onClick={onClick}
      className={`notification-bell ${hasUnread ? 'has-unread' : ''} ${hasActiveAlerts ? 'has-alerts' : ''} ${className}`}
      aria-label={`Notifications${hasUnread ? ` (${unreadCount} unread)` : ''}`}
      title={hasUnread ? `${unreadCount} unread notifications` : 'Notifications'}
    >
      <div className="bell-icon-wrapper">
        {hasActiveAlerts ? (
          <BellRing size={20} className="bell-icon ringing" />
        ) : (
          <Bell size={20} className="bell-icon" />
        )}

        {hasUnread && (
          <span className="notification-badge" aria-label={`${unreadCount} unread`}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </div>
    </button>
  );
}
