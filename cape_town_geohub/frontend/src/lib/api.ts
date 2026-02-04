/**
 * Frontend API Client
 * Enhanced with interceptors, retry logic, and request cancellation
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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
        } catch (error: any) {
            lastError = error;

            // Don't retry on abort
            if (error.name === 'AbortError') {
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
 * Generic data fetcher with error handling, retries, and cancellation
 */
export async function fetchData<T = any>(
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
    } catch (error: any) {
        clearTimeout(timeoutId);

        if (error instanceof APIError) {
            throw error;
        }

        if (error.name === 'AbortError') {
            throw new TimeoutError();
        }

        throw new NetworkError('Network error', error.message);
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
export async function fetchDataset(datasetKey: string, options?: FetchOptions) {
    return fetchData(`/api/data/${datasetKey}`, options);
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

export default {
    fetchData,
    fetchDataset,
    API_ENDPOINTS,
    addRequestInterceptor,
    addResponseInterceptor,
    createCancellableRequest,
};
