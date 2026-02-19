import { useState, useCallback } from 'react';
import { useUrlState, UrlState } from './useUrlState';
import { useToast } from '../components/Common';

const DEFAULT_STATE: UrlState = {
    lat: -33.9249,
    lng: 18.4241,
    zoom: 11,
    layers: [],
    basemap: 'streets'
};

/**
 * useMapLogic Hook
 *
 * Consolidates all map-related state and logic.
 * Manages URL state sync, map interactions, and layer handling.
 */
export function useMapLogic(analyzeGeometry: (geometry: any, type: string) => void) {
    const [urlState, setUrlState] = useUrlState(DEFAULT_STATE);
    const [loadingLayers, setLoadingLayers] = useState<string[]>([]);
    const [flyTo, setFlyTo] = useState<any>(null);
    const [clickedLocation, setClickedLocation] = useState<any>(null);
    const [moduleLayerData, setModuleLayerData] = useState<any>(null);

    // These could be expanded with their own hooks later
    const [routeData] = useState<any>(null);
    const [isochroneData] = useState<any>(null);
    const [activeFilters] = useState<any>({});

    const { addToast } = useToast();

    const handleLayerToggle = useCallback((layerId: string) => {
        setUrlState(prev => {
            const currentLayers = prev.layers || [];
            const newLayers = currentLayers.includes(layerId)
                ? currentLayers.filter(l => l !== layerId)
                : [...currentLayers, layerId];

            const action = currentLayers.includes(layerId) ? 'Removed' : 'Added';

            // Use queueMicrotask to defer notification to avoid React render cycle issues
            queueMicrotask(() => {
                addToast(`${action} layer: ${layerId}`, 'info');
            });

            return { ...prev, layers: newLayers };
        });
    }, [setUrlState, addToast]);

    const handleBasemapChange = useCallback((basemap: string) => {
        setUrlState(prev => ({ ...prev, basemap }));
    }, [setUrlState]);

    const handleMapMove = useCallback((moveState: any) => {
        setUrlState(prev => ({
            ...prev,
            lat: moveState.lat,
            lng: moveState.lng,
            zoom: moveState.zoom
        }));
    }, [setUrlState]);

    const handleSearch = (location: any) => {
        setFlyTo({
            lat: location.lat,
            lng: location.lng,
            zoom: location.zoom || 14
        });
        setClickedLocation({ lat: location.lat, lng: location.lng });
        addToast(`Found: ${location.name}`, 'success');
    };

    const handleModuleLayerUpdate = (data: any) => {
        setModuleLayerData(data);
    };

    const handleLayerLoading = useCallback((id: string, loading: boolean) => {
        setLoadingLayers(prev =>
            loading ? [...prev, id] : prev.filter(l => l !== id)
        );
    }, []);

    const handleGeometryCreated = useCallback((e: any) => {
        const { layer, type, geometry } = e;

        // Analyze using the passed analyzeGeometry function
        analyzeGeometry(geometry, type);

        // Create popup content
        const popupContent = `
      <div class="leaflet-popup-content-wrapper-reset">
        <div class="spatial-analysis-popup">
          <h4 style="margin-bottom: 0.5rem; color: var(--color-text-primary)">Analysis Complete</h4>
          <p style="font-size: 0.8rem; color: var(--color-text-secondary)">Type: ${type}</p>
          <div style="margin-top: 0.5rem; padding: 0.5rem; background: var(--color-bg-secondary); border-radius: 4px;">
            <p style="font-size: 0.75rem">Geometry results verified.</p>
          </div>
        </div>
      </div>
    `;

        layer.bindPopup(popupContent).openPopup();

        addToast(`${type} analysis complete`, 'success');
    }, [analyzeGeometry, addToast]);

    return {
        urlState,
        setUrlState,
        loadingLayers,
        handleLayerLoading,
        flyTo,
        clickedLocation,
        moduleLayerData,
        routeData,
        isochroneData,
        activeFilters,
        handleLayerToggle,
        handleBasemapChange,
        handleMapMove,
        handleSearch,
        handleModuleLayerUpdate,
        handleGeometryCreated
    };
}
