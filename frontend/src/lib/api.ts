/**
 * Frontend API Client
 * Enhanced with interceptors, retry logic, and request cancellation
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Request/Response Interceptors
type RequestInterceptor = (config: RequestInit) => RequestInit;
type ResponseInterceptor = (response: Response) => Response | Promise<Response>;

const requestInterceptors: RequestInterceptor[] = [];
const responseInterceptors: ResponseInterceptor[] = [];

export const addRequestInterceptor = (fn: RequestInterceptor) => {
    requestInterceptors.push(fn);
};

export const addResponseInterceptor = (fn: ResponseInterceptor) => {
    responseInterceptors.push(fn);
};

// Error Classes
export class APIError extends Error {
    constructor(
        message: string,
        public status: number,
        public detail?: string,
        public retryable: boolean = false
    ) {
        super(message);
        this.name = 'APIError';
    }
}

export class NetworkError extends APIError {
    constructor(message: string, detail?: string) {
        super(message, 0, detail, true);
        this.name = 'NetworkError';
    }
}

export class TimeoutError extends APIError {
    constructor(message: string = 'Request timeout') {
        super(message, 408, undefined, true);
        this.name = 'TimeoutError';
    }
}

// Offline/Backend unavailable flag
let isOfflineMode = false;
let offlineNotificationShown = false;

export const setOfflineMode = (offline: boolean) => {
    isOfflineMode = offline;
    if (!offline) {
        offlineNotificationShown = false;
    }
};

export const getOfflineMode = () => isOfflineMode;

// Mock data for offline fallback
const MOCK_DATA: Record<string, any> = {
    '/api/health': { status: 'offline', message: 'Backend unavailable - using cached data' },
    '/api/data-status/health': {
        summary: { total_sources: 0, accessible: 0, status: 'offline' },
        sources: {},
        checked_at: new Date().toISOString()
    },
    '/api/reports/summary': {
        generated_at: new Date().toISOString(),
        summary: { total_datasets: 0, total_features: 0, total_categories: 0 },
        error: 'Backend offline'
    },
    '/api/reports/dashboard-data': {
        generated_at: new Date().toISOString(),
        summary: { total_datasets: 0 },
        charts: {},
        error: 'Backend offline'
    }
};

// Show offline toast notification (to be called from components)
export const showOfflineNotification = () => {
    if (!offlineNotificationShown) {
        offlineNotificationShown = true;
        console.warn('[API] Offline Mode Active - Using Cached Data');
        // Components can listen to this event
        window.dispatchEvent(new CustomEvent('api:offline', {
            detail: { message: 'Backend Offline - Using Cached Data' }
        }));
    }
};

// Get mock data for endpoint
const getMockData = (endpoint: string): any => {
    // Check exact match first
    if (MOCK_DATA[endpoint]) {
        return MOCK_DATA[endpoint];
    }

    // Check pattern matches
    if (endpoint.startsWith('/api/data/')) {
        return { type: 'FeatureCollection', features: [] };
    }

    if (endpoint.startsWith('/api/geocode/')) {
        return { results: [] };
    }

    // Default empty response
    return { error: 'Backend offline', data: null };
};

// Fetch Options
export interface FetchOptions {
    timeout?: number;
    signal?: AbortSignal;
    retries?: number;
    retryDelay?: number;
}

// Retry with exponential backoff
async function fetchWithRetry(
    url: string,
    options: RequestInit,
    retries: number,
    retryDelay: number
): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const response = await fetch(url, options);

            // Apply response interceptors
            let processedResponse = response;
            for (const interceptor of responseInterceptors) {
                processedResponse = await interceptor(processedResponse);
            }

            return processedResponse;
        } catch (error: unknown) {
            lastError = error instanceof Error ? error : new Error(String(error));

            // Don't retry on abort
            if (error instanceof Error && error.name === 'AbortError') {
                throw new TimeoutError();
            }

            // Wait before retry (exponential backoff)
            if (attempt < retries) {
                const delay = retryDelay * Math.pow(2, attempt);
                console.log(`[API] Retry ${attempt + 1}/${retries} after ${delay}ms`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    throw new NetworkError('Network error after retries', lastError?.message);
}

/**
 * Generic data fetcher with error handling, retries, cancellation, and offline fallback
 */
