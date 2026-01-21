import React, { useState, useCallback } from 'react';
import { Palette, Eye, EyeOff, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import '../styles/StyleEditor.css';

/**
 * StyleEditor - Custom symbology editor for map layers
 *
 * Features:
 * - Color picker for fill and stroke
 * - Opacity slider
 * - Line weight control
 * - Pattern selection
 * - Style presets
 */

// Default style presets
const STYLE_PRESETS = {
  default: {
    fillColor: '#3388ff',
    fillOpacity: 0.3,
    strokeColor: '#3388ff',
    strokeOpacity: 1,
    strokeWeight: 2
  },
  highlight: {
    fillColor: '#ff6b35',
    fillOpacity: 0.5,
    strokeColor: '#ff6b35',
    strokeOpacity: 1,
    strokeWeight: 3
  },
  subtle: {
    fillColor: '#808080',
    fillOpacity: 0.1,
    strokeColor: '#606060',
    strokeOpacity: 0.5,
    strokeWeight: 1
  },
  warning: {
    fillColor: '#ffc107',
    fillOpacity: 0.4,
    strokeColor: '#ff9800',
    strokeOpacity: 1,
    strokeWeight: 2
  },
  danger: {
    fillColor: '#dc3545',
    fillOpacity: 0.4,
    strokeColor: '#c82333',
    strokeOpacity: 1,
    strokeWeight: 2
  },
  success: {
    fillColor: '#28a745',
    fillOpacity: 0.4,
    strokeColor: '#1e7e34',
    strokeOpacity: 1,
    strokeWeight: 2
  }
};

// Color palette for quick selection
const COLOR_PALETTE = [
  '#3388ff', '#ff6b35', '#28a745', '#dc3545', '#ffc107',
  '#17a2b8', '#6f42c1', '#e83e8c', '#20c997', '#fd7e14',
  '#6c757d', '#343a40'
];

export default function StyleEditor({
  layerId,
  currentStyle = STYLE_PRESETS.default,
  onStyleChange,
  onClose
}) {
  const [style, setStyle] = useState(currentStyle);
  const [isExpanded, setIsExpanded] = useState(true);
  const [showColorPicker, setShowColorPicker] = useState(null); // 'fill' | 'stroke' | null

  const updateStyle = useCallback((updates) => {
    const newStyle = { ...style, ...updates };
    setStyle(newStyle);
    if (onStyleChange) {
      onStyleChange(layerId, newStyle);
    }
  }, [style, layerId, onStyleChange]);

  const applyPreset = useCallback((presetName) => {
    const preset = STYLE_PRESETS[presetName];
    if (preset) {
      setStyle(preset);
      if (onStyleChange) {
        onStyleChange(layerId, preset);
      }
    }
  }, [layerId, onStyleChange]);

  const resetStyle = () => {
    applyPreset('default');
  };

  return (
    <div className="style-editor">
      <div className="style-editor-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="header-title">
          <Palette size={16} />
          <span>Layer Style</span>
        </div>
        <div className="header-actions">
          <button
            className="icon-btn"
            onClick={(e) => { e.stopPropagation(); resetStyle(); }}
            title="Reset to default"
          >
            <RotateCcw size={14} />
          </button>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {isExpanded && (
        <div className="style-editor-content">
          {/* Presets */}
          <div className="style-section">
            <label className="section-label">Presets</label>
            <div className="preset-grid">
              {Object.keys(STYLE_PRESETS).map(preset => (
                <button
                  key={preset}
                  className="preset-btn"
                  onClick={() => applyPreset(preset)}
                  style={{
                    backgroundColor: STYLE_PRESETS[preset].fillColor,
                    opacity: STYLE_PRESETS[preset].fillOpacity + 0.3
                  }}
                  title={preset}
                >
                  {preset.charAt(0).toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Fill Color */}
          <div className="style-section">
            <label className="section-label">Fill Color</label>
            <div className="color-row">
              <div
                className="color-swatch"
                style={{ backgroundColor: style.fillColor }}
                onClick={() => setShowColorPicker(showColorPicker === 'fill' ? null : 'fill')}
              />
              <input
                type="text"
                value={style.fillColor}
                onChange={(e) => updateStyle({ fillColor: e.target.value })}
                className="color-input"
              />
            </div>
            {showColorPicker === 'fill' && (
              <div className="color-palette">
                {COLOR_PALETTE.map(color => (
                  <button
                    key={color}
                    className="palette-color"
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      updateStyle({ fillColor: color });
                      setShowColorPicker(null);
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Fill Opacity */}
          <div className="style-section">
            <label className="section-label">
              Fill Opacity: {Math.round(style.fillOpacity * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={style.fillOpacity * 100}
              onChange={(e) => updateStyle({ fillOpacity: e.target.value / 100 })}
              className="slider"
            />
          </div>

          {/* Stroke Color */}
          <div className="style-section">
            <label className="section-label">Stroke Color</label>
            <div className="color-row">
              <div
                className="color-swatch"
                style={{ backgroundColor: style.strokeColor }}
                onClick={() => setShowColorPicker(showColorPicker === 'stroke' ? null : 'stroke')}
              />
              <input
                type="text"
                value={style.strokeColor}
                onChange={(e) => updateStyle({ strokeColor: e.target.value })}
                className="color-input"
              />
            </div>
            {showColorPicker === 'stroke' && (
              <div className="color-palette">
                {COLOR_PALETTE.map(color => (
                  <button
                    key={color}
                    className="palette-color"
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      updateStyle({ strokeColor: color });
                      setShowColorPicker(null);
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Stroke Weight */}
          <div className="style-section">
            <label className="section-label">
              Stroke Weight: {style.strokeWeight}px
            </label>
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={style.strokeWeight}
              onChange={(e) => updateStyle({ strokeWeight: parseFloat(e.target.value) })}
              className="slider"
            />
          </div>

          {/* Stroke Opacity */}
          <div className="style-section">
            <label className="section-label">
              Stroke Opacity: {Math.round(style.strokeOpacity * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={style.strokeOpacity * 100}
              onChange={(e) => updateStyle({ strokeOpacity: e.target.value / 100 })}
              className="slider"
            />
          </div>

          {/* Preview */}
          <div className="style-section">
            <label className="section-label">Preview</label>
            <div className="style-preview">
              <svg width="100%" height="60" viewBox="0 0 200 60">
                {/* Polygon preview */}
                <polygon
                  points="20,50 50,10 80,50"
                  fill={style.fillColor}
                  fillOpacity={style.fillOpacity}
                  stroke={style.strokeColor}
                  strokeOpacity={style.strokeOpacity}
                  strokeWidth={style.strokeWeight}
                />
                {/* Circle preview */}
                <circle
                  cx="120"
                  cy="30"
                  r="25"
                  fill={style.fillColor}
                  fillOpacity={style.fillOpacity}
                  stroke={style.strokeColor}
                  strokeOpacity={style.strokeOpacity}
                  strokeWidth={style.strokeWeight}
                />
                {/* Line preview */}
                <line
                  x1="160"
                  y1="50"
                  x2="190"
                  y2="10"
                  stroke={style.strokeColor}
                  strokeOpacity={style.strokeOpacity}
                  strokeWidth={style.strokeWeight}
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Export presets for use in other components
export { STYLE_PRESETS, COLOR_PALETTE };
