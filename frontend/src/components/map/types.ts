import type { PathOptions } from 'leaflet';

export interface ModuleLayerBuffer {
  polygon: GeoJSON.FeatureCollection;
  color: string;
  opacity: number;
}

export interface ModuleLayerData {
  type?: 'FeatureCollection' | 'geojson' | 'choropleth' | 'multi-layer' | 'heatmap' | 'cluster';
  data?: GeoJSON.FeatureCollection;
  style?: PathOptions | ((feature?: GeoJSON.Feature) => PathOptions);
  popup?: (feature: GeoJSON.Feature) => string;
  colorFn?: (value: unknown) => string;
  buffers?: ModuleLayerBuffer[];
  layers?: Array<{
    data: GeoJSON.FeatureCollection;
    style: PathOptions;
    popup?: (feature: GeoJSON.Feature) => string;
  }>;
  heatmapOptions?: {
    radius?: number;
    blur?: number;
    maxZoom?: number;
    intensityProperty?: string;
  };
}
