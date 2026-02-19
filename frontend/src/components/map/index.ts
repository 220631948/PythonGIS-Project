/**
 * Map module barrel export
 */
export { default as EnhancedGeoJSONLayer } from './EnhancedGeoJSONLayer';
export {
  MapEvents,
  MapController,
  DrawingTools,
  FullscreenControl,
  LocationControl,
  MinimapControl,
} from './MapControls';
export { useMapLayers } from './useMapLayers';
export { formatPopupContent } from './popupFormatters';
export {
  toLatLng,
  hasFiniteCoords,
  isValidGeoJSONFeature,
  getLayerStyle,
  DefaultIcon,
  clickMarkerIcon,
  locationMarkerIcon,
  collaborationIcon,
} from './mapUtils';
export type { LatLng, LatLngCandidate } from './mapUtils';

export * from './types';
export { DataLayers } from './DataLayers';
export { ModuleLayers } from './ModuleLayers';
export { RouteLayers } from './RouteLayers';
export { MarkerManager } from './MarkerManager';
export { PostGISClusterOverlay } from './PostGISClusterOverlay';
