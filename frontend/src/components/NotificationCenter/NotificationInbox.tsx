/**
 * NotificationInbox Component
 *
 * Full notification inbox modal with filtering, marking as read, and actions
 */

import { useState, useMemo } from 'react';
import {
  X,
  CheckCheck,
  AlertTriangle,
  Info,
  AlertCircle,
  MapPin,
  Clock,
  ExternalLink
} from 'lucide-react';
import type { Notification } from '../../types/api-2026';

interface NotificationInboxProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onRefresh: () => void;
}

type NotificationFilter = 'all' | 'unread' | 'traffic' | 'safety' | 'weather' | 'construction';

export default function NotificationInbox({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  isLoading,
  onMarkAsRead,
  onMarkAllAsRead,
}: NotificationInboxProps) {
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    // Apply type filter
    if (filter === 'unread') {
      filtered = filtered.filter(n => !n.read);
    } else if (filter !== 'all') {
      filtered = filtered.filter(n => n.notification_type === filter);
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(query) ||
        n.message.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [notifications, filter, searchQuery]);

  // Get icon for notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'traffic':
        return <MapPin size={16} className="notification-type-icon traffic" />;
      case 'safety':
        return <AlertTriangle size={16} className="notification-type-icon safety" />;
      case 'weather':
        return <AlertCircle size={16} className="notification-type-icon weather" />;
      case 'construction':
        return <Info size={16} className="notification-type-icon construction" />;
      default:
        return <Info size={16} className="notification-type-icon default" />;
    }
  };

  // Format relative time
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="notification-inbox-overlay" onClick={onClose}>
      <div className="notification-inbox-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="inbox-header">
          <div className="header-title">
            <h2>Notifications</h2>
            {unreadCount > 0 && (
              <span className="unread-badge">{unreadCount} unread</span>
            )}
          </div>
          <div className="header-actions">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="action-btn"
                title="Mark all as read"
              >
                <CheckCheck size={18} />
              </button>
            )}
            <button onClick={onClose} className="close-btn" aria-label="Close">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="inbox-filters">
          <div className="filter-tabs">
            {(['all', 'unread', 'traffic', 'safety', 'weather', 'construction'] as NotificationFilter[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`filter-tab ${filter === f ? 'active' : ''}`}
              >
                {f === 'all' ? 'All' : f === 'unread' ? 'Unread' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div className="search-box">
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* Notification List */}
        <div className="inbox-content">
          {isLoading ? (
            <div className="loading-state">
              <div className="spinner" />
              <span>Loading notifications...</span>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="empty-state">
              <Info size={48} className="empty-icon" />
              <h3>No notifications</h3>
              <p>
                {filter === 'unread'
                  ? "You're all caught up!"
                  : searchQuery
                  ? 'No notifications match your search'
                  : 'You have no notifications yet'}
              </p>
            </div>
          ) : (
            <div className="notification-list">
              {filteredNotifications.map(notification => (
                <div
                  key={notification.id}
                  className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                  onClick={() => !notification.read && onMarkAsRead(notification.id)}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notification.notification_type)}
                  </div>
                  <div className="notification-content">
                    <div className="notification-header">
                      <h4 className="notification-title">{notification.title}</h4>
                      <span className="notification-time">
                        <Clock size={12} />
                        {formatTime(notification.created_at)}
                      </span>
                    </div>
                    <p className="notification-message">{notification.message}</p>
                    {notification.action_url && (
                      <a
                        href={notification.action_url}
                        className="notification-action"
                        onClick={e => e.stopPropagation()}
                      >
                        View details <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                  {!notification.read && (
                    <div className="unread-indicator" title="Mark as read" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {filteredNotifications.length > 0 && (
          <div className="inbox-footer">
            <span className="footer-count">
              Showing {filteredNotifications.length} of {notifications.length} notifications
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
