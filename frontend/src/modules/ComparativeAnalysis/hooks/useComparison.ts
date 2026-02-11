/**
 * useComparison Hook
 *
 * Manages comparative analysis state for side-by-side dataset comparison
 */

import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '../../../lib/api';
import type {
  ComparisonRequest,
  ComparisonResult,
  Dataset,
  ComparisonMetric,
} from '../../../types/api-2026';

interface UseComparisonOptions {
  maxDatasets?: number;
}

interface UseComparisonReturn {
  selectedDatasets: Dataset[];
  comparisonResult: ComparisonResult | null;
  availableMetrics: ComparisonMetric[];
  selectedMetrics: string[];
  filters: Record<string, any>;
  isLoading: boolean;
  error: string | null;
  actions: {
    addDataset: (dataset: Dataset) => void;
    removeDataset: (datasetId: string) => void;
    updateDataset: (datasetId: string, updates: Partial<Dataset>) => void;
    toggleMetric: (metricId: string) => void;
    setMetrics: (metrics: string[]) => void;
    updateFilters: (filters: Record<string, any>) => void;
    runComparison: () => Promise<ComparisonResult>;
    exportComparison: (format: 'json' | 'csv' | 'pdf') => void;
    resetComparison: () => void;
  };
}

const DEFAULT_METRICS: ComparisonMetric[] = [
  { id: 'total_count', name: 'Total Count', type: 'numeric', aggregation: 'sum' },
  { id: 'average_value', name: 'Average Value', type: 'numeric', aggregation: 'avg' },
  { id: 'median_value', name: 'Median Value', type: 'numeric', aggregation: 'median' },
  { id: 'min_value', name: 'Minimum Value', type: 'numeric', aggregation: 'min' },
  { id: 'max_value', name: 'Maximum Value', type: 'numeric', aggregation: 'max' },
  { id: 'std_deviation', name: 'Std Deviation', type: 'numeric', aggregation: 'std' },
];

export function useComparison(options: UseComparisonOptions = {}): UseComparisonReturn {
  const { maxDatasets = 4 } = options;

  const [selectedDatasets, setSelectedDatasets] = useState<Dataset[]>([]);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [availableMetrics, setAvailableMetrics] = useState<ComparisonMetric[]>(DEFAULT_METRICS);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    'total_count',
    'average_value',
  ]);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update available metrics when datasets change
  useEffect(() => {
    if (selectedDatasets.length > 0) {
      // In a real implementation, fetch available metrics based on selected datasets
      setAvailableMetrics(DEFAULT_METRICS);
    }
  }, [selectedDatasets]);

  const addDataset = useCallback(
    (dataset: Dataset) => {
      if (selectedDatasets.length >= maxDatasets) {
        setError(`Maximum ${maxDatasets} datasets can be compared`);
        return;
      }

      if (selectedDatasets.some((d) => d.id === dataset.id)) {
        setError('Dataset already added');
        return;
      }

      setSelectedDatasets((prev) => [...prev, dataset]);
      setError(null);
    },
    [selectedDatasets, maxDatasets]
  );

  const removeDataset = useCallback((datasetId: string) => {
    setSelectedDatasets((prev) => prev.filter((d) => d.id !== datasetId));
    setComparisonResult(null);
  }, []);

  const updateDataset = useCallback((datasetId: string, updates: Partial<Dataset>) => {
    setSelectedDatasets((prev) =>
      prev.map((d) => (d.id === datasetId ? { ...d, ...updates } : d))
    );
  }, []);

  const toggleMetric = useCallback((metricId: string) => {
    setSelectedMetrics((prev) =>
      prev.includes(metricId)
        ? prev.filter((m) => m !== metricId)
        : [...prev, metricId]
    );
  }, []);

  const updateFilters = useCallback((newFilters: Record<string, any>) => {
    setFilters(newFilters);
    setComparisonResult(null);
  }, []);

  const runComparison = useCallback(async (): Promise<ComparisonResult> => {
    if (selectedDatasets.length < 2) {
      throw new Error('At least 2 datasets are required for comparison');
    }

    if (selectedMetrics.length === 0) {
      throw new Error('At least 1 metric must be selected');
    }

    setIsLoading(true);
    setError(null);

    try {
      const request: ComparisonRequest = {
        datasets: selectedDatasets.map((d) => ({
          id: d.id,
          name: d.name,
          filters: d.filters || {},
        })),
        metrics: selectedMetrics,
        global_filters: filters,
      };

      const result = await apiClient.compareDatasets(request);
      setComparisonResult(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to run comparison';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [selectedDatasets, selectedMetrics, filters]);

  const exportComparison = useCallback(
    async (format: 'json' | 'csv' | 'pdf') => {
      if (!comparisonResult) {
        throw new Error('No comparison result to export');
      }

      try {
        const blob = await apiClient.exportComparison(comparisonResult.id, format);

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `comparison-${Date.now()}.${format}`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to export comparison';
        setError(message);
        throw err;
      }
    },
    [comparisonResult]
  );

  const resetComparison = useCallback(() => {
    setSelectedDatasets([]);
    setComparisonResult(null);
    setSelectedMetrics(['total_count', 'average_value']);
    setFilters({});
    setError(null);
  }, []);

  return {
    selectedDatasets,
    comparisonResult,
    availableMetrics,
    selectedMetrics,
    filters,
    isLoading,
    error,
    actions: {
      addDataset,
      removeDataset,
      updateDataset,
      toggleMetric,
      setMetrics: setSelectedMetrics,
      updateFilters,
      runComparison,
      exportComparison,
      resetComparison,
    },
  };
}
