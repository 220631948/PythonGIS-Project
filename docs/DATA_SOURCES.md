# Data Sources - Cape Town GeoHub

This document provides comprehensive information about all open data sources used in the Cape Town GeoHub application.

## Data Policy

**The Cape Town GeoHub uses ONLY real, verified open data from official government sources.**

- ✅ All data is sourced from official City of Cape Town and South African government portals
- ✅ No mock, test, or synthetic data is used in production
- ✅ All sources are publicly accessible and freely available
- ✅ Proper attribution is maintained for all datasets

## Primary Data Sources

### City of Cape Town Open Data Portal
- **URL**: https://odp.capetown.gov.za/
- **License**: City of Cape Town Open Data License
- **Attribution**: "Data provided by City of Cape Town Open Data Portal"

### City of Cape Town eGIS Portal
- **URL**: https://egis.capetown.gov.za/
- **License**: City of Cape Town Open Data License
- **Services**: ArcGIS REST API / FeatureServer

## Dataset Inventory

| Dataset | Source | Category | Geometry Type | Update Frequency | License |
|---------|--------|----------|---------------|------------------|---------|
| Official Suburbs | CCT Open Data | Boundaries | MultiPolygon | Occasional | CCT Open Data |
| Informal Settlements | CCT Open Data | Services | Polygon | Annual | CCT Open Data |
| Water & Sanitation Facilities | CCT Open Data | Services | Point | Ongoing | CCT Open Data |
| Electricity Facilities | CCT Open Data | Services | Point | Ongoing | CCT Open Data |
| MyCiTi Bus Stops | CCT Open Data | Transport | Point | Monthly | CCT Open Data |
| MyCiTi Bus Routes | CCT Open Data | Transport | LineString | Monthly | CCT Open Data |
| Railway Stations | CCT Open Data | Transport | Point | Occasional | CCT Open Data |
| Flood Zones | CCT Open Data | Environment | Polygon | Occasional | CCT Open Data |
| Zoning Data | CCT Open Data | Land Use | Polygon | Ongoing | CCT Open Data |
| Waste Collection Areas | CCT Open Data | Utilities | Polygon | Annual | CCT Open Data |
| Recycling Facilities | CCT Open Data | Utilities | Point | Ongoing | CCT Open Data |
| Clinics | CCT Open Data | Services | Point | Ongoing | CCT Open Data |
| Schools | CCT Open Data | Services | Point | Ongoing | CCT Open Data |
| Parks | CCT eGIS | Recreation | Polygon | Occasional | CCT Open Data |
| Sports Grounds | CCT eGIS | Recreation | Polygon | Occasional | CCT Open Data |
| Swimming Pools | CCT eGIS | Recreation | Point | Occasional | CCT Open Data |
| Open Spaces | CCT eGIS | Environment | Polygon | Occasional | CCT Open Data |
| Building Footprints | CCT eGIS | Infrastructure | Polygon | Ongoing | CCT Open Data |

## Real-Time Data Sources

| Feed | Source | Update Interval | Status |
|------|--------|-----------------|--------|
| Traffic Status | CCT Traffic Management | 5 minutes | Active |
| Weather Alerts | SA Weather Service | 15 minutes | Pending API Registration |
| Service Disruptions | CCT Service Alerts | 5 minutes | Partial |
| Public Transport | MyCiTi / PRASA | 3 minutes | Active |
| Air Quality | SAAQIS | 30 minutes | Pending API Registration |

## Licensing and Attribution

### City of Cape Town Open Data License
The City of Cape Town provides open data under a permissive license that allows:
- Use for any purpose (commercial and non-commercial)
- Redistribution
- Modification

**Attribution Required**: When using CCT data, attribution to the City of Cape Town is required.

**Terms of Use**: https://odp.capetown.gov.za/pages/terms-of-use

### Other Government Sources
- **SAPS Crime Statistics**: https://www.saps.gov.za/services/crimestats.php
- **SA Weather Service**: https://www.weathersa.co.za/
- **SAAQIS (Air Quality)**: https://saaqis.environment.gov.za/

## Data Quality Assurance

The application implements automated data validation:

1. **Geometry Validation**: All geometries are checked for validity
2. **CRS Verification**: Coordinate reference systems are verified and transformed to WGS84
3. **Completeness Checks**: Required fields are validated
4. **Freshness Monitoring**: Data retrieval timestamps are logged

## API Endpoints for Data Status

Monitor data source health via the API:

```
GET /api/data-status/health          # Check all sources
GET /api/data-status/health/{name}   # Check specific source
GET /api/data-status/sources         # List all sources with metadata
GET /api/data-status/provenance/{name}  # Get detailed provenance
GET /api/data-status/validate/{name}    # Validate dataset quality
GET /api/data-status/retrieval-log      # View fetch attempt logs
```

## Reporting Issues

If you notice issues with data sources:
1. Check the `/api/data-status/health` endpoint for current status
2. Report issues via the project's issue tracker
3. For upstream data issues, contact City of Cape Town Open Data team

## Last Updated

This documentation was last updated: January 2026
