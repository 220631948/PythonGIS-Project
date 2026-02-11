/**
 * useAIInsights Hook
 *
 * Manages AI-powered predictions and insights
 */

import { useState, useCallback } from 'react';
import { apiClient } from '../../../lib/api';
import type {
  TrafficPredictionRequest,
  TrafficPredictionResponse,
  CrimeHotspotRequest,
  CrimeHotspotResponse,
  LandUseChangeRequest,
  LandUseChangeResponse,
  NLPQueryRequest,
  NLPQueryResponse,
  TrendingPrediction
} from '../../../types/api-2026';

interface UseAIInsightsReturn {
  trafficPrediction: TrafficPredictionResponse | null;
  crimeHotspots: CrimeHotspotResponse | null;
  landUseChanges: LandUseChangeResponse | null;
  nlpResult: NLPQueryResponse | null;
  trendingPredictions: TrendingPrediction[];
  isLoading: boolean;
  error: string | null;

  // Actions
  predictTraffic: (request: TrafficPredictionRequest) => Promise<TrafficPredictionResponse>;
  analyzeCrimeHotspots: (request: CrimeHotspotRequest) => Promise<CrimeHotspotResponse>;
  detectLandUseChange: (request: LandUseChangeRequest) => Promise<LandUseChangeResponse>;
  queryNaturalLanguage: (query: string) => Promise<NLPQueryResponse>;
  fetchTrendingPredictions: () => Promise<void>;
  clearResults: () => void;
}

export function useAIInsights(): UseAIInsightsReturn {
  const [trafficPrediction, setTrafficPrediction] = useState<TrafficPredictionResponse | null>(null);
  const [crimeHotspots, setCrimeHotspots] = useState<CrimeHotspotResponse | null>(null);
  const [landUseChanges, setLandUseChanges] = useState<LandUseChangeResponse | null>(null);
  const [nlpResult, setNlpResult] = useState<NLPQueryResponse | null>(null);
  const [trendingPredictions, setTrendingPredictions] = useState<TrendingPrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Predict traffic
  const predictTraffic = useCallback(async (
    request: TrafficPredictionRequest
  ): Promise<TrafficPredictionResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await apiClient.predictTraffic(request) as TrafficPredictionResponse;
      setTrafficPrediction(result);
      return result;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to predict traffic';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Analyze crime hotspots
  const analyzeCrimeHotspots = useCallback(async (
    request: CrimeHotspotRequest
  ): Promise<CrimeHotspotResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await apiClient.predictCrimeHotspots(request) as CrimeHotspotResponse;
      setCrimeHotspots(result);
      return result;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to analyze crime hotspots';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Detect land use changes
  const detectLandUseChange = useCallback(async (
    request: LandUseChangeRequest
  ): Promise<LandUseChangeResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await apiClient.detectLandUseChange(request) as LandUseChangeResponse;
      setLandUseChanges(result);
      return result;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to detect land use changes';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Natural language query
  const queryNaturalLanguage = useCallback(async (
    query: string
  ): Promise<NLPQueryResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const request: NLPQueryRequest = { query };
      const result = await apiClient.queryNaturalLanguage(request) as NLPQueryResponse;
      setNlpResult(result);
      return result;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to process natural language query';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch trending predictions
  const fetchTrendingPredictions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await apiClient.getTrendingPredictions() as any;
      if (result && Array.isArray(result.predictions)) {
        setTrendingPredictions(result.predictions);
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to fetch trending predictions';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Clear all results
  const clearResults = useCallback(() => {
    setTrafficPrediction(null);
    setCrimeHotspots(null);
    setLandUseChanges(null);
    setNlpResult(null);
    setError(null);
  }, []);

  return {
    trafficPrediction,
    crimeHotspots,
    landUseChanges,
    nlpResult,
    trendingPredictions,
    isLoading,
    error,
    predictTraffic,
    analyzeCrimeHotspots,
    detectLandUseChange,
    queryNaturalLanguage,
    fetchTrendingPredictions,
    clearResults
  };
}
