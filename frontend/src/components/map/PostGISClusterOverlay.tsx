import { useState } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import { usePostGISClusters } from '../../hooks/usePostGISClusters';
import { ClusterLayer } from './ClusterLayer';

/**
 * Inner component that reads map state (bounds/zoom) and renders PostGIS clusters
 * for point-type layers.  Must live *inside* <MapContainer>.
 */
export function PostGISClusterOverlay({ dataset, color }: { dataset: string; color?: string }) {
  const map = useMap();
  const [mapState, setMapState] = useState({
    zoom: map.getZoom(),
    bounds: map.getBounds(),
  });

  useMapEvents({
    moveend: () => {
      setMapState({ zoom: map.getZoom(), bounds: map.getBounds() });
    },
    zoomend: () => {
      setMapState({ zoom: map.getZoom(), bounds: map.getBounds() });
    },
  });

  const { clusters } = usePostGISClusters({
    dataset,
    zoom: mapState.zoom,
    bounds: mapState.bounds,
    enabled: true,
    minZoom: 15,
  });

  return <ClusterLayer clusterData={clusters} color={color} />;
}
