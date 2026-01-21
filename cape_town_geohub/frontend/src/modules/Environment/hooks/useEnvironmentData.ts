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

// ... imports
import { useGeoData } from '../../../hooks/useGeoData';
import { API_ENDPOINTS } from '../../../lib/api';

// Types...

export const useEnvironmentData = () => {
    const [activeLayers, setActiveLayers] = useState({
        floodUtils: false,
        parks: false
    });

    const [nearestParkDist, setNearestParkDist] = useState<number | null>(null);

    // Fetch Real Data
    const { data: floodData } = useGeoData(
        'environment_flood_zones',
        API_ENDPOINTS.environment.flood_zones
    );

    const { data: parksData } = useGeoData(
        'environment_open_spaces',
        API_ENDPOINTS.environment.open_spaces
    );

    const floodZones = floodData || { type: 'FeatureCollection', features: [] };
    const parks = parksData || { type: 'FeatureCollection', features: [] };

    const toggleLayer = useCallback((layerId: 'floodUtils' | 'parks') => {
        setActiveLayers(prev => {
            const newState = { ...prev, [layerId]: !prev[layerId] };
            return newState;
        });
    }, []);

    const calculateGreenSpaceAccess = useCallback((lat: number, lng: number) => {
        if (!parksData || !parksData.features || parksData.features.length === 0) return;

        // Simplify for distance calculation: convert first point of polygon to Point
        // In production, use turf.pointOnFeature
        const parkCentroids: any = {
            type: 'FeatureCollection',
            features: parksData.features.map((f: any) => {
                // Handle Polygon or MultiPolygon
                const coords = f.geometry.type === 'MultiPolygon'
                    ? f.geometry.coordinates[0][0][0]
                    : f.geometry.coordinates[0][0];

                return {
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: coords || [0, 0] }
                };
            })
        };

        const dist = calculateNearestDistance([lng, lat], parkCentroids);
        setNearestParkDist(Math.round(dist));
    }, [parksData]);

    const getFloodColor = (risk: string) => {
        // Map CCT risk attributes if needed, or default
        return '#3b82f6';
    };

    return {
        floodZones,
        parks,
        activeLayers,
        toggleLayer,
        calculateGreenSpaceAccess,
        nearestParkDist,
        getFloodColor
    };
};
