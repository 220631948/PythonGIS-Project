/**
 * useMap3D Hook
 *
 * Manages 3D visualization state and interactions with deck.gl
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { apiClient } from '../../../lib/api';
import type {
  BuildingData,
  ElevationProfile,
  ShadowAnalysisRequest,
  ShadowAnalysisResult,
  ViewState3D,
} from '../../../types/api-2026';

interface UseMap3DOptions {
  initialViewState?: ViewState3D;
  autoRotate?: boolean;
}

interface UseMap3DReturn {
  viewState: ViewState3D;
  setViewState: (state: ViewState3D) => void;
  buildings: BuildingData[];
  elevationProfile: ElevationProfile | null;
  shadowAnalysis: ShadowAnalysisResult | null;
  isLoading: boolean;
  error: string | null;
  actions: {
    loadBuildings: (bounds: [number, number, number, number]) => Promise<BuildingData[]>;
    getElevationProfile: (points: [number, number][]) => Promise<ElevationProfile>;
    analyzeShadows: (request: ShadowAnalysisRequest) => Promise<ShadowAnalysisResult>;
    reset3DView: () => void;
    toggleAutoRotate: () => void;
  };
  autoRotateEnabled: boolean;
}

const DEFAULT_VIEW_STATE: ViewState3D = {
  longitude: 18.4241,
  latitude: -33.9249,
  zoom: 14,
  pitch: 45,
  bearing: 0,
  altitude: 1.5,
};

export function useMap3D(options: UseMap3DOptions = {}): UseMap3DReturn {
  const { initialViewState = DEFAULT_VIEW_STATE, autoRotate = false } = options;

  const [viewState, setViewState] = useState<ViewState3D>(initialViewState);
  const [buildings, setBuildings] = useState<BuildingData[]>([]);
  const [elevationProfile, setElevationProfile] = useState<ElevationProfile | null>(null);
  const [shadowAnalysis, setShadowAnalysis] = useState<ShadowAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRotateEnabled, setAutoRotateEnabled] = useState(autoRotate);

  const rotationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-rotate functionality
  useEffect(() => {
    if (autoRotateEnabled) {
      rotationIntervalRef.current = setInterval(() => {
        setViewState(prev => ({
          ...prev,
          bearing: (prev.bearing + 0.5) % 360,
        }));
      }, 50);
    } else if (rotationIntervalRef.current) {
      clearInterval(rotationIntervalRef.current);
      rotationIntervalRef.current = null;
    }

    return () => {
      if (rotationIntervalRef.current) {
        clearInterval(rotationIntervalRef.current);
      }
    };
  }, [autoRotateEnabled]);

  const loadBuildings = useCallback(async (bounds: [number, number, number, number]): Promise<BuildingData[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await apiClient.get3DBuildings({
        bbox: bounds,
        include_heights: true,
      });

      setBuildings(result.buildings);
      return result.buildings;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load buildings';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getElevationProfile = useCallback(async (points: [number, number][]): Promise<ElevationProfile> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await apiClient.getElevationProfile({ points });
      setElevationProfile(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get elevation profile';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const analyzeShadows = useCallback(async (request: ShadowAnalysisRequest): Promise<ShadowAnalysisResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await apiClient.analyzeShadows(request);
      setShadowAnalysis(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to analyze shadows';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset3DView = useCallback(() => {
    setViewState(initialViewState);
    setAutoRotateEnabled(false);
  }, [initialViewState]);

  const toggleAutoRotate = useCallback(() => {
    setAutoRotateEnabled(prev => !prev);
  }, []);

  return {
    viewState,
    setViewState,
    buildings,
    elevationProfile,
    shadowAnalysis,
    isLoading,
    error,
    actions: {
      loadBuildings,
      getElevationProfile,
      analyzeShadows,
      reset3DView,
      toggleAutoRotate,
    },
    autoRotateEnabled,
  };
}
