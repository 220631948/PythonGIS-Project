import turfArea from '@turf/area';
import turfBuffer from '@turf/buffer';
import turfCentroid from '@turf/centroid';
import turfSimplify from '@turf/simplify';
import type { Geometry, Point, Polygon, Feature, FeatureCollection } from 'geojson';

/**
 * Calculate the area of a polygon in square meters
 * @param polygon - GeoJSON Polygon
 * @returns number - Area in square meters
 */
export const calculateArea = (polygon: Polygon | Feature<Polygon>): number => {
    return turfArea(polygon);
};

/**
 * Create a buffer around a point
 * @param point - GeoJSON Point
 * @param radiusMeters - Radius in meters
 * @returns Polygon - Buffer polygon
 */
export const bufferPoint = (point: Point | Feature<Point>, radiusMeters: number): Polygon => {
    const buffer = turfBuffer(point, radiusMeters, { units: 'meters' });
    return (buffer as Feature<Polygon>).geometry;
};

/**
 * Calculate the centroid of a geometry
 * @param geometry - GeoJSON Geometry
 * @returns Point - Centroid point
 */
export const centroid = (geometry: Geometry | Feature | FeatureCollection): Point => {
    const result = turfCentroid(geometry);
    return result.geometry as Point;
};

/**
 * Simplify a geometry
 * @param geometry - GeoJSON Geometry
 * @param tolerance - Tolerace for simplification
 * @returns Geometry - Simplified geometry
 */
export const simplify = <T extends Geometry>(geometry: T, tolerance: number = 0.001): T => {
    return turfSimplify(geometry, { tolerance, highQuality: true }) as T;
};

export default {
    calculateArea,
    bufferPoint,
    centroid,
    simplify
};
