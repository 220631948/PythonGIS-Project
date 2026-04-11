import { useState, useCallback } from 'react';
import {
  Navigation,
  MapPin,
  Car,
  Bike,
  Footprints,
  Bus,
  RefreshCw,
  Clock,
  Ruler,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import '../styles/RoutePanel.css';

/**
 * RoutePanel - Network analysis and routing panel
 *
 * Features:
 * - Origin/destination input
 * - Transport mode selection
 * - Route calculation
 * - Isochrone display
 * - Nearest facility search
 */

const TRANSPORT_MODES = [
  { id: 'walking', label: 'Walk', icon: Footprints },
  { id: 'cycling', label: 'Cycle', icon: Bike },
  { id: 'driving', label: 'Drive', icon: Car },
  { id: 'transit', label: 'Transit', icon: Bus }
];

interface LatLng {
  lat: number;
  lng: number;
}

interface RouteWaypoint {
    name: string;
}

interface RouteResult {
    distance_meters: number;
    estimated_time_minutes: number;
    waypoints: RouteWaypoint[];
}

interface IsochroneFeature {
    properties: {
        time_minutes: number;
        area_sqkm: number;
    };
}

interface IsochroneResult {
    mode: string;
    max_time_minutes: number;
    features: IsochroneFeature[];
}

interface NearestResultItem {
    name: string;
    distance_meters: number;
}

interface NearestResult {
    results: NearestResultItem[];
}

interface RoutePanelProps {
    onRouteCalculated?: (data: RouteResult | null) => void;
    onIsochroneCalculated?: (data: IsochroneResult | null) => void;
    clickedLocation?: LatLng | null;
    isLoading?: boolean;
}

export default function RoutePanel({
  onRouteCalculated,
  onIsochroneCalculated,
  clickedLocation,
  isLoading: _isLoading = false
}: RoutePanelProps) {
  const [mode, setMode] = useState('driving');
  const [origin, setOrigin] = useState<LatLng | null>(null);
  const [destination, setDestination] = useState<LatLng | null>(null);
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [isochroneResult, setIsochroneResult] = useState<IsochroneResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [activeTab, setActiveTab] = useState<'route' | 'isochrone' | 'nearest'>('route');
  const [isochroneTime, setIsochroneTime] = useState(15);
  const [facilityType, setFacilityType] = useState('clinics');
  const [nearestResults, setNearestResults] = useState<NearestResult | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  void _isLoading;

  // Set location from map click
  const setLocationFromClick = useCallback((type: 'origin' | 'destination') => {
    if (clickedLocation) {
      if (type === 'origin') {
        setOrigin(clickedLocation);
      } else {
        setDestination(clickedLocation);
      }
    }
  }, [clickedLocation]);

  // Calculate route
  const calculateRoute = async () => {
    if (!origin || !destination) {
      alert('Please set both origin and destination');
      return;
    }

    setIsCalculating(true);
    try {
      const params = new URLSearchParams({
        origin_lat: origin.lat.toString(),
        origin_lon: origin.lng.toString(),
        dest_lat: destination.lat.toString(),
        dest_lon: destination.lng.toString(),
        mode: mode
      });

      const response = await fetch(`/api/network/route?${params}`);
      if (response.ok) {
        const data = await response.json();
        setRouteResult(data);
        if (onRouteCalculated) {
          onRouteCalculated(data);
        }
      } else {
        throw new Error('Route calculation failed');
      }
    } catch (error) {
      console.error('Route error:', error);
      alert('Failed to calculate route');
    } finally {
      setIsCalculating(false);
    }
  };

  // Calculate isochrone
  const calculateIsochrone = async () => {
    if (!origin) {
      alert('Please set a center point by clicking on the map');
      return;
    }

    setIsCalculating(true);
    try {
      const params = new URLSearchParams({
        lat: origin.lat.toString(),
        lon: origin.lng.toString(),
        time_minutes: isochroneTime.toString(),
        mode: mode,
        intervals: '3'
      });

      const response = await fetch(`/api/network/isochrone?${params}`);
      if (response.ok) {
        const data = await response.json();
        setIsochroneResult(data);
        if (onIsochroneCalculated) {
          onIsochroneCalculated(data);
        }
      } else {
        throw new Error('Isochrone calculation failed');
      }
    } catch (error) {
      console.error('Isochrone error:', error);
      alert('Failed to calculate isochrone');
    } finally {
      setIsCalculating(false);
    }
  };

  // Find nearest facilities
  const findNearest = async () => {
    if (!origin) {
      alert('Please set a location by clicking on the map');
      return;
    }

    setIsCalculating(true);
    try {
      const params = new URLSearchParams({
        lat: origin.lat.toString(),
        lon: origin.lng.toString(),
        facility_type: facilityType,
        count: '5'
      });

      const response = await fetch(`/api/network/nearest?${params}`);
      if (response.ok) {
        const data = await response.json();
        setNearestResults(data);
      } else {
        throw new Error('Nearest search failed');
      }
    } catch (error) {
      console.error('Nearest error:', error);
      alert('Failed to find nearest facilities');
    } finally {
      setIsCalculating(false);
    }
  };

  // Clear all
  const clearAll = () => {
    setOrigin(null);
    setDestination(null);
    setRouteResult(null);
    setIsochroneResult(null);
    setNearestResults(null);
    if (onRouteCalculated) {
      onRouteCalculated(null);
    }
    if (onIsochroneCalculated) {
      onIsochroneCalculated(null);
    }
  };

  // Format distance
  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
  };

  // Format time
  const formatTime = (minutes: number) => {
    if (minutes >= 60) {
      const hrs = Math.floor(minutes / 60);
      const mins = Math.round(minutes % 60);
      return `${hrs}h ${mins}m`;
    }
    return `${Math.round(minutes)} min`;
  };

  return (
    <div className="route-panel">
      <div
        className="panel-header"
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            if (e.key === ' ') e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
      >
        <div className="header-title">
          <Navigation size={16} />
          <span>Network Analysis</span>
        </div>
        <div className="header-actions">
          {(origin || destination || routeResult) && (
            <button
              className="clear-btn"
              onClick={(e) => { e.stopPropagation(); clearAll(); }}
            >
              Clear
            </button>
          )}
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {isExpanded && (
        <div className="panel-content">
          {/* Tabs */}
          <div className="tab-bar">
            <button
              className={`tab ${activeTab === 'route' ? 'active' : ''}`}
              onClick={() => setActiveTab('route')}
            >
              Route
            </button>
            <button
              className={`tab ${activeTab === 'isochrone' ? 'active' : ''}`}
              onClick={() => setActiveTab('isochrone')}
            >
              Isochrone
            </button>
            <button
              className={`tab ${activeTab === 'nearest' ? 'active' : ''}`}
              onClick={() => setActiveTab('nearest')}
            >
              Nearest
            </button>
          </div>

          {/* Transport Mode */}
          <div className="mode-selector">
            {TRANSPORT_MODES.map(m => (
              <button
                key={m.id}
                className={`mode-btn ${mode === m.id ? 'active' : ''}`}
                onClick={() => setMode(m.id)}
                title={m.label}
                aria-label={m.label}
                aria-pressed={mode === m.id}
              >
                <m.icon size={18} aria-hidden="true" />
              </button>
            ))}
          </div>

          {/* Route Tab */}
          {activeTab === 'route' && (
            <div className="tab-content">
              <div className="location-inputs">
                <div className="location-row">
                  <div className="location-marker origin">A</div>
                  <div className="location-info">
                    {origin ? (
                      <span>{origin.lat.toFixed(4)}, {origin.lng.toFixed(4)}</span>
                    ) : (
                      <span className="placeholder">Click map to set origin</span>
                    )}
                  </div>
                  <button
                    className="set-btn"
                    onClick={() => setLocationFromClick('origin')}
                    disabled={!clickedLocation}
                  >
                    Set
                  </button>
                </div>
                <div className="location-row">
                  <div className="location-marker destination">B</div>
                  <div className="location-info">
                    {destination ? (
                      <span>{destination.lat.toFixed(4)}, {destination.lng.toFixed(4)}</span>
                    ) : (
                      <span className="placeholder">Click map to set destination</span>
                    )}
                  </div>
                  <button
                    className="set-btn"
                    onClick={() => setLocationFromClick('destination')}
                    disabled={!clickedLocation}
                  >
                    Set
                  </button>
                </div>
              </div>

              <button
                className="calculate-btn"
                onClick={calculateRoute}
                disabled={!origin || !destination || isCalculating}
              >
                {isCalculating ? (
                  <>
                    <RefreshCw className="spin" size={16} />
                    <span>Calculating...</span>
                  </>
                ) : (
                  <>
                    <Navigation size={16} />
                    <span>Calculate Route</span>
                  </>
                )}
              </button>

              {routeResult && (
                <div className="result-card">
                  <div className="result-row">
                    <Ruler size={16} />
                    <span>Distance</span>
                    <strong>{formatDistance(routeResult.distance_meters)}</strong>
                  </div>
                  <div className="result-row">
                    <Clock size={16} />
                    <span>Est. Time</span>
                    <strong>{formatTime(routeResult.estimated_time_minutes)}</strong>
                  </div>
                  {routeResult.waypoints.length > 0 && (
                    <div className="waypoints">
                      <span className="waypoints-label">Transit Stops:</span>
                      {routeResult.waypoints.map((wp, i) => (
                        <span key={i} className="waypoint">{wp.name}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Isochrone Tab */}
          {activeTab === 'isochrone' && (
            <div className="tab-content">
              <div className="location-inputs">
                <div className="location-row">
                  <div className="location-marker origin">●</div>
                  <div className="location-info">
                    {origin ? (
                      <span>{origin.lat.toFixed(4)}, {origin.lng.toFixed(4)}</span>
                    ) : (
                      <span className="placeholder">Click map to set center</span>
                    )}
                  </div>
                  <button
                    className="set-btn"
                    onClick={() => setLocationFromClick('origin')}
                    disabled={!clickedLocation}
                  >
                    Set
                  </button>
                </div>
              </div>

              <div className="time-selector">
                <label>Travel Time: {isochroneTime} min</label>
                <input
                  type="range"
                  min="5"
                  max="60"
                  step="5"
                  value={isochroneTime}
                  onChange={(e) => setIsochroneTime(parseInt(e.target.value))}
                />
              </div>

              <button
                className="calculate-btn"
                onClick={calculateIsochrone}
                disabled={!origin || isCalculating}
              >
                {isCalculating ? (
                  <>
                    <RefreshCw className="spin" size={16} />
                    <span>Calculating...</span>
                  </>
                ) : (
                  <>
                    <Clock size={16} />
                    <span>Calculate Isochrone</span>
                  </>
                )}
              </button>

              {isochroneResult && (
                <div className="result-card">
                  <div className="result-row">
                    <span>Mode</span>
                    <strong>{isochroneResult.mode}</strong>
                  </div>
                  <div className="result-row">
                    <span>Max Time</span>
                    <strong>{isochroneResult.max_time_minutes} min</strong>
                  </div>
                  <div className="isochrone-legend">
                    {isochroneResult.features.map((f, i) => (
                      <div key={i} className="legend-item">
                        <span
                          className="legend-color"
                          style={{
                            opacity: 1 - (i * 0.25),
                            backgroundColor: '#2196f3'
                          }}
                        />
                        <span>{f.properties.time_minutes} min</span>
                        <span>({f.properties.area_sqkm} km²)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Nearest Tab */}
          {activeTab === 'nearest' && (
            <div className="tab-content">
              <div className="location-inputs">
                <div className="location-row">
                  <div className="location-marker origin">●</div>
                  <div className="location-info">
                    {origin ? (
                      <span>{origin.lat.toFixed(4)}, {origin.lng.toFixed(4)}</span>
                    ) : (
                      <span className="placeholder">Click map to set location</span>
                    )}
                  </div>
                  <button
                    className="set-btn"
                    onClick={() => setLocationFromClick('origin')}
                    disabled={!clickedLocation}
                  >
                    Set
                  </button>
                </div>
              </div>

              <div className="facility-selector">
                <label>Facility Type</label>
                <select
                  value={facilityType}
                  onChange={(e) => setFacilityType(e.target.value)}
                >
                  <option value="clinics">Clinics</option>
                  <option value="schools">Schools</option>
                  <option value="parks">Parks</option>
                  <option value="myciti_stops">MyCiti Stops</option>
                  <option value="rail_stations">Rail Stations</option>
                </select>
              </div>

              <button
                className="calculate-btn"
                onClick={findNearest}
                disabled={!origin || isCalculating}
              >
                {isCalculating ? (
                  <>
                    <RefreshCw className="spin" size={16} />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <MapPin size={16} />
                    <span>Find Nearest</span>
                  </>
                )}
              </button>

              {nearestResults && (
                <div className="result-card">
                  <div className="nearest-list">
                    {nearestResults.results.map((r, i) => (
                      <div key={i} className="nearest-item">
                        <span className="rank">{i + 1}</span>
                        <div className="nearest-info">
                          <span className="name">{r.name}</span>
                          <span className="distance">{formatDistance(r.distance_meters)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
