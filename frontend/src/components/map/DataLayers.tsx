import { LayersControl, GeoJSON } from 'react-leaflet';
import { LAYER_TO_DATASET } from './useMapLayers';

interface DataLayersProps {
  geoData: Record<string, { geojson: GeoJSON.FeatureCollection; dataset: { name: string } } | undefined>;
  layerOpacity: number;
  onFeatureClick?: (feature: GeoJSON.Feature, event: unknown) => void;
  onFeatureHover?: (feature: GeoJSON.Feature, hovering: boolean) => void;
}

export function DataLayers({ geoData, layerOpacity, onFeatureClick, onFeatureHover }: DataLayersProps) {
  return (
    <>
      {Object.keys(geoData).map((layerId) => {
        const layerData = geoData[layerId];
        if (!layerData?.geojson) return null;
        const datasetName = LAYER_TO_DATASET[layerId] || layerId;
        return (
          <LayersControl.Overlay key={layerId} checked name={datasetName}>
            <GeoJSON
              data={layerData.geojson}
              style={{
                color: '#3b82f6',
                weight: 2,
                opacity: 0.7,
                fillOpacity: layerOpacity,
              }}
              onEachFeature={(feature, layer) => {
                const props = feature.properties || {};
                const name = props.name || props.NAME || props.label || datasetName;

                // Build popup content
                const popupLines = [`<strong>${String(name)}</strong>`];
                if (props.description) popupLines.push(`<p>${String(props.description)}</p>`);
                if (props.category) popupLines.push(`<p>Category: ${String(props.category)}</p>`);
                if (props.area) popupLines.push(`<p>Area: ${String(props.area)}</p>`);

                layer.bindPopup(`<div class="p-2">${popupLines.join('')}</div>`);

                // Attach event handlers
                layer.on({
                  click: (e) => onFeatureClick?.(feature, e),
                  mouseover: () => onFeatureHover?.(feature, true),
                  mouseout: () => onFeatureHover?.(feature, false),
                });
              }}
            />
          </LayersControl.Overlay>
        );
      })}
    </>
  );
}
