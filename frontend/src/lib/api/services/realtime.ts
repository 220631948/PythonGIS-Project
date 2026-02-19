import { BaseAPI } from '../core';

export class RealtimeService extends BaseAPI {
    getFeeds() {
        return this.get('/api/realtime/feeds');
    }

    getFeed(feedId: string, forceRefresh = false) {
        return this.get(`/api/realtime/feeds/${feedId}?force_refresh=${forceRefresh}`);
    }

    refreshFeed(feedId: string) {
        return this.post(`/api/realtime/feeds/${feedId}/refresh`, {});
    }

    getStatus() {
        return this.get('/api/realtime/status');
    }

    getTimestamps() {
        return this.get('/api/realtime/timestamps');
    }

    getSources() {
        return this.get('/api/realtime/sources');
    }
}
