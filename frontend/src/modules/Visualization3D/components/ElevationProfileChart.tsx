/**
 * ElevationProfileChart Component (Simplified)
 *
 * Interactive elevation profile visualization for terrain analysis
 * Note: Uses simple SVG visualization instead of recharts (package unavailable)
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  Mountain,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Activity,
  Info,
  Download,
  X,
} from 'lucide-react';
import { useMap3D } from '../hooks/useMap3D';
import type { ElevationProfile } from '../../../types/api-2026';
import '../../../styles/visualization-3d.css';

interface ElevationProfileChartProps {
  points: [number, number][];
  onClose?: () => void;
  showStats?: boolean;
  interactive?: boolean;
}

const ElevationProfileChart: React.FC<ElevationProfileChartProps> = ({
  points,
  onClose,
  showStats = true,
  interactive = true,
}) => {
  const { elevationProfile, isLoading, error, actions } = useMap3D();
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  const [chartType, setChartType] = useState<'line' | 'area'>('area');

  // Fetch elevation profile on mount
  React.useEffect(() => {
    if (points && points.length >= 2) {
      actions.getElevationProfile(points);
    }
  }, [points, actions]);

  const handlePointClick = useCallback((index: number) => {
    if (interactive) {
      setSelectedPoint(selectedPoint === index ? null : index);
    }
  }, [interactive, selectedPoint]);

  const handleDownload = useCallback(() => {
    if (!elevationProfile?.points) return;

    const csv = [
      'Distance(m),Elevation(m),Latitude,Longitude',
      ...elevationProfile.points.map((p: any) =>
        `${p.distance},${p.elevation},${p.lat},${p.lng}`
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `elevation-profile-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [elevationProfile]);

  const stats = useMemo(() => {
    if (!elevationProfile?.points || elevationProfile.points.length === 0) return null;

    const elevations = elevationProfile.points.map((p: any) => p.elevation);
    const maxElevation = Math.max(...elevations);
    const minElevation = Math.min(...elevations);
    const totalDistance = elevationProfile.distance;

    let totalAscent = 0;
    let totalDescent = 0;

    for (let i = 1; i < elevationProfile.points.length; i++) {
      const diff = elevationProfile.points[i].elevation - elevationProfile.points[i - 1].elevation;
      if (diff > 0) totalAscent += diff;
      else totalDescent += Math.abs(diff);
    }

    return {
      maxElevation: maxElevation.toFixed(1),
      minElevation: minElevation.toFixed(1),
      elevationGain: totalAscent.toFixed(1),
      elevationLoss: totalDescent.toFixed(1),
      totalDistance: totalDistance.toFixed(2),
      averageGrade: ((totalAscent - totalDescent) / totalDistance * 100).toFixed(2),
    };
  }, [elevationProfile]);

  if (isLoading) {
    return (
      <div className="elevation-profile-panel">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading elevation profile...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="elevation-profile-panel">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">Error: {error}</div>
        </div>
      </div>
    );
  }

  if (!elevationProfile?.points || elevationProfile.points.length === 0) {
    return (
      <div className="elevation-profile-panel">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">No elevation data available</div>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const maxElevation = Math.max(...elevationProfile.points.map((p: any) => p.elevation));
  const minElevation = Math.min(...elevationProfile.points.map((p: any) => p.elevation));
  const elevationRange = maxElevation - minElevation;

  // Calculate SVG path for elevation profile
  const width = 100;
  const height = 100;
  const pathPoints = elevationProfile.points.map((p: any, i: number) => {
    const x = (p.distance / elevationProfile.distance) * width;
    const y = height - ((p.elevation - minElevation) / elevationRange) * height;
    return `${x},${y}`;
  });

  const linePath = `M ${pathPoints.join(' L ')}`;
  const areaPath = `${linePath} L ${width},${height} L 0,${height} Z`;

  return (
    <div className="elevation-profile-panel bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Mountain className="text-blue-600 dark:text-blue-400" size={20} />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Elevation Profile</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setChartType(chartType === 'line' ? 'area' : 'line')}
            className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            {chartType === 'line' ? 'Area' : 'Line'}
          </button>
          <button
            onClick={handleDownload}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-1"
          >
            <Download size={14} />
            Export
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="p-4">
        {/* SVG Chart */}
        <div className="mb-4 bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full"
            style={{ height: '300px' }}
          >
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map((y) => (
              <line
                key={y}
                x1="0"
                y1={y}
                x2={width}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth="0.5"
                strokeDasharray="2,2"
              />
            ))}

            {/* Elevation profile */}
            {chartType === 'area' ? (
              <path
                d={areaPath}
                fill="url(#gradient)"
                stroke="#3b82f6"
                strokeWidth="2"
              />
            ) : (
              <path
                d={linePath}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
              />
            )}

            {/* Gradient definition */}
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
              </linearGradient>
            </defs>

            {/* Point markers */}
            {interactive && elevationProfile.points.map((p: any, i: number) => {
              const x = (p.distance / elevationProfile.distance) * width;
              const y = height - ((p.elevation - minElevation) / elevationRange) * height;
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r={selectedPoint === i ? "2" : "1"}
                  fill={selectedPoint === i ? "#ef4444" : "#3b82f6"}
                  onClick={() => handlePointClick(i)}
                  style={{ cursor: 'pointer' }}
                />
              );
            })}
          </svg>

          {/* Axis labels */}
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>0 km</span>
            <span>{(elevationProfile.distance / 1000).toFixed(2)} km</span>
          </div>
        </div>

        {/* Statistics */}
        {showStats && stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="stat-card">
              <div className="stat-icon bg-blue-100 dark:bg-blue-900/30">
                <Mountain size={16} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div className="stat-content">
                <div className="stat-label">Max Elevation</div>
                <div className="stat-value">{stats.maxElevation}m</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon bg-green-100 dark:bg-green-900/30">
                <TrendingDown size={16} className="text-green-600 dark:text-green-400" />
              </div>
              <div className="stat-content">
                <div className="stat-label">Min Elevation</div>
                <div className="stat-value">{stats.minElevation}m</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon bg-emerald-100 dark:bg-emerald-900/30">
                <TrendingUp size={16} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="stat-content">
                <div className="stat-label">Total Ascent</div>
                <div className="stat-value">{stats.elevationGain}m</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon bg-red-100 dark:bg-red-900/30">
                <TrendingDown size={16} className="text-red-600 dark:text-red-400" />
              </div>
              <div className="stat-content">
                <div className="stat-label">Total Descent</div>
                <div className="stat-value">{stats.elevationLoss}m</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon bg-purple-100 dark:bg-purple-900/30">
                <Activity size={16} className="text-purple-600 dark:text-purple-400" />
              </div>
              <div className="stat-content">
                <div className="stat-label">Distance</div>
                <div className="stat-value">{stats.totalDistance}km</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon bg-orange-100 dark:bg-orange-900/30">
                <ArrowUpRight size={16} className="text-orange-600 dark:text-orange-400" />
              </div>
              <div className="stat-content">
                <div className="stat-label">Avg Grade</div>
                <div className="stat-value">{stats.averageGrade}%</div>
              </div>
            </div>
          </div>
        )}

        {/* Selected point info */}
        {selectedPoint !== null && elevationProfile.points[selectedPoint] && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
            <div className="flex items-start gap-2">
              <Info size={16} className="text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">Point {selectedPoint + 1}</div>
                <div className="text-gray-600 dark:text-gray-400 space-y-1">
                  <div>Elevation: {elevationProfile.points[selectedPoint].elevation.toFixed(1)}m</div>
                  <div>Distance: {(elevationProfile.points[selectedPoint].distance / 1000).toFixed(2)}km</div>
                  <div>
                    Coordinates: {elevationProfile.points[selectedPoint].lat.toFixed(6)}, {elevationProfile.points[selectedPoint].lng.toFixed(6)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-md text-sm text-yellow-800 dark:text-yellow-200">
          ℹ️ Enhanced chart interactivity requires recharts package (currently unavailable). Showing simplified elevation profile.
        </div>
      </div>
    </div>
  );
};

export default ElevationProfileChart;
