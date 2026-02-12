/**
 * Canonical mapping from frontend layer IDs to backend dataset keys.
 *
 * Single source of truth consumed by useMapLayers, useViewportData,
 * and any other hook that resolves layer IDs for /api/data endpoints.
 */
export const LAYER_TO_DATASET: Record<string, string> = {
  'zoning-layer': 'zoning',
  'building-footprints-layer': 'building_footprints',
  'open-spaces-layer': 'open_spaces',
  'water-facilities-layer': 'water_facilities',
  'services-layer': 'informal_settlements',
  'clinics-layer': 'clinics',
  'housing-offices-layer': 'housing_offices',
  'courts-layer': 'courts',
  'parks-layer': 'parks',
  'sports-layer': 'sports_grounds',
  'swimming-pools-layer': 'swimming_pools',
  'safety-layer': 'precincts',
  'flood-layer': 'flood_zones',
  'cemeteries-layer': 'cemeteries',
  'trading-layer': 'trading_locations',
  'myciti-stops-layer': 'myciti_stops',
  'myciti-routes-layer': 'myciti_routes',
  'railway-stations-layer': 'rail_stations',
};
