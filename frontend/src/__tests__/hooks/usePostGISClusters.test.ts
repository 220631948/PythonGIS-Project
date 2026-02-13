/**
 * usePostGISClusters Hook Tests
 *
 * Sprint 4 - S4.1 (F.2.1): Frontend hook tests with Vitest
 * Tests PostGIS server-side clustering integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePostGISClusters } from '../../hooks/usePostGISClusters';
import type { LatLngBounds } from 'leaflet';

// Mock fetch
global.fetch = vi.fn();

// Mock LatLngBounds
const createMockBounds = (south: number, north: number, west: number, east: number): LatLngBounds => ({
  getSouth: () => south,
  getNorth: () => north,
  getWest: () => west,
  getEast: () => east,
  getCenter: vi.fn(),
  getNorthEast: vi.fn(),
  getNorthWest: vi.fn(),
  getSouthEast: vi.fn(),
  getSouthWest: vi.fn(),
  getWest: () => west,
  getEast: () => east,
  toBBoxString: vi.fn(),
  equals: vi.fn(),
  contains: vi.fn(),
  intersects: vi.fn(),
  overlaps: vi.fn(),
  isValid: vi.fn(() => true),
  pad: vi.fn(),
  extend: vi.fn(),
} as unknown as LatLngBounds);

describe('usePostGISClusters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should not fetch when enabled is false', () => {
    const bounds = createMockBounds(-34, -33, 18, 19);

    renderHook(() =>
      usePostGISClusters({
        dataset: 'clinics',
        zoom: 10,
        bounds,
        enabled: false,
      })
    );

    expect(fetch).not.toHaveBeenCalled();
  });

  it('should not fetch when zoom is >= minZoom', () => {
    const bounds = createMockBounds(-34, -33, 18, 19);

    renderHook(() =>
      usePostGISClusters({
        dataset: 'clinics',
        zoom: 16,
        bounds,
        enabled: true,
        minZoom: 15,
      })
    );

    expect(fetch).not.toHaveBeenCalled();
  });

  it('should not fetch when bounds is null', () => {
    renderHook(() =>
      usePostGISClusters({
        dataset: 'clinics',
        zoom: 10,
        bounds: null,
        enabled: true,
      })
    );

    expect(fetch).not.toHaveBeenCalled();
  });

  it('should fetch clusters when conditions are met', async () => {
    const mockResponse = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [18.5, -33.9] },
          properties: { cluster_id: 1, point_count: 10, is_cluster: true },
        },
      ],
      metadata: { cluster_count: 1, zoom: 10, total_points: 10 },
    };

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const bounds = createMockBounds(-34, -33, 18, 19);

    const { result } = renderHook(() =>
      usePostGISClusters({
        dataset: 'clinics',
        zoom: 10,
        bounds,
        enabled: true,
      })
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.clusters).toEqual(mockResponse);
    expect(result.current.error).toBeNull();
  });

  it('should send correct request body to /api/spatial/cluster', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ type: 'FeatureCollection', features: [], metadata: {} }),
    });

    const bounds = createMockBounds(-34.0, -33.8, 18.3, 18.5);

    renderHook(() =>
      usePostGISClusters({
        dataset: 'clinics',
        zoom: 12,
        bounds,
        enabled: true,
      })
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/spatial/cluster',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            layer_name: 'clinics',
            bounds: {
              min_lat: -34.0,
              max_lat: -33.8,
              min_lng: 18.3,
              max_lng: 18.5,
            },
            zoom_level: 12,
          }),
        })
      );
    });
  });

  it('should handle HTTP errors correctly', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    });

    const bounds = createMockBounds(-34, -33, 18, 19);

    const { result } = renderHook(() =>
      usePostGISClusters({
        dataset: 'clinics',
        zoom: 10,
        bounds,
        enabled: true,
      })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.error?.message).toContain('HTTP 500');
    expect(result.current.clusters).toBeNull();
  });

  it('should handle network errors correctly', async () => {
    (fetch as any).mockRejectedValueOnce(new Error('Network error'));

    const bounds = createMockBounds(-34, -33, 18, 19);

    const { result } = renderHook(() =>
      usePostGISClusters({
        dataset: 'clinics',
        zoom: 10,
        bounds,
        enabled: true,
      })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.error?.message).toBe('Network error');
    expect(result.current.clusters).toBeNull();
  });

  it('should abort previous request when parameters change', async () => {
    let abortCallCount = 0;
    const mockAbort = vi.fn(() => {
      abortCallCount++;
    });

    (fetch as any).mockImplementation((url: string, options: any) => {
      // Track abort calls
      if (options?.signal) {
        options.signal.addEventListener('abort', mockAbort);
      }

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            ok: true,
            json: async () => ({ type: 'FeatureCollection', features: [], metadata: {} }),
          });
        }, 100);
      });
    });

    const bounds1 = createMockBounds(-34, -33, 18, 19);
    const bounds2 = createMockBounds(-35, -34, 18, 19);

    const { rerender } = renderHook(
      ({ zoom, bounds }) =>
        usePostGISClusters({
          dataset: 'clinics',
          zoom,
          bounds,
          enabled: true,
        }),
      { initialProps: { zoom: 10, bounds: bounds1 } }
    );

    // Trigger re-fetch by changing zoom
    rerender({ zoom: 11, bounds: bounds2 });

    await waitFor(() => {
      expect(abortCallCount).toBeGreaterThan(0);
    });
  });

  it('should not update state if request is aborted', async () => {
    (fetch as any).mockImplementation(() => {
      const abortError = new Error('AbortError');
      abortError.name = 'AbortError';
      return Promise.reject(abortError);
    });

    const bounds = createMockBounds(-34, -33, 18, 19);

    const { result } = renderHook(() =>
      usePostGISClusters({
        dataset: 'clinics',
        zoom: 10,
        bounds,
        enabled: true,
      })
    );

    await waitFor(() => {
      // Should not set error for aborted requests
      expect(result.current.error).toBeNull();
    });
  });

  it('should re-fetch when dataset changes', async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ type: 'FeatureCollection', features: [], metadata: {} }),
    });

    const bounds = createMockBounds(-34, -33, 18, 19);

    const { rerender } = renderHook(
      ({ dataset }) =>
        usePostGISClusters({
          dataset,
          zoom: 10,
          bounds,
          enabled: true,
        }),
      { initialProps: { dataset: 'clinics' } }
    );

    expect(fetch).toHaveBeenCalledTimes(1);

    rerender({ dataset: 'schools' });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  it('should use custom minZoom threshold', () => {
    const bounds = createMockBounds(-34, -33, 18, 19);

    // Should NOT fetch at zoom 18 with minZoom=20
    renderHook(() =>
      usePostGISClusters({
        dataset: 'clinics',
        zoom: 18,
        bounds,
        enabled: true,
        minZoom: 20,
      })
    );

    expect(fetch).not.toHaveBeenCalled();
  });

  it('should set clusters to null when zoom exceeds minZoom', () => {
    const bounds = createMockBounds(-34, -33, 18, 19);

    const { result, rerender } = renderHook(
      ({ zoom }) =>
        usePostGISClusters({
          dataset: 'clinics',
          zoom,
          bounds,
          enabled: true,
          minZoom: 15,
        }),
      { initialProps: { zoom: 10 } }
    );

    // At zoom 10, should have made a request
    expect(fetch).toHaveBeenCalled();

    // Zoom in past minZoom
    rerender({ zoom: 16 });

    // Clusters should be set to null (show individual points)
    expect(result.current.clusters).toBeNull();
  });

  it('should handle malformed JSON response', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new Error('Unexpected token');
      },
    });

    const bounds = createMockBounds(-34, -33, 18, 19);

    const { result } = renderHook(() =>
      usePostGISClusters({
        dataset: 'clinics',
        zoom: 10,
        bounds,
        enabled: true,
      })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.clusters).toBeNull();
  });
});
