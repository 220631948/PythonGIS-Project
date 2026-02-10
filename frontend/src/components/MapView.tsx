/**
 * MapView — Main map container component for Cape Town GeoHub.
 *
 * Orchestrates basemaps, data layers, controls, and user interactions.
 * All heavy logic has been extracted into sub-modules under ./map/.
 */
import React, { useState, useCallback } from 'react';
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
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import { BASEMAPS, BasemapConfig } from '../config/maps';

import {
  type LatLng,
  toLatLng,
  clickMarkerIcon,
  locationMarkerIcon,
  collaborationIcon,
} from './map';
import { EnhancedGeoJSONLayer } from './map';
import {
  MapEvents,
  MapController,
  DrawingTools,
  FullscreenControl,
  LocationControl,
  MinimapControl,
} from './map';
import { useMapLayers } from './map';

// ── Props ──

interface ModuleLayerBuffer {
  polygon: GeoJSON.FeatureCollection;
  color: string;
  opacity: number;
}

interface ModuleLayerData {
  type?: 'FeatureCollection' | 'geojson' | 'choropleth' | 'multi-layer';
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
}

type DatasetInfo = {
  name?: string;
};

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
  layers = [],
  basemap = 'streets',
  onMapMove,
  flyTo,
  onLayerLoading,
  clickedLocation,
  onBasemapChange,
  onLocationFound,
  onGeometryCreated,
  onGeometryEdited,
  onGeometryDeleted,
  onFeatureClick,
  onFeatureHover,
  showDrawingTools = false,
  showFullscreen = false,
  showLocation = false,
  showMinimap = false,
  layerOpacity = 0.7,
  routeData = null,
  isochroneData = null,
  activeFilters = {},
  collaborationMarkers = [],
  moduleLayerData = null,
}: MapViewProps) => {
  const [localClickLocation, setLocalClickLocation] = useState<LatLng | null>(null);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);

  const normalizedCenter = toLatLng(center);
  const activeClickLocation = toLatLng(localClickLocation ?? clickedLocation);
  const normalizedUserLocation = toLatLng(userLocation);

  // Route helpers
  const routeOrigin = toLatLng(routeData?.origin as Record<string, unknown> | null);
  const routeDestination = toLatLng(routeData?.destination as Record<string, unknown> | null);
  const isochroneGeojson = (isochroneData as Record<string, unknown>)?.isochrone_geojson ?? isochroneData;

  const moduleLayer = moduleLayerData as ModuleLayerData | null;

  // Layer data hook
  const { geoData } = useMapLayers({
    layers,
    activeFilters: activeFilters as Record<string, { conditions?: unknown[]; logic?: string }>,
    onLayerLoading,
  });

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

  const layerIds = Array.isArray(layers) ? layers : [];
  const dataLayers: (React.ReactElement | null)[] = layerIds.map((layerId) => {
    const data = geoData[layerId] as { geojson?: GeoJSON.FeatureCollection; dataset?: { name: string } | null } | undefined;
    if (!data?.geojson) return null;
    return (
      <LayersControl.Overlay key={layerId} name={layerId.replace(/-/g, ' ').toUpperCase()} checked={true}>
        <LayerGroup>
          <EnhancedGeoJSONLayer
            data={data.geojson}
            layerId={layerId}
            datasetInfo={data.dataset ?? null}
            opacity={layerOpacity}
            onFeatureClick={onFeatureClick}
            onFeatureHover={onFeatureHover}
          />
        </LayerGroup>
      </LayersControl.Overlay>
    );
  });

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

          {/* Data layers */}
          {dataLayers}

          {/* Route Layer */}
          {routeOrigin && routeDestination && routeData?.route_geojson && (
            <LayersControl.Overlay checked name="Active Route">
              <LayerGroup>
                <GeoJSON
                  key={`route-${Date.now()}`}
                  data={routeData.route_geojson as GeoJSON.FeatureCollection}
                  style={{ color: '#3b82f6', weight: 5, opacity: 0.8 }}
                />
                <Marker position={[routeOrigin.lat, routeOrigin.lng]} icon={locationMarkerIcon}>
                  <Popup>Origin: {String((routeData.origin as Record<string, unknown>)?.name ?? 'Origin')}</Popup>
                </Marker>
                <Marker position={[routeDestination.lat, routeDestination.lng]} icon={locationMarkerIcon}>
                  <Popup>Destination: {String((routeData.destination as Record<string, unknown>)?.name ?? 'Destination')}</Popup>
                </Marker>
              </LayerGroup>
            </LayersControl.Overlay>
          )}

          {/* Isochrone Layer */}
          {isochroneGeojson && (
            <LayersControl.Overlay checked name="Isochrone">
              <GeoJSON
                key={`iso-${Date.now()}`}
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
                    key={`module-geo-${Date.now()}`}
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
                    key={`module-choro-${Date.now()}`}
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
                        key={`transport-buffer-${idx}-${Date.now()}`}
                        data={buffer.polygon}
                        style={{ color: buffer.color, fillColor: buffer.color, fillOpacity: buffer.opacity, weight: 1 }}
                      />
                    ),
                  )}

                {moduleLayer.type === 'multi-layer' &&
                  moduleLayer.layers?.map((layerCfg, idx) => (
                    <GeoJSON
                      key={`env-layer-${idx}-${Date.now()}`}
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

