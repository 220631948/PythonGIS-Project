import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';

/**
 * useCollaborationMarkers Hook
 *
 * Fetches and manages collaboration markers.
 *
 * @param isOnline Whether the application is currently online.
 * @returns [collaborationMarkers, setCollaborationMarkers]
 */
export function useCollaborationMarkers(isOnline: boolean) {
    const [collaborationMarkers, setCollaborationMarkers] = useState<any[]>([]);

    useEffect(() => {
        let mounted = true;
        const controller = new AbortController();

        const fetchMarkers = async () => {
            try {
                const markers = await apiClient.getMarkers() as any[];
                if (mounted) {
                    setCollaborationMarkers(markers);
                }
            } catch (error: any) {
                if (error.name !== 'AbortError' && mounted) {
                    console.error("Failed to fetch collaboration markers:", error);
                }
            }
        };

        if (isOnline) {
            fetchMarkers();
        }

        return () => {
            mounted = false;
            controller.abort();
        };
    }, [isOnline]);

    return [collaborationMarkers, setCollaborationMarkers] as const;
}
