import { useState, useEffect, useCallback } from 'react';

interface GeolocationState {
  position: { lat: number; lng: number } | null;
  accuracy: number | null;
  error: GeolocationPositionError | null;
  loading: boolean;
}

/**
 * useGeolocation hook
 * Accesses the browser's Geolocation API to get the current position.
 */
export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    accuracy: null,
    error: null,
    loading: true,
  });

  const onSuccess = useCallback(({ coords }: GeolocationPosition) => {
    setState({
      position: { lat: coords.latitude, lng: coords.longitude },
      accuracy: coords.accuracy,
      loading: false,
      error: null,
    });
  }, []);

  const onError = useCallback((error: GeolocationPositionError) => {
    setState((s) => ({
      ...s,
      loading: false,
      error,
    }));
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setState((s) => ({
        ...s,
        loading: false,
        error: {
          code: 0,
          message: 'Geolocation not supported',
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        } as GeolocationPositionError,
      }));
      return;
    }

    const watcher = navigator.geolocation.watchPosition(onSuccess, onError, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
    });

    return () => navigator.geolocation.clearWatch(watcher);
  }, [onSuccess, onError]);

  return state;
}

export default useGeolocation;
