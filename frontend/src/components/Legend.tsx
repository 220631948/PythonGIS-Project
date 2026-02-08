import React from 'react';
import {
  Layers,
  AlertTriangle,
  Droplets,
  Building,
  MapPin,
  Trees,
  Trophy,
  Waves,
  Church,
  Store,
  Gavel,
  Home,
  Leaf,
  Stethoscope,
  Bus,
  Train,
  LucideIcon
} from 'lucide-react';

interface LayerColor {
  color: string;
  label: string;
}

interface LayerConfigItem {
  name: string;
  description: string;
  icon: LucideIcon;
  colors: LayerColor[];
}

const LAYER_CONFIG: Record<string, LayerConfigItem> = {
  'services-layer': {
    name: 'Service Access',
    description: 'Informal settlement access to water & electricity',
    icon: MapPin,
    colors: [
      { color: '#22c55e', label: 'Good (>70%)' },
      { color: '#f97316', label: 'Medium (40-70%)' },
      { color: '#ef4444', label: 'Poor (<40%)' }
    ]
  },
  'safety-layer': {
    name: 'Safety Heatmap',
    description: 'Crime statistics by precinct (aggregated)',
    icon: AlertTriangle,
    colors: [
      { color: '#fef08a', label: 'Low Risk' },
      { color: '#f97316', label: 'Medium Risk' },
      { color: '#ef4444', label: 'High Risk' }
    ]
  },
  'flood-layer': {
    name: 'Flood Risk',
    description: 'Flood risk zones by suburb',
    icon: Droplets,
    colors: [
      { color: 'rgba(59, 130, 246, 0.2)', label: 'Low (0-20%)' },
      { color: 'rgba(59, 130, 246, 0.5)', label: 'Medium (20-50%)' },
      { color: 'rgba(59, 130, 246, 0.8)', label: 'High (>50%)' }
    ]
  },
  'zoning-layer': {
    name: 'Zoning Summary',
    description: 'Land use zoning classifications',
    icon: Building,
    colors: [
      { color: '#a855f7', label: 'Zoned Areas' }
    ]
  },
  'parks-layer': {
    name: 'Parks',
    description: 'City parks and recreational areas',
    icon: Trees,
    colors: [{ color: '#15803d', label: 'Public Parks' }]
  },
  'sports-layer': {
    name: 'Sports Grounds',
    description: 'Sports facilities and fields',
    icon: Trophy,
    colors: [{ color: '#b91c1c', label: 'Sports Grounds' }]
  },
  'swimming-pools-layer': {
    name: 'Swimming Pools',
    description: 'Public swimming pools',
    icon: Waves,
    colors: [{ color: '#0369a1', label: 'Public Pools' }]
  },
  'cemeteries-layer': {
    name: 'Cemeteries',
    description: 'Cemeteries and crematoria',
    icon: Church,
    colors: [{ color: '#4b5563', label: 'Cemeteries' }]
  },
  'clinics-layer': {
    name: 'Health Facilities',
    description: 'Clinics and hospitals',
    icon: Stethoscope,
    colors: [{ color: '#be123c', label: 'Medical Facilities' }]
  },
  'trading-layer': {
    name: 'Informal Trading',
    description: 'Informal trading locations',
    icon: Store,
    colors: [{ color: '#a16207', label: 'Trading Areas' }]
  },
  'building-footprints-layer': {
    name: 'Buildings',
    description: 'Building footprints (detailed)',
    icon: Home,
    colors: [{ color: '#475569', label: 'Structures' }]
  },
  'courts-layer': {
    name: 'Municipal Courts',
    description: 'City courts and legal offices',
    icon: Gavel,
    colors: [{ color: '#1e293b', label: 'Courts' }]
  },
  'housing-offices-layer': {
    name: 'Housing Offices',
    description: 'Municipal housing offices',
    icon: Home,
    colors: [{ color: '#0f766e', label: 'Housing Offices' }]
  },
  'open-spaces-layer': {
    name: 'Open Spaces',
    description: 'Public open spaces and greens',
    icon: Leaf,
    colors: [{ color: '#166534', label: 'Open Space' }]
  },
  'myciti-stops-layer': {
    name: 'MyCiTi Stops',
    description: 'MyCiTi bus stops',
    icon: Bus,
    colors: [{ color: '#dc2626', label: 'Bus Stop' }]
  },
  'myciti-routes-layer': {
    name: 'MyCiTi Routes',
    description: 'MyCiTi bus routes',
    icon: Layers, // Placeholder
    colors: [{ color: '#dc2626', label: 'Bus Route' }]
  },
  'railway-stations-layer': {
    name: 'Rail Stations',
    description: 'Metrorail stations',
    icon: Train,
    colors: [{ color: '#2563eb', label: 'Station' }]
  },
  'water-facilities-layer': {
    name: 'Water Facilities',
    description: 'Public water taps and facilities',
    icon: Droplets,
    colors: [{ color: '#0ea5e9', label: 'Water Access' }]
  }
};

interface LegendProps {
  activeLayers: string[];
}

const Legend: React.FC<LegendProps> = ({ activeLayers }) => {
  if (activeLayers.length === 0) {
    return (
      <div className="legend-container empty">
        <Layers size={20} />
        <p>Enable layers to see legend</p>
      </div>
    );
  }

  return (
    <div className="legend-container">
      <h4 className="legend-title">
        <Layers size={16} />
        Map Legend
      </h4>
      {activeLayers.map(layerId => {
        const config = LAYER_CONFIG[layerId];
        if (!config) return null;

        const IconComponent = config.icon;

        return (
          <div key={layerId} className="legend-item">
            <div className="legend-item-header">
              <IconComponent size={14} />
              <span>{config.name}</span>
            </div>
            <div className="legend-colors">
              {config.colors.map((item, idx) => (
                <div key={idx} className="legend-color-item">
                  <span
                    className="color-swatch"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="color-label">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Legend;
export { LAYER_CONFIG };
