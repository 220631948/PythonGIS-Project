/**
 * 3D Visualization Module
 *
 * Exports all 3D mapping and spatial analysis components
 */

export { default as Map3DView } from './components/Map3DView';
export { default as BuildingExtrusionLayer } from './components/BuildingExtrusionLayer';
export { default as ElevationProfileChart } from './components/ElevationProfileChart';
export { default as ShadowAnalysisPanel } from './components/ShadowAnalysisPanel';
export { useMap3D } from './hooks/useMap3D';

// Export helper functions from BuildingExtrusionLayer
export {
  createBuildingData,
  getBuildingStats,
  filterBuildingsByHeight,
  filterBuildingsByUsage,
} from './components/BuildingExtrusionLayer';
