import { API_BASE_URL } from './config';
import {
    APIError,
    NetworkError,
    TimeoutError,
    FetchOptions,
    RequestInterceptor,
    ResponseInterceptor
} from './types';

const requestInterceptors: RequestInterceptor[] = [];
const responseInterceptors: ResponseInterceptor[] = [];

export const addRequestInterceptor = (fn: RequestInterceptor) => {
    requestInterceptors.push(fn);
};

export const addResponseInterceptor = (fn: ResponseInterceptor) => {
    responseInterceptors.push(fn);
};

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
 * Core request function handling all HTTP methods, interceptors, retries, and errors.
 */
export async function request<T = unknown>(
    endpoint: string,
    method: string = 'GET',
    body?: unknown,
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
        method,
        signal: controller.signal,
        headers: {
            'Accept': 'application/json',
            ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    };

    // Apply request interceptors
    for (const interceptor of requestInterceptors) {
        config = interceptor(config);
    }

    try {
        const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

        const response = await fetchWithRetry(
            url,
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
                // Cast to any to access detail safely or fallback
                (errorData as any).detail || errorData.message || (errorData as any).error,
                response.status >= 500 // Server errors are retryable
            );
        }

        // Handle 204 No Content
        if (response.status === 204) {
            return {} as T;
        }

        return await response.json();
    } catch (error: unknown) {
        clearTimeout(timeoutId);

        if (error instanceof APIError) {
            throw error;
        }

        if (error instanceof Error && error.name === 'AbortError') {
            throw new TimeoutError();
        }

        throw new NetworkError('Network error', error instanceof Error ? error.message : String(error));
    }
}

/**
 * Backward compatibility wrapper for fetchData.
 */
export async function fetchData<T = unknown>(
    endpoint: string,
    options: FetchOptions = {}
): Promise<T> {
    return request<T>(endpoint, 'GET', undefined, options);
}

/**
 * Convenience function to fetch dataset by key
 */
export async function fetchDataset<T = unknown>(datasetKey: string, options?: FetchOptions): Promise<T> {
    return fetchData<T>(`/api/data/${datasetKey}`, options);
}

/**
 * Base class for API services.
 */
export class BaseAPI {
    protected async get<T = unknown>(endpoint: string, options?: FetchOptions): Promise<T> {
        return request<T>(endpoint, 'GET', undefined, options);
    }

    protected async post<T = unknown>(endpoint: string, body: unknown, options?: FetchOptions): Promise<T> {
        return request<T>(endpoint, 'POST', body, options);
    }

    protected async patch<T = unknown>(endpoint: string, body: unknown, options?: FetchOptions): Promise<T> {
        return request<T>(endpoint, 'PATCH', body, options);
    }

    protected async delete<T = unknown>(endpoint: string, options?: FetchOptions): Promise<T> {
        return request<T>(endpoint, 'DELETE', undefined, options);
    }
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
