/**
 * ClusterLayer - Display PostGIS server-side clustered data
 *
 * Renders clusters with size-based icons and expands to individual points at higher zoom.
 */
import { CircleMarker, Popup, Tooltip, useMap } from 'react-leaflet';
import { useEffect, memo } from 'react';
import type { ClusterData, ClusterFeature } from '../../hooks/usePostGISClusters';

interface ClusterLayerProps {
  clusterData: ClusterData | null;
  color?: string;
  onClusterClick?: (clusterId: number, bounds: any) => void;
}

interface ClusterMarkerProps {
  feature: ClusterFeature;
  color?: string;
  onClusterClick?: (clusterId: number, bounds: any) => void;
}

/**
 * Create a cluster icon with dynamic size based on point count
 */
function getClusterRadius(pointCount: number): number {
  if (pointCount < 10) return 15;
  if (pointCount < 50) return 20;
  if (pointCount < 100) return 25;
  if (pointCount < 500) return 30;
  return 35;
}

/**
 * Get cluster color based on density
 */
function getClusterColor(pointCount: number): string {
  if (pointCount < 10) return '#51bbd6';
  if (pointCount < 50) return '#f1f075';
  if (pointCount < 100) return '#f28cb1';
  return '#ff4444';
}

const ClusterMarker = memo(({ feature, color, onClusterClick }: ClusterMarkerProps) => {
  const map = useMap();
  const [lng, lat] = feature.geometry.coordinates;
  const { cluster_id, point_count, is_cluster } = feature.properties;

  const radius = is_cluster ? getClusterRadius(point_count) : 8;
  const fillColor = is_cluster ? getClusterColor(point_count) : (color ?? '#3388ff');

  return (
    <CircleMarker
      center={[lat, lng]}
      radius={radius}
      pathOptions={{
        fillColor,
        fillOpacity: 0.7,
        color: '#fff',
        weight: is_cluster ? 2 : 1,
        opacity: 1
      }}
      eventHandlers={{
        click: () => {
          if (is_cluster && onClusterClick && feature.properties.bounds) {
            onClusterClick(cluster_id, feature.properties.bounds);
          } else if (is_cluster) {
            // Zoom in to cluster
            map.setView([lat, lng], map.getZoom() + 2);
          }
        },
        mouseover: (e) => {
          const layer = e.target;
          layer.setStyle({ fillOpacity: 0.9 });
        },
        mouseout: (e) => {
          const layer = e.target;
          layer.setStyle({ fillOpacity: 0.7 });
        }
      }}
    >
      <Popup>
        <div className="cluster-popup">
          {is_cluster ? (
            <>
              <strong>Cluster #{cluster_id}</strong>
              <p>{point_count} points</p>
              <small>Click to zoom in</small>
            </>
          ) : (
            <>
              <strong>Location</strong>
              <p>
                Lat: {lat.toFixed(5)}<br />
                Lng: {lng.toFixed(5)}
              </p>
            </>
          )}
        </div>
      </Popup>

      {/* Cluster count badge rendered as a permanent Tooltip (div is invisible inside CircleMarker) */}
      {is_cluster && (
        <Tooltip
          permanent
          direction="center"
          className="cluster-count-tooltip"
        >
          <span
            style={{
              color: '#fff',
              fontWeight: 'bold',
              fontSize: point_count > 999 ? '10px' : '12px',
              textShadow: '0 0 2px rgba(0,0,0,0.5)',
            }}
          >
            {point_count > 999 ? `${(point_count / 1000).toFixed(1)}k` : point_count}
          </span>
        </Tooltip>
      )}
    </CircleMarker>
  );
});

/**
 * Render PostGIS clustered points
 */
export function ClusterLayer({ clusterData, color, onClusterClick }: ClusterLayerProps) {
  useEffect(() => {
    if (!clusterData) return;

    console.log(`ClusterLayer: Rendering ${clusterData.features.length} clusters`);
  }, [clusterData]);

  if (!clusterData || !clusterData.features.length) {
    return null;
  }

  return (
    <>
      {clusterData.features.map((feature, idx) => (
        <ClusterMarker
          key={`cluster-${feature.properties.cluster_id}-${idx}`}
          feature={feature}
          color={color}
          onClusterClick={onClusterClick}
        />
      ))}
    </>
  );
}

export default ClusterLayer;
