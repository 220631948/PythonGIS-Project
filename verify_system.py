import sys
import subprocess
import requests
from pathlib import Path

def run_command(cmd, cwd=None):
    """Run a command and return output"""
    try:
        result = subprocess.run(cmd, shell=True, cwd=cwd, capture_output=True, text=True, timeout=30)
        return result.returncode, result.stdout, result.stderr
    except subprocess.TimeoutExpired:
        return -1, "", "Command timed out"
    except Exception as e:
        return -1, "", str(e)

def check_backend_dependencies():
    """Check if backend dependencies can be installed"""
    print("🔧 Checking backend dependencies...")

    # Check Python version
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 11):
        return False, f"Python {version.major}.{version.minor} detected, need 3.11+"

    # Try importing core dependencies
    core_deps = ['fastapi', 'uvicorn', 'pydantic', 'requests']
    missing = []
    for dep in core_deps:
        try:
            __import__(dep)
        except ImportError:
            missing.append(dep)

    if missing:
        return False, f"Missing core dependencies: {', '.join(missing)}"

    # GIS dependencies (these are problematic)
    gis_deps = ['geopandas', 'shapely', 'pyproj', 'pandas']
    gis_missing = []
    for dep in gis_deps:
        try:
            __import__(dep)
        except ImportError:
            gis_missing.append(dep)

    if gis_missing:
        return False, f"Missing GIS dependencies (may cause issues): {', '.join(gis_missing)}"

    return True, "Core dependencies available"

def check_frontend_dependencies():
    """Check frontend dependencies"""
    print("🎨 Checking frontend dependencies...")

    frontend_dir = Path(__file__).parent / "frontend"
    if not frontend_dir.exists():
        return False, "Frontend directory not found"

    package_json = frontend_dir / "package.json"
    if not package_json.exists():
        return False, "package.json not found"

    # Check if node_modules exists
    node_modules = frontend_dir / "node_modules"
    if not node_modules.exists():
        return False, "node_modules not found - run 'npm install' in frontend directory"

    return True, "Frontend dependencies appear to be installed"

def test_data_sources():
    """Test data source accessibility"""
    print("📊 Testing data source accessibility...")

    # Test a few key sources
    test_sources = {
        "suburbs": "https://odp-cctegis.opendata.arcgis.com/datasets/cct::official-suburbs.geojson",
        "schools": "https://odp-cctegis.opendata.arcgis.com/datasets/cct::schools.geojson"
    }

    results = {}
    for name, url in test_sources.items():
        try:
            response = requests.get(url, timeout=10)
            results[name] = {
                "accessible": response.status_code == 200,
                "status_code": response.status_code
            }
        except Exception:
            results[name] = {"accessible": False, "error": "Connection failed"}

    accessible = sum(1 for r in results.values() if r["accessible"])
    return accessible == len(test_sources), f"{accessible}/{len(test_sources)} sources accessible"

def check_api_endpoints():
    """Check if API endpoints are properly defined"""
    print("🔗 Checking API endpoint definitions...")

    # Check if main API files exist
    api_dir = Path(__file__).parent / "app" / "api"
    required_apis = [
        "portal_api.py", "suitability_api.py", "services_api.py",
        "transport_api.py", "environment_api.py", "land_use_api.py"
    ]

    missing = []
    for api_file in required_apis:
        if not (api_dir / api_file).exists():
            missing.append(api_file)

    if missing:
        return False, f"Missing API files: {', '.join(missing)}"

    return True, f"All {len(required_apis)} API files present"

def check_database_setup():
    """Check database configuration"""
    print("🗄️  Checking database setup...")

    # Check if docker-compose includes database
    compose_file = Path(__file__).parent / "compose.yaml"
    if not compose_file.exists():
        return False, "compose.yaml not found"

    with open(compose_file) as f:
        compose_content = f.read()

    if "postgis" not in compose_content.lower():
        return False, "PostGIS database not configured in compose.yaml"

    return True, "Database configuration appears correct"

def main():
    """Run comprehensive system verification"""
    print("🔍 Cape Town GeoHub System Verification")
    print("=" * 50)

    checks = [
        ("Backend Dependencies", check_backend_dependencies),
        ("Frontend Dependencies", check_frontend_dependencies),
        ("Data Sources", test_data_sources),
        ("API Endpoints", check_api_endpoints),
        ("Database Setup", check_database_setup)
    ]

    results = []
    for name, check_func in checks:
        print(f"\n📋 {name}:")
        try:
            success, message = check_func()
            status = "✅ PASS" if success else "❌ FAIL"
            print(f"   {status}: {message}")
            results.append((name, success, message))
        except Exception as e:
            print(f"   ❌ ERROR: {e}")
            results.append((name, False, str(e)))

    # Summary
    print("\n" + "=" * 50)
    print("📊 VERIFICATION SUMMARY")
    print("=" * 50)

    passed = sum(1 for _, success, _ in results if success)
    total = len(results)

    for name, success, message in results:
        status = "✅" if success else "❌"
        print(f"{status} {name}: {message}")

    print(f"\nOverall: {passed}/{total} checks passed")

    if passed == total:
        print("🎉 SYSTEM VERIFICATION: PASSED")
        return 0
    else:
        print("⚠️  SYSTEM VERIFICATION: ISSUES FOUND")
        return 1

if __name__ == "__main__":
    sys.exit(main())
