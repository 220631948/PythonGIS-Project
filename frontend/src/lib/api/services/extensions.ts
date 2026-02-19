import { BaseAPI } from '../core';

export class ExtensionsService extends BaseAPI {
    register(extension: unknown) {
        return this.post('/api/extensions/register', extension);
    }

    getMarketplace(category?: string, search?: string) {
        let url = '/api/extensions/marketplace';
        const params = [];
        if (category) params.push(`category=${category}`);
        if (search) params.push(`search=${encodeURIComponent(search)}`);
        if (params.length) url += `?${params.join('&')}`;
        return this.get(url);
    }

    createAPIKey(request: unknown) {
        return this.post('/api/extensions/api-keys', request);
    }

    getUserAPIKeys(userId: string) {
        return this.get(`/api/extensions/api-keys/${userId}`);
    }

    revokeAPIKey(keyId: string) {
        return this.delete(`/api/extensions/api-keys/${keyId}`);
    }

    getUsage(keyId: string) {
        return this.get(`/api/extensions/usage?api_key_id=${keyId}`);
    }

    registerWebhook(webhook: unknown) {
        return this.post('/api/extensions/webhooks', webhook);
    }

    getUserWebhooks(userId: string) {
        return this.get(`/api/extensions/webhooks/${userId}`);
    }

    deleteWebhook(webhookId: string) {
        return this.delete(`/api/extensions/webhooks/${webhookId}`);
    }

    getDocs() {
        return this.get('/api/extensions/docs/getting-started');
    }
}
