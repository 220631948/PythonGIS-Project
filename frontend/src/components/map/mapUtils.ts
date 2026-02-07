/**
 * Map utility functions and types for Cape Town GeoHub
 * Shared across MapView sub-components
 */
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// ── Types ──

export interface LatLng {
  lat: number;
  lng: number;
}

export interface LatLngCandidate {
  lat?: number | string;
  lng?: number | string;
  lon?: number | string;
  latitude?: number | string;
  longitude?: number | string;
}

// ── Coordinate Helpers ──

const isFiniteNumber = (value: unknown): boolean =>
  Number.isFinite(Number(value));

/**
 * Normalise a loosely‑typed coordinate candidate to a strict {lat,lng} pair.
 * Returns null when the input cannot be validated.
 */
export const toLatLng = (candidate: LatLngCandidate | null | undefined): LatLng | null => {
  if (!candidate) return null;

  const lat = candidate.lat ?? candidate.latitude;
  const lng = candidate.lng ?? candidate.lon ?? candidate.longitude;
  const latNumber = Number(lat);
  const lngNumber = Number(lng);

  if (!Number.isFinite(latNumber) || !Number.isFinite(lngNumber)) return null;
  return { lat: latNumber, lng: lngNumber };
};

export const hasFiniteCoords = (coords: unknown): boolean => {
  if (!Array.isArray(coords)) return false;

  if (typeof coords[0] === 'number' || typeof coords[0] === 'string') {
    return coords.length >= 2 && isFiniteNumber(coords[0]) && isFiniteNumber(coords[1]);
  }

  return coords.every(hasFiniteCoords);
};

export const isValidGeoJSONFeature = (feature: GeoJSON.Feature): boolean => {
  const geometry = feature?.geometry;
  if (!geometry || !('coordinates' in geometry) || geometry.coordinates == null) return false;
  return hasFiniteCoords(geometry.coordinates);
};

// ── Icons ──

export const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Apply as global default
L.Marker.prototype.options.icon = DefaultIcon;

export const clickMarkerIcon = L.divIcon({
  className: 'click-marker',
  html: '<div class="click-marker-inner"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

export const locationMarkerIcon = L.divIcon({
  className: 'location-marker',
  html: '<div class="location-marker-inner"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

export const collaborationIcon = L.divIcon({
  className: 'collaboration-marker',
  html: '<div class="collaboration-marker-inner">💬</div>',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

// ── Layer Styling ──

export const getLayerStyle = (
  layerId: string,
  feature: GeoJSON.Feature,
  opacity: number = 0.7,
): L.PathOptions => {
  const props = feature.properties ?? {};

  const styles: Record<string, L.PathOptions> = {
    'services-layer': {
      color: props.access_score > 70 ? '#22c55e' : props.access_score > 40 ? '#f97316' : '#ef4444',
      weight: 2,
      fillOpacity: opacity,
      opacity: 0.8,
    },
    'safety-layer': {
      color: props.risk_level === 'High' ? '#ef4444' : props.risk_level === 'Medium' ? '#f97316' : '#fef08a',
      weight: 1,
      fillOpacity: opacity,
      opacity: 0.7,
    },
    'flood-layer': {
      color: '#3b82f6',
      weight: 1,
      fillOpacity: opacity * 0.8,
      opacity: 0.7,
      dashArray: '5, 5',
    },
    'zoning-layer': {
      color: '#a855f7',
      weight: 1,
      fillOpacity: opacity * 0.6,
      opacity: 0.6,
    },
    'biodiversity_network': {
      color: '#22c55e',
      weight: 2,
      fillOpacity: opacity * 0.4,
      opacity: 0.8,
      dashArray: '10, 5',
    },
    'wetlands': {
      color: '#0ea5e9',
      weight: 1,
      fillOpacity: opacity * 0.6,
      opacity: 0.7,
    },
    'protected_areas': {
      color: '#16a34a',
      weight: 2,
      fillOpacity: opacity * 0.5,
      opacity: 0.8,
    },
    'development_focus_areas': {
      color: '#dc2626',
      weight: 3,
      fillOpacity: opacity * 0.3,
      opacity: 0.9,
      dashArray: '15, 5, 5, 5',
    },
  };

  return styles[layerId] ?? {
    color: '#6b7280',
    weight: 1,
    fillOpacity: opacity * 0.5,
    opacity: 0.6,
  };
};
