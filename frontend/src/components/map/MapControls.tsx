/**
 * MapControls — Reusable Leaflet map controls
 * DrawingTools, FullscreenControl, LocationControl, MinimapControl
 */
import { useEffect, useRef } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import 'leaflet-minimap/dist/Control.MiniMap.min.css';
import 'leaflet-minimap';

import type { LatLng, LatLngCandidate } from './mapUtils';
import { toLatLng, locationMarkerIcon } from './mapUtils';
import { BASEMAPS, BasemapConfig } from '../../config/maps';

// ── MapEvents ──

interface MapEventsProps {
  onMove: (data: { lat: number; lng: number; zoom: number; bounds: L.LatLngBounds }) => void;
  onClick: (latlng: LatLng) => void;
  onZoom?: (zoom: number) => void;
  onLocationFound?: (latlng: LatLng) => void;
}

export function MapEvents({ onMove, onClick, onZoom, onLocationFound }: MapEventsProps) {
  useMapEvents({
    moveend: (e) => {
      const map = e.target;
      onMove({
        lat: map.getCenter().lat,
        lng: map.getCenter().lng,
        zoom: map.getZoom(),
        bounds: map.getBounds(),
      });
    },
    click: (e) => {
      if (onClick) onClick(e.latlng);
      window.dispatchEvent(new CustomEvent('mapClick', { detail: e.latlng }));
    },
    zoomend: (e) => {
      onZoom?.(e.target.getZoom());
    },
    locationfound: (e) => {
      onLocationFound?.(e.latlng);
    },
  });
  return null;
}

// ── MapController ──

interface MapControllerProps {
  center: LatLngCandidate;
  zoom?: number;
  flyTo: LatLngCandidate & { zoom?: number };
  basemap: string;
  onBasemapChange?: (basemap: string) => void;
}

export function MapController({ center, zoom, flyTo, basemap, onBasemapChange }: MapControllerProps) {
  const map = useMap();

  useEffect(() => {
    const normalizedCenter = toLatLng(center);
    if (!map || !normalizedCenter) return;

    const { lat, lng } = normalizedCenter;
    const currCenter = map.getCenter();
    if (Math.abs(currCenter.lat - lat) > 1e-6 || Math.abs(currCenter.lng - lng) > 1e-6) {
      const targetZoom = typeof zoom === 'number' ? zoom : map.getZoom();
      map.flyTo([lat, lng], targetZoom, { duration: 0.8, easeLinearity: 0.25 });
    }
  }, [center, zoom, map]);

  useEffect(() => {
    const target = toLatLng(flyTo);
    if (!target) return;
    map.flyTo([target.lat, target.lng], flyTo.zoom ?? 15, {
      duration: 1.5,
      easeLinearity: 0.25,
    });
  }, [flyTo, map]);

  useEffect(() => {
    if (basemap && BASEMAPS[basemap]) {
      const basemapConfig = BASEMAPS[basemap];
      const currentLayer = basemapConfig
        ? Object.values((map as unknown as { _layers: Record<string, L.Layer> })._layers).find(
            (layer: L.Layer) =>
              layer instanceof L.TileLayer && layer.options.attribution === basemapConfig.attribution,
          )
        : null;
      if (!currentLayer) {
        onBasemapChange?.(basemap);
      }
    }
  }, [basemap, map, onBasemapChange]);

  return null;
}

// ── DrawingTools ──

interface DrawingToolsProps {
  onGeometryCreated?: (data: { type: string; geometry: GeoJSON.Geometry; layer: L.Layer }) => void;
  onGeometryEdited?: (layers: L.LayerGroup) => void;
  onGeometryDeleted?: (layers: L.LayerGroup) => void;
}

