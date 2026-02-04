# Generate Vitest/RTL Component Tests

**Context requirements:**
- Component path and props interface
- Expected user interactions and keyboard access
- Loading/error states and data dependencies
- GeoJSON or map-related behaviors (if any)

**Prompt structure:**
- Mount component with React Testing Library
- Mock API hooks/clients; provide sample props
- Assert ARIA labels, keyboard navigation, and visible text
- Cover state transitions: loading → success → error
- Snapshot only for stable UI pieces; prefer behavioral asserts

**Example usage:**
- "Test LayerToggle component for checkbox/keyboard toggles"
- "Test GeoJSONLayer renders features and handles empty collections"
