import { Marker, Popup } from 'react-leaflet';
import { toLatLng, collaborationIcon, clickMarkerIcon, locationMarkerIcon } from './mapUtils';
import type { LatLng } from './mapUtils';

interface MarkerManagerProps {
  collaborationMarkers: Array<Record<string, unknown>>;
  activeClickLocation: LatLng | null;
  userLocation: LatLng | null;
  onSuitabilityAnalysis?: (lat: number, lng: number) => void;
}

export function MarkerManager({
  collaborationMarkers,
  activeClickLocation,
  userLocation,
  onSuitabilityAnalysis
}: MarkerManagerProps) {
  return (
    <>
      {/* Collaboration Markers */}
      {collaborationMarkers.map((marker, idx) => {
        const normalized = toLatLng((marker.location ?? marker) as Record<string, unknown>);
        const markerTimestamp = marker.timestamp as string | undefined;
        if (!normalized) return null;
        return (
          <Marker key={(marker.id as string) ?? idx} position={[normalized.lat, normalized.lng]} icon={collaborationIcon}>
            <Popup>
              <div className="collaboration-popup">
                <h4>{String(marker.author ?? 'Contributor')}</h4>
                <p>{String(marker.text ?? marker.description)}</p>
                {markerTimestamp && (
                  <span className="popup-time">{new Date(markerTimestamp).toLocaleString()}</span>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* Click marker */}
      {activeClickLocation && (
        <Marker position={[activeClickLocation.lat, activeClickLocation.lng]} icon={clickMarkerIcon}>
          <Popup>
            <div className="popup-content click-location">
              <h4>Selected Location</h4>
              <p>Lat: {activeClickLocation.lat.toFixed(5)}</p>
              <p>Lng: {activeClickLocation.lng.toFixed(5)}</p>
              <button
                className="popup-button"
                onClick={() => {
                  if (onSuitabilityAnalysis) {
                    onSuitabilityAnalysis(activeClickLocation.lat, activeClickLocation.lng);
                  } else {
                     window.dispatchEvent(
                      new CustomEvent('suitabilityAnalysis', {
                        detail: { lat: activeClickLocation.lat, lng: activeClickLocation.lng },
                      }),
                    );
                  }
                }}
              >
                Analyze Site Suitability
              </button>
            </div>
          </Popup>
        </Marker>
      )}

      {/* User location */}
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
    </>
  );
}
