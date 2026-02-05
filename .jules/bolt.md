## 2025-01-28 - React-Leaflet Layer Recreation Anti-Pattern
**Learning:** `L.geoJSON` layers in `useEffect` are expensive to recreate. Including unstable callback props (like `onFeatureClick`) in the dependency array causes full layer destruction and recreation on every parent render if the parent passes inline functions.
**Action:** Use `useRef` to hold stable references to event callbacks and update them in a separate `useEffect`. Use the refs inside the layer event listeners to avoid adding callbacks to the main effect's dependencies.
