/**
 * Map3DView Component
 *
 * 3D map visualization using deck.gl for immersive spatial analysis
 */

import React, { useState, useCallback, useMemo } from 'react';
import DeckGL from '@deck.gl/react';
import { Map } from 'react-map-gl';
import {
  GeoJsonLayer,
  PolygonLayer,
  ScatterplotLayer,
  ArcLayer,
  GridLayer,
} from '@deck.gl/layers';
import {
  Maximize2,
  Minimize2,
  RotateCw,
  Home,
  Layers,
  Sun,
  Settings,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useMap3D } from '../hooks/useMap3D';
import BuildingExtrusionLayer from './BuildingExtrusionLayer';
import type { ViewState3D } from '../../../types/api-2026';
import '../../../styles/visualization-3d.css';

interface Map3DViewProps {
  mapboxToken: string;
  onClose?: () => void;
  initialViewState?: ViewState3D;
  showControls?: boolean;
}

interface LayerVisibility {
  buildings: boolean;
  terrain: boolean;
  roads: boolean;
  parcels: boolean;
}

const MAPBOX_STYLE = 'mapbox://styles/mapbox/dark-v11';

const Map3DView: React.FC<Map3DViewProps> = ({
  mapboxToken,
  onClose,
  initialViewState,
  showControls = true,
}) => {
  const {
    viewState,
    setViewState,
    buildings,
    isLoading,
    actions,
    autoRotateEnabled,
  } = useMap3D({ initialViewState });

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [layerVisibility, setLayerVisibility] = useState<LayerVisibility>({
    buildings: true,
    terrain: true,
    roads: true,
    parcels: false,
  });
  const [showSettings, setShowSettings] = useState(false);
  const [lightingSettings, setLightingSettings] = useState({
    ambientRatio: 0.4,
    diffuseRatio: 0.6,
    sunAzimuth: 315,
    sunAltitude: 45,
  });

  const handleViewStateChange = useCallback(({ viewState: newViewState }: { viewState: ViewState3D }) => {
    setViewState(newViewState);
  }, [setViewState]);

  const handleResetView = useCallback(() => {
    actions.reset3DView();
  }, [actions]);

  const handleToggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  const handleToggleLayer = useCallback((layer: keyof LayerVisibility) => {
    setLayerVisibility(prev => ({
      ...prev,
      [layer]: !prev[layer],
    }));
  }, []);

  const handleLightingChange = useCallback((key: keyof typeof lightingSettings, value: number) => {
    setLightingSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // Building extrusion layer
  const buildingLayer = useMemo(() => {
    if (!layerVisibility.buildings || buildings.length === 0) return null;

    return new BuildingExtrusionLayer({
      id: 'buildings-3d',
      data: buildings,
      lighting: lightingSettings,
    });
  }, [buildings, layerVisibility.buildings, lightingSettings]);

  // Terrain grid layer for elevation visualization
  const terrainLayer = useMemo(() => {
    if (!layerVisibility.terrain) return null;

    return new GridLayer({
      id: 'terrain-grid',
      data: [], // Would be populated with elevation data
      pickable: true,
      extruded: true,
      cellSize: 100,
      elevationScale: 1,
      getPosition: (d: any) => d.coordinates,
      getElevation: (d: any) => d.elevation || 0,
      getFillColor: (d: any) => {
        const elevation = d.elevation || 0;
        const normalized = Math.min(elevation / 500, 1);
        return [
          Math.floor(255 * (1 - normalized)),
          Math.floor(255 * normalized),
          100,
          180,
        ];
      },
    });
  }, [layerVisibility.terrain]);

  // Road network layer
  const roadsLayer = useMemo(() => {
    if (!layerVisibility.roads) return null;

    return new GeoJsonLayer({
      id: 'roads-3d',
      data: '/api/geojson/roads', // API endpoint for road data
      pickable: true,
      stroked: true,
      filled: false,
      lineWidthMinPixels: 2,
      getLineColor: [255, 255, 255, 180],
      getLineWidth: 3,
    });
  }, [layerVisibility.roads]);

  // Parcel boundaries layer
  const parcelsLayer = useMemo(() => {
    if (!layerVisibility.parcels) return null;

    return new GeoJsonLayer({
      id: 'parcels-3d',
      data: '/api/geojson/parcels', // API endpoint for parcel data
      pickable: true,
      stroked: true,
      filled: true,
      lineWidthMinPixels: 1,
      getFillColor: [60, 180, 255, 50],
      getLineColor: [60, 180, 255, 180],
      getLineWidth: 1,
    });
  }, [layerVisibility.parcels]);

  const layers = useMemo(() => {
    return [
      terrainLayer,
      roadsLayer,
      parcelsLayer,
      buildingLayer,
    ].filter(Boolean);
  }, [terrainLayer, roadsLayer, parcelsLayer, buildingLayer]);

  return (
    <div className={`map-3d-container ${isFullscreen ? 'fullscreen' : ''}`}>
      {/* Header */}
      {showControls && (
        <div className="map-3d-header">
          <div className="header-title">
            <Layers size={20} />
            <h2>3D Visualization</h2>
            {isLoading && <span className="loading-indicator">Loading...</span>}
          </div>
          <div className="header-actions">
            <button
              className="icon-btn"
              onClick={handleToggleFullscreen}
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
            {onClose && (
              <button className="icon-btn" onClick={onClose} title="Close">
                ×
              </button>
            )}
          </div>
        </div>
      )}

      {/* DeckGL + Mapbox */}
      <div className="map-3d-wrapper">
        <DeckGL
          viewState={viewState}
          onViewStateChange={handleViewStateChange}
          controller={true}
          layers={layers}
          getTooltip={({ object }: any) => {
            if (object) {
              return {
                html: `<div class="deck-tooltip">
                  ${object.properties?.name || 'Building'}
                  ${object.properties?.height ? `<br/>Height: ${object.properties.height}m` : ''}
                </div>`,
              };
            }
            return null;
          }}
        >
          <Map
            mapboxAccessToken={mapboxToken}
            mapStyle={MAPBOX_STYLE}
            terrain={{ source: 'mapbox-dem', exaggeration: 1.5 }}
          />
        </DeckGL>
      </div>

      {/* Control Panel */}
      {showControls && (
        <div className="map-3d-controls">
          {/* View Controls */}
          <div className="control-section">
            <h3>View</h3>
            <div className="control-buttons">
              <button
                className="control-btn"
                onClick={handleResetView}
                title="Reset view"
              >
                <Home size={18} />
                <span>Reset</span>
              </button>
              <button
                className={`control-btn ${autoRotateEnabled ? 'active' : ''}`}
                onClick={actions.toggleAutoRotate}
                title="Toggle auto-rotate"
              >
                <RotateCw size={18} />
                <span>Rotate</span>
              </button>
              <button
                className={`control-btn ${showSettings ? 'active' : ''}`}
                onClick={() => setShowSettings(!showSettings)}
                title="Settings"
              >
                <Settings size={18} />
                <span>Settings</span>
              </button>
            </div>
          </div>

          {/* Layer Toggles */}
          <div className="control-section">
            <h3>Layers</h3>
            <div className="layer-toggles">
              {Object.entries(layerVisibility).map(([key, visible]) => (
                <button
                  key={key}
                  className={`layer-toggle ${visible ? 'active' : ''}`}
                  onClick={() => handleToggleLayer(key as keyof LayerVisibility)}
                >
                  {visible ? <Eye size={16} /> : <EyeOff size={16} />}
                  <span>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Camera Info */}
          <div className="control-section">
            <h3>Camera</h3>
            <div className="camera-info">
              <div className="info-item">
                <span className="info-label">Pitch:</span>
                <span className="info-value">{Math.round(viewState.pitch)}°</span>
              </div>
              <div className="info-item">
                <span className="info-label">Bearing:</span>
                <span className="info-value">{Math.round(viewState.bearing)}°</span>
              </div>
              <div className="info-item">
                <span className="info-label">Zoom:</span>
                <span className="info-value">{viewState.zoom.toFixed(1)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="settings-panel">
          <div className="settings-header">
            <div className="settings-title">
              <Sun size={18} />
              <h3>Lighting Settings</h3>
            </div>
            <button
              className="close-btn"
              onClick={() => setShowSettings(false)}
            >
              ×
            </button>
          </div>

          <div className="settings-content">
            <div className="setting-item">
              <label>
                <span>Ambient Light</span>
                <span className="setting-value">
                  {Math.round(lightingSettings.ambientRatio * 100)}%
                </span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={lightingSettings.ambientRatio}
                onChange={(e) => handleLightingChange('ambientRatio', parseFloat(e.target.value))}
              />
            </div>

            <div className="setting-item">
              <label>
                <span>Diffuse Light</span>
                <span className="setting-value">
                  {Math.round(lightingSettings.diffuseRatio * 100)}%
                </span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={lightingSettings.diffuseRatio}
                onChange={(e) => handleLightingChange('diffuseRatio', parseFloat(e.target.value))}
              />
            </div>

            <div className="setting-item">
              <label>
                <span>Sun Azimuth</span>
                <span className="setting-value">{lightingSettings.sunAzimuth}°</span>
              </label>
              <input
                type="range"
                min="0"
                max="360"
                step="5"
                value={lightingSettings.sunAzimuth}
                onChange={(e) => handleLightingChange('sunAzimuth', parseFloat(e.target.value))}
              />
            </div>

            <div className="setting-item">
              <label>
                <span>Sun Altitude</span>
                <span className="setting-value">{lightingSettings.sunAltitude}°</span>
              </label>
              <input
                type="range"
                min="0"
                max="90"
                step="5"
                value={lightingSettings.sunAltitude}
                onChange={(e) => handleLightingChange('sunAltitude', parseFloat(e.target.value))}
              />
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="map-3d-legend">
        <h4>Building Height</h4>
        <div className="legend-gradient"></div>
        <div className="legend-labels">
          <span>0m</span>
          <span>50m</span>
          <span>100m+</span>
        </div>
      </div>
    </div>
  );
};

export default Map3DView;
