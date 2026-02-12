import React, { useMemo } from 'react';
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
  LucideIcon
} from 'lucide-react';
import { List, type RowComponentProps } from 'react-window';
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
  'clinics-layer': Store,
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
      style={{ height: '100%', boxSizing: 'border-box' }}
    >
      <div className="layer-card-header">
        <div className="layer-icon-wrapper">
          <IconComponent size={20} />
        </div>
        <div className="layer-info">
          <h4>{config.name}</h4>
          <p className="line-clamp-1">{config.description}</p>
        </div>
        <button
          className="layer-toggle"
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          aria-pressed={isActive}
          aria-label={isActive ? `Hide ${config.name} layer` : `Show ${config.name} layer`}
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

interface ListItem {
  type: 'category' | 'layer';
  id: string;
  label?: string;
}

interface LayerRowData {
  items: ListItem[];
  activeLayers: string[];
  onLayerToggle: (layerId: string) => void;
  metadata: Record<string, LayerMetadata>;
  loadingLayers: string[];
}

const LayerRow = ({
  index,
  style,
  items,
  activeLayers,
  onLayerToggle,
  metadata,
  loadingLayers,
}: RowComponentProps<LayerRowData>): React.ReactElement | null => {
  const item = items[index];
  if (!item) return null;

  if (item.type === 'category') {
    return (
      <div style={style} className="layer-category-header">
        <h4 className="category-title">{item.label}</h4>
      </div>
    );
  }

  return (
    <div style={{ ...style, padding: '4px 8px' }}>
      <LayerCard
        layerId={item.id}
        isActive={activeLayers.includes(item.id)}
        onToggle={() => onLayerToggle(item.id)}
        metadata={metadata[item.id]}
        isLoading={loadingLayers.includes(item.id)}
      />
    </div>
  );
};

const LayerPanel: React.FC<LayerPanelProps> = ({
  activeLayers,
  onLayerToggle,
  metadata = {},
  loadingLayers = []
}) => {
  const flattenedList = useMemo(() => {
    const categories: Record<string, string[]> = {
      'Urban Planning': ['zoning-layer', 'building-footprints-layer', 'open-spaces-layer'],
      'Transport': ['myciti-stops-layer', 'myciti-routes-layer', 'railway-stations-layer'],
      'Public Services': ['services-layer', 'water-facilities-layer', 'clinics-layer', 'housing-offices-layer', 'courts-layer'],
      'Recreation': ['parks-layer', 'sports-layer', 'swimming-pools-layer'],
      'Safety & Risk': ['safety-layer', 'flood-layer', 'cemeteries-layer', 'trading-layer'],
    };

    const list: ListItem[] = [];
    Object.entries(categories).forEach(([category, layers]) => {
      list.push({ type: 'category', id: category, label: category });
      layers.forEach(layerId => {
        list.push({ type: 'layer', id: layerId });
      });
    });
    return list;
  }, []);

  return (
    <div className="layer-panel">
      <div className="panel-header">
        <h3 id="layers-heading">Map Layers</h3>
        <span className="layer-count" aria-live="polite">{activeLayers.length} active</span>
      </div>

      <div className="layers-list-container" style={{ height: 'calc(100vh - 240px)', width: '100%' }}>
        <List
          style={{ height: 600, width: '100%' }}
          rowCount={flattenedList.length}
          rowHeight={80}
          rowComponent={LayerRow}
          rowProps={{
            items: flattenedList,
            activeLayers,
            onLayerToggle,
            metadata,
            loadingLayers,
          }}
          aria-labelledby="layers-heading"
        />
      </div>
    </div>
  );
};

export default LayerPanel;
