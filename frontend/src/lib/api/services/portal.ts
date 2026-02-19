import { BaseAPI } from '../core';

export class PortalService extends BaseAPI {
    getDatasets(category: string | null = null, search: string | null = null) {
        let url = '/api/portal/datasets?';
        if (category) url += `category=${category}&`;
        if (search) url += `search=${encodeURIComponent(search)}&`;
        return this.get(url);
    }

    getCategories() {
        return this.get('/api/portal/categories');
    }

    getDatasetGeoJSON(datasetId: string) {
        return this.get(`/api/portal/datasets/${datasetId}/geojson`);
    }
}
