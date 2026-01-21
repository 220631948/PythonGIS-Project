/**
 * useGeoData - Offline-first data fetching hook
 * Uses localforage to cache GeoJSON data
 */

import { useState, useEffect, useCallback } from 'react';
import localforage from 'localforage';
import { useOnlineStatus } from './useOfflineData';

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

export const useGeoData = <T = any>(key: string, url?: string, options = { ttl: 86400000 }) => {
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

                // If online and cache potentially stale/we want fresh, fetch safely in background?
                // For now, if cache is valid, stop.
                if (isCacheValid && !forceRefresh) return;
            }

            // 2. Fetch from Network if online
            if (isOnline && url) {
                console.log(`[useGeoData] Fetching ${key} from API`);
                const response = await fetch(url);
                if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);

                const data = await response.json();

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
            } else if (!cached) {
                // No cache and offline/no URL
                throw new Error('No data available (Offline)');
            }

        } catch (err: any) {
            console.error(`[useGeoData] Error loading ${key}:`, err);
            // Fallback to stale cache if available and fetch failed
            const cached = await localforage.getItem<{ data: T; timestamp: number }>(key);
            if (cached) {
                setState({
                    data: cached.data,
                    isLoading: false,
                    error: err, // Keep error to show warning? Or clear it?
                    source: 'cache', // Stale cache
                    lastUpdated: cached.timestamp
                });
                // Maybe show toast warning here?
            } else {
                setState(prev => ({ ...prev, isLoading: false, error: err }));
            }
        }
    }, [key, url, isOnline, options.ttl]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { ...state, refetch: () => fetchData(true) };
};

export default useGeoData;
