# Cape Town GeoHub - Open Data Portal Integration Workflow

This document outlines the complete workflow for discovering, accessing, importing, visualizing, and modifying GIS data from the City of Cape Town Open Data Portal.

## Portal Information

- **Portal URL**: https://odp-cctegis.opendata.arcgis.com/
- **Data Provider**: City of Cape Town
- **API Base**: ArcGIS REST Services

---

## 1. Discovering and Accessing Datasets

### Available Dataset Categories

The GeoHub provides access to **24+ datasets** organized into 6 categories:

| Category | Count | Description |
|----------|-------|-------------|
| **Imagery** | 2 | Aerial photographs (current and historical) |
| **Boundaries** | 4 | Administrative boundaries (suburbs, wards, subcouncils) |
| **Infrastructure** | 3 | Roads, buildings, public facilities |
| **Environment** | 6 | Wetlands, biodiversity, rivers, flood zones |
| **Planning** | 5 | Zoning, development applications, urban edge |
| **Transport** | 4 | MyCiTi routes/stops, rail network |

### API Endpoints for Discovery

```bash
# List all categories with dataset counts
GET /api/portal/categories

# List all datasets with optional filters
GET /api/portal/datasets?category=environment&geometry_type=Polygon&search=flood

# Get specific dataset metadata
GET /api/portal/datasets/{dataset_id}
```

### Example: Discovering Environmental Datasets

```javascript
// JavaScript example
const response = await fetch('/api/portal/datasets?category=environment');
const data = await response.json();

console.log(`Found ${data.total} environmental datasets:`);
data.datasets.forEach(ds => {
  console.log(`- ${ds.name} (${ds.geometry_type})`);
});
```

---

## 2. Importing Layers into Web Mapping Application

### Fetching GeoJSON Data

```bash
# Fetch full dataset as GeoJSON
GET /api/portal/datasets/{dataset_id}/geojson

# Fetch with bounding box filter
GET /api/portal/datasets/{dataset_id}/geojson?bbox=18.4,−34.1,18.6,−33.8
```

### Accessing Tile Services (for Imagery)

```bash
# Get tile URL for MapServer layers
GET /api/portal/tiles/{dataset_id}
```

Response includes ready-to-use tile URLs for Leaflet and Mapbox:

```json
{
  "tile_url": "https://citymaps.capetown.gov.za/agsext1/rest/services/Imagery/Aerial_2023/MapServer/tile/{z}/{y}/{x}",
  "usage": {
    "leaflet": "L.tileLayer(tile_url, {attribution: 'City of Cape Town GIS'})",
    "mapbox": {
      "type": "raster",
      "tiles": ["tile_url"]
    }
  }
}
```

### Adding Layers in Leaflet

```javascript
// Add GeoJSON layer
const floodZones = await fetch('/api/portal/datasets/flood_zones/geojson');
const data = await floodZones.json();

L.geoJSON(data.geojson, {
  style: feature => ({
    fillColor: getFloodColor(feature.properties.FLOOD_RISK),
    weight: 1,
    opacity: 0.7,
    fillOpacity: 0.5
  }),
  onEachFeature: (feature, layer) => {
    layer.bindPopup(`<b>Flood Risk:</b> ${feature.properties.FLOOD_RISK}`);
  }
}).addTo(map);

// Add aerial imagery as tile layer
L.tileLayer(
  'https://citymaps.capetown.gov.za/agsext1/rest/services/Imagery/Aerial_2023/MapServer/tile/{z}/{y}/{x}',
  { attribution: 'City of Cape Town GIS' }
).addTo(map);
```

---

## 3. Customizing and Styling Layers

### Pre-configured Layer Styles

The GeoHub provides recommended styles for each dataset:

```bash
GET /api/portal/styles/{dataset_id}
```

Response includes colors, opacity, and popup field configuration:

```json
{
  "dataset_id": "zoning",
  "geometry_type": "Polygon",
  "style": {
    "fill_colors": {
      "Residential": "#ffeda0",
      "Commercial": "#feb24c",
      "Industrial": "#fc4e2a",
      "Open Space": "#31a354"
    },
    "stroke_color": "#333333",
    "stroke_width": 1,
    "fill_opacity": 0.6
  },
  "popup_fields": [
    {"field": "ZONE_CODE", "label": "Zone Code"},
    {"field": "ZONE_DESC", "label": "Description"}
  ]
}
```