export async function fetchData<T = unknown>(
    endpoint: string,
    options: FetchOptions = {}
): Promise<T> {
    const {
        timeout = 30000,
        signal,
        retries = 1,
        retryDelay = 1000
    } = options;

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Merge signals if external signal provided
    if (signal) {
        signal.addEventListener('abort', () => controller.abort());
    }

    // Build request config
    let config: RequestInit = {
        signal: controller.signal,
        headers: {
            'Accept': 'application/json',
        },
    };

    // Apply request interceptors
    for (const interceptor of requestInterceptors) {
        config = interceptor(config);
    }

    try {
        const response = await fetchWithRetry(
            `${API_BASE_URL}${endpoint}`,
            config,
            retries,
            retryDelay
        );

        clearTimeout(timeoutId);

        // Backend is online
        if (isOfflineMode) {
            setOfflineMode(false);
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));

            if (response.status === 502 || response.status === 503) {
                throw new APIError(
                    'External Data Source Unavailable',
                    response.status,
                    errorData.detail || 'The City of Cape Town Open Data Portal may be experiencing issues.',
                    true // Retryable
                );
            }

            if (response.status === 429) {
                throw new APIError(
                    'Rate Limited',
                    429,
                    errorData.detail || 'Too many requests. Please try again later.',
                    true // Retryable
                );
            }

            throw new APIError(
                `HTTP ${response.status}: ${response.statusText}`,
                response.status,
                errorData.detail,
                response.status >= 500 // Server errors are retryable
            );
        }

        return await response.json();
    } catch (error: unknown) {
        clearTimeout(timeoutId);

        // If it's a network error or connection refused, use offline fallback
        if (error instanceof NetworkError ||
            (error instanceof Error && (
                error.message.includes('ECONNREFUSED') ||
                error.message.includes('Failed to fetch') ||
                error.message.includes('Network error')
            ))
        ) {
            if (!isOfflineMode) {
                setOfflineMode(true);
                showOfflineNotification();
            }

            // Return mock data instead of throwing
            console.warn(`[API] Using offline fallback for ${endpoint}`);
            return getMockData(endpoint) as T;
        }

        if (error instanceof APIError) {
            throw error;
        }

        if (error instanceof Error && error.name === 'AbortError') {
            throw new TimeoutError();
        }

        // Last resort: offline fallback for any unknown error
        if (!isOfflineMode) {
            setOfflineMode(true);
            showOfflineNotification();
        }
        return getMockData(endpoint) as T;
    }
}

/**
 * API Endpoint Mapping
 */
export const API_ENDPOINTS = {
    services: {
        settlements: 'informal_settlements',
        water: 'water_facilities',
        clinics: 'clinics',
        schools: 'schools',
        parks: 'parks',
        sports: 'sports_grounds',
        pools: 'swimming_pools',
    },
    transport: {
        myciti_stops: 'myciti_stops',
        myciti_routes: 'myciti_routes',
        rail_stations: 'rail_stations',
    },
    environment: {
        flood_zones: 'flood_zones',
        open_spaces: 'open_spaces',
    },
    landuse: {
        zoning: 'zoning',
        suburbs: 'suburbs',
    },
    utilities: {
        electricity: 'electricity_facilities',
        waste: 'waste_collection',
        recycling: 'recycling_facilities',
    },
    safety: {}
} as const;

/**
 * Convenience function to fetch dataset by key
 */
export async function fetchDataset<T = unknown>(datasetKey: string, options?: FetchOptions): Promise<T> {
    return fetchData<T>(`/api/data/${datasetKey}`, options);
}

/**
 * Create an AbortController for request cancellation
 */
export function createCancellableRequest() {
    const controller = new AbortController();
    return {
        signal: controller.signal,
        cancel: () => controller.abort()
    };
}

// =============================================
// APIClient class (consolidated from api-client.ts)
// Uses fetchData() with interceptors, retries, and timeout support.
// =============================================

/**
 * Consolidated API client providing typed methods for every backend endpoint.
 * All requests go through the shared fetchData pipeline (interceptors, retries, timeout).
 */
class APIClient {
    // Helper for POST requests
    private post<T = unknown>(endpoint: string, body: unknown): Promise<T> {
        // fetchData only supports GET by default, so we use the lower-level fetchWithRetry path
        return this.fetchWithBody<T>(endpoint, 'POST', body);
    }

    private patch<T = unknown>(endpoint: string, body: unknown): Promise<T> {
        return this.fetchWithBody<T>(endpoint, 'PATCH', body);
    }

    private delete<T = unknown>(endpoint: string): Promise<T> {
        return this.fetchWithBody<T>(endpoint, 'DELETE');
    }

    private async fetchWithBody<T = unknown>(endpoint: string, method: string, body?: unknown): Promise<T> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        try {
            let config: RequestInit = {
                method,
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                    ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
                },
                ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
            };

