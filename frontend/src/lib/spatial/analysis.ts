/**
 * Spatial Analysis Utilities using Turf.js
 * Core functions for GIS analysis in Cape Town GeoHub
 * TypeScript implementation with strict typing
 */

import { point as turfPoint } from '@turf/helpers';
import turfDistance from '@turf/distance';
import turfNearestPoint from '@turf/nearest-point';
import turfBuffer from '@turf/buffer';
import turfPointsWithinPolygon from '@turf/points-within-polygon';
import turfCentroid from '@turf/centroid';
import turfSimplify from '@turf/simplify';
import type { Feature, Point, Polygon, FeatureCollection, Position } from 'geojson';

// Types
export type AccessLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface AccessScoreResult {
    score: number;
    level: AccessLevel;
    color: string;
    breakdown: Record<string, { distance: number; score: number }>;
}

export interface ServiceDistances {
    water: number;
    clinic: number;
    school: number;
    sanitation?: number;
}

export interface WalkingBuffer {
    polygon: Feature<Polygon>;
    minutes: number;
    meters: number;
    label: string;
}

/**
 * Calculate distance to the nearest point from a set of points
 * @param origin - [lng, lat] coordinates
 * @param destinations - GeoJSON FeatureCollection of points
 * @returns Distance in meters to nearest point
 */
export const calculateNearestDistance = (
    origin: Position,
    destinations: FeatureCollection<Point>
): number => {
    if (!destinations?.features?.length) return Infinity;

    const originPoint = turfPoint(origin);
    let minDistance = Infinity;

    for (const feature of destinations.features) {
        if (feature.geometry?.type === 'Point') {
            const distance = turfDistance(originPoint, feature, { units: 'meters' });
            if (distance < minDistance) {
                minDistance = distance;
            }
        }
    }

    return minDistance;
};

/**
 * Find the nearest point feature from a collection
 * @param origin - [lng, lat] coordinates
 * @param destinations - GeoJSON FeatureCollection
 * @returns Nearest feature with distance property added
 */
export const findNearestPoint = (
    origin: Position,
    destinations: FeatureCollection<Point>
): Feature<Point> | null => {
    if (!destinations?.features?.length) return null;

    const originPoint = turfPoint(origin);
    const nearest = turfNearestPoint(originPoint, destinations);

    if (nearest) {
        nearest.properties = {
            ...nearest.properties,
            distance: turfDistance(originPoint, nearest, { units: 'meters' })
        };
    }

    return nearest;
};

/**
 * Generate walking distance buffers (concentric circles)
 * Walking speed: 1.2 m/s = 72 m/min
 * @param center - [lng, lat] coordinates
 * @param minutes - Array of walking times in minutes (default: 10, 20, 30)
 * @returns Array of buffer polygons with metadata
 */
export const generateWalkingBuffers = (
    center: Position,
    minutes: number[] = [10, 20, 30]
): WalkingBuffer[] => {
    const WALKING_SPEED_MPS = 1.2; // meters per second
    const WALKING_SPEED_MPM = WALKING_SPEED_MPS * 60; // 72 meters per minute

    const centerPoint = turfPoint(center);

    return minutes.map((mins) => {
        const meters = Math.round(mins * WALKING_SPEED_MPM);
        const polygon = turfBuffer(centerPoint, meters, { units: 'meters' }) as Feature<Polygon>;

        polygon.properties = {
            minutes: mins,
            meters,
            label: `${mins} min walk`
        };

        return {
            polygon,
            minutes: mins,
            meters,
            label: `${mins} min walk (${meters}m)`
        };
    });
};

/**
 * Calculate service access score for a location
 * Weighted scoring: Water 40%, Health 30%, Education 30%
 * @param distances - Object with distance values in meters
 * @returns Score (0-100), access level, and color
 */
export const calculateAccessScore = (distances: ServiceDistances): AccessScoreResult => {
    const weights = {
        water: 0.40,
        clinic: 0.30,
        school: 0.30
    };

    // Score thresholds (meters) - closer = higher score
    const thresholds = {
        water: { excellent: 200, good: 500, acceptable: 1000, poor: 2000 },
        clinic: { excellent: 1000, good: 2000, acceptable: 5000, poor: 10000 },
        school: { excellent: 500, good: 1000, acceptable: 2000, poor: 5000 }
    };

    const getDistanceScore = (
        distance: number,
        threshold: { excellent: number; good: number; acceptable: number; poor: number }
    ): number => {
        if (distance <= threshold.excellent) return 100;
        if (distance <= threshold.good) return 75;
        if (distance <= threshold.acceptable) return 50;
        if (distance <= threshold.poor) return 25;
        return 0;
    };

    let totalScore = 0;
    const breakdown: Record<string, { distance: number; score: number }> = {};

    for (const [service, weight] of Object.entries(weights)) {
        const distance = distances[service as keyof typeof weights] ?? Infinity;
        const score = getDistanceScore(distance, thresholds[service as keyof typeof thresholds]);
        breakdown[service] = { distance, score };
        totalScore += score * weight;
    }

    const score = Math.round(totalScore);
    const level: AccessLevel = score >= 70 ? 'HIGH' : score >= 40 ? 'MEDIUM' : 'LOW';
    const color = level === 'HIGH' ? '#10b981' : level === 'MEDIUM' ? '#f59e0b' : '#ef4444';

    return { score, level, color, breakdown };
};

/**
 * Count points within a polygon
 * @param polygon - GeoJSON Polygon Feature
 * @param points - GeoJSON FeatureCollection of points
 * @returns Count of points inside polygon
 */
export const countPointsInPolygon = (
    polygon: Feature<Polygon>,
    points: FeatureCollection<Point>
): number => {
    if (!points?.features?.length) return 0;
    const pointsWithin = turfPointsWithinPolygon(points, polygon);
    return pointsWithin.features.length;
};

/**
 * Get all points within a polygon with their properties
 * @param polygon - GeoJSON Polygon Feature
 * @param points - GeoJSON FeatureCollection
 * @returns GeoJSON FeatureCollection of points within
 */
export const getPointsInPolygon = (
    polygon: Feature<Polygon>,
    points: FeatureCollection<Point>
): FeatureCollection<Point> => {
    if (!points?.features?.length) {
        return { type: 'FeatureCollection', features: [] };
    }
    return turfPointsWithinPolygon(points, polygon) as FeatureCollection<Point>;
};

/**
 * Calculate centroid of a polygon
 * @param polygon - GeoJSON Polygon Feature
 * @returns [lng, lat] of centroid
 */
export const getCentroid = (polygon: Feature<Polygon>): Position => {
    const centroid = turfCentroid(polygon);
    return centroid.geometry.coordinates;
};

/**
 * Simplify geometries for performance
 * @param geoJSON - GeoJSON FeatureCollection
 * @param tolerance - Simplification tolerance
 * @returns Simplified GeoJSON
 */
export const simplifyGeometries = <T extends Feature>(
    geoJSON: FeatureCollection<T['geometry']>,
    tolerance: number = 0.001
): FeatureCollection<T['geometry']> => {
    return turfSimplify(geoJSON, { tolerance, highQuality: true });
};

export default {
    calculateNearestDistance,
    findNearestPoint,
    generateWalkingBuffers,
    calculateAccessScore,
    countPointsInPolygon,
    getPointsInPolygon,
    getCentroid,
    simplifyGeometries
};
