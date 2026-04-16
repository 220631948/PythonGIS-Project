/**
 * ShadowAnalysisPanel Component
 *
 * Solar shadow analysis for urban planning and development impact assessment
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polygon, useMap } from 'react-leaflet';
import {
  Sun,
  Clock,
  Calendar,
  Play,
  Pause,
  SkipForward,
  Settings,
  Info,
  Download,
  X,
} from 'lucide-react';
import { useMap3D } from '../hooks/useMap3D';
import type { ShadowAnalysisRequest, ShadowAnalysisResult } from '../../../types/api-2026';
import '../../../styles/visualization-3d.css';

interface ShadowAnalysisPanelProps {
  buildingGeometry?: any;
  onClose?: () => void;
  defaultLocation?: [number, number];
}

const ShadowAnalysisPanel: React.FC<ShadowAnalysisPanelProps> = ({
  buildingGeometry,
  onClose,
  defaultLocation = [-33.9249, 18.4241], // Cape Town
}) => {
  const { shadowAnalysis, isLoading, error, actions } = useMap3D();

  const [analysisParams, setAnalysisParams] = useState<ShadowAnalysisRequest>({
    geometry: buildingGeometry || null,
    location: { lat: defaultLocation[0], lng: defaultLocation[1] },
    date: new Date().toISOString().split('T')[0],
    start_hour: 8,
    end_hour: 18,
    interval_minutes: 60,
    building_height: 30,
  });

  const [currentTimeIndex, setCurrentTimeIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1000);
  const [showSettings, setShowSettings] = useState(false);

  // Run analysis when parameters change
  const handleRunAnalysis = useCallback(() => {
    actions.analyzeShadows(analysisParams);
  }, [actions, analysisParams]);

  // Animation control
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isAnimating && shadowAnalysis) {
      interval = setInterval(() => {
        setCurrentTimeIndex(prev => {
          if (prev >= shadowAnalysis.shadow_polygons.length - 1) {
            setIsAnimating(false);
            return 0;
          }
          return prev + 1;
        });
      }, animationSpeed);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAnimating, shadowAnalysis, animationSpeed]);

  const handleToggleAnimation = useCallback(() => {
    setIsAnimating(prev => !prev);
  }, []);

  const handleNextFrame = useCallback(() => {
    if (shadowAnalysis) {
      setCurrentTimeIndex(prev =>
        Math.min(prev + 1, shadowAnalysis.shadow_polygons.length - 1)
      );
    }
  }, [shadowAnalysis]);

  const handleParamChange = useCallback((key: keyof ShadowAnalysisRequest, value: any) => {
    setAnalysisParams(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const handleExportReport = useCallback(() => {
    if (!shadowAnalysis) return;

    const report = {
      analysis_date: new Date().toISOString(),
      parameters: analysisParams,
      results: {
        total_shadow_area: shadowAnalysis.total_shadow_area,
        max_shadow_length: shadowAnalysis.max_shadow_length,
        affected_area: shadowAnalysis.affected_area,
        shadow_duration: shadowAnalysis.shadow_duration,
      },
      time_series: shadowAnalysis.shadow_polygons.map((sp, idx) => ({
        time: sp.time,
        shadow_area: sp.shadow_area,
        sun_altitude: sp.sun_altitude,
        sun_azimuth: sp.sun_azimuth,
      })),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shadow-analysis-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [shadowAnalysis, analysisParams]);

  // Current shadow data
  const currentShadow = useMemo(() => {
    if (!shadowAnalysis || shadowAnalysis.shadow_polygons.length === 0) {
      return null;
    }
    return shadowAnalysis.shadow_polygons[currentTimeIndex];
  }, [shadowAnalysis, currentTimeIndex]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!shadowAnalysis) return null;

    const shadows = shadowAnalysis.shadow_polygons;
    const areas = shadows.map(s => s.shadow_area);
    const avgArea = areas.reduce((sum, a) => sum + a, 0) / areas.length;

    return {
      totalArea: Math.round(shadowAnalysis.total_shadow_area),
      maxLength: Math.round(shadowAnalysis.max_shadow_length),
      affectedArea: Math.round(shadowAnalysis.affected_area),
      avgArea: Math.round(avgArea),
      duration: shadowAnalysis.shadow_duration,
      timePoints: shadows.length,
    };
  }, [shadowAnalysis]);

  // Shadow color based on intensity
  const getShadowColor = useCallback((opacity: number = 0.6) => {
    return `rgba(0, 0, 0, ${opacity})`;
  }, []);

  return (
    <div className="shadow-analysis-panel">
      {/* Header */}
      <div className="panel-header">
        <div className="header-title">
          <Sun size={20} />
          <h2>Shadow Analysis</h2>
          {isLoading && <span className="loading-indicator">Analyzing...</span>}
        </div>
        <div className="header-actions">
          <button
            className="icon-btn"
            onClick={handleExportReport}
            disabled={!shadowAnalysis}
            title="Export report"
            aria-label="Export report"
          >
            <Download size={16} />
          </button>
          <button
            className={`icon-btn ${showSettings ? 'active' : ''}`}
            onClick={() => setShowSettings(!showSettings)}
            title="Settings"
            aria-label="Toggle settings"
          >
            <Settings size={16} />
          </button>
          {onClose && (
            <button className="close-btn" onClick={onClose} aria-label="Close Shadow Analysis Panel">
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="panel-content">
        {/* Analysis Parameters */}
        <div className="analysis-params">
          <div className="param-section">
            <h3>Analysis Parameters</h3>
            <div className="params-grid">
              <div className="param-item">
                <label>
                  <Calendar size={14} />
                  <span>Date</span>
                </label>
                <input
                  type="date"
                  value={analysisParams.date}
                  onChange={e => handleParamChange('date', e.target.value)}
                  className="param-input"
                />
              </div>

              <div className="param-item">
                <label>
                  <Clock size={14} />
                  <span>Time Range</span>
                </label>
                <div className="time-range-inputs">
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={analysisParams.start_hour}
                    onChange={e => handleParamChange('start_hour', parseInt(e.target.value))}
                    className="param-input-sm"
                  />
                  <span>to</span>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={analysisParams.end_hour}
                    onChange={e => handleParamChange('end_hour', parseInt(e.target.value))}
                    className="param-input-sm"
                  />
                </div>
              </div>

              <div className="param-item">
                <label>
                  <Sun size={14} />
                  <span>Building Height (m)</span>
                </label>
                <input
                  type="number"
                  min="5"
                  max="200"
                  step="5"
                  value={analysisParams.building_height}
                  onChange={e => handleParamChange('building_height', parseFloat(e.target.value))}
                  className="param-input"
                />
              </div>

              <div className="param-item">
                <label>
                  <Clock size={14} />
                  <span>Interval (minutes)</span>
                </label>
                <select
                  value={analysisParams.interval_minutes}
                  onChange={e => handleParamChange('interval_minutes', parseInt(e.target.value))}
                  className="param-input"
                >
                  <option value={15}>15 min</option>
                  <option value={30}>30 min</option>
                  <option value={60}>1 hour</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>
            </div>

            <button
              className="btn-primary btn-full"
              onClick={handleRunAnalysis}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="spinner-sm" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Play size={16} />
                  <span>Run Analysis</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="error-banner">
            <Info size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Results */}
        {shadowAnalysis && (
          <>
            {/* Statistics */}
            <div className="shadow-stats">
              <div className="stat-card">
                <div className="stat-label">Total Shadow Area</div>
                <div className="stat-value">{stats?.totalArea}m²</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Max Shadow Length</div>
                <div className="stat-value">{stats?.maxLength}m</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Affected Area</div>
                <div className="stat-value">{stats?.affectedArea}m²</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Duration</div>
                <div className="stat-value">{stats?.duration}h</div>
              </div>
            </div>

            {/* Animation Controls */}
            <div className="animation-controls">
              <div className="time-display">
                <Clock size={16} />
                <span className="current-time">
                  {currentShadow?.time || '00:00'}
                </span>
                {currentShadow && (
                  <span className="sun-position">
                    Sun: {currentShadow.sun_altitude.toFixed(1)}° altitude,{' '}
                    {currentShadow.sun_azimuth.toFixed(1)}° azimuth
                  </span>
                )}
              </div>

              <div className="control-buttons">
                <button
                  className="control-btn"
                  onClick={handleToggleAnimation}
                  title={isAnimating ? 'Pause' : 'Play'}
                  aria-label={isAnimating ? 'Pause animation' : 'Play animation'}
                >
                  {isAnimating ? <Pause size={18} /> : <Play size={18} />}
                </button>
                <button
                  className="control-btn"
                  onClick={handleNextFrame}
                  disabled={isAnimating}
                  title="Next frame"
                  aria-label="Next frame"
                >
                  <SkipForward size={18} />
                </button>
              </div>

              <div className="timeline-slider">
                <input
                  type="range"
                  min="0"
                  max={shadowAnalysis.shadow_polygons.length - 1}
                  value={currentTimeIndex}
                  onChange={e => setCurrentTimeIndex(parseInt(e.target.value))}
                  className="slider"
                />
                <div className="timeline-labels">
                  <span>{shadowAnalysis.shadow_polygons[0]?.time}</span>
                  <span>
                    {shadowAnalysis.shadow_polygons[shadowAnalysis.shadow_polygons.length - 1]?.time}
                  </span>
                </div>
              </div>
            </div>

            {/* Shadow Map */}
            <div className="shadow-map">
              <MapContainer
                center={defaultLocation}
                zoom={16}
                style={{ height: '400px', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />

                {/* Building outline */}
                {buildingGeometry && (
                  <Polygon
                    positions={buildingGeometry.coordinates[0].map((coord: [number, number]) => [
                      coord[1],
                      coord[0],
                    ])}
                    pathOptions={{
                      color: '#3b82f6',
                      fillColor: '#3b82f6',
                      fillOpacity: 0.3,
                      weight: 2,
                    }}
                  />
                )}

                {/* Current shadow polygon */}
                {currentShadow && currentShadow.geometry && (
                  <Polygon
                    positions={currentShadow.geometry.coordinates[0].map((coord: [number, number]) => [
                      coord[1],
                      coord[0],
                    ])}
                    pathOptions={{
                      color: '#000000',
                      fillColor: '#000000',
                      fillOpacity: 0.6,
                      weight: 1,
                    }}
                  />
                )}
              </MapContainer>

              <div className="map-legend">
                <div className="legend-item">
                  <div className="legend-color" style={{ background: '#3b82f6' }}></div>
                  <span>Building</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ background: '#000000' }}></div>
                  <span>Shadow</span>
                </div>
              </div>
            </div>

            {/* Shadow Impact Analysis */}
            <div className="impact-analysis">
              <h3>Shadow Impact Summary</h3>
              <div className="impact-items">
                <div className="impact-item">
                  <Info size={16} />
                  <div className="impact-content">
                    <div className="impact-title">Peak Shadow Period</div>
                    <div className="impact-text">
                      Maximum shadow coverage occurs around midday when sun altitude is highest
                    </div>
                  </div>
                </div>

                <div className="impact-item">
                  <Info size={16} />
                  <div className="impact-content">
                    <div className="impact-title">Affected Properties</div>
                    <div className="impact-text">
                      Shadow may impact approximately {Math.round((stats?.affectedArea || 0) / 100)}{' '}
                      neighboring properties
                    </div>
                  </div>
                </div>

                <div className="impact-item">
                  <Info size={16} />
                  <div className="impact-content">
                    <div className="impact-title">Seasonal Variation</div>
                    <div className="impact-text">
                      Shadow patterns will vary with seasons; consider analyzing solstice dates
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Settings Panel */}
        {showSettings && (
          <div className="settings-overlay">
            <div className="settings-card">
              <div className="settings-header">
                <h3>Animation Settings</h3>
                <button className="close-btn" onClick={() => setShowSettings(false)} aria-label="Close settings">
                  ×
                </button>
              </div>
              <div className="settings-body">
                <div className="setting-item">
                  <label>
                    <span>Animation Speed</span>
                    <span className="setting-value">{animationSpeed}ms</span>
                  </label>
                  <input
                    type="range"
                    min="200"
                    max="2000"
                    step="100"
                    value={animationSpeed}
                    onChange={e => setAnimationSpeed(parseInt(e.target.value))}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!shadowAnalysis && !isLoading && !error && (
          <div className="empty-state">
            <Sun size={48} className="empty-icon" />
            <h3>No Analysis Data</h3>
            <p>Configure analysis parameters and click "Run Analysis" to generate shadow projections</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShadowAnalysisPanel;
