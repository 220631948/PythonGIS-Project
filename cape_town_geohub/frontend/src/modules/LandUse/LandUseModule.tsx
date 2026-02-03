/**
 * LandUseModule
 * Zoning and Development Controls
 */

import React, { useEffect } from 'react';
import { Map, Layers, Building } from 'lucide-react';
import { useLandUseData } from './hooks/useLandUseData';

interface LandUseModuleProps {
    onLayerUpdate?: (layerData: any) => void;
}

const LandUseModule: React.FC<LandUseModuleProps> = ({ onLayerUpdate }) => {
    const { zoningData, active, toggleLayer } = useLandUseData();

    // Initialize with layer active
    useEffect(() => {
        if (!active) {
            toggleLayer();
        }
    }, [active, toggleLayer]);

    // Update Map Layer
    useEffect(() => {
        if (onLayerUpdate) {
            if (active) {
                onLayerUpdate({
                    id: 'landuse-zoning',
                    type: 'geojson',
                    data: zoningData,
                    style: (feature: any) => ({
                        color: feature.properties.color,
                        weight: 1,
                        opacity: 1,
                        fillOpacity: 0.6
                    }),
                    popup: (feature: any) => `
            <div class="p-2 min-w-[150px]">
              <div class="flex items-center gap-2 mb-2">
                <span class="font-bold text-white px-2 py-0.5 rounded text-sm" style="background-color: ${feature.properties.color}">
                  ${feature.properties.code}
                </span>
                <span class="text-sm font-semibold text-slate-700">Zoning</span>
              </div>
              <h4 class="font-medium text-slate-800 border-b border-slate-100 pb-1 mb-1">
                ${feature.properties.description}
              </h4>
              <div class="grid grid-cols-2 gap-2 text-xs mt-2">
                <div>
                  <span class="text-slate-500 block">Max Height</span>
                  <span class="font-medium text-slate-700">${feature.properties.max_height}</span>
                </div>
                <div>
                  <span class="text-slate-500 block">Coverage</span>
                  <span class="font-medium text-slate-700">${feature.properties.coverage}</span>
                </div>
              </div>
            </div>
          `
                });
            } else {
                onLayerUpdate(null);
            }
        }
    }, [active, zoningData, onLayerUpdate]);

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 bg-white">
                <div className="flex items-center gap-2 mb-1">
                    <Map className="w-5 h-5 text-purple-600" />
                    <h2 className="text-lg font-semibold text-slate-800">
                        Land Use & Zoning
                    </h2>
                </div>
                <p className="text-xs text-slate-500">
                    Zoning regulations and development rights
                </p>
            </div>

            {/* Layer Control */}
            <div className="p-4 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-slate-700">Zoning Map</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={active}
                            onChange={toggleLayer}
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                </div>
            </div>

            {/* Legend */}
            <div className="p-4">
                <h3 className="text-xs font-semibold text-slate-500 uppercase mb-3">Zoning Types</h3>
                <div className="space-y-2">
                    {zoningData.features.map((feature: { properties: { id: number; code: string; description: string; max_height: string; coverage: string; color: string } }) => (
                        <div key={feature.properties.id} className="flex items-center gap-2">
                            <div
                                className="w-8 h-4 rounded border border-slate-200"
                                style={{ backgroundColor: feature.properties.color }}
                            />
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-700">{feature.properties.code}</span>
                                    <span className="text-[10px] text-slate-400">{feature.properties.max_height}</span>
                                </div>
                                <div className="text-xs text-slate-500">{feature.properties.description}</div>
                            </div>
                        </div>
                    ))}
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100">
                        <div className="w-8 h-4 bg-slate-100 rounded border border-slate-200"></div>
                        <span className="text-xs text-slate-400 italic">Other zones (not shown)</span>
                    </div>
                </div>
            </div>

            {/* Info Card */}
            <div className="p-4 pt-0 mt-auto">
                <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                    <div className="flex items-start gap-2">
                        <Building className="w-4 h-4 text-purple-600 mt-1" />
                        <div>
                            <h4 className="text-xs font-bold text-purple-800">Development Application?</h4>
                            <p className="text-xs text-purple-700 mt-1">
                                Check zoning overlays before submitting building plans.
                                Use the "Export" Tool to get a generate a zoning report.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LandUseModule;
