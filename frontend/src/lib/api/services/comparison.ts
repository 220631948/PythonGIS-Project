import { BaseAPI } from '../core';

export class ComparisonService extends BaseAPI {
    compareNeighborhoods(request: unknown) {
        return this.post('/api/comparison/neighborhoods', request);
    }

    compareTemporally(areaId: string, metric: string, years: number[]) {
        return this.get(`/api/comparison/temporal?area_id=${areaId}&metric=${metric}&years=${years.join(',')}`);
    }

    benchmarkArea(areaId: string, metrics?: string[]) {
        let url = `/api/comparison/benchmark/${areaId}`;
        if (metrics) url += `?metrics=${metrics.join(',')}`;
        return this.get(url);
    }

    findSimilarAreas(areaId: string, limit = 5) {
        return this.get(`/api/comparison/similar/${areaId}?limit=${limit}`);
    }
}
