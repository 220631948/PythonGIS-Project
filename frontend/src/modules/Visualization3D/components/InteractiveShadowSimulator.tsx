import React, { useState, useCallback } from 'react';
import { Sun, Play } from 'lucide-react';
import { useMap3D } from '../hooks/useMap3D';
import '../../../styles/visualization-3d.css';

/**
 * InteractiveShadowSimulator Component
 * 
 * Allows users to place a virtual building and simulate its shadow impact in real-time.
 * Part of the "Shiny GeoHub" 2026 Expansion.
 */
const InteractiveShadowSimulator: React.FC = () => {
  const { interactiveShadow, isLoading, actions } = useMap3D();
  const [height, setHeight] = useState(30);
  const [dateTime, setDateTime] = useState(new Date().toISOString().slice(0, 16));

  const handlePlaceBuilding = useCallback(() => {
    // Demo implementation: Place a building footprint at the current map center
    // In a production version, this would use a drawing tool on the DeckGL canvas.
    const lat = -33.9249;
    const lng = 18.4241;
    const size = 0.0005; // Approx 50m scale

    const mockGeom = {
      type: 'Polygon',
      coordinates: [[
        [lng - size, lat - size],
        [lng + size, lat - size],
        [lng + size, lat + size],
        [lng - size, lat + size],
        [lng - size, lat - size]
      ]]
    };

    actions.simulateInteractiveShadow(mockGeom, height, dateTime);
  }, [actions, height, dateTime]);

  return (
    <div className="interactive-shadow-simulator shadow-card">
      <div className="panel-header">
        <Sun size={18} className="text-yellow-500" />
        <h3>Shadow Simulator (Beta)</h3>
      </div>
      
      <div className="panel-body p-4">
        <p className="text-xs text-gray-500 mb-4">
          Place a virtual building to see how its shadow affects neighbors.
        </p>
        
        <div className="simulator-controls space-y-4">
          <div className="control-item">
            <label className="block text-sm font-medium">Building Height (m)</label>
            <input 
              type="number" 
              className="w-full p-2 border rounded"
              min={5}
              max={200}
              value={height} 
              onChange={(e) => setHeight(Number(e.target.value))}
            />
          </div>
          
          <div className="control-item">
            <label className="block text-sm font-medium">Simulation Time</label>
            <input 
              type="datetime-local" 
              className="w-full p-2 border rounded"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
            />
          </div>
          
          <button 
            className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition-colors"
            onClick={handlePlaceBuilding}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
            ) : (
              <Play size={16} />
            )}
            <span>Place & Simulate</span>
          </button>
        </div>

        {interactiveShadow && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">
            <strong>Simulation Success!</strong>
            <br />
            Shadow footprint generated and added to map layers.
          </div>
        )}
      </div>
    </div>
  );
};

export default InteractiveShadowSimulator;
