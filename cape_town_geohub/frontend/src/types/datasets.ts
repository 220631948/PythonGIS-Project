/**
 * Cape Town Dataset Property Types
 * Type definitions for all spatial datasets from Cape Town Open Data Portal
 */

import type { GeoJSONGeometryType } from './geojson';

// ============================================================================
// Suburb and Administrative Boundaries
// ============================================================================

/** Properties for suburb boundary features */
export interface SuburbProperties {
  /** Official suburb name */
  SUBURB_NAM: string;
  /** Ward number from 1-116 */
  WARD_ID: number;
  /** Subcouncil number from 1-24 */
  SUBCOUNCIL_ID: number;
  /** Total population from census */
  POPULATION?: number;
  /** Area in square kilometers */
  AREA_SQKM?: number;
}

// ============================================================================
// Transport Infrastructure
// ============================================================================

/** Properties for MyCiTi bus stop features */
export interface MyCitiStopProperties {
  /** Stop unique identifier */
  STOP_ID: string;
  /** Stop display name */
  STOP_NAME: string;
  /** Route identifiers served */
  ROUTES: string[];
  /** Operational status */
  STATUS: 'active' | 'inactive' | 'maintenance';
  /** Accessibility features available */
  ACCESSIBLE: boolean;
}

/** Properties for rail station features */
export interface RailStationProperties {
  /** Station unique identifier */
  STATION_ID: string;
  /** Station display name */
  STATION_NAME: string;
  /** Rail lines served */
  LINES: string[];
  /** Station type */
  TYPE: 'metro' | 'commuter' | 'intercity';
  /** Whether station is operational */
  OPERATIONAL: boolean;
}

/** Properties for road network features */
export interface RoadProperties {
  /** Road unique identifier */
  ROAD_ID: string;
  /** Road name */
  ROAD_NAME: string;
  /** Road classification */
  CLASS: 'national' | 'provincial' | 'main' | 'secondary' | 'residential';
  /** Surface type */
  SURFACE: 'tar' | 'gravel' | 'paved' | 'unpaved';
  /** Number of lanes */
  LANES?: number;
  /** Speed limit in km/h */
  SPEED_LIMIT?: number;
}

// ============================================================================
// Environmental Features
// ============================================================================

/** Properties for flood zone features */
export interface FloodZoneProperties {
  /** Flood risk return period */
  FLOOD_RISK: '1:10' | '1:20' | '1:50' | '1:100';
  /** Data source */
  SOURCE: string;
  /** Last updated ISO date */
  UPDATED: string;
}

/** Properties for biodiversity features */
export interface BiodiversityProperties {
  /** Area name */
  NAME: string;
  /** Biodiversity category */
  CATEGORY: 'critical' | 'irreplaceable' | 'high' | 'medium' | 'low';
  /** Vegetation type */
  VEGETATION_TYPE?: string;
  /** Protection status */
  PROTECTED: boolean;
  /** Conservation priority */
  PRIORITY: number;
}

/** Properties for wetland features */
export interface WetlandProperties {
  /** Wetland identifier */
  WETLAND_ID: string;
  /** Wetland name */
  NAME: string;
  /** Wetland type */
  TYPE: 'estuarine' | 'palustrine' | 'lacustrine' | 'riverine';
  /** Condition status */
  CONDITION: 'pristine' | 'good' | 'fair' | 'poor' | 'critically_modified';
  /** Area in hectares */
  AREA_HA: number;
}

/** Properties for protected area features */
export interface ProtectedAreaProperties {
  /** Protected area name */
  NAME: string;
  /** IUCN category */
  IUCN_CATEGORY: 'Ia' | 'Ib' | 'II' | 'III' | 'IV' | 'V' | 'VI';
  /** Management authority */
  AUTHORITY: string;
  /** Year established */
  YEAR_EST?: number;
  /** Area in hectares */
  AREA_HA: number;
}

// ============================================================================
// Land Use and Planning
// ============================================================================

