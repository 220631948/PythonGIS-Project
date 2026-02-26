import { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Info, X, LucideIcon } from 'lucide-react';

interface NotificationTypeConfig {
  icon: LucideIcon;
  className: string;
}

const NOTIFICATION_TYPES: Record<string, NotificationTypeConfig> = {
  success: { icon: CheckCircle, className: 'notification-success' },
  error: { icon: AlertCircle, className: 'notification-error' },
  info: { icon: Info, className: 'notification-info' }
};

export interface NotificationItem {
  id: string | number;
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
}

export interface NotificationProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export const Notification: React.FC<NotificationProps> = ({ message, type = 'info', onClose, duration = 4000 }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const config = (NOTIFICATION_TYPES[type] ?? NOTIFICATION_TYPES.info) as NotificationTypeConfig;
  const IconComponent = config.icon;

  useEffect(() => {
    if (duration > 0 && !isHovered) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Allow animation to complete
      }, duration);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [duration, onClose, isHovered]);

  const role = type === 'error' ? 'alert' : 'status';
  const ariaLive = type === 'error' ? 'assertive' : 'polite';

  return (
    <div
      className={`notification ${config.className} ${isVisible ? 'visible' : 'hidden'}`}
      role={role}
      aria-live={ariaLive}
      aria-atomic="true"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <IconComponent size={18} aria-hidden="true" />
      <span className="notification-message">{message}</span>
      <button
        className="notification-close"
        onClick={onClose}
        aria-label="Close notification"
      >
        <X size={14} aria-hidden="true" />
      </button>
    </div>
  );
};

interface NotificationContainerProps {
  notifications: NotificationItem[];
  onRemove: (id: string | number) => void;
}

const NotificationContainer: React.FC<NotificationContainerProps> = ({ notifications, onRemove }) => {
  return (
    <div className="notification-container">
      {notifications.map((notif) => (
        <Notification
          key={notif.id}
          message={notif.message}
          type={notif.type}
          duration={notif.duration}
          onClose={() => onRemove(notif.id)}
        />
      ))}
    </div>
  );
};

export default NotificationContainer;
