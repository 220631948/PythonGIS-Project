/**
 * DashboardCanvas Component
 *
 * Grid-based canvas for arranging dashboard widgets
 * Restored react-grid-layout for drag-and-drop functionality
 */

import React from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import DashboardWidget from './DashboardWidget';
import type { DashboardWidget as WidgetType, DashboardLayout, WidgetConfig } from '../../../types/api-2026';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardCanvasProps {
  widgets: WidgetType[];
  layout: DashboardLayout;
  previewMode?: boolean;
  onLayoutChange: (layout: DashboardLayout) => void;
  onWidgetUpdate: (widgetId: string, config: Partial<WidgetConfig>) => void;
  onWidgetRemove: (widgetId: string) => void;
  onWidgetDuplicate: (widgetId: string) => void;
}

const DashboardCanvas: React.FC<DashboardCanvasProps> = ({
  widgets,
  layout,
  previewMode = false,
  onLayoutChange,
  onWidgetUpdate,
  onWidgetRemove,
  onWidgetDuplicate,
}) => {
  const handleLayoutChange = (currentLayout: Layout[], allLayouts: DashboardLayout) => {
    // We should only trigger update if something actually changed
    // RGL triggers this on mount sometimes, but it's safe to propagate
    onLayoutChange(allLayouts);
  };

  if (widgets.length === 0) {
    return (
      <div className="canvas-empty-state">
        <div className="grid-pattern" />
        <div className="empty-content">
          <div className="empty-icon">📊</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-4">
            Your canvas is empty
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Click the <strong>+ Add Widget</strong> button to add your first widget
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`dashboard-canvas ${previewMode ? 'preview-mode' : 'edit-mode'}`}>
      <ResponsiveGridLayout
        className="layout"
        layouts={layout}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={80}
        onLayoutChange={handleLayoutChange}
        isDraggable={!previewMode}
        isResizable={!previewMode}
        margin={[16, 16]}
        containerPadding={[16, 16]}
        draggableHandle=".widget-drag-handle"
      >
        {widgets.map((widget) => (
          <div
            key={widget.id}
            data-grid={{
              i: widget.id,
              x: widget.position.x,
              y: widget.position.y,
              w: widget.position.w,
              h: widget.position.h,
              minW: 2,
              minH: 2,
            }}
            className="grid-item"
          >
            <DashboardWidget
              widget={widget}
              previewMode={previewMode}
              onUpdate={(config) => onWidgetUpdate(widget.id, config)}
              onRemove={() => onWidgetRemove(widget.id)}
              onDuplicate={() => onWidgetDuplicate(widget.id)}
            />
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
};

export default DashboardCanvas;
