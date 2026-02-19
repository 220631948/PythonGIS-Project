import { BaseAPI } from '../core';

export class FieldService extends BaseAPI {
    getForms(offlineOnly = false) {
        return this.get(`/api/field/forms?offline_only=${offlineOnly}`);
    }

    getForm(formId: string) {
        return this.get(`/api/field/forms/${formId}`);
    }

    submitEntry(entry: unknown) {
        return this.post('/api/field/entries', entry);
    }

    syncEntries(entries: unknown[], syncMode = 'create') {
        return this.post('/api/field/sync', { entries, sync_mode: syncMode });
    }

    getEntries(formId: string | null = null, status: string | null = null, limit = 100) {
        let url = `/api/field/entries?limit=${limit}`;
        if (formId) url += `&form_id=${formId}`;
        if (status) url += `&status=${status}`;
        return this.get(url);
    }

    createOfflinePackage(forms: unknown = null, layers: unknown = null, bbox: unknown = null) {
        return this.post('/api/field/offline-package', { forms, layers, bbox });
    }
}
