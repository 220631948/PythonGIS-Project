#!/usr/bin/env python3
"""
Simple script to test open data source accessibility
"""

import requests
import json
from datetime import datetime

# Test a few key data sources from the portal_client
test_urls = {
    "suburbs": "https://odp-cctegis.opendata.arcgis.com/datasets/cct::official-suburbs.geojson",
    "city_boundary": "https://services.arcgis.com/zmLUiqh7X11gGV2d/arcgis/rest/services/City_Boundary/FeatureServer/0/query?where=1%3D1&outFields=*&f=geojson",
    "flood_zones": "https://odp-cctegis.opendata.arcgis.com/datasets/cct::flood-zones.geojson"
}

def test_data_source(name, url):
    print(f"Testing {name}...")
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            try:
                data = response.json()
                if "type" in data and data["type"] == "FeatureCollection":
                    features = data.get("features", [])
                    print(f"  ✅ {name}: {len(features)} features")
                    return True
                else:
                    print(f"  ❌ {name}: Invalid GeoJSON structure")
                    return False
            except json.JSONDecodeError:
                print(f"  ❌ {name}: Invalid JSON response")
                return False
        else:
            print(f"  ❌ {name}: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"  ❌ {name}: Error - {e}")
        return False

if __name__ == "__main__":
    print("Testing Cape Town Open Data Sources")
    print("=" * 40)

    results = {}
    for name, url in test_urls.items():
        results[name] = test_data_source(name, url)

    print("\nSummary:")
    working = sum(results.values())
    total = len(results)
    print(f"{working}/{total} data sources accessible")

    if working == total:
        print("🎉 All tested data sources are working!")
    else:
        print("⚠️  Some data sources may have issues.")
