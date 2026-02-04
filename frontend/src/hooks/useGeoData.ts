/**
 * useGeoData - Offline-first data fetching hook
 * Uses React Query + Repository Pattern
 */
import { useQuery } from '@tanstack/react-query';
import { geoDataRepository } from '../repositories/GeoDataRepository';
import { GeoData } from '../repositories/types';
import { useOnlineStatus } from './useOfflineData';

export const useGeoData = <T = GeoData>(key: string, datasetKey?: string) => {
    const isOnline = useOnlineStatus();

    const {
        data,
        isLoading,
        error,
        refetch,
        isFetching,
        isPending
    } = useQuery({
        queryKey: ['geodata', key],
        queryFn: async () => {
            // If we have a datasetKey, try to fetch/cache
            if (datasetKey) {
                return await geoDataRepository.getDataset(key, datasetKey) as T;
            }
            // If no datasetKey, maybe we just want what's in cache?
            // Legacy behavior supported passing undefined datasetKey
            const cached = await geoDataRepository.getDataset(key, '', false);
            // This might fail if '' is treated as invalid ID, but let's assume valid usage always has datasetId or key matches
            return cached as T;
        },
        enabled: !!key && !!datasetKey, // Only run if we have keys
        staleTime: 1000 * 60 * 60, // 1 hour memory cache preference
        retry: 1
    });

    return {
        data: data || null,
        isLoading: isPending || (isLoading && isFetching), // simplified loading state
        error,
        refetch,
        isOnline
    };
};

export default useGeoData;
