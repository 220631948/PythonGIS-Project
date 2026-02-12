/**
 * useMapLayers — Hook managing GeoJSON layer fetching, filtering, and cleanup.
 * Extracted from MapView to encapsulate all data-loading side-effects.
 *
 * ENHANCED: Sprint 3 Phase E.2.2 - Now supports viewport-based loading for performance
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import type { LatLngBounds } from 'leaflet';

interface LayerData {
  geojson: GeoJSON.FeatureCollection;
  dataset: { name: string };
}

interface FilterData {
  conditions?: unknown[];
  logic?: string;
}

interface UseMapLayersOptions {
  layers: string[];
  activeFilters: Record<string, FilterData>;
  onLayerLoading?: (id: string, loading: boolean) => void;
  /** Enable viewport-based loading (default: false for backward compatibility) */
  enableViewportLoading?: boolean;
  /** Current map bounds (required if enableViewportLoading is true) */
  bounds?: LatLngBounds | null;
  /** Current zoom level (required if enableViewportLoading is true) */
  zoom?: number;
}

// Map frontend layer IDs -> backend dataset keys (used by /api/data)
export const LAYER_TO_DATASET: Record<string, string> = {
  'zoning-layer': 'zoning',
  'building-footprints-layer': 'building_footprints',
  'open-spaces-layer': 'open_spaces',
  'water-facilities-layer': 'water_facilities',

  'services-layer': 'informal_settlements',
  'clinics-layer': 'clinics',
  'housing-offices-layer': 'housing_offices',
  'courts-layer': 'courts',

  'parks-layer': 'parks',
  'sports-layer': 'sports_grounds',
  'swimming-pools-layer': 'swimming_pools',

  'safety-layer': 'precincts', // precincts / crime_stat aggregation
  'flood-layer': 'flood_zones',
  'cemeteries-layer': 'cemeteries',
  'trading-layer': 'trading_locations',
  'myciti-stops-layer': 'myciti_stops',
  'myciti-routes-layer': 'myciti_routes',
  'railway-stations-layer': 'rail_stations',
};

