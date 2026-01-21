/**
 * Centralized API client for Cape Town GeoHub
 */

const BASE_URL = ''; // Relative to current host

class APIClient {
    async fetchWithRetry(url, options = {}, retries = 3) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            if (retries > 0) {
                console.warn(`Retrying fetch for ${url} (${retries} left)...`);
                return this.fetchWithRetry(url, options, retries - 1);
            }
            throw error;
        }
    }

    // Services
    async getServiceAccess(simplify = 0.0001) {
        return this.fetchWithRetry(`${BASE_URL}/api/services/access?simplify=${simplify}`);
    }

    // Transport
    async getTransportAccessibility(lat, lon, simplify = 0.0001) {
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
    async getInfrastructureLayer(layerId, simplify = 0.0001) {
        return this.fetchWithRetry(`${BASE_URL}/api/infrastructure/${layerId}?simplify=${simplify}`);
    }

    // Spatial Tools
    async pointInPolygon(polygon, layers) {
        return this.fetchWithRetry(`${BASE_URL}/api/spatial/point-in-polygon`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ polygon, layers })
        });
    }

    async getBuffer(lat, lon, distance = 500) {
        return this.fetchWithRetry(`${BASE_URL}/api/spatial/buffer?lat=${lat}&lon=${lon}&distance=${distance}`);
    }

    async getNearbyFeatures(layer, lat, lon, radius = 1000) {
        return this.fetchWithRetry(`${BASE_URL}/api/spatial/nearby?layer=${layer}&lat=${lat}&lon=${lon}&radius=${radius}`);
    }

    // ========== NEW ENHANCED FEATURES ==========

    // Geocoding & Search
    async searchPlaces(query, limit = 10) {
        return this.fetchWithRetry(`${BASE_URL}/api/geocode/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    }

    async getAutocomplete(query, limit = 8) {
        return this.fetchWithRetry(`${BASE_URL}/api/geocode/autocomplete?q=${encodeURIComponent(query)}&limit=${limit}`);
    }

    async reverseGeocode(lat, lon) {
        return this.fetchWithRetry(`${BASE_URL}/api/geocode/reverse?lat=${lat}&lon=${lon}`);
    }

    // Temporal Analysis
    async getTemporalDatasets() {
        return this.fetchWithRetry(`${BASE_URL}/api/temporal/datasets`);
    }

    async filterByTime(dataset, startDate, endDate, timeField = null) {
        let url = `${BASE_URL}/api/temporal/filter/${dataset}?`;
        if (startDate) url += `start_date=${startDate}&`;
        if (endDate) url += `end_date=${endDate}&`;
        if (timeField) url += `time_field=${timeField}&`;
        return this.fetchWithRetry(url);
    }

    async getAnimationFrames(dataset, startDate, endDate, interval = 'day', cumulative = false) {
        return this.fetchWithRetry(
            `${BASE_URL}/api/temporal/animation/${dataset}?start_date=${startDate}&end_date=${endDate}&interval=${interval}&cumulative=${cumulative}`
        );
    }

    // Network Analysis
    async calculateRoute(originLat, originLon, destLat, destLon, mode = 'driving') {
        return this.fetchWithRetry(
            `${BASE_URL}/api/network/route?origin_lat=${originLat}&origin_lon=${originLon}&dest_lat=${destLat}&dest_lon=${destLon}&mode=${mode}`
        );
    }

    async calculateIsochrone(lat, lon, timeMinutes = 15, mode = 'walking', intervals = 3) {
        return this.fetchWithRetry(
            `${BASE_URL}/api/network/isochrone?lat=${lat}&lon=${lon}&time_minutes=${timeMinutes}&mode=${mode}&intervals=${intervals}`
        );
    }

    async calculateServiceArea(facilityType, timeMinutes = 15, mode = 'walking') {
        return this.fetchWithRetry(
            `${BASE_URL}/api/network/service-area?facility_type=${facilityType}&time_minutes=${timeMinutes}&mode=${mode}`
        );
    }

    async findNearest(lat, lon, facilityType, count = 5) {
        return this.fetchWithRetry(
            `${BASE_URL}/api/network/nearest?lat=${lat}&lon=${lon}&facility_type=${facilityType}&count=${count}`
        );
    }

    async getTransitConnectivity(lat, lon, radiusMeters = 1000) {
        return this.fetchWithRetry(
            `${BASE_URL}/api/network/connectivity?lat=${lat}&lon=${lon}&radius_meters=${radiusMeters}`
        );
    }

    // Filtering
    async getFilterSchema(dataset) {
        return this.fetchWithRetry(`${BASE_URL}/api/filter/schema/${dataset}`);
    }

    async filterDataset(dataset, conditions, logic = 'and', simplify = 0.0001) {
        return this.fetchWithRetry(`${BASE_URL}/api/filter/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dataset, conditions, logic, simplify })
        });
    }

    async getFacets(dataset, facetFields, filters = null) {
        return this.fetchWithRetry(`${BASE_URL}/api/filter/facets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dataset, facet_fields: facetFields, filters })
        });
    }

    async textSearch(dataset, query, fields = null, limit = 100) {
        let url = `${BASE_URL}/api/filter/search/${dataset}?q=${encodeURIComponent(query)}&limit=${limit}`;
        if (fields) url += `&fields=${fields}`;
        return this.fetchWithRetry(url);
    }

    // Reports & Dashboard
    async getSummaryReport(datasets = null) {
        let url = `${BASE_URL}/api/reports/summary`;
        if (datasets) url += `?datasets=${datasets}`;
        return this.fetchWithRetry(url);
    }

    async exportDataset(dataset, format = 'csv', columns = null, limit = null) {
        let url = `${BASE_URL}/api/reports/export/${dataset}?format=${format}`;
        if (columns) url += `&columns=${columns}`;
        if (limit) url += `&limit=${limit}`;

        // For downloads, we need different handling
        const response = await fetch(url);
        if (!response.ok) throw new Error('Export failed');
        return response;
    }

    async getAnalysisReport(lat, lon, radiusMeters = 1000) {
        return this.fetchWithRetry(
            `${BASE_URL}/api/reports/analysis-report?lat=${lat}&lon=${lon}&radius_meters=${radiusMeters}`
        );
    }

    async getDashboardData() {
        return this.fetchWithRetry(`${BASE_URL}/api/reports/dashboard-data`);
    }

    // Portal datasets
    async getPortalDatasets(category = null, search = null) {
        let url = `${BASE_URL}/api/portal/datasets?`;
        if (category) url += `category=${category}&`;
        if (search) url += `search=${encodeURIComponent(search)}&`;
        return this.fetchWithRetry(url);
    }

    async getPortalCategories() {
        return this.fetchWithRetry(`${BASE_URL}/api/portal/categories`);
    }

    // ========== COLLABORATION API ==========

    async getAnnotations(bbox = null, type = null, status = null, page = 1) {
        let url = `${BASE_URL}/api/collaboration/annotations?page=${page}`;
        if (bbox) url += `&bbox=${bbox}`;
        if (type) url += `&annotation_type=${type}`;
        if (status) url += `&status=${status}`;
        return this.fetchWithRetry(url);
    }

    async createAnnotation(annotation) {
        return this.fetchWithRetry(`${BASE_URL}/api/collaboration/annotations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(annotation)
        });
    }

    async updateAnnotation(id, update) {
        return this.fetchWithRetry(`${BASE_URL}/api/collaboration/annotations/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(update)
        });
    }

    async deleteAnnotation(id) {
        return this.fetchWithRetry(`${BASE_URL}/api/collaboration/annotations/${id}`, {
            method: 'DELETE'
        });
    }

    async getAnnotationReplies(annotationId) {
        return this.fetchWithRetry(`${BASE_URL}/api/collaboration/annotations/${annotationId}/replies`);
    }

    async createReply(annotationId, reply) {
        return this.fetchWithRetry(`${BASE_URL}/api/collaboration/annotations/${annotationId}/replies`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reply)
        });
    }

    async getMarkers(bbox = null) {
        let url = `${BASE_URL}/api/collaboration/markers`;
        if (bbox) url += `?bbox=${bbox}`;
        return this.fetchWithRetry(url);
    }

    async createMarker(marker) {
        return this.fetchWithRetry(`${BASE_URL}/api/collaboration/markers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(marker)
        });
    }

    // ========== EXPORT API ==========

    async exportData(request) {
        return this.fetchWithRetry(`${BASE_URL}/api/export/data`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request)
        });
    }

    async exportAnalysis(request) {
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

    getExportDownloadUrl(fileId) {
        return `${BASE_URL}/api/export/download/${fileId}`;
    }

    // ========== FIELD DATA API ==========

    async getFieldForms(offlineOnly = false) {
        return this.fetchWithRetry(`${BASE_URL}/api/field/forms?offline_only=${offlineOnly}`);
    }

    async getFieldForm(formId) {
        return this.fetchWithRetry(`${BASE_URL}/api/field/forms/${formId}`);
    }

    async submitFieldEntry(entry) {
        return this.fetchWithRetry(`${BASE_URL}/api/field/entries`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entry)
        });
    }

    async syncFieldEntries(entries, syncMode = 'create') {
        return this.fetchWithRetry(`${BASE_URL}/api/field/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entries, sync_mode: syncMode })
        });
    }

    async getFieldEntries(formId = null, status = null, limit = 100) {
        let url = `${BASE_URL}/api/field/entries?limit=${limit}`;
        if (formId) url += `&form_id=${formId}`;
        if (status) url += `&status=${status}`;
        return this.fetchWithRetry(url);
    }

    async createOfflinePackage(forms = null, layers = null, bbox = null) {
        return this.fetchWithRetry(`${BASE_URL}/api/field/offline-package`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ forms, layers, bbox })
        });
    }

    // ========== METADATA CATALOG API ==========

    async getCatalogDatasets(category = null, geometryType = null, keyword = null) {
        let url = `${BASE_URL}/api/catalog/datasets?`;
        if (category) url += `category=${encodeURIComponent(category)}&`;
        if (geometryType) url += `geometry_type=${geometryType}&`;
        if (keyword) url += `keyword=${encodeURIComponent(keyword)}&`;
        return this.fetchWithRetry(url);
    }

    async getDatasetMetadata(datasetId, refresh = false) {
        return this.fetchWithRetry(`${BASE_URL}/api/catalog/datasets/${datasetId}?refresh=${refresh}`);
    }

    async searchCatalog(query) {
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

    async calculateViewshed(lat, lng, observerHeight = 1.7, maxDistance = 5000, resolution = 36) {
        return this.fetchWithRetry(`${BASE_URL}/api/analysis/viewshed`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat, lng, observer_height: observerHeight, max_distance: maxDistance, resolution })
        });
    }

    async checkVisibility(fromLat, fromLng, toLat, toLng, fromHeight = 1.7, toHeight = 0) {
        return this.fetchWithRetry(
            `${BASE_URL}/api/analysis/visibility-check?from_lat=${fromLat}&from_lng=${fromLng}&to_lat=${toLat}&to_lng=${toLng}&from_height=${fromHeight}&to_height=${toHeight}`
        );
    }

    async validateTopology(dataset, checkSelfIntersections = true, checkOverlaps = true) {
        return this.fetchWithRetry(
            `${BASE_URL}/api/analysis/topology/validate/${dataset}?check_self_intersections=${checkSelfIntersections}&check_overlaps=${checkOverlaps}`
        );
    }

    async calculateRouteAdvanced(fromLat, fromLng, toLat, toLng, mode = 'driving') {
        return this.fetchWithRetry(
            `${BASE_URL}/api/analysis/route?from_lat=${fromLat}&from_lng=${fromLng}&to_lat=${toLat}&to_lng=${toLng}&mode=${mode}`
        );
    }

    async calculateIsochroneAdvanced(lat, lng, timeMinutes = 15, mode = 'driving') {
        return this.fetchWithRetry(
            `${BASE_URL}/api/analysis/isochrone?lat=${lat}&lng=${lng}&time_minutes=${timeMinutes}&mode=${mode}`
        );
    }

    async findNearestFacility(lat, lng, facilityType, limit = 5) {
        return this.fetchWithRetry(
            `${BASE_URL}/api/analysis/nearest-facility?lat=${lat}&lng=${lng}&facility_type=${facilityType}&limit=${limit}`
        );
    }

    // ========== REALTIME DATA API ==========

    async getRealtimeFeeds() {
        return this.fetchWithRetry(`${BASE_URL}/api/realtime/feeds`);
    }

    async getRealtimeFeed(feedId, forceRefresh = false) {
        return this.fetchWithRetry(`${BASE_URL}/api/realtime/feeds/${feedId}?force_refresh=${forceRefresh}`);
    }

    async refreshRealtimeFeed(feedId) {
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

    async getDataSourceHealth(datasetName) {
        return this.fetchWithRetry(`${BASE_URL}/api/data-status/health/${datasetName}`);
    }

    async getDataSources() {
        return this.fetchWithRetry(`${BASE_URL}/api/data-status/sources`);
    }

    async getDataProvenance(datasetName) {
        return this.fetchWithRetry(`${BASE_URL}/api/data-status/provenance/${datasetName}`);
    }

    async validateDataset(datasetName, forceRefresh = false) {
        return this.fetchWithRetry(`${BASE_URL}/api/data-status/validate/${datasetName}?force_refresh=${forceRefresh}`);
    }

    async getRetrievalLog(limit = 50) {
        return this.fetchWithRetry(`${BASE_URL}/api/data-status/retrieval-log?limit=${limit}`);
    }
}

export const apiClient = new APIClient();
export default apiClient;
