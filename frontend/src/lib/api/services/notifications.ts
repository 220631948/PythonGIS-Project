import { BaseAPI } from '../core';

export class NotificationsService extends BaseAPI {
    subscribe(subscription: unknown) {
        return this.post('/api/notifications/subscribe', subscription);
    }

    getSubscriptions(userId: string) {
        return this.get(`/api/notifications/subscriptions/${userId}`);
    }

    updateSubscription(subscriptionId: string, update: unknown) {
        return this.patch(`/api/notifications/subscriptions/${subscriptionId}`, update);
    }

    unsubscribe(subscriptionId: string) {
        return this.delete(`/api/notifications/subscriptions/${subscriptionId}`);
    }

    registerPushDevice(registration: unknown) {
        return this.post('/api/notifications/push/register', registration);
    }

    createAlert(alert: unknown) {
        return this.post('/api/notifications/alerts/create', alert);
    }

    getActiveAlerts(lat?: number, lng?: number, radius?: number) {
        let url = '/api/notifications/alerts/active';
        if (lat !== undefined && lng !== undefined) {
            url += `?lat=${lat}&lng=${lng}`;
            if (radius) url += `&radius=${radius}`;
        }
        return this.get(url);
    }

    getUserNotifications(userId: string, unreadOnly = false) {
        return this.get(`/api/notifications/${userId}?unread_only=${unreadOnly}`);
    }

    markRead(notificationId: string) {
        return this.post(`/api/notifications/${notificationId}/read`, {});
    }

    addLocationWatch(watch: unknown) {
        return this.post('/api/notifications/watch/add', watch);
    }

    getLocationWatches(userId: string) {
        return this.get(`/api/notifications/watch/list/${userId}`);
    }
}
