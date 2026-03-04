import {
  MapPin,
  AlertTriangle,
  Droplets,
  Building,
  Eye,
  EyeOff,
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
  Stethoscope,
  LucideIcon
} from 'lucide-react';
import { LAYER_CONFIG } from './Legend';

const LAYER_ICONS: Record<string, LucideIcon> = {
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

interface LayerMetadata {
  total_features?: number;
  data_date?: string;
  [key: string]: any;
}

interface LayerCardProps {
  layerId: string;
  isActive: boolean;
  onToggle: () => void;
  metadata?: LayerMetadata;
  isLoading?: boolean;
}

const LayerCard: React.FC<LayerCardProps> = ({ layerId, isActive, onToggle, metadata, isLoading }) => {
  const config = LAYER_CONFIG[layerId];
  const IconComponent = LAYER_ICONS[layerId] || MapPin;

  if (!config) return null;

  return (
    <div
      className={`layer-card ${isActive ? 'active' : ''} ${isLoading ? 'loading' : ''}`}
      onClick={onToggle}
      role="button"
      tabIndex={0}
      aria-pressed={isActive}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle();
        }
      }}
    >
      <div className="layer-card-header">
        <div className="layer-icon-wrapper">
          <IconComponent size={20} />
        </div>
        <div className="layer-info">
          <h4>{config.name}</h4>
          <p>{config.description}</p>
        </div>
        <button 
          className="layer-toggle"
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          aria-pressed={isActive}
          aria-label={`Toggle ${config.name} layer`}
        >
          {isActive ? <Eye size={18} /> : <EyeOff size={18} />}
        </button>
      </div>

      {isActive && metadata && (
        <div className="layer-metadata">
          <div className="metadata-stats">
            {metadata.total_features !== undefined && (
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

interface LayerPanelProps {
  activeLayers: string[];
  onLayerToggle: (layerId: string) => void;
  metadata?: Record<string, LayerMetadata>;
  loadingLayers?: string[];
}

const LayerPanel: React.FC<LayerPanelProps> = ({ 
  activeLayers, 
  onLayerToggle, 
  metadata = {}, 
  loadingLayers = [] 
}) => {
  const categories: Record<string, string[]> = {
    'Urban Planning': ['zoning-layer', 'building-footprints-layer', 'open-spaces-layer'],
    'Transport': ['myciti-stops-layer', 'myciti-routes-layer', 'railway-stations-layer'],
    'Public Services': ['services-layer', 'water-facilities-layer', 'clinics-layer', 'housing-offices-layer', 'courts-layer'],
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
