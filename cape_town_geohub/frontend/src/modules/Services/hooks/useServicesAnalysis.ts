/**
 * useServicesAnalysis Hook
 * Custom hook for loading settlement data and calculating access scores
 */

import { useState, useEffect, useCallback } from 'react';
import {
    calculateAccessScore,
    calculateNearestDistance,
    getCentroid,
    type AccessScoreResult,
    type ServiceDistances
} from '../../../lib/spatial/analysis';

// Types
export interface SettlementProperties {
    id: string | number;
    name: string;
    population?: number;
}

export interface AnalyzedSettlement {
    id: string | number;
    name: string;
    population: number;
    centroid: [number, number];
    distances: ServiceDistances;
    accessScore: AccessScoreResult;
}

export interface AnalysisStats {
    total: number;
    highAccess: number;
    mediumAccess: number;
    lowAccess: number;
    averageScore: number;
    highPriorityCount: number;
}

export interface UseServicesAnalysisResult {
    data: AnalyzedSettlement[];
    loading: boolean;
    error: string | null;
    stats: AnalysisStats | null;
    runAnalysis: () => void;
    isAnalyzed: boolean;
}

// Mock GeoJSON data structure matching CCT Open Data format
const MOCK_SETTLEMENTS = {
    type: 'FeatureCollection' as const,
    features: [
        { type: 'Feature' as const, properties: { OBJECTID: 1, OFC_SBRB_NAME: 'Khayelitsha', POP_EST: 400000 }, geometry: { type: 'Polygon' as const, coordinates: [[[18.65, -34.04], [18.70, -34.04], [18.70, -34.00], [18.65, -34.00], [18.65, -34.04]]] } },
        { type: 'Feature' as const, properties: { OBJECTID: 2, OFC_SBRB_NAME: 'Nyanga', POP_EST: 120000 }, geometry: { type: 'Polygon' as const, coordinates: [[[18.55, -33.99], [18.60, -33.99], [18.60, -33.95], [18.55, -33.95], [18.55, -33.99]]] } },
        { type: 'Feature' as const, properties: { OBJECTID: 3, OFC_SBRB_NAME: 'Gugulethu', POP_EST: 100000 }, geometry: { type: 'Polygon' as const, coordinates: [[[18.54, -33.98], [18.57, -33.98], [18.57, -33.95], [18.54, -33.95], [18.54, -33.98]]] } },
        { type: 'Feature' as const, properties: { OBJECTID: 4, OFC_SBRB_NAME: 'Langa', POP_EST: 52000 }, geometry: { type: 'Polygon' as const, coordinates: [[[18.52, -33.94], [18.55, -33.94], [18.55, -33.92], [18.52, -33.92], [18.52, -33.94]]] } },
        { type: 'Feature' as const, properties: { OBJECTID: 5, OFC_SBRB_NAME: 'Mitchells Plain', POP_EST: 310000 }, geometry: { type: 'Polygon' as const, coordinates: [[[18.62, -34.05], [18.68, -34.05], [18.68, -34.00], [18.62, -34.00], [18.62, -34.05]]] } },
        { type: 'Feature' as const, properties: { OBJECTID: 6, OFC_SBRB_NAME: 'Philippi', POP_EST: 200000 }, geometry: { type: 'Polygon' as const, coordinates: [[[18.55, -34.02], [18.62, -34.02], [18.62, -33.98], [18.55, -33.98], [18.55, -34.02]]] } },
        { type: 'Feature' as const, properties: { OBJECTID: 7, OFC_SBRB_NAME: 'Delft', POP_EST: 150000 }, geometry: { type: 'Polygon' as const, coordinates: [[[18.63, -33.96], [18.67, -33.96], [18.67, -33.93], [18.63, -33.93], [18.63, -33.96]]] } },
        { type: 'Feature' as const, properties: { OBJECTID: 8, OFC_SBRB_NAME: 'Crossroads', POP_EST: 35000 }, geometry: { type: 'Polygon' as const, coordinates: [[[18.57, -33.98], [18.60, -33.98], [18.60, -33.96], [18.57, -33.96], [18.57, -33.98]]] } },
    ]
};

