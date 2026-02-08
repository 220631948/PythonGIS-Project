/**
 * ServicesModule - Main Container Component
 * Reference Implementation for Cape Town GeoHub Modules
 * Analyzes service access for informal settlements
 */

import React, { useEffect } from 'react';
import { RefreshCw, Play, Building2 } from 'lucide-react';

// Components
import ServicesSummary from './components/ServicesSummary';
import SettlementsTable from './components/SettlementsTable';
import LoadingBoundary from '../../components/LoadingBoundary';

// Hooks
import { useServicesAnalysis, type AnalyzedSettlement } from './hooks/useServicesAnalysis';

interface ServicesModuleProps {
    onLayerUpdate?: (_layerData: any) => void;
    onSettlementSelect?: (_settlement: AnalyzedSettlement) => void;
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
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                <div className="flex items-center gap-2 mb-1">
                    <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                        Service Access Analysis
                    </h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    Analyze access to water, health & education services
                </p>
            </div>

            {/* Action Button */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <button
                    onClick={runAnalysis}
                    disabled={loading}
                    className={`
            w-full py-3 px-4 rounded-lg font-medium text-white
            flex items-center justify-center gap-2 transition-all
            ${loading
                            ? 'bg-slate-400 dark:bg-slate-600 cursor-not-allowed'
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

            {/* Content Area */}
            <div className="flex-1 overflow-auto">
                <LoadingBoundary
                    loading={loading}
                    error={error}
                    onRetry={runAnalysis}
                    variant="compact"
                    skeletonType="list"
                >
                    {isAnalyzed && (
                        <>
                            <ServicesSummary stats={stats} loading={false} />

                            <div className="px-4 py-2">
                                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                                    Settlements by Access Level
                                </h3>
                            </div>
                            <SettlementsTable
                                settlements={data}
                                onSettlementClick={handleSettlementClick}
                                selectedId={selectedSettlement?.id}
                            />
                        </>
                    )}
                </LoadingBoundary>
            </div>

            {/* Empty State */}
            {!isAnalyzed && !loading && !error && (
                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center">
                        <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                            Click "Run Analysis" to calculate
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                            service access scores for settlements
                        </p>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-400 dark:text-slate-500 text-center">
                Scoring: Water 40% • Health 30% • Education 30%
            </div>
        </div>
    );
};

export default ServicesModule;
