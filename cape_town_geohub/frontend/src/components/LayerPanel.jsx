import React from 'react';
import {
  MapPin,
  AlertTriangle,
  Droplets,
  Building,
  Bus,
  Eye,
  EyeOff,
  ChevronRight,
  BarChart3,
  TrendingUp,
  Trees,
  Trophy,
  Waves,
  Church,
  Store,
  Gavel,
  Home,
  Leaf,
  Stethoscope
} from 'lucide-react';
import { LAYER_CONFIG } from './Legend';

const LAYER_ICONS = {
  'services-layer': MapPin,
  'safety-layer': AlertTriangle,
  'flood-layer': Droplets,
  'zoning-layer': Building,
  'parks-layer': Trees,
  'sports-layer': Trophy,
  'swimming-pools-layer': Waves,
  'cemeteries-layer': Church,
  'clinics-layer': Stethoscope,
  'trading-layer': Store,
  'building-footprints-layer': Home,
  'courts-layer': Gavel,
  'housing-offices-layer': Home,
  'open-spaces-layer': Leaf
};

const LayerCard = ({ layerId, isActive, onToggle, metadata, isLoading }) => {
  const config = LAYER_CONFIG[layerId];
  const IconComponent = LAYER_ICONS[layerId] || MapPin;

  if (!config) return null;

  return (
    <div
      className={`layer-card ${isActive ? 'active' : ''} ${isLoading ? 'loading' : ''}`}
      onClick={onToggle}
    >
      <div className="layer-card-header">
        <div className="layer-icon-wrapper">
          <IconComponent size={20} />
        </div>
        <div className="layer-info">
          <h4>{config.name}</h4>
          <p>{config.description}</p>
        </div>
        <button className="layer-toggle">
          {isActive ? <Eye size={18} /> : <EyeOff size={18} />}
        </button>
      </div>

      {isActive && metadata && (
        <div className="layer-metadata">
          <div className="metadata-stats">
            {metadata.total_features && (
              <div className="stat-item">
                <BarChart3 size={14} />
                <span>{metadata.total_features} features</span>
              </div>
            )}
            {metadata.data_date && (
              <div className="stat-item">
                <TrendingUp size={14} />
                <span>Updated: {metadata.data_date}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const LayerPanel = ({ activeLayers, onLayerToggle, metadata, loadingLayers = [] }) => {
  const categories = {
    'Urban Planning': ['zoning-layer', 'building-footprints-layer', 'open-spaces-layer'],
    'Public Services': ['services-layer', 'clinics-layer', 'housing-offices-layer', 'courts-layer'],
    'Recreation': ['parks-layer', 'sports-layer', 'swimming-pools-layer'],
    'Safety & Risk': ['safety-layer', 'flood-layer', 'cemeteries-layer', 'trading-layer']
  };

  return (
    <div className="layer-panel">
      <div className="panel-header">
        <h3>Map Layers</h3>
        <span className="layer-count">{activeLayers.length} active</span>
      </div>

      <div className="layers-list">
        {Object.entries(categories).map(([category, layers]) => (
          <div key={category} className="layer-category">
            <h4 className="category-title">{category}</h4>
            {layers.map(layerId => (
              <LayerCard
                key={layerId}
                layerId={layerId}
                isActive={activeLayers.includes(layerId)}
                onToggle={() => onLayerToggle(layerId)}
                metadata={metadata[layerId]}
                isLoading={loadingLayers.includes(layerId)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LayerPanel;