const MOCK_WATER_POINTS = {
    type: 'FeatureCollection' as const,
    features: [
        { type: 'Feature' as const, properties: { name: 'Water Point 1' }, geometry: { type: 'Point' as const, coordinates: [18.66, -34.02] } },
        { type: 'Feature' as const, properties: { name: 'Water Point 2' }, geometry: { type: 'Point' as const, coordinates: [18.57, -33.97] } },
        { type: 'Feature' as const, properties: { name: 'Water Point 3' }, geometry: { type: 'Point' as const, coordinates: [18.53, -33.93] } },
        { type: 'Feature' as const, properties: { name: 'Water Point 4' }, geometry: { type: 'Point' as const, coordinates: [18.65, -34.03] } },
    ]
};

const MOCK_CLINICS = {
    type: 'FeatureCollection' as const,
    features: [
        { type: 'Feature' as const, properties: { name: 'Khayelitsha Hospital' }, geometry: { type: 'Point' as const, coordinates: [18.68, -34.03] } },
        { type: 'Feature' as const, properties: { name: 'Nyanga Clinic' }, geometry: { type: 'Point' as const, coordinates: [18.57, -33.97] } },
        { type: 'Feature' as const, properties: { name: 'Mitchells Plain Hospital' }, geometry: { type: 'Point' as const, coordinates: [18.65, -34.04] } },
    ]
};

const MOCK_SCHOOLS = {
    type: 'FeatureCollection' as const,
    features: [
        { type: 'Feature' as const, properties: { name: 'Khayelitsha Primary' }, geometry: { type: 'Point' as const, coordinates: [18.67, -34.02] } },
        { type: 'Feature' as const, properties: { name: 'Langa High School' }, geometry: { type: 'Point' as const, coordinates: [18.53, -33.93] } },
        { type: 'Feature' as const, properties: { name: 'Gugulethu Secondary' }, geometry: { type: 'Point' as const, coordinates: [18.55, -33.96] } },
        { type: 'Feature' as const, properties: { name: 'Philippi Primary' }, geometry: { type: 'Point' as const, coordinates: [18.58, -34.00] } },
    ]
};

export const useServicesAnalysis = (): UseServicesAnalysisResult => {
    const [data, setData] = useState<AnalyzedSettlement[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<AnalysisStats | null>(null);
    const [isAnalyzed, setIsAnalyzed] = useState(false);

    const runAnalysis = useCallback(() => {
        setLoading(true);
        setError(null);

        // Use setTimeout to prevent UI blocking during calculation
        setTimeout(() => {
            try {
                const analyzedSettlements: AnalyzedSettlement[] = MOCK_SETTLEMENTS.features.map((feature) => {
                    const centroid = getCentroid(feature as any) as [number, number];

                    const distances: ServiceDistances = {
                        water: calculateNearestDistance(centroid, MOCK_WATER_POINTS as any),
                        clinic: calculateNearestDistance(centroid, MOCK_CLINICS as any),
                        school: calculateNearestDistance(centroid, MOCK_SCHOOLS as any),
                    };

                    const accessScore = calculateAccessScore(distances);

                    return {
                        id: feature.properties.OBJECTID,
                        name: feature.properties.OFC_SBRB_NAME,
                        population: feature.properties.POP_EST,
                        centroid,
                        distances,
                        accessScore,
                    };
                });

                // Sort by score (lowest first = highest priority)
                analyzedSettlements.sort((a, b) => a.accessScore.score - b.accessScore.score);

                // Calculate stats
                const highAccess = analyzedSettlements.filter(s => s.accessScore.level === 'HIGH').length;
                const mediumAccess = analyzedSettlements.filter(s => s.accessScore.level === 'MEDIUM').length;
                const lowAccess = analyzedSettlements.filter(s => s.accessScore.level === 'LOW').length;
                const averageScore = Math.round(
                    analyzedSettlements.reduce((sum, s) => sum + s.accessScore.score, 0) / analyzedSettlements.length
                );

                setStats({
                    total: analyzedSettlements.length,
                    highAccess,
                    mediumAccess,
                    lowAccess,
                    averageScore,
                    highPriorityCount: lowAccess // Areas with LOW access = HIGH priority
                });

                setData(analyzedSettlements);
                setIsAnalyzed(true);
                setLoading(false);
            } catch (err) {
                setError('Analysis failed. Please try again.');
                setLoading(false);
            }
        }, 100); // Small delay to prevent UI freeze
    }, []);

    return { data, loading, error, stats, runAnalysis, isAnalyzed };
};

export default useServicesAnalysis;