            for (const interceptor of requestInterceptors) {
                config = interceptor(config);
            }

            const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new APIError(
                    `HTTP ${response.status}: ${response.statusText}`,
                    response.status,
                    (errorData as Record<string, string>).detail,
                    response.status >= 500
                );
            }
            return await response.json() as T;
        } catch (error: unknown) {
            clearTimeout(timeoutId);
            if (error instanceof APIError) throw error;
            if (error instanceof Error && error.name === 'AbortError') throw new TimeoutError();
            throw new NetworkError('Network error', error instanceof Error ? error.message : String(error));
        }
    }

    // ── Services ──
    getServiceAccess(simplify = 0.0001) {
        return fetchData(`/api/services/access?simplify=${simplify}`);
    }

    // ── Transport ──
    getTransportAccessibility(lat: number, lon: number, simplify = 0.0001) {
        return fetchData(`/api/transport/accessibility?lat=${lat}&lon=${lon}&simplify=${simplify}`);
    }

    // ── Safety ──
    getSafetyPrecincts(simplify = 0.001) {
        return fetchData(`/api/safety/precincts?simplify=${simplify}`);
    }

    // ── Environment ──
    getFloodRiskLegacy(simplify = 0.0001) {
        return fetchData(`/api/environment/flood-risk?simplify=${simplify}`);
    }

    // ── Land Use ──
    getZoning(simplify = 0.001) {
        return fetchData(`/api/land-use/zoning?simplify=${simplify}`);
    }

    // ── Utilities ──
    getWaste(simplify = 0.001) {
        return fetchData(`/api/utilities/waste?simplify=${simplify}`);
    }

    // ── Infrastructure ──
    getInfrastructureLayer(layerId: string, simplify = 0.0001) {
        return fetchData(`/api/infrastructure/${layerId}?simplify=${simplify}`);
    }

    // ── Spatial Tools ──
    pointInPolygon(polygon: unknown, layers: string[]) {
        return this.post('/api/spatial/point-in-polygon', { polygon, layers });
    }

    getBuffer(lat: number, lon: number, distance = 500) {
        return fetchData(`/api/spatial/buffer?lat=${lat}&lon=${lon}&distance=${distance}`);
    }

    getNearbyFeatures(layer: string, lat: number, lon: number, radius = 1000) {
        return fetchData(`/api/spatial/nearby?layer=${layer}&lat=${lat}&lon=${lon}&radius=${radius}`);
    }

    // ── Geocoding & Search ──
    searchPlaces(query: string, limit = 10) {
        return fetchData(`/api/geocode/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    }

    getAutocomplete(query: string, limit = 8) {
        return fetchData(`/api/geocode/autocomplete?q=${encodeURIComponent(query)}&limit=${limit}`);
    }

    reverseGeocode(lat: number, lon: number) {
        return fetchData(`/api/geocode/reverse?lat=${lat}&lon=${lon}`);
    }

    // ── Temporal Analysis ──
    getTemporalDatasets() {
        return fetchData('/api/temporal/datasets');
    }

    filterByTime(dataset: string, startDate?: string, endDate?: string, timeField: string | null = null) {
        let url = `/api/temporal/filter/${dataset}?`;
        if (startDate) url += `start_date=${startDate}&`;
        if (endDate) url += `end_date=${endDate}&`;
        if (timeField) url += `time_field=${timeField}&`;
        return fetchData(url);
    }

    getAnimationFrames(dataset: string, startDate: string, endDate: string, interval = 'day', cumulative = false) {
        return fetchData(
            `/api/temporal/animation/${dataset}?start_date=${startDate}&end_date=${endDate}&interval=${interval}&cumulative=${cumulative}`
        );
    }

    // ── Network Analysis ──
    calculateRoute(originLat: number, originLon: number, destLat: number, destLon: number, mode = 'driving') {
        return fetchData(
            `/api/network/route?origin_lat=${originLat}&origin_lon=${originLon}&dest_lat=${destLat}&dest_lon=${destLon}&mode=${mode}`
        );
    }

    calculateIsochrone(lat: number, lon: number, timeMinutes = 15, mode = 'walking', intervals = 3) {
        return fetchData(
            `/api/network/isochrone?lat=${lat}&lon=${lon}&time_minutes=${timeMinutes}&mode=${mode}&intervals=${intervals}`
        );
    }

    calculateServiceArea(facilityType: string, timeMinutes = 15, mode = 'walking') {
        return fetchData(
            `/api/network/service-area?facility_type=${facilityType}&time_minutes=${timeMinutes}&mode=${mode}`
        );
    }

    findNearest(lat: number, lon: number, facilityType: string, count = 5) {
        return fetchData(
            `/api/network/nearest?lat=${lat}&lon=${lon}&facility_type=${facilityType}&count=${count}`
        );
    }

    getTransitConnectivity(lat: number, lon: number, radiusMeters = 1000) {
        return fetchData(
            `/api/network/connectivity?lat=${lat}&lon=${lon}&radius_meters=${radiusMeters}`
        );
    }

    // ── Filtering ──
    getFilterSchema(dataset: string) {
        return fetchData(`/api/filter/schema/${dataset}`);
    }

    filterDataset(dataset: string, conditions: unknown, logic = 'and', simplify = 0.0001) {
        return this.post('/api/filter/query', { dataset, conditions, logic, simplify });
    }

    getFacets(dataset: string, facetFields: string[], filters: unknown = null) {
        return this.post('/api/filter/facets', { dataset, facet_fields: facetFields, filters });
    }

    textSearch(dataset: string, query: string, fields: string | null = null, limit = 100) {
        let url = `/api/filter/search/${dataset}?q=${encodeURIComponent(query)}&limit=${limit}`;
        if (fields) url += `&fields=${fields}`;
        return fetchData(url);
    }

    // ── Reports & Dashboard ──
    getSummaryReport(datasets: string | null = null) {
        let url = '/api/reports/summary';
        if (datasets) url += `?datasets=${datasets}`;
        return fetchData(url);
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
        return fetchData(`/api/reports/analysis-report?lat=${lat}&lon=${lon}&radius_meters=${radiusMeters}`);
    }

    getDashboardData() {
        return fetchData('/api/reports/dashboard-data');
    }

    // ── Portal datasets ──
    getPortalDatasets(category: string | null = null, search: string | null = null) {
        let url = '/api/portal/datasets?';
        if (category) url += `category=${category}&`;
        if (search) url += `search=${encodeURIComponent(search)}&`;
        return fetchData(url);
    }

    getPortalCategories() {
        return fetchData('/api/portal/categories');
    }

    getDatasetGeoJSON(datasetId: string) {
        return fetchData(`/api/portal/datasets/${datasetId}/geojson`);
    }

    // ── Collaboration ──
    getAnnotations(bbox: string | null = null, type: string | null = null, status: string | null = null, page = 1) {
        let url = `/api/collaboration/annotations?page=${page}`;
        if (bbox) url += `&bbox=${bbox}`;
        if (type) url += `&annotation_type=${type}`;
        if (status) url += `&status=${status}`;
        return fetchData(url);
    }

    createAnnotation(annotation: unknown) {
        return this.post('/api/collaboration/annotations', annotation);
    }

    updateAnnotation(id: string | number, update: unknown) {
        return this.patch(`/api/collaboration/annotations/${id}`, update);
    }

    deleteAnnotation(id: string | number) {
        return this.delete(`/api/collaboration/annotations/${id}`);
    }

    getAnnotationReplies(annotationId: string | number) {
        return fetchData(`/api/collaboration/annotations/${annotationId}/replies`);
    }

    createReply(annotationId: string | number, reply: unknown) {
        return this.post(`/api/collaboration/annotations/${annotationId}/replies`, reply);
    }

    getMarkers(bbox: string | null = null) {
        let url = '/api/collaboration/markers';
        if (bbox) url += `?bbox=${bbox}`;
        return fetchData(url);
    }

    createMarker(marker: unknown) {
        return this.post('/api/collaboration/markers', marker);
    }

    // ── Export ──
    exportData(request: unknown) {
        return this.post('/api/export/data', request);
    }

    exportAnalysis(request: unknown) {
        return this.post('/api/export/analysis', request);
    }

    getExportFormats() {
        return fetchData('/api/export/formats');
    }

    getPendingExports() {
        return fetchData('/api/export/pending');
    }

    getExportDownloadUrl(fileId: string) {
        return `${API_BASE_URL}/api/export/download/${fileId}`;
    }

    // ── Field Data ──
    getFieldForms(offlineOnly = false) {
        return fetchData(`/api/field/forms?offline_only=${offlineOnly}`);
    }

    getFieldForm(formId: string) {
        return fetchData(`/api/field/forms/${formId}`);
    }

    submitFieldEntry(entry: unknown) {
        return this.post('/api/field/entries', entry);
    }

    syncFieldEntries(entries: unknown[], syncMode = 'create') {
        return this.post('/api/field/sync', { entries, sync_mode: syncMode });
    }

    getFieldEntries(formId: string | null = null, status: string | null = null, limit = 100) {
        let url = `/api/field/entries?limit=${limit}`;
        if (formId) url += `&form_id=${formId}`;
        if (status) url += `&status=${status}`;
        return fetchData(url);
    }

    createOfflinePackage(forms: unknown = null, layers: unknown = null, bbox: unknown = null) {
        return this.post('/api/field/offline-package', { forms, layers, bbox });
    }

    // ── Metadata Catalog ──
    getCatalogDatasets(category: string | null = null, geometryType: string | null = null, keyword: string | null = null) {
        let url = '/api/catalog/datasets?';
        if (category) url += `category=${encodeURIComponent(category)}&`;
        if (geometryType) url += `geometry_type=${geometryType}&`;
        if (keyword) url += `keyword=${encodeURIComponent(keyword)}&`;
        return fetchData(url);
    }

    getDatasetMetadata(datasetId: string, refresh = false) {
        return fetchData(`/api/catalog/datasets/${datasetId}?refresh=${refresh}`);
    }

    searchCatalog(query: unknown) {
        return this.post('/api/catalog/search', query);
    }

    getCatalogCategories() {
        return fetchData('/api/catalog/categories');
    }

    getCatalogStats() {
        return fetchData('/api/catalog/stats');
    }

    // ── Advanced Analysis ──
    calculateViewshed(lat: number, lng: number, observerHeight = 1.7, maxDistance = 5000, resolution = 36) {
        return this.post('/api/analysis/viewshed', {
            lat, lng, observer_height: observerHeight, max_distance: maxDistance, resolution
        });
    }

    checkVisibility(fromLat: number, fromLng: number, toLat: number, toLng: number, fromHeight = 1.7, toHeight = 0) {
        return fetchData(
            `/api/analysis/visibility-check?from_lat=${fromLat}&from_lng=${fromLng}&to_lat=${toLat}&to_lng=${toHeight}`
        );
    }

    validateTopology(dataset: string, checkSelfIntersections = true, checkOverlaps = true) {
        return fetchData(
            `/api/analysis/topology/validate/${dataset}?check_self_intersections=${checkSelfIntersections}&check_overlaps=${checkOverlaps}`
        );
    }

    calculateRouteAdvanced(fromLat: number, fromLng: number, toLat: number, toLng: number, mode = 'driving') {
        return fetchData(
            `/api/analysis/route?from_lat=${fromLat}&from_lng=${fromLng}&to_lat=${toLat}&to_lng=${toLng}&mode=${mode}`
        );
    }

    calculateIsochroneAdvanced(lat: number, lng: number, timeMinutes = 15, mode = 'driving') {
        return fetchData(
            `/api/analysis/isochrone?lat=${lat}&lng=${lng}&time_minutes=${timeMinutes}&mode=${mode}`
        );
    }

    findNearestFacility(lat: number, lng: number, facilityType: string, limit = 5) {
        return fetchData(
            `/api/analysis/nearest-facility?lat=${lat}&lng=${lng}&facility_type=${facilityType}&limit=${limit}`
        );
    }

    // ── Realtime Data ──
    getRealtimeFeeds() {
        return fetchData('/api/realtime/feeds');
    }

    getRealtimeFeed(feedId: string, forceRefresh = false) {
        return fetchData(`/api/realtime/feeds/${feedId}?force_refresh=${forceRefresh}`);
    }

    refreshRealtimeFeed(feedId: string) {
        return this.post(`/api/realtime/feeds/${feedId}/refresh`, {});
    }

    getRealtimeStatus() {
        return fetchData('/api/realtime/status');
    }

    getRealtimeTimestamps() {
        return fetchData('/api/realtime/timestamps');
    }

    getRealtimeSources() {
        return fetchData('/api/realtime/sources');
    }

    // ── Data Status ──
    getDataSourcesHealth() {
        return fetchData('/api/data-status/health');
    }

    getDataSourceHealth(datasetName: string) {
        return fetchData(`/api/data-status/health/${datasetName}`);
    }

    getDataSources() {
        return fetchData('/api/data-status/sources');
    }

    getDataProvenance(datasetName: string) {
        return fetchData(`/api/data-status/provenance/${datasetName}`);
    }

    validateDataset(datasetName: string, forceRefresh = false) {
        return fetchData(`/api/data-status/validate/${datasetName}?force_refresh=${forceRefresh}`);
    }

    getRetrievalLog(limit = 50) {
        return fetchData(`/api/data-status/retrieval-log?limit=${limit}`);
    }

    // ==========================================
    // 2026 NEW FEATURES API METHODS
    // ==========================================

    // ── 3D Visualization ──
    extrudeBuildings(request: unknown) {
        return this.post('/api/3d/buildings/extrude', request);
    }

    getElevationProfile(request: unknown) {
        return this.post('/api/3d/elevation/profile', request);
    }

    analyzeShadows(request: unknown) {
        return this.post('/api/3d/shadow/analysis', request);
    }

    calculate3DViewshed(request: unknown) {
        return this.post('/api/3d/viewshed', request);
    }

    getTerrainTile(z: number, x: number, y: number) {
        return fetch(`${API_BASE_URL}/api/3d/terrain/tiles/${z}/${x}/${y}`);
    }

    // ── AI Insights ──
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
        return fetchData('/api/ai/predictions/trending');
    }

    // ── Community Engagement ──
    submitFeedback(feedback: unknown) {
        return this.post('/api/community/feedback/submit', feedback);
    }

    getFeedbackList(proposalId?: string, page = 1) {
        let url = `/api/community/feedback/list?page=${page}`;
        if (proposalId) url += `&proposal_id=${proposalId}`;
        return fetchData(url);
    }

    reportIssue(issue: unknown) {
        return this.post('/api/community/issues/report', issue);
    }

    uploadIssuePhoto(issueId: string, formData: FormData) {
        return fetch(`${API_BASE_URL}/api/community/issues/upload-photo?issue_id=${issueId}`, {
            method: 'POST',
            body: formData
        });
    }

    getIssuesList(category?: string, status?: string, page = 1) {
        let url = `/api/community/issues/list?page=${page}`;
        if (category) url += `&category=${category}`;
        if (status) url += `&status=${status}`;
        return fetchData(url);
    }

    voteOnPoll(pollId: string, optionId: string, voterId: string) {
        return this.post('/api/community/polls/vote', {
            poll_id: pollId,
            option_id: optionId,
            voter_id: voterId
        });
    }

    getPollsList(status = 'active') {
        return fetchData(`/api/community/polls/list?status=${status}`);
    }

    contributeData(contribution: unknown) {
        return this.post('/api/community/contribute/data', contribution);
    }

    getContributionsList(status?: string) {
        let url = '/api/community/contribute/list';
        if (status) url += `?status=${status}`;
        return fetchData(url);
    }

    getCommunityStats() {
        return fetchData('/api/community/stats');
    }

    // ── Notifications & Alerts ──
    subscribeToAlerts(subscription: unknown) {
        return this.post('/api/notifications/subscribe', subscription);
    }

    getSubscriptions(userId: string) {
        return fetchData(`/api/notifications/subscriptions/${userId}`);
    }

    updateSubscription(subscriptionId: string, update: unknown) {
        return this.patch(`/api/notifications/subscriptions/${subscriptionId}`, update);
    }

    unsubscribe(subscriptionId: string) {
        return this.delete(`/api/notifications/subscriptions/${subscriptionId}`);
    }

    registerPushDevice(registration: unknown) {
        return this.post('/api/notifications/push/register', registration);
    }

    createAlert(alert: unknown) {
        return this.post('/api/notifications/alerts/create', alert);
    }

    getActiveAlerts(lat?: number, lng?: number, radius?: number) {
        let url = '/api/notifications/alerts/active';
        if (lat !== undefined && lng !== undefined) {
            url += `?lat=${lat}&lng=${lng}`;
            if (radius) url += `&radius=${radius}`;
        }
        return fetchData(url);
    }

    getUserNotifications(userId: string, unreadOnly = false) {
        return fetchData(`/api/notifications/${userId}?unread_only=${unreadOnly}`);
    }

    markNotificationRead(notificationId: string) {
        return this.post(`/api/notifications/${notificationId}/read`, {});
    }

    addLocationWatch(watch: unknown) {
        return this.post('/api/notifications/watch/add', watch);
    }

    getLocationWatches(userId: string) {
        return fetchData(`/api/notifications/watch/list/${userId}`);
    }

    // ── Demographics ──
    getDensityHeatmap(request: unknown) {
        return this.post('/api/demographics/density/heatmap', request);
    }

    getSocioeconomicIndicators(areaId: string) {
        return fetchData(`/api/demographics/indicators/${areaId}`);
    }

    getAgeDistribution(areaId: string) {
        return fetchData(`/api/demographics/age-distribution/${areaId}`);
    }

    // ── Environmental ──
    getFloodRisk(lat: number, lng: number, scenario = 'current') {
        return fetchData(`/api/environmental/flood/risk?lat=${lat}&lng=${lng}&scenario=${scenario}`);
    }

    getAirQuality(lat?: number, lng?: number) {
        let url = '/api/environmental/air-quality';
        if (lat !== undefined && lng !== undefined) {
            url += `?lat=${lat}&lng=${lng}`;
        }
        return fetchData(url);
    }

    getGreenSpaceAccessibility(lat: number, lng: number) {
        return fetchData(`/api/environmental/green-space/accessibility?lat=${lat}&lng=${lng}`);
    }

    getClimateResilience(areaId: string) {
        return fetchData(`/api/environmental/climate/resilience?area_id=${areaId}`);
    }

    // ── Dashboard Builder ──
    createDashboard(dashboard: unknown) {
        return this.post('/api/dashboard-builder/dashboards', dashboard);
    }

    getUserDashboards(userId: string) {
        return fetchData(`/api/dashboard-builder/dashboards/${userId}`);
    }

    updateDashboard(dashboardId: string, update: unknown) {
        return this.patch(`/api/dashboard-builder/dashboards/${dashboardId}`, update);
    }

    deleteDashboard(dashboardId: string) {
        return this.delete(`/api/dashboard-builder/dashboards/${dashboardId}`);
    }

    getDashboardTemplates() {
        return fetchData('/api/dashboard-builder/templates');
    }

    // ── Comparison ──
    compareNeighborhoods(request: unknown) {
        return this.post('/api/comparison/neighborhoods', request);
    }

    compareTemporally(areaId: string, metric: string, years: number[]) {
        return fetchData(`/api/comparison/temporal?area_id=${areaId}&metric=${metric}&years=${years.join(',')}`);
    }

    benchmarkArea(areaId: string, metrics?: string[]) {
        let url = `/api/comparison/benchmark/${areaId}`;
        if (metrics) url += `?metrics=${metrics.join(',')}`;
        return fetchData(url);
    }

    findSimilarAreas(areaId: string, limit = 5) {
        return fetchData(`/api/comparison/similar/${areaId}?limit=${limit}`);
    }

    // ── Workspace ──
    createWorkspace(workspace: unknown) {
        return this.post('/api/workspace/workspaces', workspace);
    }

    getUserWorkspaces(userId: string) {
        return fetchData(`/api/workspace/workspaces/${userId}`);
    }

    updateWorkspace(workspaceId: string, update: unknown) {
        return this.patch(`/api/workspace/workspaces/${workspaceId}`, update);
    }

    deleteWorkspace(workspaceId: string) {
        return this.delete(`/api/workspace/workspaces/${workspaceId}`);
    }

    createScenario(scenario: unknown) {
        return this.post('/api/workspace/scenarios', scenario);
    }

    getWorkspaceScenarios(workspaceId: string) {
        return fetchData(`/api/workspace/scenarios/${workspaceId}`);
    }

    // ── PDF Reports ──
    generateReport(request: unknown) {
        return this.post('/api/pdf-reports/generate', request);
    }

    getReportStatus(taskId: string) {
        return fetchData(`/api/pdf-reports/status/${taskId}`);
    }

    getReportTemplates() {
        return fetchData('/api/pdf-reports/templates');
    }

    scheduleReport(schedule: unknown) {
        return this.post('/api/pdf-reports/schedule', schedule);
    }

    getScheduledReports(userId: string) {
        return fetchData(`/api/pdf-reports/scheduled/${userId}`);
    }

    // ── Data Quality ──
    getDataQualityOverview() {
        return fetchData('/api/data-quality/overview');
    }

    getDatasetQuality(datasetId: string) {
        return fetchData(`/api/data-quality/dataset/${datasetId}`);
    }

    getValidationErrors(datasetId: string, severity?: string) {
        let url = `/api/data-quality/validation/errors/${datasetId}`;
        if (severity) url += `?severity=${severity}`;
        return fetchData(url);
    }

    // ── Advanced Search ──
    executeSpatialQuery(query: unknown) {
        return this.post('/api/advanced-search/spatial-query', query);
    }

    saveSearch(search: unknown) {
        return this.post('/api/advanced-search/save-search', search);
    }

    getSavedSearches(userId: string, publicOnly = false) {
        return fetchData(`/api/advanced-search/saved-searches/${userId}?public_only=${publicOnly}`);
    }

    crossDatasetSearch(query: string, datasets?: string[]) {
        let url = `/api/advanced-search/cross-dataset-search?q=${encodeURIComponent(query)}`;
        if (datasets) url += `&datasets=${datasets.join(',')}`;
        return fetchData(url);
    }

    getSearchRecommendations(userId: string) {
        return fetchData(`/api/advanced-search/recommendations/${userId}`);
    }

    // ── Performance ──
    getVectorTile(dataset: string, z: number, x: number, y: number) {
        return fetch(`${API_BASE_URL}/api/performance/vector-tiles/${z}/${x}/${y}.mvt?dataset=${dataset}`);
    }

    getClusteredData(dataset: string, zoom: number, bounds?: string) {
        let url = `/api/performance/cluster/${dataset}?zoom=${zoom}`;
        if (bounds) url += `&bounds=${bounds}`;
        return fetchData(url);
    }

    getLODData(dataset: string, zoom: number, simplify = true) {
        return fetchData(`/api/performance/lod/${dataset}?zoom=${zoom}&simplify=${simplify}`);
    }

    preloadCache(request: unknown) {
        return this.post('/api/performance/cache/preload', request);
    }

    getCacheStats() {
        return fetchData('/api/performance/cache/stats');
    }

    // ── Extensions ──
    registerExtension(extension: unknown) {
        return this.post('/api/extensions/register', extension);
    }

    getMarketplaceExtensions(category?: string, search?: string) {
        let url = '/api/extensions/marketplace';
        const params = [];
        if (category) params.push(`category=${category}`);
        if (search) params.push(`search=${encodeURIComponent(search)}`);
        if (params.length) url += `?${params.join('&')}`;
        return fetchData(url);
    }

    createAPIKey(request: unknown) {
        return this.post('/api/extensions/api-keys', request);
    }

    getUserAPIKeys(userId: string) {
        return fetchData(`/api/extensions/api-keys/${userId}`);
    }

    revokeAPIKey(keyId: string) {
        return this.delete(`/api/extensions/api-keys/${keyId}`);
    }

    getAPIUsage(keyId: string) {
        return fetchData(`/api/extensions/usage?api_key_id=${keyId}`);
    }

    registerWebhook(webhook: unknown) {
        return this.post('/api/extensions/webhooks', webhook);
    }

    getUserWebhooks(userId: string) {
        return fetchData(`/api/extensions/webhooks/${userId}`);
    }

    deleteWebhook(webhookId: string) {
        return this.delete(`/api/extensions/webhooks/${webhookId}`);
    }

    getExtensionDocs() {
        return fetchData('/api/extensions/docs/getting-started');
    }

    // ── Comparative Analysis & Dashboard Builder ──
    listDatasets() {
        return fetchData('/api/datasets');
    }

    compareDatasets(request: unknown) {
        return this.post('/api/comparative-analysis/compare', request);
    }

    exportComparison(comparisonId: string, format = 'csv') {
        return fetch(`${API_BASE_URL}/api/comparative-analysis/export/${comparisonId}?format=${format}`);
    }

    listDashboards(userId?: string) {
        const url = userId ? `/api/dashboards?user_id=${userId}` : '/api/dashboards';
        return fetchData(url);
    }

    getDashboard(dashboardId: string) {
        return fetchData(`/api/dashboards/${dashboardId}`);
    }

    saveDashboard(dashboard: unknown) {
        return this.post('/api/dashboards', dashboard);
    }

    updateDashboard(dashboardId: string, update: unknown) {
        return this.patch(`/api/dashboards/${dashboardId}`, update);
    }

    deleteDashboard(dashboardId: string) {
        return this.delete(`/api/dashboards/${dashboardId}`);
    }

    // ── Additional Workspace Methods ──
    getWorkspaces(userId: string) {
        return fetchData(`/api/workspace/workspaces/${userId}`);
    }

    getScenarios(workspaceId: string) {
        return fetchData(`/api/workspace/scenarios/${workspaceId}`);
    }

    // ── Additional 3D Methods ──
    get3DBuildings(bounds: unknown) {
        return this.post('/api/3d/buildings', bounds);
    }

    simulateShadow(request: { geometry: any; height: number; datetime: string }) {
        return this.post('/api/3d/simulate-shadow', request);
    }

    createWorkspaceItem(item: { name: string; item_type: string; data?: any; geom?: any }) {
        return this.post('/api/workspace/items', item);
    }

    listWorkspaceItems(itemType?: string) {
        let url = '/api/workspace/items';
        if (itemType) url += `?item_type=${itemType}`;
        return fetchData(url);
    }

    deleteWorkspaceItem(itemId: number) {
        return this.delete(`/api/workspace/items/${itemId}`);
    }
}

export const apiClient = new APIClient();

export default {
    fetchData,
    fetchDataset,
    apiClient,
    API_ENDPOINTS,
    addRequestInterceptor,
    addResponseInterceptor,
    createCancellableRequest,
};
