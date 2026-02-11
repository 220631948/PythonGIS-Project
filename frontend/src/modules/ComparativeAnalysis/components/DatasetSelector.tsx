/**
 * DatasetSelector Component
 *
 * Select and configure datasets for comparison
 */

import React, { useState, useEffect } from 'react';
import { Plus, X, Database, Search, Filter } from 'lucide-react';
import { apiClient } from '../../../lib/api';
import type { Dataset } from '../../../types/api-2026';

interface DatasetSelectorProps {
  selectedDatasets: Dataset[];
  onAddDataset: (dataset: Dataset) => void;
  onRemoveDataset: (datasetId: string) => void;
  maxDatasets: number;
}

const DATASET_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

const DatasetSelector: React.FC<DatasetSelectorProps> = ({
  selectedDatasets,
  onAddDataset,
  onRemoveDataset,
  maxDatasets,
}) => {
  const [availableDatasets, setAvailableDatasets] = useState<Dataset[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    loadAvailableDatasets();
  }, []);

  const loadAvailableDatasets = async () => {
    setIsLoading(true);
    try {
      const result = await apiClient.listDatasets();
      setAvailableDatasets(result.datasets || []);
    } catch (err) {
      console.error('Failed to load datasets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDatasets = availableDatasets.filter(
    (ds) =>
      !selectedDatasets.some((s) => s.id === ds.id) &&
      (searchQuery === '' || ds.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="dataset-selector p-4">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Selected Datasets ({selectedDatasets.length}/{maxDatasets})
        </h2>
      </div>

      {/* Selected Datasets */}
      <div className="space-y-2 mb-4">
        {selectedDatasets.map((dataset, index) => (
          <div
            key={dataset.id}
            className="p-3 bg-white border-2 rounded-lg"
            style={{ borderColor: DATASET_COLORS[index % DATASET_COLORS.length] }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: DATASET_COLORS[index % DATASET_COLORS.length] }}
                  />
                  <h3 className="text-sm font-medium text-gray-900 truncate">{dataset.name}</h3>
                </div>
                {dataset.description && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{dataset.description}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                    {dataset.type || 'Unknown'}
                  </span>
                  {dataset.recordCount && (
                    <span className="text-xs text-gray-500">{dataset.recordCount.toLocaleString()} records</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => onRemoveDataset(dataset.id)}
                className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                title="Remove dataset"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Dataset Button */}
      {selectedDatasets.length < maxDatasets && (
        <button
          onClick={() => setShowAddDialog(true)}
          className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          Add Dataset
        </button>
      )}

      {/* Add Dataset Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Add Dataset</h2>
                <button
                  onClick={() => setShowAddDialog(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
              <div className="mt-4 relative">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search datasets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                  <span className="ml-3 text-gray-600">Loading datasets...</span>
                </div>
              ) : filteredDatasets.length === 0 ? (
                <div className="text-center py-12">
                  <Database size={48} className="mx-auto text-gray-300" />
                  <p className="text-gray-600 mt-4">No datasets found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {filteredDatasets.map((dataset) => (
                    <button
                      key={dataset.id}
                      onClick={() => {
                        onAddDataset(dataset);
                        setShowAddDialog(false);
                        setSearchQuery('');
                      }}
                      className="p-4 border border-gray-200 rounded-lg text-left hover:border-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <Database size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900">{dataset.name}</h3>
                          {dataset.description && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{dataset.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                              {dataset.type || 'Unknown'}
                            </span>
                            {dataset.recordCount && (
                              <span className="text-xs text-gray-500">
                                {dataset.recordCount.toLocaleString()} records
                              </span>
                            )}
                            {dataset.lastUpdated && (
                              <span className="text-xs text-gray-400">
                                Updated {new Date(dataset.lastUpdated).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatasetSelector;
