/**
 * ComparisonCharts Component (Simplified)
 *
 * Side-by-side visualization of comparison results with simple CSS charts
 * Note: Uses CSS-based visualizations instead of recharts (package unavailable)
 */

import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { ComparisonResult, Dataset } from '../../../types/api-2026';

interface ComparisonChartsProps {
  result: ComparisonResult;
  datasets: Dataset[];
  metrics: string[];
}

const DATASET_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

const ComparisonCharts: React.FC<ComparisonChartsProps> = ({ result, datasets, metrics }) => {
  // Prepare data for bar chart comparison
  const barChartData = useMemo(() => {
    if (!result.metrics) return [];

    return metrics.map((metricId) => {
      const entry: any = { metric: metricId };
      datasets.forEach((dataset, index) => {
        const metricData = result.metrics[dataset.id]?.[metricId];
        entry[dataset.name] = metricData?.value || 0;
      });
      return entry;
    });
  }, [result, datasets, metrics]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const stats: any[] = [];

    datasets.forEach((dataset, index) => {
      const datasetMetrics = result.metrics[dataset.id] || {};
      const metricValues = Object.values(datasetMetrics).map((m: any) => m.value || 0);

      stats.push({
        dataset: dataset.name,
        color: DATASET_COLORS[index % DATASET_COLORS.length],
        total: metricValues.reduce((sum, v) => sum + v, 0),
        average: metricValues.length > 0 ? metricValues.reduce((sum, v) => sum + v, 0) / metricValues.length : 0,
        min: Math.min(...metricValues),
        max: Math.max(...metricValues),
      });
    });

    return stats;
  }, [result, datasets]);

  // Calculate differences between datasets
  const differences = useMemo(() => {
    if (datasets.length < 2) return [];

    const diffs: any[] = [];
    const baseDataset = datasets[0];

    for (let i = 1; i < datasets.length; i++) {
      const compareDataset = datasets[i];

      metrics.forEach((metricId) => {
        const baseValue = result.metrics[baseDataset.id]?.[metricId]?.value || 0;
        const compareValue = result.metrics[compareDataset.id]?.[metricId]?.value || 0;
        const percentDiff = baseValue !== 0 ? ((compareValue - baseValue) / baseValue) * 100 : 0;

        diffs.push({
          metric: metricId,
          base: baseDataset.name,
          compare: compareDataset.name,
          baseval: baseValue,
          compareval: compareValue,
          diff: percentDiff,
        });
      });
    }

    return diffs;
  }, [result, datasets, metrics]);

  if (!result.metrics || datasets.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No comparison data available. Select datasets and metrics to compare.
      </div>
    );
  }

  // Find max value for normalization
  const maxValue = Math.max(...barChartData.flatMap(row =>
    datasets.map(d => row[d.name] || 0)
  ));

  return (
    <div className="space-y-6">
      {/* Summary Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryStats.map((stat, index) => (
          <div
            key={index}
            className="p-4 rounded-lg border-2 dark:border-gray-700"
            style={{ borderColor: stat.color }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stat.color }} />
              <h4 className="font-semibold text-sm">{stat.dataset}</h4>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Average:</span>
                <span className="font-medium">{stat.average.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total:</span>
                <span className="font-medium">{stat.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Range:</span>
                <span className="font-medium text-xs">{stat.min.toFixed(0)} - {stat.max.toFixed(0)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Simple Bar Chart Comparison */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Metric Comparison</h3>
        <div className="space-y-4">
          {barChartData.map((row, rowIndex) => (
            <div key={rowIndex}>
              <div className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                {row.metric.replace(/_/g, ' ')}
              </div>
              <div className="space-y-2">
                {datasets.map((dataset, datasetIndex) => {
                  const value = row[dataset.name] || 0;
                  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
                  return (
                    <div key={datasetIndex} className="flex items-center gap-2">
                      <div className="w-24 text-xs text-gray-600 dark:text-gray-400 truncate">
                        {dataset.name}
                      </div>
                      <div className="flex-1 h-6 bg-gray-200 dark:bg-gray-700 rounded relative overflow-hidden">
                        <div
                          className="h-full rounded transition-all"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: DATASET_COLORS[datasetIndex % DATASET_COLORS.length],
                          }}
                        />
                      </div>
                      <div className="w-16 text-sm font-medium text-right">{value.toFixed(1)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <h3 className="text-lg font-semibold p-4 border-b dark:border-gray-700">Detailed Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                  Metric
                </th>
                {datasets.map((dataset, index) => (
                  <th
                    key={index}
                    className="px-4 py-3 text-left font-medium"
                    style={{ color: DATASET_COLORS[index % DATASET_COLORS.length] }}
                  >
                    {dataset.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              {metrics.map((metricId, metricIndex) => (
                <tr key={metricIndex} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                    {metricId.replace(/_/g, ' ')}
                  </td>
                  {datasets.map((dataset, datasetIndex) => {
                    const metricData = result.metrics[dataset.id]?.[metricId];
                    const value = metricData?.value || 0;
                    return (
                      <td key={datasetIndex} className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{value.toFixed(2)}</span>
                          {metricData?.unit && (
                            <span className="text-xs text-gray-500">{metricData.unit}</span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Percentage Differences */}
      {differences.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4">Percentage Differences</h3>
          <div className="space-y-3">
            {differences.map((diff, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded"
              >
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {diff.metric.replace(/_/g, ' ')}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {diff.compare} vs {diff.base}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {diff.diff > 0 ? (
                    <TrendingUp size={16} className="text-green-600" />
                  ) : diff.diff < 0 ? (
                    <TrendingDown size={16} className="text-red-600" />
                  ) : (
                    <Minus size={16} className="text-gray-400" />
                  )}
                  <span
                    className={`font-semibold ${
                      diff.diff > 0
                        ? 'text-green-600'
                        : diff.diff < 0
                        ? 'text-red-600'
                        : 'text-gray-600'
                    }`}
                  >
                    {diff.diff > 0 ? '+' : ''}
                    {diff.diff.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-md text-sm text-blue-800 dark:text-blue-200">
        ℹ️ Enhanced chart visualizations require recharts package (currently unavailable). Showing simplified comparison views.
      </div>
    </div>
  );
};

export default ComparisonCharts;
