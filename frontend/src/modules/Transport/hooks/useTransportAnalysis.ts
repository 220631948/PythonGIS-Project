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

// ... imports
import { useGeoData } from '../../../hooks/useGeoData';
import { API_ENDPOINTS } from '../../../lib/api';

// ... types (keep existing)

// Buffer configuration
const BUFFER_CONFIG = [
    { minutes: 10, meters: 800, color: '#3b82f6', opacity: 0.3 },
    { minutes: 20, meters: 1600, color: '#3b82f6', opacity: 0.2 },
    { minutes: 30, meters: 2400, color: '#3b82f6', opacity: 0.1 }
];

export const useTransportAnalysis = () => {
    const [result, setResult] = useState<TransportAnalysisResult | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [isActive, setIsActive] = useState(false);

    // Fetch real stops data
    const { data: stopsData, isLoading: stopsLoading } = useGeoData<FeatureCollection<Point>>(
        'transport_myciti_stops',
        API_ENDPOINTS.transport.myciti_stops
    );

    const stops = stopsData || { type: 'FeatureCollection', features: [] };
    const loading = analyzing || stopsLoading;

    const analyzeLocation = useCallback((lat: number, lng: number) => {
        if (!stopsData) {
            console.warn('Transport analysis: No stops data available');
            return;
        }

        setAnalyzing(true);

        // ... logic
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
                    const stopsWithin = turf.pointsWithinPolygon(stopsData as FeatureCollection<Point>, buffer.polygon);
                    stopCounts[buffer.minutes as keyof StopCounts] = stopsWithin.features.length;
                });

                const totalStops = stopCounts[30]; // Total within largest buffer

                setResult({
                    buffers,
                    stopCounts,
                    center,
                    totalStops
                });
                setAnalyzing(false);
            } catch (error) {
                console.error('Transport analysis error:', error);
                setAnalyzing(false);
            }
        }, 50);
    }, [stopsData]);

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
        stops // Return the real stops (or empty if loading)
    };
};

export default useTransportAnalysis;
