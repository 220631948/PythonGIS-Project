/**
 * Type definitions for leaflet.heat
 * Manual type definitions to fix TS7016 error
 */

declare module 'leaflet.heat' {
  import * as L from 'leaflet';

  interface HeatLatLngTuple extends Array<number> {
    0: number; // latitude
    1: number; // longitude
    2?: number; // intensity (optional)
  }

  interface HeatLayerOptions {
    minOpacity?: number;
    maxZoom?: number;
    max?: number;
    radius?: number;
    blur?: number;
    gradient?: { [key: number]: string };
  }

  export function heatLayer(
    latlngs: HeatLatLngTuple[],
    options?: HeatLayerOptions
  ): L.Layer;

  namespace L {
    function heatLayer(
      latlngs: HeatLatLngTuple[],
      options?: HeatLayerOptions
    ): Layer;
  }
}
