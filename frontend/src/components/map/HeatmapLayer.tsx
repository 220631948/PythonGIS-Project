/**
 * HeatmapLayer - Density visualization using Leaflet heatmap
 *
 * Displays point data as a heat intensity map for density analysis.
 * Useful for crime hotspots, population density, facility access, etc.
 */
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

// Extend Leaflet types for heatLayer
declare module 'leaflet' {
  function heatLayer(
    latlngs: Array<[number, number, number?]>,
    options?: HeatMapOptions
  ): L.Layer;

  interface HeatMapOptions {
    minOpacity?: number;
    maxZoom?: number;
    max?: number;
    radius?: number;
    blur?: number;
    gradient?: { [key: number]: string };
  }
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity?: number;
}

interface HeatmapLayerProps {
  points: HeatmapPoint[];
  options?: {
    radius?: number;
    blur?: number;
    maxZoom?: number;
    max?: number;
    minOpacity?: number;
    gradient?: { [key: number]: string };
  };
}

/**
 * Render a heatmap overlay on the map
 */
export function HeatmapLayer({ points, options = {} }: HeatmapLayerProps) {
  const map = useMap();

  useEffect(() => {
    if (!points || points.length === 0) {
      return;
    }

    // Convert points to Leaflet heatmap format: [lat, lng, intensity]
    const heatPoints: Array<[number, number, number]> = points.map(p => [
      p.lat,
      p.lng,
      p.intensity ?? 1.0
    ]);

    // Default heatmap options
    const heatOptions: L.HeatMapOptions = {
      radius: options.radius ?? 25,
      blur: options.blur ?? 15,
      maxZoom: options.maxZoom ?? 17,
      max: options.max ?? 1.0,
      minOpacity: options.minOpacity ?? 0.4,
      gradient: options.gradient ?? {
        0.0: 'blue',
        0.5: 'lime',
        0.7: 'yellow',
        0.9: 'orange',
        1.0: 'red'
      }
    };

    // Create heatmap layer
    const heatLayer = L.heatLayer(heatPoints, heatOptions);

    // Add to map
    heatLayer.addTo(map);

    // Cleanup on unmount or when points change
    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points, options]);

  return null; // This component doesn't render anything directly
}

/**
 * Extract heatmap points from GeoJSON FeatureCollection
 */
export function extractHeatmapPoints(
  geojson: GeoJSON.FeatureCollection,
  intensityProperty?: string
): HeatmapPoint[] {
  const points: HeatmapPoint[] = [];

  geojson.features.forEach(feature => {
    if (feature.geometry.type === 'Point') {
      const [lng, lat] = feature.geometry.coordinates;
      const intensity = intensityProperty && feature.properties
        ? feature.properties[intensityProperty]
        : 1.0;

      points.push({ lat, lng, intensity });
    }
  });

  return points;
}

export default HeatmapLayer;
