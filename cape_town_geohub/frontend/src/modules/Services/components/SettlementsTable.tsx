/**
 * SettlementsTable Component
 * Table listing settlements with color-coded Access Level badges
 */

import React from 'react';
import { MapPin, ChevronRight } from 'lucide-react';
import type { AnalyzedSettlement } from '../hooks/useServicesAnalysis';

interface SettlementsTableProps {
    settlements: AnalyzedSettlement[];
    onSettlementClick?: (settlement: AnalyzedSettlement) => void;
    selectedId?: string | number;
}

const SettlementsTable: React.FC<SettlementsTableProps> = ({
    settlements,
    onSettlementClick,
    selectedId
}) => {
    if (!settlements.length) {
        return (
            <div className="p-6 text-center text-slate-500">
                <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No settlements analyzed yet</p>
            </div>
        );
    }

    const getAccessBadge = (level: string, score: number) => {
        const baseClasses = 'px-2 py-0.5 rounded-full text-xs font-semibold';

        switch (level) {
            case 'HIGH':
                return (
                    <span className={`${baseClasses} bg-emerald-100 text-emerald-700`}>
                        {score} - High
                    </span>
                );
            case 'MEDIUM':
                return (
                    <span className={`${baseClasses} bg-amber-100 text-amber-700`}>
                        {score} - Medium
                    </span>
                );
            case 'LOW':
                return (
                    <span className={`${baseClasses} bg-red-100 text-red-700`}>
                        {score} - Low
                    </span>
                );
            default:
                return null;
        }
    };

    return (
        <div className="divide-y divide-slate-100">
            {/* Header */}
            <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-slate-50 text-xs font-semibold text-slate-500 uppercase">
                <div className="col-span-5">Settlement</div>
                <div className="col-span-3 text-right">Population</div>
                <div className="col-span-4 text-right">Access Level</div>
            </div>

            {/* Rows */}
            {settlements.map((settlement) => (
                <div
                    key={settlement.id}
                    onClick={() => onSettlementClick?.(settlement)}
                    className={`
            grid grid-cols-12 gap-2 px-4 py-3 cursor-pointer transition-colors
            ${selectedId === settlement.id ? 'bg-blue-50' : 'hover:bg-slate-50'}
          `}
                    style={{
                        borderLeft: `4px solid ${settlement.accessScore.color}`
                    }}
                >
                    <div className="col-span-5 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span className="text-sm font-medium text-slate-700 truncate">
                            {settlement.name}
                        </span>
                    </div>
                    <div className="col-span-3 text-right text-sm text-slate-500">
                        {settlement.population.toLocaleString()}
                    </div>
                    <div className="col-span-4 flex items-center justify-end gap-1">
                        {getAccessBadge(settlement.accessScore.level, settlement.accessScore.score)}
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default SettlementsTable;