/** Properties for zoning features */
export interface ZoningProperties {
  /** Zoning code */
  ZONE_CODE: string;
  /** Zoning description */
  ZONE_DESC: string;
  /** Permitted uses */
  USES: string[];
  /** Maximum building height in meters */
  MAX_HEIGHT?: number;
  /** Floor area ratio */
  FAR?: number;
}

/** Properties for informal settlement features */
export interface InformalSettlementProperties {
  /** Settlement name */
  SETTLEMENT_NAME: string;
  /** Estimated household count */
  HOUSEHOLDS: number;
  /** Water access available */
  WATER_ACCESS: boolean;
  /** Sanitation access available */
  SANITATION_ACCESS: boolean;
  /** Electricity access available */
  ELECTRICITY_ACCESS: boolean;
}

/** Properties for building footprint features */
export interface BuildingProperties {
  /** Building unique identifier */
  BUILDING_ID: string;
  /** Building type */
  TYPE: 'residential' | 'commercial' | 'industrial' | 'institutional' | 'mixed';
  /** Number of floors */
  FLOORS?: number;
  /** Year built */
  YEAR_BUILT?: number;
  /** Footprint area in square meters */
  AREA_SQM: number;
}

// ============================================================================
// Public Services
// ============================================================================

/** Properties for clinic/health facility features */
export interface ClinicProperties {
  /** Facility identifier */
  FACILITY_ID: string;
  /** Facility name */
  NAME: string;
  /** Facility type */
  TYPE: 'clinic' | 'hospital' | 'community_health_centre';
  /** Operating hours */
  HOURS: string;
  /** Emergency services available */
  EMERGENCY: boolean;
  /** Contact phone */
  PHONE?: string;
}

/** Properties for school features */
export interface SchoolProperties {
  /** School identifier */
  SCHOOL_ID: string;
  /** School name */
  NAME: string;
  /** School level */
  LEVEL: 'primary' | 'secondary' | 'combined' | 'special';
  /** Public or private */
  SECTOR: 'public' | 'private';
  /** Number of learners */
  LEARNERS?: number;
}

/** Properties for park/recreation features */
export interface ParkProperties {
  /** Park identifier */
  PARK_ID: string;
  /** Park name */
  NAME: string;
  /** Park type */
  TYPE: 'urban' | 'nature_reserve' | 'sports' | 'playground' | 'botanical';
  /** Area in hectares */
  AREA_HA?: number;
  /** Facilities available */
  FACILITIES: string[];
}

// ============================================================================
// Dataset Metadata
// ============================================================================

/** Dataset category types */
export type DatasetCategory = 
  | 'imagery'
  | 'boundaries'
  | 'infrastructure'
  | 'environment'
  | 'planning'
  | 'transport'
  | 'services';

/** Dataset field type */
export type DatasetFieldType = 'string' | 'number' | 'boolean' | 'date';

/** Dataset field metadata */
export interface DatasetField {
  /** Field name */
  name: string;
  /** Field data type */
  type: DatasetFieldType;
  /** Human-readable label */
  label?: string;
  /** Field description */
  description?: string;
}

/** Dataset metadata */
export interface Dataset {
  /** Unique dataset identifier */
  id: string;
  /** Dataset display name */
  name: string;
  /** Dataset category */
  category: DatasetCategory;
  /** Dataset description */
  description: string;
  /** Geometry type */
  geometry_type: GeoJSONGeometryType;
  /** Number of features */
  feature_count: number;
  /** Source URL */
  source_url: string;
  /** Last updated ISO date */
  last_updated: string;
  /** Field definitions */
  fields: DatasetField[];
}

// ============================================================================
// Union Types for All Properties
// ============================================================================

/** Union of all Cape Town dataset property types */
export type CapeDatasetProperties =
  | SuburbProperties
  | MyCitiStopProperties
  | RailStationProperties
  | RoadProperties
  | FloodZoneProperties
  | BiodiversityProperties
  | WetlandProperties
  | ProtectedAreaProperties
  | ZoningProperties
  | InformalSettlementProperties
  | BuildingProperties
  | ClinicProperties
  | SchoolProperties
  | ParkProperties;
