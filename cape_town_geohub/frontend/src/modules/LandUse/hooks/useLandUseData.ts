/**
 * useLandUseData Hook
 * Manages Zoning Data
 */

import { useState } from 'react';
import type { FeatureCollection, Polygon } from 'geojson';

export interface ZoningProperties {
    id: number;
    code: string;
    description: string;
    max_height: string;
    coverage: string;
    color: string;
}

// Mock Zoning Data
const MOCK_ZONING: FeatureCollection<Polygon, ZoningProperties> = {
    type: 'FeatureCollection',
    features: [
        {
            type: 'Feature',
            properties: {
                id: 1,
                code: 'SR1',
                description: 'Single Residential 1',
                max_height: '10m',
                coverage: '50%',
                color: '#facc15' // Yellow
            },
            geometry: {
                type: 'Polygon',
                coordinates: [[[18.42, -33.93], [18.44, -33.93], [18.44, -33.92], [18.42, -33.92], [18.42, -33.93]]]
            }
        },
        {
            type: 'Feature',
            properties: {
                id: 2,
                code: 'GB1',
                description: 'General Business 1',
                max_height: '15m',
                coverage: '100%',
                color: '#ef4444' // Red
            },
            geometry: {
                type: 'Polygon',
                coordinates: [[[18.41, -33.92], [18.42, -33.92], [18.42, -33.91], [18.41, -33.91], [18.41, -33.92]]]
            }
        },
        {
            type: 'Feature',
            properties: {
                id: 3,
                code: 'GI1',
                description: 'General Industrial 1',
                max_height: '18m',
                coverage: '75%',
                color: '#a855f7' // Purple
            },
            geometry: {
                type: 'Polygon',
                coordinates: [[[18.46, -33.92], [18.48, -33.92], [18.48, -33.91], [18.46, -33.91], [18.46, -33.92]]]
            }
        },
        {
            type: 'Feature',
            properties: {
                id: 4,
                code: 'GR4',
                description: 'General Residential 4',
                max_height: '24m',
                coverage: '60%',
                color: '#ea580c' // Orange
            },
            geometry: {
                type: 'Polygon',
                coordinates: [[[18.43, -33.94], [18.45, -33.94], [18.45, -33.93], [18.43, -33.93], [18.43, -33.94]]]
            }
        }
    ]
};

export const useLandUseData = () => {
    const [active, setActive] = useState(false);

    const toggleLayer = () => setActive(prev => !prev);

    return {
        zoningData: MOCK_ZONING,
        active,
        toggleLayer
    };
};
