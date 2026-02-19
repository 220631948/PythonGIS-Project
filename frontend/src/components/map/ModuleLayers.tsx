import { LayersControl, LayerGroup, GeoJSON } from 'react-leaflet';
import type { PathOptions } from 'leaflet';
import { HeatmapLayer, extractHeatmapPoints } from './HeatmapLayer';
import { PostGISClusterOverlay } from './PostGISClusterOverlay';
import type { ModuleLayerData } from './types';

interface ModuleLayersProps {
  moduleLayerData: ModuleLayerData | null;
}

export function ModuleLayers({ moduleLayerData }: ModuleLayersProps) {
  if (!moduleLayerData) return null;

  const showModuleAnalysis =
    moduleLayerData.type === 'FeatureCollection' ||
    moduleLayerData.type === 'geojson' ||
    moduleLayerData.type === 'choropleth' ||
    moduleLayerData.type === 'multi-layer' ||
    (moduleLayerData.buffers && moduleLayerData.buffers.length > 0);

  return (
    <>
      {/* Module Analysis */}
      {showModuleAnalysis && (
        <LayersControl.Overlay checked name="Module Analysis">
          <LayerGroup>
            {(moduleLayerData.type === 'FeatureCollection' || moduleLayerData.type === 'geojson') && (
              <GeoJSON
                key={`module-geo-${((moduleLayerData.data ?? moduleLayerData) as GeoJSON.FeatureCollection)?.features?.length ?? 0}`}
                data={((moduleLayerData.data ?? moduleLayerData) as GeoJSON.FeatureCollection)}
                style={(feature) =>
                  typeof moduleLayerData.style === 'function'
                    ? (moduleLayerData.style as (f: GeoJSON.Feature | undefined) => PathOptions)(feature)
                    : { color: feature?.properties?.color ?? '#3b82f6', weight: 2, opacity: 0.8 }
                }
                onEachFeature={(feature, layer) => {
                  if (typeof moduleLayerData.popup === 'function') {
                    layer.bindPopup((moduleLayerData.popup as (f: GeoJSON.Feature) => string)(feature));
                  } else if (feature.properties?.name) {
                    layer.bindPopup(String(feature.properties.name));
                  }
                }}
              />
            )}

            {moduleLayerData.type === 'choropleth' && (
              <GeoJSON
                key={`module-choro-${(moduleLayerData.data as GeoJSON.FeatureCollection)?.features?.length ?? 0}`}
                data={moduleLayerData.data as GeoJSON.FeatureCollection}
                style={(feature) => ({
                  fillColor: (moduleLayerData.colorFn as (v: unknown) => string)(feature?.properties?.crime_index),
                  weight: 2,
                  opacity: 1,
                  color: 'white',
                  fillOpacity: 0.7,
                })}
                onEachFeature={(feature, layer) => {
                  layer.bindPopup(`
                    <div class="p-2">
                      <strong>${String(feature.properties?.name)}</strong><br/>
                      Index: ${String(feature.properties?.crime_index)}
                    </div>
                  `);
                }}
              />
            )}

            {moduleLayerData.buffers?.map(
              (buffer, idx) => (
                <GeoJSON
                  key={`transport-buffer-${idx}`}
                  data={buffer.polygon}
                  style={{ color: buffer.color, fillColor: buffer.color, fillOpacity: buffer.opacity, weight: 1 }}
                />
              ),
            )}

            {moduleLayerData.type === 'multi-layer' &&
              moduleLayerData.layers?.map((layerCfg, idx) => (
                <GeoJSON
                  key={`env-layer-${idx}`}
                  data={layerCfg.data}
                  style={layerCfg.style}
                  onEachFeature={(feature, layerInstance) => {
                    if (layerCfg.popup) layerInstance.bindPopup(layerCfg.popup(feature));
                  }}
                />
              ))}
          </LayerGroup>
        </LayersControl.Overlay>
      )}

      {/* Heatmap Layer - for density visualization */}
      {moduleLayerData.type === 'heatmap' && moduleLayerData.data && (
        <LayersControl.Overlay checked name="Density Heatmap">
          <HeatmapLayer
            points={extractHeatmapPoints(moduleLayerData.data)}
            options={{
              radius: 25,
              blur: 15,
              maxZoom: 17,
              max: 1.0
            }}
          />
        </LayersControl.Overlay>
      )}

      {/* PostGIS cluster layers for enabled point datasets */}
      {moduleLayerData.type === 'cluster' && (
        <LayersControl.Overlay checked name="PostGIS Clusters">
          <LayerGroup>
            <PostGISClusterOverlay
              dataset={(moduleLayerData.data as unknown as { dataset?: string })?.dataset ?? 'clinics'}
              color="#3388ff"
            />
          </LayerGroup>
        </LayersControl.Overlay>
      )}
    </>
  );
}
