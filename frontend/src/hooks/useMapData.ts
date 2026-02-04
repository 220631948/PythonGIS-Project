import { useGeoData } from './useGeoData';

// Wrapper to match the requested spec while using the existing robust useGeoData implementation
export interface UseMapDataOptions {
    enabled?: boolean;
    refetchInterval?: number;
    // Other options ignored as they are handled by useGeoData structure or not applicable
}

export const useMapData = <P = Record<string, unknown>>(
    datasetId: string,
    _options: UseMapDataOptions = {}
) => {
    // Map useMapData params to useGeoData params
    // useGeoData signature: (key: string, datasetKey?: string, options = { ttl: 86400000 })
    // We use datasetId as the key for cache as well

    const { data, isLoading, error, refetch } = useGeoData<P>(
        datasetId, // key
        datasetId, // datasetKey
        { ttl: 3600000 } // Default 1 hour TTL
    );

    return {
        data,
        isLoading,
        error,
        refetch
    };
};

export default useMapData;
