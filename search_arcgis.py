import requests
import json

base_url = "https://citymaps.capetown.gov.za/agsext/rest/services/Theme_Based"

def get_folders():
    try:
        r = requests.get("https://citymaps.capetown.gov.za/agsext/rest/services?f=json", verify=False)
        return r.json().get('folders', []) + [""]
    except:
        return [""]

def get_services():
    folders = get_folders()
    all_services = []
    for folder in folders:
        url = f"https://citymaps.capetown.gov.za/agsext/rest/services/{folder}" if folder else "https://citymaps.capetown.gov.za/agsext/rest/services"
        try:
            r = requests.get(f"{url}?f=json", verify=False)
            all_services.extend([s['name'] for s in r.json()['services'] if s['type'] == 'MapServer'])
        except:
            pass
    return all_services

def search_layers(keyword):
    services = get_services()
    results = []
    for service in services:
        print(f"Searching in {service}...")
        try:
            r = requests.get(f"https://citymaps.capetown.gov.za/agsext/rest/services/{service}/MapServer?f=json", verify=False)
            layers = r.json().get('layers', [])
            for layer in layers:
                if keyword.lower() in layer['name'].lower():
                    results.append({
                        "service": service,
                        "id": layer['id'],
                        "name": layer['name']
                    })
        except:
            pass
    return results

if __name__ == "__main__":
    import sys
    keyword = sys.argv[1] if len(sys.argv) > 1 else "Flood"
    found = search_layers(keyword)
    print(f"\nFound {len(found)} layers matching '{keyword}':")
    for f in found:
        print(f"  - Service: {f['service']}, ID: {f['id']}, Name: {f['name']}")
