import { describe, it, expect } from 'vitest';
import { formatNumber, formatDate, formatDistance, formatArea } from '../lib/format-helpers';

describe('formatHelpers', () => {
    describe('formatNumber', () => {
        const getExpected = (val: number, decimals: number = 0) => {
            return val.toLocaleString('en-ZA', {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            });
        };

        it('should format number with default decimals (0)', () => {
            const val = 1234.56;
            const result = formatNumber(val);
            expect(result).toBe(getExpected(val, 0));
        });

        it('should format number with specific decimals', () => {
            const val = 1234.56;
            const decimals = 2;
            const result = formatNumber(val, decimals);
            expect(result).toBe(getExpected(val, decimals));
        });

        it('should handle large numbers', () => {
            const val = 1000000;
            const result = formatNumber(val, 0);
            expect(result).toBe(getExpected(val, 0));
        });

        it('should handle negative numbers', () => {
            const val = -1234.56;
            const decimals = 2;
            const result = formatNumber(val, decimals);
            expect(result).toBe(getExpected(val, decimals));
        });

        it('should handle zero', () => {
            expect(formatNumber(0)).toBe(getExpected(0, 0));
            expect(formatNumber(0, 2)).toBe(getExpected(0, 2));
        });
    });

    describe('formatDate', () => {
        it('should format Date object', () => {
            const d = new Date(2023, 0, 15);
            // We expect the implementation to use standard en-ZA format options
            // which usually results in "15 Jan 2023"
            // However, verify against dynamic expectation if environment differs
            const expected = d.toLocaleDateString('en-ZA', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            expect(formatDate(d)).toBe(expected);
        });

        it('should format timestamp', () => {
            const d = new Date(2023, 0, 15);
            const expected = d.toLocaleDateString('en-ZA', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            expect(formatDate(d.getTime())).toBe(expected);
        });

        it('should format date string', () => {
            const input = '2023/01/15';
            const d = new Date(input);
            const expected = d.toLocaleDateString('en-ZA', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            expect(formatDate(input)).toBe(expected);
        });
    });

    describe('formatDistance', () => {
        // These tests do NOT rely on locale formatting (toFixed uses dot),
        // except for the unit string (km/m).

        it('should format meters (< 1000)', () => {
            expect(formatDistance(500)).toBe('500 m');
            expect(formatDistance(999)).toBe('999 m');
            // Rounding check
            expect(formatDistance(500.6)).toBe('501 m');
        });

        it('should format kilometers (>= 1000)', () => {
            expect(formatDistance(1000)).toBe('1.00 km');
            expect(formatDistance(1500)).toBe('1.50 km');
            expect(formatDistance(12345)).toBe('12.35 km');
        });

        it('should handle 0', () => {
             expect(formatDistance(0)).toBe('0 m');
        });
    });

    describe('formatArea', () => {
        it('should format square meters (< 10000)', () => {
            expect(formatArea(500)).toBe('500 m²');
            expect(formatArea(9999)).toBe('9999 m²');
            expect(formatArea(500.6)).toBe('501 m²');
        });

        it('should format hectares (>= 10000)', () => {
            expect(formatArea(10000)).toBe('1.00 ha');
            expect(formatArea(15000)).toBe('1.50 ha');
            expect(formatArea(123456)).toBe('12.35 ha');
        });

        it('should handle 0', () => {
             expect(formatArea(0)).toBe('0 m²');
        });
    });
});
