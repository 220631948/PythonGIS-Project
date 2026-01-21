import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const NOTIFICATION_TYPES = {
  success: { icon: CheckCircle, className: 'notification-success' },
  error: { icon: AlertCircle, className: 'notification-error' },
  info: { icon: Info, className: 'notification-info' }
};

const Notification = ({ message, type = 'info', onClose, duration = 4000 }) => {
  const [isVisible, setIsVisible] = useState(true);
  const config = NOTIFICATION_TYPES[type] || NOTIFICATION_TYPES.info;
  const IconComponent = config.icon;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Allow animation to complete
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <div className={`notification ${config.className} ${isVisible ? 'visible' : 'hidden'}`}>
      <IconComponent size={18} />
      <span className="notification-message">{message}</span>
      <button className="notification-close" onClick={onClose}>
        <X size={14} />
      </button>
    </div>
  );
};

const NotificationContainer = ({ notifications, onRemove }) => {
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
