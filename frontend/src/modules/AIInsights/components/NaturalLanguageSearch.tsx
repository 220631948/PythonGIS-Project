/**
 * NaturalLanguageSearch Component
 *
 * AI-powered natural language interface for spatial queries
 * Converts plain English to structured spatial queries
 */

import React, { useState } from 'react';
import {
  Search,
  Sparkles,
  ArrowRight,
  Database,
  Filter,
  MessageSquare,
  Lightbulb,
  X
} from 'lucide-react';
import type { NLPQueryResponse } from '../../../types/api-2026';

interface NaturalLanguageSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onQuery: (query: string) => Promise<NLPQueryResponse>;
  onExecuteQuery?: (result: NLPQueryResponse) => void;
}

const EXAMPLE_QUERIES = [
  'Find affordable areas near parks with low crime',
  'Show me schools within 1km of train stations',
  'Areas with high green space and good transport',
  'Find commercial properties near the waterfront',
  'Show flood risk zones in residential areas'
];

export default function NaturalLanguageSearch({
  isOpen,
  onClose,
  onQuery,
  onExecuteQuery
}: NaturalLanguageSearchProps) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<NLPQueryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) {
      setError('Please enter a search query');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const nlpResult = await onQuery(query);
      setResult(nlpResult);
    } catch (err: any) {
      setError(err.message || 'Failed to process query');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExampleClick = (example: string) => {
    setQuery(example);
    setResult(null);
    setError(null);
  };

  const handleExecute = () => {
    if (result && onExecuteQuery) {
      onExecuteQuery(result);
      handleClose();
    }
  };

  const handleClose = () => {
    setQuery('');
    setResult(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="ai-panel-overlay" onClick={handleClose}>
      <div className="ai-panel-modal nlp-panel" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="panel-header">
          <h2>
            <Sparkles size={24} />
            Natural Language Search
          </h2>
          <button onClick={handleClose} className="close-btn" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="panel-content">
          {/* Search Form */}
          <form onSubmit={handleSubmit} className="nlp-search-form">
            <div className="search-input-wrapper">
              <Search size={20} className="search-icon" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Ask a question in plain English..."
                className="nlp-input"
                autoFocus
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="clear-btn"
                  aria-label="Clear"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="btn-primary"
            >
              {isLoading ? (
                <>
                  <span className="spinner-sm" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Search
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="error-banner">
              <span>{error}</span>
            </div>
          )}

          {/* Example Queries */}
          {!result && !isLoading && (
            <div className="examples-section">
              <div className="examples-header">
                <Lightbulb size={16} />
                <span>Try these examples:</span>
              </div>
              <div className="examples-list">
                {EXAMPLE_QUERIES.map((example, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleExampleClick(example)}
                    className="example-btn"
                  >
                    <MessageSquare size={14} />
                    {example}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="nlp-results">
              {/* Interpretation */}
              <div className="interpretation-card">
                <div className="card-header">
                  <MessageSquare size={18} />
                  <h3>Interpretation</h3>
                </div>
                <p className="interpretation-text">{result.interpretation}</p>
                <div className="confidence-bar">
                  <div className="confidence-label">
                    Confidence: {(result.confidence * 100).toFixed(0)}%
                  </div>
                  <div className="confidence-track">
                    <div
                      className="confidence-fill"
                      style={{ width: `${result.confidence * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Structured Query */}
              <div className="structured-query-card">
                <div className="card-header">
                  <Filter size={18} />
                  <h3>Structured Query</h3>
                </div>

                <div className="query-section">
                  <div className="query-label">Intent</div>
                  <div className="query-value intent-tag">
                    {result.structured_query.intent}
                  </div>
                </div>

                {Object.keys(result.structured_query.entities).length > 0 && (
                  <div className="query-section">
                    <div className="query-label">Entities</div>
                    <div className="entities-grid">
                      {Object.entries(result.structured_query.entities).map(([key, value]) => (
                        <div key={key} className="entity-item">
                          <span className="entity-key">{key}:</span>
                          <span className="entity-value">{JSON.stringify(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {Object.keys(result.structured_query.filters).length > 0 && (
                  <div className="query-section">
                    <div className="query-label">Filters</div>
                    <div className="filters-grid">
                      {Object.entries(result.structured_query.filters).map(([key, value]) => (
                        <div key={key} className="filter-chip">
                          <span className="filter-key">{key}</span>
                          <ArrowRight size={12} />
                          <span className="filter-value">{JSON.stringify(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Suggested Datasets */}
              {result.suggested_datasets.length > 0 && (
                <div className="datasets-card">
                  <div className="card-header">
                    <Database size={18} />
                    <h3>Suggested Datasets</h3>
                  </div>
                  <div className="datasets-list">
                    {result.suggested_datasets.map((dataset, idx) => (
                      <div key={idx} className="dataset-item">
                        <Database size={16} className="dataset-icon" />
                        <span className="dataset-name">{dataset}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="nlp-actions">
                <button
                  onClick={() => {
                    setResult(null);
                    setQuery('');
                  }}
                  className="btn-secondary"
                >
                  New Search
                </button>
                {onExecuteQuery && (
                  <button
                    onClick={handleExecute}
                    className="btn-primary"
                  >
                    <ArrowRight size={16} />
                    Execute Query
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Info Box */}
          {!result && !isLoading && (
            <div className="info-box">
              <Sparkles size={20} />
              <div className="info-content">
                <h4>How it works</h4>
                <p>
                  Our AI understands natural language queries and converts them into
                  structured spatial searches. Simply describe what you're looking for
                  in plain English, and we'll find it for you.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
