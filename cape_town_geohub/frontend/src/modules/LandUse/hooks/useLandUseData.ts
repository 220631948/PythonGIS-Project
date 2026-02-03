/**
 * useLandUseData Hook
 * Manages Zoning Data
 */

import { useState } from 'react';
// geojson types not currently used directly in this file

export interface ZoningProperties {
    id: number;
    code: string;
    description: string;
    max_height: string;
    coverage: string;
    color: string;
}

// ...
import { useGeoData } from '../../../hooks/useGeoData';
import { API_ENDPOINTS } from '../../../lib/api';

// Types...

export const useLandUseData = () => {
    const [active, setActive] = useState(false);

    const { data, isLoading } = useGeoData(
        'landuse_zoning',
        API_ENDPOINTS.landuse.zoning
    );

    const zoningData = data || { type: 'FeatureCollection', features: [] };

    const toggleLayer = () => setActive(prev => !prev);

    return {
        zoningData,
        active,
        toggleLayer,
        loading: isLoading
    };
};
