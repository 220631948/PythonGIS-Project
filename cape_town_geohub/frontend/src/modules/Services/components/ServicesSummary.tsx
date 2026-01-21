/**
 * ServicesSummary Component
 * Grid of 3 cards showing: Total Settlements, Avg Access Score, High Priority Count
 */

import React from 'react';
import { Building2, BarChart3, AlertTriangle } from 'lucide-react';
import type { AnalysisStats } from '../hooks/useServicesAnalysis';

interface ServicesSummaryProps {
    stats: AnalysisStats | null;
    loading?: boolean;
}

const ServicesSummary: React.FC<ServicesSummaryProps> = ({ stats, loading }) => {
    if (loading) {
        return (
            <div className="grid grid-cols-3 gap-3 p-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-slate-100 animate-pulse rounded-lg p-4 h-20" />
                ))}
            </div>
        );
    }

    if (!stats) {
        return null;
    }

    const cards = [
        {
            label: 'Total Settlements',
            value: stats.total,
            icon: Building2,
            bgColor: 'bg-slate-50',
            textColor: 'text-slate-700',
            iconColor: 'text-slate-500'
        },
        {
            label: 'Avg Access Score',
            value: stats.averageScore,
            icon: BarChart3,
            bgColor: stats.averageScore >= 70 ? 'bg-emerald-50' : stats.averageScore >= 40 ? 'bg-amber-50' : 'bg-red-50',
            textColor: stats.averageScore >= 70 ? 'text-emerald-700' : stats.averageScore >= 40 ? 'text-amber-700' : 'text-red-700',
            iconColor: stats.averageScore >= 70 ? 'text-emerald-500' : stats.averageScore >= 40 ? 'text-amber-500' : 'text-red-500'
        },
        {
            label: 'High Priority',
            value: stats.highPriorityCount,
            icon: AlertTriangle,
            bgColor: 'bg-red-50',
            textColor: 'text-red-700',
            iconColor: 'text-red-500'
        }
    ];

    return (
        <div className="grid grid-cols-3 gap-3 p-4">
            {cards.map((card) => (
                <div
                    key={card.label}
                    className={`${card.bgColor} rounded-lg p-3 text-center transition-transform hover:scale-105`}
                >
                    <card.icon className={`w-5 h-5 mx-auto mb-1 ${card.iconColor}`} />
                    <div className={`text-2xl font-bold ${card.textColor}`}>
                        {card.value}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                        {card.label}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ServicesSummary;
