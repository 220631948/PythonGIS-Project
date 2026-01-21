/**
 * Frontend API Client
 * Provides typed interface to backend proxy endpoints
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface FetchOptions {
    timeout?: number;
    signal?: AbortSignal;
}

export class APIError extends Error {
    constructor(
        message: string,
        public status: number,
        public detail?: string
    ) {
        super(message);
        this.name = 'APIError';
    }
}

/**
 * Generic data fetcher with error handling
 */
export async function fetchData<T = any>(
    endpoint: string,
    options: FetchOptions = {}
): Promise<T> {
    const { timeout = 30000, signal } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            signal: signal || controller.signal,
            headers: {
                'Accept': 'application/json',
            },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));

            if (response.status === 502) {
                throw new APIError(
                    'External Data Source Unavailable',
                    502,
                    errorData.detail || 'The City of Cape Town Open Data Portal may be experiencing issues.'
                );
            }

            throw new APIError(
                `HTTP ${response.status}: ${response.statusText}`,
                response.status,
                errorData.detail
            );
        }

        return await response.json();
    } catch (error: any) {
        clearTimeout(timeoutId);

        if (error.name === 'AbortError') {
            throw new APIError('Request timeout', 408);
        }

        if (error instanceof APIError) {
            throw error;
        }

        throw new APIError('Network error', 0, error.message);
    }
}

/**
 * API Endpoint Mapping
 * Maps frontend modules to backend dataset keys
 */
export const API_ENDPOINTS = {
    // Services Module
    services: {
        settlements: '/api/data/informal_settlements',
        water: '/api/data/water_facilities',
        clinics: '/api/data/clinics',
        schools: '/api/data/schools',
        parks: '/api/data/parks',
        sports: '/api/data/sports_grounds',
        pools: '/api/data/swimming_pools',
    },

    // Transport Module
    transport: {
        myciti_stops: '/api/data/myciti_stops',
        myciti_routes: '/api/data/myciti_routes',
        rail_stations: '/api/data/rail_stations',
    },

    // Environment Module
    environment: {
        flood_zones: '/api/data/flood_zones',
        open_spaces: '/api/data/open_spaces',
    },

    // Land Use Module
    landuse: {
        zoning: '/api/data/zoning',
        suburbs: '/api/data/suburbs',
    },

    // Utilities Module
    utilities: {
        electricity: '/api/data/electricity_facilities',
        waste: '/api/data/waste_collection',
        recycling: '/api/data/recycling_facilities',
    },

    // Safety Module (placeholder - aggregated data)
    safety: {
        // To be implemented with aggregated precinct data
    }
} as const;

/**
 * Convenience function to fetch dataset by key
 */
export async function fetchDataset(datasetKey: string, options?: FetchOptions) {
    return fetchData(`/api/data/${datasetKey}`, options);
}

export default {
    fetchData,
    fetchDataset,
    API_ENDPOINTS,
};
