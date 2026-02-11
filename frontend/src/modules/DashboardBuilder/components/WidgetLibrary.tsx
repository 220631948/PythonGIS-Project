/**
 * WidgetLibrary Component
 *
 * Catalog of available widgets that can be added to dashboards
 */

import React, { useState } from 'react';
import {
  BarChart3,
  LineChart as LineChartIcon,
  PieChart,
  Map as MapIcon,
  Table,
  Activity,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  FileText,
  Image,
  Clock,
  Search,
} from 'lucide-react';
import type { WidgetConfig } from '../../../types/api-2026';

interface WidgetLibraryProps {
  onAddWidget: (widgetType: string, config: WidgetConfig) => void;
}

interface WidgetTemplate {
  id: string;
  type: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  category: 'chart' | 'map' | 'metric' | 'data' | 'content';
  defaultConfig: WidgetConfig;
}

const WIDGET_TEMPLATES: WidgetTemplate[] = [
  // Chart Widgets
  {
    id: 'bar-chart',
    type: 'bar_chart',
    name: 'Bar Chart',
    description: 'Display data with vertical or horizontal bars',
    icon: BarChart3,
    category: 'chart',
    defaultConfig: {
      title: 'Bar Chart',
      dataSource: '',
      xAxis: '',
      yAxis: '',
      defaultWidth: 6,
      defaultHeight: 4,
    },
  },
  {
    id: 'line-chart',
    type: 'line_chart',
    name: 'Line Chart',
    description: 'Show trends over time with lines',
    icon: LineChartIcon,
    category: 'chart',
    defaultConfig: {
      title: 'Line Chart',
      dataSource: '',
      xAxis: '',
      yAxis: '',
      defaultWidth: 6,
      defaultHeight: 4,
    },
  },
  {
    id: 'pie-chart',
    type: 'pie_chart',
    name: 'Pie Chart',
    description: 'Show proportions with circular segments',
    icon: PieChart,
    category: 'chart',
    defaultConfig: {
      title: 'Pie Chart',
      dataSource: '',
      labelField: '',
      valueField: '',
      defaultWidth: 4,
      defaultHeight: 4,
    },
  },

  // Map Widgets
  {
    id: 'map-view',
    type: 'map_view',
    name: 'Map View',
    description: 'Interactive geographic map with layers',
    icon: MapIcon,
    category: 'map',
    defaultConfig: {
      title: 'Map',
      center: [-33.9249, 18.4241],
      zoom: 12,
      layers: [],
      defaultWidth: 8,
      defaultHeight: 6,
    },
  },

  // Metric Widgets
  {
    id: 'metric-card',
    type: 'metric_card',
    name: 'Metric Card',
    description: 'Display a single key metric',
    icon: Activity,
    category: 'metric',
    defaultConfig: {
      title: 'Metric',
      dataSource: '',
      metric: '',
      format: 'number',
      trend: true,
      defaultWidth: 3,
      defaultHeight: 2,
    },
  },
  {
    id: 'trend-indicator',
    type: 'trend_indicator',
    name: 'Trend Indicator',
    description: 'Show metric with trend visualization',
    icon: TrendingUp,
    category: 'metric',
    defaultConfig: {
      title: 'Trend',
      dataSource: '',
      metric: '',
      comparisonPeriod: 'previous_month',
      defaultWidth: 4,
      defaultHeight: 2,
    },
  },
  {
    id: 'user-count',
    type: 'user_count',
    name: 'User Count',
    description: 'Display total users or active users',
    icon: Users,
    category: 'metric',
    defaultConfig: {
      title: 'Users',
      dataSource: '',
      countType: 'total',
      defaultWidth: 3,
      defaultHeight: 2,
    },
  },

  // Data Widgets
  {
    id: 'data-table',
    type: 'data_table',
    name: 'Data Table',
    description: 'Tabular data with sorting and filtering',
    icon: Table,
    category: 'data',
    defaultConfig: {
      title: 'Data Table',
      dataSource: '',
      columns: [],
      pagination: true,
      pageSize: 10,
      defaultWidth: 8,
      defaultHeight: 6,
    },
  },
  {
    id: 'search-widget',
    type: 'search_widget',
    name: 'Search',
    description: 'Search and filter data',
    icon: Search,
    category: 'data',
    defaultConfig: {
      title: 'Search',
      dataSource: '',
      searchFields: [],
      defaultWidth: 6,
      defaultHeight: 2,
    },
  },

  // Content Widgets
  {
    id: 'text-content',
    type: 'text_content',
    name: 'Text Content',
    description: 'Rich text content block',
    icon: FileText,
    category: 'content',
    defaultConfig: {
      title: 'Text',
      content: '',
      defaultWidth: 6,
      defaultHeight: 3,
    },
  },
  {
    id: 'image-widget',
    type: 'image_widget',
    name: 'Image',
    description: 'Display an image',
    icon: Image,
    category: 'content',
    defaultConfig: {
      title: 'Image',
      imageUrl: '',
      altText: '',
      defaultWidth: 4,
      defaultHeight: 4,
    },
  },
  {
    id: 'recent-activity',
    type: 'recent_activity',
    name: 'Recent Activity',
    description: 'Timeline of recent events',
    icon: Clock,
    category: 'content',
    defaultConfig: {
      title: 'Recent Activity',
      dataSource: '',
      limit: 10,
      defaultWidth: 4,
      defaultHeight: 6,
    },
  },
];

const CATEGORIES = [
  { id: 'all', name: 'All Widgets', icon: BarChart3 },
  { id: 'chart', name: 'Charts', icon: BarChart3 },
  { id: 'map', name: 'Maps', icon: MapIcon },
  { id: 'metric', name: 'Metrics', icon: Activity },
  { id: 'data', name: 'Data', icon: Table },
  { id: 'content', name: 'Content', icon: FileText },
];

const WidgetLibrary: React.FC<WidgetLibraryProps> = ({ onAddWidget }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredWidgets = WIDGET_TEMPLATES.filter((widget) => {
    const matchesCategory = selectedCategory === 'all' || widget.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      widget.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      widget.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="widget-library">
      <div className="library-header">
        <h2 className="text-lg font-semibold text-gray-900">Widget Library</h2>
        <p className="text-sm text-gray-600 mt-1">
          Drag widgets onto the canvas to add them
        </p>
      </div>

      {/* Search */}
      <div className="library-search">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          placeholder="Search widgets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Categories */}
      <div className="library-categories">
        {CATEGORIES.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
          >
            <category.icon size={16} />
            <span>{category.name}</span>
          </button>
        ))}
      </div>

      {/* Widget Grid */}
      <div className="widget-grid">
        {filteredWidgets.length === 0 ? (
          <div className="empty-state-small">
            <p className="text-sm text-gray-500">No widgets found</p>
          </div>
        ) : (
          filteredWidgets.map((widget) => (
            <button
              key={widget.id}
              onClick={() => onAddWidget(widget.type, widget.defaultConfig)}
              className="widget-card"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('widgetType', widget.type);
                e.dataTransfer.setData('widgetConfig', JSON.stringify(widget.defaultConfig));
              }}
            >
              <div className="widget-card-icon">
                <widget.icon size={24} />
              </div>
              <div className="widget-card-content">
                <h3 className="widget-card-title">{widget.name}</h3>
                <p className="widget-card-description">{widget.description}</p>
              </div>
              <div className="widget-card-size">
                {widget.defaultConfig.defaultWidth}×{widget.defaultConfig.defaultHeight}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default WidgetLibrary;
