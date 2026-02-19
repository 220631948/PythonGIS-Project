import React from 'react';
import { LayersControl } from 'react-leaflet';
import type { FeatureCollection, Feature } from 'geojson';
import type { LeafletEvent } from 'leaflet';
import { EnhancedGeoJSONLayer } from './EnhancedGeoJSONLayer';
import { LAYER_TO_DATASET } from './useMapLayers';

interface DataLayersProps {
  geoData: Record<string, { geojson: FeatureCollection; dataset: { name: string } } | undefined>;
  layerOpacity: number;
  onFeatureClick?: (feature: Feature, event: LeafletEvent) => void;
  onFeatureHover?: (feature: Feature, hovering: boolean) => void;
}

export const DataLayers: React.FC<DataLayersProps> = ({
  geoData,
  layerOpacity,
  onFeatureClick,
  onFeatureHover,
}) => {
  return (
    <>
      {Object.entries(geoData).map(([layerId, layerData]) => {
        if (!layerData?.geojson) return null;

        // Use mapped dataset name or fallback to layer ID
        const datasetName = LAYER_TO_DATASET[layerId] || layerId;

        return (
          <LayersControl.Overlay key={layerId} checked name={datasetName}>
            <EnhancedGeoJSONLayer
              data={layerData.geojson}
              layerId={layerId}
              datasetInfo={layerData.dataset}
              opacity={layerOpacity}
              onFeatureClick={onFeatureClick}
              onFeatureHover={onFeatureHover}
            />
          </LayersControl.Overlay>
        );
      })}
    </>
  );
};
