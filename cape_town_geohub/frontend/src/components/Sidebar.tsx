import React, { useState, Suspense, lazy } from 'react';
import {
  Info, Github, ExternalLink,
  Building2, Bus, Shield, TreePine, Map as MapIcon, Trash2, Database,
  LucideIcon
} from 'lucide-react';

// Common Components
import { ModuleErrorBoundary, ModuleSkeleton, DataStatusFooter } from './Common';
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

  const getModuleName = () => {
    const tab = tabs.find(t => t.id === activeTab);
    return tab ? tab.label : 'Module';
  };

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
        <div className="sidebar-overlay" onClick={() => onClose && onClose()} />
      )}

      <aside className={`sidebar ${isOpen ? 'open' : ''} ${isLoading ? 'loading' : ''}`} role="navigation" aria-label="Main navigation">
        <div className="sidebar-tabs" role="tablist" style={{
          display: 'flex',
          flexWrap: 'wrap',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb'
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              title={tab.label}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-label={`${tab.label} module`}
              aria-controls={`${tab.id}-panel`}
              style={{
                flex: '1 1 auto',
                minWidth: '42px',
                padding: '10px 6px',
                border: 'none',
                backgroundColor: activeTab === tab.id ? '#fff' : 'transparent',
                borderBottom: activeTab === tab.id ? `2px solid ${tab.color}` : '2px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.2s'
              }}
            >
              <tab.icon size={18} style={{ color: activeTab === tab.id ? tab.color : '#6b7280' }} aria-hidden="true" />
              <span style={{ fontSize: '10px', color: activeTab === tab.id ? tab.color : '#6b7280', fontWeight: activeTab === tab.id ? '600' : '400' }}>
                {tab.label}
              </span>
            </button>
          ))}
        </div>

        <div className="sidebar-content" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          
          <OpsStatus />

          <div style={{ flex: 1 }}>
            <ModuleErrorBoundary moduleName={getModuleName()} key={activeTab}>
              <Suspense fallback={<ModuleSkeleton />}>
                {renderContent()}
              </Suspense>
            </ModuleErrorBoundary>
          </div>

          <div className="sidebar-section about" style={{ padding: '12px 16px', borderTop: '1px solid #e5e7eb', marginTop: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Info size={14} style={{ color: '#6b7280' }} />
              <span style={{ fontSize: '12px', fontWeight: '500' }}>About</span>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <a href="https://odp.capetown.gov.za/" target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ExternalLink size={12} /> Open Data
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Github size={12} /> Source
              </a>
            </div>
            <p style={{ fontSize: '10px', color: '#9ca3af', marginTop: '8px' }}>
              v1.3.0-vibecoding • 100% Real Open Data
            </p>
          </div>
        </div>

        <DataStatusFooter isOnline={isOnline} isLoading={isLoading} />
      </aside>
    </>
  );
};

export default Sidebar;
