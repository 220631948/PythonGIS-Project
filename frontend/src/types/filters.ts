/**
 * Filter Types for Cape Town GeoHub
 * Type definitions for dataset filtering and faceted search
 */

// ============================================================================
// Filter Operators
// ============================================================================

/** Filter operator types */
export type FilterOperator =
    | 'equals'
    | 'not_equals'
    | 'contains'
    | 'greater_than'
    | 'less_than'
    | 'between'
    | 'is_one_of'
    | 'is_null'
    | 'is_not_null';

/** Filter logic types */
export type FilterLogic = 'AND' | 'OR';

// ============================================================================
// Filter Conditions
// ============================================================================

/**
 * Filter condition
 * Note: 'value' uses 'unknown' to support dynamic filter values
 * This is a controlled exception to the no-any rule
 */
export interface FilterCondition {
    /** Field to filter on */
    field: string;
    /** Filter operator */
    operator: FilterOperator;
    /** Filter value - can be any type depending on field */
    value: unknown;
    /** Logic connector for multiple conditions */
    logic?: FilterLogic;
}

/** Active filter set */
export interface FilterSet {
    /** Filter conditions */
    conditions: FilterCondition[];
    /** Default logic for combining conditions */
    defaultLogic: FilterLogic;
}

// ============================================================================
// Filter Schema
// ============================================================================

/** Field type for filtering */
export type FilterFieldType = 'string' | 'number' | 'boolean' | 'date';

/** Filter field definition */
export interface FilterField {
    /** Field name */
    name: string;
    /** Field data type */
    type: FilterFieldType;
    /** Supported operators for this field */
    operators: FilterOperator[];
    /** Predefined values for enum-like fields */
    values?: unknown[];
}

/** Filter schema for a dataset */
export interface FilterSchema {
    /** Dataset identifier */
    dataset: string;
    /** Available filter fields */
    fields: FilterField[];
}

// ============================================================================
// Faceted Search
// ============================================================================

/** Facet value with count */
export interface FacetValue {
    /** Value */
    value: unknown;
    /** Count of items with this value */
    count: number;
}

/** Facet result for a field */
export interface FacetResult {
    /** Field name */
    field: string;
    /** Available values with counts */
    values: FacetValue[];
}

/** Faceted search response */
export interface FacetedSearchResult {
    /** Facet results by field */
    facets: FacetResult[];
    /** Total matching results */
    total: number;
}

// ============================================================================
// Sort Configuration
// ============================================================================

/** Sort direction */
export type SortDirection = 'asc' | 'desc';

/** Sort configuration */
export interface SortConfig {
    /** Field to sort by */
    field: string;
    /** Sort direction */
    direction: SortDirection;
}

// ============================================================================
// Query Configuration
// ============================================================================

/** Complete query configuration */
export interface QueryConfig {
    /** Filter conditions */
    filters?: FilterSet;
    /** Sort configuration */
    sort?: SortConfig;
    /** Page number (1-indexed) */
    page?: number;
    /** Page size */
    pageSize?: number;
    /** Fields to return */
    fields?: string[];
    /** Facet fields to compute */
    facetFields?: string[];
}

// ============================================================================
// Spatial Filters
// ============================================================================

/** Bounding box filter */
export interface BBoxFilter {
    /** Minimum longitude */
    minLon: number;
    /** Minimum latitude */
    minLat: number;
    /** Maximum longitude */
    maxLon: number;
    /** Maximum latitude */
    maxLat: number;
}

/** Radius filter */
export interface RadiusFilter {
    /** Center longitude */
    centerLon: number;
    /** Center latitude */
    centerLat: number;
    /** Radius in meters */
    radiusMeters: number;
}

/** Spatial filter configuration */
export interface SpatialFilter {
    /** Bounding box filter */
    bbox?: BBoxFilter;
    /** Radius filter */
    radius?: RadiusFilter;
}
