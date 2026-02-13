/**
 * usePostGISClusters - Hook for server-side PostGIS clustering
 *
 * Fetches clustered point data from the backend based on zoom level and map bounds.
 * Uses PostGIS ST_ClusterKMeans for efficient server-side clustering.
 *
 * **Sprint 3 - E.2.1: Enhanced with ClusterRequest schema validation**
 * Now uses /api/spatial/cluster endpoint with validated ClusterRequest schema
 * consistent with DensityAnalysisRequest pattern.
 */
import { useState, useEffect, useRef } from 'react';
import type { LatLngBounds } from 'leaflet';

export interface ClusterFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: {
    cluster_id: number;
    point_count: number;
    is_cluster: boolean;
    bounds?: any;
  };
}

export interface ClusterData {
  type: 'FeatureCollection';
  features: ClusterFeature[];
  metadata: {
    cluster_count: number;
    zoom: number;
    total_points: number;
  };
}

interface UsePostGISClustersOptions {
  dataset: string;
  zoom: number;
  bounds: LatLngBounds | null;
  enabled?: boolean;
  minZoom?: number; // Only cluster below this zoom level
}

/**
 * Hook to fetch PostGIS-clustered data from the backend
 */
export function usePostGISClusters({
  dataset,
  zoom,
  bounds,
  enabled = true,
  minZoom = 15
}: UsePostGISClustersOptions) {
  const [clusters, setClusters] = useState<ClusterData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Use ref to track current request to prevent race conditions
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Don't cluster at high zoom levels - show individual points instead
    if (!enabled || zoom >= minZoom || !bounds) {
      setClusters(null);
      return;
    }

    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const fetchClusters = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Build ClusterRequest body with validated schema
        const requestBody = {
          layer_name: dataset,
          bounds: {
            min_lat: bounds.getSouth(),
            max_lat: bounds.getNorth(),
            min_lng: bounds.getWest(),
            max_lng: bounds.getEast(),
          },
          zoom_level: zoom,
          // num_clusters will be calculated automatically based on zoom_level
        };

        // Use new validated /api/spatial/cluster endpoint
        const response = await fetch('/api/spatial/cluster', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();

        if (!controller.signal.aborted) {
          setClusters(data);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError' && !controller.signal.aborted) {
          console.error('PostGIS clustering error:', err);
          setError(err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchClusters();

    return () => {
      controller.abort();
    };
  }, [dataset, zoom, bounds, enabled, minZoom]);

  return { clusters, isLoading, error };
}
