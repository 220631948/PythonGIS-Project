/**
 * DashboardBuilder Component
 *
 * Main dashboard builder interface with drag-and-drop widget management
 */

import React, { useState, useCallback } from 'react';
import {
  Layout,
  Plus,
  Save,
  FolderOpen,
  Download,
  Upload,
  Settings,
  Grid,
  Eye,
  Edit3,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { useDashboardBuilder } from '../hooks/useDashboardBuilder';
import WidgetLibrary from './WidgetLibrary';
import DashboardCanvas from './DashboardCanvas';
import type { WidgetConfig } from '../../../types/api-2026';

interface DashboardBuilderProps {
  dashboardId?: string;
  onClose?: () => void;
}

const DashboardBuilder: React.FC<DashboardBuilderProps> = ({ dashboardId, onClose }) => {
  const {
    dashboard,
    widgets,
    layout,
    savedDashboards,
    isLoading,
    isSaving,
    error,
    actions,
    hasUnsavedChanges,
  } = useDashboardBuilder({ dashboardId, autoSave: false });

  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [dashboardName, setDashboardName] = useState('');
  const [dashboardDescription, setDashboardDescription] = useState('');

  const handleCreateDashboard = useCallback(async () => {
    if (!dashboardName.trim()) {
      alert('Please enter a dashboard name');
      return;
    }

    try {
      await actions.createDashboard(dashboardName, dashboardDescription);
      setDashboardName('');
      setDashboardDescription('');
    } catch (err) {
      console.error('Failed to create dashboard:', err);
    }
  }, [dashboardName, dashboardDescription, actions]);

  const handleSaveDashboard = useCallback(async () => {
    try {
      await actions.saveDashboard();
    } catch (err) {
      console.error('Failed to save dashboard:', err);
    }
  }, [actions]);

  const handleLoadDashboard = useCallback(async (id: string) => {
    try {
      await actions.loadDashboard(id);
      setShowLoadDialog(false);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    }
  }, [actions]);

  const handleAddWidget = useCallback((widgetType: string, config: WidgetConfig) => {
    actions.addWidget(widgetType, config);
    setShowWidgetLibrary(false);
  }, [actions]);

  const handleImportDashboard = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = event.target?.result as string;
            actions.importDashboard(data);
          } catch (err) {
            console.error('Failed to import dashboard:', err);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }, [actions]);

  React.useEffect(() => {
    actions.listDashboards();
  }, [actions]);

  return (
    <div className="dashboard-builder">
      {/* Header */}
      <div className="builder-header">
        <div className="header-left">
          <Layout className="text-blue-500" size={24} />
          <div className="header-info">
            <h1 className="text-xl font-semibold text-gray-900">
              {dashboard?.name || 'Dashboard Builder'}
            </h1>
            {dashboard?.description && (
              <p className="text-sm text-gray-500">{dashboard.description}</p>
            )}
            {hasUnsavedChanges && (
              <span className="unsaved-badge">Unsaved changes</span>
            )}
          </div>
        </div>

        <div className="header-actions">
          <button
            className="btn-icon"
            onClick={() => setShowWidgetLibrary(!showWidgetLibrary)}
            title="Add widget"
          >
            <Plus size={18} />
          </button>

          <button
            className="btn-icon"
            onClick={handleSaveDashboard}
            disabled={!dashboard || !hasUnsavedChanges || isSaving}
            title="Save dashboard"
          >
            <Save size={18} />
            {isSaving && <span className="ml-2 text-xs">Saving...</span>}
          </button>

          <button
            className="btn-icon"
            onClick={() => setShowLoadDialog(!showLoadDialog)}
            title="Load dashboard"
          >
            <FolderOpen size={18} />
          </button>

          <button
            className="btn-icon"
            onClick={actions.exportDashboard}
            disabled={!dashboard}
            title="Export dashboard"
          >
            <Download size={18} />
          </button>

          <button
            className="btn-icon"
            onClick={handleImportDashboard}
            title="Import dashboard"
          >
            <Upload size={18} />
          </button>

          <div className="divider" />

          <button
            className={`btn-icon ${previewMode ? 'active' : ''}`}
            onClick={() => setPreviewMode(!previewMode)}
            title={previewMode ? 'Edit mode' : 'Preview mode'}
          >
            {previewMode ? <Edit3 size={18} /> : <Eye size={18} />}
          </button>

          <button
            className="btn-icon"
            onClick={() => setShowSettings(!showSettings)}
            title="Settings"
          >
            <Settings size={18} />
          </button>

          {onClose && (
            <button className="btn-icon" onClick={onClose} title="Close">
              ×
            </button>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="error-banner">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={() => {}} className="ml-auto text-sm underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="builder-content">
        {/* Widget Library Sidebar */}
        {showWidgetLibrary && (
          <div className="widget-library-sidebar">
            <WidgetLibrary onAddWidget={handleAddWidget} />
          </div>
        )}

        {/* Dashboard Canvas */}
        <div className="canvas-container">
          {dashboard ? (
            <DashboardCanvas
              widgets={widgets}
              layout={layout}
              previewMode={previewMode}
              onLayoutChange={actions.updateLayout}
              onWidgetUpdate={actions.updateWidget}
              onWidgetRemove={actions.removeWidget}
              onWidgetDuplicate={actions.duplicateWidget}
            />
          ) : (
            <div className="empty-state">
              <Grid size={64} className="text-gray-300" />
              <h2 className="text-xl font-semibold text-gray-900 mt-4">
                No Dashboard Loaded
              </h2>
              <p className="text-gray-600 mt-2 max-w-md text-center">
                Create a new dashboard or load an existing one to start building
              </p>

              <div className="mt-6 space-y-4 w-full max-w-md">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Dashboard Name
                  </label>
                  <input
                    type="text"
                    value={dashboardName}
                    onChange={(e) => setDashboardName(e.target.value)}
                    placeholder="My Dashboard"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Description (optional)
                  </label>
                  <textarea
                    value={dashboardDescription}
                    onChange={(e) => setDashboardDescription(e.target.value)}
                    placeholder="Dashboard description..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <button
                  onClick={handleCreateDashboard}
                  disabled={isLoading}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Creating...' : 'Create New Dashboard'}
                </button>

                <button
                  onClick={() => setShowLoadDialog(true)}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Load Existing Dashboard
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Settings Sidebar */}
        {showSettings && dashboard && (
          <div className="settings-sidebar">
            <div className="sidebar-header">
              <Settings size={20} />
              <h3 className="font-semibold">Dashboard Settings</h3>
              <button
                className="ml-auto text-gray-500 hover:text-gray-700"
                onClick={() => setShowSettings(false)}
              >
                ×
              </button>
            </div>

            <div className="sidebar-content">
              <div className="setting-group">
                <label className="setting-label">Dashboard Name</label>
                <input
                  type="text"
                  value={dashboard.name}
                  onChange={(e) => {
                    // Update dashboard name
                  }}
                  className="setting-input"
                />
              </div>

              <div className="setting-group">
                <label className="setting-label">Description</label>
                <textarea
                  value={dashboard.description || ''}
                  onChange={(e) => {
                    // Update dashboard description
                  }}
                  rows={3}
                  className="setting-input"
                />
              </div>

              <div className="setting-group">
                <label className="setting-label">Grid Settings</label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Columns</span>
                    <span className="text-sm font-medium">12</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Row Height</span>
                    <span className="text-sm font-medium">80px</span>
                  </div>
                </div>
              </div>

              <div className="setting-group">
                <label className="setting-label">Danger Zone</label>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this dashboard?')) {
                      actions.deleteDashboard(dashboard.id);
                    }
                  }}
                  className="w-full px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} />
                  Delete Dashboard
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Load Dashboard Dialog */}
      {showLoadDialog && (
        <div className="modal-overlay" onClick={() => setShowLoadDialog(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold">Load Dashboard</h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowLoadDialog(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-content">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="spinner" />
                  <span className="ml-3 text-gray-600">Loading dashboards...</span>
                </div>
              ) : savedDashboards.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No saved dashboards found</p>
                </div>
              ) : (
                <div className="dashboard-list">
                  {savedDashboards.map((dash) => (
                    <button
                      key={dash.id}
                      onClick={() => handleLoadDashboard(dash.id)}
                      className="dashboard-item"
                    >
                      <Layout size={20} className="text-blue-500" />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{dash.name}</h3>
                        {dash.description && (
                          <p className="text-sm text-gray-500">{dash.description}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {dash.widgets?.length || 0} widgets •{' '}
                          {new Date(dash.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardBuilder;
