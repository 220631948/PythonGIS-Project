import { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export function useUrlState(initialState) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [state, setState] = useState(() => {
    const params = Object.fromEntries(searchParams.entries());
    const newState = { ...initialState };
    
    if (params.lat) newState.lat = parseFloat(params.lat);
    if (params.lng) newState.lng = parseFloat(params.lng);
    if (params.zoom) newState.zoom = parseInt(params.zoom);
    if (params.layers) newState.layers = params.layers.split(',');
    
    return newState;
  });

  const updateUrl = useCallback((newState) => {
    const params = {};
    if (newState.lat) params.lat = newState.lat.toFixed(4);
    if (newState.lng) params.lng = newState.lng.toFixed(4);
    if (newState.zoom) params.zoom = newState.zoom.toString();
    if (newState.layers && newState.layers.length > 0) {
      params.layers = newState.layers.join(',');
    }
    setSearchParams(params, { replace: true });
  }, [setSearchParams]);

  const setUrlState = useCallback((updater) => {
    setState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      updateUrl(next);
      return next;
    });
  }, [updateUrl]);

  return [state, setUrlState];
}
