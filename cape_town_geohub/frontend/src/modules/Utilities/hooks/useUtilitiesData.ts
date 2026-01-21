/**
 * useUtilitiesData Hook
 * Manages Waste Collection and Recycling data
 */

import { useState } from 'react';
import type { FeatureCollection, Polygon } from 'geojson';

export interface WasteZoneProperties {
    id: number;
    suburb: string;
    collection_day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
    recycling_day: string;
    color: string;
}

// Mock Waste Zones
const MOCK_WASTE_ZONES: FeatureCollection<Polygon, WasteZoneProperties> = {
    type: 'FeatureCollection',
    features: [
        {
            type: 'Feature',
            properties: {
                id: 1,
                suburb: 'City Bowl',
                collection_day: 'Tuesday',
                recycling_day: 'Tuesday (Fortnightly)',
                color: '#facc15' // Yellow
            },
            geometry: {
                type: 'Polygon',
                coordinates: [[[18.41, -33.93], [18.43, -33.93], [18.43, -33.91], [18.41, -33.91], [18.41, -33.93]]]
            }
        },
        {
            type: 'Feature',
            properties: {
                id: 2,
                suburb: 'Green Point',
                collection_day: 'Monday',
                recycling_day: 'Monday (Weekly)',
                color: '#22c55e' // Green
            },
            geometry: {
                type: 'Polygon',
                coordinates: [[[18.39, -33.91], [18.41, -33.91], [18.41, -33.89], [18.39, -33.89], [18.39, -33.91]]]
            }
        },
        {
            type: 'Feature',
            properties: {
                id: 3,
                suburb: 'Woodstock',
                collection_day: 'Thursday',
                recycling_day: 'Thursday (Fortnightly)',
                color: '#f97316' // Orange
            },
            geometry: {
                type: 'Polygon',
                coordinates: [[[18.44, -33.93], [18.46, -33.93], [18.46, -33.92], [18.44, -33.92], [18.44, -33.93]]]
            }
        }
    ]
};

export const useUtilitiesData = () => {
    const [active, setActive] = useState(false);

    const toggleLayer = () => setActive(prev => !prev);

    const reportIssue = (lat: number, lng: number, issueType: string) => {
        console.log(`[Utilities] Report Issue: ${issueType} at [${lat}, ${lng}]`);
        // In a real app, this would send an API request
    };

    return {
        wasteZones: MOCK_WASTE_ZONES,
        active,
        toggleLayer,
        reportIssue
    };
};
