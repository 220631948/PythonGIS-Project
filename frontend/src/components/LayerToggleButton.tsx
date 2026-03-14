import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

export interface LayerConfig {
  id: string;
  name: string;
  type?: string;
  visible?: boolean;
}

export interface LayerToggleButtonProps {
  layer: LayerConfig;
  isActive: boolean;
  onToggle: (layerId: string) => void;
  className?: string;
}

/**
 * Toggle button for map layers
 */
export const LayerToggleButton: React.FC<LayerToggleButtonProps> = ({
  layer,
  isActive,
  onToggle,
  className = ''
}) => {
  return (
    <button
      onClick={() => onToggle(layer.id)}
      className={`flex items-center justify-between w-full p-3 rounded-lg transition-colors ${
        isActive 
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
      } ${className}`}
      aria-pressed={isActive}
      aria-label={`Toggle ${layer.name}`}
    >
      <span className="text-sm font-medium truncate">{layer.name}</span>
      {isActive ? (
        <Eye size={16} className="text-emerald-500" aria-hidden="true" />
      ) : (
        <EyeOff size={16} className="text-slate-400" aria-hidden="true" />
      )}
    </button>
  );
};

export default LayerToggleButton;
