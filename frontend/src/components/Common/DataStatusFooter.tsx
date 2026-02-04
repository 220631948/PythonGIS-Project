/**
 * DataStatusFooter - Shows data loading/network status
 * Displays in sidebar footer
 */

import React from 'react';
import { Wifi, WifiOff, Loader2, CheckCircle } from 'lucide-react';

interface DataStatusFooterProps {
    isOnline: boolean;
    isLoading?: boolean;
    loadingMessage?: string;
}

const DataStatusFooter: React.FC<DataStatusFooterProps> = ({
    isOnline,
    isLoading = false,
    loadingMessage = 'Fetching CCT Data...'
}) => {
    if (!isOnline) {
        return (
            <div className="px-3 py-2 bg-red-50 border-t border-red-100 flex items-center gap-2">
                <WifiOff className="w-4 h-4 text-red-500" />
                <span className="text-xs font-medium text-red-600">Offline Mode</span>
                <span className="text-xs text-red-400 ml-auto">Using cached data</span>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="px-3 py-2 bg-amber-50 border-t border-amber-100 flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                <span className="text-xs font-medium text-amber-600">{loadingMessage}</span>
            </div>
        );
    }

    return (
        <div className="px-3 py-2 bg-emerald-50 border-t border-emerald-100 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-medium text-emerald-600">System Online</span>
            <span className="text-xs text-emerald-400 ml-auto flex items-center gap-1">
                <Wifi className="w-3 h-3" />
                CCT OpenData
            </span>
        </div>
    );
};

export default DataStatusFooter;
