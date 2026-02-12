/**
 * useViewportData — Hook for viewport-based progressive loading
 *
 * Leverages Sprint 3 backend optimizations (sub-100ms bounding box queries)
 * to load only visible features within the current map extent.
 *
 * Performance Target: < 100ms perceived load time
 *
 * Features:
 * - Bounding box calculation from Leaflet map bounds
 * - Progressive loading with cache
 * - Debounced viewport changes to prevent excessive requests
 * - Automatic cache invalidation on layer/filter changes
 * - Memory-efficient feature management (only visible features in memory)
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import type { LatLngBounds } from 'leaflet';
import { LAYER_TO_DATASET } from '../lib/layer-datasets';

interface ViewportDataOptions {
  /** Layer ID to fetch */
  layerId: string;
  /** Current map bounds */
  bounds: LatLngBounds | null;
  /** Current zoom level */
  zoom: number;
  /** Enable/disable fetching */
  enabled?: boolean;
  /** Cache duration in milliseconds (default: 5 minutes) */
  cacheDuration?: number;
  /** Debounce delay for viewport changes in milliseconds (default: 300ms) */
  debounceDelay?: number;
  /** Optional filters to apply */
  filters?: {
    conditions?: unknown[];
    logic?: string;
  };
  /** Callback when loading state changes */
  onLoadingChange?: (loading: boolean) => void;
}

interface ViewportData {
  /** GeoJSON feature collection for current viewport */
  geojson: GeoJSON.FeatureCollection | null;
  /** Loading state */
  loading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Number of features in current viewport */
  featureCount: number;
  /** Cache hit indicator (for debugging) */
  fromCache: boolean;
}

interface CacheEntry {
  data: GeoJSON.FeatureCollection;
  timestamp: number;
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number };
  zoom: number;
}

/**
 * Calculate bounding box from Leaflet bounds
 * Returns null if bounds are invalid
 */
function calculateBBox(bounds: LatLngBounds | null): {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
} | null {
  if (!bounds) return null;

  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();

  // Validate coordinates
  if (!sw || !ne) return null;
  if (sw.lat < -90 || sw.lat > 90 || ne.lat < -90 || ne.lat > 90) return null;
  if (sw.lng < -180 || sw.lng > 180 || ne.lng < -180 || ne.lng > 180) return null;

  return {
    minLat: sw.lat,
    maxLat: ne.lat,
    minLng: sw.lng,
    maxLng: ne.lng,
  };
}

/**
 * Check if two bounding boxes overlap significantly (> 80% overlap)
 * Used for cache hit detection
 */
function bboxOverlap(
  bbox1: { minLat: number; maxLat: number; minLng: number; maxLng: number },
  bbox2: { minLat: number; maxLat: number; minLng: number; maxLng: number }
): boolean {
  const latOverlap =
    Math.min(bbox1.maxLat, bbox2.maxLat) - Math.max(bbox1.minLat, bbox2.minLat);
  const lngOverlap =
    Math.min(bbox1.maxLng, bbox2.maxLng) - Math.max(bbox1.minLng, bbox2.minLng);

  if (latOverlap <= 0 || lngOverlap <= 0) return false;

  const bbox1Area = (bbox1.maxLat - bbox1.minLat) * (bbox1.maxLng - bbox1.minLng);
  const bbox2Area = (bbox2.maxLat - bbox2.minLat) * (bbox2.maxLng - bbox2.minLng);
  const overlapArea = latOverlap * lngOverlap;

  // Consider cache hit if overlap is > 80% of smaller bbox
  const overlapRatio = overlapArea / Math.min(bbox1Area, bbox2Area);
  return overlapRatio > 0.8;
}

/**
 * Hook for viewport-based progressive loading
 */
