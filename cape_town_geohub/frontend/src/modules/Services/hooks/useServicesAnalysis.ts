/**
 * useServicesAnalysis Hook
 * Custom hook for loading settlement data and calculating access scores
 */

import { useState, useCallback } from 'react';
import {
    calculateAccessScore,
    calculateNearestDistance,
    getCentroid,
    type AccessScoreResult,
    type ServiceDistances
} from '../../../lib/spatial/analysis';
import { useGeoData } from '../../../hooks/useGeoData';
import { API_ENDPOINTS } from '../../../lib/api';
import type { FeatureCollection, Feature } from 'geojson';

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

export const useServicesAnalysis = (): UseServicesAnalysisResult => {
    const [data, setData] = useState<AnalyzedSettlement[]>([]);
    const [analyzing, setAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<AnalysisStats | null>(null);
    const [isAnalyzed, setIsAnalyzed] = useState(false);

    // Fetch Real Data
    const { data: settlementsData, isLoading: loadingSettlements } = useGeoData<FeatureCollection>(
        'services_settlements',
        API_ENDPOINTS.services.settlements
    );

    const { data: waterData, isLoading: loadingWater } = useGeoData<FeatureCollection>(
        'services_water',
        API_ENDPOINTS.services.water
    );

    const { data: clinicsData, isLoading: loadingClinics } = useGeoData<FeatureCollection>(
        'services_clinics',
        API_ENDPOINTS.services.clinics
    );

    const { data: schoolsData, isLoading: loadingSchools } = useGeoData<FeatureCollection>(
        'services_schools',
        API_ENDPOINTS.services.schools
    );

    const dataLoading = loadingSettlements || loadingWater || loadingClinics || loadingSchools;
    const loading = analyzing || dataLoading;

    const runAnalysis = useCallback(() => {
        if (!settlementsData || !waterData || !clinicsData || !schoolsData) {
            setError('Waiting for data to load...');
            return;
        }

        setAnalyzing(true);
        setError(null);

        // Use setTimeout to prevent UI blocking during calculation
        setTimeout(() => {
            try {
                // Ensure we have features
                const settlements = settlementsData.features || [];

                // Optimized: Pre-process facilities if needed, but calculateNearestDistance likely handles FeatureCollections

                const analyzedSettlements: AnalyzedSettlement[] = settlements.map((feature: Feature) => {
                    const centroid = getCentroid(feature as any) as [number, number];
                    const props = feature.properties || {};

                    // Use Water facilities as proxy for Sanitation if sanitation data missing
                    const waterDistance = calculateNearestDistance(centroid, waterData as any);

                    const distances: ServiceDistances = {
                        water: waterDistance,
                        clinic: calculateNearestDistance(centroid, clinicsData as any),
                        school: calculateNearestDistance(centroid, schoolsData as any),
                    };

                    const accessScore = calculateAccessScore(distances);

                    return {
                        id: props.OBJECTID || props.id || Math.random(),
                        name: props.OFC_SBRB_NAME || props.NAME || 'Unknown Area',
                        population: props.POP_EST || 1000,
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

                const avg = analyzedSettlements.length > 0
                    ? analyzedSettlements.reduce((sum, s) => sum + s.accessScore.score, 0) / analyzedSettlements.length
                    : 0;

                const averageScore = Math.round(avg);

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
                setAnalyzing(false);
            } catch (err: any) {
                console.error('Analysis error:', err);
                setError('Analysis failed: ' + err.message);
                setAnalyzing(false);
            }
        }, 100);
    }, [settlementsData, waterData, clinicsData, schoolsData]);

    return { data, loading, error, stats, runAnalysis, isAnalyzed };
};

export default useServicesAnalysis;
