# Cape Town GeoHub - Enhanced Features Guide

This guide documents the new enhanced features added to Cape Town GeoHub, including multi-layer visualization, advanced spatial analysis, network routing, analytics dashboard, and improved user experience.

## Table of Contents

1. [Multi-Layer Visualization](#multi-layer-visualization)
2. [Search & Geocoding](#search--geocoding)
3. [Advanced Filtering](#advanced-filtering)
4. [Network Analysis](#network-analysis)
5. [Temporal Animation](#temporal-animation)
6. [Analytics Dashboard](#analytics-dashboard)
7. [Custom Symbology](#custom-symbology)
8. [API Reference](#api-reference)

---

## Multi-Layer Visualization

### Layer Grouping
Layers are now organized into thematic groups for easier navigation:
- **Boundaries**: Suburbs, wards, subcouncils
- **Infrastructure**: Roads, buildings, railways
- **Environment**: Wetlands, flood zones, biodiversity
- **Transport**: MyCiti stops, rail stations
- **Services**: Clinics, schools, parks

### Custom Symbology
Use the **Style Editor** to customize layer appearance:
1. Click the paint palette icon next to any layer
2. Adjust fill color, stroke color, opacity, and weight
3. Choose from preset styles or create custom ones
4. Changes are saved to your session

### Legend
The dynamic legend automatically updates to show:
- Active layers with their symbology
- Classification breaks for graduated colors
- Custom symbols for point data

---

## Search & Geocoding

### Place Search
The enhanced search bar provides:
- **Autocomplete**: Type-ahead suggestions as you type
- **Multi-source**: Searches local datasets and OpenStreetMap
- **Category icons**: Visual indicators for result types
- **Recent searches**: Quick access to previous searches

### Reverse Geocoding
Click anywhere on the map to get location information:
- Suburb name
- Coordinates
- Nearby landmarks

### API Endpoints
```
GET /api/geocode/search?q=<query>&limit=10
GET /api/geocode/autocomplete?q=<prefix>&limit=8
GET /api/geocode/reverse?lat=<lat>&lon=<lon>
```

---

## Advanced Filtering

### Attribute Filtering
Filter any dataset by its attributes:
1. Open the **Filter Panel** from the sidebar
2. Select a dataset to see available fields
3. Add filter conditions:
   - **equals**: Exact match
   - **contains**: Text search
   - **greater than / less than**: Numeric comparison
   - **between**: Range filter
   - **is one of**: Multiple values
4. Combine with AND/OR logic

### Faceted Search
Quick filters show value counts for categorical fields:
- Click chips to toggle filter on/off
- Counts update as filters are applied

### API Endpoints
```
GET  /api/filter/schema/{dataset}
POST /api/filter/query
POST /api/filter/facets
GET  /api/filter/search/{dataset}?q=<text>
```

---

## Network Analysis

### Route Calculation
Calculate routes between two points:
1. Open **Network Analysis** panel
2. Click "Route" tab
3. Click on map to set origin (A) and destination (B)
4. Select transport mode (walk, cycle, drive, transit)
5. Click "Calculate Route"

Results show:
- Total distance
- Estimated travel time
- Route geometry on map
- Nearby transit stops (for transit mode)

### Isochrone Analysis
Visualize travel time contours:
1. Click "Isochrone" tab
2. Set center point on map
3. Adjust travel time (5-60 minutes)
4. Select transport mode
5. View reachable area polygons

### Nearest Facility
Find closest facilities:
1. Click "Nearest" tab
2. Set your location
3. Select facility type (clinics, schools, parks, etc.)
4. View ranked list with distances

### API Endpoints
```
GET /api/network/route?origin_lat=&origin_lon=&dest_lat=&dest_lon=&mode=
GET /api/network/isochrone?lat=&lon=&time_minutes=&mode=
GET /api/network/service-area?facility_type=&time_minutes=&mode=
GET /api/network/nearest?lat=&lon=&facility_type=&count=
GET /api/network/connectivity?lat=&lon=&radius_meters=
```

---

## Temporal Animation

### Time-Enabled Datasets
Some datasets include temporal information. Use the **Time Slider** to:
- Filter data by date range
- Animate changes over time
- View cumulative or snapshot modes

### Animation Controls
- **Play/Pause**: Automatic playback
- **Step Forward/Back**: Frame-by-frame navigation
- **Speed**: Adjust playback speed
- **Interval**: Choose hour/day/week/month

### API Endpoints
```
GET /api/temporal/datasets
GET /api/temporal/filter/{dataset}?start_date=&end_date=
GET /api/temporal/animation/{dataset}?start_date=&end_date=&interval=
GET /api/temporal/aggregate/{dataset}?interval=&stat=
```

---

## Analytics Dashboard

### Overview
Access the dashboard from the header toolbar to view:
- **Key Metrics**: Total datasets, features, geometry types
- **Bar Chart**: Feature counts by dataset
- **Pie Chart**: Geometry type distribution
- **Summary Statistics**: Aggregated data info

### Location Reports
Generate detailed analysis for any location:
1. Click on the map
2. Select "Generate Report" from popup
3. View accessibility scores, nearby facilities, recommendations

### Export Options
- **CSV**: Tabular data export
- **GeoJSON**: Spatial data with geometries
- **PDF**: Formatted reports (coming soon)

### API Endpoints
```
GET /api/reports/summary
GET /api/reports/dashboard-data
GET /api/reports/analysis-report?lat=&lon=&radius_meters=
GET /api/reports/export/{dataset}?format=csv|geojson
```

---

## Custom Symbology

### Style Presets
Quick-apply standard styles:
- **Default**: Blue with medium opacity
- **Highlight**: Orange for emphasis
- **Subtle**: Gray with low opacity
- **Warning**: Yellow for caution areas
- **Danger**: Red for risk zones
- **Success**: Green for positive indicators

### Custom Colors
- Pick from color palette
- Enter hex codes directly
- Adjust opacity (0-100%)

### Stroke Settings
- Weight: 0-10 pixels
- Color and opacity
- Preview changes in real-time

---

## API Reference

### Base URL
```
http://localhost:8000/api
```

### Authentication
Currently no authentication required (future: API keys)

### Rate Limiting
- 200 requests per day
- 50 requests per hour

### Common Query Parameters
| Parameter | Description |
|-----------|-------------|
| `simplify` | Geometry simplification tolerance (0.0001 default) |
| `limit` | Maximum results to return |
| `format` | Output format (geojson, csv) |

### Error Responses
```json
{
  "error": "ErrorType",
  "message": "Human-readable message",
  "details": {}
}
```

### New Endpoints Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/geocode/search` | GET | Search for places |
| `/geocode/autocomplete` | GET | Autocomplete suggestions |
| `/geocode/reverse` | GET | Reverse geocode |
| `/temporal/datasets` | GET | List temporal datasets |
| `/temporal/filter/{dataset}` | GET | Filter by time |
| `/temporal/animation/{dataset}` | GET | Get animation frames |
| `/network/route` | GET | Calculate route |
| `/network/isochrone` | GET | Calculate isochrone |
| `/network/nearest` | GET | Find nearest facilities |
| `/filter/schema/{dataset}` | GET | Get filter schema |
| `/filter/query` | POST | Apply filters |
| `/filter/facets` | POST | Get faceted counts |
| `/reports/summary` | GET | Summary report |
| `/reports/dashboard-data` | GET | Dashboard data |
| `/reports/analysis-report` | GET | Location analysis |
| `/reports/export/{dataset}` | GET | Export data |

---

## Getting Started

### Quick Demo

1. **Search**: Type "Table Mountain" in search bar
2. **Navigate**: Click result to zoom to location
3. **Analyze**: Open Network Analysis, set isochrone for 15-min walk
4. **Filter**: Open Filter Panel, filter suburbs by name
5. **Dashboard**: View analytics and export data

### Tips

- Use keyboard shortcuts: `Ctrl+K` for search
- Double-click for quick zoom
- Right-click for context menu
- Bookmark URL to save map state

---

## Troubleshooting

### Common Issues

**Search not returning results**
- Check internet connection for OSM search
- Local datasets may have limited coverage

**Slow performance on large datasets**
- Enable geometry simplification
- Use filters to reduce data volume
- Check browser memory usage

**Export failing**
- Reduce limit parameter
- Try different format
- Check network connectivity

### Support

For issues and feature requests, please open a GitHub issue.
