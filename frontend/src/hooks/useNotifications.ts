/**
 * useNotifications Hook
 *
 * Manages notification state, real-time updates, and user interactions
 * Supports WebSocket for real-time notifications and polling fallback
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../lib/api';
import type { Notification, Alert, Subscription } from '../types/api-2026';

interface UseNotificationsOptions {
  userId: string;
  enableRealtime?: boolean;
  pollingInterval?: number;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  activeAlerts: Alert[];
  subscriptions: Subscription[];

  // Actions
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  subscribeToAlerts: (subscription: any) => Promise<void>;
  unsubscribeFromAlerts: (subscriptionId: string) => Promise<void>;
  getAlertsForLocation: (lat: number, lng: number, radius?: number) => Promise<void>;
}

export function useNotifications(options: UseNotificationsOptions): UseNotificationsReturn {
  const { userId, enableRealtime = false, pollingInterval = 30000 } = options;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<Alert[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<any>(null);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    try {
      const data = await apiClient.notifications.getUserNotifications(userId) as any;
      if (data && Array.isArray(data.notifications)) {
        setNotifications(data.notifications);
        setUnreadCount(data.unread_count || 0);
      }
    } catch (err: any) {
      console.error('Failed to fetch notifications:', err);
      setError(err.message || 'Failed to fetch notifications');
    }
  }, [userId]);

  // Fetch active alerts
  const fetchActiveAlerts = useCallback(async () => {
    try {
      const data = await apiClient.notifications.getActiveAlerts() as any;
      if (data && Array.isArray(data.alerts)) {
        setActiveAlerts(data.alerts);
      }
    } catch (err: any) {
      console.error('Failed to fetch alerts:', err);
    }
  }, []);

  // Fetch subscriptions
  const fetchSubscriptions = useCallback(async () => {
    try {
      const data = await apiClient.notifications.getSubscriptions(userId) as any;
      if (data && Array.isArray(data.subscriptions)) {
        setSubscriptions(data.subscriptions);
      }
    } catch (err: any) {
      console.error('Failed to fetch subscriptions:', err);
    }
  }, [userId]);

  // Initial load
  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      fetchNotifications(),
      fetchActiveAlerts(),
      fetchSubscriptions()
    ]).finally(() => setIsLoading(false));
  }, [fetchNotifications, fetchActiveAlerts, fetchSubscriptions]);

  // Setup polling for non-realtime mode
  useEffect(() => {
    if (!enableRealtime && pollingInterval > 0) {
      pollingIntervalRef.current = setInterval(() => {
        fetchNotifications();
        fetchActiveAlerts();
      }, pollingInterval);

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    }
  }, [enableRealtime, pollingInterval, fetchNotifications, fetchActiveAlerts]);

  // Setup WebSocket for real-time notifications
  useEffect(() => {
    if (enableRealtime && typeof window !== 'undefined') {
      // Dynamic import for socket.io-client to avoid SSR issues
      import('socket.io-client').then(({ io }) => {
        const socket = io('/notifications', {
          auth: { userId },
          transports: ['websocket', 'polling']
        });

        socket.on('connect', () => {
          console.log('WebSocket connected for notifications');
        });

        socket.on('notification', (notification: Notification) => {
          setNotifications(prev => [notification, ...prev]);
          setUnreadCount(prev => prev + 1);

          // Show browser notification if permitted
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(notification.title, {
              body: notification.message,
              icon: '/favicon.ico'
            });
          }
        });

        socket.on('alert', (alert: Alert) => {
          setActiveAlerts(prev => [alert, ...prev]);
        });

        socket.on('disconnect', () => {
          console.log('WebSocket disconnected');
        });

        wsRef.current = socket;

        return () => {
          socket.disconnect();
        };
      }).catch(err => {
        console.error('Failed to initialize WebSocket:', err);
      });
    }
  }, [enableRealtime, userId]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await apiClient.notifications.markRead(notificationId);
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err: any) {
      console.error('Failed to mark notification as read:', err);
      throw err;
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      await Promise.all(unreadIds.map(id => apiClient.notifications.markRead(id)));
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err: any) {
      console.error('Failed to mark all as read:', err);
      throw err;
    }
  }, [notifications]);

  // Refresh notifications manually
  const refreshNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchNotifications(),
        fetchActiveAlerts()
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [fetchNotifications, fetchActiveAlerts]);

  // Subscribe to alerts
  const subscribeToAlerts = useCallback(async (subscription: any) => {
    try {
      const result = await apiClient.notifications.subscribe(subscription) as any;
      if (result && result.subscription) {
        setSubscriptions(prev => [...prev, result.subscription]);
      }
      await fetchSubscriptions();
    } catch (err: any) {
      console.error('Failed to subscribe to alerts:', err);
      throw err;
    }
  }, [fetchSubscriptions]);

  // Unsubscribe from alerts
  const unsubscribeFromAlerts = useCallback(async (subscriptionId: string) => {
    try {
      await apiClient.notifications.unsubscribe(subscriptionId);
      setSubscriptions(prev => prev.filter(s => s.id !== subscriptionId));
    } catch (err: any) {
      console.error('Failed to unsubscribe:', err);
      throw err;
    }
  }, []);

  // Get alerts for specific location
  const getAlertsForLocation = useCallback(async (
    lat: number,
    lng: number,
    radius: number = 1000
  ) => {
    try {
      const data = await apiClient.notifications.getActiveAlerts(lat, lng, radius) as any;
      if (data && Array.isArray(data.alerts)) {
        setActiveAlerts(data.alerts);
      }
    } catch (err: any) {
      console.error('Failed to fetch alerts for location:', err);
      throw err;
    }
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    activeAlerts,
    subscriptions,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    subscribeToAlerts,
    unsubscribeFromAlerts,
    getAlertsForLocation
  };
}

// Request browser notification permission
export function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return Promise.resolve('denied');
  }

  if (Notification.permission === 'granted') {
    return Promise.resolve('granted');
  }

  if (Notification.permission !== 'denied') {
    return Notification.requestPermission();
  }

  return Promise.resolve('denied');
}
