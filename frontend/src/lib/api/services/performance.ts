import { BaseAPI } from '../core';
import { API_BASE_URL } from '../config';

export class PerformanceService extends BaseAPI {
    getVectorTile(dataset: string, z: number, x: number, y: number) {
        return fetch(`${API_BASE_URL}/api/performance/vector-tiles/${z}/${x}/${y}.mvt?dataset=${dataset}`);
    }

    getClusteredData(dataset: string, zoom: number, bounds?: string) {
        let url = `/api/performance/cluster/${dataset}?zoom=${zoom}`;
        if (bounds) url += `&bounds=${bounds}`;
        return this.get(url);
    }

    getLODData(dataset: string, zoom: number, simplify = true) {
        return this.get(`/api/performance/lod/${dataset}?zoom=${zoom}&simplify=${simplify}`);
    }

    preloadCache(request: unknown) {
        return this.post('/api/performance/cache/preload', request);
    }

    getCacheStats() {
        return this.get('/api/performance/cache/stats');
    }
}
