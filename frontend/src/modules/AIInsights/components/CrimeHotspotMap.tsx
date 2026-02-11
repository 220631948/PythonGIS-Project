/**
 * CrimeHotspotMap Component
 *
 * AI-powered crime hotspot detection with heatmap visualization
 * Uses leaflet.heat for intensive heatmap rendering
 */

import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap, Circle, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Shield,
  AlertTriangle,
  Filter,
  Calendar,
  X,
  Info,
  TrendingUp,
  MapPin
} from 'lucide-react';
import type { CrimeHotspotRequest, CrimeHotspotResponse, CrimeHotspot } from '../../../types/api-2026';

// Leaflet.heat component wrapper
function HeatmapLayer({ hotspots }: { hotspots: CrimeHotspot[] }) {
  const map = useMap();
  const heatLayerRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !hotspots || hotspots.length === 0) return;

    // Dynamically import leaflet.heat
    import('leaflet.heat').then((HeatModule: any) => {
      // Remove existing heat layer
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
      }

      // Convert hotspots to heatmap points
      const heatPoints = hotspots.map(hotspot => [
        hotspot.location.lat,
        hotspot.location.lng,
        hotspot.intensity / 100 // Normalize intensity
      ] as [number, number, number]);

      // Create heat layer
      const heatLayer = (L as any).heatLayer(heatPoints, {
        radius: 25,
        blur: 15,
        maxZoom: 17,
        max: 1.0,
        gradient: {
          0.0: '#0000ff',
          0.2: '#00ffff',
          0.4: '#00ff00',
          0.6: '#ffff00',
          0.8: '#ff8800',
          1.0: '#ff0000'
        }
      });

      heatLayer.addTo(map);
      heatLayerRef.current = heatLayer;
    });

    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
      }
    };
  }, [hotspots, map]);

  return null;
}

interface CrimeHotspotMapProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalyze: (request: CrimeHotspotRequest) => Promise<CrimeHotspotResponse>;
  defaultBounds?: {
    minLat: number;
    minLng: number;
    maxLat: number;
    maxLng: number;
  };
}

const CRIME_TYPES = [
  { id: 'assault', label: 'Assault', icon: '👊' },
  { id: 'burglary', label: 'Burglary', icon: '🏠' },
  { id: 'theft', label: 'Theft', icon: '💰' },
  { id: 'vehicle_crime', label: 'Vehicle Crime', icon: '🚗' },
  { id: 'vandalism', label: 'Vandalism', icon: '🔨' }
];

const RISK_LEVELS = {
  low: { color: '#10b981', label: 'Low Risk' },
  moderate: { color: '#f59e0b', label: 'Moderate Risk' },
  high: { color: '#ef4444', label: 'High Risk' },
  very_high: { color: '#dc2626', label: 'Very High Risk' }
};

