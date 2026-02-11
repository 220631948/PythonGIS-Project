/**
 * WorkspaceManager Component
 *
 * Comprehensive workspace and scenario management interface
 * Integrates with /api/workspace/* endpoints
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Folder,
  Plus,
  Users,
  Lock,
  Globe,
  Save,
  FolderOpen,
  Trash2,
  Edit3,
  Copy,
  Clock,
  User,
  X,
  Check,
  AlertCircle,
} from 'lucide-react';
import { apiClient } from '../../lib/api';

interface Workspace {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  team_members: string[];
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

interface Scenario {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  map_state: {
    center: [number, number];
    zoom: number;
    bearing?: number;
    pitch?: number;
  };
  layers: string[];
  filters: Record<string, any>;
  analysis_results?: any;
  version: number;
  created_at: string;
  created_by: string;
}

interface WorkspaceManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onWorkspaceChange?: (workspace: Workspace) => void;
  onScenarioLoad?: (scenario: Scenario) => void;
  currentWorkspace?: Workspace | null;
  currentUserId: string;
}

const WorkspaceManager: React.FC<WorkspaceManagerProps> = ({
  isOpen,
  onClose,
  onWorkspaceChange,
  onScenarioLoad,
  currentWorkspace,
  currentUserId,
}) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(currentWorkspace || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'workspaces' | 'scenarios'>('workspaces');

  // Form states
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [showSaveScenario, setShowSaveScenario] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceDescription, setWorkspaceDescription] = useState('');
  const [workspaceIsPublic, setWorkspaceIsPublic] = useState(false);
  const [scenarioName, setScenarioName] = useState('');
  const [scenarioDescription, setScenarioDescription] = useState('');

  // Load user's workspaces
  useEffect(() => {
    if (isOpen) {
      loadWorkspaces();
    }
  }, [isOpen]);

  // Load scenarios when workspace changes
  useEffect(() => {
    if (selectedWorkspace) {
      loadScenarios(selectedWorkspace.id);
    }
  }, [selectedWorkspace]);

  const loadWorkspaces = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiClient.getWorkspaces(currentUserId);
      setWorkspaces(result.workspaces || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workspaces');
    } finally {
      setIsLoading(false);
    }
  };

  const loadScenarios = async (workspaceId: string) => {
    setIsLoading(true);
    try {
      const result = await apiClient.getScenarios(workspaceId);
      setScenarios(result.scenarios || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load scenarios');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateWorkspace = async () => {
    if (!workspaceName.trim()) {
      setError('Workspace name is required');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const newWorkspace = await apiClient.createWorkspace({
        name: workspaceName,
        description: workspaceDescription,
        owner_id: currentUserId,
        is_public: workspaceIsPublic,
        team_members: [],
      });

      setWorkspaces([...workspaces, newWorkspace]);
      setWorkspaceName('');
      setWorkspaceDescription('');
      setWorkspaceIsPublic(false);
      setShowCreateWorkspace(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create workspace');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteWorkspace = async (workspaceId: string) => {
    if (!confirm('Are you sure you want to delete this workspace? This action cannot be undone.')) {
      return;
    }

    try {
      await apiClient.deleteWorkspace(workspaceId);
      setWorkspaces(workspaces.filter(w => w.id !== workspaceId));
      if (selectedWorkspace?.id === workspaceId) {
        setSelectedWorkspace(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete workspace');
    }
  };

  const handleSaveScenario = async () => {
    if (!selectedWorkspace) {
      setError('Please select a workspace first');
      return;
    }

    if (!scenarioName.trim()) {
      setError('Scenario name is required');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // Get current map state (would come from props in real implementation)
      const mapState = {
        center: [-33.9249, 18.4241] as [number, number],
        zoom: 11,
      };

      const newScenario = await apiClient.createScenario({
        workspace_id: selectedWorkspace.id,
        name: scenarioName,
        description: scenarioDescription,
        map_state: mapState,
        layers: [],
        filters: {},
        created_by: currentUserId,
      });

      setScenarios([...scenarios, newScenario]);
      setScenarioName('');
      setScenarioDescription('');
      setShowSaveScenario(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save scenario');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadScenario = (scenario: Scenario) => {
    if (onScenarioLoad) {
      onScenarioLoad(scenario);
    }
  };

  const handleSelectWorkspace = (workspace: Workspace) => {
    setSelectedWorkspace(workspace);
    if (onWorkspaceChange) {
      onWorkspaceChange(workspace);
    }
    setActiveView('scenarios');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Folder className="text-blue-500" size={24} />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Workspace Manager
              </h2>
              {selectedWorkspace && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedWorkspace.name}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedWorkspace && (
              <>
                <button
                  onClick={() => setShowSaveScenario(true)}
                  className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                >
                  <Save size={16} />
                  Save Scenario
                </button>
                <button
                  onClick={() => setActiveView(activeView === 'workspaces' ? 'scenarios' : 'workspaces')}
                  className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {activeView === 'workspaces' ? 'View Scenarios' : 'View Workspaces'}
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mx-6 mt-4 flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
            <AlertCircle size={18} />
            <span className="text-sm flex-1">{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeView === 'workspaces' ? (
            <>
              {/* Workspaces Grid */}
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  My Workspaces ({workspaces.length})
                </h3>
                <button
                  onClick={() => setShowCreateWorkspace(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                >
                  <Plus size={16} />
                  New Workspace
                </button>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                </div>
              ) : workspaces.length === 0 ? (
                <div className="text-center py-12">
                  <Folder size={64} className="mx-auto text-gray-300 dark:text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-4">
                    No Workspaces Yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Create your first workspace to organize your projects
                  </p>
                  <button
                    onClick={() => setShowCreateWorkspace(true)}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Create Workspace
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {workspaces.map((workspace) => (
                    <div
                      key={workspace.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer group"
                      onClick={() => handleSelectWorkspace(workspace)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            {workspace.name}
                            {workspace.is_public ? (
                              <Globe size={14} className="text-green-500" title="Public" />
                            ) : (
                              <Lock size={14} className="text-gray-400" title="Private" />
                            )}
                          </h4>
                          {workspace.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                              {workspace.description}
                            </p>
                          )}
                        </div>
                        {workspace.owner_id === currentUserId && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteWorkspace(workspace.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all"
                            title="Delete workspace"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Users size={12} />
                          <span>{workspace.team_members.length + 1} members</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={12} />
                          <span>{new Date(workspace.updated_at).toLocaleDateString()}</span>
                        </div>
                        {workspace.owner_id === currentUserId ? (
                          <div className="flex items-center gap-1">
                            <User size={12} />
                            <span>Owner</span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Scenarios List */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Scenarios ({scenarios.length})
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Saved analysis scenarios for this workspace
                </p>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                </div>
              ) : scenarios.length === 0 ? (
                <div className="text-center py-12">
                  <FolderOpen size={64} className="mx-auto text-gray-300 dark:text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-4">
                    No Scenarios Yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Save your first scenario to preserve map state and analysis results
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {scenarios.map((scenario) => (
                    <div
                      key={scenario.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-500 dark:hover:border-blue-400 transition-colors group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            {scenario.name}
                            <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                              v{scenario.version}
                            </span>
                          </h4>
                          {scenario.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {scenario.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-2">
                            <span>{scenario.layers.length} layers</span>
                            <span>{new Date(scenario.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleLoadScenario(scenario)}
                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm flex items-center gap-1"
                          >
                            <FolderOpen size={14} />
                            Load
                          </button>
                          <button
                            onClick={() => {
                              // Duplicate scenario logic
                            }}
                            className="p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                            title="Duplicate"
                          >
                            <Copy size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Create Workspace Modal */}
        {showCreateWorkspace && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Create New Workspace
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="My Workspace"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={workspaceDescription}
                    onChange={(e) => setWorkspaceDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Optional description..."
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is-public"
                    checked={workspaceIsPublic}
                    onChange={(e) => setWorkspaceIsPublic(e.target.checked)}
                    className="w-4 h-4 text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="is-public" className="text-sm text-gray-700 dark:text-gray-300">
                    Make this workspace public
                  </label>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleCreateWorkspace}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowCreateWorkspace(false);
                    setWorkspaceName('');
                    setWorkspaceDescription('');
                    setWorkspaceIsPublic(false);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Save Scenario Modal */}
        {showSaveScenario && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Save Current Scenario
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Scenario Name *
                  </label>
                  <input
                    type="text"
                    value={scenarioName}
                    onChange={(e) => setScenarioName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Analysis v1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={scenarioDescription}
                    onChange={(e) => setScenarioDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Optional description..."
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleSaveScenario}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Save size={16} />
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowSaveScenario(false);
                    setScenarioName('');
                    setScenarioDescription('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkspaceManager;
