/**
 * GeoJSON Type Definitions for Cape Town GeoHub
 * Follows RFC 7946 GeoJSON specification with full type safety
 */

/** Position as [longitude, latitude] or [longitude, latitude, altitude] */
export type Position = [number, number] | [number, number, number];

/** Bounding box as [west, south, east, north] */
export type BBox = [number, number, number, number];

/** Point geometry */
export interface Point {
  type: 'Point';
  coordinates: Position;
}

/** MultiPoint geometry */
export interface MultiPoint {
  type: 'MultiPoint';
  coordinates: Position[];
}

/** LineString geometry */
export interface LineString {
  type: 'LineString';
  coordinates: Position[];
}

/** MultiLineString geometry */
export interface MultiLineString {
  type: 'MultiLineString';
  coordinates: Position[][];
}

/** Polygon geometry - array of linear rings, first is exterior, rest are holes */
export interface Polygon {
  type: 'Polygon';
  coordinates: Position[][];
}

/** MultiPolygon geometry */
export interface MultiPolygon {
  type: 'MultiPolygon';
  coordinates: Position[][][];
}

/** Union of all single geometry types */
export type SingleGeometry = Point | MultiPoint | LineString | MultiLineString | Polygon | MultiPolygon;

/** GeometryCollection containing multiple geometries */
export interface GeometryCollection {
  type: 'GeometryCollection';
  geometries: Geometry[];
}

/** Union of all geometry types */
export type Geometry = SingleGeometry | GeometryCollection;

/** GeoJSON geometry type string literals */
export type GeoJSONGeometryType = 
  | 'Point' 
  | 'MultiPoint' 
  | 'LineString' 
  | 'MultiLineString' 
  | 'Polygon' 
  | 'MultiPolygon' 
  | 'GeometryCollection';

/**
 * GeoJSON Feature with generic properties
 * @template P - Properties type, defaults to Record<string, unknown>
 */
export interface GeoJSONFeature<P = Record<string, unknown>> {
  type: 'Feature';
  id?: string | number;
  geometry: Geometry | null;
  properties: P;
  bbox?: BBox;
}

/**
 * GeoJSON FeatureCollection with generic properties
 * @template P - Properties type for features
 */
export interface GeoJSONFeatureCollection<P = Record<string, unknown>> {
  type: 'FeatureCollection';
  features: GeoJSONFeature<P>[];
  bbox?: BBox;
}

/** Union of all GeoJSON object types */
export type GeoJSONObject = Geometry | GeoJSONFeature | GeoJSONFeatureCollection;

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if geometry is a Point
 */
export function isPoint(geometry: Geometry): geometry is Point {
  return geometry.type === 'Point';
}

/**
 * Type guard to check if geometry is a Polygon
 */
export function isPolygon(geometry: Geometry): geometry is Polygon {
  return geometry.type === 'Polygon';
}

/**
 * Type guard to check if geometry is a LineString
 */
export function isLineString(geometry: Geometry): geometry is LineString {
  return geometry.type === 'LineString';
}

/**
 * Type guard to check if geometry is a MultiPoint
 */
export function isMultiPoint(geometry: Geometry): geometry is MultiPoint {
  return geometry.type === 'MultiPoint';
}

/**
 * Type guard to check if geometry is a MultiPolygon
 */
export function isMultiPolygon(geometry: Geometry): geometry is MultiPolygon {
  return geometry.type === 'MultiPolygon';
}

/**
 * Type guard to check if geometry is a MultiLineString
 */
export function isMultiLineString(geometry: Geometry): geometry is MultiLineString {
  return geometry.type === 'MultiLineString';
}

/**
 * Type guard to check if geometry is a GeometryCollection
 */
export function isGeometryCollection(geometry: Geometry): geometry is GeometryCollection {
  return geometry.type === 'GeometryCollection';
}

/**
 * Type guard to check if object is a GeoJSON Feature
 */
export function isFeature<P = Record<string, unknown>>(
  obj: unknown
): obj is GeoJSONFeature<P> {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'type' in obj &&
    (obj as { type: string }).type === 'Feature'
  );
}

/**
 * Type guard to check if object is a GeoJSON FeatureCollection
 */
export function isFeatureCollection<P = Record<string, unknown>>(
  obj: unknown
): obj is GeoJSONFeatureCollection<P> {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'type' in obj &&
    (obj as { type: string }).type === 'FeatureCollection' &&
    'features' in obj &&
    Array.isArray((obj as { features: unknown }).features)
  );
}

/**
 * Type guard to check if object is any GeoJSON object
 */
export function isGeoJSON(obj: unknown): obj is GeoJSONObject {
  if (typeof obj !== 'object' || obj === null || !('type' in obj)) {
    return false;
  }
  const type = (obj as { type: string }).type;
  return [
    'Point', 'MultiPoint', 'LineString', 'MultiLineString',
    'Polygon', 'MultiPolygon', 'GeometryCollection', 'Feature', 'FeatureCollection'
  ].includes(type);
}
