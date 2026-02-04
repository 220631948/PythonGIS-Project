/// <reference types="vite/client" />

/**
 * Environment Variable Types for Cape Town GeoHub
 * Type definitions for Vite environment variables
 */

interface ImportMetaEnv {
  /** API base URL */
  readonly VITE_API_URL: string;
  /** Map center coordinates as "lat,lng" */
  readonly VITE_MAP_CENTER: string;
  /** Default map zoom level */
  readonly VITE_MAP_ZOOM: string;
  /** Enable offline mode */
  readonly VITE_ENABLE_OFFLINE?: string;
  /** Cache version for busting */
  readonly VITE_CACHE_VERSION?: string;
  /** Current mode */
  readonly MODE: 'development' | 'production' | 'test';
  /** Is development mode */
  readonly DEV: boolean;
  /** Is production mode */
  readonly PROD: boolean;
  /** Is SSR mode */
  readonly SSR: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/**
 * Parsed environment configuration
 */
export interface EnvConfig {
  apiUrl: string;
  mapCenter: [number, number];
  mapZoom: number;
  enableOffline: boolean;
  cacheVersion: string;
  isDev: boolean;
  isProd: boolean;
}

/**
 * Parse environment variables into typed configuration
 */
export function parseEnvConfig(): EnvConfig {
  const centerStr = import.meta.env.VITE_MAP_CENTER || '-33.9249,18.4241';
  const [lat, lng] = centerStr.split(',').map(Number);

  return {
    apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000',
    mapCenter: [lat ?? -33.9249, lng ?? 18.4241],
    mapZoom: Number(import.meta.env.VITE_MAP_ZOOM) || 12,
    enableOffline: import.meta.env.VITE_ENABLE_OFFLINE === 'true',
    cacheVersion: import.meta.env.VITE_CACHE_VERSION || '1.0.0',
    isDev: import.meta.env.DEV,
    isProd: import.meta.env.PROD,
  };
}
