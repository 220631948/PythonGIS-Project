/**
 * useSpatialAnalysis Hook
 * Performs Turf.js analysis on drawn geometries
 */

import { useCallback } from 'react';
import * as turf from '@turf/turf';
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
        const feature = turf.polygon(geometry.coordinates);
        const area = turf.area(feature);
        const centroidPoint = turf.centroid(feature);
        const bbox = turf.bbox(feature);
        const perimeter = turf.length(turf.polygonToLine(feature), { units: 'meters' });

        return {
            type: 'polygon',
            area: Math.round(area),
            areaKm: Math.round(area / 1000000 * 100) / 100,
            perimeter: Math.round(perimeter),
            centroid: centroidPoint.geometry.coordinates as [number, number],
            bounds: [[bbox[1], bbox[0]], [bbox[3], bbox[2]]]
        };
    }, []);

    /**
     * Analyze a line geometry
     */
    const analyzeLine = useCallback((geometry: LineString): AnalysisResult => {
        const feature = turf.lineString(geometry.coordinates);
        const length = turf.length(feature, { units: 'meters' });
        const firstCoord = geometry.coordinates[0];
        const lastCoord = geometry.coordinates[geometry.coordinates.length - 1];
        const midpoint = firstCoord && lastCoord
            ? turf.midpoint(turf.point(firstCoord), turf.point(lastCoord))
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
        const polygonFeature = turf.polygon(polygon.coordinates);
        const counts: { [key: string]: number } = {};

        Object.entries(layers).forEach(([name, featureCollection]) => {
            if (featureCollection && featureCollection.features) {
                const within = turf.pointsWithinPolygon(featureCollection, polygonFeature);
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
                const circlePolygon = turf.circle(
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
