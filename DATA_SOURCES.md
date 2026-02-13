# Data Attribution Table 📊

The Cape Town GeoHub relies on the following datasets from the **City of Cape Town Open Data Portal**. We acknowledge the City of Cape Town for making this data publicly available under the Open Data License.

## Core Datasets

| Category | Dataset Name | Source URL (ArcGIS MapServer) | Usage |
| :--- | :--- | :--- | :--- |
| **Services** | Informal Settlements | [Layer 75](https://citymaps.capetown.gov.za/agsext/rest/services/Theme_Based/Open_Data_Service/MapServer/75) | Demographics analysis |
| **Services** | Water Facilities | [Layer 178](https://citymaps.capetown.gov.za/agsext/rest/services/Theme_Based/Open_Data_Service/MapServer/178) | Utilities access evaluation |
| **Services** | Energy Facilities | [Layer 176](https://citymaps.capetown.gov.za/agsext/rest/services/Theme_Based/Open_Data_Service/MapServer/176) | Utilities access evaluation |
| **Transport** | MyCiTi Bus Routes | [Layer 95](https://citymaps.capetown.gov.za/agsext/rest/services/Theme_Based/Open_Data_Service/MapServer/95) | Transit analysis |
| **Transport** | MyCiTi Bus Stops | [Layer 96](https://citymaps.capetown.gov.za/agsext/rest/services/Theme_Based/Open_Data_Service/MapServer/96) | Site suitability - transit access |
| **Transport** | Rail Stations | [Layer 235](https://citymaps.capetown.gov.za/agsext/rest/services/Theme_Based/Open_Data_Service/MapServer/235) | Site suitability - transit access |
| **Administrative** | Suburb Boundaries | [Layer 75](https://citymaps.capetown.gov.za/agsext/rest/services/Theme_Based/Open_Data_Service/MapServer/75) | Urban edge evaluation |
| **Environment** | Stormwater Waterbodies | [Layer 71](https://citymaps.capetown.gov.za/agsext/rest/services/Theme_Based/Open_Data_Service/MapServer/71) | Site suitability - flood risk |
| **Land Use** | Zoning Boundaries | [Layer 58](https://citymaps.capetown.gov.za/agsext/rest/services/Theme_Based/Open_Data_Service/MapServer/58) | Site suitability - zoning compliance |
| **Utilities** | Refuse Beats | [Layer 136](https://citymaps.capetown.gov.za/agsext/rest/services/Theme_Based/Open_Data_Service/MapServer/136) | Service coverage analysis |
| **Utilities** | Recycling Areas | [Layer 101](https://citymaps.capetown.gov.za/agsext/rest/services/Theme_Based/Open_Data_Service/MapServer/101) | Waste management analysis |
| **Infrastructure** | Building Footprints | [Layer 86](https://citymaps.capetown.gov.za/agsext/rest/services/Theme_Based/Open_Data_Service/MapServer/86) | Density analysis |

## Site Suitability Analysis Datasets

The following datasets are required for comprehensive site suitability evaluation (Finding F003 implementation):

| PostGIS Table | Source Dataset | Purpose | Query Type |
| :--- | :--- | :--- | :--- |
| `flood_zones` | Stormwater Waterbodies (Layer 71) | Flood risk assessment | ST_Intersects |
| `biodiversity_areas` | Critical Biodiversity Areas / Biodiversity Network | Environmental constraints | ST_Intersects |
| `wetlands` | Wetlands / Water bodies | Wetland buffer compliance (32m NEMA) | ST_Distance / ST_DWithin |
| `zoning_areas` | Zoning Scheme (Layer 58) | Development compatibility | ST_Intersects |
| `roads` | Road Network | Road access evaluation | ST_Distance |
| `transport_stops` | MyCiTi Stops (Layer 96) + Rail Stations (Layer 235) | Public transport access | ST_Distance |
| `service_facilities` | Water Facilities (Layer 178) + Energy (Layer 176) | Utilities infrastructure | ST_Distance |
| `suburbs` | Suburb Boundaries | Urban edge compliance | ST_Intersects / ST_Distance |

### Data Loading Requirements

All spatial data must be:
- Stored in PostGIS tables with SRID 4326 (WGS 84)
- Indexed with GIST spatial indexes for performance
- Distance calculations performed in EPSG 32734 (UTM 34S) for metric accuracy
- Transformed back to EPSG 4326 for API responses

### CRS Standards

- **Input/Output**: EPSG:4326 (WGS 84) - Geographic coordinates
- **Analysis**: EPSG:32734 (UTM Zone 34S) - Projected coordinates for metric calculations
- **Coverage**: Cape Town metropolitan area optimized

### Performance Requirements

- Spatial queries complete in <500ms per criterion
- Spatial indexes (GIST) on all geometry columns
- Connection pooling for concurrent requests

## Terms of Use
Data is provided "as is" and the project team does not guarantee the completeness or accuracy of the datasets. Use is subject to the [City of Cape Town Open Data License](https://open.capetown.gov.za/licensing).
