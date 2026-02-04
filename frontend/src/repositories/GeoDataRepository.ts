
import { fetchDataset } from '../lib/api';
import { CacheRepository } from './CacheRepository';
import { GeoData } from './types';

export class GeoDataRepository {
    private cache: CacheRepository<GeoData>;

    constructor(ttl_ms?: number) {
        this.cache = new CacheRepository<GeoData>(ttl_ms);
    }

    /**
     * Get data from cache first, then API
     * @param key Cache key
     * @param datasetId Backend dataset ID
     * @param forceRefresh Ignore cache
     */
    async getDataset(key: string, datasetId: string, forceRefresh: boolean = false): Promise<GeoData> {
        // 1. Try cache
        if (!forceRefresh) {
            const cached = await this.cache.findById(key);
            if (cached) {
                console.log(`[GeoDataRepository] Cache hit for ${key}`);
                return cached;
            }
        }

        // 2. Fetch from API
        console.log(`[GeoDataRepository] Fetching ${key} from API (${datasetId})`);
        try {
            const data = await fetchDataset(datasetId);
            
            // 3. Save to cache
            await this.cache.save(data, key);
            
            return data;
        } catch (error) {
            // If offline/error, try stale cache as fallback
            if (forceRefresh) {
                const stale = await this.cache.findById(key);
                if (stale) {
                    console.warn(`[GeoDataRepository] Using stale cache for ${key} after API failure`);
                    return stale;
                }
            }
            throw error;
        }
    }

    /**
     * Clear all cached data
     */
    async clearCache(): Promise<void> {
        await this.cache.clear();
    }
}

export const geoDataRepository = new GeoDataRepository();
