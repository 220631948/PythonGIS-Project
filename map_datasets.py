import json
import re

datasets = [
    "official suburb", "ward", "sub council", "tct road centreline", "2d building footprints",
    "railway lines", "rail station", "wetlands", "biodiversity network", "zoning",
    "urban development edge", "myciti bus routes", "myciti bus stops", "taxi routes",
    "health care facilities", "schools", "libraries", "police stations", "fire stations",
    "refuse collection beats", "think twice areas - recycling", "informal settlements",
    "flood", "water", "electricity", "drop offs", "compost plant", "solid waste depots",
    "parks", "cemeteries", "informal trading", "planning offices", "street name", "land parcels",
    "environmental resource management", "dunes", "coastal urban edge", "indigenous vegetation",
    "soils", "stormwater waterbodies", "city admin district", "special rating areas",
    "emergency services", "murp areas", "koeberg restricted area", "urban development zones",
    "scenic routes", "pt1 zones", "pt2 zones"
]

def find_layers():
    with open('all_layers.json', 'r') as f:
        content = f.read()
    
    # The file is a sequence of JSON objects, not an array.
    # We can split by }{ and fix them, or just use regex.
    matches = re.findall(r'\{\s*"id":\s*(\d+),\s*"name":\s*"([^"]+)"\s*\}', content)
    
    found = {}
    for layer_id, layer_name in matches:
        layer_id = int(layer_id)
        for ds in datasets:
            if ds.lower() in layer_name.lower():
                if ds not in found:
                    found[ds] = []
                found[ds].append({"id": layer_id, "name": layer_name})
    
    for ds in datasets:
        print(f"Dataset: {ds}")
        if ds in found:
            for m in found[ds]:
                print(f"  - ID: {m['id']}, Name: {m['name']}")
        else:
            print("  - NOT FOUND")

if __name__ == "__main__":
    find_layers()
