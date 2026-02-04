/**
 * SafetyModule - Ethical Crime Visualization
 * Choropleth map with precinct-level aggregated data
 */

import React from 'react';
import { Shield, Calendar, MapPin } from 'lucide-react';
import EthicalDisclaimer from './components/EthicalDisclaimer';
import {
    useSafetyAnalysis,
    type TimeRange,
    type PrecinctFeature,
    getCrimeColor,
    getCrimeLevel
} from './hooks/useSafetyAnalysis';

interface SafetyModuleProps {
    onLayerUpdate?: (_layerData: any) => void;
    onPrecinctSelect?: (_precinct: PrecinctFeature) => void;
}

const SafetyModule: React.FC<SafetyModuleProps> = ({
    onLayerUpdate,
    onPrecinctSelect
}) => {
    const {
        data,
        stats,
        selectedPrecinct,
        timeRange,
        loading,
        changeTimeRange,
        selectPrecinct
    } = useSafetyAnalysis();

    // Update map layer when data changes
    React.useEffect(() => {
        if (onLayerUpdate) {
            onLayerUpdate({
                type: 'choropleth',
                data: data,
                colorFn: getCrimeColor
            });
        }
    }, [data, onLayerUpdate]);

    const timeRanges: { value: TimeRange; label: string }[] = [
        { value: 'Q1_2024', label: 'Q1 2024' },
        { value: 'Q2_2024', label: 'Q2 2024' },
        { value: 'Q3_2024', label: 'Q3 2024' },
        { value: 'Q4_2024', label: 'Q4 2024' }
    ];

    const handlePrecinctClick = (precinct: PrecinctFeature) => {
        selectPrecinct(precinct);
        onPrecinctSelect?.(precinct);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 bg-white">
                <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-5 h-5 text-red-600" />
                    <h2 className="text-lg font-semibold text-slate-800">
                        Safety Analysis
                    </h2>
                </div>
                <p className="text-xs text-slate-500">
                    Precinct-level crime patterns (aggregated)
                </p>
            </div>

            {/* Ethical Disclaimer - ALWAYS VISIBLE */}
            <EthicalDisclaimer className="m-4 mb-0" />

            {/* Time Range Filter */}
            <div className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="w-4 h-4" />
                    <span className="font-medium">Time Period</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                    {timeRanges.map(range => (
                        <button
                            key={range.value}
                            onClick={() => changeTimeRange(range.value)}
                            className={`
                px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                ${timeRange === range.value
                                    ? 'bg-red-100 text-red-700 border-2 border-red-300'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-2 border-transparent'
                                }
              `}
                        >
                            {range.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Summary */}
            <div className="px-4 pb-4">
                <div className="grid grid-cols-3 gap-2">
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-green-700">{stats.lowRisk}</div>
                        <div className="text-xs text-green-600">Low</div>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-amber-700">{stats.mediumRisk}</div>
                        <div className="text-xs text-amber-600">Moderate</div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-red-700">{stats.highRisk}</div>
                        <div className="text-xs text-red-600">Elevated+</div>
                    </div>
                </div>
            </div>

            {/* Precinct List */}
            <div className="flex-1 overflow-auto border-t border-slate-200">
                <div className="p-3 bg-slate-50 border-b border-slate-100">
                    <h3 className="text-sm font-semibold text-slate-700">
                        Precincts ({stats.totalPrecincts})
                    </h3>
                </div>

                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full mx-auto" />
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {data.features
                            .sort((a, b) => b.properties.crime_index - a.properties.crime_index)
                            .map(precinct => (
                                <div
                                    key={precinct.properties.id}
                                    onClick={() => handlePrecinctClick(precinct)}
                                    className={`
                    p-3 cursor-pointer transition-colors hover:bg-slate-50
                    ${selectedPrecinct?.properties.id === precinct.properties.id ? 'bg-red-50' : ''}
                  `}
                                    style={{
                                        borderLeft: `4px solid ${getCrimeColor(precinct.properties.crime_index)}`
                                    }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-slate-400" />
                                            <span className="text-sm font-medium text-slate-700">
                                                {precinct.properties.name}
                                            </span>
                                        </div>
                                        <span
                                            className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                            style={{
                                                backgroundColor: getCrimeColor(precinct.properties.crime_index) + '20',
                                                color: getCrimeColor(precinct.properties.crime_index)
                                            }}
                                        >
                                            {getCrimeLevel(precinct.properties.crime_index)}
                                        </span>
                                    </div>
                                    <div className="mt-1 flex items-center gap-4 text-xs text-slate-500">
                                        <span>Index: {precinct.properties.crime_index}</span>
                                        <span>Pop: {precinct.properties.population.toLocaleString()}</span>
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </div>

            {/* Legend */}
            <div className="p-3 bg-slate-50 border-t border-slate-200">
                <div className="text-xs text-slate-500 mb-2">Crime Index Legend</div>
                <div className="flex gap-2">
                    {[
                        { label: '0-35', color: '#22c55e' },
                        { label: '36-60', color: '#eab308' },
                        { label: '61-80', color: '#f97316' },
                        { label: '81+', color: '#ef4444' }
                    ].map(item => (
                        <div key={item.label} className="flex items-center gap-1">
                            <div
                                className="w-3 h-3 rounded"
                                style={{ backgroundColor: item.color }}
                            />
                            <span className="text-xs text-slate-500">{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SafetyModule;
