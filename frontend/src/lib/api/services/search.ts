import { BaseAPI } from '../core';

export class SearchService extends BaseAPI {
    executeSpatialQuery(query: unknown) {
        return this.post('/api/advanced-search/spatial-query', query);
    }

    saveSearch(search: unknown) {
        return this.post('/api/advanced-search/save-search', search);
    }

    getSavedSearches(userId: string, publicOnly = false) {
        return this.get(`/api/advanced-search/saved-searches/${userId}?public_only=${publicOnly}`);
    }

    crossDatasetSearch(query: string, datasets?: string[]) {
        let url = `/api/advanced-search/cross-dataset-search?q=${encodeURIComponent(query)}`;
        if (datasets) url += `&datasets=${datasets.join(',')}`;
        return this.get(url);
    }

    getRecommendations(userId: string) {
        return this.get(`/api/advanced-search/recommendations/${userId}`);
    }
}
