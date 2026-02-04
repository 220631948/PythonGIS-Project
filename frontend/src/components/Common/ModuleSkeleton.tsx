/**
 * ModuleSkeleton - Loading placeholder for modules
 * Shows pulsing skeleton UI while module code is loading
 */

import React from 'react';

const ModuleSkeleton: React.FC = () => {
    return (
        <div className="p-4 animate-pulse">
            {/* Header skeleton */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-slate-200 rounded-lg"></div>
                <div>
                    <div className="h-5 w-32 bg-slate-200 rounded mb-1"></div>
                    <div className="h-3 w-48 bg-slate-100 rounded"></div>
                </div>
            </div>

            {/* Stats cards skeleton */}
            <div className="grid grid-cols-3 gap-2 mb-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-slate-100 rounded-lg p-3">
                        <div className="h-6 w-12 bg-slate-200 rounded mb-1 mx-auto"></div>
                        <div className="h-3 w-10 bg-slate-100 rounded mx-auto"></div>
                    </div>
                ))}
            </div>

            {/* Content section skeleton */}
            <div className="bg-slate-50 rounded-lg p-3 mb-4">
                <div className="h-4 w-24 bg-slate-200 rounded mb-3"></div>
                <div className="space-y-2">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div className="w-4 h-4 bg-slate-200 rounded"></div>
                            <div className="flex-1 h-4 bg-slate-200 rounded"></div>
                            <div className="w-16 h-4 bg-slate-200 rounded"></div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Button skeleton */}
            <div className="h-10 bg-slate-200 rounded-lg w-full"></div>
        </div>
    );
};

export default ModuleSkeleton;
