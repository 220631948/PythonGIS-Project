
import localforage from 'localforage';
import { CachedItem, Repository } from './types';

// Configure localforage instance
const cacheStore = localforage.createInstance({
    name: 'CapeTownGeoHub',
    storeName: 'geodata_cache'
});

export class CacheRepository<T> implements Repository<T, string> {
    private ttl: number;

    constructor(ttl_ms: number = 24 * 60 * 60 * 1000) { // Default 24h
        this.ttl = ttl_ms;
    }

    async findById(key: string): Promise<T | null> {
        try {
            const item = await cacheStore.getItem<CachedItem<T>>(key);
            
            if (!item) return null;

            // Check expiration
            if (Date.now() > item.expiresAt) {
                await this.delete(key);
                return null;
            }

            return item.data;
        } catch (error) {
            console.error('[CacheRepository] Error reading cache:', error);
            return null;
        }
    }

    async findAll(): Promise<T[]> {
        const items: T[] = [];
        await cacheStore.iterate<CachedItem<T>, void>((value, _key) => {
            if (Date.now() <= value.expiresAt) {
                items.push(value.data);
            }
        });
        return items;
    }

    async save(item: T, id?: string): Promise<void> {
        if (!id) throw new Error('ID is required for saving to cache');
        
        const cachedItem: CachedItem<T> = {
            data: item,
            timestamp: Date.now(),
            expiresAt: Date.now() + this.ttl
        };

        try {
            await cacheStore.setItem(id, cachedItem);
        } catch (error) {
            console.error('[CacheRepository] Error saving to cache:', error);
        }
    }

    async delete(id: string): Promise<void> {
        try {
            await cacheStore.removeItem(id);
        } catch (error) {
            console.error('[CacheRepository] Error deleting from cache:', error);
        }
    }

    async clear(): Promise<void> {
        await cacheStore.clear();
    }
    
    async keys(): Promise<string[]> {
        return await cacheStore.keys();
    }
}
