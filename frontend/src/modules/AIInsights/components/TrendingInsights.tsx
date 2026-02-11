/**
 * TrendingInsights Component
 *
 * Real-time widget showing AI-generated trending predictions and insights
 * Displays recent predictions across all AI modules
 */

import React, { useEffect } from 'react';
import {
  TrendingUp,
  Navigation,
  Shield,
  MapPin,
  Clock,
  Zap,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import type { TrendingPrediction } from '../../../types/api-2026';

interface TrendingInsightsProps {
  predictions: TrendingPrediction[];
  isLoading: boolean;
  onRefresh: () => void;
  onPredictionClick?: (prediction: TrendingPrediction) => void;
}

const PREDICTION_TYPES = {
  traffic: { icon: Navigation, color: '#3b82f6', label: 'Traffic' },
  crime: { icon: Shield, color: '#ef4444', label: 'Safety' },
  land_use: { icon: MapPin, color: '#8b5cf6', label: 'Land Use' },
  environmental: { icon: TrendingUp, color: '#10b981', label: 'Environment' }
};

export default function TrendingInsights({
  predictions,
  isLoading,
  onRefresh,
  onPredictionClick
}: TrendingInsightsProps) {
  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      onRefresh();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [onRefresh]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="trending-insights-widget">
      {/* Header */}
      <div className="widget-header">
        <div className="header-title">
          <Zap size={18} />
          <h3>Trending Insights</h3>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="refresh-btn"
          title="Refresh insights"
        >
          <RefreshCw size={16} className={isLoading ? 'spinning' : ''} />
        </button>
      </div>

      {/* Predictions List */}
      <div className="predictions-list">
        {isLoading && predictions.length === 0 ? (
          <div className="loading-state">
            <span className="spinner-sm" />
            <span>Loading insights...</span>
          </div>
        ) : predictions.length === 0 ? (
          <div className="empty-state">
            <Zap size={32} className="empty-icon" />
            <p>No trending insights available</p>
          </div>
        ) : (
          predictions.map((prediction, idx) => {
            const typeConfig = PREDICTION_TYPES[prediction.type];
            const Icon = typeConfig.icon;

            return (
              <button
                key={idx}
                onClick={() => onPredictionClick?.(prediction)}
                className="prediction-item"
              >
                <div
                  className="prediction-icon"
                  style={{ backgroundColor: `${typeConfig.color}20` }}
                >
                  <Icon size={18} style={{ color: typeConfig.color }} />
                </div>

                <div className="prediction-content">
                  <div className="prediction-header">
                    <span
                      className="prediction-type"
                      style={{ color: typeConfig.color }}
                    >
                      {typeConfig.label}
                    </span>
                    <span className="prediction-time">
                      <Clock size={12} />
                      {formatTime(prediction.timestamp)}
                    </span>
                  </div>

                  <h4 className="prediction-title">{prediction.title}</h4>
                  <p className="prediction-description">{prediction.description}</p>

                  <div className="prediction-footer">
                    <div className="prediction-location">
                      <MapPin size={12} />
                      <span>
                        {prediction.location.lat.toFixed(4)}, {prediction.location.lng.toFixed(4)}
                      </span>
                    </div>
                    <div className="prediction-confidence">
                      <div className="confidence-indicator">
                        <div
                          className="confidence-bar"
                          style={{
                            width: `${prediction.confidence * 100}%`,
                            backgroundColor: typeConfig.color
                          }}
                        />
                      </div>
                      <span>{(prediction.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>

                <ChevronRight size={16} className="prediction-arrow" />
              </button>
            );
          })
        )}
      </div>

      {/* Footer */}
      {predictions.length > 0 && (
        <div className="widget-footer">
          <span className="footer-text">
            Showing {predictions.length} trending {predictions.length === 1 ? 'insight' : 'insights'}
          </span>
        </div>
      )}
    </div>
  );
}
