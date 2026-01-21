/**
 * useSafetyAnalysis Hook
 * Load and process precinct-level crime data (ethical, aggregated)
 */

import { useState, useCallback } from 'react';
import type { Feature, Polygon, FeatureCollection } from 'geojson';

// Types
export interface PrecinctProperties {
    id: number;
    name: string;
    crime_index: number; // 0-100 aggregate score
    population: number;
    quarter: string;
    categories: {
        violent: number;
        property: number;
        other: number;
    };
}

export interface PrecinctFeature extends Feature<Polygon, PrecinctProperties> { }

export interface SafetyStats {
    totalPrecincts: number;
    lowRisk: number;
    mediumRisk: number;
    highRisk: number;
    avgIndex: number;
}

export type TimeRange = 'Q1_2024' | 'Q2_2024' | 'Q3_2024' | 'Q4_2024';

// Mock Precinct Data (Cape Town Police Precincts - aggregated data)
const MOCK_PRECINCTS: FeatureCollection<Polygon, PrecinctProperties> = {
    type: 'FeatureCollection',
    features: [
        {
            type: 'Feature',
            properties: {
                id: 1,
                name: 'Cape Town Central',
                crime_index: 72,
                population: 45000,
                quarter: 'Q4_2024',
                categories: { violent: 35, property: 45, other: 20 }
            },
            geometry: {
                type: 'Polygon',
                coordinates: [[[18.40, -33.93], [18.44, -33.93], [18.44, -33.90], [18.40, -33.90], [18.40, -33.93]]]
            }
        },
        {
            type: 'Feature',
            properties: {
                id: 2,
                name: 'Sea Point',
                crime_index: 45,
                population: 62000,
                quarter: 'Q4_2024',
                categories: { violent: 15, property: 60, other: 25 }
            },
            geometry: {
                type: 'Polygon',
                coordinates: [[[18.36, -33.93], [18.40, -33.93], [18.40, -33.90], [18.36, -33.90], [18.36, -33.93]]]
            }
        },
        {
            type: 'Feature',
            properties: {
                id: 3,
                name: 'Woodstock',
                crime_index: 58,
                population: 35000,
                quarter: 'Q4_2024',
                categories: { violent: 25, property: 50, other: 25 }
            },
            geometry: {
                type: 'Polygon',
                coordinates: [[[18.44, -33.94], [18.48, -33.94], [18.48, -33.92], [18.44, -33.92], [18.44, -33.94]]]
            }
        },
        {
            type: 'Feature',
            properties: {
                id: 4,
                name: 'Khayelitsha',
                crime_index: 85,
                population: 400000,
                quarter: 'Q4_2024',
                categories: { violent: 55, property: 30, other: 15 }
            },
            geometry: {
                type: 'Polygon',
                coordinates: [[[18.64, -34.06], [18.72, -34.06], [18.72, -34.00], [18.64, -34.00], [18.64, -34.06]]]
            }
        },
        {
            type: 'Feature',
            properties: {
                id: 5,
                name: 'Mitchells Plain',
                crime_index: 78,
                population: 310000,
                quarter: 'Q4_2024',
                categories: { violent: 45, property: 35, other: 20 }
            },
            geometry: {
                type: 'Polygon',
                coordinates: [[[18.60, -34.06], [18.68, -34.06], [18.68, -34.02], [18.60, -34.02], [18.60, -34.06]]]
            }
        },
        {
            type: 'Feature',
            properties: {
                id: 6,
                name: 'Camps Bay',
                crime_index: 28,
                population: 8500,
                quarter: 'Q4_2024',
                categories: { violent: 5, property: 70, other: 25 }
            },
            geometry: {
                type: 'Polygon',
                coordinates: [[[18.36, -33.97], [18.40, -33.97], [18.40, -33.94], [18.36, -33.94], [18.36, -33.97]]]
            }
        },
        {
            type: 'Feature',
            properties: {
                id: 7,
                name: 'Bellville',
                crime_index: 55,
                population: 120000,
                quarter: 'Q4_2024',
                categories: { violent: 30, property: 45, other: 25 }
            },
            geometry: {
                type: 'Polygon',
                coordinates: [[[18.62, -33.92], [18.68, -33.92], [18.68, -33.88], [18.62, -33.88], [18.62, -33.92]]]
            }
        },
        {
            type: 'Feature',
            properties: {
                id: 8,
                name: 'Nyanga',
                crime_index: 88,
                population: 120000,
                quarter: 'Q4_2024',
                categories: { violent: 60, property: 25, other: 15 }
            },
            geometry: {
                type: 'Polygon',
                coordinates: [[[18.54, -34.00], [18.60, -34.00], [18.60, -33.96], [18.54, -33.96], [18.54, -34.00]]]
            }
        }
    ]
};

// Choropleth color function
export const getCrimeColor = (index: number): string => {
    if (index <= 35) return '#22c55e'; // Green - Low
    if (index <= 60) return '#eab308'; // Yellow - Medium  
    if (index <= 80) return '#f97316'; // Orange - High
    return '#ef4444'; // Red - Very High
};

export const getCrimeLevel = (index: number): string => {
    if (index <= 35) return 'Low';
    if (index <= 60) return 'Moderate';
    if (index <= 80) return 'Elevated';
    return 'High';
};

export const useSafetyAnalysis = () => {
    const [data, setData] = useState<FeatureCollection<Polygon, PrecinctProperties>>(MOCK_PRECINCTS);
    const [selectedPrecinct, setSelectedPrecinct] = useState<PrecinctFeature | null>(null);
    const [timeRange, setTimeRange] = useState<TimeRange>('Q4_2024');
    const [loading, setLoading] = useState(false);

    // Calculate stats
    const stats: SafetyStats = {
        totalPrecincts: data.features.length,
        lowRisk: data.features.filter(f => f.properties.crime_index <= 35).length,
        mediumRisk: data.features.filter(f => f.properties.crime_index > 35 && f.properties.crime_index <= 60).length,
        highRisk: data.features.filter(f => f.properties.crime_index > 60).length,
        avgIndex: Math.round(
            data.features.reduce((sum, f) => sum + f.properties.crime_index, 0) / data.features.length
        )
    };

    const changeTimeRange = useCallback((range: TimeRange) => {
        setLoading(true);
        setTimeRange(range);
        // Simulate loading different quarter data
        setTimeout(() => {
            setLoading(false);
        }, 300);
    }, []);

    const selectPrecinct = useCallback((precinct: PrecinctFeature | null) => {
        setSelectedPrecinct(precinct);
    }, []);

    return {
        data,
        stats,
        selectedPrecinct,
        timeRange,
        loading,
        changeTimeRange,
        selectPrecinct,
        getCrimeColor,
        getCrimeLevel
    };
};

export default useSafetyAnalysis;
