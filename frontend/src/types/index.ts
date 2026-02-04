/**
 * Type Definitions Index for Cape Town GeoHub
 * Re-exports all types for convenient imports
 */

// GeoJSON types
export type {
  Position,
  BBox,
  Point,
  MultiPoint,
  LineString,
  MultiLineString,
  Polygon,
  MultiPolygon,
  SingleGeometry,
  GeometryCollection,
  Geometry,
  GeoJSONGeometryType,
  GeoJSONFeature,
  GeoJSONFeatureCollection,
  GeoJSONObject,
} from './geojson';

export {
  isPoint,
  isPolygon,
  isLineString,
  isMultiPoint,
  isMultiPolygon,
  isMultiLineString,
  isGeometryCollection,
  isFeature,
  isFeatureCollection,
  isGeoJSON,
} from './geojson';

// Dataset types
export type {
  SuburbProperties,
  MyCitiStopProperties,
  RailStationProperties,
  RoadProperties,
  FloodZoneProperties,
  BiodiversityProperties,
  WetlandProperties,
  ProtectedAreaProperties,
  ZoningProperties,
  InformalSettlementProperties,
  BuildingProperties,
  ClinicProperties,
  SchoolProperties,
  ParkProperties,
  DatasetCategory,
  DatasetFieldType,
  DatasetField,
  Dataset,
  CapeDatasetProperties,
} from './datasets';

// API types
export type {
  ApiResponse,
  ApiError,
  PaginatedResponse,
  DatasetListResponse,
  GeoJSONResponse,
  SuitabilityResponse,
  RouteResponse,
  IsochroneResponse,
  FilterSchemaResponse,
  DashboardDataResponse,
  HealthResponse,
} from './api';

// Analysis types
export type {
  DevelopmentType,
  SuitabilityRequest,
  SuitabilityCriterion,
  ConstraintSeverity,
  ConstraintType,
  Constraint,
  SuitabilityGrade,
  SuitabilityResult,
  TransportMode,
  RouteOptimization,
  RouteRequest,
  RouteInstruction,
  RouteResult,
  IsochroneRequest,
  IsochroneProperties,
  IsochroneResult,
  FacilityType,
  NearestFacilityRequest,
  Facility,
  NearestFacilityResult,
  BufferRequest,
  BufferResult,
  IntersectionRequest,
  IntersectionResult,
} from './analysis';

// Component types
export type {
  MapViewProps,
  LayerType,
  LayerConfig,
  LayerStyleConfig,
  CardProps,
  ModalProps,
  ButtonVariant,
  ButtonSize,
  ButtonProps,
  InputProps,
  SelectOption,
  SelectProps,
  ToggleProps,
  SidebarProps,
  TabConfig,
  TabsProps,
  TableColumn,
  TableProps,
  ListItemProps,
} from './components';

// Filter types
export type {
  FilterOperator,
  FilterLogic,
  FilterCondition,
  FilterSet,
  FilterFieldType,
  FilterField,
  FilterSchema,
  FacetValue,
  FacetResult,
  FacetedSearchResult,
  SortDirection,
  SortConfig,
  QueryConfig,
  BBoxFilter,
  RadiusFilter,
  SpatialFilter,
} from './filters';