### Custom Styling Example

```javascript
const zoningStyle = {
  'Residential 1': { color: '#ffffcc', label: 'Low Density Residential' },
  'Residential 2': { color: '#ffeda0', label: 'Medium Density Residential' },
  'Residential 3': { color: '#fed976', label: 'High Density Residential' },
  'General Business': { color: '#feb24c', label: 'Commercial' },
  'Industrial': { color: '#fc4e2a', label: 'Industrial' },
  'Open Space': { color: '#31a354', label: 'Parks & Recreation' }
};

L.geoJSON(zoningData, {
  style: feature => {
    const zone = feature.properties.ZONE_CODE;
    return {
      fillColor: zoningStyle[zone]?.color || '#969696',
      weight: 1,
      color: '#333',
      fillOpacity: 0.6
    };
  }
}).addTo(map);
```

### Basemap Options

```javascript
// Light basemap (default)
const lightBasemap = L.tileLayer(
  'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  { attribution: '© OpenStreetMap, © CARTO' }
);

// Aerial imagery basemap
const aerialBasemap = L.tileLayer(
  'https://citymaps.capetown.gov.za/agsext1/rest/services/Imagery/Aerial_2023/MapServer/tile/{z}/{y}/{x}',
  { attribution: 'City of Cape Town' }
);

// Dark basemap
const darkBasemap = L.tileLayer(
  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  { attribution: '© OpenStreetMap, © CARTO' }
);
```

---

## 4. Modifying and Analyzing Data Layers

### Site Suitability Analysis

The GeoHub provides a comprehensive site suitability analysis tool that evaluates multiple spatial criteria:

```bash
# Analyze a point location
GET /api/suitability/analyze?lat=-33.9249&lng=18.4241&development_type=residential

# Analyze a polygon area
POST /api/suitability/analyze-polygon
{
  "geometry": { "type": "Polygon", "coordinates": [...] },
  "development_type": "commercial"
}

# Compare multiple sites
POST /api/suitability/compare
{
  "sites": [
    {"lat": -33.92, "lng": 18.42},
    {"lat": -33.93, "lng": 18.44}
  ],
  "development_type": "residential"
}
```

### Suitability Criteria

| Criterion | Weight | Description |
|-----------|--------|-------------|
| Flood Risk | 15% | Proximity to 100-year flood zones |
| Biodiversity | 15% | Critical Biodiversity Areas |
| Wetlands | 10% | Wetland buffer compliance |
| Protected Areas | 10% | Nature reserves |
| Zoning | 15% | Land use compatibility |
| Road Access | 10% | Distance to road network |
| Transport Access | 10% | Public transport accessibility |
| Utilities | 5% | Water, electricity, sewer |
| Urban Edge | 10% | Within development boundary |

### Spatial Tools API

```bash
# Point-in-polygon analysis
POST /api/spatial/point-in-polygon
{
  "polygon": { "type": "Polygon", "coordinates": [...] },
  "layers": ["water_points", "clinics", "schools"]
}

# Buffer analysis
POST /api/spatial/buffer
{
  "geometry": { "type": "Point", "coordinates": [18.42, -33.92] },
  "distances": [500, 1000, 2000],
  "layers_to_intersect": ["myciti_stops", "rail_stations"]
}

# Line intersection analysis
POST /api/spatial/line-intersects
{
  "line_geometry": { "type": "LineString", "coordinates": [...] },
  "polygon_layer": "suburbs"
}
```

---

## 5. Publishing and Embedding Visualizations

### Web Visualization Use Cases

#### Use Case 1: Interactive City Planning Viewer

Display development focus areas with multiple overlay options:

```javascript
// Development Focus Areas Viewer
const developmentViewer = {
  baseLayers: {
    'Streets': cartoLight,
    'Aerial': aerialImagery
  },
  overlays: {
    'Development Focus Areas': developmentFocusAreas,
    'Urban Edge': urbanEdge,
    'Zoning': zoning,
    'Informal Settlements': informalSettlements
  },
  tools: {
    suitabilityAnalysis: true,
    drawTools: true,
    exportPDF: true
  }
};
```

#### Use Case 2: Environmental Dashboard

Combine aerial imagery with protected areas and biodiversity networks:

```javascript
// Environmental Dashboard Configuration
const envDashboard = {
  panels: [
    {
      title: 'Protected Areas Coverage',
      type: 'statistics',
      dataset: 'protected_areas',
      metrics: ['total_area', 'count_by_type']
    },
    {
      title: 'Biodiversity Network',
      type: 'map',
      layers: ['biodiversity_network', 'wetlands', 'rivers'],
      basemap: 'aerial'
    },
    {
      title: 'Flood Risk Analysis',
      type: 'heatmap',
      dataset: 'flood_zones'
    }
  ]
};
```

#### Use Case 3: Site Suitability Tool

Overlay multiple spatial criteria for development assessment:

```javascript
// Site Suitability Workflow
async function assessSite(location) {
  // 1. Get suitability analysis
  const analysis = await fetch(
    `/api/suitability/analyze?lat=${location.lat}&lng=${location.lng}&development_type=residential`
  ).then(r => r.json());
  
  // 2. Fetch relevant constraint layers
  const constraints = await Promise.all([
    fetch('/api/portal/datasets/flood_zones/geojson'),
    fetch('/api/portal/datasets/biodiversity_network/geojson'),
    fetch('/api/portal/datasets/wetlands/geojson')
  ]);
  
  // 3. Render analysis results
  renderSuitabilityScore(analysis);
  highlightConstraints(constraints);
  generateReport(analysis);
}
```

### Embedding Options

#### Iframe Embed

```html
<iframe 
  src="https://your-domain.com/?module=planning&layers=zoning,development_focus_areas"
  width="100%" 
  height="600"
  frameborder="0"
></iframe>
```

#### URL State Sharing

The GeoHub supports URL-based state sharing for all views:

```
https://your-domain.com/?lat=-33.9249&lng=18.4241&zoom=14&layers=zoning,flood_zones&theme=dark
```

### Export Options

- **GeoJSON Export**: Download layer data for use in other applications
- **PDF Report**: Generate printable site analysis reports
- **Image Export**: Screenshot current map view
- **URL Sharing**: Copy shareable link with current view state

---

## Example Datasets to Explore

### Aerial Imagery
- `aerial_imagery_2023` - Current high-resolution imagery
- `aerial_imagery_historical` - Historical photographs for change detection

### City Infrastructure
- `roads` - Complete road network with classification
- `buildings` - Building footprints
- `public_facilities` - Schools, clinics, libraries

### Environmental Datasets
- `wetlands` - Wetland areas and buffer zones
- `biodiversity_network` - Critical biodiversity areas
- `flood_zones` - 100-year flood risk areas
- `protected_areas` - Nature reserves

### Planning Datasets
- `zoning` - Land use zoning classifications
- `development_focus_areas` - Priority development areas
- `urban_edge` - Urban development boundary
- `informal_settlements` - Informal settlement boundaries

---

## API Reference

### Portal API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/portal/datasets` | GET | List all datasets |
| `/api/portal/categories` | GET | List categories |
| `/api/portal/datasets/{id}` | GET | Get dataset metadata |
| `/api/portal/datasets/{id}/geojson` | GET | Fetch GeoJSON data |
| `/api/portal/tiles/{id}` | GET | Get tile URL for imagery |
| `/api/portal/styles/{id}` | GET | Get layer styling |

### Suitability API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/suitability/analyze` | GET | Analyze point location |
| `/api/suitability/analyze-polygon` | POST | Analyze polygon area |
| `/api/suitability/compare` | POST | Compare multiple sites |
| `/api/suitability/criteria` | GET | List available criteria |

### Spatial Tools API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/spatial/point-in-polygon` | POST | Count features in polygon |
| `/api/spatial/buffer` | POST | Create buffer analysis |
| `/api/spatial/line-intersects` | POST | Line intersection analysis |
| `/api/spatial/dissolve` | POST | Merge polygons by attribute |

---

## Data Attribution

All data sourced from:
- **City of Cape Town Open Data Portal**: https://odp-cctegis.opendata.arcgis.com/
- **Western Cape Government Open Data**: Various environmental datasets

Please refer to individual dataset metadata for specific licensing and usage terms.

---

## Getting Started

1. Visit http://localhost:8000 to access the GeoHub
2. Open the Data Browser panel to explore available datasets
3. Toggle layers on/off to visualize different data
4. Use the Site Suitability tool to analyze development potential
5. Export your analysis as a report or share via URL