export function DrawingTools({ onGeometryCreated, onGeometryEdited, onGeometryDeleted }: DrawingToolsProps) {
  const map = useMap();
  const drawControlRef = useRef<L.Control | null>(null);

  useEffect(() => {
    if (!map) return;

    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    const drawControl = new (L.Control as unknown as { Draw: new (opts: unknown) => L.Control }).Draw({
      position: 'topright',
      draw: {
        polyline: { shapeOptions: { color: '#3b82f6', weight: 3, opacity: 0.8 } },
        polygon: { shapeOptions: { color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.2, weight: 2 } },
        rectangle: { shapeOptions: { color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.2, weight: 2 } },
        circle: { shapeOptions: { color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.2, weight: 2 } },
        marker: { icon: locationMarkerIcon },
        circlemarker: false,
      },
      edit: { featureGroup: drawnItems, remove: true },
    });

    map.addControl(drawControl);
    drawControlRef.current = drawControl;

    map.on(L.Draw.Event.CREATED as string, (e: unknown) => {
      const { layer, layerType } = e as { layer: L.Layer; layerType: string };
      drawnItems.addLayer(layer);
      onGeometryCreated?.({
        type: layerType,
        geometry: (layer as L.Layer & { toGeoJSON: () => GeoJSON.Feature }).toGeoJSON().geometry,
        layer,
      });
    });

    map.on(L.Draw.Event.EDITED as string, (e: unknown) => {
      const { layers } = e as { layers: L.LayerGroup };
      onGeometryEdited?.(layers);
    });

    map.on(L.Draw.Event.DELETED as string, (e: unknown) => {
      const { layers } = e as { layers: L.LayerGroup };
      onGeometryDeleted?.(layers);
    });

    return () => {
      if (drawControlRef.current) map.removeControl(drawControlRef.current);
      map.removeLayer(drawnItems);
    };
  }, [map, onGeometryCreated, onGeometryEdited, onGeometryDeleted]);

  return null;
}

// ── FullscreenControl ──

export function FullscreenControl() {
  const map = useMap();

  useEffect(() => {
    if (!map || !L.control.fullscreen) return;

    const fullscreenControl = L.control.fullscreen({
      position: 'topright',
      title: 'Enter fullscreen',
      titleCancel: 'Exit fullscreen',
    });

    map.addControl(fullscreenControl);
    return () => {
      map.removeControl(fullscreenControl);
    };
  }, [map]);

  return null;
}

// ── LocationControl ──

interface LocationControlProps {
  onLocationFound?: (latlng: LatLng) => void;
}

export function LocationControl({ onLocationFound }: LocationControlProps) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const LocationButton = L.Control.extend({
      options: { position: 'topright' },
      onAdd: function (controlMap: L.Map) {
        const container = L.DomUtil.create('div', 'leaflet-control-locate leaflet-bar leaflet-control');
        const link = L.DomUtil.create('a', 'leaflet-bar-part leaflet-bar-part-single', container);
        link.title = 'Show my location';
        link.innerHTML = '📍';
        link.href = '#';

        L.DomEvent.on(link, 'click', L.DomEvent.stopPropagation)
          .on(link, 'click', L.DomEvent.preventDefault)
          .on(link, 'click', function () {
            controlMap.locate({ setView: true, maxZoom: 16 });
          });

        return container;
      },
    });

    const locateControl = new LocationButton();
    map.addControl(locateControl);

    map.on('locationfound', (e) => {
      onLocationFound?.(e.latlng);
    });

    map.on('locationerror', (e) => {
      console.warn('Location error:', e.message);
      alert('Unable to find your location. Please check your browser permissions.');
    });

    return () => {
      map.removeControl(locateControl);
    };
  }, [map, onLocationFound]);

  return null;
}

// ── MinimapControl ──

interface MinimapControlProps {
  basemap?: string;
}

export function MinimapControl({ basemap = 'streets' }: MinimapControlProps) {
  const map = useMap();

  useEffect(() => {
    if (!map || !(L.Control as unknown as Record<string, unknown>).MiniMap) return;

    const basemapConfig: BasemapConfig = (BASEMAPS[basemap] ?? BASEMAPS.streets)!;
    const minimapLayer = L.tileLayer(basemapConfig.url, {
      attribution: basemapConfig.attribution,
      subdomains: 'abcd',
    });

    const minimap = new (L.Control as unknown as { MiniMap: new (layer: L.TileLayer, opts: unknown) => L.Control }).MiniMap(minimapLayer, {
      position: 'bottomright',
      width: 150,
      height: 150,
      collapsedWidth: 24,
      collapsedHeight: 24,
      zoomLevelOffset: -5,
      toggleDisplay: true,
    });

    map.addControl(minimap);
    return () => {
      map.removeControl(minimap);
    };
  }, [map, basemap]);

  return null;
}
