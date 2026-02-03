import React from 'react';
import { Bus, Clock, MapPin, Navigation, AlertCircle } from 'lucide-react';

interface TransportInfo {
  error?: string;
  location?: { lat: number; lng: number };
  summary?: Record<string, number>;
  nearest_stop?: {
    name: string;
    distance: number;
  };
}

interface TransportPanelProps {
  transportInfo: TransportInfo | null;
  isLoading: boolean;
}

const TransportPanel: React.FC<TransportPanelProps> = ({ transportInfo, isLoading }) => {
  if (isLoading) {
    return (
      <div className="transport-panel loading">
        <div className="panel-header">
          <Bus size={18} />
          <h3>Transport Accessibility</h3>
        </div>
        <div className="transport-loading">
          <div className="skeleton skeleton-text"></div>
          <div className="skeleton skeleton-text short"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="transport-panel">
      <div className="panel-header">
        <Bus size={18} />
        <h3>Transport Accessibility</h3>
      </div>

      <div className="transport-content">
        {!transportInfo ? (
          <div className="transport-empty">
            <Navigation size={32} className="empty-icon" />
            <p>Click on the map to analyze walking distance to public transport stops</p>
            <span className="hint">MyCiTi bus stop accessibility</span>
          </div>
        ) : transportInfo.error ? (
          <div className="transport-error">
            <AlertCircle size={24} />
            <p>Could not calculate accessibility for this location</p>
          </div>
        ) : (
          <div className="transport-results">
            <div className="selected-location">
              <MapPin size={14} />
              <span>
                {transportInfo.location?.lat.toFixed(4)}, {transportInfo.location?.lng.toFixed(4)}
              </span>
            </div>

            <div className="walking-distances">
              <h4>
                <Clock size={14} />
                Walking Distance Analysis
              </h4>

              <div className="distance-grid">
                {transportInfo.summary && Object.entries(transportInfo.summary).map(([distance, count]) => (
                  <div key={distance} className={`distance-card ${count > 0 ? 'has-stops' : ''}`}>
                    <div className="distance-value">{count}</div>
                    <div className="distance-label">stops</div>
                    <div className="distance-range">{distance}</div>
                  </div>
                ))}
              </div>

              {transportInfo.nearest_stop && (
                <div className="nearest-stop">
                  <h5>Nearest Stop</h5>
                  <p>{transportInfo.nearest_stop.name || 'MyCiTi Stop'}</p>
                  <span>{transportInfo.nearest_stop.distance}m away</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransportPanel;
