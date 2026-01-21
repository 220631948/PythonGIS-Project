/**
 * SpatialAnalysisPopup - Displays analysis results on drawn shapes
 */

import React from 'react';
import { Ruler, Square, MapPin, Layers } from 'lucide-react';
import type { AnalysisResult } from '../hooks/useSpatialAnalysis';

interface SpatialAnalysisPopupProps {
    result: AnalysisResult;
    onClose?: () => void;
}

const SpatialAnalysisPopup: React.FC<SpatialAnalysisPopupProps> = ({ result, onClose }) => {
    return (
        <div className="min-w-[200px] max-w-[280px]">
            {/* Header */}
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                    {result.type === 'polygon' || result.type === 'rectangle' || result.type === 'circle' ? (
                        <Square className="w-4 h-4 text-blue-600" />
                    ) : result.type === 'line' ? (
                        <Ruler className="w-4 h-4 text-emerald-600" />
                    ) : (
                        <MapPin className="w-4 h-4 text-red-600" />
                    )}
                    <span className="font-semibold text-slate-800 capitalize">
                        {result.type} Analysis
                    </span>
                </div>
            </div>

            {/* Measurements */}
            <div className="space-y-2">
                {result.area !== undefined && (
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">Area</span>
                        <span className="text-sm font-bold text-slate-800">
                            {result.areaKm} km²
                            <span className="text-xs text-slate-400 ml-1">
                                ({result.area?.toLocaleString()} m²)
                            </span>
                        </span>
                    </div>
                )}

                {result.length !== undefined && (
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">Length</span>
                        <span className="text-sm font-bold text-slate-800">
                            {result.lengthKm} km
                            <span className="text-xs text-slate-400 ml-1">
                                ({result.length?.toLocaleString()} m)
                            </span>
                        </span>
                    </div>
                )}

                {result.perimeter !== undefined && (
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">Perimeter</span>
                        <span className="text-sm font-bold text-slate-800">
                            {result.perimeter?.toLocaleString()} m
                        </span>
                    </div>
                )}
            </div>

            {/* Feature Counts */}
            {result.featureCounts && Object.keys(result.featureCounts).length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-200">
                    <div className="flex items-center gap-1 mb-2">
                        <Layers className="w-3 h-3 text-purple-600" />
                        <span className="text-xs font-semibold text-slate-600">Features Inside</span>
                    </div>
                    <div className="space-y-1">
                        {Object.entries(result.featureCounts).map(([name, count]) => (
                            <div key={name} className="flex justify-between items-center bg-slate-50 px-2 py-1 rounded">
                                <span className="text-xs text-slate-600">{name}</span>
                                <span className="text-xs font-bold text-purple-700">{count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Centroid */}
            {result.centroid && (
                <div className="mt-2 pt-2 border-t border-slate-100">
                    <div className="text-[10px] text-slate-400">
                        Center: {result.centroid[1].toFixed(5)}, {result.centroid[0].toFixed(5)}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SpatialAnalysisPopup;
