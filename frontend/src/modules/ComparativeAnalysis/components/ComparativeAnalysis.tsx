/**
 * ComparativeAnalysis Component
 *
 * Main interface for side-by-side dataset comparison with metrics and visualizations
 */

import React, { useState } from 'react';
import { GitCompare, Play, Download, RotateCcw, AlertCircle, Settings } from 'lucide-react';
import { useComparison } from '../hooks/useComparison';
import DatasetSelector from './DatasetSelector';
import ComparisonCharts from './ComparisonCharts';

interface ComparativeAnalysisProps {
  onClose?: () => void;
}

const ComparativeAnalysis: React.FC<ComparativeAnalysisProps> = ({ onClose }) => {
  const {
    selectedDatasets,
    comparisonResult,
    availableMetrics,
    selectedMetrics,
    isLoading,
    error,
    actions,
  } = useComparison({ maxDatasets: 4 });

  const [showMetricsPanel, setShowMetricsPanel] = useState(false);

  const handleRunComparison = async () => {
    try {
      await actions.runComparison();
    } catch (err) {
      console.error('Comparison failed:', err);
    }
  };

  const handleExport = async (format: 'json' | 'csv' | 'pdf') => {
    try {
      await actions.exportComparison(format);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  return (
    <div className="comparative-analysis">
      {/* Header */}
      <div className="analysis-header bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GitCompare className="text-blue-500" size={24} />
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Comparative Analysis</h1>
              <p className="text-sm text-gray-600">Compare multiple datasets side-by-side</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRunComparison}
              disabled={selectedDatasets.length < 2 || isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              <Play size={16} />
              {isLoading ? 'Running...' : 'Run Comparison'}
            </button>
            <button
              onClick={() => setShowMetricsPanel(!showMetricsPanel)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <Settings size={16} />
              Metrics
            </button>
            {comparisonResult && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleExport('csv')}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  title="Export CSV"
                >
                  <Download size={16} />
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  title="Export PDF"
                >
                  <Download size={16} />
                </button>
              </div>
            )}
            <button
              onClick={actions.resetComparison}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              title="Reset"
            >
              <RotateCcw size={16} />
            </button>
            {onClose && (
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700 px-2" title="Close">
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mx-6 mt-4 flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle size={18} />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Content */}
      <div className="analysis-content flex h-[calc(100vh-120px)]">
        {/* Dataset Selection Sidebar */}
        <div className="w-80 border-r border-gray-200 bg-gray-50 overflow-y-auto">
          <DatasetSelector
            selectedDatasets={selectedDatasets}
            onAddDataset={actions.addDataset}
            onRemoveDataset={actions.removeDataset}
            maxDatasets={4}
          />
        </div>

        {/* Main Comparison View */}
        <div className="flex-1 overflow-y-auto">
          {comparisonResult ? (
            <ComparisonCharts
              result={comparisonResult}
              datasets={selectedDatasets}
              metrics={selectedMetrics}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <GitCompare size={64} className="text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mt-4">No Comparison Results</h3>
              <p className="text-gray-600 mt-2 max-w-md text-center">
                Select at least 2 datasets from the sidebar and click "Run Comparison" to see results
              </p>
              {selectedDatasets.length > 0 && (
                <p className="text-sm text-gray-500 mt-4">
                  {selectedDatasets.length} dataset{selectedDatasets.length > 1 ? 's' : ''} selected
                </p>
              )}
            </div>
          )}
        </div>

        {/* Metrics Panel */}
        {showMetricsPanel && (
          <div className="w-72 border-l border-gray-200 bg-white p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Select Metrics</h3>
              <button
                onClick={() => setShowMetricsPanel(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div className="space-y-2">
              {availableMetrics.map((metric) => (
                <label key={metric.id} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedMetrics.includes(metric.id)}
                    onChange={() => actions.toggleMetric(metric.id)}
                    className="w-4 h-4 text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{metric.name}</div>
                    <div className="text-xs text-gray-500">{metric.aggregation}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComparativeAnalysis;
