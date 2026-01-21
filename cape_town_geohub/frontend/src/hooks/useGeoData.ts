/**
 * useGeoData - Offline-first data fetching hook
 * Now integrated with backend proxy to fetch CCT data
 */

import { useState, useEffect, useCallback } from 'react';
import localforage from 'localforage';
import { useOnlineStatus } from './useOfflineData';
import { fetchDataset, APIError } from '../lib/api';

// Configure localforage
localforage.config({
    name: 'CapeTownGeoHub',
    storeName: 'geodata_cache'
});

interface GeoDataState<T> {
    data: T | null;
    isLoading: boolean;
    error: Error | null;
    source: 'api' | 'cache' | null;
    lastUpdated?: number;
}

export const useGeoData = <T = any>(key: string, datasetKey?: string, options = { ttl: 86400000 }) => {
    const [state, setState] = useState<GeoDataState<T>>({
        data: null,
        isLoading: false,
        error: null,
        source: null
    });

    const isOnline = useOnlineStatus();

    const fetchData = useCallback(async (forceRefresh = false) => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            // 1. Try Cache First if offline or not forced
            const cached = await localforage.getItem<{ data: T; timestamp: number }>(key);
            const isCacheValid = cached && (Date.now() - cached.timestamp < options.ttl);

            if (cached && (isCacheValid || !isOnline)) {
                console.log(`[useGeoData] Loaded ${key} from cache`);
                setState({
                    data: cached.data,
                    isLoading: false,
                    error: null,
                    source: 'cache',
                    lastUpdated: cached.timestamp
                });

                // If online and cache is valid, stop here
                if (isCacheValid && !forceRefresh) return;
            }

            // 2. Fetch from Backend API if online and datasetKey provided
            if (isOnline && datasetKey) {
                console.log(`[useGeoData] Fetching ${key} from API (dataset: ${datasetKey})`);

                try {
                    const data = await fetchDataset(datasetKey);

                    // 3. Update Cache
                    await localforage.setItem(key, {
                        data,
                        timestamp: Date.now()
                    });

                    setState({
                        data,
                        isLoading: false,
                        error: null,
                        source: 'api',
                        lastUpdated: Date.now()
                    });
                } catch (apiError: any) {
                    console.error(`[useGeoData] API error for ${key}:`, apiError);

                    // If API fails but we have cache, use stale cache
                    if (cached) {
                        console.warn(`[useGeoData] Using stale cache for ${key} due to API error`);
                        setState({
                            data: cached.data,
                            isLoading: false,
                            error: apiError instanceof APIError ? apiError : new Error(apiError.message),
                            source: 'cache',
                            lastUpdated: cached.timestamp
                        });
                    } else {
                        throw apiError;
                    }
                }
            } else if (!cached && !isOnline) {
                // No cache and offline
                throw new Error('No data available (Offline)');
            } else if (!datasetKey) {
                // No dataset key provided (legacy fallback)
                console.warn(`[useGeoData] No datasetKey provided for ${key}, skipping fetch`);
                setState(prev => ({ ...prev, isLoading: false }));
            }

        } catch (err: any) {
            console.error(`[useGeoData] Error loading ${key}:`, err);
            setState(prev => ({ ...prev, isLoading: false, error: err }));
        }
    }, [key, datasetKey, isOnline, options.ttl]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { ...state, refetch: () => fetchData(true) };
};

export default useGeoData;
