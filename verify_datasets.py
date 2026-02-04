
import sys
import os
import requests
import json
import logging
from typing import Dict, List, Any

# Add the project directory to sys.path to import portal_client
sys.path.append(os.getcwd())

from app.core.portal_client import portal_client, PORTAL_DATASETS, DatasetCategory

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def verify_dataset(dataset_id: str) -> Dict[str, Any]:
    dataset = PORTAL_DATASETS.get(dataset_id)
    if not dataset:
        return {"id": dataset_id, "status": "FAILED", "reason": "Not found in PORTAL_DATASETS"}
    
    logger.info(f"Verifying dataset: {dataset_id} ({dataset.name})")
    
    try:
        if dataset.format == "GeoJSON":
            response = requests.get(dataset.url, timeout=10)
            if response.status_code != 200:
                return {"id": dataset_id, "status": "FAILED", "reason": f"HTTP {response.status_code}"}
            
            data = response.json()
            if data.get("type") != "FeatureCollection":
                 return {"id": dataset_id, "status": "FAILED", "reason": "Not a FeatureCollection"}
            
            features = data.get("features", [])
            if not features:
                return {"id": dataset_id, "status": "WARNING", "reason": "No features found"}
            
            # Check CRS
            crs = data.get("crs", {})
            # Often GeoJSON doesn't have CRS and defaults to 4326. 
            # If it has, we should check it.
            
            # Check geometry
            geom = features[0].get("geometry")
            if not geom:
                return {"id": dataset_id, "status": "FAILED", "reason": "First feature has no geometry"}
            
            return {"id": dataset_id, "status": "SUCCESS", "feature_count": len(features)}

        elif dataset.format == "FeatureServer":
            query_url = f"{dataset.url}/query"
            params = {
                'where': '1=1',
                'outFields': '*',
                'f': 'geojson',
                'resultRecordCount': 1,
                'returnGeometry': 'true'
            }
            response = requests.get(query_url, params=params, timeout=10)
            if response.status_code != 200:
                 return {"id": dataset_id, "status": "FAILED", "reason": f"HTTP {response.status_code}"}
            
            data = response.json()
            if data.get("type") != "FeatureCollection":
                 return {"id": dataset_id, "status": "FAILED", "reason": f"Not a FeatureCollection: {data.get('error', {}).get('message', 'Unknown error')}"}
            
            features = data.get("features", [])
            if not features:
                 return {"id": dataset_id, "status": "WARNING", "reason": "No features found"}
            
            return {"id": dataset_id, "status": "SUCCESS", "feature_count": "sample only"}

        elif dataset.format == "MapServer":
            # MapServer might not support GeoJSON query directly on the layer if it's not a FeatureServer
            # but we can check if the service is up
            response = requests.get(f"{dataset.url}?f=json", timeout=10)
            if response.status_code != 200:
                return {"id": dataset_id, "status": "FAILED", "reason": f"HTTP {response.status_code}"}
            
            return {"id": dataset_id, "status": "SUCCESS", "reason": "Service metadata accessible"}
            
        else:
            return {"id": dataset_id, "status": "FAILED", "reason": f"Unsupported format {dataset.format}"}

    except Exception as e:
        return {"id": dataset_id, "status": "FAILED", "reason": str(e)}

def main():
    results = []
    for dataset_id in PORTAL_DATASETS:
        result = verify_dataset(dataset_id)
        results.append(result)
        logger.info(f"Result for {dataset_id}: {result['status']} - {result.get('reason', '')}")

    # Summary
    success = len([r for r in results if r['status'] == 'SUCCESS'])
    warning = len([r for r in results if r['status'] == 'WARNING'])
    failed = len([r for r in results if r['status'] == 'FAILED'])

    print("\n--- Verification Summary ---")
    print(f"Total: {len(results)}")
    print(f"Success: {success}")
    print(f"Warning: {warning}")
    print(f"Failed: {failed}")

    if failed > 0:
        print("\n--- Failed Datasets ---")
        for r in results:
            if r['status'] == 'FAILED':
                print(f"{r['id']}: {r['reason']}")
        sys.exit(1)
    else:
        print("\nAll datasets verified successfully!")
        sys.exit(0)

if __name__ == "__main__":
    main()
