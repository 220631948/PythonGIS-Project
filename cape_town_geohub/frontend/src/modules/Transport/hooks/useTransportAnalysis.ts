/**
 * useTransportAnalysis Hook
 * Walking buffer analysis for transport accessibility
 */

import { useState, useCallback } from 'react';
import * as turf from '@turf/turf';
import type { Feature, Polygon, Point, FeatureCollection, Position } from 'geojson';

// Types
export interface BufferResult {
    polygon: Feature<Polygon>;
    minutes: number;
    meters: number;
    color: string;
    opacity: number;
}

export interface StopCounts {
    10: number;
    20: number;
    30: number;
}

export interface TransportAnalysisResult {
    buffers: BufferResult[];
    stopCounts: StopCounts;
    center: Position;
    totalStops: number;
}

// Mock MyCiTi Stops (realistic Cape Town locations)
const MOCK_MYCITI_STOPS: FeatureCollection<Point> = {
    type: 'FeatureCollection',
    features: [
        // CBD Area
        { type: 'Feature', properties: { name: 'Civic Centre', route: 'T01' }, geometry: { type: 'Point', coordinates: [18.4241, -33.9249] } },
        { type: 'Feature', properties: { name: 'Thibault Square', route: 'T01' }, geometry: { type: 'Point', coordinates: [18.4220, -33.9210] } },
        { type: 'Feature', properties: { name: 'Adderley Street', route: 'T01' }, geometry: { type: 'Point', coordinates: [18.4235, -33.9195] } },
        { type: 'Feature', properties: { name: 'Cape Town Station', route: 'T01' }, geometry: { type: 'Point', coordinates: [18.4270, -33.9225] } },
        // Sea Point
        { type: 'Feature', properties: { name: 'Sea Point', route: 'T02' }, geometry: { type: 'Point', coordinates: [18.3850, -33.9180] } },
        { type: 'Feature', properties: { name: 'Three Anchor Bay', route: 'T02' }, geometry: { type: 'Point', coordinates: [18.3950, -33.9150] } },
        { type: 'Feature', properties: { name: 'Mouille Point', route: 'T02' }, geometry: { type: 'Point', coordinates: [18.4050, -33.9050] } },
        // Blouberg
        { type: 'Feature', properties: { name: 'Table View', route: 'T03' }, geometry: { type: 'Point', coordinates: [18.4850, -33.8200] } },
        { type: 'Feature', properties: { name: 'Blouberg', route: 'T03' }, geometry: { type: 'Point', coordinates: [18.4700, -33.8100] } },
        { type: 'Feature', properties: { name: 'Big Bay', route: 'T03' }, geometry: { type: 'Point', coordinates: [18.4550, -33.7950] } },
        // Century City
        { type: 'Feature', properties: { name: 'Century City', route: 'T04' }, geometry: { type: 'Point', coordinates: [18.5050, -33.8900] } },
        { type: 'Feature', properties: { name: 'Canal Walk', route: 'T04' }, geometry: { type: 'Point', coordinates: [18.5100, -33.8950] } },
        // Woodstock
        { type: 'Feature', properties: { name: 'Woodstock', route: 'T05' }, geometry: { type: 'Point', coordinates: [18.4450, -33.9280] } },
        { type: 'Feature', properties: { name: 'Salt River', route: 'T05' }, geometry: { type: 'Point', coordinates: [18.4650, -33.9320] } },
        // Gardens
        { type: 'Feature', properties: { name: 'Gardens', route: 'T06' }, geometry: { type: 'Point', coordinates: [18.4130, -33.9350] } },
        { type: 'Feature', properties: { name: 'Kloof Street', route: 'T06' }, geometry: { type: 'Point', coordinates: [18.4100, -33.9380] } },
    ]
};

// Buffer configuration
const BUFFER_CONFIG = [
    { minutes: 10, meters: 800, color: '#3b82f6', opacity: 0.3 },
    { minutes: 20, meters: 1600, color: '#3b82f6', opacity: 0.2 },
    { minutes: 30, meters: 2400, color: '#3b82f6', opacity: 0.1 }
];

export const useTransportAnalysis = () => {
    const [result, setResult] = useState<TransportAnalysisResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [isActive, setIsActive] = useState(false);

    const analyzeLocation = useCallback((lat: number, lng: number) => {
        setLoading(true);

        // Use setTimeout for non-blocking UI
        setTimeout(() => {
            try {
                const center: Position = [lng, lat];
                const centerPoint = turf.point(center);

                // Generate walking buffers
                const buffers: BufferResult[] = BUFFER_CONFIG.map(config => {
                    const buffer = turf.buffer(centerPoint, config.meters, { units: 'meters' });
                    return {
                        polygon: buffer as Feature<Polygon>,
                        minutes: config.minutes,
                        meters: config.meters,
                        color: config.color,
                        opacity: config.opacity
                    };
                });

                // Count stops within each buffer
                const stopCounts: StopCounts = { 10: 0, 20: 0, 30: 0 };

                buffers.forEach(buffer => {
                    const stopsWithin = turf.pointsWithinPolygon(MOCK_MYCITI_STOPS, buffer.polygon);
                    stopCounts[buffer.minutes as keyof StopCounts] = stopsWithin.features.length;
                });

                const totalStops = stopCounts[30]; // Total within largest buffer

                setResult({
                    buffers,
                    stopCounts,
                    center,
                    totalStops
                });
                setLoading(false);
            } catch (error) {
                console.error('Transport analysis error:', error);
                setLoading(false);
            }
        }, 50);
    }, []);

    const clearAnalysis = useCallback(() => {
        setResult(null);
    }, []);

    const toggleActive = useCallback(() => {
        setIsActive(prev => !prev);
        if (isActive) {
            setResult(null);
        }
    }, [isActive]);

    return {
        result,
        loading,
        isActive,
        analyzeLocation,
        clearAnalysis,
        toggleActive,
        stops: MOCK_MYCITI_STOPS
    };
};

export default useTransportAnalysis;
