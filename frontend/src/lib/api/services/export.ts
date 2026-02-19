import { BaseAPI } from '../core';
import { API_BASE_URL } from '../config';

export class ExportService extends BaseAPI {
    exportData(request: unknown) {
        return this.post('/api/export/data', request);
    }

    exportAnalysis(request: unknown) {
        return this.post('/api/export/analysis', request);
    }

    getFormats() {
        return this.get('/api/export/formats');
    }

    getPending() {
        return this.get('/api/export/pending');
    }

    getDownloadUrl(fileId: string) {
        return `${API_BASE_URL}/api/export/download/${fileId}`;
    }
}
