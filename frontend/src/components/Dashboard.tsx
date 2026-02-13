import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Download,
  RefreshCw,
  Database,
  MapPin,
  Circle,
  Square,
  X
} from 'lucide-react';
import '../styles/Dashboard.css';

/**
 * Dashboard - Analytics dashboard with charts and metrics
 *
 * Features:
 * - Key metrics cards
 * - Bar chart for dataset comparison
 * - Pie chart for geometry distribution
 * - Export to CSV/PDF
 * - Real-time data refresh
 */

interface Metric {
  icon: string;
  value: number;
  label: string;
}

interface ChartItem {
  name: string;
  value: number;
  percentage?: string;
  startAngle?: number;
  endAngle?: number;
  color?: string;
}

interface DashboardSummary {
  total_datasets: number;
  total_features: number;
  categories: { [key: string]: number };
}

interface DashboardData {
  key_metrics: Metric[];
  charts: {
    features_by_dataset: ChartItem[];
    geometry_distribution: ChartItem[];
  };
  summary: DashboardSummary;
  generated_at: string;
}

interface DashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Dashboard({ isOpen, onClose }: DashboardProps) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedChart, setSelectedChart] = useState<'bar' | 'pie'>('bar');

  // Load dashboard data with retry logic
  const loadDashboardData = useCallback(async (retryCount = 0) => {
    const maxRetries = 3;
    const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 8000); // Exponential backoff

    setIsLoading(true);
    setError(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch('/api/reports/dashboard-data', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      } else if (response.status === 500 || response.status === 503) {
        // Server error - try fallback or retry
        if (retryCount < maxRetries) {
          console.warn(`Dashboard API returned ${response.status}, retrying in ${retryDelay}ms...`);
          setTimeout(() => loadDashboardData(retryCount + 1), retryDelay);
          return; // Don't clear loading state yet
        } else {
          // Final retry failed - use fallback
          console.warn('Dashboard data endpoint failed after retries, trying summary endpoint...');
          const summaryResponse = await fetch('/api/reports/summary');
          if (summaryResponse.ok) {
            const summaryData = await summaryResponse.json();
            setDashboardData({
              key_metrics: [],
              charts: { features_by_dataset: [], geometry_distribution: [] },
              summary: summaryData,
              generated_at: new Date().toISOString()
            });
          } else {
            throw new Error(`API unavailable after ${maxRetries} retries`);
          }
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (err: any) {
      console.error('Dashboard load error:', err);

      // Retry on network errors
      if (err.name === 'AbortError' && retryCount < maxRetries) {
        console.warn(`Request timeout, retrying in ${retryDelay}ms...`);
        setTimeout(() => loadDashboardData(retryCount + 1), retryDelay);
        return;
      }

      setError(err.message || 'Failed to load dashboard data');
      // Set empty but valid data structure
      setDashboardData({
        key_metrics: [],
        charts: { features_by_dataset: [], geometry_distribution: [] },
        summary: { total_datasets: 0, total_features: 0, categories: {} },
        generated_at: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadDashboardData();
    }
  }, [isOpen, loadDashboardData]);

  // Export summary to CSV
  const exportToCSV = () => {
    if (!dashboardData) return;

    const rows = [
      ['Dataset', 'Feature Count'],
      ...dashboardData.charts.features_by_dataset.map(d => [d.name, d.value])
    ];

    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'geohub-summary.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Get icon for metric
  const getMetricIcon = (icon: string) => {
    const icons: { [key: string]: React.ReactNode } = {
      database: <Database size={20} />,
      'map-pin': <MapPin size={20} />,
      circle: <Circle size={20} />,
      square: <Square size={20} />
    };
    return icons[icon] || <Database size={20} />;
  };

  if (!isOpen) return null;

  return (
    <div className="dashboard-overlay">
      <div className="dashboard-modal">
        <div className="dashboard-header">
          <div className="header-title">
            <BarChart3 size={24} />
            <h2>Analytics Dashboard</h2>
          </div>
          <div className="header-actions">
            <button
              className="action-btn"
              onClick={() => void loadDashboardData()}
              disabled={isLoading}
              title="Refresh data"
            >
              <RefreshCw size={18} className={isLoading ? 'spin' : ''} />
            </button>
            <button
              className="action-btn"
              onClick={exportToCSV}
              disabled={!dashboardData}
              title="Export to CSV"
            >
              <Download size={18} />
            </button>
            <button className="close-btn" onClick={onClose} aria-label="Close dashboard">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="dashboard-content">
          {isLoading ? (
            <div className="loading-state">
              <RefreshCw className="spin" size={32} />
              <span>Loading dashboard data...</span>
            </div>
          ) : error ? (
            <div className="error-state">
              <span>⚠️ {error}</span>
              <button onClick={() => void loadDashboardData()}>Retry</button>
            </div>
          ) : dashboardData ? (
            <>
              {/* Key Metrics */}
              <div className="metrics-grid">
                {dashboardData.key_metrics.map((metric, index) => (
                  <div key={index} className="metric-card">
                    <div className="metric-icon">
                      {getMetricIcon(metric.icon)}
                    </div>
                    <div className="metric-content">
                      <div className="metric-value">{metric.value.toLocaleString()}</div>
                      <div className="metric-label">{metric.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chart Controls */}
              <div className="chart-controls">
                <button
                  className={`chart-btn ${selectedChart === 'bar' ? 'active' : ''}`}
                  onClick={() => setSelectedChart('bar')}
                >
                  <BarChart3 size={16} />
                  <span>Features by Dataset</span>
                </button>
                <button
                  className={`chart-btn ${selectedChart === 'pie' ? 'active' : ''}`}
                  onClick={() => setSelectedChart('pie')}
                >
                  <PieChart size={16} />
                  <span>Geometry Types</span>
                </button>
              </div>

              {/* Charts */}
              <div className="chart-container">
                {selectedChart === 'bar' ? (
                  <BarChartComponent data={dashboardData.charts.features_by_dataset} />
                ) : (
                  <PieChartComponent data={dashboardData.charts.geometry_distribution} />
                )}
              </div>

              {/* Summary Stats */}
              <div className="summary-section">
                <h3>
                  <TrendingUp size={18} />
                  Summary Statistics
                </h3>
                <div className="summary-grid">
                  <div className="summary-item">
                    <span className="label">Total Datasets</span>
                    <span className="value">{dashboardData.summary.total_datasets}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Total Features</span>
                    <span className="value">{dashboardData.summary.total_features.toLocaleString()}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Geometry Types</span>
                    <span className="value">{Object.keys(dashboardData.summary.categories).length}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Last Updated</span>
                    <span className="value">
                      {new Date(dashboardData.generated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// Simple Bar Chart Component (using CSS)
interface ChartComponentProps {
  data: ChartItem[];
}

function BarChartComponent({ data }: ChartComponentProps) {
  if (!data || data.length === 0) {
    return <div className="no-data">No data available</div>;
  }

  const maxValue = Math.max(...data.map(d => d.value));
  const sortedData = [...data].sort((a, b) => b.value - a.value).slice(0, 10);

  return (
    <div className="bar-chart">
      <div className="chart-title">Features by Dataset (Top 10)</div>
      <div className="bars">
        {sortedData.map((item, index) => (
          <div key={index} className="bar-row">
            <div className="bar-label" title={item.name}>
              {item.name}
            </div>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{
                  width: `${(item.value / maxValue) * 100}%`,
                  backgroundColor: `hsl(${200 + index * 15}, 70%, 50%)`
                }}
              />
            </div>
            <div className="bar-value">{item.value.toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Simple Pie Chart Component (using SVG)
function PieChartComponent({ data }: ChartComponentProps) {
  if (!data || data.length === 0) {
    return <div className="no-data">No data available</div>;
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const colors = ['#3388ff', '#ff6b35', '#28a745', '#ffc107', '#dc3545', '#17a2b8'];

  // Calculate pie slices
  let currentAngle = 0;
  const slices = data.map((item, index) => {
    const angle = (item.value / total) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;
    return {
      ...item,
      startAngle,
      endAngle: currentAngle,
      color: colors[index % colors.length],
      percentage: ((item.value / total) * 100).toFixed(1)
    };
  });

  // Convert angle to SVG path coordinates
  const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => {
    const rad = (angle - 90) * Math.PI / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad)
    };
  };

  const describeArc = (cx: number, cy: number, r: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
    return [
      'M', cx, cy,
      'L', start.x, start.y,
      'A', r, r, 0, largeArcFlag, 0, end.x, end.y,
      'Z'
    ].join(' ');
  };

  return (
    <div className="pie-chart">
      <div className="chart-title">Geometry Type Distribution</div>
      <div className="pie-container">
        <svg viewBox="0 0 200 200" className="pie-svg">
          {slices.map((slice, index) => (
            <path
              key={index}
              d={describeArc(100, 100, 80, slice.startAngle, slice.endAngle)}
              fill={slice.color}
              className="pie-slice"
            >
              <title>{slice.name}: {slice.value} ({slice.percentage}%)</title>
            </path>
          ))}
        </svg>
        <div className="pie-legend">
          {slices.map((slice, index) => (
            <div key={index} className="legend-item">
              <span
                className="legend-color"
                style={{ backgroundColor: slice.color }}
              />
              <span className="legend-label">{slice.name}</span>
              <span className="legend-value">{slice.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
