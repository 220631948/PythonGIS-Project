/**
 * useEnvironmentData Hook
 * Manages Flood Zone and Green Space data
 */

import { useState, useCallback } from 'react';
import type { FeatureCollection, Polygon } from 'geojson';
import { calculateNearestDistance } from '../../../lib/spatial/analysis';

export interface FloodZoneProperties {
    id: number;
    risk_level: 'High' | 'Medium' | 'Low';
    description: string;
    return_period: string; // e.g. "1:50 year"
}

export interface ParkProperties {
    id: number;
    name: string;
    type: string;
    access: 'Public' | 'Restricted';
}

// Mock Flood Zones (Blue/Red polygons)
const MOCK_FLOOD_ZONES: FeatureCollection<Polygon, FloodZoneProperties> = {
    type: 'FeatureCollection',
    features: [
        {
            type: 'Feature',
            properties: {
                id: 1,
                risk_level: 'High',
                description: 'Black River Floodplain',
                return_period: '1:50 year'
            },
            geometry: {
                type: 'Polygon',
                coordinates: [[[18.47, -33.93], [18.49, -33.93], [18.49, -33.91], [18.47, -33.91], [18.47, -33.93]]]
            }
        },
        {
            type: 'Feature',
            properties: {
                id: 2,
                risk_level: 'Medium',
                description: 'Salt River Canal Zone',
                return_period: '1:100 year'
            },
            geometry: {
                type: 'Polygon',
                coordinates: [[[18.45, -33.92], [18.47, -33.92], [18.47, -33.90], [18.45, -33.90], [18.45, -33.92]]]
            }
        }
    ]
};

// Mock Parks (Green polygons)
const MOCK_PARKS: FeatureCollection<Polygon, ParkProperties> = {
    type: 'FeatureCollection',
    features: [
        {
            type: 'Feature',
            properties: { id: 1, name: 'Green Point Park', type: 'Urban Park', access: 'Public' },
            geometry: {
                type: 'Polygon',
                coordinates: [[[18.40, -33.90], [18.41, -33.90], [18.41, -33.89], [18.40, -33.89], [18.40, -33.90]]]
            }
        },
        {
            type: 'Feature',
            properties: { id: 2, name: 'De Waal Park', type: 'Community Park', access: 'Public' },
            geometry: {
                type: 'Polygon',
                coordinates: [[[18.41, -33.94], [18.42, -33.94], [18.42, -33.93], [18.41, -33.93], [18.41, -33.94]]]
            }
        }
    ]
};

export const useEnvironmentData = () => {
    const [activeLayers, setActiveLayers] = useState({
        floodUtils: false,
        parks: false
    });

    const [nearestParkDist, setNearestParkDist] = useState<number | null>(null);

    const toggleLayer = useCallback((layerId: 'floodUtils' | 'parks') => {
        setActiveLayers(prev => {
            const newState = { ...prev, [layerId]: !prev[layerId] };
            return newState;
        });
    }, []);

    const calculateGreenSpaceAccess = useCallback((lat: number, lng: number) => {
        // Convert polygons to points (centroids) for simple distance calc
        // In a real app, we'd use nearest point on polygon
        const parkCentroids: any = {
            type: 'FeatureCollection',
            features: MOCK_PARKS.features.map(f => ({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: f.geometry.coordinates[0][0] } // APPROX: First point
            }))
        };

        const dist = calculateNearestDistance([lng, lat], parkCentroids);
        setNearestParkDist(Math.round(dist));
    }, []);

    const getFloodColor = (risk: string) => {
        switch (risk) {
            case 'High': return '#ef4444'; // Red
            case 'Medium': return '#f59e0b'; // Amber
            default: return '#3b82f6'; // Blue
        }
    };

    return {
        floodZones: MOCK_FLOOD_ZONES,
        parks: MOCK_PARKS,
        activeLayers,
        toggleLayer,
        calculateGreenSpaceAccess,
        nearestParkDist,
        getFloodColor
    };
};
