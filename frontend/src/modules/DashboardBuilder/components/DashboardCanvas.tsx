/**
 * DashboardCanvas Component (Simplified)
 *
 * Grid-based canvas for arranging dashboard widgets
 * Note: This is a simplified version without drag-and-drop (react-grid-layout unavailable)
 * TODO: Restore react-grid-layout when package is available
 */

import React from 'react';
import DashboardWidget from './DashboardWidget';
import type { DashboardWidget as WidgetType, DashboardLayout, WidgetConfig } from '../../../types/api-2026';

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
  onWidgetUpdate,
  onWidgetRemove,
  onWidgetDuplicate,
}) => {
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
      <div className="simple-grid-layout">
        {widgets.map((widget) => (
          <div
            key={widget.id}
            className="grid-item"
            style={{
              gridColumn: `span ${Math.min(widget.position.w, 4)}`,
              minHeight: `${widget.position.h * 80}px`,
            }}
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
      </div>
      {!previewMode && (
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-md text-sm text-yellow-800 dark:text-yellow-200">
          ℹ️ Drag-and-drop functionality requires react-grid-layout package (currently unavailable). Widgets are displayed in a simple grid.
        </div>
      )}
    </div>
  );
};

export default DashboardCanvas;
