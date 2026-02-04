import { useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface UrlState {
  lat?: number;
  lng?: number;
  zoom?: number;
  layers?: string[];
  [key: string]: any;
}

export function useUrlState<T extends UrlState>(initialState: T): [T, (updater: T | ((prev: T) => T)) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const isInitialRender = useRef(true);

  // Initialize state from URL params only on mount
  const [state, setState] = useState<T>(() => {
    const params = Object.fromEntries(searchParams.entries());
    const newState = { ...initialState };

    const lat = parseFloat(params.lat || '');
    const lng = parseFloat(params.lng || '');
    const zoom = parseInt(params.zoom || '');

    if (!isNaN(lat)) (newState as any).lat = lat;
    if (!isNaN(lng)) (newState as any).lng = lng;
    if (!isNaN(zoom)) (newState as any).zoom = zoom;
    if (params.layers) (newState as any).layers = params.layers.split(',').filter(Boolean);

    return newState;
  });

  // Sync state to URL in a separate effect
  useEffect(() => {
    // Skip first render to avoid redundant update
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    const params: Record<string, string> = {};
    if (state.lat !== undefined) params.lat = state.lat.toFixed(4);
    if (state.lng !== undefined) params.lng = state.lng.toFixed(4);
    if (state.zoom !== undefined) params.zoom = state.zoom.toString();
    if (state.layers && state.layers.length > 0) {
      params.layers = state.layers.join(',');
    }

    // Check if params actually changed before updating to avoid loops
    const currentParams = Object.fromEntries(searchParams.entries());

    // We only care if the params we manage are different.
    // Using JSON.stringify for deep comparison of the generated params vs current params
    // Note: This assumes currentParams doesn't have extra keys we want to preserve?
    // The original code replaced ALL params: setSearchParams(params, { replace: true })
    // So we replicate that behavior.

    if (JSON.stringify(params) !== JSON.stringify(currentParams)) {
      setSearchParams(params, { replace: true });
    }
  }, [state, setSearchParams, searchParams]);

  const setUrlState = useCallback((updater: T | ((prev: T) => T)) => {
    setState((prev) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
      const next = typeof updater === 'function' ? (updater as Function)(prev) : updater;
      return next;
    });
  }, []);

  return [state, setUrlState];
}
