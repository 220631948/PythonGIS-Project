/**
 * Color Utilities for GeoHub
 * Handling hex, rgb and color scales
 */

export type Color = string; // Hex format #RRGGBB

interface RGB {
    r: number;
    g: number;
    b: number;
}

/**
 * Convert Hex color to RGB object
 */
export const hexToRgb = (hex: Color): RGB => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result || result.length < 4) {
        return { r: 0, g: 0, b: 0 };
    }
    return {
        r: parseInt(result[1] || '0', 16),
        g: parseInt(result[2] || '0', 16),
        b: parseInt(result[3] || '0', 16)
    };
};

/**
 * Convert RGB values to Hex Color
 */
export const rgbToHex = (r: number, g: number, b: number): Color => {
    const toHex = (c: number) => {
        const hex = Math.max(0, Math.min(255, c)).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

/**
 * Get a color scale function
 * @param domain - Number array representing the values
 * @param range - Color array representing the colors
 * @returns Function that maps a number to a color
 */
export const getColorScale = (domain: number[], range: Color[]) => {
    return (value: number): Color => {
        if (!domain.length || !range.length) return '#000000';

        const dFirst = domain[0];
        const rFirst = range[0];
        const dLast = domain[domain.length - 1];
        const rLast = range[range.length - 1];

        if (dFirst !== undefined && value <= dFirst) return rFirst || '#000000';
        if (dLast !== undefined && value >= dLast) return rLast || '#000000';

        // Simple linear interpolation between the two nearest domain points
        for (let i = 0; i < domain.length - 1; i++) {
            const d1 = domain[i];
            const d2 = domain[i + 1];
            const r1 = range[i];
            const r2 = range[i + 1];

            if (d1 !== undefined && d2 !== undefined && r1 !== undefined && r2 !== undefined) {
                if (value >= d1 && value <= d2) {
                    const t = (value - d1) / (d2 - d1);
                    const c1 = hexToRgb(r1);
                    const c2 = hexToRgb(r2);

                    const r = Math.round(c1.r + t * (c2.r - c1.r));
                    const g = Math.round(c1.g + t * (c2.g - c1.g));
                    const b = Math.round(c1.b + t * (c2.b - c1.b));

                    return rgbToHex(r, g, b);
                }
            }
        }

        return range[0] || '#000000';
    };
};

export default {
    hexToRgb,
    rgbToHex,
    getColorScale
};