export function useViewportData({
  layerId,
  bounds,
  zoom,
  enabled = true,
  cacheDuration = 5 * 60 * 1000, // 5 minutes
  debounceDelay = 300,
  filters,
  onLoadingChange,
}: ViewportDataOptions): ViewportData {
  const [data, setData] = useState<ViewportData>({
    geojson: null,
    loading: false,
    error: null,
    featureCount: 0,
    fromCache: false,
  });

  // Cache for viewport data (per layer)
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());

  // Debounce timer
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Track current fetch to prevent race conditions
  const currentFetchRef = useRef<AbortController | null>(null);

  // Stable callback reference
  const onLoadingChangeRef = useRef(onLoadingChange);
  useEffect(() => {
    onLoadingChangeRef.current = onLoadingChange;
  }, [onLoadingChange]);

  /**
   * Fetch viewport data from backend
   */
  const fetchViewportData = useCallback(
    async (bbox: {
      minLat: number;
      maxLat: number;
      minLng: number;
      maxLng: number;
    }) => {
      // Abort previous fetch if still running
      if (currentFetchRef.current) {
        currentFetchRef.current.abort();
      }

      const abortController = new AbortController();
      currentFetchRef.current = abortController;

      setData((prev) => ({ ...prev, loading: true, error: null, fromCache: false }));
      onLoadingChangeRef.current?.(true);

      try {
        const datasetKey = LAYER_TO_DATASET[layerId] ?? layerId;

        // Build query URL with bounding box parameters
        const params = new URLSearchParams({
          min_lat: bbox.minLat.toFixed(6),
          max_lat: bbox.maxLat.toFixed(6),
          min_lng: bbox.minLng.toFixed(6),
          max_lng: bbox.maxLng.toFixed(6),
          limit: '10000', // Backend will enforce max limit
        });

        let response: Response;

        // Use filtered endpoint if filters are active
        if (filters && filters.conditions && filters.conditions.length > 0) {
          response = await fetch('/api/filter/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              dataset: datasetKey,
              conditions: filters.conditions,
              logic: filters.logic ?? 'and',
              bounds: bbox,
            }),
            signal: abortController.signal,
          });
        } else {
          // Use standard data endpoint with bounding box
          response = await fetch(`/api/data/${datasetKey}?${params.toString()}`, {
            signal: abortController.signal,
          });
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        // Normalize response (handle both FeatureCollection and wrapped responses)
        const geojson: GeoJSON.FeatureCollection = result.geojson ?? result;

        // Update cache
        const cacheKey = `${layerId}-${zoom}`;
        cacheRef.current.set(cacheKey, {
          data: geojson,
          timestamp: Date.now(),
          bounds: bbox,
          zoom,
        });

        setData({
          geojson,
          loading: false,
          error: null,
          featureCount: geojson.features?.length ?? 0,
          fromCache: false,
        });
      } catch (error) {
        // Ignore abort errors (intentional cancellation)
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }

        console.error(`Error fetching viewport data for ${layerId}:`, error);
        setData((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }));
      } finally {
        onLoadingChangeRef.current?.(false);
        currentFetchRef.current = null;
      }
    },
    [layerId, zoom, filters]
  );

  /**
   * Check cache and fetch if needed
   */
  const loadViewportData = useCallback(() => {
    if (!enabled || !bounds) {
      setData({ geojson: null, loading: false, error: null, featureCount: 0, fromCache: false });
      return;
    }

    const bbox = calculateBBox(bounds);
    if (!bbox) {
      setData((prev) => ({ ...prev, error: 'Invalid bounding box' }));
      return;
    }

    // Check cache first
    const cacheKey = `${layerId}-${zoom}`;
    const cached = cacheRef.current.get(cacheKey);

    if (cached) {
      const age = Date.now() - cached.timestamp;
      const isFresh = age < cacheDuration;
      const isOverlapping = bboxOverlap(cached.bounds, bbox);

      if (isFresh && isOverlapping) {
        // Cache hit - use cached data
        setData({
          geojson: cached.data,
          loading: false,
          error: null,
          featureCount: cached.data.features?.length ?? 0,
          fromCache: true,
        });
        return;
      }
    }

    // Cache miss - fetch from backend
    fetchViewportData(bbox);
  }, [enabled, bounds, layerId, zoom, cacheDuration, fetchViewportData]);

  /**
   * Debounced viewport change handler
   */
  useEffect(() => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      loadViewportData();
    }, debounceDelay);

    // Cleanup on unmount
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [loadViewportData, debounceDelay]);

  /**
   * Clear cache when layer or filters change
   */
  useEffect(() => {
    cacheRef.current.clear();
  }, [layerId, filters]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      // Abort any pending fetch
      if (currentFetchRef.current) {
        currentFetchRef.current.abort();
      }
      // Clear debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return data;
}
