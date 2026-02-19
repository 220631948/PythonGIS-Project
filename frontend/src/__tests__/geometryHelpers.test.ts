import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as turf from '@turf/turf';
import { calculateArea, bufferPoint, centroid, simplify } from '../lib/geometry-helpers';
import type { Feature, Point, Polygon } from 'geojson';

// Mock the turf module
vi.mock('@turf/turf', () => ({
  area: vi.fn(),
  buffer: vi.fn(),
  centroid: vi.fn(),
  simplify: vi.fn(),
}));

describe('geometry-helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateArea', () => {
    it('should calculate the area of a polygon', () => {
      const mockPolygon: Polygon = {
        type: 'Polygon',
        coordinates: [[[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]]],
      };
      const mockArea = 100;
      vi.mocked(turf.area).mockReturnValue(mockArea);

      const result = calculateArea(mockPolygon);

      expect(turf.area).toHaveBeenCalledWith(mockPolygon);
      expect(result).toBe(mockArea);
    });
  });

  describe('bufferPoint', () => {
    it('should create a buffer around a point', () => {
      const mockPoint: Point = { type: 'Point', coordinates: [0, 0] };
      const radius = 100;
      const mockBufferGeometry: Polygon = {
        type: 'Polygon',
        coordinates: [[[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]]],
      };
      const mockFeature: Feature<Polygon> = {
        type: 'Feature',
        geometry: mockBufferGeometry,
        properties: {},
      };

      vi.mocked(turf.buffer).mockReturnValue(mockFeature);

      const result = bufferPoint(mockPoint, radius);

      expect(turf.buffer).toHaveBeenCalledWith(mockPoint, radius, { units: 'meters' });
      expect(result).toEqual(mockBufferGeometry);
    });
  });

  describe('centroid', () => {
    it('should calculate the centroid of a geometry', () => {
      const mockPolygon: Polygon = {
        type: 'Polygon',
        coordinates: [[[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]]],
      };
      const mockCentroidGeometry: Point = { type: 'Point', coordinates: [5, 5] };
      const mockFeature: Feature<Point> = {
        type: 'Feature',
        geometry: mockCentroidGeometry,
        properties: {},
      };

      vi.mocked(turf.centroid).mockReturnValue(mockFeature);

      const result = centroid(mockPolygon);

      expect(turf.centroid).toHaveBeenCalledWith(mockPolygon);
      expect(result).toEqual(mockCentroidGeometry);
    });
  });

  describe('simplify', () => {
    it('should simplify a geometry with default tolerance', () => {
      const mockGeometry: Polygon = {
        type: 'Polygon',
        coordinates: [[[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]]],
      };
      const mockSimplifiedGeometry: Polygon = {
        type: 'Polygon',
        coordinates: [[[0, 0], [10, 10], [0, 0]]], // Simplified
      };

      vi.mocked(turf.simplify).mockReturnValue(mockSimplifiedGeometry);

      const result = simplify(mockGeometry);

      expect(turf.simplify).toHaveBeenCalledWith(mockGeometry, { tolerance: 0.001, highQuality: true });
      expect(result).toEqual(mockSimplifiedGeometry);
    });

    it('should simplify a geometry with custom tolerance', () => {
      const mockGeometry: Polygon = {
        type: 'Polygon',
        coordinates: [[[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]]],
      };
      const tolerance = 0.5;
      const mockSimplifiedGeometry: Polygon = {
        type: 'Polygon',
        coordinates: [[[0, 0], [10, 10], [0, 0]]], // Simplified
      };

      vi.mocked(turf.simplify).mockReturnValue(mockSimplifiedGeometry);

      const result = simplify(mockGeometry, tolerance);

      expect(turf.simplify).toHaveBeenCalledWith(mockGeometry, { tolerance, highQuality: true });
      expect(result).toEqual(mockSimplifiedGeometry);
    });
  });
});
