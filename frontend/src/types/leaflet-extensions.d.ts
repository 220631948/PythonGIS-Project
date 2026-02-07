import * as L from 'leaflet';

declare module 'leaflet' {
    interface Map {
        _layers: Record<string, Layer>;
    }

    namespace Draw {
        namespace Event {
            const CREATED: string;
            const EDITED: string;
            const DELETED: string;
        }
    }

    namespace DrawEvents {
        interface Created {
            layer: Layer;
            layerType: string;
        }
        interface Edited {
            layers: LayerGroup;
        }
        interface Deleted {
            layers: LayerGroup;
        }
    }

    // Draw control options
    interface DrawControlOptions extends L.ControlOptions {
        draw?: Record<string, boolean | Record<string, unknown>>;
        edit?: Record<string, unknown>;
    }

    // MiniMap control options
    interface MiniMapControlOptions extends L.ControlOptions {
        toggleDisplay?: boolean;
        minimized?: boolean;
        width?: number;
        height?: number;
        zoomLevelOffset?: number;
    }

    // Fullscreen control options
    interface FullscreenControlOptions extends L.ControlOptions {
        pseudoFullscreen?: boolean;
        title?: Record<string, string>;
    }

    // Locate control options
    interface LocateControlOptions extends L.ControlOptions {
        setView?: boolean | string;
        flyTo?: boolean;
        keepCurrentZoomLevel?: boolean;
    }

    // Extend the Control class with static properties for plugins that might attach themselves there
    class Control extends L.Class {
        static Draw: new (options?: DrawControlOptions) => L.Control;
        static Fullscreen: new (options?: FullscreenControlOptions) => L.Control;
        static MiniMap: new (layer: L.TileLayer, options?: MiniMapControlOptions) => L.Control;
    }

    namespace Control {
        class Draw extends L.Control {
            constructor(options?: DrawControlOptions);
        }
        class MiniMap extends L.Control {
            constructor(layer: L.TileLayer, options?: MiniMapControlOptions);
        }
    }

    namespace control {
        function fullscreen(options?: FullscreenControlOptions): L.Control;
        function locate(options?: LocateControlOptions): L.Control;
    }

    interface ControlStatic {
        extend(options: Record<string, unknown>): new (...args: unknown[]) => L.Control;
    }
}

declare module '*.png' {
    const value: string;
    export default value;
}
