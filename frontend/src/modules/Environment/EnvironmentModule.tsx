/**
 * EnvironmentModule
 * Flood risk analysis and green space monitoring
 */

import React, { useEffect } from 'react';
import { TreePine, Waves, Info, MapPin } from 'lucide-react';
import { useEnvironmentData } from './hooks/useEnvironmentData';

interface EnvironmentModuleProps {
    onLayerUpdate?: (_layerData: any) => void;
    clickedLocation?: { lat: number; lng: number } | null;
}

const EnvironmentModule: React.FC<EnvironmentModuleProps> = ({
    onLayerUpdate,
    clickedLocation
}) => {
    const {
        floodZones,
        parks,
        activeLayers,
        toggleLayer,
        calculateGreenSpaceAccess,
        nearestParkDist,
        getFloodColor
    } = useEnvironmentData();

    // Handle map clicks for Green Space Access
    useEffect(() => {
        if (clickedLocation) {
            calculateGreenSpaceAccess(clickedLocation.lat, clickedLocation.lng);
        }
    }, [clickedLocation, calculateGreenSpaceAccess]);

    // Update Map Layers
    useEffect(() => {
        if (onLayerUpdate) {
            const layers = [];

            if (activeLayers.floodUtils) {
                layers.push({
                    id: 'env-flood',
                    type: 'geojson',
                    data: floodZones,
                    style: (feature: any) => ({
                        color: getFloodColor(feature.properties.risk_level),
                        weight: 2,
                        opacity: 0.6,
                        fillOpacity: 0.4
                    }),
                    popup: (feature: any) => `
            <div class="p-2">
              <h3 class="font-bold text-red-600">Flood Risk: ${feature.properties.risk_level}</h3>
              <p class="text-sm">${feature.properties.description}</p>
              <p class="text-xs text-slate-500 mt-1">Return Period: ${feature.properties.return_period}</p>
            </div>
          `
                });
            }

            if (activeLayers.parks) {
                layers.push({
                    id: 'env-parks',
                    type: 'geojson',
                    data: parks,
                    style: {
                        color: '#22c55e',
                        weight: 2,
                        opacity: 0.8,
                        fillOpacity: 0.5
                    },
                    popup: (feature: any) => `
            <div class="p-2">
              <h3 class="font-bold text-emerald-600">${feature.properties.name}</h3>
              <p class="text-sm">${feature.properties.type}</p>
              <span class="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full mt-1 inline-block">
                ${feature.properties.access}
              </span>
            </div>
          `
                });
            }

            onLayerUpdate({ type: 'multi-layer', layers });
        }
    }, [activeLayers, floodZones, parks, onLayerUpdate, getFloodColor]);

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                <div className="flex items-center gap-2 mb-1">
                    <TreePine className="w-5 h-5 text-emerald-600" />
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                        Environment & Risk
                    </h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    Flood zones, wetlands, and green space access
                </p>
            </div>

            {/* Layer Toggles */}
            <div className="p-4 space-y-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Waves className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Flood Zones</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={activeLayers.floodUtils}
                            onChange={() => toggleLayer('floodUtils')}
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <TreePine className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Parks & Green Space</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={activeLayers.parks}
                            onChange={() => toggleLayer('parks')}
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                </div>
            </div>

            {/* Green Space Analysis Card */}
            <div className="p-4">
                <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <div className="bg-emerald-100 dark:bg-emerald-800 p-2 rounded-full">
                            <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">Green Space Access</h4>
                            {nearestParkDist !== null ? (
                                <div className="mt-1">
                                    <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                                        {nearestParkDist}m
                                    </div>
                                    <p className="text-xs text-emerald-600 dark:text-emerald-500">to nearest park from clicked point</p>
                                </div>
                            ) : (
                                <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">
                                    Click anywhere on the map to calculate distance to the nearest park.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Info Section */}
            <div className="p-4 pt-0">
                <div className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 p-3 rounded border border-slate-100 dark:border-slate-700">
                    <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <p>
                        Flood lines indicate 1:50 and 1:100 year risks.
                        Development in these zones requires detailed environmental impact assessment.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default EnvironmentModule;
