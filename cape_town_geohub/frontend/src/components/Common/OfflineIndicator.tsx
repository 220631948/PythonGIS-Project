/**
 * OfflineIndicator - Shows online/offline status in header
 */

import React, { useEffect, useState } from 'react';
import { Cloud, CloudOff } from 'lucide-react';

interface OfflineIndicatorProps {
    isOnline?: boolean;
    className?: string;
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
    isOnline: isOnlineProp,
    className = ''
}) => {
    const [isOnline, setIsOnline] = useState(() =>
        isOnlineProp !== undefined ? isOnlineProp : navigator.onLine
    );

    useEffect(() => {
        if (isOnlineProp !== undefined) {
            setIsOnline(isOnlineProp);
            return;
        }

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [isOnlineProp]);

    if (isOnline) {
        return (
            <div className={`flex items-center gap-1.5 px-2 py-1 bg-emerald-50 rounded-full ${className}`}>
                <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-xs font-medium text-emerald-700">Online</span>
            </div>
        );
    }

    return (
        <div className={`flex items-center gap-1.5 px-2 py-1 bg-amber-50 rounded-full animate-pulse ${className}`}>
            <CloudOff className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-xs font-medium text-amber-700">Offline</span>
        </div>
    );
};

export default OfflineIndicator;
