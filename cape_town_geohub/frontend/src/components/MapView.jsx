import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  FeatureGroup
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import 'leaflet-minimap/dist/Control.MiniMap.min.css';
import 'leaflet-minimap';

// Fix Leaflet marker icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

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

// Basemap options
const BASEMAPS = {
  streets: {
    name: 'Streets',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '© OpenStreetMap, © CARTO'
  },
  aerial: {
    name: 'Aerial Imagery',
    url: 'https://citymaps.capetown.gov.za/agsext1/rest/services/Imagery/Aerial_2023/MapServer/tile/{z}/{y}/{x}',
    attribution: 'City of Cape Town GIS'
  },
  satellite: {
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Esri, Maxar, Earthstar Geographics, CNES/Airbus DS, USDA FSA, USGS, Aerogrid, IGN, IGP, and the GIS User Community'
  },
  dark: {
    name: 'Dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '© OpenStreetMap, © CARTO'
  },
  terrain: {
    name: 'Terrain',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Esri, USGS, NOAA'
  }
};

// Enhanced popup content formatter
const formatPopupContent = (feature, layerId, datasetInfo) => {
  const props = feature.properties;

  const formatters = {
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

  return formatters[layerId] ? formatters[layerId]() : formatters['default']();
};

// Enhanced layer styling with better colors and patterns
const getLayerStyle = (layerId, feature, opacity = 0.7) => {
  const styles = {
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

// Enhanced map events with better interaction
function MapEvents({ onMove, onClick, onZoom, onLocationFound }) {
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

// Map controller with enhanced features
function MapController({ center, zoom, flyTo, basemap, onBasemapChange }) {
  const map = useMap();

  useEffect(() => {
    if (flyTo) {
      map.flyTo([flyTo.lat, flyTo.lng], flyTo.zoom || 15, {
        duration: 1.5,
        easeLinearity: 0.25
      });
    }
  }, [flyTo, map]);

  useEffect(() => {
    if (basemap && BASEMAPS[basemap]) {
      // Update basemap if needed
      const currentLayer = Object.values(map._layers).find(layer =>
        layer instanceof L.TileLayer && layer.options.attribution === BASEMAPS[basemap].attribution
      );
      if (!currentLayer) {
        // Basemap change would be handled by parent component
        if (onBasemapChange) onBasemapChange(basemap);
      }
    }
  }, [basemap, map, onBasemapChange]);

  return null;
}

// Drawing tools component
function DrawingTools({ onGeometryCreated, onGeometryEdited, onGeometryDeleted }) {
  const map = useMap();
  const drawControlRef = useRef(null);

  useEffect(() => {
    if (!map) return;

    // Initialize draw control
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    const drawControl = new L.Control.Draw({
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
    map.on(L.Draw.Event.CREATED, (e) => {
      const { layer, layerType } = e;
      drawnItems.addLayer(layer);

      if (onGeometryCreated) {
        onGeometryCreated({
          type: layerType,
          geometry: layer.toGeoJSON().geometry,
          layer: layer
        });
      }
    });

    map.on(L.Draw.Event.EDITED, (e) => {
      const { layers } = e;
      if (onGeometryEdited) onGeometryEdited(layers);
    });

    map.on(L.Draw.Event.DELETED, (e) => {
      const { layers } = e;
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

// Location control
function LocationControl({ onLocationFound }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    // Simple location button (fallback since leaflet.locatecontrol is not available)
    const locationButton = L.Control.extend({
      options: {
        position: 'topright'
      },

      onAdd: function (map) {
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

// Minimap control
function MinimapControl({ basemap = 'streets' }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !L.Control.MiniMap) return;

    const basemapConfig = BASEMAPS[basemap] || BASEMAPS.streets;
    const minimapLayer = L.tileLayer(basemapConfig.url, {
      attribution: basemapConfig.attribution,
      subdomains: 'abcd'
    });

    const minimap = new L.Control.MiniMap(minimapLayer, {
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

// Enhanced GeoJSON layer with better styling and interactions
function EnhancedGeoJSONLayer({
  data,
  layerId,
  datasetInfo,
  opacity = 0.7,
  onFeatureClick,
  onFeatureHover
}) {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    if (!data || !data.features) return;

    const geoJsonLayer = L.geoJSON(data, {
      style: (feature) => getLayerStyle(layerId, feature, opacity),
      onEachFeature: (feature, layer) => {
        // Enhanced popup
        const popupContent = formatPopupContent(feature, layerId, datasetInfo);
        layer.bindPopup(popupContent, {
          maxWidth: 300,
          className: 'custom-popup'
        });

        // Hover effects
        layer.on('mouseover', (e) => {
          const targetLayer = e.target;
          targetLayer.setStyle({
            weight: getLayerStyle(layerId, feature, opacity).weight + 2,
            fillOpacity: Math.min(opacity + 0.2, 1)
          });
          if (onFeatureHover) onFeatureHover(feature, true);
        });

        layer.on('mouseout', (e) => {
          const targetLayer = e.target;
          targetLayer.setStyle(getLayerStyle(layerId, feature, opacity));
          if (onFeatureHover) onFeatureHover(feature, false);
        });

        layer.on('click', (e) => {
          if (onFeatureClick) onFeatureClick(feature, e);
        });
      },
      pointToLayer: (feature, latlng) => {
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
    if (map.getBounds().isValid() && Object.keys(map._layers).length === 1) {
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
}) => {
  const [geoData, setGeoData] = useState({});
  const [localClickLocation, setLocalClickLocation] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  // Fetch layer data
  useEffect(() => {
    layers.forEach(layerId => {
      if (activeFilters && activeFilters[layerId]) {
        fetchFilteredLayerData(layerId, activeFilters[layerId]);
      } else if (!geoData[layerId]) {
        fetchLayerData(layerId);
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
  }, [layers, activeFilters]);

  const fetchLayerData = async (id) => {
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
  };

  const fetchFilteredLayerData = async (id, filterData) => {
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
  };

  const handleMapClick = useCallback((latlng) => {
    setLocalClickLocation(latlng);
  }, []);

  const handleLocationFound = useCallback((latlng) => {
    setUserLocation(latlng);
    if (onLocationFound) onLocationFound(latlng);
  }, [onLocationFound]);

  const basemapConfig = BASEMAPS[basemap] || BASEMAPS.streets;

  return (
    <div className="enhanced-map-container">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
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
          {Object.entries(BASEMAPS).map(([key, config]) => (
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
          {routeData && (
            <LayersControl.Overlay checked name="Active Route">
              <LayerGroup>
                <GeoJSON
                  key={`route-${Date.now()}`}
                  data={routeData.route_geojson}
                  style={{ color: '#3b82f6', weight: 5, opacity: 0.8 }}
                />
                <Marker position={[routeData.origin.lat, routeData.origin.lon]} icon={locationMarkerIcon}>
                  <Popup>Origin: {routeData.origin.name}</Popup>
                </Marker>
                <Marker position={[routeData.destination.lat, routeData.destination.lon]} icon={locationMarkerIcon}>
                  <Popup>Destination: {routeData.destination.name}</Popup>
                </Marker>
              </LayerGroup>
            </LayersControl.Overlay>
          )}

          {/* Isochrone Layer */}
          {isochroneData && (
            <LayersControl.Overlay checked name="Isochrone">
              <GeoJSON
                key={`iso-${Date.now()}`}
                data={isochroneData.isochrone_geojson}
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
                      color: feature.properties.color || '#3b82f6',
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
                      fillColor: moduleLayerData.colorFn(feature.properties.crime_index),
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
                    {moduleLayerData.buffers.map((buffer, idx) => (
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
                    {moduleLayerData.center && (
                      <Marker position={[moduleLayerData.center[1], moduleLayerData.center[0]]} />
                    )}
                  </>
                )}

                {/* Multi-Layer (Environment) */}
                {moduleLayerData.type === 'multi-layer' && moduleLayerData.layers.map((layer, idx) => (
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
        {collaborationMarkers.map(marker => (
          <Marker
            key={marker.id}
            position={[marker.lat, marker.lon]}
            icon={collaborationIcon}
          >
            <Popup>
              <div className="collaboration-popup">
                <h4>{marker.author}</h4>
                <p>{marker.text}</p>
                <span className="popup-time">{new Date(marker.timestamp).toLocaleString()}</span>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Click marker */}
        {(localClickLocation || clickedLocation) && (
          <Marker
            position={[
              (localClickLocation || clickedLocation).lat,
              (localClickLocation || clickedLocation).lng
            ]}
            icon={clickMarkerIcon}
          >
            <Popup>
              <div className="popup-content click-location">
                <h4>Selected Location</h4>
                <p>Lat: {(localClickLocation || clickedLocation).lat.toFixed(5)}</p>
                <p>Lng: {(localClickLocation || clickedLocation).lng.toFixed(5)}</p>
                <button
                  className="popup-button"
                  onClick={() => window.dispatchEvent(new CustomEvent('suitabilityAnalysis', {
                    detail: { lat: (localClickLocation || clickedLocation).lat, lng: (localClickLocation || clickedLocation).lng }
                  }))}
                >
                  Analyze Site Suitability
                </button>
              </div>
            </Popup>
          </Marker>
        )}

        {/* User location marker */}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={locationMarkerIcon}>
            <Popup>
              <div className="popup-content user-location">
                <h4>Your Location</h4>
                <p>Lat: {userLocation.lat.toFixed(5)}</p>
                <p>Lng: {userLocation.lng.toFixed(5)}</p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

export default MapView;
export { BASEMAPS };
