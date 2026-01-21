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

// ... types (keep existing)
import { useGeoData } from '../../../hooks/useGeoData';
import { API_ENDPOINTS } from '../../../lib/api';

// ... interface WasteZoneProperties (keep existing)

export const useUtilitiesData = () => {
    const [active, setActive] = useState(false);

    const { data: wasteData, isLoading: loadingWaste } = useGeoData(
        'utilities_waste',
        API_ENDPOINTS.utilities.waste
    );

    const { data: recyclingData, isLoading: loadingRecycling } = useGeoData(
        'utilities_recycling',
        API_ENDPOINTS.utilities.recycling
    );

    const wasteZones = wasteData || { type: 'FeatureCollection', features: [] };
    // Merge recycling if needed or expose separately. The mock only returned wasteZones.
    // For now, let's just use wasteData as wasteZones.

    const toggleLayer = () => setActive(prev => !prev);

    const reportIssue = (lat: number, lng: number, issueType: string) => {
        console.log(`[Utilities] Report Issue: ${issueType} at [${lat}, ${lng}]`);
        // In a real app, this would send an API request
    };

    return {
        wasteZones,
        recyclingData, // Expose this too if needed
        active,
        toggleLayer,
        reportIssue,
        loading: loadingWaste || loadingRecycling
    };
};
