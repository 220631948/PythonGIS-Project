/**
 * API Response Types for Cape Town GeoHub
 * Type definitions for all API endpoints
 */

import type { GeoJSONFeatureCollection, GeoJSONFeature } from './geojson';
import type { Dataset } from './datasets';

// ============================================================================
// Generic API Response Types
// ============================================================================

/**
 * Generic API response wrapper
 * @template T - Data type
 */
export interface ApiResponse<T> {
    data: T;
    status: 'success' | 'error';
    message?: string;
    timestamp: string;
}

/** API error response */
export interface ApiError {
    error: string;
    message: string;
    details?: Record<string, unknown>;
    status_code: number;
}

/**
 * Paginated response wrapper
 * @template T - Item type
 */
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
}

// ============================================================================
// Dataset Endpoints
// ============================================================================

/** Response from dataset list endpoint */
export type DatasetListResponse = ApiResponse<Dataset[]>;

/**
 * GeoJSON response with typed properties
 * @template P - Properties type
 */
export type GeoJSONResponse<P = Record<string, unknown>> = ApiResponse<GeoJSONFeatureCollection<P>>;

// ============================================================================
// Analysis Endpoints
// ============================================================================

/** Suitability analysis response */
export interface SuitabilityResponse {
    location: {
        lat: number;
        lng: number;
    };
    overall_score: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    criteria: SuitabilityCriterion[];
    constraints: Constraint[];
    opportunities: string[];
    recommendations: string[];
    generated_at: string;
}

/** Individual suitability criterion */
export interface SuitabilityCriterion {
    name: string;
    category: 'constraint' | 'opportunity' | 'regulatory';
    score: number;
    weight: number;
    description: string;
    raw_value?: string | number;
    distance_meters?: number;
}

/** Development constraint */
export interface Constraint {
    type: 'flood_risk' | 'biodiversity' | 'wetland' | 'protected_area' | 'zoning';
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    distance_meters?: number;
    buffer_required_meters?: number;
}

/** Route calculation response */
export interface RouteResponse {
    distance_meters: number;
    duration_seconds: number;
    geometry: GeoJSONFeature<Record<string, unknown>>;
    instructions: RouteInstruction[];
    elevation_gain_meters?: number;
}

/** Route instruction */
export interface RouteInstruction {
    text: string;
    distance: number;
    duration: number;
}

/** Isochrone analysis response */
export interface IsochroneResponse {
    polygons: GeoJSONFeatureCollection<{
        time_minutes: number;
        area_sqm: number;
    }>;
}

/** Filter schema response */
export interface FilterSchemaResponse {
    dataset: string;
    fields: FilterFieldSchema[];
}

/** Filter field schema */
export interface FilterFieldSchema {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'date';
    operators: string[];
    values?: unknown[];
}

/** Dashboard data response */
export interface DashboardDataResponse {
    total_datasets: number;
    total_features: number;
    categories: CategoryStats[];
    recent_updates: RecentUpdate[];
    coverage_area_sqkm: number;
}

/** Category statistics */
interface CategoryStats {
    category: string;
    count: number;
    percentage: number;
}

/** Recent update info */
interface RecentUpdate {
    dataset_id: string;
    dataset_name: string;
    updated_at: string;
    changes: number;
}

// ============================================================================
// Health Check
// ============================================================================

/** Health check response */
export interface HealthResponse {
    status: 'healthy' | 'degraded' | 'unhealthy';
    version: string;
    database: 'connected' | 'disconnected';
    cache: 'ready' | 'unavailable';
    uptime_seconds: number;
}
