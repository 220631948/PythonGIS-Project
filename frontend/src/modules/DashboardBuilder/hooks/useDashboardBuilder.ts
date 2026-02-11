/**
 * useDashboardBuilder Hook
 *
 * Manages dashboard builder state, widget configurations, and layouts
 */

import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '../../../lib/api';
import type {
  Dashboard,
  DashboardWidget,
  WidgetConfig,
  DashboardLayout,
} from '../../../types/api-2026';

interface UseDashboardBuilderOptions {
  dashboardId?: string;
  autoSave?: boolean;
  autoSaveDelay?: number;
}

interface UseDashboardBuilderReturn {
  dashboard: Dashboard | null;
  widgets: DashboardWidget[];
  layout: DashboardLayout;
  savedDashboards: Dashboard[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  actions: {
    createDashboard: (name: string, description?: string) => Promise<Dashboard>;
    loadDashboard: (id: string) => Promise<Dashboard>;
    saveDashboard: () => Promise<void>;
    deleteDashboard: (id: string) => Promise<void>;
    addWidget: (widgetType: string, config: WidgetConfig) => void;
    updateWidget: (widgetId: string, config: Partial<WidgetConfig>) => void;
    removeWidget: (widgetId: string) => void;
    updateLayout: (newLayout: DashboardLayout) => void;
    duplicateWidget: (widgetId: string) => void;
    exportDashboard: () => void;
    importDashboard: (data: string) => void;
    listDashboards: () => Promise<Dashboard[]>;
  };
  hasUnsavedChanges: boolean;
}

const DEFAULT_LAYOUT: DashboardLayout = {
  lg: [],
  md: [],
  sm: [],
  xs: [],
};

export function useDashboardBuilder(options: UseDashboardBuilderOptions = {}): UseDashboardBuilderReturn {
  const { dashboardId, autoSave = false, autoSaveDelay = 2000 } = options;

  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [layout, setLayout] = useState<DashboardLayout>(DEFAULT_LAYOUT);
  const [savedDashboards, setSavedDashboards] = useState<Dashboard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  // Load dashboard on mount
  useEffect(() => {
    if (dashboardId) {
      loadDashboard(dashboardId);
    }
  }, [dashboardId]);

  // Auto-save functionality
  useEffect(() => {
    if (autoSave && hasUnsavedChanges && dashboard) {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }

      const timeout = setTimeout(() => {
        saveDashboard();
      }, autoSaveDelay);

      setAutoSaveTimeout(timeout);

      return () => {
        if (timeout) clearTimeout(timeout);
      };
    }
  }, [autoSave, hasUnsavedChanges, dashboard, widgets, layout, autoSaveDelay]);

  const createDashboard = useCallback(async (name: string, description?: string): Promise<Dashboard> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await apiClient.createDashboard({
        name,
        description,
        widgets: [],
        layout: DEFAULT_LAYOUT,
        settings: {},
      });

      setDashboard(result);
      setWidgets([]);
      setLayout(DEFAULT_LAYOUT);
      setHasUnsavedChanges(false);

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create dashboard';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadDashboard = useCallback(async (id: string): Promise<Dashboard> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await apiClient.getDashboard(id);

      setDashboard(result);
      setWidgets(result.widgets || []);
      setLayout(result.layout || DEFAULT_LAYOUT);
      setHasUnsavedChanges(false);

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load dashboard';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveDashboard = useCallback(async (): Promise<void> => {
    if (!dashboard) {
      throw new Error('No dashboard to save');
    }

    setIsSaving(true);
    setError(null);

    try {
      await apiClient.updateDashboard(dashboard.id, {
        widgets,
        layout,
        updated_at: new Date().toISOString(),
      });

      setHasUnsavedChanges(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save dashboard';
      setError(message);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [dashboard, widgets, layout]);

  const deleteDashboard = useCallback(async (id: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await apiClient.deleteDashboard(id);

      if (dashboard?.id === id) {
        setDashboard(null);
        setWidgets([]);
        setLayout(DEFAULT_LAYOUT);
      }

      // Refresh dashboard list
      await listDashboards();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete dashboard';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [dashboard]);

  const addWidget = useCallback((widgetType: string, config: WidgetConfig) => {
    const newWidget: DashboardWidget = {
      id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: widgetType,
      config,
      position: {
        x: 0,
        y: Infinity, // Will be placed at the bottom
        w: config.defaultWidth || 4,
        h: config.defaultHeight || 4,
      },
    };

    setWidgets(prev => [...prev, newWidget]);
    setHasUnsavedChanges(true);
  }, []);

  const updateWidget = useCallback((widgetId: string, config: Partial<WidgetConfig>) => {
    setWidgets(prev =>
      prev.map(widget =>
        widget.id === widgetId
          ? { ...widget, config: { ...widget.config, ...config } }
          : widget
      )
    );
    setHasUnsavedChanges(true);
  }, []);

  const removeWidget = useCallback((widgetId: string) => {
    setWidgets(prev => prev.filter(widget => widget.id !== widgetId));
    setHasUnsavedChanges(true);
  }, []);

  const updateLayout = useCallback((newLayout: DashboardLayout) => {
    setLayout(newLayout);
    setHasUnsavedChanges(true);
  }, []);

  const duplicateWidget = useCallback((widgetId: string) => {
    const widget = widgets.find(w => w.id === widgetId);
    if (!widget) return;

    const duplicatedWidget: DashboardWidget = {
      ...widget,
      id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      position: {
        ...widget.position,
        y: widget.position.y + widget.position.h,
      },
    };

    setWidgets(prev => [...prev, duplicatedWidget]);
    setHasUnsavedChanges(true);
  }, [widgets]);

  const exportDashboard = useCallback(() => {
    if (!dashboard) return;

    const exportData = {
      name: dashboard.name,
      description: dashboard.description,
      widgets,
      layout,
      version: '1.0',
      exported_at: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-${dashboard.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [dashboard, widgets, layout]);

  const importDashboard = useCallback((data: string) => {
    try {
      const imported = JSON.parse(data);

      if (!imported.widgets || !imported.layout) {
        throw new Error('Invalid dashboard format');
      }

      setWidgets(imported.widgets);
      setLayout(imported.layout);
      setHasUnsavedChanges(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to import dashboard';
      setError(message);
      throw err;
    }
  }, []);

  const listDashboards = useCallback(async (): Promise<Dashboard[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await apiClient.listDashboards();
      setSavedDashboards(result.dashboards || []);
      return result.dashboards || [];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to list dashboards';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    dashboard,
    widgets,
    layout,
    savedDashboards,
    isLoading,
    isSaving,
    error,
    actions: {
      createDashboard,
      loadDashboard,
      saveDashboard,
      deleteDashboard,
      addWidget,
      updateWidget,
      removeWidget,
      updateLayout,
      duplicateWidget,
      exportDashboard,
      importDashboard,
      listDashboards,
    },
    hasUnsavedChanges,
  };
}
