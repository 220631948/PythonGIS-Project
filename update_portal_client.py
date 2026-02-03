import re

path = 'cape_town_geohub/app/core/portal_client.py'

with open(path, 'r') as f:
    content = f.read()

# Replace EGIS_FEATURE_SERVICE with EGIS_MAP_SERVICE
content = content.replace('EGIS_FEATURE_SERVICE', 'EGIS_MAP_SERVICE')

# Update dataset IDs and metadata
replacements = {
    '"suburbs"': ('"Official Suburb"', 75, 'Polygon'),
    '"wards"': ('"Ward"', 78, 'Polygon'),
    '"subcouncils"': ('"Sub Council"', 77, 'Polygon'),
    '"railway_lines"': ('"Railway Lines"', 233, 'Line'),
    '"railway_stations"': ('"Rail Station"', 235, 'Point'),
    '"wetlands"': ('"Wetlands"', 70, 'Polygon'),
    '"biodiversity_network"': ('"Biodiversity Network"', 133, 'Polygon'),
    '"flood_zones"': ('"Stormwater Waterbodies"', 71, 'Polygon'),
    '"zoning"': ('"Zoning"', 58, 'Polygon'),
    '"myciiti_routes"': ('"MyCiTi Bus Routes"', 95, 'Line'),
    '"myciiti_stops"': ('"MyCiTi Bus Stops"', 96, 'Point'),
    '"taxi_ranks"': ('"Taxi Routes"', 97, 'Point'),
    '"health_facilities"': ('"Health Care Facilities"', 44, 'Point'),
    '"schools"': ('"Schools"', 26, 'Point'),
    '"libraries"': ('"Libraries"', 22, 'Point'),
    '"police_stations"': ('"Police Stations"', 82, 'Point'),
    '"fire_stations"': ('"Fire Stations"', 81, 'Point'),
    '"waste_collection_zones"': ('"Refuse Collection Beats"', 136, 'Polygon'),
    '"recycling_facilities"': ('"Think Twice Areas - Recycling"', 101, 'Polygon'),
    '"water_points"': ('"Smart Facilities Water"', 178, 'Point'),
}

for ds_id, (new_name, new_layer_id, geom_type) in replacements.items():
    # Update URL
    pattern = rf'({ds_id}: PortalDataset\(.*?\n\s*url=)f"{{EGIS_MAP_SERVICE}}/\d+/query\?where=1%3D1&outFields=\*&f=geojson"'
    replacement = rf'\1f"{{EGIS_MAP_SERVICE}}/{new_layer_id}/query?where=1%3D1&outFields=*&f=geojson"'
    content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    
    # Update Name
    pattern = rf'({ds_id}: PortalDataset\(.*?\n\s*name=")[^"]+'
    replacement = rf'\1{new_name}'
    content = re.sub(pattern, replacement, content, flags=re.DOTALL)

# Change format to MapServer since it's MapServer now
content = content.replace('format="FeatureServer"', 'format="MapServer"')

with open(path, 'w') as f:
    f.write(content)

print("Update complete")
