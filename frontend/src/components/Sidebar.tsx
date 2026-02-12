import React, { useState, lazy } from 'react';
import {
  Info, Github, ExternalLink,
  Building2, Bus, Shield, TreePine, Map as MapIcon, Trash2, Database,
  LucideIcon
} from 'lucide-react';

// Common Components
import { ModuleSkeleton, DataStatusFooter } from './Common';
import LoadingBoundary from './LoadingBoundary';
import OpsStatus from './OpsStatus';

// Lazy-loaded Module Components (Code Splitting)
// We assume these modules are or will be converted to TSX/JSX.
// Vite/TS handles import paths without extensions usually, or with extensions.
// For now, I'll remove explicit extensions for consistency, relying on resolution.
// If they fail, I'll add them back.
const ServicesModule = lazy(() => import('../modules/Services/ServicesModule'));
const TransportModule = lazy(() => import('../modules/Transport/TransportModule'));
const SafetyModule = lazy(() => import('../modules/Safety/SafetyModule'));
const EnvironmentModule = lazy(() => import('../modules/Environment/EnvironmentModule'));
const LandUseModule = lazy(() => import('../modules/LandUse/LandUseModule'));
const UtilitiesModule = lazy(() => import('../modules/Utilities/UtilitiesModule'));

// Static imports
import LayerPanel from './LayerPanel';
import Legend from './Legend';

interface SidebarProps {
  activeLayers: string[];
  onLayerToggle: (_layerId: string) => void;
  onLayerUpdate?: (_layerId: string | null) => void;
  metadata?: any; // Define more specific if possible
  loadingLayers?: string[];
  isOpen?: boolean;
  onClose?: () => void;
  clickedLocation?: { lat: number, lng: number } | null;
  isOnline?: boolean;
  isLoading?: boolean;
}

interface TabConfig {
  id: string;
  icon: LucideIcon;
  label: string;
  color: string;
}

/**
 * Sidebar with 7-module architecture per Vibecoding spec:
 * Services | Transport | Safety | Environment | Land Use | Utilities | Data
 */
