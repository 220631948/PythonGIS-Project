import { BaseAPI } from '../core';

export class DemographicsService extends BaseAPI {
    getDensityHeatmap(request: unknown) {
        return this.post('/api/demographics/density/heatmap', request);
    }

    getSocioeconomicIndicators(areaId: string) {
        return this.get(`/api/demographics/indicators/${areaId}`);
    }

    getAgeDistribution(areaId: string) {
        return this.get(`/api/demographics/age-distribution/${areaId}`);
    }
}
