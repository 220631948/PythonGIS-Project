/**
 * Leaflet Type Extensions for Cape Town GeoHub
 * Module augmentation for Leaflet types
 */

import 'leaflet';
import type { GeoJSONFeature, Geometry } from './geojson';
import type { PathOptions } from 'leaflet';

declare module 'leaflet' {
  /**
   * Extended MapOptions interface
   */
  interface MapOptions {
    /** Use canvas renderer for better performance */
    preferCanvas?: boolean;
    /** Custom attribution text */
    customAttribution?: string;
  }

  /**
   * Style function type for GeoJSON layers
   */
  type StyleFunction<P = Record<string, unknown>> = (
    feature?: GeoJSONFeature<P>
  ) => PathOptions;

  /**
   * Extended GeoJSONOptions interface
   */
  interface GeoJSONOptions<P = Record<string, unknown>, G extends Geometry = Geometry> {
    /**
     * Function called for each feature
     */
    onEachFeature?: (
      feature: GeoJSONFeature<P>,
      layer: Layer
    ) => void;

    /**
     * Style function or static options
     */
    style?: StyleFunction<P> | PathOptions;

    /**
     * Function to create markers for Point features
     */
    pointToLayer?: (
      feature: GeoJSONFeature<P>,
      latlng: LatLng
    ) => Layer;

    /**
     * Filter function to determine which features to include
     */
    filter?: (feature: GeoJSONFeature<P>) => boolean;
  }

  /**
   * Extended TileLayerOptions for WMS layers
   */
  interface WMSOptions {
    /** Layer names */
    layers: string;
    /** Output format */
    format?: string;
    /** Transparent background */
    transparent?: boolean;
    /** WMS version */
    version?: string;
    /** CRS for the layer */
    crs?: CRS;
  }

  /**
   * Control options extension
   */
  interface ControlOptions {
    /** Custom CSS class */
    className?: string;
  }
}

/**
 * Extended Leaflet event types
 */
export interface LeafletMouseEventExtended extends L.LeafletMouseEvent {
  /** Geographic coordinates */
  latlng: L.LatLng;
  /** Point in pixels relative to map container */
  containerPoint: L.Point;
  /** Point in pixels relative to layer */
  layerPoint: L.Point;
  /** Original DOM event */
  originalEvent: MouseEvent;
}

/**
 * GeoJSON layer with typed feature access
 */
export interface TypedGeoJSONLayer<P = Record<string, unknown>> extends L.GeoJSON {
  /** Get feature from layer */
  feature?: GeoJSONFeature<P>;
}
