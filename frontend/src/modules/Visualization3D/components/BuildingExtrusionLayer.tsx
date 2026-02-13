/**
 * BuildingExtrusionLayer Component
 *
 * Custom deck.gl layer for rendering 3D buildings with realistic lighting
 */

import { PolygonLayer } from '@deck.gl/layers';
import { CompositeLayer } from '@deck.gl/core';
import type { BuildingData } from '../../../types/api-2026';

interface BuildingExtrusionLayerProps {
  id: string;
  data: BuildingData[];
  lighting?: {
    ambientRatio: number;
    diffuseRatio: number;
    sunAzimuth: number;
    sunAltitude: number;
  };
  opacity?: number;
  pickable?: boolean;
  onBuildingClick?: (building: BuildingData) => void;
  onBuildingHover?: (building: BuildingData | null) => void;
}

const DEFAULT_LIGHTING = {
  ambientRatio: 0.4,
  diffuseRatio: 0.6,
  sunAzimuth: 315,
  sunAltitude: 45,
};

class BuildingExtrusionLayer extends CompositeLayer<BuildingExtrusionLayerProps> {
  static layerName = 'BuildingExtrusionLayer';

  static defaultProps = {
    lighting: DEFAULT_LIGHTING,
    opacity: 0.9,
    pickable: true,
  };

  renderLayers() {
    const { data, lighting = DEFAULT_LIGHTING, opacity, pickable, onBuildingClick, onBuildingHover } = this.props;

    return [
      new PolygonLayer({
        id: `${this.props.id}-polygon`,
        data,
        pickable,
        stroked: true,
        filled: true,
        wireframe: false,
        extruded: true,
        lineWidthMinPixels: 1,

        // Geometry accessors
        getPolygon: (d: BuildingData) => d.geometry.coordinates[0],
        getElevation: (d: BuildingData) => d.properties.height || 10,

        // Color accessors - height-based gradient
        getFillColor: (d: BuildingData) => {
          const height = d.properties.height || 10;
          const usage = d.properties.usage || 'residential';

          // Color based on building usage
          const colorSchemes: Record<string, [number, number, number]> = {
            residential: [100, 150, 255],
            commercial: [255, 200, 100],
            industrial: [150, 100, 150],
            office: [100, 200, 200],
            retail: [255, 150, 150],
            mixed: [150, 150, 200],
            public: [100, 255, 150],
            other: [180, 180, 180],
          };

          const defaultColor: [number, number, number] = [180, 180, 180];
          const baseColor = colorSchemes[usage] ?? colorSchemes.other ?? defaultColor;

          // Adjust brightness based on height
          const heightFactor = Math.min(height / 100, 1);
          const brightness = 0.6 + heightFactor * 0.4;

          return [
            Math.floor(baseColor[0] * brightness),
            Math.floor(baseColor[1] * brightness),
            Math.floor(baseColor[2] * brightness),
            Math.floor(255 * opacity!),
          ];
        },

        getLineColor: [255, 255, 255, 120],
        getLineWidth: 1,

        // Lighting effects
        material: {
          ambient: lighting.ambientRatio,
          diffuse: lighting.diffuseRatio,
          shininess: 32,
          specularColor: [60, 60, 60],
        },

        // Lighting direction based on sun position
        lightSettings: {
          lightsPosition: [
            // Sun position
            Math.cos((lighting.sunAzimuth * Math.PI) / 180) *
              Math.cos((lighting.sunAltitude * Math.PI) / 180),
            Math.sin((lighting.sunAzimuth * Math.PI) / 180) *
              Math.cos((lighting.sunAltitude * Math.PI) / 180),
            Math.sin((lighting.sunAltitude * Math.PI) / 180),

            // Ambient light from above
            0, 0, 1,
          ],
          lightsStrength: [2.0, 0.5],
          numberOfLights: 2,
        },

        // Interaction callbacks
        onClick: (info: any) => {
          if (info.object && onBuildingClick) {
            onBuildingClick(info.object);
          }
        },

        onHover: (info: any) => {
          if (onBuildingHover) {
            onBuildingHover(info.object || null);
          }
        },

        // Update triggers
        updateTriggers: {
          getFillColor: [lighting, opacity],
          getElevation: [data],
        },
      }),
    ];
  }
}

export default BuildingExtrusionLayer;

/**
 * Helper function to create building data from GeoJSON
 */
export function createBuildingData(geojson: any): BuildingData[] {
  if (!geojson || !geojson.features) {
    return [];
  }

  return geojson.features.map((feature: any) => ({
    id: feature.id || feature.properties?.id || Math.random().toString(36),
    geometry: feature.geometry,
    properties: {
      height: feature.properties?.height || feature.properties?.building_height || 10,
      usage: feature.properties?.usage || feature.properties?.building_type || 'other',
      name: feature.properties?.name || feature.properties?.building_name,
      address: feature.properties?.address,
      year_built: feature.properties?.year_built,
      floors: feature.properties?.floors || Math.ceil((feature.properties?.height || 10) / 3),
    },
  }));
}

/**
 * Helper function to calculate building statistics
 */
export function getBuildingStats(buildings: BuildingData[]) {
  if (buildings.length === 0) {
    return {
      count: 0,
      avgHeight: 0,
      maxHeight: 0,
      totalArea: 0,
      byUsage: {},
    };
  }

  const heights = buildings.map(b => b.properties.height || 0);
  const maxHeight = Math.max(...heights);
  const avgHeight = heights.reduce((sum, h) => sum + h, 0) / heights.length;

  const byUsage: Record<string, number> = {};
  buildings.forEach(b => {
    const usage = b.properties.usage || 'other';
    byUsage[usage] = (byUsage[usage] || 0) + 1;
  });

  // Rough area calculation (would need actual polygon area in production)
  const totalArea = buildings.length * 400; // Assuming avg 20m x 20m footprint

  return {
    count: buildings.length,
    avgHeight: Math.round(avgHeight * 10) / 10,
    maxHeight,
    totalArea,
    byUsage,
  };
}

/**
 * Helper function to filter buildings by height range
 */
export function filterBuildingsByHeight(
  buildings: BuildingData[],
  minHeight: number = 0,
  maxHeight: number = Infinity
): BuildingData[] {
  return buildings.filter(b => {
    const height = b.properties.height || 0;
    return height >= minHeight && height <= maxHeight;
  });
}

/**
 * Helper function to filter buildings by usage type
 */
export function filterBuildingsByUsage(
  buildings: BuildingData[],
  usageTypes: string[]
): BuildingData[] {
  if (usageTypes.length === 0) {
    return buildings;
  }

  return buildings.filter(b =>
    usageTypes.includes(b.properties.usage || 'other')
  );
}
