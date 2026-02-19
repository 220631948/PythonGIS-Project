import { BaseAPI } from '../core';

export class CatalogService extends BaseAPI {
    getDatasets(category: string | null = null, geometryType: string | null = null, keyword: string | null = null) {
        let url = '/api/catalog/datasets?';
        if (category) url += `category=${encodeURIComponent(category)}&`;
        if (geometryType) url += `geometry_type=${geometryType}&`;
        if (keyword) url += `keyword=${encodeURIComponent(keyword)}&`;
        return this.get(url);
    }

    getMetadata(datasetId: string, refresh = false) {
        return this.get(`/api/catalog/datasets/${datasetId}?refresh=${refresh}`);
    }

    search(query: unknown) {
        return this.post('/api/catalog/search', query);
    }

    getCategories() {
        return this.get('/api/catalog/categories');
    }

    getStats() {
        return this.get('/api/catalog/stats');
    }
}
