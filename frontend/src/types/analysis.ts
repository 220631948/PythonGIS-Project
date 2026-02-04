/**
 * Spatial Analysis Types for Cape Town GeoHub
 * Type definitions for suitability, routing, and isochrone analyses
 */

import type { GeoJSONFeature, GeoJSONFeatureCollection } from './geojson';

// ============================================================================
// Suitability Analysis
// ============================================================================

/** Development type for suitability analysis */
export type DevelopmentType = 'residential' | 'commercial' | 'industrial' | 'mixed' | 'recreation';

/** Suitability analysis request */
export interface SuitabilityRequest {
    lat: number;
    lng: number;
    development_type: DevelopmentType;
    radius_meters?: number;
}

/** Suitability criterion result */
export interface SuitabilityCriterion {
    name: string;
    category: 'constraint' | 'opportunity' | 'regulatory';
    score: number;
    weight: number;
    description: string;
    raw_value?: string | number;
    distance_meters?: number;
}

/** Constraint severity levels */
export type ConstraintSeverity = 'critical' | 'high' | 'medium' | 'low';

/** Constraint types */
export type ConstraintType = 'flood_risk' | 'biodiversity' | 'wetland' | 'protected_area' | 'zoning';

/** Development constraint */
export interface Constraint {
    type: ConstraintType;
    severity: ConstraintSeverity;
    description: string;
    distance_meters?: number;
    buffer_required_meters?: number;
}

/** Suitability grade */
export type SuitabilityGrade = 'A' | 'B' | 'C' | 'D' | 'F';

/** Suitability analysis result */
export interface SuitabilityResult {
    location: {
        lat: number;
        lng: number;
    };
    overall_score: number;
    grade: SuitabilityGrade;
    criteria: SuitabilityCriterion[];
    constraints: Constraint[];
    opportunities: string[];
    recommendations: string[];
    generated_at: string;
}

// ============================================================================
// Routing Analysis
// ============================================================================

/** Transport mode options */
export type TransportMode = 'walk' | 'cycle' | 'drive' | 'transit';

/** Route optimization preference */
export type RouteOptimization = 'fastest' | 'shortest';

/** Route request */
export interface RouteRequest {
    origin: {
        lat: number;
        lon: number;
    };
    destination: {
        lat: number;
        lon: number;
    };
    mode: TransportMode;
    optimize: RouteOptimization;
}

/** Route instruction */
export interface RouteInstruction {
    text: string;
    distance: number;
    duration: number;
}

/** Route calculation result */
export interface RouteResult {
    distance_meters: number;
    duration_seconds: number;
    geometry: GeoJSONFeature<Record<string, unknown>>;
    instructions: RouteInstruction[];
    elevation_gain_meters?: number;
}

// ============================================================================
// Isochrone Analysis
// ============================================================================

/** Isochrone request */
export interface IsochroneRequest {
    center: {
        lat: number;
        lon: number;
    };
    time_minutes: number[];
    mode: TransportMode;
}

/** Isochrone polygon properties */
export interface IsochroneProperties {
    time_minutes: number;
    area_sqm: number;
}

/** Isochrone result */
export interface IsochroneResult {
    polygons: GeoJSONFeatureCollection<IsochroneProperties>;
}

// ============================================================================
// Nearest Facility Analysis
// ============================================================================

/** Facility types for nearest search */
export type FacilityType =
    | 'clinics'
    | 'schools'
    | 'parks'
    | 'libraries'
    | 'police_stations'
    | 'fire_stations';

/** Nearest facility request */
export interface NearestFacilityRequest {
    lat: number;
    lon: number;
    facility_type: FacilityType;
    count?: number;
}

/** Facility result */
export interface Facility {
    id: string;
    name: string;
    type: FacilityType;
    lat: number;
    lon: number;
    distance: number;
    properties?: Record<string, unknown>;
}

/** Nearest facility result */
export interface NearestFacilityResult {
    facilities: Facility[];
}

// ============================================================================
// Buffer Analysis
// ============================================================================

/** Buffer request */
export interface BufferRequest {
    geometry: GeoJSONFeature;
    distance_meters: number;
    units?: 'meters' | 'kilometers';
}

/** Buffer result */
export interface BufferResult {
    original: GeoJSONFeature;
    buffer: GeoJSONFeature<{ buffer_distance: number }>;
    area_sqm: number;
}

// ============================================================================
// Intersection Analysis
// ============================================================================

/** Intersection request */
export interface IntersectionRequest {
    geometry: GeoJSONFeature;
    layer_id: string;
}

/** Intersection result */
export interface IntersectionResult {
    features: GeoJSONFeature[];
    count: number;
    total_area_sqm?: number;
}
