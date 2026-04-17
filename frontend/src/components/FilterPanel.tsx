import { useState, useEffect, useCallback } from 'react';
import { Filter, X, Plus, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import '../styles/FilterPanel.css';

/**
 * FilterPanel - Advanced attribute filtering and faceted search
 *
 * Features:
 * - Multiple filter conditions
 * - AND/OR logic
 * - Faceted counts
 * - Filter presets
 * - Real-time updates
 */

interface FilterOperator {
  label: string;
  types: string[];
}

const OPERATORS: Record<string, FilterOperator> = {
  eq: { label: 'equals', types: ['string', 'number', 'boolean'] },
  ne: { label: 'not equals', types: ['string', 'number', 'boolean'] },
  gt: { label: 'greater than', types: ['number', 'datetime'] },
  lt: { label: 'less than', types: ['number', 'datetime'] },
  gte: { label: 'at least', types: ['number', 'datetime'] },
  lte: { label: 'at most', types: ['number', 'datetime'] },
  contains: { label: 'contains', types: ['string'] },
  in: { label: 'is one of', types: ['string', 'number'] },
  between: { label: 'between', types: ['number', 'datetime'] },
  is_null: { label: 'is empty', types: ['string', 'number', 'datetime'] },
  is_not_null: { label: 'has value', types: ['string', 'number', 'datetime'] }
};

interface FilterCondition {
  id: number;
  field: string;
  operator: string;
  value: any;
}

interface FilterField {
  name: string;
  type: string;
  display_name: string;
  unique_count?: number;
  min?: number;
  max?: number;
  values?: any[];
}

interface FilterSchema {
  fields: FilterField[];
}

interface FilterPanelProps {
  dataset: string | null;
  onFilterChange: (filters: { conditions: Omit<FilterCondition, 'id'>[], logic: string }) => void;
  onClose?: () => void;
  isLoading?: boolean;
}

interface FacetValue {
  value: string | number;
  count: number;
}

interface FacetData {
  display_name: string;
  values: FacetValue[];
}

export default function FilterPanel({
  dataset,
  onFilterChange,
  onClose: _onClose,
  isLoading: _isLoading = false
}: FilterPanelProps) {
  const [schema, setSchema] = useState<FilterSchema | null>(null);
  const [filters, setFilters] = useState<FilterCondition[]>([]);
  const [logic, setLogic] = useState<string>('and');
  const [facets, setFacets] = useState<Record<string, FacetData>>({});
  const [isExpanded, setIsExpanded] = useState(true);
  const [loadingSchema, setLoadingSchema] = useState(false);
  void _onClose;
  void _isLoading;

  const loadSchema = useCallback(async () => {
    setLoadingSchema(true);
    try {
      const response = await fetch(`/api/filter/schema/${dataset}`);
      if (response.ok) {
        const data = await response.json();
        setSchema(data);
      }
    } catch (error) {
      console.error('Failed to load schema:', error);
    } finally {
      setLoadingSchema(false);
    }
  }, [dataset]);

  // Load schema for the dataset
  useEffect(() => {
    if (dataset) {
      loadSchema();
    }
  }, [dataset, loadSchema]);

  const loadFacets = useCallback(async () => {
    try {
      if (!schema) return;

      // Get categorical fields for facets
      const facetFields = schema.fields
        .filter(f => f.type === 'string' && f.unique_count && f.unique_count <= 50)
        .map(f => f.name)
        .slice(0, 5);

      if (facetFields.length === 0) return;

      const response = await fetch('/api/filter/facets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataset,
          facet_fields: facetFields,
          filters: filters.length > 0 ? filters : null
        })
      });

      if (response.ok) {
        const data = await response.json();
        setFacets(data.facets || {});
      }
    } catch (error) {
      console.error('Failed to load facets:', error);
    }
  }, [dataset, filters, schema]);

  // Load facets when filters change
  useEffect(() => {
    if (schema && schema.fields.length > 0) {
      loadFacets();
    }
  }, [filters, schema, loadFacets]);

  // Add a new filter
  const addFilter = () => {
    if (!schema || schema.fields.length === 0) return;

    const defaultField = schema.fields[0]!;
    setFilters([...filters, {
      id: Date.now(),
      field: defaultField.name,
      operator: 'eq',
      value: ''
    }]);
  };

  // Remove a filter
  const removeFilter = (id: number) => {
    setFilters(filters.filter(f => f.id !== id));
  };

  // Update a filter
  const updateFilter = (id: number, updates: Partial<FilterCondition>) => {
    setFilters(filters.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters([]);
  };

  // Apply filters
  const applyFilters = useCallback(() => {
    if (onFilterChange) {
      onFilterChange({
        conditions: filters.map(f => ({
          field: f.field,
          operator: f.operator,
          value: f.value
        })),
        logic
      });
    }
  }, [filters, logic, onFilterChange]);

  // Apply filters with debounce
  const debouncedFilters = useDebounce(filters, 300);
  const debouncedLogic = useDebounce(logic, 300);

  useEffect(() => {
    applyFilters();
  }, [debouncedFilters, debouncedLogic, applyFilters]);

  // Get available operators for a field type
  const getOperatorsForField = (fieldName: string) => {
    if (!schema) return [];
    const field = schema.fields.find(f => f.name === fieldName);
    if (!field) return Object.keys(OPERATORS);

    return Object.entries(OPERATORS)
      .filter(([, op]) => op.types.includes(field.type))
      .map(([key]) => key);
  };

  // Get field info
  const getFieldInfo = (fieldName: string) => {
    if (!schema) return null;
    return schema.fields.find(f => f.name === fieldName);
  };

  // Handle facet click (quick filter)
  const handleFacetClick = (fieldName: string, value: string | number) => {
    // Check if filter already exists
    const existing = filters.find(f => f.field === fieldName && f.value === value);
    if (existing) {
      removeFilter(existing.id);
    } else {
      setFilters([...filters, {
        id: Date.now(),
        field: fieldName,
        operator: 'eq',
        value
      }]);
    }
  };

  // Check if a facet value is active
  const isFacetActive = (fieldName: string, value: string | number) => {
    return filters.some(f => f.field === fieldName && f.value === value);
  };

  return (
    <div className="filter-panel">
      <div className="filter-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="header-title">
          <Filter size={16} />
          <span>Filters</span>
          {filters.length > 0 && (
            <span className="filter-count">{filters.length}</span>
          )}
        </div>
        <div className="header-actions">
          {filters.length > 0 && (
            <button
              className="clear-btn"
              onClick={(e) => { e.stopPropagation(); clearFilters(); }}
            >
              Clear
            </button>
          )}
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {isExpanded && (
        <div className="filter-content">
          {loadingSchema ? (
            <div className="loading-state">
              <RefreshCw className="spin" size={20} />
              <span>Loading fields...</span>
            </div>
          ) : !schema ? (
            <div className="empty-state">
              <span>Select a dataset to enable filtering</span>
            </div>
          ) : (
            <>
              {/* Logic selector */}
              {filters.length > 1 && (
                <div className="logic-selector">
                  <span>Match</span>
                  <select value={logic} onChange={(e) => setLogic(e.target.value)}>
                    <option value="and">All conditions (AND)</option>
                    <option value="or">Any condition (OR)</option>
                  </select>
                </div>
              )}

              {/* Active filters */}
              <div className="active-filters">
                {filters.map((filter, index) => (
                  <div key={filter.id} className="filter-row">
                    {index > 0 && (
                      <span className="logic-label">{logic.toUpperCase()}</span>
                    )}
                    <select
                      value={filter.field}
                      onChange={(e) => updateFilter(filter.id, {
                        field: e.target.value,
                        value: ''
                      })}
                      className="field-select"
                    >
                      {schema.fields.filter(f => f.name !== 'geometry').map(field => (
                        <option key={field.name} value={field.name}>
                          {field.display_name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={filter.operator}
                      onChange={(e) => updateFilter(filter.id, { operator: e.target.value })}
                      className="operator-select"
                    >
                      {getOperatorsForField(filter.field).map(op => (
                        <option key={op} value={op}>
                          {OPERATORS[op]?.label ?? op}
                        </option>
                      ))}
                    </select>
                    {!['is_null', 'is_not_null'].includes(filter.operator) && (
                      <FilterValueInput
                        field={getFieldInfo(filter.field)}
                        operator={filter.operator}
                        value={filter.value}
                        onChange={(value) => updateFilter(filter.id, { value })}
                      />
                    )}
                    <button
                      className="remove-btn"
                      onClick={() => removeFilter(filter.id)}
                      aria-label="Remove filter"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add filter button */}
              <button className="add-filter-btn" onClick={addFilter}>
                <Plus size={14} />
                <span>Add Filter</span>
              </button>

              {/* Facets */}
              {Object.keys(facets).length > 0 && (
                <div className="facets-section">
                  <div className="facets-header">
                    <span>Quick Filters</span>
                  </div>
                  {Object.entries(facets).map(([fieldName, facetData]) => (
                    <div key={fieldName} className="facet-group">
                      <div className="facet-title">{facetData.display_name}</div>
                      <div className="facet-values">
                        {facetData.values.slice(0, 8).map(item => (
                          <button
                            key={item.value}
                            className={`facet-chip ${isFacetActive(fieldName, item.value) ? 'active' : ''}`}
                            onClick={() => handleFacetClick(fieldName, item.value)}
                          >
                            <span className="facet-value">{item.value}</span>
                            <span className="facet-count">{item.count}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

interface FilterValueInputProps {
  field: FilterField | null | undefined;
  operator: string;
  value: any;
  onChange: (value: any) => void;
}

// Value input component based on field type
function FilterValueInput({ field, operator, value, onChange }: FilterValueInputProps) {
  if (!field) {
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="value-input"
        placeholder="Value"
      />
    );
  }

  // Dropdown for fields with predefined values
  if (field.values && field.values.length > 0) {
    if (operator === 'in') {
      // Multi-select for "in" operator
      return (
        <select
          multiple
          value={Array.isArray(value) ? value : []}
          onChange={(e) => {
            const selected = Array.from(e.target.selectedOptions, opt => opt.value);
            onChange(selected);
          }}
          className="value-input multi"
        >
          {field.values.map(v => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
      );
    }
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="value-input"
      >
        <option value="">Select...</option>
        {field.values.map(v => (
          <option key={v} value={v}>{v}</option>
        ))}
      </select>
    );
  }

  // Number input
  if (field.type === 'number') {
    if (operator === 'between') {
      const [min, max] = Array.isArray(value) ? value : ['', ''];
      return (
        <div className="between-inputs">
          <input
            type="number"
            value={min}
            onChange={(e) => onChange([e.target.value, max])}
            className="value-input"
            placeholder="Min"
          />
          <span>and</span>
          <input
            type="number"
            value={max}
            onChange={(e) => onChange([min, e.target.value])}
            className="value-input"
            placeholder="Max"
          />
        </div>
      );
    }
    return (
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="value-input"
        placeholder={field.min !== undefined ? `${field.min} - ${field.max}` : 'Value'}
      />
    );
  }

  // Date input
  if (field.type === 'datetime') {
    if (operator === 'between') {
      const [start, end] = Array.isArray(value) ? value : ['', ''];
      return (
        <div className="between-inputs">
          <input
            type="date"
            value={start}
            onChange={(e) => onChange([e.target.value, end])}
            className="value-input"
          />
          <span>and</span>
          <input
            type="date"
            value={end}
            onChange={(e) => onChange([start, e.target.value])}
            className="value-input"
          />
        </div>
      );
    }
    return (
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="value-input"
      />
    );
  }

  // Default text input
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="value-input"
      placeholder="Value"
    />
  );
}
