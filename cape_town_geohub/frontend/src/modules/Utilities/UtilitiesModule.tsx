/**
 * UtilitiesModule
 * Waste Collection and Services
 */

import React, { useEffect } from 'react';
import { Trash2, AlertTriangle, Truck } from 'lucide-react';
import { useUtilitiesData } from './hooks/useUtilitiesData';

interface UtilitiesModuleProps {
    onLayerUpdate?: (_layerData: any) => void;
    clickedLocation?: { lat: number; lng: number } | null;
}

const UtilitiesModule: React.FC<UtilitiesModuleProps> = ({
    onLayerUpdate,
    clickedLocation
}) => {
    const { wasteZones, active, toggleLayer, reportIssue } = useUtilitiesData();

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
                    id: 'utils-waste',
                    type: 'geojson',
                    data: wasteZones,
                    style: (feature: any) => ({
                        color: feature.properties.color,
                        weight: 2,
                        opacity: 1,
                        fillOpacity: 0.5
                    }),
                    popup: (feature: any) => `
            <div class="p-2">
              <div class="flex items-center gap-2 mb-2">
                <span class="font-bold text-white px-2 py-0.5 rounded-full text-xs bg-slate-700">
                  ${feature.properties.suburb}
                </span>
              </div>
              <div class="border-l-4 border-amber-400 pl-3 py-1 bg-amber-50 rounded-r">
                <span class="text-xs text-amber-700 uppercase font-bold block">Refuse Collection</span>
                <span class="text-lg font-bold text-slate-800">${feature.properties.collection_day}</span>
              </div>
              <div class="mt-2 text-xs text-slate-500">
                Recycling: ${feature.properties.recycling_day}
              </div>
            </div>
          `
                });
            } else {
                onLayerUpdate(null);
            }
        }
    }, [active, wasteZones, onLayerUpdate]);

    const handleReportIssue = (type: string) => {
        // Determine location (use center or clicked point)
        const lat = clickedLocation ? clickedLocation.lat : -33.9249;
        const lng = clickedLocation ? clickedLocation.lng : 18.4241;

        reportIssue(lat, lng, type);
        alert(`Reported ${type} at [${lat.toFixed(4)}, ${lng.toFixed(4)}]. Check console.`);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 bg-white">
                <div className="flex items-center gap-2 mb-1">
                    <Trash2 className="w-5 h-5 text-amber-600" />
                    <h2 className="text-lg font-semibold text-slate-800">
                        Utilities & Waste
                    </h2>
                </div>
                <p className="text-xs text-slate-500">
                    Collection schedules and service reporting
                </p>
            </div>

            {/* Layer Control */}
            <div className="p-4 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-amber-600" />
                        <span className="text-sm font-medium text-slate-700">Collection Zones</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={active}
                            onChange={toggleLayer}
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                    </label>
                </div>
            </div>

            {/* Report Issue Actions */}
            <div className="p-4">
                <h3 className="text-xs font-semibold text-slate-500 uppercase mb-3">Report Service Issue</h3>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => handleReportIssue('Missed Collection')}
                        className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        <Trash2 className="w-5 h-5 text-red-500 mb-1" />
                        <span className="text-xs font-medium text-slate-700">Missed Collection</span>
                    </button>

                    <button
                        onClick={() => handleReportIssue('Illegal Dumping')}
                        className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        <AlertTriangle className="w-5 h-5 text-amber-500 mb-1" />
                        <span className="text-xs font-medium text-slate-700">Illegal Dumping</span>
                    </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 text-center">
                    * Reports are logged to console (demo mode)
                </p>
            </div>

            {/* Schedule Info */}
            <div className="p-4 pt-0 mt-auto">
                <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                    <h4 className="text-xs font-bold text-amber-800 mb-1">Holiday Schedule</h4>
                    <div className="flex justify-between items-center text-xs text-amber-700">
                        <span>Human Rights Day</span>
                        <span className="font-semibold">No Collection</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UtilitiesModule;
