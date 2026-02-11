/**
 * useMapLayers — Hook managing GeoJSON layer fetching, filtering, and cleanup.
 * Extracted from MapView to encapsulate all data-loading side-effects.
 */
import { useState, useCallback, useEffect, useRef } from 'react';

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

export function useMapLayers({ layers, activeFilters, onLayerLoading }: UseMapLayersOptions) {
  const [geoData, setGeoData] = useState<Record<string, LayerData>>({});
  const fetchingLayers = useRef(new Set<string>());

  // Stabilize callback to prevent re-renders
  const onLayerLoadingRef = useRef(onLayerLoading);
  useEffect(() => {
    onLayerLoadingRef.current = onLayerLoading;
  }, [onLayerLoading]);

  const fetchLayerData = useCallback(async (id: string) => {
    onLayerLoadingRef.current?.(id, true);
    try {
      // Map frontend ID to backend dataset key where possible
      const datasetKey = LAYER_TO_DATASET[id] ?? id;

      // Prefer the smart /api/data proxy which handles caching, pagination, and transformations
      // Fallback to portal API if the proxy returns a non-OK response
      let response: Response | null = null;
      try {
        response = await fetch(`/api/data/${datasetKey}?limit=2000`);
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
      } else if (response) {
        console.warn(`Fetch for layer ${id} returned HTTP ${response.status}`);
      }
    } catch (error) {
      console.error(`Error fetching layer ${id}:`, error);
    } finally {
      onLayerLoadingRef.current?.(id, false);
    }
  }, []);

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
  useEffect(() => {
    layers.forEach((layerId) => {
      if (activeFilters[layerId]) return;
      if (!geoData[layerId] && !fetchingLayers.current.has(layerId)) {
        fetchingLayers.current.add(layerId);
        fetchLayerData(layerId).finally(() => {
          fetchingLayers.current.delete(layerId);
        });
      }
    });
  }, [layers, activeFilters, geoData, fetchLayerData]);

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
