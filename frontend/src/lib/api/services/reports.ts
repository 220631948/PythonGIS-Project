import { BaseAPI } from '../core';
import { APIError } from '../types';
import { API_BASE_URL } from '../config';

export class ReportsService extends BaseAPI {
    getSummary(datasets: string | null = null) {
        let url = '/api/reports/summary';
        if (datasets) url += `?datasets=${datasets}`;
        return this.get(url);
    }

    async exportDataset(dataset: string, format = 'csv', columns: string | null = null, limit: number | null = null) {
        let url = `${API_BASE_URL}/api/reports/export/${dataset}?format=${format}`;
        if (columns) url += `&columns=${columns}`;
        if (limit) url += `&limit=${limit}`;
        const response = await fetch(url);
        if (!response.ok) throw new APIError('Export failed', response.status);
        return response;
    }

    getAnalysisReport(lat: number, lon: number, radiusMeters = 1000) {
        return this.get(`/api/reports/analysis-report?lat=${lat}&lon=${lon}&radius_meters=${radiusMeters}`);
    }

    getDashboardData() {
        return this.get('/api/reports/dashboard-data');
    }

    generateReport(request: unknown) {
        return this.post('/api/pdf-reports/generate', request);
    }

    getReportStatus(taskId: string) {
        return this.get(`/api/pdf-reports/status/${taskId}`);
    }

    getReportTemplates() {
        return this.get('/api/pdf-reports/templates');
    }

    scheduleReport(schedule: unknown) {
        return this.post('/api/pdf-reports/schedule', schedule);
    }

    getScheduledReports(userId: string) {
        return this.get(`/api/pdf-reports/scheduled/${userId}`);
    }
}
