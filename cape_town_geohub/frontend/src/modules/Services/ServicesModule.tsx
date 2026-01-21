/**
 * ServicesModule - Main Container Component
 * Reference Implementation for Cape Town GeoHub Modules
 * Analyzes service access for informal settlements
 */

import React, { useEffect } from 'react';
import { RefreshCw, Play, AlertCircle, Building2 } from 'lucide-react';

// Components
import ServicesSummary from './components/ServicesSummary';
import SettlementsTable from './components/SettlementsTable';

// Hooks
import { useServicesAnalysis, type AnalyzedSettlement } from './hooks/useServicesAnalysis';

interface ServicesModuleProps {
    onLayerUpdate?: (layerData: any) => void;
    onSettlementSelect?: (settlement: AnalyzedSettlement) => void;
}

const ServicesModule: React.FC<ServicesModuleProps> = ({
    onLayerUpdate,
    onSettlementSelect
}) => {
    const { data, loading, error, stats, runAnalysis, isAnalyzed } = useServicesAnalysis();
    const [selectedSettlement, setSelectedSettlement] = React.useState<AnalyzedSettlement | null>(null);

    // When analysis completes, notify parent to update map layer
    useEffect(() => {
        if (isAnalyzed && data.length > 0 && onLayerUpdate) {
            // Create GeoJSON layer data with color-coded features
            const layerData = {
                type: 'FeatureCollection',
                features: data.map((settlement) => ({
                    type: 'Feature',
                    properties: {
                        id: settlement.id,
                        name: settlement.name,
                        score: settlement.accessScore.score,
                        level: settlement.accessScore.level,
                        color: settlement.accessScore.color,
                        population: settlement.population
                    },
                    geometry: {
                        type: 'Point',
                        coordinates: settlement.centroid
                    }
                }))
            };
            onLayerUpdate(layerData);
        }
    }, [isAnalyzed, data, onLayerUpdate]);

    const handleSettlementClick = (settlement: AnalyzedSettlement) => {
        setSelectedSettlement(settlement);
        onSettlementSelect?.(settlement);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 bg-white">
                <div className="flex items-center gap-2 mb-1">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-slate-800">
                        Service Access Analysis
                    </h2>
                </div>
                <p className="text-xs text-slate-500">
                    Analyze access to water, health & education services
                </p>
            </div>

            {/* Action Button */}
            <div className="p-4 bg-slate-50 border-b border-slate-200">
                <button
                    onClick={runAnalysis}
                    disabled={loading}
                    className={`
            w-full py-3 px-4 rounded-lg font-medium text-white
            flex items-center justify-center gap-2 transition-all
            ${loading
                            ? 'bg-slate-400 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-700 active:scale-98'
                        }
          `}
                >
                    {loading ? (
                        <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Analyzing...
                        </>
                    ) : isAnalyzed ? (
                        <>
                            <RefreshCw className="w-4 h-4" />
                            Re-Analyze
                        </>
                    ) : (
                        <>
                            <Play className="w-4 h-4" />
                            Run Analysis
                        </>
                    )}
                </button>
            </div>

            {/* Error Display */}
            {error && (
                <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-red-700">{error}</span>
                </div>
            )}

            {/* Stats Summary */}
            {isAnalyzed && <ServicesSummary stats={stats} loading={loading} />}

            {/* Settlements Table */}
            {isAnalyzed && (
                <div className="flex-1 overflow-auto">
                    <div className="px-4 py-2">
                        <h3 className="text-sm font-semibold text-slate-700 mb-2">
                            Settlements by Access Level
                        </h3>
                    </div>
                    <SettlementsTable
                        settlements={data}
                        onSettlementClick={handleSettlementClick}
                        selectedId={selectedSettlement?.id}
                    />
                </div>
            )}

            {/* Empty State */}
            {!isAnalyzed && !loading && !error && (
                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center">
                        <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                        <p className="text-sm text-slate-500 mb-1">
                            Click "Run Analysis" to calculate
                        </p>
                        <p className="text-xs text-slate-400">
                            service access scores for settlements
                        </p>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-400 text-center">
                Scoring: Water 40% • Health 30% • Education 30%
            </div>
        </div>
    );
};

export default ServicesModule;
