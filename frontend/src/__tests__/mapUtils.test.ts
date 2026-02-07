/**
 * Unit tests for map/mapUtils.ts – coordinate helpers & layer styling
 */
import { describe, it, expect } from 'vitest';
import { toLatLng, hasFiniteCoords, isValidGeoJSONFeature, getLayerStyle } from '../components/map/mapUtils';

// ── toLatLng ──

describe('toLatLng', () => {
  it('normalises {lat, lng}', () => {
    expect(toLatLng({ lat: -33.9, lng: 18.4 })).toEqual({ lat: -33.9, lng: 18.4 });
  });

  it('normalises {latitude, longitude}', () => {
    expect(toLatLng({ latitude: -33.9, longitude: 18.4 })).toEqual({ lat: -33.9, lng: 18.4 });
  });

  it('normalises {lat, lon} (OpenStreetMap style)', () => {
    expect(toLatLng({ lat: -33.9, lon: 18.4 })).toEqual({ lat: -33.9, lng: 18.4 });
  });

  it('accepts string coordinates', () => {
    expect(toLatLng({ lat: '-33.9', lng: '18.4' })).toEqual({ lat: -33.9, lng: 18.4 });
  });

  it('returns null for null/undefined', () => {
    expect(toLatLng(null)).toBeNull();
    expect(toLatLng(undefined)).toBeNull();
  });

  it('returns null for NaN coordinates', () => {
    expect(toLatLng({ lat: NaN, lng: 18.4 })).toBeNull();
    expect(toLatLng({ lat: 'abc', lng: 18.4 })).toBeNull();
  });

  it('returns null for Infinity', () => {
    expect(toLatLng({ lat: Infinity, lng: 18.4 })).toBeNull();
  });
});

// ── hasFiniteCoords ──

describe('hasFiniteCoords', () => {
  it('detects simple [lng, lat] pair', () => {
    expect(hasFiniteCoords([18.4, -33.9])).toBe(true);
  });

  it('detects nested coordinate arrays (polygon rings)', () => {
    expect(hasFiniteCoords([[18.4, -33.9], [18.5, -33.8]])).toBe(true);
  });

  it('empty array is vacuously valid (every returns true)', () => {
    // Array.every([]) is true — this is expected JavaScript behavior
    expect(hasFiniteCoords([])).toBe(true);
  });

  it('rejects non-array', () => {
    expect(hasFiniteCoords('not an array')).toBe(false);
    expect(hasFiniteCoords(42)).toBe(false);
  });

  it('rejects NaN coordinates', () => {
    expect(hasFiniteCoords([NaN, -33.9])).toBe(false);
  });
});

// ── isValidGeoJSONFeature ──

describe('isValidGeoJSONFeature', () => {
  it('validates a Point feature', () => {
    const feature: GeoJSON.Feature = {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [18.4, -33.9] },
      properties: {},
    };
    expect(isValidGeoJSONFeature(feature)).toBe(true);
  });

  it('validates a Polygon feature', () => {
    const ring = [[18.4, -33.9], [18.5, -33.9], [18.5, -33.8], [18.4, -33.8], [18.4, -33.9]];
    const feature: GeoJSON.Feature = {
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [ring] },
      properties: {},
    };
    expect(isValidGeoJSONFeature(feature)).toBe(true);
  });

  it('rejects feature with null geometry', () => {
    const feature = {
      type: 'Feature',
      geometry: null,
      properties: {},
    } as unknown as GeoJSON.Feature;
    expect(isValidGeoJSONFeature(feature)).toBe(false);
  });
});

// ── getLayerStyle ──

describe('getLayerStyle', () => {
  const mkFeature = (props: Record<string, unknown>): GeoJSON.Feature => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [0, 0] },
    properties: props,
  });

  it('returns green for high access_score in services-layer', () => {
    const style = getLayerStyle('services-layer', mkFeature({ access_score: 85 }));
    expect(style.color).toBe('#22c55e');
  });

  it('returns orange for medium access_score in services-layer', () => {
    const style = getLayerStyle('services-layer', mkFeature({ access_score: 55 }));
    expect(style.color).toBe('#f97316');
  });

  it('returns red for low access_score in services-layer', () => {
    const style = getLayerStyle('services-layer', mkFeature({ access_score: 20 }));
    expect(style.color).toBe('#ef4444');
  });

  it('returns blue for flood-layer', () => {
    const style = getLayerStyle('flood-layer', mkFeature({}));
    expect(style.color).toBe('#3b82f6');
  });

  it('returns fallback grey for unknown layer', () => {
    const style = getLayerStyle('unknown-layer', mkFeature({}));
    expect(style.color).toBe('#6b7280');
  });

  it('uses custom opacity', () => {
    const style = getLayerStyle('flood-layer', mkFeature({}), 0.5);
    expect(style.fillOpacity).toBe(0.5 * 0.8);
  });
});
