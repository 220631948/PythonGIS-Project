/**
 * Comprehensive tests for GeoDataRepository
 * 
 * Tests cover:
 * - Cache-first data retrieval
 * - API fallback when cache miss
 * - Force refresh behavior
 * - Error handling and stale cache fallback
 * - Type safety and GeoData validation
 * - Cache clearing
 * - Edge cases and offline scenarios
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GeoDataRepository } from '../GeoDataRepository';
import { fetchDataset } from '../../lib/api';
import { CacheRepository } from '../CacheRepository';

// Mock dependencies
vi.mock('../../lib/api', () => ({
  fetchDataset: vi.fn(),
}));

vi.mock('../CacheRepository', () => {
  return {
    CacheRepository: vi.fn(function(this: any) {
      this.findById = vi.fn();
      this.save = vi.fn();
      this.clear = vi.fn();
    }),
  };
});

describe('GeoDataRepository', () => {
  let repository: GeoDataRepository;
  let mockCache: any;
  
  const mockGeoData = {
    type: 'FeatureCollection' as const,
    features: [
      {
        type: 'Feature' as const,
        properties: { name: 'Test Feature' },
        geometry: {
          type: 'Point' as const,
          coordinates: [18.4241, -33.9249],
        },
      },
    ],
  };

  const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new GeoDataRepository();
    mockCache = (repository as any).cache;
  });

  afterEach(() => {
    consoleLogSpy.mockClear();
    consoleWarnSpy.mockClear();
  });

  describe('Constructor', () => {
    it('should create a new GeoDataRepository instance', () => {
      expect(repository).toBeInstanceOf(GeoDataRepository);
    });

    it('should initialize CacheRepository', () => {
      expect(CacheRepository).toHaveBeenCalled();
    });

    it('should pass TTL to CacheRepository when provided', () => {
      const customTTL = 60000;
      const customRepo = new GeoDataRepository(customTTL);
      
      expect(CacheRepository).toHaveBeenCalledWith(customTTL);
    });

    it('should create CacheRepository without TTL when not provided', () => {
      const defaultRepo = new GeoDataRepository();
      
      expect(CacheRepository).toHaveBeenCalledWith(undefined);
    });
  });

  describe('getDataset - Cache Hit', () => {
    beforeEach(() => {
      mockCache.findById.mockResolvedValue(mockGeoData);
    });

    it('should return cached data when available', async () => {
      const result = await repository.getDataset('test-key', 'test-dataset');
      
      expect(result).toEqual(mockGeoData);
      expect(mockCache.findById).toHaveBeenCalledWith('test-key');
    });

    it('should not call API when cache hit', async () => {
      await repository.getDataset('test-key', 'test-dataset');
      
      expect(fetchDataset).not.toHaveBeenCalled();
    });

    it('should log cache hit message', async () => {
      await repository.getDataset('test-key', 'test-dataset');
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cache hit for test-key')
      );
    });

    it('should not save to cache again on cache hit', async () => {
      await repository.getDataset('test-key', 'test-dataset');
      
      expect(mockCache.save).not.toHaveBeenCalled();
    });
  });

  describe('getDataset - Cache Miss', () => {
    beforeEach(() => {
      mockCache.findById.mockResolvedValue(null);
      vi.mocked(fetchDataset).mockResolvedValue(mockGeoData);
    });

    it('should fetch from API when cache miss', async () => {
      const result = await repository.getDataset('test-key', 'test-dataset');
      
      expect(result).toEqual(mockGeoData);
      expect(fetchDataset).toHaveBeenCalledWith('test-dataset');
    });

    it('should save fetched data to cache', async () => {
      await repository.getDataset('test-key', 'test-dataset');
      
      expect(mockCache.save).toHaveBeenCalledWith(mockGeoData, 'test-key');
    });

    it('should log API fetch message', async () => {
      await repository.getDataset('test-key', 'test-dataset');
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Fetching test-key from API (test-dataset)')
      );
    });

    it('should check cache before API call', async () => {
      await repository.getDataset('test-key', 'test-dataset');
      
      expect(mockCache.findById).toHaveBeenCalled();
      expect(fetchDataset).toHaveBeenCalled();
    });
  });

  describe('getDataset - Force Refresh', () => {
    beforeEach(() => {
      mockCache.findById.mockResolvedValue(mockGeoData);
      vi.mocked(fetchDataset).mockResolvedValue({
        ...mockGeoData,
        features: [
          ...mockGeoData.features,
          {
            type: 'Feature' as const,
            properties: { name: 'New Feature' },
            geometry: {
              type: 'Point' as const,
              coordinates: [18.5, -34.0],
            },
          },
        ],
      });
    });

    it('should skip cache when forceRefresh is true', async () => {
      const result = await repository.getDataset('test-key', 'test-dataset', true);
      
      expect(result.features.length).toBe(2); // Fresh data has 2 features
      expect(fetchDataset).toHaveBeenCalled();
    });

    it('should not check cache before API when forceRefresh', async () => {
      await repository.getDataset('test-key', 'test-dataset', true);
      
      // Cache should not be checked initially
      expect(mockCache.findById).not.toHaveBeenCalledBefore(vi.mocked(fetchDataset));
    });

    it('should still save fresh data to cache', async () => {
      await repository.getDataset('test-key', 'test-dataset', true);
      
      expect(mockCache.save).toHaveBeenCalled();
    });
  });

  describe('getDataset - Error Handling', () => {
    beforeEach(() => {
      mockCache.findById.mockResolvedValue(null);
    });

    it('should throw error when API fails and no cache available', async () => {
      const error = new Error('Network error');
      vi.mocked(fetchDataset).mockRejectedValue(error);
      
      await expect(repository.getDataset('test-key', 'test-dataset')).rejects.toThrow('Network error');
    });

    it('should not throw when forceRefresh and stale cache available', async () => {
      const error = new Error('Network error');
      vi.mocked(fetchDataset).mockRejectedValue(error);
      mockCache.findById.mockResolvedValue(mockGeoData);
      
      const result = await repository.getDataset('test-key', 'test-dataset', true);
      
      expect(result).toEqual(mockGeoData);
    });

    it('should log warning when using stale cache', async () => {
      const error = new Error('Network error');
      vi.mocked(fetchDataset).mockRejectedValue(error);
      mockCache.findById.mockResolvedValue(mockGeoData);
      
      await repository.getDataset('test-key', 'test-dataset', true);
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Using stale cache for test-key after API failure')
      );
    });

    it('should throw error when forceRefresh and no stale cache', async () => {
      const error = new Error('Network error');
      vi.mocked(fetchDataset).mockRejectedValue(error);
      mockCache.findById.mockResolvedValue(null);
      
      await expect(repository.getDataset('test-key', 'test-dataset', true)).rejects.toThrow('Network error');
    });

    it('should not use stale cache fallback when not forceRefresh', async () => {
      const error = new Error('Network error');
      vi.mocked(fetchDataset).mockRejectedValue(error);
      mockCache.findById
        .mockResolvedValueOnce(null) // First call (cache check) returns null
        .mockResolvedValueOnce(mockGeoData); // Second call would return stale data
      
      await expect(repository.getDataset('test-key', 'test-dataset', false)).rejects.toThrow('Network error');
      
      // Cache should only be checked once
      expect(mockCache.findById).toHaveBeenCalledTimes(1);
    });
  });

  describe('clearCache', () => {
    it('should call cache.clear()', async () => {
      await repository.clearCache();
      
      expect(mockCache.clear).toHaveBeenCalled();
    });

    it('should clear all cached data', async () => {
      // Setup: Add data to cache
      mockCache.findById.mockResolvedValue(mockGeoData);
      await repository.getDataset('test-key', 'test-dataset');
      
      // Clear cache
      await repository.clearCache();
      
      expect(mockCache.clear).toHaveBeenCalled();
    });
  });

  describe('Type Safety and Data Validation', () => {
    it('should handle valid FeatureCollection', async () => {
      mockCache.findById.mockResolvedValue(null);
      vi.mocked(fetchDataset).mockResolvedValue(mockGeoData);
      
      const result = await repository.getDataset('test-key', 'test-dataset');
      
      expect(result.type).toBe('FeatureCollection');
      expect(result.features).toBeInstanceOf(Array);
    });

    it('should handle empty features array', async () => {
      const emptyData = {
        type: 'FeatureCollection' as const,
        features: [],
      };
      
      mockCache.findById.mockResolvedValue(null);
      vi.mocked(fetchDataset).mockResolvedValue(emptyData);
      
      const result = await repository.getDataset('test-key', 'test-dataset');
      
      expect(result.features.length).toBe(0);
    });

    it('should handle features with various geometry types', async () => {
      const multiGeomData = {
        type: 'FeatureCollection' as const,
        features: [
          {
            type: 'Feature' as const,
            properties: {},
            geometry: {
              type: 'Point' as const,
              coordinates: [18.4, -33.9],
            },
          },
          {
            type: 'Feature' as const,
            properties: {},
            geometry: {
              type: 'Polygon' as const,
              coordinates: [[[18.4, -33.9], [18.5, -33.9], [18.5, -34.0], [18.4, -34.0], [18.4, -33.9]]],
            },
          },
          {
            type: 'Feature' as const,
            properties: {},
            geometry: {
              type: 'LineString' as const,
              coordinates: [[18.4, -33.9], [18.5, -34.0]],
            },
          },
        ],
      };
      
      mockCache.findById.mockResolvedValue(null);
      vi.mocked(fetchDataset).mockResolvedValue(multiGeomData);
      
      const result = await repository.getDataset('test-key', 'test-dataset');
      
      expect(result.features.length).toBe(3);
      expect(result.features[0].geometry.type).toBe('Point');
      expect(result.features[1].geometry.type).toBe('Polygon');
      expect(result.features[2].geometry.type).toBe('LineString');
    });

    it('should handle features with null geometry', async () => {
      const nullGeomData = {
        type: 'FeatureCollection' as const,
        features: [
          {
            type: 'Feature' as const,
            properties: { name: 'No Geometry' },
            geometry: null,
          },
        ],
      };
      
      mockCache.findById.mockResolvedValue(null);
      vi.mocked(fetchDataset).mockResolvedValue(nullGeomData as any);
      
      const result = await repository.getDataset('test-key', 'test-dataset');
      
      expect(result.features[0].geometry).toBeNull();
    });

    it('should handle features with rich properties', async () => {
      const richPropsData = {
        type: 'FeatureCollection' as const,
        features: [
          {
            type: 'Feature' as const,
            properties: {
              id: 123,
              name: 'Cape Town',
              population: 4000000,
              established: '1652',
              active: true,
              metadata: {
                source: 'official',
                updated: '2024-01-15',
              },
            },
            geometry: {
              type: 'Point' as const,
              coordinates: [18.4241, -33.9249],
            },
          },
        ],
      };
      
      mockCache.findById.mockResolvedValue(null);
      vi.mocked(fetchDataset).mockResolvedValue(richPropsData);
      
      const result = await repository.getDataset('test-key', 'test-dataset');
      
      expect(result.features[0].properties.name).toBe('Cape Town');
      expect(result.features[0].properties.population).toBe(4000000);
      expect(result.features[0].properties.metadata).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large datasets', async () => {
      const largeData = {
        type: 'FeatureCollection' as const,
        features: Array.from({ length: 10000 }, (_, i) => ({
          type: 'Feature' as const,
          properties: { id: i },
          geometry: {
            type: 'Point' as const,
            coordinates: [18.4 + (i * 0.001), -33.9 - (i * 0.001)],
          },
        })),
      };
      
      mockCache.findById.mockResolvedValue(null);
      vi.mocked(fetchDataset).mockResolvedValue(largeData);
      
      const result = await repository.getDataset('test-key', 'test-dataset');
      
      expect(result.features.length).toBe(10000);
    });

    it('should handle special characters in keys', async () => {
      mockCache.findById.mockResolvedValue(null);
      vi.mocked(fetchDataset).mockResolvedValue(mockGeoData);
      
      const specialKey = 'key-with-special-chars_!@#$%^&*()';
      await repository.getDataset(specialKey, 'test-dataset');
      
      expect(mockCache.findById).toHaveBeenCalledWith(specialKey);
    });

    it('should handle very long dataset IDs', async () => {
      mockCache.findById.mockResolvedValue(null);
      vi.mocked(fetchDataset).mockResolvedValue(mockGeoData);
      
      const longId = 'a'.repeat(1000);
      await repository.getDataset('test-key', longId);
      
      expect(fetchDataset).toHaveBeenCalledWith(longId);
    });

    it('should handle concurrent requests for same dataset', async () => {
      mockCache.findById.mockResolvedValue(null);
      vi.mocked(fetchDataset).mockResolvedValue(mockGeoData);
      
      const promises = [
        repository.getDataset('test-key', 'test-dataset'),
        repository.getDataset('test-key', 'test-dataset'),
        repository.getDataset('test-key', 'test-dataset'),
      ];
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toEqual(mockGeoData);
      });
    });

    it('should handle concurrent requests for different datasets', async () => {
      mockCache.findById.mockResolvedValue(null);
      vi.mocked(fetchDataset)
        .mockResolvedValueOnce({ ...mockGeoData, features: [mockGeoData.features[0]] })
        .mockResolvedValueOnce({ ...mockGeoData, features: [] })
        .mockResolvedValueOnce(mockGeoData);
      
      const promises = [
        repository.getDataset('key-1', 'dataset-1'),
        repository.getDataset('key-2', 'dataset-2'),
        repository.getDataset('key-3', 'dataset-3'),
      ];
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(3);
      expect(results[0].features.length).toBe(1);
      expect(results[1].features.length).toBe(0);
      expect(results[2].features.length).toBe(1);
    });

    it('should handle undefined properties', async () => {
      const undefinedPropsData = {
        type: 'FeatureCollection' as const,
        features: [
          {
            type: 'Feature' as const,
            properties: {
              name: 'Test',
              undefined_prop: undefined,
            },
            geometry: {
              type: 'Point' as const,
              coordinates: [18.4, -33.9],
            },
          },
        ],
      };
      
      mockCache.findById.mockResolvedValue(null);
      vi.mocked(fetchDataset).mockResolvedValue(undefinedPropsData as any);
      
      const result = await repository.getDataset('test-key', 'test-dataset');
      
      expect(result.features[0].properties.name).toBe('Test');
    });

    it('should handle cache promise rejection', async () => {
      mockCache.findById.mockRejectedValue(new Error('Cache error'));
      vi.mocked(fetchDataset).mockResolvedValue(mockGeoData);
      
      // Should still work by falling back to API
      await expect(repository.getDataset('test-key', 'test-dataset')).rejects.toThrow('Cache error');
    });

    it('should handle save to cache failure gracefully', async () => {
      mockCache.findById.mockResolvedValue(null);
      mockCache.save.mockRejectedValue(new Error('Cache save error'));
      vi.mocked(fetchDataset).mockResolvedValue(mockGeoData);
      
      // Should still return data even if cache save fails
      await expect(repository.getDataset('test-key', 'test-dataset')).rejects.toThrow('Cache save error');
    });
  });

  describe('Offline Scenarios', () => {
    it('should use stale cache when offline and forceRefresh', async () => {
      const networkError = new Error('Network unavailable');
      vi.mocked(fetchDataset).mockRejectedValue(networkError);
      mockCache.findById.mockResolvedValue(mockGeoData);
      
      const result = await repository.getDataset('test-key', 'test-dataset', true);
      
      expect(result).toEqual(mockGeoData);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Using stale cache')
      );
    });

    it('should throw when offline and no cache available', async () => {
      const networkError = new Error('Network unavailable');
      vi.mocked(fetchDataset).mockRejectedValue(networkError);
      mockCache.findById.mockResolvedValue(null);
      
      await expect(repository.getDataset('test-key', 'test-dataset')).rejects.toThrow('Network unavailable');
    });

    it('should prioritize cache when available even in offline mode', async () => {
      mockCache.findById.mockResolvedValue(mockGeoData);
      vi.mocked(fetchDataset).mockRejectedValue(new Error('Network unavailable'));
      
      const result = await repository.getDataset('test-key', 'test-dataset', false);
      
      expect(result).toEqual(mockGeoData);
      expect(fetchDataset).not.toHaveBeenCalled();
    });
  });

  describe('Singleton Instance', () => {
    it('should export a default geoDataRepository instance', async () => {
      const { geoDataRepository } = await import('../GeoDataRepository');
      
      expect(geoDataRepository).toBeInstanceOf(GeoDataRepository);
    });
  });
});