export default function CrimeHotspotMap({
  isOpen,
  onClose,
  onAnalyze,
  defaultBounds
}: CrimeHotspotMapProps) {
  const [bounds, setBounds] = useState(
    defaultBounds || {
      minLat: -33.93,
      minLng: 18.42,
      maxLat: -33.92,
      maxLng: 18.43
    }
  );
  const [selectedCrimeTypes, setSelectedCrimeTypes] = useState<string[]>([]);
  const [timePeriod, setTimePeriod] = useState('last_30_days');
  const [results, setResults] = useState<CrimeHotspotResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const request: CrimeHotspotRequest = {
        bounds,
        crime_types: selectedCrimeTypes.length > 0 ? selectedCrimeTypes : undefined,
        time_period: timePeriod
      };

      const result = await onAnalyze(request);
      setResults(result);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze crime hotspots');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCrimeType = (type: string) => {
    setSelectedCrimeTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleClose = () => {
    setResults(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  const mapCenter: [number, number] = [
    (bounds.minLat + bounds.maxLat) / 2,
    (bounds.minLng + bounds.maxLng) / 2
  ];

  return (
    <div className="ai-panel-overlay" onClick={handleClose}>
      <div className="ai-panel-modal crime-panel large-panel" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="panel-header">
          <h2>
            <Shield size={24} />
            Crime Hotspot Analysis
          </h2>
          <button onClick={handleClose} className="close-btn" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="panel-content">
          {/* Controls */}
          <div className="controls-section">
            <div className="control-group">
              <label>
                <Filter size={16} />
                Crime Types
              </label>
              <div className="crime-types-grid">
                {CRIME_TYPES.map(type => (
                  <button
                    key={type.id}
                    onClick={() => toggleCrimeType(type.id)}
                    className={`crime-type-btn ${selectedCrimeTypes.includes(type.id) ? 'selected' : ''}`}
                  >
                    <span className="type-icon">{type.icon}</span>
                    <span className="type-label">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="control-group">
              <label>
                <Calendar size={16} />
                Time Period
              </label>
              <select
                value={timePeriod}
                onChange={e => setTimePeriod(e.target.value)}
                className="select-input"
              >
                <option value="last_7_days">Last 7 Days</option>
                <option value="last_30_days">Last 30 Days</option>
                <option value="last_90_days">Last 90 Days</option>
                <option value="last_year">Last Year</option>
              </select>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={isLoading}
              className="btn-primary btn-full"
            >
              {isLoading ? (
                <>
                  <span className="spinner-sm" />
                  Analyzing...
                </>
              ) : (
                <>
                  <TrendingUp size={16} />
                  Analyze Hotspots
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="error-banner">
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Map & Results */}
          {results && (
            <div className="map-results-container">
              {/* Map */}
              <div className="crime-map-wrapper">
                <MapContainer
                  center={mapCenter}
                  zoom={14}
                  style={{ height: '400px', width: '100%' }}
                  zoomControl={true}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  />

                  {/* Heatmap Layer */}
                  <HeatmapLayer hotspots={results.hotspots} />

                  {/* Hotspot Markers */}
                  {results.hotspots.map((hotspot, idx) => {
                    const riskConfig = RISK_LEVELS[hotspot.risk_level];

                    return (
                      <Circle
                        key={idx}
                        center={[hotspot.location.lat, hotspot.location.lng]}
                        radius={100}
                        pathOptions={{
                          color: riskConfig.color,
                          fillColor: riskConfig.color,
                          fillOpacity: 0.3,
                          weight: 2
                        }}
                      >
                        <Popup>
                          <div className="hotspot-popup">
                            <h4>{riskConfig.label}</h4>
                            <p>Intensity: {hotspot.intensity.toFixed(1)}</p>
                            <p>Incidents: {hotspot.incidents_count}</p>
                            <div className="popup-crime-types">
                              {hotspot.crime_types.map(type => (
                                <span key={type} className="popup-crime-tag">
                                  {type.replace(/_/g, ' ')}
                                </span>
                              ))}
                            </div>
                          </div>
                        </Popup>
                      </Circle>
                    );
                  })}
                </MapContainer>

                {/* Map Legend */}
                <div className="map-legend">
                  <div className="legend-title">Risk Level</div>
                  {Object.entries(RISK_LEVELS).map(([key, config]) => (
                    <div key={key} className="legend-item">
                      <div
                        className="legend-color"
                        style={{ background: config.color }}
                      />
                      <span>{config.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Statistics */}
              <div className="hotspot-stats">
                <div className="stat-header">
                  <h3>
                    <Info size={18} />
                    Analysis Summary
                  </h3>
                </div>

                <div className="stats-grid">
                  <div className="stat-card">
                    <MapPin size={20} className="stat-icon" />
                    <div className="stat-content">
                      <div className="stat-value">{results.hotspots.length}</div>
                      <div className="stat-label">Hotspots Detected</div>
                    </div>
                  </div>

                  <div className="stat-card">
                    <AlertTriangle size={20} className="stat-icon" />
                    <div className="stat-content">
                      <div className="stat-value">{results.total_incidents}</div>
                      <div className="stat-label">Total Incidents</div>
                    </div>
                  </div>

                  <div className="stat-card">
                    <Calendar size={20} className="stat-icon" />
                    <div className="stat-content">
                      <div className="stat-value">{results.time_period}</div>
                      <div className="stat-label">Time Period</div>
                    </div>
                  </div>
                </div>

                {/* Top Hotspots List */}
                <div className="top-hotspots">
                  <h4>High-Risk Areas</h4>
                  <div className="hotspots-list">
                    {results.hotspots
                      .sort((a, b) => b.intensity - a.intensity)
                      .slice(0, 5)
                      .map((hotspot, idx) => {
                        const riskConfig = RISK_LEVELS[hotspot.risk_level];

                        return (
                          <div key={idx} className="hotspot-item">
                            <div
                              className="hotspot-rank"
                              style={{ background: riskConfig.color }}
                            >
                              #{idx + 1}
                            </div>
                            <div className="hotspot-info">
                              <div className="hotspot-location">
                                {hotspot.location.lat.toFixed(4)}, {hotspot.location.lng.toFixed(4)}
                              </div>
                              <div className="hotspot-meta">
                                <span className="hotspot-risk" style={{ color: riskConfig.color }}>
                                  {riskConfig.label}
                                </span>
                                <span className="hotspot-incidents">
                                  {hotspot.incidents_count} incidents
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* AI Disclaimer */}
                <div className="ai-disclaimer">
                  <Info size={14} />
                  <p>
                    Predictions based on historical crime data using AI clustering algorithms.
                    For official crime statistics, contact SAPS.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Initial State */}
          {!results && !isLoading && !error && (
            <div className="empty-state">
              <Shield size={48} className="empty-icon" />
              <h3>Crime Hotspot Analysis</h3>
              <p>
                Use AI-powered clustering to identify high-risk areas based on
                historical crime data and spatiotemporal patterns.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
