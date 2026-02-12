/**
 * useSpatialAnalysis Hook
 * Performs Turf.js analysis on drawn geometries
 */

import { useCallback } from 'react';
import { polygon as turfPolygon, lineString as turfLineString, point as turfPoint } from '@turf/helpers';
import turfArea from '@turf/area';
import turfCentroid from '@turf/centroid';
import turfBbox from '@turf/bbox';
import turfLength from '@turf/length';
import turfPolygonToLine from '@turf/polygon-to-line';
import turfMidpoint from '@turf/midpoint';
import turfCircle from '@turf/circle';
import turfPointsWithinPolygon from '@turf/points-within-polygon';
import type { Polygon, LineString, Point, FeatureCollection } from 'geojson';

export interface AnalysisResult {
    type: 'polygon' | 'line' | 'circle' | 'rectangle' | 'marker';
    area?: number; // sq meters
    areaKm?: number; // sq km
    length?: number; // meters
    lengthKm?: number; // km
    perimeter?: number; // meters
    centroid?: [number, number];
    featureCounts?: { [layerName: string]: number };
    bounds?: [[number, number], [number, number]];
}

export const useSpatialAnalysis = () => {

    /**
     * Analyze a polygon geometry
     */
    const analyzePolygon = useCallback((geometry: Polygon): AnalysisResult => {
        const feature = turfPolygon(geometry.coordinates);
        const area = turfArea(feature);
        const centroidPoint = turfCentroid(feature);
        const bboxResult = turfBbox(feature);
        const perimeter = turfLength(turfPolygonToLine(feature), { units: 'meters' });

        return {
            type: 'polygon',
            area: Math.round(area),
            areaKm: Math.round(area / 1000000 * 100) / 100,
            perimeter: Math.round(perimeter),
            centroid: centroidPoint.geometry.coordinates as [number, number],
            bounds: [[bboxResult[1], bboxResult[0]], [bboxResult[3], bboxResult[2]]]
        };
    }, []);

    /**
     * Analyze a line geometry
     */
    const analyzeLine = useCallback((geometry: LineString): AnalysisResult => {
        const feature = turfLineString(geometry.coordinates);
        const length = turfLength(feature, { units: 'meters' });
        const firstCoord = geometry.coordinates[0];
        const lastCoord = geometry.coordinates[geometry.coordinates.length - 1];
        const midpoint = firstCoord && lastCoord
            ? turfMidpoint(turfPoint(firstCoord), turfPoint(lastCoord))
            : null;

        return {
            type: 'line',
            length: Math.round(length),
            lengthKm: Math.round(length / 1000 * 100) / 100,
            centroid: midpoint ? midpoint.geometry.coordinates as [number, number] : undefined
        };
    }, []);

    /**
     * Count features within a polygon
     */
    const countFeaturesInPolygon = useCallback((
        polygon: Polygon,
        layers: { [layerName: string]: FeatureCollection<Point> }
    ): { [layerName: string]: number } => {
        const polygonFeature = turfPolygon(polygon.coordinates);
        const counts: { [key: string]: number } = {};

        Object.entries(layers).forEach(([name, featureCollection]) => {
            if (featureCollection && featureCollection.features) {
                const within = turfPointsWithinPolygon(featureCollection, polygonFeature);
                counts[name] = within.features.length;
            }
        });

        return counts;
    }, []);

    /**
     * Main analysis function - dispatched based on geometry type
     */
    const analyzeGeometry = useCallback((
        geometry: any,
        geometryType: string,
        activeLayers?: { [layerName: string]: FeatureCollection<Point> }
    ): AnalysisResult => {
        let result: AnalysisResult;

        switch (geometryType) {
            case 'polygon':
            case 'rectangle':
                result = analyzePolygon(geometry as Polygon);
                result.type = geometryType as 'polygon' | 'rectangle';
                if (activeLayers) {
                    result.featureCounts = countFeaturesInPolygon(geometry as Polygon, activeLayers);
                }
                break;

            case 'polyline':
                result = analyzeLine(geometry as LineString);
                break;

            case 'circle': {
                // Convert circle to polygon for analysis
                const circlePolygon = turfCircle(
                    geometry.coordinates,
                    geometry.radius / 1000, // Convert to km
                    { units: 'kilometers', steps: 64 }
                );
                result = analyzePolygon(circlePolygon.geometry as Polygon);
                result.type = 'circle';
                if (activeLayers) {
                    result.featureCounts = countFeaturesInPolygon(circlePolygon.geometry as Polygon, activeLayers);
                }
                break;
            }

            case 'marker':
                result = {
                    type: 'marker',
                    centroid: geometry.coordinates as [number, number]
                };
                break;

            default:
                result = { type: 'polygon' };
        }

        return result;
    }, [analyzePolygon, analyzeLine, countFeaturesInPolygon]);

    /**
     * Format analysis result for display
     */
    const formatResult = useCallback((result: AnalysisResult): string => {
        const lines: string[] = [];

        if (result.area !== undefined) {
            lines.push(`<strong>Area:</strong> ${result.areaKm} km² (${result.area.toLocaleString()} m²)`);
        }

        if (result.length !== undefined) {
            lines.push(`<strong>Length:</strong> ${result.lengthKm} km (${result.length.toLocaleString()} m)`);
        }

        if (result.perimeter !== undefined) {
            lines.push(`<strong>Perimeter:</strong> ${result.perimeter.toLocaleString()} m`);
        }

        if (result.featureCounts && Object.keys(result.featureCounts).length > 0) {
            lines.push('<hr class="my-2 border-slate-200"/>');
            lines.push('<strong>Features Inside:</strong>');
            Object.entries(result.featureCounts).forEach(([name, count]) => {
                lines.push(`• ${name}: <strong>${count}</strong>`);
            });
        }

        return lines.join('<br/>');
    }, []);

    return {
        analyzeGeometry,
        analyzePolygon,
        analyzeLine,
        countFeaturesInPolygon,
        formatResult
    };
};

export default useSpatialAnalysis;
