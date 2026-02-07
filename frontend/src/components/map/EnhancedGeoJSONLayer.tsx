/**
 * EnhancedGeoJSONLayer — Manages a single Leaflet GeoJSON layer
 * with styled features, hover effects, popups, and click handlers.
 *
 * Uses stable refs to avoid re-creating Leaflet layers when callback
 * identities change (the "stable ref fix" from the original MapView).
 */
import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

import { isValidGeoJSONFeature, getLayerStyle, DefaultIcon } from './mapUtils';
import { formatPopupContent } from './popupFormatters';

interface DatasetInfo {
  name?: string;
}

interface EnhancedGeoJSONLayerProps {
  data: GeoJSON.FeatureCollection;
  layerId: string;
  datasetInfo: DatasetInfo | null;
  opacity?: number;
  onFeatureClick?: (feature: GeoJSON.Feature, event: L.LeafletEvent) => void;
  onFeatureHover?: (feature: GeoJSON.Feature, hovering: boolean) => void;
}

export default function EnhancedGeoJSONLayer({
  data,
  layerId,
  datasetInfo,
  opacity = 0.7,
  onFeatureClick,
  onFeatureHover,
}: EnhancedGeoJSONLayerProps) {
  const map = useMap();
  const layerRef = useRef<L.GeoJSON | null>(null);

  // ── Stable refs to prevent Leaflet layer recreation on callback changes ──
  const onFeatureClickRef = useRef(onFeatureClick);
  const onFeatureHoverRef = useRef(onFeatureHover);

  useEffect(() => {
    onFeatureClickRef.current = onFeatureClick;
    onFeatureHoverRef.current = onFeatureHover;
  }, [onFeatureClick, onFeatureHover]);

  useEffect(() => {
    if (!data?.features) return;

    const geoJsonLayer = L.geoJSON(data, {
      filter: isValidGeoJSONFeature,
      style: (feature) => {
        if (!feature) return {};
        return getLayerStyle(layerId, feature as GeoJSON.Feature, opacity);
      },
      onEachFeature: (feature, layer) => {
        // Popup
        const popupContent = formatPopupContent(feature as GeoJSON.Feature, layerId, datasetInfo);
        layer.bindPopup(popupContent, {
          maxWidth: 300,
          className: 'custom-popup',
        });

        // Hover effects
        layer.on('mouseover', (e) => {
          const targetLayer = e.target as L.Path;
          if (targetLayer.setStyle) {
            const baseStyle = getLayerStyle(layerId, feature as GeoJSON.Feature, opacity);
            targetLayer.setStyle({
              weight: ((baseStyle.weight as number) ?? 1) + 2,
              fillOpacity: Math.min(opacity + 0.2, 1),
            });
          }
          onFeatureHoverRef.current?.(feature as GeoJSON.Feature, true);
        });

        layer.on('mouseout', (e) => {
          const targetLayer = e.target as L.Path;
          if (targetLayer.setStyle) {
            targetLayer.setStyle(getLayerStyle(layerId, feature as GeoJSON.Feature, opacity));
          }
          onFeatureHoverRef.current?.(feature as GeoJSON.Feature, false);
        });

        layer.on('click', (e) => {
          onFeatureClickRef.current?.(feature as GeoJSON.Feature, e);
        });
      },
      pointToLayer: (_feature, latlng) => {
        if (layerId.includes('stop') || layerId.includes('station')) {
          return L.circleMarker(latlng, {
            radius: 6,
            fillColor: '#3b82f6',
            color: '#ffffff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8,
          });
        }
        return L.marker(latlng, { icon: DefaultIcon });
      },
    });

    map.addLayer(geoJsonLayer);
    layerRef.current = geoJsonLayer;

    return () => {
      if (layerRef.current && map.hasLayer(layerRef.current)) {
        map.removeLayer(layerRef.current);
      }
    };
  }, [data, layerId, datasetInfo, opacity, map]);

  return null;
}