export function useMapLayers({
  layers,
  activeFilters,
  onLayerLoading,
  enableViewportLoading = false,
  bounds,
  zoom,
}: UseMapLayersOptions) {
  const [geoData, setGeoData] = useState<Record<string, LayerData>>({});
  const fetchingLayers = useRef(new Set<string>());
  const lastFetchedViewportByLayer = useRef(new Map<string, string>());

  const getViewportKey = useCallback((viewportBounds?: LatLngBounds | null, viewportZoom?: number) => {
    if (!viewportBounds || viewportZoom == null) return 'global';
    const sw = viewportBounds.getSouthWest();
    const ne = viewportBounds.getNorthEast();
    return [
      viewportZoom,
      sw.lat.toFixed(4),
      sw.lng.toFixed(4),
      ne.lat.toFixed(4),
      ne.lng.toFixed(4),
    ].join(':');
  }, []);

  // Stabilize callback to prevent re-renders
  const onLayerLoadingRef = useRef(onLayerLoading);
  useEffect(() => {
    onLayerLoadingRef.current = onLayerLoading;
  }, [onLayerLoading]);

  /**
   * Fetch layer data with optional viewport bounds
   */
  const fetchLayerData = useCallback(async (id: string, viewportBounds?: LatLngBounds | null) => {
    onLayerLoadingRef.current?.(id, true);
    let succeeded = false;
    try {
      // Map frontend ID to backend dataset key where possible
      const datasetKey = LAYER_TO_DATASET[id] ?? id;

      // Build query URL with optional bounding box
      let queryUrl = `/api/data/${datasetKey}?limit=2000`;

      // Add bounding box parameters if viewport loading is enabled
      if (enableViewportLoading && viewportBounds) {
        const sw = viewportBounds.getSouthWest();
        const ne = viewportBounds.getNorthEast();
        const params = new URLSearchParams({
          min_lat: sw.lat.toFixed(6),
          max_lat: ne.lat.toFixed(6),
          min_lng: sw.lng.toFixed(6),
          max_lng: ne.lng.toFixed(6),
          limit: '10000',
        });
        queryUrl = `/api/data/${datasetKey}?${params.toString()}`;
      }

      // Prefer the smart /api/data proxy which handles caching, pagination, and transformations
      // Fallback to portal API if the proxy returns a non-OK response
      let response: Response | null = null;
      try {
        response = await fetch(queryUrl);
      } catch {
        // Network error — will try fallback below
        response = null;
      }

      // If the primary endpoint failed (network error or HTTP error), try portal fallback
      if (!response || !response.ok) {
        try {
          response = await fetch(`/api/portal/datasets/${id}/geojson`);
        } catch {
          response = null;
        }
      }

      if (response && response.ok) {
        const data = await response.json();
        // Normalise responses both from /api/data (FeatureCollection) and /api/portal (wrapper with geojson)
        const normalized: LayerData = data.geojson
          ? data
          : { geojson: data, dataset: { name: datasetKey } };
        setGeoData((prev) => ({ ...prev, [id]: normalized }));
        succeeded = true;
      } else if (response) {
        console.warn(`Fetch for layer ${id} returned HTTP ${response.status}`);
      }
    } catch (error) {
      console.error(`Error fetching layer ${id}:`, error);
    } finally {
      onLayerLoadingRef.current?.(id, false);
    }
    return succeeded;
  }, [enableViewportLoading]);

  const fetchFilteredLayerData = useCallback(async (id: string, filterData: FilterData) => {
    onLayerLoadingRef.current?.(id, true);
    try {
      const datasetKey = LAYER_TO_DATASET[id] ?? id;
      const response = await fetch('/api/filter/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataset: datasetKey,
          conditions: filterData.conditions ?? [],
          logic: filterData.logic ?? 'and',
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setGeoData((prev) => ({
          ...prev,
          [id]: { geojson: data.geojson, dataset: { name: datasetKey } },
        }));
      }
    } catch (error) {
      console.error(`Error fetching filtered layer ${id}:`, error);
    } finally {
      onLayerLoadingRef.current?.(id, false);
    }
  }, []);

  // Fetch standard layers (without filters) with deduped requests
  // If viewport loading is enabled, refetch on bounds/zoom change
  useEffect(() => {
    const currentViewportKey = getViewportKey(bounds, zoom);

    layers.forEach((layerId) => {
      if (activeFilters[layerId]) return;

      const shouldFetch = enableViewportLoading
        ? lastFetchedViewportByLayer.current.get(layerId) !== currentViewportKey
        : !geoData[layerId] && !fetchingLayers.current.has(layerId);

      if (shouldFetch && !fetchingLayers.current.has(layerId)) {
        fetchingLayers.current.add(layerId);
        fetchLayerData(layerId, bounds)
          .then((ok) => {
            if (ok && enableViewportLoading) {
              lastFetchedViewportByLayer.current.set(layerId, currentViewportKey);
            }
          })
          .finally(() => {
            fetchingLayers.current.delete(layerId);
          });
      }
    });
  }, [
    layers,
    activeFilters,
    geoData,
    fetchLayerData,
    enableViewportLoading,
    bounds,
    zoom,
    getViewportKey,
  ]);

  // Fetch filtered layers when filters are active
  useEffect(() => {
    layers.forEach((layerId) => {
      if (activeFilters[layerId]) {
        fetchFilteredLayerData(layerId, activeFilters[layerId]);
      }
    });
  }, [layers, activeFilters, fetchFilteredLayerData]);

  // Cleanup inactive layers
  useEffect(() => {
    setGeoData((prev) => {
      const next = { ...prev };
      let changed = false;
      Object.keys(next).forEach((key) => {
        if (!layers.includes(key)) {
          delete next[key];
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [layers]);

  return { geoData } as { geoData: Record<string, LayerData | undefined> };
}
