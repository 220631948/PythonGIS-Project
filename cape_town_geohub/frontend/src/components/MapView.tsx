import { useEffect, useState, useCallback, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  useMap,
  useMapEvents,
  Marker,
  Popup,
  ZoomControl,
  ScaleControl,
  LayersControl,
  LayerGroup,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import 'leaflet-minimap/dist/Control.MiniMap.min.css';
import 'leaflet-minimap';
import { BASEMAPS, BasemapConfig } from '../config/maps';

// Fix Leaflet marker icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const isFiniteNumber = (value: any) => Number.isFinite(Number(value));

interface LatLng {
  lat: number;
  lng: number;
}

interface LatLngCandidate {
  lat?: number | string;
  lng?: number | string;
  lon?: number | string;
  latitude?: number | string;
  longitude?: number | string;
}

const toLatLng = (candidate: LatLngCandidate | null | undefined): LatLng | null => {
  if (!candidate) return null;

  const lat = candidate.lat ?? candidate.latitude;
  const lng = candidate.lng ?? candidate.lon ?? candidate.longitude;
  const latNumber = Number(lat);
  const lngNumber = Number(lng);

  if (!Number.isFinite(latNumber) || !Number.isFinite(lngNumber)) return null;
  return { lat: latNumber, lng: lngNumber };
};

const hasFiniteCoords = (coords: any): boolean => {
  if (!Array.isArray(coords)) return false;

  if (typeof coords[0] === 'number' || typeof coords[0] === 'string') {
    return coords.length >= 2 && isFiniteNumber(coords[0]) && isFiniteNumber(coords[1]);
  }

  return coords.every(hasFiniteCoords);
};

const isValidGeoJSONFeature = (feature: any) => {
  const geometry = feature?.geometry;
  if (!geometry || geometry.coordinates == null) return false;
  return hasFiniteCoords(geometry.coordinates);
};

// Custom icons and markers
const clickMarkerIcon = L.divIcon({
  className: 'click-marker',
  html: '<div class="click-marker-inner"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

const locationMarkerIcon = L.divIcon({
  className: 'location-marker',
  html: '<div class="location-marker-inner"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

// Enhanced popup content formatter
const formatPopupContent = (feature: any, layerId: string, datasetInfo: any) => {
  const props = feature.properties;

  const formatters: { [key: string]: () => string } = {
    'services-layer': () => `
      <div class="popup-content services">
        <h4>${props.name || 'Settlement Area'}</h4>
        <div class="popup-stat">
          <span class="stat-label">Access Score</span>
          <span class="stat-value ${props.access_score > 70 ? 'good' : props.access_score > 40 ? 'medium' : 'poor'}">${props.access_score || 'N/A'}%</span>
        </div>
        ${props.water_access ? `<div class="popup-detail"><span>💧 Water:</span> ${props.water_access}</div>` : ''}
        ${props.electricity_access ? `<div class="popup-detail"><span>⚡ Electricity:</span> ${props.electricity_access}</div>` : ''}
        <div class="popup-actions">
          <button onclick="window.dispatchEvent(new CustomEvent('suitabilityAnalysis', {detail: {lat: ${feature.geometry.coordinates[1]}, lng: ${feature.geometry.coordinates[0]}}}))">
            Analyze Site
          </button>
        </div>
      </div>
    `,
    'safety-layer': () => `
      <div class="popup-content safety">
        <h4>${props.precinct || props.name || 'Precinct Area'}</h4>
        <div class="popup-stat">
          <span class="stat-label">Risk Level</span>
          <span class="stat-value ${props.risk_level?.toLowerCase() || 'unknown'}">${props.risk_level || 'Unknown'}</span>
        </div>
        ${props.crime_index ? `<div class="popup-detail"><span>Crime Index:</span> ${props.crime_index}</div>` : ''}
        <p class="popup-note">⚠️ Data aggregated at precinct level for privacy</p>
      </div>
    `,
    'flood-layer': () => `
      <div class="popup-content flood">
        <h4>${props.suburb || props.name || 'Suburb'}</h4>
        <div class="popup-stat">
          <span class="stat-label">Flood Risk</span>
          <span class="stat-value">${props.risk_percentage || 0}%</span>
        </div>
        ${props.flood_zone ? `<div class="popup-detail"><span>Zone:</span> ${props.flood_zone}</div>` : ''}
      </div>
    `,
    'zoning-layer': () => `
      <div class="popup-content zoning">
        <h4>${props.zone_name || props.name || 'Zone'}</h4>
        ${props.zone_type ? `<div class="popup-detail"><span>Type:</span> ${props.zone_type}</div>` : ''}
        ${props.land_use ? `<div class="popup-detail"><span>Land Use:</span> ${props.land_use}</div>` : ''}
      </div>
    `,
    'default': () => `
      <div class="popup-content default">
        <h4>${props.name || datasetInfo?.name || 'Feature'}</h4>
        ${Object.entries(props).slice(0, 5).map(([key, value]) =>
      `<div class="popup-detail"><span>${key}:</span> ${String(value)}</div>`
    ).join('')}
        ${Object.keys(props).length > 5 ? '<div class="popup-note">...and more properties</div>' : ''}
      </div>
    `
  };

  const formatter = formatters[layerId] ?? formatters['default'];
  return formatter ? formatter() : '';
};

// Enhanced layer styling with better colors and patterns
const getLayerStyle = (layerId: string, feature: any, opacity: number = 0.7) => {
  const styles: { [key: string]: any } = {
    'services-layer': {
      color: feature.properties.access_score > 70 ? '#22c55e' :
        feature.properties.access_score > 40 ? '#f97316' : '#ef4444',
      weight: 2,
      fillOpacity: opacity,
      opacity: 0.8
    },
    'safety-layer': {
      color: feature.properties.risk_level === 'High' ? '#ef4444' :
        feature.properties.risk_level === 'Medium' ? '#f97316' : '#fef08a',
      weight: 1,
      fillOpacity: opacity,
      opacity: 0.7
    },
    'flood-layer': {
      color: '#3b82f6',
      weight: 1,
      fillOpacity: opacity * 0.8,
      opacity: 0.7,
      dashArray: '5, 5'
    },
    'zoning-layer': {
      color: '#a855f7',
      weight: 1,
      fillOpacity: opacity * 0.6,
      opacity: 0.6
    },
    'biodiversity_network': {
      color: '#22c55e',
      weight: 2,
      fillOpacity: opacity * 0.4,
      opacity: 0.8,
      dashArray: '10, 5'
    },
    'wetlands': {
      color: '#0ea5e9',
      weight: 1,
      fillOpacity: opacity * 0.6,
      opacity: 0.7
    },
    'protected_areas': {
      color: '#16a34a',
      weight: 2,
      fillOpacity: opacity * 0.5,
      opacity: 0.8
    },
    'development_focus_areas': {
      color: '#dc2626',
      weight: 3,
      fillOpacity: opacity * 0.3,
      opacity: 0.9,
      dashArray: '15, 5, 5, 5'
    }
  };

  return styles[layerId] || {
    color: '#6b7280',
    weight: 1,
    fillOpacity: opacity * 0.5,
    opacity: 0.6
  };
};

interface MapEventsProps {
  onMove: (_data: { lat: number; lng: number; zoom: number; bounds: L.LatLngBounds }) => void;
  onClick: (_latlng: LatLng) => void;
  onZoom?: (_zoom: number) => void;
  onLocationFound?: (_latlng: LatLng) => void;
}

// Enhanced map events with better interaction
function MapEvents({ onMove, onClick, onZoom, onLocationFound }: MapEventsProps) {
  useMapEvents({
    moveend: (e) => {
      const map = e.target;
      onMove({
        lat: map.getCenter().lat,
        lng: map.getCenter().lng,
        zoom: map.getZoom(),
        bounds: map.getBounds()
      });
    },
    click: (e) => {
      if (onClick) onClick(e.latlng);
      window.dispatchEvent(new CustomEvent('mapClick', { detail: e.latlng }));
    },
    zoomend: (e) => {
      if (onZoom) onZoom(e.target.getZoom());
    },
    locationfound: (e) => {
      if (onLocationFound) onLocationFound(e.latlng);
    }
  });
  return null;
}

interface MapControllerProps {
  center: LatLngCandidate;
  zoom?: number;
  flyTo: LatLngCandidate & { zoom?: number };
  basemap: string;
  onBasemapChange?: (_basemap: string) => void;
}

// Map controller with enhanced features
function MapController({ center, zoom, flyTo, basemap, onBasemapChange }: MapControllerProps) {
  const map = useMap();

  // Respond to explicit center prop changes by smoothly panning/flying the map
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

    map.flyTo([target.lat, target.lng], flyTo.zoom || 15, {
      duration: 1.5,
      easeLinearity: 0.25
    });
  }, [flyTo, map]);

  useEffect(() => {
    if (basemap && BASEMAPS[basemap]) {
      // Update basemap if needed
      const basemapConfig = BASEMAPS[basemap];
      const currentLayer = basemapConfig ? Object.values((map as { _layers: { [key: string]: L.Layer } })._layers).find((layer: L.Layer) =>
        layer instanceof L.TileLayer && layer.options.attribution === basemapConfig.attribution
      ) : null;
      if (!currentLayer) {
        // Basemap change would be handled by parent component
        if (onBasemapChange) onBasemapChange(basemap);
      }
    }
  }, [basemap, map, onBasemapChange]);

  return null;
}

interface DrawingToolsProps {
  onGeometryCreated?: (_data: { type: string; geometry: GeoJSON.Geometry; layer: L.Layer }) => void;
  onGeometryEdited?: (_layers: L.LayerGroup) => void;
  onGeometryDeleted?: (_layers: L.LayerGroup) => void;
}

// Drawing tools component
function DrawingTools({ onGeometryCreated, onGeometryEdited, onGeometryDeleted }: DrawingToolsProps) {
  const map = useMap();
  const drawControlRef = useRef<L.Control | null>(null);

  useEffect(() => {
    if (!map) return;

    // Initialize draw control
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    const drawControl = new (L.Control as any).Draw({
      position: 'topright',
      draw: {
        polyline: {
          shapeOptions: {
            color: '#3b82f6',
            weight: 3,
            opacity: 0.8
          }
        },
        polygon: {
          shapeOptions: {
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.2,
            weight: 2
          }
        },
        rectangle: {
          shapeOptions: {
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.2,
            weight: 2
          }
        },
        circle: {
          shapeOptions: {
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.2,
            weight: 2
          }
        },
        marker: {
          icon: locationMarkerIcon
        },
        circlemarker: false
      },
      edit: {
        featureGroup: drawnItems,
        remove: true
      }
    });

    map.addControl(drawControl);
    drawControlRef.current = drawControl;

    // Event handlers
    // Leaflet Draw events - casting event type to allow custom event shape
    map.on(L.Draw.Event.CREATED as any, (e) => {
      const { layer, layerType } = e as any as L.DrawEvents.Created;
      drawnItems.addLayer(layer);

      if (onGeometryCreated) {
        onGeometryCreated({
          type: layerType,
          geometry: (layer as any).toGeoJSON().geometry,
          layer: layer
        });
      }
    });

    map.on(L.Draw.Event.EDITED as any, (e) => {
      const { layers } = e as any as L.DrawEvents.Edited;
      if (onGeometryEdited) onGeometryEdited(layers);
    });

    map.on(L.Draw.Event.DELETED as any, (e) => {
      const { layers } = e as any as L.DrawEvents.Deleted;
      if (onGeometryDeleted) onGeometryDeleted(layers);
    });

    return () => {
      if (drawControlRef.current) {
        map.removeControl(drawControlRef.current);
      }
      map.removeLayer(drawnItems);
    };
  }, [map, onGeometryCreated, onGeometryEdited, onGeometryDeleted]);


  return null;
}

// Fullscreen control
function FullscreenControl() {
  const map = useMap();

  useEffect(() => {
    if (!map || !L.control.fullscreen) return;

    const fullscreenControl = L.control.fullscreen({
      position: 'topright',
      title: 'Enter fullscreen',
      titleCancel: 'Exit fullscreen'
    });

    map.addControl(fullscreenControl);

    return () => {
      map.removeControl(fullscreenControl);
    };
  }, [map]);

  return null;
}

interface LocationControlProps {
  onLocationFound?: (_latlng: LatLng) => void;
}

// Location control
function LocationControl({ onLocationFound }: LocationControlProps) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    // Simple location button (fallback since leaflet.locatecontrol is not available)
    const locationButton = L.Control.extend({
      options: {
        position: 'topright'
      },

      onAdd: function (map: L.Map) {
        const container = L.DomUtil.create('div', 'leaflet-control-locate leaflet-bar leaflet-control');
        const link = L.DomUtil.create('a', 'leaflet-bar-part leaflet-bar-part-single', container);
        link.title = 'Show my location';
        link.innerHTML = '📍';
        link.href = '#';

        L.DomEvent.on(link, 'click', L.DomEvent.stopPropagation)
          .on(link, 'click', L.DomEvent.preventDefault)
          .on(link, 'click', function () {
            map.locate({ setView: true, maxZoom: 16 });
          });

        return container;
      }
    });

    const locateControl = new locationButton();
    map.addControl(locateControl);

    // Listen for location found
    map.on('locationfound', (e) => {
      if (onLocationFound) onLocationFound(e.latlng);
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

interface MinimapControlProps {
  basemap?: string;
}

// Minimap control
function MinimapControl({ basemap = 'streets' }: MinimapControlProps) {
  const map = useMap();

  useEffect(() => {
    if (!map || !(L.Control as any).MiniMap) return;

    const basemapConfig: BasemapConfig = (BASEMAPS[basemap] ?? BASEMAPS.streets)!;
    const minimapLayer = L.tileLayer(basemapConfig.url, {
      attribution: basemapConfig.attribution,
      subdomains: 'abcd'
    });

    const minimap = new (L.Control as any).MiniMap(minimapLayer, {
      position: 'bottomright',
      width: 150,
      height: 150,
      collapsedWidth: 24,
      collapsedHeight: 24,
      zoomLevelOffset: -5,
      toggleDisplay: true
    });

    map.addControl(minimap);

    return () => {
      map.removeControl(minimap);
    };
  }, [map, basemap]);

  return null;
}

interface EnhancedGeoJSONLayerProps {
  data: any;
  layerId: string;
  datasetInfo: any;
  opacity?: number;
  onFeatureClick?: (_feature: any, _event: any) => void;
  onFeatureHover?: (_feature: any, _hovering: boolean) => void;
}

// Enhanced GeoJSON layer with better styling and interactions
function EnhancedGeoJSONLayer({
  data,
  layerId,
  datasetInfo,
  opacity = 0.7,
  onFeatureClick,
  onFeatureHover
}: EnhancedGeoJSONLayerProps) {
  const map = useMap();
  const layerRef = useRef<L.GeoJSON | null>(null);

  useEffect(() => {
    if (!data || !data.features) return;

    const geoJsonLayer = L.geoJSON(data, {
      filter: isValidGeoJSONFeature,
      style: (feature) => getLayerStyle(layerId, feature, opacity),
      onEachFeature: (feature, layer) => {
        // Enhanced popup
        const popupContent = formatPopupContent(feature, layerId, datasetInfo);
        layer.bindPopup(popupContent, {
          maxWidth: 300,
          className: 'custom-popup'
        });

        // Hover effects
        layer.on('mouseover', (e: any) => {
          const targetLayer = e.target;
          if (targetLayer.setStyle) {
            targetLayer.setStyle({
              weight: getLayerStyle(layerId, feature, opacity).weight + 2,
              fillOpacity: Math.min(opacity + 0.2, 1)
            });
          }
          if (onFeatureHover) onFeatureHover(feature, true);
        });

        layer.on('mouseout', (e: any) => {
          const targetLayer = e.target;
          if (targetLayer.setStyle) {
            targetLayer.setStyle(getLayerStyle(layerId, feature, opacity));
          }
          if (onFeatureHover) onFeatureHover(feature, false);
        });

        layer.on('click', (e) => {
          if (onFeatureClick) onFeatureClick(feature, e);
        });
      },
      pointToLayer: (_feature, latlng) => {
        // Custom point styling
        if (layerId.includes('stop') || layerId.includes('station')) {
          return L.circleMarker(latlng, {
            radius: 6,
            fillColor: '#3b82f6',
            color: '#ffffff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
          });
        }
        return L.marker(latlng, { icon: DefaultIcon });
      }
    });

    map.addLayer(geoJsonLayer);
    layerRef.current = geoJsonLayer;

    // Fit bounds if this is the first layer
    if (map.getBounds().isValid() && Object.keys((map as any)._layers).length === 1) {
      map.fitBounds(geoJsonLayer.getBounds().pad(0.1));
    }

    return () => {
      if (layerRef.current && map.hasLayer(layerRef.current)) {
        map.removeLayer(layerRef.current);
      }
    };
  }, [data, layerId, datasetInfo, opacity, map, onFeatureClick, onFeatureHover]);

  return null;
}

const collaborationIcon = L.divIcon({
  className: 'collaboration-marker',
  html: '<div class="collaboration-marker-inner">💬</div>',
  iconSize: [30, 30],
  iconAnchor: [15, 30]
});

interface MapViewProps {
  center: any;
  zoom?: number;
  layers?: string[];
  basemap?: string;
  onMapMove: (_data: { lat: number; lng: number; zoom: number; bounds: any }) => void;
  flyTo?: any;
  onLayerLoading?: (_id: string, _loading: boolean) => void;
  clickedLocation?: any;
  onBasemapChange?: (_basemap: string) => void;
  onLocationFound?: (_latlng: LatLng) => void;
  onGeometryCreated?: (_data: any) => void;
  onGeometryEdited?: (_data: any) => void;
  onGeometryDeleted?: (_data: any) => void;
  onFeatureClick?: (_feature: any, _event: any) => void;
  onFeatureHover?: (_feature: any, _hovering: boolean) => void;
  showDrawingTools?: boolean;
  showFullscreen?: boolean;
  showLocation?: boolean;
  showMinimap?: boolean;
  layerOpacity?: number;
  routeData?: any;
  isochroneData?: any;
  activeFilters?: { [key: string]: any };
  collaborationMarkers?: any[];
  moduleLayerData?: any;
}

// Main enhanced MapView component
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
  moduleLayerData = null
}: MapViewProps) => {
  const [geoData, setGeoData] = useState<{ [key: string]: any }>({});
  const [localClickLocation, setLocalClickLocation] = useState<LatLng | null>(null);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const normalizedCenter = toLatLng(center);
  const activeClickLocation = toLatLng(localClickLocation || clickedLocation);
  const normalizedUserLocation = toLatLng(userLocation);
  const routeOrigin = toLatLng(routeData?.origin);
  const routeDestination = toLatLng(routeData?.destination);
  const isochroneGeojson = isochroneData?.isochrone_geojson ?? isochroneData;

  // Define fetch functions BEFORE useEffect that uses them
  const fetchLayerData = useCallback(async (id: string) => {
    if (onLayerLoading) onLayerLoading(id, true);

    try {
      const response = await fetch(`/api/portal/datasets/${id}/geojson`);
      if (response.ok) {
        const data = await response.json();
        const normalized = data.geojson ? data : { geojson: data, dataset: { name: id } };
        setGeoData(prev => ({ ...prev, [id]: normalized }));
      }
    } catch (error) {
      console.error(`Error fetching layer ${id}:`, error);
    } finally {
      if (onLayerLoading) onLayerLoading(id, false);
    }
  }, [onLayerLoading]);

  const fetchFilteredLayerData = useCallback(async (id: string, filterData: any) => {
    if (onLayerLoading) onLayerLoading(id, true);
    try {
      const response = await fetch('/api/filter/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataset: id,
          conditions: filterData.conditions || [],
          logic: filterData.logic || 'and'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setGeoData(prev => ({ ...prev, [id]: { geojson: data.geojson, dataset: { name: id } } }));
      }
    } catch (error) {
      console.error(`Error fetching filtered layer ${id}:`, error);
    } finally {
      if (onLayerLoading) onLayerLoading(id, false);
    }
  }, [onLayerLoading]);

  // Fetch layer data - now uses the functions defined above
  useEffect(() => {
    layers.forEach(layerId => {
      if (activeFilters && activeFilters[layerId]) {
        fetchFilteredLayerData(layerId, activeFilters[layerId]);
      } else {
        // Use functional update to check geoData without adding it to dependencies
        setGeoData(prev => {
          if (!prev[layerId]) {
            fetchLayerData(layerId);
          }
          return prev;
        });
      }
    });

    // Cleanup inactive layers
    setGeoData(prev => {
      const next = { ...prev };
      let changed = false;
      Object.keys(next).forEach(key => {
        if (!layers.includes(key)) {
          delete next[key];
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [layers, activeFilters, fetchFilteredLayerData, fetchLayerData]);

  const handleMapClick = useCallback((latlng: LatLng) => {
    const normalized = toLatLng(latlng);
    if (normalized) {
      setLocalClickLocation(normalized);
    }
  }, []);

  const handleLocationFound = useCallback((latlng: LatLng) => {
    const normalized = toLatLng(latlng);
    if (!normalized) return;
    setUserLocation(normalized);
    if (onLocationFound) onLocationFound(normalized);
  }, [onLocationFound]);

  const basemapConfig: BasemapConfig = (BASEMAPS[basemap] ?? BASEMAPS.streets)!;

  // Safety check for Leaflet coordinates
  if (!normalizedCenter) {
    return (
      <div className="map-error-fallback" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        background: '#f3f4f6',
        color: '#6b7280'
      }}>
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
        zoom={zoom || 11}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        attributionControl={true}
      >
        {/* Basemap */}
        <TileLayer
          attribution={basemapConfig.attribution}
          url={basemapConfig.url}
          subdomains="abcd"
        />

        {/* Controls */}
        <ZoomControl position="bottomright" />
        <ScaleControl position="bottomleft" />

        {/* Enhanced controls */}
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

        {/* Map events */}
        <MapEvents
          onMove={onMapMove}
          onClick={handleMapClick}
          onLocationFound={handleLocationFound}
        />

        {/* Map controller */}
        <MapController
          center={center}
          zoom={zoom}
          flyTo={flyTo}
          basemap={basemap}
          onBasemapChange={onBasemapChange}
        />

        {/* Data layers */}
        <LayersControl position="topleft">
          {/* Base layers */}
          {Object.entries(BASEMAPS).filter(([key]) => key !== 'light').map(([key, config]) => (
            <LayersControl.BaseLayer key={key} name={config.name} checked={key === basemap}>
              <TileLayer
                attribution={config.attribution}
                url={config.url}
                subdomains="abcd"
              />
            </LayersControl.BaseLayer>
          ))}

          {/* Data layers */}
          {layers.map(layerId => {
            const data = geoData[layerId];
            if (!data || !data.geojson) return null;

            return (
              <LayersControl.Overlay key={layerId} name={layerId.replace(/-/g, ' ').toUpperCase()} checked={true}>
                <LayerGroup>
                  <EnhancedGeoJSONLayer
                    data={data.geojson}
                    layerId={layerId}
                    datasetInfo={data.dataset}
                    opacity={layerOpacity}
                    onFeatureClick={onFeatureClick}
                    onFeatureHover={onFeatureHover}
                  />
                </LayerGroup>
              </LayersControl.Overlay>
            );
          })}

          {/* Route Layer */}
          {routeOrigin && routeDestination && routeData?.route_geojson && (
            <LayersControl.Overlay checked name="Active Route">
              <LayerGroup>
                <GeoJSON
                  key={`route-${Date.now()}`}
                  data={routeData.route_geojson}
                  style={{ color: '#3b82f6', weight: 5, opacity: 0.8 }}
                />
                <Marker position={[routeOrigin.lat, routeOrigin.lng]} icon={locationMarkerIcon}>
                  <Popup>Origin: {routeData.origin?.name || 'Origin'}</Popup>
                </Marker>
                <Marker position={[routeDestination.lat, routeDestination.lng]} icon={locationMarkerIcon}>
                  <Popup>Destination: {routeData.destination?.name || 'Destination'}</Popup>
                </Marker>
              </LayerGroup>
            </LayersControl.Overlay>
          )}

          {/* Isochrone Layer */}
          {isochroneGeojson && (
            <LayersControl.Overlay checked name="Isochrone">
              <GeoJSON
                key={`iso-${Date.now()}`}
                data={isochroneGeojson}
                style={{
                  color: '#8b5cf6',
                  weight: 2,
                  opacity: 0.8,
                  fillColor: '#a78bfa',
                  fillOpacity: 0.3
                }}
              />
            </LayersControl.Overlay>
          )}

          {/* Module Layers (Phase 2-4) */}
          {moduleLayerData && (
            <LayersControl.Overlay checked name="Module Analysis">
              <LayerGroup>
                {/* Standard GeoJSON */}
                {(moduleLayerData.type === 'FeatureCollection' || moduleLayerData.type === 'geojson') && (
                  <GeoJSON
                    key={`module-geo-${Date.now()}`}
                    data={moduleLayerData.data || moduleLayerData} // Handle both formats
                    style={(feature) => (moduleLayerData.style ? moduleLayerData.style(feature) : {
                      color: feature?.properties.color || '#3b82f6',
                      weight: 2,
                      opacity: 0.8
                    })}
                    onEachFeature={(feature, layer) => {
                      if (moduleLayerData.popup) {
                        layer.bindPopup(moduleLayerData.popup(feature));
                      } else if (feature.properties.name) {
                        layer.bindPopup(feature.properties.name);
                      }
                    }}
                  />
                )}

                {/* Choropleth (Safety) */}
                {moduleLayerData.type === 'choropleth' && (
                  <GeoJSON
                    key={`module-choro-${Date.now()}`}
                    data={moduleLayerData.data}
                    style={(feature) => ({
                      fillColor: moduleLayerData.colorFn(feature?.properties.crime_index),
                      weight: 2,
                      opacity: 1,
                      color: 'white',
                      fillOpacity: 0.7
                    })}
                    onEachFeature={(feature, layer) => {
                      layer.bindPopup(`
                        <div class="p-2">
                          <strong>${feature.properties.name}</strong><br/>
                          Index: ${feature.properties.crime_index}
                        </div>
                      `);
                    }}
                  />
                )}

                {/* Transport Buffers */}
                {moduleLayerData.buffers && (
                  <>
                    {moduleLayerData.buffers.map((buffer: any, idx: number) => (
                      <GeoJSON
                        key={`transport-buffer-${idx}-${Date.now()}`}
                        data={buffer.polygon}
                        style={{
                          color: buffer.color,
                          fillColor: buffer.color,
                          fillOpacity: buffer.opacity,
                          weight: 1
                        }}
                      />
                    ))}
                    {/* Center Point */}
                    {moduleLayerData.center && !isNaN(moduleLayerData.center[0]) && !isNaN(moduleLayerData.center[1]) && (
                      <Marker position={[moduleLayerData.center[1], moduleLayerData.center[0]]} />
                    )}
                  </>
                )}

                {/* Multi-Layer (Environment) */}
                {moduleLayerData.type === 'multi-layer' && (moduleLayerData.layers as any[]).map((layer, idx) => (
                  <GeoJSON
                    key={`env-layer-${idx}-${Date.now()}`}
                    data={layer.data}
                    style={layer.style}
                    onEachFeature={(feature, layerInstance) => {
                      if (layer.popup) {
                        layerInstance.bindPopup(layer.popup(feature));
                      }
                    }}
                  />
                ))}
              </LayerGroup>
            </LayersControl.Overlay>
          )}
        </LayersControl>

        {/* Collaboration Markers */}
        {collaborationMarkers.map((marker, idx) => {
          const normalized = toLatLng(marker.location ?? marker);
          if (!normalized) return null;

          return (
            <Marker
              key={marker.id || idx}
              position={[normalized.lat, normalized.lng]}
              icon={collaborationIcon}
            >
              <Popup>
                <div className="collaboration-popup">
                  <h4>{marker.author || 'Contributor'}</h4>
                  <p>{marker.text || marker.description}</p>
                  {marker.timestamp && (
                    <span className="popup-time">{new Date(marker.timestamp).toLocaleString()}</span>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Click marker */}
        {activeClickLocation && (
          <Marker
            position={[
              activeClickLocation.lat,
              activeClickLocation.lng
            ]}
            icon={clickMarkerIcon}
          >
            <Popup>
              <div className="popup-content click-location">
                <h4>Selected Location</h4>
                <p>Lat: {activeClickLocation.lat.toFixed(5)}</p>
                <p>Lng: {activeClickLocation.lng.toFixed(5)}</p>
                <button
                  className="popup-button"
                  onClick={() => window.dispatchEvent(new CustomEvent('suitabilityAnalysis', {
                    detail: { lat: activeClickLocation.lat, lng: activeClickLocation.lng }
                  }))}
                >
                  Analyze Site Suitability
                </button>
              </div>
            </Popup>
          </Marker>
        )}

        {/* User location marker */}
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
