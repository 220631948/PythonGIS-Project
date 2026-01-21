#!/usr/bin/env python3
"""
Test script for Cape Town GeoHub API endpoints

This script tests the main API endpoints to ensure they are working correctly.
"""

import requests
import json
import time
import sys

BASE_URL = "http://127.0.0.1:8000"

def test_health_endpoint():
    """Test the health endpoint"""
    print("Testing health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/api/health")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check passed - Version: {data.get('version', 'unknown')}")
            return True
        else:
            print(f"❌ Health check failed - Status: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

def test_portal_categories():
    """Test portal categories endpoint"""
    print("Testing portal categories...")
    try:
        response = requests.get(f"{BASE_URL}/api/portal/categories")
        if response.status_code == 200:
            categories = response.json()
            print(f"✅ Portal categories: {len(categories)} categories found")
            for cat in categories[:3]:  # Show first 3
                print(f"   - {cat['displayName']}: {cat['count']} datasets")
            return True
        else:
            print(f"❌ Portal categories failed - Status: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Portal categories error: {e}")
        return False

def test_portal_datasets():
    """Test portal datasets endpoint"""
    print("Testing portal datasets...")
    try:
        response = requests.get(f"{BASE_URL}/api/portal/datasets")
        if response.status_code == 200:
            data = response.json()
            datasets = data.get('datasets', [])
            print(f"✅ Portal datasets: {len(datasets)} datasets available")
            return True
        else:
            print(f"❌ Portal datasets failed - Status: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Portal datasets error: {e}")
        return False

def test_suitability_criteria():
    """Test suitability criteria endpoint"""
    print("Testing suitability criteria...")
    try:
        response = requests.get(f"{BASE_URL}/api/suitability/criteria")
        if response.status_code == 200:
            data = response.json()
            criteria = data.get('criteria', [])
            print(f"✅ Suitability criteria: {len(criteria)} criteria available")
            return True
        else:
            print(f"❌ Suitability criteria failed - Status: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Suitability criteria error: {e}")
        return False

def test_suitability_analysis():
    """Test suitability analysis endpoint"""
    print("Testing suitability analysis...")
    try:
        # Test with Cape Town coordinates
        params = {
            'lat': -33.9249,
            'lng': 18.4241,
            'development_type': 'residential'
        }
        response = requests.get(f"{BASE_URL}/api/suitability/analyze", params=params)
        if response.status_code == 200:
            data = response.json()
            score = data.get('overall_score', 0)
            suitability_class = data.get('suitability_class', 'unknown')
            print(f"✅ Suitability analysis: Score {score:.1f}, Class: {suitability_class}")
            return True
        else:
            print(f"❌ Suitability analysis failed - Status: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Suitability analysis error: {e}")
        return False

def test_services_access():
    """Test services access endpoint"""
    print("Testing services access...")
    try:
        response = requests.get(f"{BASE_URL}/api/services/access")
        if response.status_code == 200:
            data = response.json()
            features = data.get('features', [])
            print(f"✅ Services access: {len(features)} settlement areas analyzed")
            return True
        else:
            print(f"❌ Services access failed - Status: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Services access error: {e}")
        return False

def test_config_endpoint():
    """Test config endpoint"""
    print("Testing config endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/api/config")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Config: App {data.get('app_name', 'unknown')} v{data.get('version', 'unknown')}")
            return True
        else:
            print(f"❌ Config failed - Status: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Config error: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 Cape Town GeoHub API Test Suite")
    print("=" * 40)

    # Wait for server to start
    print("Waiting for server to start...")
    time.sleep(3)

    tests = [
        test_health_endpoint,
        test_config_endpoint,
        test_portal_categories,
        test_portal_datasets,
        test_suitability_criteria,
        test_suitability_analysis,
        test_services_access,
    ]

    passed = 0
    total = len(tests)

    for test in tests:
        if test():
            passed += 1
        print()

    print("=" * 40)
    print(f"Test Results: {passed}/{total} tests passed")

    if passed == total:
        print("🎉 All tests passed! The API is working correctly.")
        return 0
    else:
        print("⚠️  Some tests failed. Check the server logs for details.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
