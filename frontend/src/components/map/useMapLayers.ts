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
      const response = await fetch(`/api/portal/datasets/${id}/geojson`);
      if (response.ok) {
        const data = await response.json();
        const normalized: LayerData = data.geojson
          ? data
          : { geojson: data, dataset: { name: id } };
        setGeoData((prev) => ({ ...prev, [id]: normalized }));
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
      const response = await fetch('/api/filter/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataset: id,
          conditions: filterData.conditions ?? [],
          logic: filterData.logic ?? 'and',
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setGeoData((prev) => ({
          ...prev,
          [id]: { geojson: data.geojson, dataset: { name: id } },
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

  return { geoData };
}
