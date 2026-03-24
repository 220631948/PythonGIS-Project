import React, { useState, useCallback } from 'react';
import {
  Target,
  MapPin,
  Layers,
  BarChart3,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Loader2,
  Download,
  Settings,
  LucideIcon
} from 'lucide-react';

// Suitability class colors and icons
interface SuitabilityConfigItem {
    color: string;
    icon: LucideIcon;
    description: string;
}

const SUITABILITY_CONFIG: Record<string, SuitabilityConfigItem> = {
  'Highly Suitable': { color: '#22c55e', icon: CheckCircle, description: 'Excellent for development' },
  'Suitable': { color: '#84cc16', icon: CheckCircle, description: 'Good for development with minor considerations' },
  'Marginal': { color: '#f59e0b', icon: AlertTriangle, description: 'Requires careful assessment' },
  'Unsuitable': { color: '#ef4444', icon: XCircle, description: 'Significant constraints exist' }
};

// Criterion display names and icons
interface CriterionConfigItem {
    name: string;
    icon: string;
}

const CRITERION_CONFIG: Record<string, CriterionConfigItem> = {
  flood_risk: { name: 'Flood Risk', icon: '🌊' },
  biodiversity: { name: 'Biodiversity', icon: '🌿' },
  wetlands: { name: 'Wetlands', icon: '💧' },
  protected_areas: { name: 'Protected Areas', icon: '🏞️' },
  zoning_compatible: { name: 'Zoning Compatibility', icon: '📋' },
  road_access: { name: 'Road Access', icon: '🛣️' },
  transport_access: { name: 'Transport Access', icon: '🚌' },
  utilities_access: { name: 'Utilities Access', icon: '⚡' },
  urban_edge: { name: 'Urban Edge', icon: '🏙️' }
};

interface ScoreBarProps {
    score: number;
    label?: string;
}

const ScoreBar: React.FC<ScoreBarProps> = ({ score, label }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#84cc16';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="score-bar-container">
      {label && <span className="score-bar-label">{label}</span>}
      <div className="score-bar">
        <div
          className="score-bar-fill"
          style={{
            width: `${score}%`,
            backgroundColor: getScoreColor(score)
          }}
        />
      </div>
      <span className="score-bar-value">{score}</span>
    </div>
  );
};

interface CriterionResult {
  criterion: string;
  score: number;
  weight: number;
  weighted_score: number;
  details: Record<string, any>;
  constraints: string[];
}

interface CriterionCardProps {
    result: CriterionResult;
    isExpanded: boolean;
    onToggle: () => void;
}

