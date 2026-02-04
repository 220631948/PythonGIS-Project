# Generate Map Layer Toggle Component

**Context requirements:**
- Target layers and identifiers
- MapContext usage (center/zoom/active layers)
- Accessibility requirements (keyboard toggles, aria-labels)
- Loading/error indicators for layer fetches

**Prompt structure:**
- Define typed props interface (layers, onToggle)
- Manage toggle state with controlled/uncontrolled patterns
- Wire to Leaflet layer visibility; memoize GeoJSON rendering
- Include keyboard support and focus styles using CSS vars
- Provide Vitest tests for toggle behavior and ARIA compliance

**Example usage:**
- "Create a LayerToggle component for services and transport layers"
- "Add map keyboard shortcuts for cycling active layers"
