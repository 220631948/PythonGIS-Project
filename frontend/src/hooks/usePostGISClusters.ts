/**
 * usePostGISClusters - Hook for server-side PostGIS clustering
 *
 * Fetches clustered point data from the backend based on zoom level and map bounds.
 * Uses PostGIS ST_ClusterKMeans for efficient server-side clustering.
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
        const boundsStr = [
          bounds.getWest(),
          bounds.getSouth(),
          bounds.getEast(),
          bounds.getNorth()
        ].join(',');

        const response = await fetch(
          `/api/performance/cluster/${dataset}?zoom=${zoom}&bounds=${boundsStr}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
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