const CriterionCard: React.FC<CriterionCardProps> = ({ result, isExpanded, onToggle }) => {
  const config = CRITERION_CONFIG[result.criterion] || { name: result.criterion, icon: '📊' };
  const hasConstraints = result.constraints.length > 0;

  return (
    <div className={`criterion-card ${hasConstraints ? 'has-constraints' : ''}`}>
      <button className="criterion-header" onClick={onToggle}>
        <div className="criterion-title">
          <span className="criterion-icon">{config.icon}</span>
          <span className="criterion-name">{config.name}</span>
        </div>
        <div className="criterion-score">
          <ScoreBar score={result.score} />
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {isExpanded && (
        <div className="criterion-details">
          <div className="criterion-meta">
            <span>Weight: {(result.weight * 100).toFixed(0)}%</span>
            <span>Weighted Score: {result.weighted_score.toFixed(1)}</span>
          </div>

          {Object.entries(result.details).length > 0 && (
            <div className="criterion-detail-list">
              {Object.entries(result.details).map(([key, value]) => (
                <div key={key} className="detail-item">
                  <span className="detail-key">{key.replace(/_/g, ' ')}</span>
                  <span className="detail-value">
                    {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {hasConstraints && (
            <div className="criterion-constraints">
              <h5><AlertTriangle size={14} /> Constraints</h5>
              <ul>
                {result.constraints.map((constraint, i) => (
                  <li key={i}>{constraint}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface Location {
  lat: number;
  lng: number;
}

interface AnalysisResult {
  location: Location;
  overall_score: number;
  suitability_class: string;
  criteria_results: CriterionResult[];
  constraints_violated: string[];
  recommendations: string[];
}

interface SiteSuitabilityPanelProps {
  location: Location | null;
  onAnalyze?: (data: AnalysisResult) => void;
  onClose?: () => void;
}

const SiteSuitabilityPanel: React.FC<SiteSuitabilityPanelProps> = ({ location, onAnalyze, onClose }) => {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [developmentType, setDevelopmentType] = useState('residential');
  const [expandedCriteria, setExpandedCriteria] = useState<Set<string>>(new Set());
  const [showWeights, setShowWeights] = useState(false);
  const [customWeights, setCustomWeights] = useState<Record<string, number>>({});

  const runAnalysis = useCallback(async () => {
    if (!location) return;

    setLoading(true);
    setError(null);

    try {
      let url = `/api/suitability/analyze?lat=${location.lat}&lng=${location.lng}&development_type=${developmentType}`;

      if (Object.keys(customWeights).length > 0) {
        url += `&weights=${encodeURIComponent(JSON.stringify(customWeights))}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Analysis failed');
      }

      setResult(data);
      if (onAnalyze) onAnalyze(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [location, developmentType, customWeights, onAnalyze]);

  const toggleCriterion = (criterion: string) => {
    setExpandedCriteria(prev => {
      const next = new Set(prev);
      if (next.has(criterion)) {
        next.delete(criterion);
      } else {
        next.add(criterion);
      }
      return next;
    });
  };

  const exportReport = () => {
    if (!result) return;

    const report = {
      title: 'Site Suitability Analysis Report',
      generated: new Date().toISOString(),
      location: result.location,
      developmentType,
      overallScore: result.overall_score,
      suitabilityClass: result.suitability_class,
      criteria: result.criteria_results,
      constraints: result.constraints_violated,
      recommendations: result.recommendations
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `suitability-report-${Date.now()}.json`;
    a.click();
  };

  if (!location) {
    return (
      <div className="suitability-panel empty">
        <Target size={48} />
        <h3>Site Suitability Analysis</h3>
        <p>Click on the map to analyze a location for development suitability.</p>
        <div className="analysis-steps">
          <div className="step">
            <span className="step-number">1</span>
            <span>Click on the map to select a site</span>
          </div>
          <div className="step">
            <span className="step-number">2</span>
            <span>Choose development type</span>
          </div>
          <div className="step">
            <span className="step-number">3</span>
            <span>Run analysis to see suitability score</span>
          </div>
        </div>
      </div>
    );
  }

  const suitabilityConfig = result ? SUITABILITY_CONFIG[result.suitability_class] : null;
  const SuitabilityIcon = suitabilityConfig?.icon || Target;

  return (
    <div className="suitability-panel">
      <div className="suitability-header">
        <h3>
          <Target size={18} />
          Site Suitability Analysis
        </h3>
        {onClose && (
          <button className="close-btn" onClick={onClose} aria-label="Close Site Suitability panel">×</button>
        )}
      </div>

      <div className="location-info">
        <MapPin size={16} />
        <span>
          {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
        </span>
      </div>

      <div className="analysis-controls">
        <div className="control-group">
          <label>Development Type</label>
          <select
            value={developmentType}
            onChange={(e) => setDevelopmentType(e.target.value)}
          >
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
            <option value="industrial">Industrial</option>
            <option value="mixed_use">Mixed Use</option>
          </select>
        </div>

        <button
          className="toggle-weights"
          onClick={() => setShowWeights(!showWeights)}
        >
          <Settings size={14} />
          {showWeights ? 'Hide' : 'Adjust'} Weights
        </button>
      </div>

      {showWeights && (
        <div className="weights-panel">
          <h4>Criteria Weights</h4>
          <p className="weights-note">Adjust importance of each criterion (0-1)</p>
          {Object.entries(CRITERION_CONFIG).map(([key, config]) => (
            <div key={key} className="weight-slider">
              <label>{config.icon} {config.name}</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={customWeights[key] ?? 0.1}
                onChange={(e) => setCustomWeights(prev => ({
                  ...prev,
                  [key]: parseFloat(e.target.value)
                }))}
              />
              <span>{(customWeights[key] ?? 0.1).toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      <button
        className="analyze-btn"
        onClick={runAnalysis}
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 size={16} className="spinning" />
            Analyzing...
          </>
        ) : (
          <>
            <BarChart3 size={16} />
            Analyze Site
          </>
        )}
      </button>

      {error && (
        <div className="error-message">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {result && (
        <div className="suitability-results">
          <div
            className="overall-score-card"
            style={{ borderColor: suitabilityConfig?.color }}
          >
            <div className="score-circle" style={{ backgroundColor: suitabilityConfig?.color }}>
              <span className="score-value">{result.overall_score}</span>
              <span className="score-label">Score</span>
            </div>
            <div className="score-info">
              <div className="suitability-class" style={{ color: suitabilityConfig?.color }}>
                <SuitabilityIcon size={20} />
                {result.suitability_class}
              </div>
              <p className="suitability-description">
                {suitabilityConfig?.description}
              </p>
            </div>
          </div>

          {result.constraints_violated.length > 0 && (
            <div className="constraints-warning">
              <h4><AlertTriangle size={16} /> Critical Constraints</h4>
              <ul>
                {result.constraints_violated.map((constraint, i) => (
                  <li key={i}>{constraint}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="criteria-section">
            <h4>
              <Layers size={16} />
              Criteria Breakdown
            </h4>
            <div className="criteria-list">
              {result.criteria_results.map((criterion) => (
                <CriterionCard
                  key={criterion.criterion}
                  result={criterion}
                  isExpanded={expandedCriteria.has(criterion.criterion)}
                  onToggle={() => toggleCriterion(criterion.criterion)}
                />
              ))}
            </div>
          </div>

          {result.recommendations.length > 0 && (
            <div className="recommendations-section">
              <h4><Info size={16} /> Recommendations</h4>
              <ul>
                {result.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}

          <button className="export-btn" onClick={exportReport}>
            <Download size={16} />
            Export Report
          </button>
        </div>
      )}
    </div>
  );
};

export default SiteSuitabilityPanel;
