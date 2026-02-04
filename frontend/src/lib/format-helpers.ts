/**
 * Formatting helpers for GeoHub
 */

/**
 * Format number with separators
 */
export const formatNumber = (value: number, decimals: number = 0): string => {
    return value.toLocaleString('en-ZA', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
};

/**
 * Format date to standard string
 */
export const formatDate = (date: Date | string | number): string => {
    const d = new Date(date);
    return d.toLocaleDateString('en-ZA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

/**
 * Format distance (meters to km if large)
 */
export const formatDistance = (meters: number): string => {
    if (meters >= 1000) {
        return `${(meters / 1000).toFixed(2)} km`;
    }
    return `${Math.round(meters)} m`;
};

/**
 * Format area (sq meters to hectares if large)
 */
export const formatArea = (sqMeters: number): string => {
    if (sqMeters >= 10000) {
        return `${(sqMeters / 10000).toFixed(2)} ha`;
    }
    return `${Math.round(sqMeters)} m²`;
};

export default {
    formatNumber,
    formatDate,
    formatDistance,
    formatArea
};
