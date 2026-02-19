import { BaseAPI } from '../core';

export class TemporalService extends BaseAPI {
    getDatasets() {
        return this.get('/api/temporal/datasets');
    }

    filterByTime(dataset: string, startDate?: string, endDate?: string, timeField: string | null = null) {
        let url = `/api/temporal/filter/${dataset}?`;
        if (startDate) url += `start_date=${startDate}&`;
        if (endDate) url += `end_date=${endDate}&`;
        if (timeField) url += `time_field=${timeField}&`;
        return this.get(url);
    }

    getAnimationFrames(dataset: string, startDate: string, endDate: string, interval = 'day', cumulative = false) {
        return this.get(
            `/api/temporal/animation/${dataset}?start_date=${startDate}&end_date=${endDate}&interval=${interval}&cumulative=${cumulative}`
        );
    }
}
