/**
 * TrafficPredictionPanel Component
 *
 * AI-powered traffic prediction with time-series forecasting
 * Shows traffic levels, confidence scores, and alternative routes
 */

import React, { useState } from 'react';
import {
  Navigation,
  Clock,
  AlertTriangle,
  TrendingUp,
  MapPin,
  Calendar,
  Info,
  X,
  Zap
} from 'lucide-react';
import type { TrafficPredictionRequest, TrafficPredictionResponse } from '../../../types/api-2026';

interface TrafficPredictionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onPredict: (request: TrafficPredictionRequest) => Promise<TrafficPredictionResponse>;
  defaultLocation?: { lat: number; lng: number };
}

const TRAFFIC_LEVELS = {
  low: { color: '#10b981', label: 'Low', icon: '🟢' },
  moderate: { color: '#f59e0b', label: 'Moderate', icon: '🟡' },
  high: { color: '#ef4444', label: 'High', icon: '🟠' },
  severe: { color: '#dc2626', label: 'Severe', icon: '🔴' }
};

export default function TrafficPredictionPanel({
  isOpen,
  onClose,
  onPredict,
  defaultLocation
}: TrafficPredictionPanelProps) {
  const [location, setLocation] = useState(
    defaultLocation || { lat: -33.9249, lng: 18.4241 }
  );
  const [datetime, setDatetime] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [prediction, setPrediction] = useState<TrafficPredictionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePredict = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const request: TrafficPredictionRequest = {
        location,
        datetime: new Date(datetime).toISOString()
      };

      const result = await onPredict(request);
      setPrediction(result);
    } catch (err: any) {
      setError(err.message || 'Failed to predict traffic');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setPrediction(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  const trafficConfig = prediction
    ? TRAFFIC_LEVELS[prediction.traffic_level]
    : null;

  return (
    <div className="ai-panel-overlay" onClick={handleClose}>
      <div className="ai-panel-modal traffic-panel" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="panel-header">
          <h2>
            <Navigation size={24} />
            Traffic Prediction
          </h2>
          <button onClick={handleClose} className="close-btn" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="panel-content">
          {/* Input Form */}
          <div className="prediction-form">
            <div className="form-group">
              <label>
                <MapPin size={16} />
                Location
              </label>
              <div className="location-inputs">
                <input
                  type="number"
                  step="0.0001"
                  value={location.lat}
                  onChange={e => setLocation(prev => ({ ...prev, lat: parseFloat(e.target.value) }))}
                  placeholder="Latitude"
                  className="input-sm"
                />
                <input
                  type="number"
                  step="0.0001"
                  value={location.lng}
                  onChange={e => setLocation(prev => ({ ...prev, lng: parseFloat(e.target.value) }))}
                  placeholder="Longitude"
                  className="input-sm"
                />
              </div>
            </div>

            <div className="form-group">
              <label>
                <Calendar size={16} />
                Date & Time
              </label>
              <input
                type="datetime-local"
                value={datetime}
                onChange={e => setDatetime(e.target.value)}
                className="input-full"
              />
            </div>

            <button
              onClick={handlePredict}
              disabled={isLoading}
              className="btn-primary btn-full"
            >
              {isLoading ? (
                <>
                  <span className="spinner-sm" />
                  Predicting...
                </>
              ) : (
                <>
                  <Zap size={16} />
                  Predict Traffic
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

          {/* Prediction Results */}
          {prediction && trafficConfig && (
            <div className="prediction-results">
              {/* Traffic Level Card */}
              <div
                className="traffic-level-card"
                style={{ borderColor: trafficConfig.color }}
              >
                <div className="level-header">
                  <span className="level-icon" style={{ fontSize: '3rem' }}>
                    {trafficConfig.icon}
                  </span>
                  <div className="level-info">
                    <div className="level-label">Traffic Level</div>
                    <div
                      className="level-value"
                      style={{ color: trafficConfig.color }}
                    >
                      {trafficConfig.label}
                    </div>
                  </div>
                </div>

                <div className="traffic-score-bar">
                  <div className="score-label">Traffic Score</div>
                  <div className="score-track">
                    <div
                      className="score-fill"
                      style={{
                        width: `${prediction.traffic_score}%`,
                        background: trafficConfig.color
                      }}
                    />
                  </div>
                  <div className="score-value">{prediction.traffic_score}/100</div>
                </div>
              </div>

              {/* Confidence & Factors */}
              <div className="prediction-meta">
                <div className="meta-card">
                  <TrendingUp size={20} className="meta-icon" />
                  <div className="meta-content">
                    <div className="meta-label">Confidence</div>
                    <div className="meta-value">{(prediction.confidence * 100).toFixed(0)}%</div>
                  </div>
                </div>

                <div className="meta-card">
                  <Clock size={20} className="meta-icon" />
                  <div className="meta-content">
                    <div className="meta-label">Predicted Time</div>
                    <div className="meta-value">
                      {new Date(prediction.predicted_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Contributing Factors */}
              <div className="factors-section">
                <h3>
                  <Info size={18} />
                  Contributing Factors
                </h3>
                <div className="factors-grid">
                  <div className="factor-item">
                    <span className="factor-label">Hour of Day</span>
                    <span className="factor-value">{prediction.factors.hour_of_day}:00</span>
                  </div>
                  <div className="factor-item">
                    <span className="factor-label">Day of Week</span>
                    <span className="factor-value">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][prediction.factors.day_of_week]}
                    </span>
                  </div>
                  <div className="factor-item full-width">
                    <span className="factor-label">Historical Pattern</span>
                    <span className="factor-value">{prediction.factors.historical_pattern}</span>
                  </div>
                </div>
              </div>

              {/* Alternative Routes */}
              {prediction.alternative_routes.length > 0 && (
                <div className="alternatives-section">
                  <h3>
                    <Navigation size={18} />
                    Alternative Routes
                  </h3>
                  <div className="alternatives-list">
                    {prediction.alternative_routes.map((route, idx) => (
                      <div key={idx} className="alternative-item">
                        <div className="alternative-icon">
                          <Navigation size={16} />
                        </div>
                        <div className="alternative-content">
                          <div className="alternative-desc">{route.description}</div>
                          <div className="alternative-delay">
                            +{route.estimated_delay} min delay
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Disclaimer */}
              <div className="ai-disclaimer">
                <Info size={14} />
                <p>
                  Predictions are based on AI analysis of historical data and may vary.
                  Always check real-time conditions before traveling.
                </p>
              </div>
            </div>
          )}

          {/* Initial State */}
          {!prediction && !isLoading && !error && (
            <div className="empty-state">
              <Navigation size={48} className="empty-icon" />
              <h3>Traffic Prediction</h3>
              <p>
                Enter a location and time to get AI-powered traffic predictions
                based on historical patterns and real-time analysis.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
