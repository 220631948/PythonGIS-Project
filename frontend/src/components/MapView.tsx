/**
 * MapView — Main map container component for Cape Town GeoHub.
 *
 * Orchestrates basemaps, data layers, controls, and user interactions.
 * All heavy logic has been extracted into sub-modules under ./map/.
 *
 * ENHANCED: Now supports PostGIS clustering, heatmaps, and advanced layer rendering
 */
import React, { useState, useCallback, useEffect } from 'react';
import type { PathOptions } from 'leaflet';
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  Marker,
  Popup,
  ZoomControl,
  ScaleControl,
  LayersControl,
  LayerGroup,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';

import { BASEMAPS, BasemapConfig } from '../config/maps';

import {
  type LatLng,
  toLatLng,
  clickMarkerIcon,
  locationMarkerIcon,
  collaborationIcon,
} from './map';
import {
  MapEvents,
  MapController,
  DrawingTools,
  FullscreenControl,
  LocationControl,
  MinimapControl,
} from './map';
import { useMapLayers, LAYER_TO_DATASET } from './map/useMapLayers';
import { usePostGISClusters } from '../hooks/usePostGISClusters';
import { HeatmapLayer, extractHeatmapPoints } from './map/HeatmapLayer';
import { ClusterLayer } from './map/ClusterLayer';

/**
 * Inner component that reads map state (bounds/zoom) and renders PostGIS clusters
 * for point-type layers.  Must live *inside* <MapContainer>.
 */
function PostGISClusterOverlay({ dataset, color }: { dataset: string; color?: string }) {
  const map = useMap();
  const [mapState, setMapState] = useState({
    zoom: map.getZoom(),
    bounds: map.getBounds(),
  });

  useMapEvents({
    moveend: () => {
      setMapState({ zoom: map.getZoom(), bounds: map.getBounds() });
    },
    zoomend: () => {
      setMapState({ zoom: map.getZoom(), bounds: map.getBounds() });
    },
  });

  const { clusters } = usePostGISClusters({
    dataset,
    zoom: mapState.zoom,
    bounds: mapState.bounds,
    enabled: true,
    minZoom: 15,
  });

  return <ClusterLayer clusterData={clusters} color={color} />;
}

// ── Props ──

interface ModuleLayerBuffer {
  polygon: GeoJSON.FeatureCollection;
  color: string;
  opacity: number;
}