const Sidebar: React.FC<SidebarProps> = ({
  activeLayers,
  onLayerToggle,
  onLayerUpdate,
  metadata,
  loadingLayers = [],
  isOpen = true,
  onClose,
  clickedLocation,
  isOnline = true,
  isLoading = false
}) => {
  const [activeTab, setActiveTab] = useState('services');

  // Clear layers when tab changes
  React.useEffect(() => {
    if (onLayerUpdate) {
      onLayerUpdate(null);
    }
  }, [activeTab, onLayerUpdate]);

  const tabs: TabConfig[] = [
    { id: 'services', icon: Building2, label: 'Services', color: '#3b82f6' },
    { id: 'transport', icon: Bus, label: 'Transport', color: '#10b981' },
    { id: 'safety', icon: Shield, label: 'Safety', color: '#ef4444' },
    { id: 'environment', icon: TreePine, label: 'Environment', color: '#22c55e' },
    { id: 'landuse', icon: MapIcon, label: 'Land Use', color: '#8b5cf6' },
    { id: 'utilities', icon: Trash2, label: 'Utilities', color: '#f59e0b' },
    { id: 'data', icon: Database, label: 'Data', color: '#6366f1' }
  ];



  const renderContent = () => {
    switch (activeTab) {
      case 'services': return <ServicesModule onLayerUpdate={onLayerUpdate} />;
      case 'transport': return <TransportModule onBuffersUpdate={onLayerUpdate} />;
      case 'safety': return <SafetyModule onLayerUpdate={onLayerUpdate} />;
      case 'environment': return <EnvironmentModule onLayerUpdate={onLayerUpdate} clickedLocation={clickedLocation} />;
      case 'landuse': return <LandUseModule onLayerUpdate={onLayerUpdate} />;
      case 'utilities': return <UtilitiesModule onLayerUpdate={onLayerUpdate} clickedLocation={clickedLocation} />;
      case 'data': return (
        <div className="module-content">
          <LayerPanel
            activeLayers={activeLayers}
            onLayerToggle={onLayerToggle}
            metadata={metadata}
            loadingLayers={loadingLayers}
          />
          <Legend activeLayers={activeLayers} />
        </div>
      );
      default: return null;
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && window.innerWidth <= 768 && (
        <div
          className="fixed inset-0 bg-black/50 z-[999] md:hidden animate-fade-in"
          onClick={() => onClose && onClose()}
        />
      )}

      <nav
        id="sidebar-navigation"
        className={`
          fixed md:relative top-0 left-0 h-full
          w-80 md:w-96
          bg-slate-900 text-slate-100
          flex flex-col
          shadow-xl md:shadow-none
          z-[1000] md:z-auto
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${isLoading ? 'opacity-75 pointer-events-none' : ''}
        `}
        aria-label="Main navigation"
        aria-busy={isLoading}
      >
        {/* Tab Navigation */}
        <div
          className="flex flex-wrap border-b border-slate-700 bg-slate-800/50"
          role="tablist"
        >
          {tabs.map(tab => (
            <button
              key={tab.id}
              id={`${tab.id}-tab`}
              className={`
                flex-1 min-w-[42px] px-1.5 py-2.5
                flex flex-col items-center gap-1
                border-none cursor-pointer
                transition-all duration-200
                ${activeTab === tab.id
                  ? 'bg-slate-900 border-b-2'
                  : 'bg-transparent border-b-2 border-transparent hover:bg-slate-800'
                }
              `}
              onClick={() => setActiveTab(tab.id)}
              title={tab.label}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-label={`${tab.label} module`}
              aria-controls="module-panel"
              tabIndex={activeTab === tab.id ? 0 : -1}
              style={{
                borderBottomColor: activeTab === tab.id ? tab.color : 'transparent'
              }}
            >
              <tab.icon
                size={18}
                className={activeTab === tab.id ? '' : 'text-slate-400'}
                style={{ color: activeTab === tab.id ? tab.color : undefined }}
                aria-hidden="true"
              />
              <span
                className={`text-[10px] ${activeTab === tab.id ? 'font-semibold' : 'font-normal text-slate-400'}`}
                style={{ color: activeTab === tab.id ? tab.color : undefined }}
              >
                {tab.label}
              </span>
            </button>
          ))}
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto flex flex-col">

          <OpsStatus />

          <div
            id="module-panel"
            role="tabpanel"
            aria-labelledby={`${activeTab}-tab`}
            className="flex-1"
          >
            <LoadingBoundary
              key={activeTab}
              fallback={<ModuleSkeleton />}
              variant="compact"
            >
              {renderContent()}
            </LoadingBoundary>
          </div>

          {/* About Section */}
          <div className="px-4 py-3 border-t border-slate-700 mt-auto bg-slate-800/30">
            <div className="flex items-center gap-2 mb-2">
              <Info size={14} className="text-slate-400" aria-hidden="true" />
              <span className="text-xs font-medium text-slate-200">About</span>
            </div>
            <div className="flex gap-3">
              <a
                href="https://odp.capetown.gov.za/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-teal-400 hover:text-teal-300 flex items-center gap-1 transition-colors"
                aria-label="Open Data (opens in new tab)"
              >
                <ExternalLink size={12} aria-hidden="true" /> Open Data
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-teal-400 hover:text-teal-300 flex items-center gap-1 transition-colors"
                aria-label="Source code (opens in new tab)"
              >
                <Github size={12} aria-hidden="true" /> Source
              </a>
            </div>
            <p className="text-[10px] text-slate-500 mt-2">
              v1.3.0-vibecoding • 100% Real Open Data
            </p>
          </div>
        </div>

        <DataStatusFooter isOnline={isOnline} isLoading={isLoading} />
      </nav>
    </>
  );
};

export default Sidebar;
