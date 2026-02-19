import { BaseAPI } from '../core';

export class DataStatusService extends BaseAPI {
    getHealth(datasetName?: string) {
        if (datasetName) {
            return this.get(`/api/data-status/health/${datasetName}`);
        }
        return this.get('/api/data-status/health');
    }

    getSources() {
        return this.get('/api/data-status/sources');
    }

    getProvenance(datasetName: string) {
        return this.get(`/api/data-status/provenance/${datasetName}`);
    }

    validateDataset(datasetName: string, forceRefresh = false) {
        return this.get(`/api/data-status/validate/${datasetName}?force_refresh=${forceRefresh}`);
    }

    getRetrievalLog(limit = 50) {
        return this.get(`/api/data-status/retrieval-log?limit=${limit}`);
    }

    getQualityOverview() {
        return this.get('/api/data-quality/overview');
    }

    getDatasetQuality(datasetId: string) {
        return this.get(`/api/data-quality/dataset/${datasetId}`);
    }

    getValidationErrors(datasetId: string, severity?: string) {
        let url = `/api/data-quality/validation/errors/${datasetId}`;
        if (severity) url += `?severity=${severity}`;
        return this.get(url);
    }
}
