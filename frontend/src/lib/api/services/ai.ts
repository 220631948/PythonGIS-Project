import { BaseAPI } from '../core';

export class AIService extends BaseAPI {
    predictTraffic(request: unknown) {
        return this.post('/api/ai/traffic/predict', request);
    }

    predictCrimeHotspots(request: unknown) {
        return this.post('/api/ai/crime/hotspots', request);
    }

    detectLandUseChange(request: unknown) {
        return this.post('/api/ai/landuse/change-detection', request);
    }

    queryNaturalLanguage(request: unknown) {
        return this.post('/api/ai/nlp/query', request);
    }

    getTrendingPredictions() {
        return this.get('/api/ai/predictions/trending');
    }
}
