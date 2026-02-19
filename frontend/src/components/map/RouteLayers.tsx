import { LayersControl, LayerGroup, GeoJSON, Marker, Popup } from 'react-leaflet';
import { locationMarkerIcon } from './mapUtils';
import type { LatLng } from './mapUtils';

interface RouteLayersProps {
  routeData: Record<string, unknown> | null;
  routeOrigin: LatLng | null;
  routeDestination: LatLng | null;
  isochroneGeojson: GeoJSON.FeatureCollection | null;
}

export function RouteLayers({ routeData, routeOrigin, routeDestination, isochroneGeojson }: RouteLayersProps) {
  return (
    <>
      {/* Route Layer */}
      {routeOrigin && routeDestination && routeData?.route_geojson && (
        <LayersControl.Overlay checked name="Active Route">
          <LayerGroup>
            <GeoJSON
              key={`route-${(routeData.route_geojson as GeoJSON.FeatureCollection)?.features?.length ?? 0}`}
              data={routeData.route_geojson as GeoJSON.FeatureCollection}
              style={{ color: '#3b82f6', weight: 5, opacity: 0.8 }}
            />
            <Marker position={[routeOrigin.lat, routeOrigin.lng]} icon={locationMarkerIcon}>
              <Popup>Origin: {String((routeData.origin as Record<string, unknown>)?.name ?? 'Origin')}</Popup>
            </Marker>
            <Marker position={[routeDestination.lat, routeDestination.lng]} icon={locationMarkerIcon}>
              <Popup>Destination: {String((routeData.destination as Record<string, unknown>)?.name ?? 'Destination')}</Popup>
            </Marker>
          </LayerGroup>
        </LayersControl.Overlay>
      )}

      {/* Isochrone Layer */}
      {isochroneGeojson && (
        <LayersControl.Overlay checked name="Isochrone">
          <GeoJSON
            key={`iso-${isochroneGeojson?.features?.length ?? 0}`}
            data={isochroneGeojson}
            style={{ color: '#8b5cf6', weight: 2, opacity: 0.8, fillColor: '#a78bfa', fillOpacity: 0.3 }}
          />
        </LayersControl.Overlay>
      )}
    </>
  );
}
