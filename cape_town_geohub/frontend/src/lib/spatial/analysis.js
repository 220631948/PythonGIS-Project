/**
 * Spatial Analysis Utilities using Turf.js
 * Core functions for GIS analysis in Cape Town GeoHub
 */

import * as turf from '@turf/turf';

/**
 * Calculate distance to the nearest point from a set of points
 * @param {[number, number]} point - [lng, lat] coordinates
 * @param {Object} pointsGeoJSON - GeoJSON FeatureCollection of points
 * @returns {number} Distance in meters to nearest point
 */
export const calculateNearestDistance = (point, pointsGeoJSON) => {
    if (!pointsGeoJSON?.features?.length) return Infinity;

    const targetPoint = turf.point(point);
    let minDistance = Infinity;

    for (const feature of pointsGeoJSON.features) {
        if (feature.geometry?.type === 'Point') {
            const distance = turf.distance(targetPoint, feature, { units: 'meters' });
            if (distance < minDistance) {
                minDistance = distance;
            }
        }
    }

    return minDistance;
};

/**
 * Find the nearest point feature from a collection
 * @param {[number, number]} point - [lng, lat] coordinates
 * @param {Object} pointsGeoJSON - GeoJSON FeatureCollection
 * @returns {Object|null} Nearest feature with distance
 */
export const findNearestPoint = (point, pointsGeoJSON) => {
    if (!pointsGeoJSON?.features?.length) return null;

    const targetPoint = turf.point(point);
    const nearest = turf.nearestPoint(targetPoint, pointsGeoJSON);

    if (nearest) {
        nearest.properties.distance = turf.distance(targetPoint, nearest, { units: 'meters' });
    }

    return nearest;
};

/**
 * Generate walking distance buffers (concentric circles)
 * @param {[number, number]} center - [lng, lat] coordinates
 * @param {number[]} distances - Array of distances in meters (default: 10/20/30 min walk)
 * @returns {Object[]} Array of buffer polygons as GeoJSON Features
 */
export const generateWalkingBuffers = (center, distances = [800, 1600, 2400]) => {
    const centerPoint = turf.point(center);

    return distances.map((distance, index) => {
        const buffer = turf.buffer(centerPoint, distance, { units: 'meters' });
        buffer.properties = {
            distance,
            walkingMinutes: Math.round(distance / 80), // ~80m/min walking speed
            label: `${Math.round(distance / 80)} min walk`,
            ring: index
        };
        return buffer;
    });
};

/**
 * Count points within a polygon
 * @param {Object} polygon - GeoJSON Polygon Feature
 * @param {Object} pointsGeoJSON - GeoJSON FeatureCollection of points
 * @returns {number} Count of points inside polygon
 */
export const countPointsInPolygon = (polygon, pointsGeoJSON) => {
    if (!pointsGeoJSON?.features?.length) return 0;

    const pointsWithin = turf.pointsWithinPolygon(pointsGeoJSON, polygon);
    return pointsWithin.features.length;
};

/**
 * Get all points within a polygon with their properties
 * @param {Object} polygon - GeoJSON Polygon Feature
 * @param {Object} pointsGeoJSON - GeoJSON FeatureCollection
 * @returns {Object} GeoJSON FeatureCollection of points within
 */
export const getPointsInPolygon = (polygon, pointsGeoJSON) => {
    if (!pointsGeoJSON?.features?.length) {
        return { type: 'FeatureCollection', features: [] };
    }
    return turf.pointsWithinPolygon(pointsGeoJSON, polygon);
};

/**
 * Calculate service access score for a location
 * Weighted scoring: Water 30%, Sanitation 30%, Health 20%, Education 20%
 * @param {Object} distances - Object with distance values in meters
 * @returns {Object} Score (0-100) and access level
 */
export const calculateAccessScore = (distances) => {
    const weights = {
        water: 0.30,
        sanitation: 0.30,
        clinic: 0.20,
        school: 0.20
    };

    // Score thresholds (meters) - closer = higher score
    const thresholds = {
        water: { excellent: 200, good: 500, acceptable: 1000 },
        sanitation: { excellent: 100, good: 300, acceptable: 500 },
        clinic: { excellent: 1000, good: 2000, acceptable: 5000 },
        school: { excellent: 500, good: 1000, acceptable: 2000 }
    };

    const getDistanceScore = (distance, threshold) => {
        if (distance <= threshold.excellent) return 100;
        if (distance <= threshold.good) return 75;
        if (distance <= threshold.acceptable) return 50;
        if (distance <= threshold.acceptable * 2) return 25;
        return 0;
    };

    let totalScore = 0;
    const breakdown = {};

    for (const [service, weight] of Object.entries(weights)) {
        const distance = distances[service] ?? Infinity;
        const score = getDistanceScore(distance, thresholds[service]);
        breakdown[service] = { distance, score };
        totalScore += score * weight;
    }

    const level = totalScore >= 70 ? 'HIGH' : totalScore >= 40 ? 'MEDIUM' : 'LOW';
    const color = level === 'HIGH' ? '#10b981' : level === 'MEDIUM' ? '#f59e0b' : '#ef4444';

    return {
        score: Math.round(totalScore),
        level,
        color,
        breakdown
    };
};

/**
 * Calculate centroid of a polygon
 * @param {Object} polygon - GeoJSON Polygon Feature
 * @returns {[number, number]} [lng, lat] of centroid
 */
export const getCentroid = (polygon) => {
    const centroid = turf.centroid(polygon);
    return centroid.geometry.coordinates;
};

/**
 * Classify features by an attribute value
 * @param {Object} geoJSON - GeoJSON FeatureCollection
 * @param {string} attribute - Property name to classify by
 * @returns {Map} Map of attribute values to feature arrays
 */
export const classifyByAttribute = (geoJSON, attribute) => {
    const classified = new Map();

    for (const feature of geoJSON.features) {
        const value = feature.properties?.[attribute] ?? 'Unknown';
        if (!classified.has(value)) {
            classified.set(value, []);
        }
        classified.get(value).push(feature);
    }

    return classified;
};

/**
 * Simplify geometries for performance
 * @param {Object} geoJSON - GeoJSON FeatureCollection
 * @param {number} tolerance - Simplification tolerance
 * @returns {Object} Simplified GeoJSON
 */
export const simplifyGeometries = (geoJSON, tolerance = 0.001) => {
    return turf.simplify(geoJSON, { tolerance, highQuality: true });
};

export default {
    calculateNearestDistance,
    findNearestPoint,
    generateWalkingBuffers,
    countPointsInPolygon,
    getPointsInPolygon,
    calculateAccessScore,
    getCentroid,
    classifyByAttribute,
    simplifyGeometries
};
