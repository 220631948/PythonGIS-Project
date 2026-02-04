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

    // Extend the Control class with static properties for plugins that might attach themselves there
    class Control extends L.Class {
        static Draw: any;
        static Fullscreen: any;
        static MiniMap: any;
    }

    namespace Control {
        class Draw extends L.Control {
            constructor(options?: any);
        }
        class MiniMap extends L.Control {
            constructor(layer: L.TileLayer, options?: any);
        }
    }

    namespace control {
        function fullscreen(options?: any): L.Control;
        function locate(options?: any): L.Control;
    }

    interface ControlStatic {
        extend(options: any): any;
    }
}

declare module '*.png' {
    const value: string;
    export default value;
}
