/**
 * DashboardWidget Component (Simplified)
 *
 * Configurable widget wrapper with edit controls and content rendering
 * Note: Uses simple CSS visualizations instead of recharts (package unavailable)
 */

import React, { useState } from 'react';
import {
  Settings,
  Copy,
  Trash2,
  GripVertical,
  Maximize2,
  BarChart3,
  LineChart as LineChartIcon,
  PieChart,
  Map as MapIcon,
  Table,
  Activity,
  TrendingUp,
  Users,
  FileText,
  Image as ImageIcon,
  Clock,
} from 'lucide-react';
import type { DashboardWidget as WidgetType, WidgetConfig } from '../../../types/api-2026';

interface DashboardWidgetProps {
  widget: WidgetType;
  previewMode?: boolean;
  onUpdate: (config: Partial<WidgetConfig>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const DashboardWidget: React.FC<DashboardWidgetProps> = ({
  widget,
  previewMode = false,
  onUpdate,
  onRemove,
  onDuplicate,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Render widget content based on type
  const renderContent = () => {
    switch (widget.type) {
      case 'bar_chart':
        return renderBarChart();
      case 'line_chart':
        return renderLineChart();
      case 'pie_chart':
        return renderPieChart();
      case 'metric_card':
        return renderMetricCard();
      case 'trend_indicator':
        return renderTrendIndicator();
      case 'user_count':
        return renderUserCount();
      case 'data_table':
        return renderDataTable();
      case 'map_view':
        return renderMapView();
      case 'search_widget':
        return renderSearchWidget();
      case 'text_content':
        return renderTextContent();
      case 'image_widget':
        return renderImageWidget();
      case 'recent_activity':
        return renderRecentActivity();
      default:
        return renderPlaceholder();
    }
  };

  // Simple CSS Bar Chart
  const renderBarChart = () => {
    const data = [
      { name: 'Jan', value: 400, max: 1000 },
      { name: 'Feb', value: 300, max: 1000 },
      { name: 'Mar', value: 600, max: 1000 },
      { name: 'Apr', value: 800, max: 1000 },
      { name: 'May', value: 500, max: 1000 },
    ];

    return (
      <div className="p-4">
        <div className="flex items-end justify-around h-48 gap-2">
          {data.map((item, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-t relative" style={{ height: '100%' }}>
                <div
                  className="absolute bottom-0 w-full bg-blue-500 rounded-t transition-all"
                  style={{ height: `${(item.value / item.max) * 100}%` }}
                  title={`${item.name}: ${item.value}`}
                />
              </div>
              <div className="text-xs mt-2 text-gray-600 dark:text-gray-400">{item.name}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Simple CSS Line Chart
  const renderLineChart = () => {
    const data = [
      { name: 'Jan', value: 40 },
      { name: 'Feb', value: 30 },
      { name: 'Mar', value: 60 },
      { name: 'Apr', value: 80 },
      { name: 'May', value: 50 },
    ];

    const max = Math.max(...data.map(d => d.value));
    const points = data.map((d, i) => `${(i / (data.length - 1)) * 100},${100 - (d.value / max) * 100}`).join(' ');

    return (
      <div className="p-4">
        <svg viewBox="0 0 100 100" className="w-full h-48">
          <polyline
            points={points}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            className="drop-shadow-md"
          />
          {data.map((d, i) => (
            <circle
              key={i}
              cx={(i / (data.length - 1)) * 100}
              cy={100 - (d.value / max) * 100}
              r="2"
              fill="#3b82f6"
            />
          ))}
        </svg>
        <div className="flex justify-between mt-2">
          {data.map((item, i) => (
            <div key={i} className="text-xs text-gray-600 dark:text-gray-400">{item.name}</div>
          ))}
        </div>
      </div>
    );
  };

  // Simple CSS Pie Chart
  const renderPieChart = () => {
    const data = [
      { name: 'Category A', value: 400, color: COLORS[0] },
      { name: 'Category B', value: 300, color: COLORS[1] },
      { name: 'Category C', value: 300, color: COLORS[2] },
      { name: 'Category D', value: 200, color: COLORS[3] },
    ];

    const total = data.reduce((sum, d) => sum + d.value, 0);

    return (
      <div className="p-4 flex items-center justify-center">
        <div className="w-48 h-48 rounded-full overflow-hidden relative" style={{
          background: `conic-gradient(${data.map((d, i) => {
            const start = data.slice(0, i).reduce((sum, item) => sum + item.value, 0) / total * 360;
            const end = start + (d.value / total * 360);
            return `${d.color} ${start}deg ${end}deg`;
          }).join(', ')})`
        }}>
          <div className="absolute inset-8 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold">{total}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
          </div>
        </div>
        <div className="ml-6 space-y-2">
          {data.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }} />
              <span className="text-sm">{item.name}: {item.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderMetricCard = () => {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
        <BarChart3 size={48} className="text-blue-600 dark:text-blue-400 mb-2" />
        <div className="text-4xl font-bold text-gray-900 dark:text-gray-100">1,234</div>
        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{widget.config.title || 'Metric'}</div>
      </div>
    );
  };

  const renderTrendIndicator = () => {
    return (
      <div className="h-full flex items-center justify-between p-6">
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Trend</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">+12.5%</div>
          <div className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
            <TrendingUp size={14} />
            <span>vs last month</span>
          </div>
        </div>
        <Activity size={64} className="text-green-500 opacity-20" />
      </div>
    );
  };

  const renderUserCount = () => {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
        <Users size={48} className="text-purple-600 dark:text-purple-400 mb-2" />
        <div className="text-4xl font-bold text-gray-900 dark:text-gray-100">5,678</div>
        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Active Users</div>
      </div>
    );
  };

  const renderDataTable = () => {
    const rows = [
      { id: 1, name: 'Item A', value: 120, status: 'Active' },
      { id: 2, name: 'Item B', value: 85, status: 'Pending' },
      { id: 3, name: 'Item C', value: 200, status: 'Active' },
    ];

    return (
      <div className="overflow-auto h-full">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0">
            <tr>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Value</th>
              <th className="px-4 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t dark:border-gray-700">
                <td className="px-4 py-2">{row.name}</td>
                <td className="px-4 py-2">{row.value}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    row.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}>
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderMapView = () => {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
        <div className="text-center">
          <MapIcon size={48} className="text-gray-400 mx-auto mb-2" />
          <div className="text-gray-600 dark:text-gray-400">Map View</div>
          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">Configure data source</div>
        </div>
      </div>
    );
  };

  const renderSearchWidget = () => {
    return (
      <div className="p-4">
        <input
          type="text"
          placeholder="Search..."
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
        />
      </div>
    );
  };

  const renderTextContent = () => {
    return (
      <div className="p-4">
        <FileText size={24} className="text-gray-400 mb-2" />
        <p className="text-gray-700 dark:text-gray-300">
          {widget.config.content || 'Add your text content here...'}
        </p>
      </div>
    );
  };

  const renderImageWidget = () => {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
        <div className="text-center">
          <ImageIcon size={48} className="text-gray-400 mx-auto mb-2" />
          <div className="text-gray-600 dark:text-gray-400">Image Widget</div>
          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">Add image URL</div>
        </div>
      </div>
    );
  };

  const renderRecentActivity = () => {
    const activities = [
      { id: 1, text: 'User logged in', time: '2 minutes ago' },
      { id: 2, text: 'Data updated', time: '15 minutes ago' },
      { id: 3, text: 'Report generated', time: '1 hour ago' },
    ];

    return (
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock size={18} className="text-gray-500" />
          <h4 className="font-semibold">Recent Activity</h4>
        </div>
        <div className="space-y-2">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
              <div className="flex-1">
                <div className="text-gray-700 dark:text-gray-300">{activity.text}</div>
                <div className="text-xs text-gray-500 dark:text-gray-500">{activity.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderPlaceholder = () => {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-gray-400">
          <div className="text-2xl mb-2">📊</div>
          <div>Widget: {widget.type}</div>
        </div>
      </div>
    );
  };

  return (
    <div className={`dashboard-widget ${previewMode ? 'preview' : 'editable'}`}>
      {!previewMode && (
        <div className="widget-header">
          <div className="widget-drag-handle">
            <GripVertical size={16} className="text-gray-400" />
          </div>
          <div className="widget-title">{widget.config.title || 'Untitled Widget'}</div>
          <div className="widget-actions">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="widget-action-btn"
              title="Settings"
            >
              <Settings size={14} />
            </button>
            <button onClick={onDuplicate} className="widget-action-btn" title="Duplicate">
              <Copy size={14} />
            </button>
            <button onClick={() => setIsExpanded(true)} className="widget-action-btn" title="Expand">
              <Maximize2 size={14} />
            </button>
            <button onClick={onRemove} className="widget-action-btn text-red-600" title="Remove">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      )}

      <div className="widget-content">{renderContent()}</div>

      {showSettings && !previewMode && (
        <div className="widget-settings-panel">
          <div className="p-4 space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                value={widget.config.title || ''}
                onChange={(e) => onUpdate({ title: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-800 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Data Source</label>
              <input
                type="text"
                value={widget.config.dataSource || ''}
                onChange={(e) => onUpdate({ dataSource: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-800 dark:border-gray-600"
                placeholder="API endpoint or data source"
              />
            </div>
          </div>
        </div>
      )}

      {isExpanded && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full h-full max-w-6xl overflow-auto">
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
              <h3 className="font-semibold">{widget.config.title || 'Widget'}</h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                ✕
              </button>
            </div>
            <div className="p-4 h-[calc(100%-4rem)]">{renderContent()}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardWidget;
