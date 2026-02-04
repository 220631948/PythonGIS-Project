# Example: Building a map component

**User Request**
"Create a map component that displays GeoJSON layers with toggle controls"

**Copilot Response**
1. TypeScript component with props interface
2. Leaflet map initialization
3. GeoJSON layer rendering
4. Layer toggle state management
5. Loading and error states
6. Accessibility attributes
7. Component tests

```tsx
interface MapProps {
  layers: GeoJSON.FeatureCollection[];
}

export const MapView: React.FC<MapProps> = ({ layers }) => {
  // ... implementation ...
}
```
