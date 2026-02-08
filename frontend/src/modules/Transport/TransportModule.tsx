/**
 * TransportModule - Walking Buffer Accessibility Analysis
 * Click on map to analyze MyCiTi stop accessibility
 */

import React from 'react';
import {
    Bus, MapPin, MousePointer, X, Navigation, Clock
} from 'lucide-react';
import { useTransportAnalysis } from './hooks/useTransportAnalysis';

interface TransportModuleProps {
    onBuffersUpdate?: (_buffers: any) => void;
    onMapClick?: (_callback: ((_lat: number, _lng: number) => void) | null) => void;
}

const TransportModule: React.FC<TransportModuleProps> = ({
    onBuffersUpdate,
    onMapClick
}) => {
    const {
        result,
        loading,
        isActive,
        analyzeLocation,
        clearAnalysis,
        toggleActive
    } = useTransportAnalysis();

    // Handle toggle activation
    const handleToggle = () => {
        toggleActive();
        if (!isActive) {
            // Activate: register click handler
            onMapClick?.((lat, lng) => analyzeLocation(lat, lng));
        } else {
            // Deactivate: clear click handler and results
            onMapClick?.(null);
            clearAnalysis();
            onBuffersUpdate?.(null);
        }
    };

    // Update map layers when result changes
    React.useEffect(() => {
        if (result && onBuffersUpdate) {
            onBuffersUpdate({
                buffers: result.buffers,
                center: result.center
            });
        }
    }, [result, onBuffersUpdate]);

    const getAccessibilityLevel = (stops: number): { label: string; color: string } => {
        if (stops >= 5) return { label: 'Excellent', color: 'text-emerald-700' };
        if (stops >= 3) return { label: 'Good', color: 'text-blue-700' };
        if (stops >= 1) return { label: 'Limited', color: 'text-amber-700' };
        return { label: 'Poor', color: 'text-red-700' };
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                <div className="flex items-center gap-2 mb-1">
                    <Bus className="w-5 h-5 text-emerald-600" />
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                        Transport Accessibility
                    </h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    Analyze walking distance to MyCiTi stops
                </p>
            </div>

            {/* Toggle Button */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <button
                    onClick={handleToggle}
                    className={`
            w-full py-3 px-4 rounded-lg font-medium
            flex items-center justify-center gap-2 transition-all
            ${isActive
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-emerald-500'
                        }
          `}
                >
                    {isActive ? (
                        <>
                            <MousePointer className="w-4 h-4" />
                            Click Map to Analyze
                        </>
                    ) : (
                        <>
                            <Navigation className="w-4 h-4" />
                            Enable Map Click Analysis
                        </>
                    )}
                </button>

                {isActive && (
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 text-center mt-2 flex items-center justify-center gap-1">
                        <MapPin className="w-3 h-3" />
                        Click anywhere on the map
                    </p>
                )}
            </div>

            {/* Loading State */}
            {loading && (
                <div className="p-8 text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-2" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">Analyzing accessibility...</p>
                </div>
            )}

            {/* Results */}
            {result && !loading && (
                <div className="flex-1 overflow-auto p-4 space-y-4">
                    {/* Summary Card */}
                    <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Total Stops Accessible</span>
                            <span className={`text-2xl font-bold ${getAccessibilityLevel(result.totalStops).color}`}>
                                {result.totalStops}
                            </span>
                        </div>
                        <div className={`text-sm font-medium ${getAccessibilityLevel(result.totalStops).color}`}>
                            {getAccessibilityLevel(result.totalStops).label} Accessibility
                        </div>
                    </div>

                    {/* Buffer Breakdown */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Walking Distance Breakdown
                        </h3>

                        {[
                            { min: 10, meters: 800, count: result.stopCounts[10] },
                            { min: 20, meters: 1600, count: result.stopCounts[20] },
                            { min: 30, meters: 2400, count: result.stopCounts[30] }
                        ].map((buffer) => (
                            <div
                                key={buffer.min}
                                className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{
                                            backgroundColor: '#3b82f6',
                                            opacity: 1 - (buffer.min / 40)
                                        }}
                                    />
                                    <div>
                                        <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            {buffer.min} min walk
                                        </div>
                                        <div className="text-xs text-slate-400 dark:text-slate-500">
                                            {buffer.meters}m radius
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-bold text-blue-600">
                                        {buffer.count}
                                    </div>
                                    <div className="text-xs text-slate-400 dark:text-slate-500">stops</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Clear Button */}
                    <button
                        onClick={() => {
                            clearAnalysis();
                            onBuffersUpdate?.(null);
                        }}
                        className="w-full py-2 px-4 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-2"
                    >
                        <X className="w-4 h-4" />
                        Clear Analysis
                    </button>
                </div>
            )}

            {/* Empty State */}
            {!result && !loading && (
                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center">
                        <Bus className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                            {isActive ? 'Click on the map to analyze' : 'Enable map click mode'}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                            See MyCiTi stops within walking distance
                        </p>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-400 dark:text-slate-500 text-center">
                Walking speed: 1.2 m/s • Buffer radii: 800m / 1600m / 2400m
            </div>
        </div>
    );
};

export default TransportModule;
