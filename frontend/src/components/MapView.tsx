/**
 * MapView — Main map container component for Cape Town GeoHub.
 *
 * Orchestrates basemaps, data layers, controls, and user interactions.
 * All heavy logic has been extracted into sub-modules under ./map/.
 *
 * ENHANCED: Now supports PostGIS clustering, heatmaps, and advanced layer rendering
 */
import { useState, useCallback } from 'react';
import {
  MapContainer,
  TileLayer,
  ZoomControl,
  ScaleControl,
  LayersControl,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { BASEMAPS, BasemapConfig } from '../config/maps';

import {
  type LatLng,
  toLatLng,
  MapEvents,
  MapController,
  DrawingTools,
  FullscreenControl,
  LocationControl,
  MinimapControl,
  DataLayers,
  RouteLayers,
  ModuleLayers,
  MarkerManager,
  type ModuleLayerData,
} from './map';
import { useMapLayers } from './map/useMapLayers';

interface MapViewProps {
  center: { lat?: number | string; lng?: number | string; lon?: number | string };
  zoom?: number;
  layers?: string[];
  basemap?: string;
  onMapMove: (data: { lat: number; lng: number; zoom: number; bounds: unknown }) => void;
  flyTo?: { lat?: number | string; lng?: number | string; lon?: number | string; zoom?: number };
  onLayerLoading?: (id: string, loading: boolean) => void;
  clickedLocation?: { lat?: number | string; lng?: number | string };
  onBasemapChange?: (basemap: string) => void;
  onLocationFound?: (latlng: LatLng) => void;
  onGeometryCreated?: (data: { type: string; geometry: GeoJSON.Geometry; layer: L.Layer }) => void;
  onGeometryEdited?: (data: L.LayerGroup) => void;
  onGeometryDeleted?: (data: L.LayerGroup) => void;
  onFeatureClick?: (feature: GeoJSON.Feature, event: unknown) => void;
  onFeatureHover?: (feature: GeoJSON.Feature, hovering: boolean) => void;
  showDrawingTools?: boolean;
  showFullscreen?: boolean;
  showLocation?: boolean;
  showMinimap?: boolean;
  layerOpacity?: number;
  routeData?: Record<string, unknown> | null;
  isochroneData?: GeoJSON.FeatureCollection | Record<string, unknown> | null;
  activeFilters?: Record<string, Record<string, unknown>>;
  collaborationMarkers?: Array<Record<string, unknown>>;
  moduleLayerData?: ModuleLayerData | null;
}

const MapView = ({
  center,
  zoom,
  layers: _layers = [],
  basemap = 'streets',
  onMapMove,
  flyTo,
  onLayerLoading: _onLayerLoading,
  clickedLocation,
  onBasemapChange,
  onLocationFound,
  onGeometryCreated,
  onGeometryEdited,
  onGeometryDeleted,
  onFeatureClick: _onFeatureClick,
  onFeatureHover: _onFeatureHover,
  showDrawingTools = false,
  showFullscreen = false,
  showLocation = false,
  showMinimap = false,
  layerOpacity: _layerOpacity = 0.7,
  routeData = null,
  isochroneData = null,
  activeFilters: _activeFilters = {},
  collaborationMarkers = [],
  moduleLayerData = null,
}: MapViewProps) => {
  const [localClickLocation, setLocalClickLocation] = useState<LatLng | null>(null);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);

  // Data layers hook
  const { geoData } = useMapLayers({
    layers: _layers,
    activeFilters: _activeFilters,
    onLayerLoading: _onLayerLoading
  }) as { geoData: Record<string, { geojson: GeoJSON.FeatureCollection; dataset: { name: string } } | undefined> };

  const normalizedCenter = toLatLng(center);
  const activeClickLocation = toLatLng(localClickLocation ?? clickedLocation);
  const normalizedUserLocation = toLatLng(userLocation);

  // Route helpers
  const routeOrigin = toLatLng(routeData?.origin as Record<string, unknown> | null);
  const routeDestination = toLatLng(routeData?.destination as Record<string, unknown> | null);
  const isochroneGeojson = (isochroneData as Record<string, unknown>)?.isochrone_geojson ?? isochroneData;

  const handleMapClick = useCallback((latlng: LatLng) => {
    const normalized = toLatLng(latlng);
    if (normalized) setLocalClickLocation(normalized);
  }, []);

  const handleLocationFound = useCallback(
    (latlng: LatLng) => {
      const normalized = toLatLng(latlng);
      if (!normalized) return;
      setUserLocation(normalized);
      onLocationFound?.(normalized);
    },
    [onLocationFound],
  );

  const basemapConfig: BasemapConfig = (BASEMAPS[basemap] ?? BASEMAPS.streets)!;

  // Fallback when coords are not yet available
  if (!normalizedCenter) {
    return (
      <div
        className="map-error-fallback"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          background: '#f3f4f6',
          color: '#6b7280',
        }}
      >
        <div className="text-center">
          <p>Initializing Map View...</p>
          <small>Waiting for valid coordinates</small>
        </div>
      </div>
    );
  }

  return (
    <div className="enhanced-map-container">
      <MapContainer
        center={[normalizedCenter.lat, normalizedCenter.lng]}
        zoom={zoom ?? 11}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        attributionControl={true}
      >
        {/* Basemap */}
        <TileLayer attribution={basemapConfig.attribution} url={basemapConfig.url} subdomains="abcd" />

        {/* Controls */}
        <ZoomControl position="bottomright" />
        <ScaleControl position="bottomleft" />
        {showFullscreen && <FullscreenControl />}
        {showLocation && <LocationControl onLocationFound={handleLocationFound} />}
        {showMinimap && <MinimapControl basemap={basemap} />}

        {/* Drawing tools */}
        {showDrawingTools && (
          <DrawingTools
            onGeometryCreated={onGeometryCreated}
            onGeometryEdited={onGeometryEdited}
            onGeometryDeleted={onGeometryDeleted}
          />
        )}

        {/* Events & Controller */}
        <MapEvents onMove={onMapMove} onClick={handleMapClick} onLocationFound={handleLocationFound} />
        <MapController center={center} zoom={zoom} flyTo={flyTo ?? {}} basemap={basemap} onBasemapChange={onBasemapChange} />

        {/* Layer controls */}
        <LayersControl position="topleft">
          {Object.entries(BASEMAPS)
            .filter(([key]) => key !== 'light')
            .map(([key, config]) => (
              <LayersControl.BaseLayer key={key} name={config.name} checked={key === basemap}>
                <TileLayer attribution={config.attribution} url={config.url} subdomains="abcd" />
              </LayersControl.BaseLayer>
            ))}

          <DataLayers
            geoData={geoData}
            layerOpacity={_layerOpacity}
            onFeatureClick={_onFeatureClick}
            onFeatureHover={_onFeatureHover}
          />

          <RouteLayers
            routeData={routeData}
            routeOrigin={routeOrigin}
            routeDestination={routeDestination}
            isochroneGeojson={isochroneGeojson as GeoJSON.FeatureCollection | null}
          />

          <ModuleLayers moduleLayerData={moduleLayerData as ModuleLayerData | null} />
        </LayersControl>

        <MarkerManager
          collaborationMarkers={collaborationMarkers}
          activeClickLocation={activeClickLocation}
          userLocation={normalizedUserLocation}
        />
      </MapContainer>
    </div>
  );
};

export default MapView;
