#!/usr/bin/env python3
"""
Cape Town GeoHub Data Source Verification Script

This script verifies that all data sources are accessible and contain real data.
"""

import requests
import json
import sys
from datetime import datetime

# Data sources from portal_client.py
DATA_SOURCES = {
    "suburbs": "https://odp-cctegis.opendata.arcgis.com/datasets/cct::official-suburbs.geojson",
    "wards": "https://odp-cctegis.opendata.arcgis.com/datasets/cct::wards.geojson",
    "city_boundary": "https://services.arcgis.com/zmLUiqh7X11gGV2d/arcgis/rest/services/City_Boundary/FeatureServer/0/query?where=1%3D1&outFields=*&f=geojson",
    "roads": "https://citymaps.capetown.gov.za/agsext1/rest/services/Infrastructure/Roads/MapServer/0/query?where=1%3D1&outFields=*&f=geojson",
    "buildings": "https://citymaps.capetown.gov.za/agsext1/rest/services/Infrastructure/Buildings/MapServer/0/query?where=1%3D1&outFields=*&f=geojson",
    "wetlands": "https://odp-cctegis.opendata.arcgis.com/datasets/cct::wetlands.geojson",
    "flood_zones": "https://odp-cctegis.opendata.arcgis.com/datasets/cct::flood-zones.geojson",
    "zoning": "https://odp-cctegis.opendata.arcgis.com/datasets/cct::zoning-scheme.geojson",
    "myciiti_stops": "https://odp-cctegis.opendata.arcgis.com/datasets/cct::myciiti-bus-stops.geojson",
    "health_facilities": "https://odp-cctegis.opendata.arcgis.com/datasets/cct::health-facilities.geojson",
    "schools": "https://odp-cctegis.opendata.arcgis.com/datasets/cct::schools.geojson",
    "police_stations": "https://odp-cctegis.opendata.arcgis.com/datasets/cct::police-stations.geojson"
}

def test_data_source(name, url):
    """Test a single data source"""
    print(f"\n🔍 Testing {name}...")
    print(f"   URL: {url}")

    try:
        response = requests.get(url, timeout=30)
        print(f"   Status: {response.status_code}")

        if response.status_code == 200:
            try:
                data = response.json()
                if "type" in data and data["type"] == "FeatureCollection":
                    features = data.get("features", [])
                    print(f"   ✅ Valid GeoJSON: {len(features)} features")

                    if len(features) > 0:
                        # Check coordinate bounds for Cape Town
                        coords = []
                        for feature in features[:5]:  # Check first 5 features
                            geom = feature.get("geometry", {})
                            if geom.get("type") == "Point":
                                coords.extend(geom.get("coordinates", []))
                            elif geom.get("type") in ["Polygon", "MultiPolygon"]:
                                # Extract coordinates from polygons
                                coords_list = geom.get("coordinates", [])
                                if coords_list:
                                    flat_coords = [coord for sublist in coords_list for subsublist in sublist for coord in subsublist] if geom.get("type") == "MultiPolygon" else [coord for sublist in coords_list for coord in sublist]
                                    coords.extend(flat_coords[:10])  # Sample

                        if coords:
                            lons = [c[0] for c in coords if len(c) >= 2]
                            lats = [c[1] for c in coords if len(c) >= 2]
                            if lons and lats:
                                print(".3f")
                                # Check if coordinates are in Cape Town area
                                cape_town_bounds = {
                                    'lon_min': 18.0, 'lon_max': 19.5,
                                    'lat_min': -34.5, 'lat_max': -33.5
                                }
                                in_bounds = all(
                                    cape_town_bounds['lon_min'] <= lon <= cape_town_bounds['lon_max'] and
                                    cape_town_bounds['lat_min'] <= lat <= cape_town_bounds['lat_max']
                                    for lon, lat in zip(lons, lats)
                                )
                                if in_bounds:
                                    print("   ✅ Coordinates appear to be in Cape Town area")
                                else:
                                    print("   ⚠️  Coordinates may not be in Cape Town area")

                    return {"status": "success", "features": len(features)}
                else:
                    print(f"   ❌ Invalid GeoJSON structure: {data.get('type', 'unknown')}")
                    return {"status": "error", "message": "Invalid GeoJSON"}

            except json.JSONDecodeError as e:
                print(f"   ❌ Invalid JSON: {e}")
                return {"status": "error", "message": "Invalid JSON"}
        else:
            print(f"   ❌ HTTP Error: {response.status_code}")
            return {"status": "error", "message": f"HTTP {response.status_code}"}

    except requests.exceptions.Timeout:
        print("   ❌ Timeout (30s)")
        return {"status": "error", "message": "Timeout"}
    except requests.exceptions.RequestException as e:
        print(f"   ❌ Request error: {e}")
        return {"status": "error", "message": str(e)}

def main():
    """Main verification function"""
    print("🗺️  Cape Town GeoHub Data Source Verification")
    print("=" * 50)
    print(f"Testing {len(DATA_SOURCES)} data sources...")
    print(f"Timestamp: {datetime.now().isoformat()}")

    results = {}
    successful = 0
    total_features = 0

    for name, url in DATA_SOURCES.items():
        result = test_data_source(name, url)
        results[name] = result

        if result["status"] == "success":
            successful += 1
            total_features += result.get("features", 0)

    print("\n" + "=" * 50)
    print("📊 VERIFICATION SUMMARY")
    print("=" * 50)
    print(f"Data sources tested: {len(DATA_SOURCES)}")
    print(f"Accessible sources: {successful}")
    print(f"Failed sources: {len(DATA_SOURCES) - successful}")
    print(f"Total features across all sources: {total_features}")

    if successful == len(DATA_SOURCES):
        print("\n🎉 ALL DATA SOURCES ARE ACCESSIBLE!")
        print("✅ Real open data verification: PASSED")
        return 0
    else:
        print(f"\n⚠️  {len(DATA_SOURCES) - successful} DATA SOURCES FAILED!")
        print("❌ Real open data verification: FAILED")

        print("\nFailed sources:")
        for name, result in results.items():
            if result["status"] != "success":
                print(f"  - {name}: {result.get('message', 'Unknown error')}")

        return 1

if __name__ == "__main__":
    sys.exit(main())