interface ModuleLayerData {
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

/**
 * Inner component to track map bounds for viewport loading
 * Must live inside <MapContainer>
 */
function ViewportTracker({
  onViewportChange,
}: {
  onViewportChange: (bounds: unknown, zoom: number) => void;
}) {
  const map = useMap();

  useMapEvents({
    moveend: () => {
      onViewportChange(map.getBounds(), map.getZoom());
    },
    zoomend: () => {
      onViewportChange(map.getBounds(), map.getZoom());
    },
  });

  // Initial viewport
  useEffect(() => {
    onViewportChange(map.getBounds(), map.getZoom());
  }, []);

  return null;
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
  const [mapBounds, setMapBounds] = useState<unknown>(null);
  const [mapZoom, setMapZoom] = useState<number>(zoom ?? 11);

  // Viewport change handler
  const handleViewportChange = useCallback((bounds: unknown, currentZoom: number) => {
    setMapBounds(bounds);
    setMapZoom(currentZoom);
  }, []);

  // Data layers hook with viewport loading enabled
  const { geoData } = useMapLayers({
    layers: _layers,
    activeFilters: _activeFilters,
    onLayerLoading: _onLayerLoading,
    enableViewportLoading: true,
    bounds: mapBounds as never,
    zoom: mapZoom,
  }) as { geoData: Record<string, { geojson: GeoJSON.FeatureCollection; dataset: { name: string } } | undefined> };

  const normalizedCenter = toLatLng(center);
  const activeClickLocation = toLatLng(localClickLocation ?? clickedLocation);
  const normalizedUserLocation = toLatLng(userLocation);

  // Route helpers
  const routeOrigin = toLatLng(routeData?.origin as Record<string, unknown> | null);
  const routeDestination = toLatLng(routeData?.destination as Record<string, unknown> | null);
  const isochroneGeojson = (isochroneData as Record<string, unknown>)?.isochrone_geojson ?? isochroneData;

  // const hasRouteLayer = Boolean(routeOrigin && routeDestination && routeData?.route_geojson);
  const moduleLayer = moduleLayerData as ModuleLayerData | null;


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

  // Data layers are rendered in a small helper to keep MapView types manageable.
  // NOTE: This was temporarily simplified to avoid a TSC edge case with strict indexed access.
  // TODO: Re-introduce typed data layer rendering in a separate refactor/PR.
  // Data layers rendering temporarily removed to simplify strict typing.
  // TODO: Reintroduce typed layer rendering (follow-up task).

  // Pre-compute data layer elements to avoid TS inference issues with Object.keys in JSX

  const dataLayerElements: any[] = [];

  for (const layerId of Object.keys(geoData)) {

    const layerData = geoData[layerId];

    if (!layerData?.geojson) continue;

    const datasetName = String(LAYER_TO_DATASET[layerId] ?? layerId);



    const isPointLayer = layerData.geojson.features?.some(

      (f) => f.geometry?.type === 'Point' || f.geometry?.type === 'MultiPoint'

    );



    const geoJsonLayer = (

      <GeoJSON

        data={layerData.geojson}

        style={{

          color: '#3b82f6',

          weight: 2,

          opacity: 0.7,

          fillOpacity: _layerOpacity,

        }}

        onEachFeature={(feature, layer) => {

          const props = feature.properties || {};

          const name = props.name || props.NAME || props.label || datasetName;



          // Build popup content

          const popupLines = [`<strong>${String(name)}</strong>`];

          if (props.description) popupLines.push(`<p>${String(props.description)}</p>`);

          if (props.category) popupLines.push(`<p>Category: ${String(props.category)}</p>`);

          if (props.area) popupLines.push(`<p>Area: ${String(props.area)}</p>`);



          layer.bindPopup(`<div class="p-2">${popupLines.join('')}</div>`);



          // Attach event handlers

          layer.on({

            click: (e) => _onFeatureClick?.(feature, e),

            mouseover: () => _onFeatureHover?.(feature, true),

            mouseout: () => _onFeatureHover?.(feature, false),

          });

        }}

      />

    );



    dataLayerElements.push(

      <LayersControl.Overlay key={layerId} checked name={datasetName}>

        {isPointLayer ? (

          <MarkerClusterGroup

            chunkedLoading

            maxClusterRadius={50}

            showCoverageOnHover={false}

          >

            {geoJsonLayer}

          </MarkerClusterGroup>

        ) : (

          geoJsonLayer

        )}

      </LayersControl.Overlay>

    );

  }

  // Fallback when coords are not yet available
  if (!normalizedCenter) {
    return (
      <div
        className="map-error-fallback"
        role="status"
        aria-live="polite"
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
    <div className="enhanced-map-container" role="region" aria-label="Interactive map of Cape Town" aria-roledescription="map">
      <div className="visually-hidden" role="status" aria-live="polite" id="map-live-region"></div>
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
        <ViewportTracker onViewportChange={handleViewportChange} />

        {/* Layer controls */}
        <LayersControl position="topleft">
          {Object.entries(BASEMAPS)
            .filter(([key]) => key !== 'light')
            .map(([key, config]) => (
              <LayersControl.BaseLayer key={key} name={config.name} checked={key === basemap}>
                <TileLayer attribution={config.attribution} url={config.url} subdomains="abcd" />
              </LayersControl.BaseLayer>
            ))}

          {/* Data Layers from API */}
          {dataLayerElements as any}

          {/* Route Layer */}
          {routeOrigin && routeDestination && routeData?.route_geojson && (
            <LayersControl.Overlay checked name="Active Route">
              <LayerGroup>
                <GeoJSON
                  key={`route-${(routeData?.route_geojson as GeoJSON.FeatureCollection)?.features?.length ?? 0}`}
                  data={routeData?.route_geojson as GeoJSON.FeatureCollection}
                  style={{ color: '#3b82f6', weight: 5, opacity: 0.8 }}
                />
                <Marker position={[routeOrigin.lat, routeOrigin.lng]} icon={locationMarkerIcon}>
                  <Popup>Origin: {String((routeData?.origin as Record<string, unknown>)?.name ?? 'Origin')}</Popup>
                </Marker>
                <Marker position={[routeDestination.lat, routeDestination.lng]} icon={locationMarkerIcon}>
                  <Popup>Destination: {String((routeData?.destination as Record<string, unknown>)?.name ?? 'Destination')}</Popup>
                </Marker>
              </LayerGroup>
            </LayersControl.Overlay>
          )}

          {/* Isochrone Layer */}
          {isochroneGeojson && (
            <LayersControl.Overlay checked name="Isochrone">
              <GeoJSON
                key={`iso-${(isochroneGeojson as GeoJSON.FeatureCollection)?.features?.length ?? 0}`}
                data={isochroneGeojson as GeoJSON.FeatureCollection}
                style={{ color: '#8b5cf6', weight: 2, opacity: 0.8, fillColor: '#a78bfa', fillOpacity: 0.3 }}
              />
            </LayersControl.Overlay>
          )}

          {/* Module Layers */}
          {moduleLayer && (
            <LayersControl.Overlay checked name="Module Analysis">
              <LayerGroup>
                {(moduleLayer.type === 'FeatureCollection' || moduleLayer.type === 'geojson') && (
                  <GeoJSON
                    key={`module-geo-${((moduleLayer.data ?? moduleLayer) as GeoJSON.FeatureCollection)?.features?.length ?? 0}`}
                    data={((moduleLayer.data ?? moduleLayer) as GeoJSON.FeatureCollection)}
                    style={(feature) =>
                      typeof moduleLayer.style === 'function'
                        ? (moduleLayer.style as (f: GeoJSON.Feature | undefined) => PathOptions)(feature)
                        : { color: feature?.properties?.color ?? '#3b82f6', weight: 2, opacity: 0.8 }
                    }
                    onEachFeature={(feature, layer) => {
                      if (typeof moduleLayer.popup === 'function') {
                        layer.bindPopup((moduleLayer.popup as (f: GeoJSON.Feature) => string)(feature));
                      } else if (feature.properties?.name) {
                        layer.bindPopup(String(feature.properties.name));
                      }
                    }}
                  />
                )}

                {moduleLayer.type === 'choropleth' && (
                  <GeoJSON
                    key={`module-choro-${(moduleLayer.data as GeoJSON.FeatureCollection)?.features?.length ?? 0}`}
                    data={moduleLayer.data as GeoJSON.FeatureCollection}
                    style={(feature) => ({
                      fillColor: (moduleLayer.colorFn as (v: unknown) => string)(feature?.properties?.crime_index),
                      weight: 2,
                      opacity: 1,
                      color: 'white',
                      fillOpacity: 0.7,
                    })}
                    onEachFeature={(feature, layer) => {
                      layer.bindPopup(`
                        <div class="p-2">
                          <strong>${String(feature.properties?.name)}</strong><br/>
                          Index: ${String(feature.properties?.crime_index)}
                        </div>
                      `);
                    }}
                  />
                )}

                {moduleLayer.buffers?.map(
                  (buffer, idx) => (
                    <GeoJSON
                      key={`transport-buffer-${idx}`}
                      data={buffer.polygon}
                      style={{ color: buffer.color, fillColor: buffer.color, fillOpacity: buffer.opacity, weight: 1 }}
                    />
                  ),
                )}

                {moduleLayer.type === 'multi-layer' &&
                  moduleLayer.layers?.map((layerCfg, idx) => (
                    <GeoJSON
                      key={`env-layer-${idx}`}
                      data={layerCfg.data}
                      style={layerCfg.style}
                      onEachFeature={(feature, layerInstance) => {
                        if (layerCfg.popup) layerInstance.bindPopup(layerCfg.popup(feature));
                      }}
                    />
                  ))}
              </LayerGroup>
            </LayersControl.Overlay>
          )}

          {/* Heatmap Layer - for density visualization */}
          {moduleLayer?.type === 'heatmap' && moduleLayer.data && (
            <LayersControl.Overlay checked name="Density Heatmap">
              <HeatmapLayer
                points={extractHeatmapPoints(moduleLayer.data)}
                options={{
                  radius: 25,
                  blur: 15,
                  maxZoom: 17,
                  max: 1.0
                }}
              />
            </LayersControl.Overlay>
          )}

          {/* PostGIS cluster layers for enabled point datasets */}
          {moduleLayer?.type === 'cluster' && (
            <LayersControl.Overlay checked name="PostGIS Clusters">
              <LayerGroup>
                <PostGISClusterOverlay
                  dataset={(moduleLayer.data as unknown as { dataset?: string })?.dataset ?? 'clinics'}
                  color="#3388ff"
                />
              </LayerGroup>
            </LayersControl.Overlay>
          )}
        </LayersControl>

        {/* Collaboration Markers */}
        {collaborationMarkers.map((marker, idx) => {
          const normalized = toLatLng((marker.location ?? marker) as Record<string, unknown>);
          const markerTimestamp = marker.timestamp as string | undefined;
          if (!normalized) return null;
          return (
            <Marker key={(marker.id as string) ?? idx} position={[normalized.lat, normalized.lng]} icon={collaborationIcon}>
              <Popup>
                <div className="collaboration-popup">
                  <h4>{String(marker.author ?? 'Contributor')}</h4>
                  <p>{String(marker.text ?? marker.description)}</p>
                  {markerTimestamp && (
                    <span className="popup-time">{new Date(markerTimestamp).toLocaleString()}</span>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Click marker */}
        {activeClickLocation && (
          <Marker position={[activeClickLocation.lat, activeClickLocation.lng]} icon={clickMarkerIcon}>
            <Popup>
              <div className="popup-content click-location">
                <h4>Selected Location</h4>
                <p>Lat: {activeClickLocation.lat.toFixed(5)}</p>
                <p>Lng: {activeClickLocation.lng.toFixed(5)}</p>
                <button
                  className="popup-button"
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent('suitabilityAnalysis', {
                        detail: { lat: activeClickLocation.lat, lng: activeClickLocation.lng },
                      }),
                    )
                  }
                >
                  Analyze Site Suitability
                </button>
              </div>
            </Popup>
          </Marker>
        )}

        {/* User location */}
        {normalizedUserLocation && (
          <Marker position={[normalizedUserLocation.lat, normalizedUserLocation.lng]} icon={locationMarkerIcon}>
            <Popup>
              <div className="popup-content user-location">
                <h4>Your Location</h4>
                <p>Lat: {normalizedUserLocation.lat.toFixed(5)}</p>
                <p>Lng: {normalizedUserLocation.lng.toFixed(5)}</p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

export default MapView;

