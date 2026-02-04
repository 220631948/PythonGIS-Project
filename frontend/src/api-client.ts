/**
 * Centralized API client for Cape Town GeoHub
 */

const BASE_URL = ''; // Relative to current host

export interface ApiResponse<T = any> {
    data: T;
    message?: string;
    status: number;
}

export interface FetchOptions extends RequestInit {
    retries?: number;
}

class APIClient {
    async fetchWithRetry<T = any>(url: string, options: FetchOptions = {}, retries = 3): Promise<T> {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data as T;
        } catch (error: unknown) {
            // Enhanced error handling for Senior Spec
            if (retries > 0 && !(error instanceof Error && error.name === 'AbortError')) {
                console.warn(`Retrying fetch for ${url} (${retries} left)...`);
                return this.fetchWithRetry<T>(url, options, retries - 1);
            }

            if (error instanceof Error) {
                console.error(`API Call failed: ${error.message}`);
                throw error;
            }
            throw new Error(String(error || 'Unknown API Error'));
        }
    }

    // Services
    async getServiceAccess(simplify = 0.0001) {
        return this.fetchWithRetry(`${BASE_URL}/api/services/access?simplify=${simplify}`);
    }

    // Transport
    async getTransportAccessibility(lat: number, lon: number, simplify = 0.0001) {
        return this.fetchWithRetry(`${BASE_URL}/api/transport/accessibility?lat=${lat}&lon=${lon}&simplify=${simplify}`);
    }

    // Safety
    async getSafetyPrecincts(simplify = 0.001) {
        return this.fetchWithRetry(`${BASE_URL}/api/safety/precincts?simplify=${simplify}`);
    }

    // Environment
    async getFloodRisk(simplify = 0.0001) {
        return this.fetchWithRetry(`${BASE_URL}/api/environment/flood-risk?simplify=${simplify}`);
    }

    // Land Use
    async getZoning(simplify = 0.001) {
        return this.fetchWithRetry(`${BASE_URL}/api/land-use/zoning?simplify=${simplify}`);
    }

    // Utilities
    async getWaste(simplify = 0.001) {
        return this.fetchWithRetry(`${BASE_URL}/api/utilities/waste?simplify=${simplify}`);
    }

    // Infrastructure
    async getInfrastructureLayer(layerId: string, simplify = 0.0001) {
        return this.fetchWithRetry(`${BASE_URL}/api/infrastructure/${layerId}?simplify=${simplify}`);
    }

    // Spatial Tools
    async pointInPolygon(polygon: any, layers: string[]) {
        return this.fetchWithRetry(`${BASE_URL}/api/spatial/point-in-polygon`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ polygon, layers })
        });
    }

    async getBuffer(lat: number, lon: number, distance = 500) {
        return this.fetchWithRetry(`${BASE_URL}/api/spatial/buffer?lat=${lat}&lon=${lon}&distance=${distance}`);
    }

    async getNearbyFeatures(layer: string, lat: number, lon: number, radius = 1000) {
        return this.fetchWithRetry(`${BASE_URL}/api/spatial/nearby?layer=${layer}&lat=${lat}&lon=${lon}&radius=${radius}`);
    }

    // ========== NEW ENHANCED FEATURES ==========

    // Geocoding & Search
    async searchPlaces(query: string, limit = 10) {
        return this.fetchWithRetry(`${BASE_URL}/api/geocode/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    }

    async getAutocomplete(query: string, limit = 8) {
        return this.fetchWithRetry(`${BASE_URL}/api/geocode/autocomplete?q=${encodeURIComponent(query)}&limit=${limit}`);
    }

    async reverseGeocode(lat: number, lon: number) {
        return this.fetchWithRetry(`${BASE_URL}/api/geocode/reverse?lat=${lat}&lon=${lon}`);
    }

    // Temporal Analysis
    async getTemporalDatasets() {
        return this.fetchWithRetry(`${BASE_URL}/api/temporal/datasets`);
    }

    async filterByTime(dataset: string, startDate?: string, endDate?: string, timeField: string | null = null) {
        let url = `${BASE_URL}/api/temporal/filter/${dataset}?`;
        if (startDate) url += `start_date=${startDate}&`;
        if (endDate) url += `end_date=${endDate}&`;
        if (timeField) url += `time_field=${timeField}&`;
        return this.fetchWithRetry(url);
    }

    async getAnimationFrames(dataset: string, startDate: string, endDate: string, interval = 'day', cumulative = false) {
        return this.fetchWithRetry(
            `${BASE_URL}/api/temporal/animation/${dataset}?start_date=${startDate}&end_date=${endDate}&interval=${interval}&cumulative=${cumulative}`
        );
    }

    // Network Analysis
    async calculateRoute(originLat: number, originLon: number, destLat: number, destLon: number, mode = 'driving') {
        return this.fetchWithRetry(
            `${BASE_URL}/api/network/route?origin_lat=${originLat}&origin_lon=${originLon}&dest_lat=${destLat}&dest_lon=${destLon}&mode=${mode}`
        );
    }

    async calculateIsochrone(lat: number, lon: number, timeMinutes = 15, mode = 'walking', intervals = 3) {
        return this.fetchWithRetry(
            `${BASE_URL}/api/network/isochrone?lat=${lat}&lon=${lon}&time_minutes=${timeMinutes}&mode=${mode}&intervals=${intervals}`
        );
    }

    async calculateServiceArea(facilityType: string, timeMinutes = 15, mode = 'walking') {
        return this.fetchWithRetry(
            `${BASE_URL}/api/network/service-area?facility_type=${facilityType}&time_minutes=${timeMinutes}&mode=${mode}`
        );
    }

    async findNearest(lat: number, lon: number, facilityType: string, count = 5) {
        return this.fetchWithRetry(
            `${BASE_URL}/api/network/nearest?lat=${lat}&lon=${lon}&facility_type=${facilityType}&count=${count}`
        );
    }

    async getTransitConnectivity(lat: number, lon: number, radiusMeters = 1000) {
        return this.fetchWithRetry(
            `${BASE_URL}/api/network/connectivity?lat=${lat}&lon=${lon}&radius_meters=${radiusMeters}`
        );
    }

    // Filtering
    async getFilterSchema(dataset: string) {
        return this.fetchWithRetry(`${BASE_URL}/api/filter/schema/${dataset}`);
    }

    async filterDataset(dataset: string, conditions: any, logic = 'and', simplify = 0.0001) {
        return this.fetchWithRetry(`${BASE_URL}/api/filter/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dataset, conditions, logic, simplify })
        });
    }

    async getFacets(dataset: string, facetFields: string[], filters: any = null) {
        return this.fetchWithRetry(`${BASE_URL}/api/filter/facets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dataset, facet_fields: facetFields, filters })
        });
    }

    async textSearch(dataset: string, query: string, fields: string | null = null, limit = 100) {
        let url = `${BASE_URL}/api/filter/search/${dataset}?q=${encodeURIComponent(query)}&limit=${limit}`;
        if (fields) url += `&fields=${fields}`;
        return this.fetchWithRetry(url);
    }

    // Reports & Dashboard
    async getSummaryReport(datasets: string | null = null) {
        let url = `${BASE_URL}/api/reports/summary`;
        if (datasets) url += `?datasets=${datasets}`;
        return this.fetchWithRetry(url);
    }

    async exportDataset(dataset: string, format = 'csv', columns: string | null = null, limit: number | null = null) {
        let url = `${BASE_URL}/api/reports/export/${dataset}?format=${format}`;
        if (columns) url += `&columns=${columns}`;
        if (limit) url += `&limit=${limit}`;

        // For downloads, we need different handling
        const response = await fetch(url);
        if (!response.ok) throw new Error('Export failed');
        return response;
    }

    async getAnalysisReport(lat: number, lon: number, radiusMeters = 1000) {
        return this.fetchWithRetry(
            `${BASE_URL}/api/reports/analysis-report?lat=${lat}&lon=${lon}&radius_meters=${radiusMeters}`
        );
    }

    async getDashboardData() {
        return this.fetchWithRetry(`${BASE_URL}/api/reports/dashboard-data`);
    }

    // Portal datasets
    async getPortalDatasets(category: string | null = null, search: string | null = null) {
        let url = `${BASE_URL}/api/portal/datasets?`;
        if (category) url += `category=${category}&`;
        if (search) url += `search=${encodeURIComponent(search)}&`;
        return this.fetchWithRetry(url);
    }

    async getPortalCategories() {
        return this.fetchWithRetry(`${BASE_URL}/api/portal/categories`);
    }

    async getDatasetGeoJSON(datasetId: string) {
        return this.fetchWithRetry(`${BASE_URL}/api/portal/datasets/${datasetId}/geojson`);
    }

    // ========== COLLABORATION API ==========

    async getAnnotations(bbox: string | null = null, type: string | null = null, status: string | null = null, page = 1) {
        let url = `${BASE_URL}/api/collaboration/annotations?page=${page}`;
        if (bbox) url += `&bbox=${bbox}`;
        if (type) url += `&annotation_type=${type}`;
        if (status) url += `&status=${status}`;
        return this.fetchWithRetry(url);
    }

    async createAnnotation(annotation: any) {
        return this.fetchWithRetry(`${BASE_URL}/api/collaboration/annotations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(annotation)
        });
    }

    async updateAnnotation(id: string | number, update: any) {
        return this.fetchWithRetry(`${BASE_URL}/api/collaboration/annotations/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(update)
        });
    }

    async deleteAnnotation(id: string | number) {
        return this.fetchWithRetry(`${BASE_URL}/api/collaboration/annotations/${id}`, {
            method: 'DELETE'
        });
    }

    async getAnnotationReplies(annotationId: string | number) {
        return this.fetchWithRetry(`${BASE_URL}/api/collaboration/annotations/${annotationId}/replies`);
    }

    async createReply(annotationId: string | number, reply: any) {
        return this.fetchWithRetry(`${BASE_URL}/api/collaboration/annotations/${annotationId}/replies`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reply)
        });
    }

    async getMarkers(bbox: string | null = null) {
        let url = `${BASE_URL}/api/collaboration/markers`;
        if (bbox) url += `?bbox=${bbox}`;
        return this.fetchWithRetry(url);
    }

    async createMarker(marker: any) {
        return this.fetchWithRetry(`${BASE_URL}/api/collaboration/markers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(marker)
        });
    }

    // ========== EXPORT API ==========

    async exportData(request: any) {
        return this.fetchWithRetry(`${BASE_URL}/api/export/data`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request)
        });
    }

    async exportAnalysis(request: any) {
        return this.fetchWithRetry(`${BASE_URL}/api/export/analysis`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request)
        });
    }

    async getExportFormats() {
        return this.fetchWithRetry(`${BASE_URL}/api/export/formats`);
    }

    async getPendingExports() {
        return this.fetchWithRetry(`${BASE_URL}/api/export/pending`);
    }

    getExportDownloadUrl(fileId: string) {
        return `${BASE_URL}/api/export/download/${fileId}`;
    }

    // ========== FIELD DATA API ==========

    async getFieldForms(offlineOnly = false) {
        return this.fetchWithRetry(`${BASE_URL}/api/field/forms?offline_only=${offlineOnly}`);
    }

    async getFieldForm(formId: string) {
        return this.fetchWithRetry(`${BASE_URL}/api/field/forms/${formId}`);
    }

    async submitFieldEntry(entry: any) {
        return this.fetchWithRetry(`${BASE_URL}/api/field/entries`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entry)
        });
    }

    async syncFieldEntries(entries: any[], syncMode = 'create') {
        return this.fetchWithRetry(`${BASE_URL}/api/field/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entries, sync_mode: syncMode })
        });
    }

    async getFieldEntries(formId: string | null = null, status: string | null = null, limit = 100) {
        let url = `${BASE_URL}/api/field/entries?limit=${limit}`;
        if (formId) url += `&form_id=${formId}`;
        if (status) url += `&status=${status}`;
        return this.fetchWithRetry(url);
    }

    async createOfflinePackage(forms: any = null, layers: any = null, bbox: any = null) {
        return this.fetchWithRetry(`${BASE_URL}/api/field/offline-package`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ forms, layers, bbox })
        });
    }

    // ========== METADATA CATALOG API ==========

    async getCatalogDatasets(category: string | null = null, geometryType: string | null = null, keyword: string | null = null) {
        let url = `${BASE_URL}/api/catalog/datasets?`;
        if (category) url += `category=${encodeURIComponent(category)}&`;
        if (geometryType) url += `geometry_type=${geometryType}&`;
        if (keyword) url += `keyword=${encodeURIComponent(keyword)}&`;
        return this.fetchWithRetry(url);
    }

    async getDatasetMetadata(datasetId: string, refresh = false) {
        return this.fetchWithRetry(`${BASE_URL}/api/catalog/datasets/${datasetId}?refresh=${refresh}`);
    }

    async searchCatalog(query: any) {
        return this.fetchWithRetry(`${BASE_URL}/api/catalog/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(query)
        });
    }

    async getCatalogCategories() {
        return this.fetchWithRetry(`${BASE_URL}/api/catalog/categories`);
    }

    async getCatalogStats() {
        return this.fetchWithRetry(`${BASE_URL}/api/catalog/stats`);
    }

    // ========== ADVANCED ANALYSIS API ==========

    async calculateViewshed(lat: number, lng: number, observerHeight = 1.7, maxDistance = 5000, resolution = 36) {
        return this.fetchWithRetry(`${BASE_URL}/api/analysis/viewshed`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat, lng, observer_height: observerHeight, max_distance: maxDistance, resolution })
        });
    }

    async checkVisibility(fromLat: number, fromLng: number, toLat: number, toLng: number, fromHeight = 1.7, toHeight = 0) {
        return this.fetchWithRetry(
            `${BASE_URL}/api/analysis/visibility-check?from_lat=${fromLat}&from_lng=${fromLng}&to_lat=${toLat}&to_lng=${toLng}&from_height=${fromHeight}&to_height=${toHeight}`
        );
    }

    async validateTopology(dataset: string, checkSelfIntersections = true, checkOverlaps = true) {
        return this.fetchWithRetry(
            `${BASE_URL}/api/analysis/topology/validate/${dataset}?check_self_intersections=${checkSelfIntersections}&check_overlaps=${checkOverlaps}`
        );
    }

    async calculateRouteAdvanced(fromLat: number, fromLng: number, toLat: number, toLng: number, mode = 'driving') {
        return this.fetchWithRetry(
            `${BASE_URL}/api/analysis/route?from_lat=${fromLat}&from_lng=${fromLng}&to_lat=${toLat}&to_lng=${toLng}&mode=${mode}`
        );
    }

    async calculateIsochroneAdvanced(lat: number, lng: number, timeMinutes = 15, mode = 'driving') {
        return this.fetchWithRetry(
            `${BASE_URL}/api/analysis/isochrone?lat=${lat}&lng=${lng}&time_minutes=${timeMinutes}&mode=${mode}`
        );
    }

    async findNearestFacility(lat: number, lng: number, facilityType: string, limit = 5) {
        return this.fetchWithRetry(
            `${BASE_URL}/api/analysis/nearest-facility?lat=${lat}&lng=${lng}&facility_type=${facilityType}&limit=${limit}`
        );
    }

    // ========== REALTIME DATA API ==========

    async getRealtimeFeeds() {
        return this.fetchWithRetry(`${BASE_URL}/api/realtime/feeds`);
    }

    async getRealtimeFeed(feedId: string, forceRefresh = false) {
        return this.fetchWithRetry(`${BASE_URL}/api/realtime/feeds/${feedId}?force_refresh=${forceRefresh}`);
    }

    async refreshRealtimeFeed(feedId: string) {
        return this.fetchWithRetry(`${BASE_URL}/api/realtime/feeds/${feedId}/refresh`, {
            method: 'POST'
        });
    }

    async getRealtimeStatus() {
        return this.fetchWithRetry(`${BASE_URL}/api/realtime/status`);
    }

    async getRealtimeTimestamps() {
        return this.fetchWithRetry(`${BASE_URL}/api/realtime/timestamps`);
    }

    async getRealtimeSources() {
        return this.fetchWithRetry(`${BASE_URL}/api/realtime/sources`);
    }

    // ========== DATA STATUS API ==========

    async getDataSourcesHealth() {
        return this.fetchWithRetry(`${BASE_URL}/api/data-status/health`);
    }

    async getDataSourceHealth(datasetName: string) {
        return this.fetchWithRetry(`${BASE_URL}/api/data-status/health/${datasetName}`);
    }

    async getDataSources() {
        return this.fetchWithRetry(`${BASE_URL}/api/data-status/sources`);
    }

    async getDataProvenance(datasetName: string) {
        return this.fetchWithRetry(`${BASE_URL}/api/data-status/provenance/${datasetName}`);
    }

    async validateDataset(datasetName: string, forceRefresh = false) {
        return this.fetchWithRetry(`${BASE_URL}/api/data-status/validate/${datasetName}?force_refresh=${forceRefresh}`);
    }

    async getRetrievalLog(limit = 50) {
        return this.fetchWithRetry(`${BASE_URL}/api/data-status/retrieval-log?limit=${limit}`);
    }
}

export const apiClient = new APIClient();
export default apiClient;
